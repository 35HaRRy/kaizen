import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { ObjectId } from "mongodb";
import { testDatabase } from "./helpers.js";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createAdmin } from "../src/auth.js";

test("message routes protect private data, paginate stably and share read status between admins", async () => {
  const store = await testDatabase();
  const config = loadConfig({ APP_ORIGIN: "http://localhost:3000", MONGODB_URI: "mongodb://unused", MONGODB_DB: "kaizen_test" });
  try {
    const app = buildApp({ db: store.db, config });
    await createAdmin(store.db, "first", "A-long-password-123!");
    await createAdmin(store.db, "second", "B-long-password-123!");
    const first = request.agent(app), second = request.agent(app);
    const login = async (agent: typeof first, username: string, password: string) => {
      const result = await agent.post("/api/auth/login").set("Origin", config.origin).send({ username, password });
      assert.equal(result.status, 200);
      return result.body.csrfToken as string;
    };
    const csrf = await login(first, "first", "A-long-password-123!");
    await login(second, "second", "B-long-password-123!");
    const empty = await first.get("/api/admin/messages");
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body, { messages: [], page: 1, hasMore: false });
    const records = Array.from({ length: 51 }, (_, index) => ({
      _id: new ObjectId(index.toString(16).padStart(24, "0")), type: "contact", name: `Sender ${index}`, email: "sender@example.com", message: "Hello", createdAt: "2026-11-09T12:00:00.000Z", isRead: false,
    }));
    await store.db.collection("messages").insertMany(records);
    const id = records[50]._id.toHexString();
    for (const path of ["/api/admin/messages", `/api/admin/messages/${id}`])
      assert.equal((await request(app).get(path)).status, 401);
    assert.equal((await request(app).post(`/api/admin/messages/${id}/read`).set("Origin", config.origin)).status, 401);
    const list = await first.get("/api/admin/messages");
    assert.equal(list.body.messages.length, 50);
    assert.equal(list.body.messages[0].id, id);
    assert.equal(list.body.messages[49].id, records[1]._id.toHexString());
    assert.equal(list.body.hasMore, true);
    const page2 = await first.get("/api/admin/messages?page=2");
    assert.equal(page2.body.messages.length, 1);
    assert.equal(page2.body.messages[0].id, records[0]._id.toHexString());
    assert.equal(page2.body.hasMore, false);
    for (const page of ["0", "-1", "1.5", "wat", "9007199254740991", "1&page=2"])
      assert.equal((await first.get(`/api/admin/messages?page=${page}`)).status, 400);
    const detail = await first.get(`/api/admin/messages/${id}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.isRead, false);
    assert.equal(detail.body.message, "Hello");
    assert.equal(await store.db.collection("messages").countDocuments({ isRead: true }), 0);
    assert.equal((await first.post(`/api/admin/messages/${id}/read`).set("Origin", config.origin)).status, 403);
    assert.equal((await first.post(`/api/admin/messages/${id}/read`).set("Origin", "https://evil.test").set("X-CSRF-Token", csrf)).status, 403);
    assert.equal((await first.post(`/api/admin/messages/${id}/read`).set("Origin", config.origin).set("X-CSRF-Token", "wrong")).status, 403);
    for (let repeat = 0; repeat < 2; repeat++)
      assert.equal((await first.post(`/api/admin/messages/${id}/read`).set("Origin", config.origin).set("X-CSRF-Token", csrf)).status, 200);
    assert.equal((await second.get(`/api/admin/messages/${id}`)).body.isRead, true);
    assert.equal((await second.get("/api/admin/messages")).body.messages[0].isRead, true);
    for (const missing of ["invalid", new ObjectId().toHexString()]) {
      assert.equal((await first.get(`/api/admin/messages/${missing}`)).status, 404);
      assert.equal((await first.post(`/api/admin/messages/${missing}/read`).set("Origin", config.origin).set("X-CSRF-Token", csrf)).status, 404);
    }
  } finally { await store.close(); }
});
