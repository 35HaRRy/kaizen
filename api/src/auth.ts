import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { parseCookie as parse, stringifySetCookie } from "cookie";
import type { Db, ObjectId } from "mongodb";
import type { Express, RequestHandler } from "express";
import type { Config } from "./config.js";
import { HttpError, text } from "./errors.js";
import { rateLimit } from "./rate-limit.js";
const scrypt = promisify(scryptCallback);
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const cookieName = "kaizen_session";
interface Admin {
  _id: ObjectId;
  username: string;
  salt: string;
  passwordHash: string;
}
interface Session {
  adminId: ObjectId;
  username: string;
  tokenHash: string;
  csrfToken: string;
  expiresAt: Date;
}
function readPassword(value: unknown, minLength = 1): string {
  if (
    typeof value !== "string" ||
    value.length < minLength ||
    value.length > 256 ||
    !value.trim() ||
    value.includes("\0")
  )
    throw new HttpError(400, "PASSWORD", "Şifre uzunluğu geçersiz.");
  return value;
}
export async function createAdmin(db: Db, username: string, password: string) {
  text(username, 80);
  readPassword(password, 14);
  const salt = randomBytes(16).toString("hex");
  const passwordHash = ((await scrypt(password, salt, 64)) as Buffer).toString(
    "hex",
  );
  await db.collection("admins").createIndex({ username: 1 }, { unique: true });
  await db
    .collection("admins")
    .insertOne({ username: username.trim(), salt, passwordHash });
}
export function registerAuth(app: Express, db: Db, config: Config) {
  const origin: RequestHandler = (req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("origin") !== config.origin
    )
      throw new HttpError(403, "ORIGIN", "İstek kaynağına izin verilmiyor.");
    next();
  };
  app.use("/api", origin);
  const requireAdmin: RequestHandler = async (req, res, next) => {
    const token = parse(req.headers.cookie ?? "")[cookieName];
    const session =
      token && token.length < 200
        ? await db
            .collection<Session>("sessions")
            .findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } })
        : null;
    if (!session) throw new HttpError(401, "AUTH", "Lütfen giriş yapın.");
    if (
      !["GET", "HEAD"].includes(req.method) &&
      req.get("x-csrf-token") !== session.csrfToken
    )
      throw new HttpError(
        403,
        "CSRF",
        "Güvenlik doğrulaması başarısız. Sayfayı yenileyin.",
      );
    res.locals.session = session;
    next();
  };
  const cookieOptions = {
    httpOnly: true,
    secure: config.production,
    sameSite: "strict" as const,
    path: "/api",
  };
  app.post("/api/auth/login", async (req, res) => {
    await rateLimit(db, req, config, "login", 10);
    const username = text(req.body?.username, 80),
      password = readPassword(req.body?.password);
    const admin = await db.collection<Admin>("admins").findOne({ username });
    const candidate = (await scrypt(
      password,
      admin?.salt ?? "no-account-timing-salt",
      64,
    )) as Buffer;
    if (
      !admin ||
      !timingSafeEqual(candidate, Buffer.from(admin.passwordHash, "hex"))
    )
      throw new HttpError(401, "AUTH", "Kullanıcı adı veya şifre hatalı.");
    const old = parse(req.headers.cookie ?? "")[cookieName];
    if (old)
      await db.collection("sessions").deleteOne({ tokenHash: hash(old) });
    const token = randomBytes(32).toString("hex"),
      csrfToken = randomBytes(32).toString("hex");
    await db
      .collection<Session>("sessions")
      .insertOne({
        adminId: admin._id,
        username,
        tokenHash: hash(token),
        csrfToken,
        expiresAt: new Date(Date.now() + 43_200_000),
      });
    res.setHeader(
      "Set-Cookie",
      stringifySetCookie({
        name: cookieName,
        value: token,
        ...cookieOptions,
        maxAge: 43_200,
      }),
    );
    res.json({ username, csrfToken });
  });
  app.get("/api/auth/session", requireAdmin, (_req, res) =>
    res.json({
      username: res.locals.session.username,
      csrfToken: res.locals.session.csrfToken,
    }),
  );
  app.post("/api/auth/logout", requireAdmin, async (_req, res) => {
    await db
      .collection("sessions")
      .deleteOne({ tokenHash: res.locals.session.tokenHash });
    res.setHeader(
      "Set-Cookie",
      stringifySetCookie({
        name: cookieName,
        value: "",
        ...cookieOptions,
        maxAge: 0,
      }),
    );
    res.sendStatus(204);
  });
  app.use("/api/admin", requireAdmin);
}
