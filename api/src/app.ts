import express from "express";
import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { Db } from "mongodb";
import type { Config } from "./config.js";
import { registerAuth } from "./auth.js";
import { errorHandler, HttpError } from "./errors.js";
import { registerEvents } from "./events.js";
import { registerMedia } from "./media.js";
import { registerForms, type FormServices } from "./forms.js";
import { registerMessages } from "./messages.js";
export function buildApp({
  db,
  config,
  forms,
}: {
  db: Db;
  config: Config;
  forms?: FormServices;
}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    next();
  });
  app.use("/api", (req, _res, next) => {
    if (config.originSecret && !(req.path === "/health" && ["GET", "HEAD"].includes(req.method))) {
      const supplied = Buffer.from(req.get("x-origin-secret") ?? "");
      const expected = Buffer.from(config.originSecret);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
        throw new HttpError(403, "PROXY", "İstek kaynağına izin verilmiyor.");
      if (!isIP(req.get("x-real-ip") ?? ""))
        throw new HttpError(400, "PROXY_IP", "Geçersiz istemci adresi.");
    }
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  registerAuth(app, db, config);
  registerEvents(app, db);
  registerMedia(app, db);
  registerForms(app, db, config, forms);
  registerMessages(app, db);
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use((_req, res) =>
    res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." } }),
  );
  app.use(errorHandler);
  return app;
}
