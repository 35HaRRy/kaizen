import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { ObjectId } from "mongodb";
import { testDatabase } from "./helpers.js";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { completeUpload, type ObjectStorage } from "../src/media.js";

test("existing events and completed uploads use the current origin without rewriting MongoDB", async () => {
  const store = await testDatabase();
  const previous = process.env.R2_PUBLIC_ORIGIN;
  const origin = "https://kaizen-media.example.workers.dev";
  process.env.R2_PUBLIC_ORIGIN = origin;
  try {
    const id = new ObjectId(), mediaId = new ObjectId(), owner = new ObjectId();
    const media = {
      id: mediaId.toHexString(), key: `media/${mediaId}`, kind: "image",
      mime: "image/jpeg", size: 20, originalName: "dojo.jpg",
      url: `https://old.r2.dev/media/${mediaId}`,
    };
    await store.db.collection("events").insertOne({ _id: id, media: [media], date: "2026-11-12" });
    await store.db.collection("uploads").insertOne({ _id: mediaId, adminId: owner, state: "attached", media });
    const app = buildApp({ db: store.db, config: loadConfig({
      APP_ORIGIN: "http://localhost:3000", MONGODB_URI: "mongodb://unused", MONGODB_DB: "kaizen_test",
    }) });
    const list = await request(app).get("/api/events").expect(200);
    const detail = await request(app).get(`/api/events/${id}`).expect(200);
    assert.equal(list.body.events[0].media[0].url, `${origin}/${media.key}`);
    assert.equal(detail.body.media[0].url, `${origin}/${media.key}`);
    const storage: ObjectStorage = {
      publicOrigin: origin,
      sign: async () => { throw new Error("not expected"); },
      inspect: async () => { throw new Error("not expected"); },
      freeze: async () => { throw new Error("not expected"); },
      remove: async () => { throw new Error("not expected"); },
    };
    assert.equal((await completeUpload(store.db, storage, mediaId, owner)).url, `${origin}/${media.key}`);
    assert.equal((await store.db.collection("events").findOne({ _id: id }))!.media[0].url, media.url);
    assert.equal((await store.db.collection("uploads").findOne({ _id: mediaId }))!.media.url, media.url);
  } finally {
    if (previous === undefined) delete process.env.R2_PUBLIC_ORIGIN;
    else process.env.R2_PUBLIC_ORIGIN = previous;
    await store.close();
  }
});
