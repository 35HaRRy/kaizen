import { ObjectId, type Db } from "mongodb";
import type { Express } from "express";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fileTypeFromBuffer } from "file-type";
import { HttpError, text } from "./errors.js";
import { objectId } from "./events.js";
import type { MediaItem } from "../../shared/events.js";
import { publicMedia } from "./media-url.js";
export interface ObjectStorage {
  publicOrigin: string;
  sign(
    key: string,
    mime: string,
    size: number,
  ): Promise<{ url: string; headers: Record<string, string> }>;
  inspect(
    key: string,
  ): Promise<{ size: number; etag: string; bytes: Uint8Array }>;
  freeze(
    source: string,
    key: string,
    etag: string,
    mime: string,
  ): Promise<void>;
  remove(key: string): Promise<void>;
}
const allowed = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
];
export function validateUpload(body: any) {
  const name = text(body?.name, 200),
    mime = body?.mime,
    size = body?.size;
  if (
    !allowed.includes(mime) ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > (mime.startsWith("image/") ? 10_000_000 : 100_000_000)
  )
    throw new HttpError(
      400,
      "UPLOAD",
      "Dosya türü veya boyutu uygun değil. Resim: 10 MB, video: 100 MB.",
    );
  return { name, mime: mime as string, size: size as number };
}
export function createStorage(env = process.env): ObjectStorage {
  const required = (name: string) => {
    const value = env[name];
    if (!value)
      throw new HttpError(503, "STORAGE", "Medya servisi yapılandırılmamış.");
    return value;
  };
  const bucket = required("R2_BUCKET"),
    publicOrigin = new URL(required("R2_PUBLIC_ORIGIN")).origin;
  if (!publicOrigin.startsWith("https://"))
    throw new Error("R2_PUBLIC_ORIGIN must use HTTPS");
  const client = new S3Client({
    region: "auto",
    endpoint: required("R2_ENDPOINT"),
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return {
    publicOrigin,
    async sign(key, mime, size) {
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: mime,
          ContentLength: size,
        }),
        {
          expiresIn: 300,
          signableHeaders: new Set(["content-type", "content-length"]),
        },
      );
      return { url, headers: { "Content-Type": mime } };
    },
    async inspect(key) {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      if (!head.ETag) throw new Error("No ETag");
      const body = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          Range: "bytes=0-8191",
          IfMatch: head.ETag,
        }),
      );
      return {
        size: head.ContentLength ?? 0,
        etag: head.ETag,
        bytes: await body.Body!.transformToByteArray(),
      };
    },
    async freeze(source, key, etag, mime) {
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: key,
          CopySource: `${bucket}/${source}`,
          CopySourceIfMatch: etag,
          ContentType: mime,
          MetadataDirective: "REPLACE",
          CacheControl: "public, max-age=31536000, immutable",
          ContentDisposition: "inline",
        }),
      );
    },
    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
export async function completeUpload(
  db: Db,
  storage: ObjectStorage,
  id: ObjectId,
  adminId: ObjectId,
): Promise<MediaItem> {
  const uploads = db.collection("uploads"),
    record = await uploads.findOne({ _id: id, adminId });
  if (!record) throw new HttpError(404, "UPLOAD", "Dosya bulunamadı.");
  if (["verified", "attached"].includes(record.state))
    return publicMedia(record.media, storage.publicOrigin);
  if (
    record.state !== "pending" ||
    Date.now() - record.createdAt.getTime() > 3_600_000
  )
    throw new HttpError(400, "UPLOAD", "Dosya yükleme süresi doldu.");
  const claim = await uploads.updateOne(
    { _id: id, state: "pending" },
    {
      $set: { state: "verifying", leaseUntil: new Date(Date.now() + 300_000) },
    },
  );
  if (!claim.matchedCount)
    throw new HttpError(409, "UPLOAD", "Dosya doğrulanıyor. Tekrar deneyin.");
  try {
    const object = await storage.inspect(record.stagingKey);
    const detected = await fileTypeFromBuffer(object.bytes);
    if (
      object.size !== record.size ||
      !detected ||
      detected.mime !== record.mime
    )
      throw new HttpError(400, "UPLOAD", "Dosya içeriği veya boyutu geçersiz.");
    await storage.freeze(
      record.stagingKey,
      record.key,
      object.etag,
      record.mime,
    );
    const media: MediaItem = {
      id: id.toHexString(),
      key: record.key,
      kind: record.mime.startsWith("image/") ? "image" : "video",
      mime: record.mime,
      size: record.size,
      originalName: record.originalName,
      url: `${storage.publicOrigin}/${record.key}`,
    };
    await uploads.updateOne(
      { _id: id, state: "verifying" },
      { $set: { state: "verified", media }, $unset: { leaseUntil: "" } },
    );
    // Staging stays tracked until maintenance; the presigned PUT may still be valid.
    return media;
  } catch (error) {
    await uploads.updateOne(
      { _id: id },
      {
        $set: { state: error instanceof HttpError ? "deleting" : "pending" },
        $unset: { leaseUntil: "" },
      },
    );
    throw error;
  }
}
export function registerMedia(
  app: Express,
  db: Db,
  getStorage: () => ObjectStorage = () => createStorage(),
) {
  app.post("/api/admin/media/uploads", async (req, res) => {
    const input = validateUpload(req.body),
      storage = getStorage(),
      id = new ObjectId();
    const key = `media/${id.toHexString()}`,
      stagingKey = `staging/${id.toHexString()}`;
    await db
      .collection("uploads")
      .insertOne({
        _id: id,
        adminId: res.locals.session.adminId,
        state: "pending",
        key,
        stagingKey,
        mime: input.mime,
        size: input.size,
        originalName: input.name,
        createdAt: new Date(),
      });
    res
      .status(201)
      .json({
        uploadId: id.toHexString(),
        ...(await storage.sign(stagingKey, input.mime, input.size)),
      });
  });
  app.post("/api/admin/media/uploads/:id/complete", async (req, res) =>
    res.json(
      await completeUpload(
        db,
        getStorage(),
        objectId(req.params.id),
        res.locals.session.adminId,
      ),
    ),
  );
}
