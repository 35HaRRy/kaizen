import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { testDatabase } from "./helpers.js";
import { loadConfig } from "../src/config.js";
import { buildApp } from "../src/app.js";
import type { FormServices } from "../src/forms.js";

const config = loadConfig({ APP_ORIGIN: "https://kaizen.test", MONGODB_URI: "mongodb://unused", MONGODB_DB: "kaizen_test" });
const contact = { name: "Ayşe", email: "ayse@example.com", message: "Bilgi almak istiyorum.", turnstileToken: "test-token" };
const trial = { fullName: "Ali", email: "ali@example.com", phone: "+90 555 123 4567", group: "Yetişkinler Grubu (13+ Yaş)", notes: "Akşam uygunum.", turnstileToken: "test-token" };

test("both forms persist validated fields as unread without trusting client metadata", async () => {
  const store = await testDatabase();
  let action = "contact";
  const forms = { verify: async () => ({ success: true, hostname: "kaizen.test", action }) };
  try {
    const app = buildApp({ db: store.db, config, forms });
    const start = new Date().toISOString();
    assert.equal((await request(app).post("/api/contact").set("Origin", config.origin).send({ ...contact, isRead: true, createdAt: "2000", to: "attacker@example.com" })).status, 200);
    const saved = await store.db.collection("messages").findOne({ type: "contact" });
    assert.ok(saved);
    const { _id, createdAt, ...fields } = saved;
    assert.deepEqual(fields, { type: "contact", name: "Ayşe", email: "ayse@example.com", message: "Bilgi almak istiyorum.", isRead: false });
    assert.ok(createdAt >= start && createdAt <= new Date().toISOString());
    action = "trial_request";
    assert.equal((await request(app).post("/api/trial-requests").set("Origin", config.origin).send(trial)).status, 200);
    const savedTrial = await store.db.collection("messages").findOne({ type: "trial" });
    assert.ok(savedTrial);
    const { _id: id, createdAt: date, ...trialFields } = savedTrial;
    assert.deepEqual(trialFields, { type: "trial", name: "Ali", email: "ali@example.com", phone: "+90 555 123 4567", group: "Yetişkinler Grubu (13+ Yaş)", notes: "Akşam uygunum.", isRead: false });
  } finally { await store.close(); }
});

test("failed verification never saves messages and form rate limiting remains enforced", async () => {
  const store = await testDatabase();
  let verification = { success: false, hostname: "kaizen.test", action: "contact" };
  let unavailable = false;
  const forms: FormServices = { verify: async () => { if (unavailable) throw new Error("unavailable"); return verification; } };
  try {
    const app = buildApp({ db: store.db, config, forms });
    const send = () => request(app).post("/api/contact").set("Origin", config.origin).send(contact);
    assert.equal((await send()).status, 400);
    verification = { success: true, hostname: "evil.test", action: "contact" };
    assert.equal((await send()).status, 400);
    verification = { success: true, hostname: "kaizen.test", action: "trial_request" };
    assert.equal((await send()).status, 400);
    unavailable = true;
    assert.equal((await send()).status, 503);
    unavailable = false;
    verification.action = "contact";
    assert.equal((await send()).status, 200);
    assert.equal((await send()).status, 429);
    assert.equal(await store.db.collection("messages").countDocuments(), 1);
  } finally { await store.close(); }
});

test("invalid fields are rejected before storage", async () => {
  const store = await testDatabase();
  let action = "contact";
  try {
    const app = buildApp({ db: store.db, config, forms: { verify: async () => ({ success: true, hostname: "kaizen.test", action }) } });
    for (const [path, body] of [
      ["/api/contact", { ...contact, email: "bad" }],
      ["/api/contact", { ...contact, message: " " }],
      ["/api/trial-requests", { ...trial, phone: "bad" }],
      ["/api/trial-requests", { ...trial, group: "unknown" }],
    ] as const) {
      action = path === "/api/contact" ? "contact" : "trial_request";
      assert.equal((await request(app).post(path).set("Origin", config.origin).send(body)).status, 400);
    }
    assert.equal(await store.db.collection("messages").countDocuments(), 0);
  } finally { await store.close(); }
});

test("storage failure does not report success", async (t) => {
  const store = await testDatabase();
  try {
    const messages = store.db.collection("messages");
    const collection = store.db.collection.bind(store.db);
    t.mock.method(messages, "insertOne", async () => { throw new Error("DB unavailable"); });
    t.mock.method(store.db, "collection", (name: string) => name === "messages" ? messages : collection(name));
    const app = buildApp({ db: store.db, config, forms: { verify: async () => ({ success: true, hostname: "kaizen.test", action: "contact" }) } });
    const result = await request(app).post("/api/contact").set("Origin", config.origin).send(contact);
    assert.equal(result.status, 503);
    assert.equal(result.body.error.code, "UNAVAILABLE");
  } finally { t.mock.restoreAll(); await store.close(); }
});
