import { ObjectId, type Db } from "mongodb";
import type { Express } from "express";
import {
  categories,
  type EventInput,
  type MediaItem,
} from "../../shared/events.js";
import { HttpError, text } from "./errors.js";
export function objectId(value: unknown): ObjectId {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/.test(value))
    throw new HttpError(404, "NOT_FOUND", "Kayıt bulunamadı.");
  return new ObjectId(value);
}
export function validateEvent(body: any): EventInput {
  if (
    !body ||
    !categories.includes(body.category) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date) ||
    !Number.isFinite(Date.parse(body.date)) ||
    new Date(body.date).toISOString().slice(0, 10) !== body.date
  )
    throw new HttpError(
      400,
      "VALIDATION",
      "Etkinlik türü veya tarihi geçersiz.",
    );
  if (
    !Array.isArray(body.mediaIds) ||
    body.mediaIds.length > 50 ||
    new Set(body.mediaIds).size !== body.mediaIds.length ||
    body.mediaIds.some(
      (id: unknown) => typeof id !== "string" || !/^[a-f\d]{24}$/.test(id),
    )
  )
    throw new HttpError(400, "MEDIA", "Galeri seçimi geçersiz.");
  if (
    body.coverMediaId !== null &&
    (typeof body.coverMediaId !== "string" ||
      !body.mediaIds.includes(body.coverMediaId))
  )
    throw new HttpError(400, "COVER", "Kapak seçimi geçersiz.");
  return {
    category: body.category,
    date: body.date,
    title: text(body.title, 160),
    description: text(body.description, 5000),
    location: text(body.location, 250),
    mediaIds: body.mediaIds,
    coverMediaId: body.coverMediaId,
  };
}
export function registerEvents(app: Express, db: Db) {
  const events = db.collection("events"),
    uploads = db.collection("uploads");
  const dto = (doc: any) => {
    const { _id, ...rest } = doc;
    return { ...rest, id: _id.toHexString() };
  };
  app.get("/api/events", async (req, res) => {
    const category = req.query.category;
    if (category && !categories.includes(category as any))
      throw new HttpError(400, "CATEGORY", "Etkinlik türü geçersiz.");
    res.json({
      events: (
        await events
          .find(category ? { category } : {})
          .sort({ date: -1, _id: -1 })
          .toArray()
      ).map(dto),
    });
  });
  app.get("/api/events/:id", async (req, res) => {
    const event = await events.findOne({ _id: objectId(req.params.id) });
    if (!event) throw new HttpError(404, "NOT_FOUND", "Etkinlik bulunamadı.");
    res.json(dto(event));
  });
  async function save(
    body: any,
    adminId: ObjectId,
    id: ObjectId,
    isNew: boolean,
  ) {
    const input = validateEvent(body);
    if (isNew && !input.coverMediaId)
      throw new HttpError(400, "COVER", "Bir kapak resmi seçin.");
    if (!isNew && (!Number.isInteger(body.version) || body.version < 1))
      throw new HttpError(400, "VERSION", "Kayıt sürümü geçersiz.");
    const records = await uploads
      .find({
        _id: { $in: input.mediaIds.map((id) => new ObjectId(id)) },
        adminId,
        state: { $in: ["verified", "attached"] },
      })
      .toArray();
    const media: MediaItem[] = input.mediaIds.map((mediaId) => {
      const record = records.find((r) => r._id.toHexString() === mediaId);
      if (!record?.media || (record.eventId && !record.eventId.equals(id)))
        throw new HttpError(
          400,
          "MEDIA",
          "Dosya doğrulanmamış veya başka etkinliğe ait.",
        );
      return record.media;
    });
    if (
      input.coverMediaId &&
      media.find((m) => m.id === input.coverMediaId)?.kind !== "image"
    )
      throw new HttpError(400, "COVER", "Kapak bir resim olmalıdır.");
    try {
      // A lease prevents cleanup from claiming media while an event write is in flight.
      for (const record of records) {
        const claim = await uploads.updateOne(
          {
            _id: record._id,
            state: { $in: ["verified", "attached"] },
            $or: [{ eventId: { $exists: false } }, { eventId: id }],
          },
          {
            $set: {
              eventId: id,
              state: "attached",
              leaseUntil: new Date(Date.now() + 3_600_000),
            },
          },
        );
        if (!claim.matchedCount)
          throw new HttpError(
            409,
            "MEDIA_BUSY",
            "Dosya başka bir işlemde. Tekrar deneyin.",
          );
      }
      const { mediaIds: _, ...fields } = input;
      const now = new Date().toISOString();
      if (isNew) {
        const doc = {
          _id: id,
          ...fields,
          media,
          version: 1,
          createdAt: now,
          updatedAt: now,
        };
        await events.insertOne(doc);
        return dto(doc);
      }
      const doc = await events.findOneAndUpdate(
        { _id: id, version: body.version },
        { $set: { ...fields, media, updatedAt: now }, $inc: { version: 1 } },
        { returnDocument: "after" },
      );
      if (!doc) {
        if (!(await events.findOne({ _id: id })))
          throw new HttpError(404, "NOT_FOUND", "Etkinlik bulunamadı.");
        throw new HttpError(
          409,
          "CONFLICT",
          "Etkinlik başka bir sekmede değişti. Taslağınızı kontrol ederek yeniden yükleyin.",
        );
      }
      return dto(doc);
    } catch (error) {
      // Do not undo existing attachments or an ambiguous write that actually committed.
      for (const record of records.filter((record) => !record.eventId)) {
        try {
          if (!(await events.findOne({ "media.id": record._id.toHexString() })))
            await uploads.updateOne(
              { _id: record._id, eventId: id, state: "attached" },
              {
                $set: { state: "verified" },
                $unset: { eventId: "", leaseUntil: "" },
              },
            );
        } catch {
          /* Unavailable DB: retain the lease for safe recovery by maintenance. */
        }
      }
      throw error;
    }
  }
  app.post("/api/admin/events", async (req, res) =>
    res
      .status(201)
      .json(
        await save(req.body, res.locals.session.adminId, new ObjectId(), true),
      ),
  );
  app.put("/api/admin/events/:id", async (req, res) =>
    res.json(
      await save(
        req.body,
        res.locals.session.adminId,
        objectId(req.params.id),
        false,
      ),
    ),
  );
  app.delete("/api/admin/events/:id", async (req, res) => {
    const result = await events.deleteOne({ _id: objectId(req.params.id) });
    if (!result.deletedCount)
      throw new HttpError(404, "NOT_FOUND", "Etkinlik bulunamadı.");
    res.sendStatus(204);
  });
}
