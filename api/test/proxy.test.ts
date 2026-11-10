import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createAdmin } from "../src/auth.js";
import { testDatabase } from "./helpers.js";

const secret = "a".repeat(64);
const environment = {
  NODE_ENV: "production",
  APP_ORIGIN: "https://kaizen.example.com",
  MONGODB_URI: "mongodb://unused",
  MONGODB_DB: "kaizen_test",
  ORIGIN_SECRET: secret,
};

test("production requires a strong origin secret, development does not", () => {
  assert.throws(() => loadConfig({ ...environment, ORIGIN_SECRET: undefined }), /ORIGIN_SECRET/);
  for (const invalid of ["short", "g".repeat(64), "a".repeat(63)]) {
    assert.throws(() => loadConfig({ ...environment, ORIGIN_SECRET: invalid }), /ORIGIN_SECRET/);
  }
  assert.doesNotThrow(() => loadConfig({ ...environment, NODE_ENV: "development", ORIGIN_SECRET: undefined }));
});

test("origin authentication precedes API access and accepts only a single valid client IP", async () => {
  const store = await testDatabase();
  try {
    const app = buildApp({ db: store.db, config: loadConfig(environment) });
    assert.equal((await request(app).get("/api/health")).status, 200);
    for (const token of [undefined, "wrong", "b".repeat(64)]) {
      let req = request(app).get("/api/events").set("X-Real-IP", "203.0.113.10");
      if (token) req = req.set("X-Origin-Secret", token);
      assert.equal((await req).status, 403);
    }
    for (const ip of ["unknown", "203.0.113.1, 203.0.113.2", "127.0.0.999", ""]) {
      const res = await request(app).get("/api/events")
        .set("X-Origin-Secret", secret).set("X-Real-IP", ip);
      assert.equal(res.status, 400);
    }
    for (const ip of ["203.0.113.10", "2001:db8::10"]) {
      assert.equal((await request(app).get("/api/events")
        .set("X-Origin-Secret", secret).set("X-Real-IP", ip)).status, 200);
    }
  } finally {
    await store.close();
  }
});

test("authenticated proxy preserves cookies, Origin, CSRF and per-visitor rate limits", async () => {
  const store = await testDatabase();
  try {
    const config = loadConfig(environment);
    const app = buildApp({ db: store.db, config });
    await createAdmin(store.db, "sensei", "A-long-unique-password-123!");
    const headers = { "X-Origin-Secret": secret, "X-Real-IP": "203.0.113.10", Origin: config.origin };
    const login = await request(app).post("/api/auth/login").set(headers)
      .send({ username: "sensei", password: "A-long-unique-password-123!" });
    assert.equal(login.status, 200);
    const cookie = login.headers["set-cookie"][0];
    assert.match(cookie, /Secure/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Path=\/api/);
    assert.doesNotMatch(cookie, /Domain=/);
    const session = cookie.split(";")[0];
    assert.equal((await request(app).get("/api/auth/session").set(headers).set("Cookie", session)).status, 200);
    assert.equal((await request(app).post("/api/auth/logout").set(headers).set("Cookie", session)).status, 403);
    assert.equal((await request(app).post("/api/auth/logout").set(headers)
      .set("Origin", "https://evil.test").set("Cookie", session).set("X-CSRF-Token", login.body.csrfToken)).status, 403);
    assert.equal((await request(app).post("/api/auth/logout").set(headers)
      .set("Cookie", session).set("X-CSRF-Token", login.body.csrfToken)).status, 204);
    for (let i = 1; i <= 10; i++) {
      const res = await request(app).post("/api/auth/login").set(headers)
        .set("X-Forwarded-For", `198.51.100.${i}`)
        .send({ username: "sensei", password: "wrong" });
      assert.equal(res.status, i === 10 ? 429 : 401);
    }
    assert.equal((await request(app).post("/api/auth/login").set(headers)
      .set("X-Real-IP", "203.0.113.11").send({ username: "sensei", password: "wrong" })).status, 401);
  } finally {
    await store.close();
  }
});

test("local API ignores spoofed proxy IP headers even when VERCEL is set", async () => {
  const store = await testDatabase();
  try {
    const config = loadConfig({ ...environment, NODE_ENV: "development", VERCEL: "1", ORIGIN_SECRET: undefined });
    const app = buildApp({ db: store.db, config });
    for (let i = 0; i <= 10; i++) {
      const res = await request(app).post("/api/auth/login").set("Origin", config.origin)
        .set("X-Real-IP", `203.0.113.${i}`).send({ username: "missing", password: "wrong" });
      assert.equal(res.status, i === 10 ? 429 : 401);
    }
  } finally {
    await store.close();
  }
});
