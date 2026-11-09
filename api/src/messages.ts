import type { Express } from "express";
import type { Db, WithId } from "mongodb";
import type { MessageInput, UserMessage } from "../../shared/messages.js";
import { HttpError } from "./errors.js";
import { objectId } from "./events.js";

type MessageDocument = MessageInput & { createdAt: string; isRead: boolean };

export function registerMessages(app: Express, db: Db) {
  const messages = db.collection<MessageDocument>("messages");
  const dto = ({ _id, ...fields }: WithId<MessageDocument>): UserMessage => ({
    ...fields, id: _id.toHexString(),
  });

  app.get("/api/admin/messages", async (req, res) => {
    const value = req.query.page ?? "1";
    const page = typeof value === "string" && /^[1-9]\d*$/.test(value) ? Number(value) : NaN;
    const skip = (page - 1) * 50;
    if (!Number.isSafeInteger(page) || !Number.isSafeInteger(skip))
      throw new HttpError(400, "PAGE", "Sayfa numarası geçersiz.");
    const records = await messages.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(51).toArray();
    res.json({ messages: records.slice(0, 50).map(dto), page, hasMore: records.length > 50 });
  });

  app.get("/api/admin/messages/:id", async (req, res) => {
    const message = await messages.findOne({ _id: objectId(req.params.id) });
    if (!message) throw new HttpError(404, "NOT_FOUND", "Mesaj bulunamadı.");
    res.json(dto(message));
  });

  app.post("/api/admin/messages/:id/read", async (req, res) => {
    const result = await messages.updateOne({ _id: objectId(req.params.id) }, { $set: { isRead: true } });
    if (!result.matchedCount) throw new HttpError(404, "NOT_FOUND", "Mesaj bulunamadı.");
    res.json({ ok: true });
  });
}
