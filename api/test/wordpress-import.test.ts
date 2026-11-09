import { test } from "node:test";
import assert from "node:assert/strict";
import { ObjectId } from "mongodb";
import request from "supertest";
import { testDatabase } from "./helpers.js";
import { createAdmin } from "../src/auth.js";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { cleanupMedia } from "../src/media-cleanup.js";
import type { ObjectStorage } from "../src/media.js";
import { mapPost, parseListing, loadInventory, importEvent, verifyEvent } from "../src/wordpress-import.js";

const origin = "https://kaizenaikidoakademi.wordpress.com";
const image = `${origin}/wp-content/uploads/2024/01/cover.jpg`;
const second = `${origin}/wp-content/uploads/2024/01/second.jpg`;
const post = {
  ID: 123, URL: `${origin}/2024/01/12/test/`, title: "Ocak Kyu Sınavı",
  date: "2024-01-12T00:30:00+03:00", featured_image: image,
  content: `<figure><img src="${image}" /></figure><img src='${second}'><img src="${image}?w=1024">`,
};
const listing = { id: 123, url: post.URL, title: post.title, date: "2024-01-12", cover: image };
const html = `<li class="wp-block-post post-123 post"><figure><a href="${post.URL}"><img src="${image}?w=1024" data-orig-file="${image}"></a></figure><h2><a href="${post.URL}">Ocak Kyu Sınavı</a></h2><time datetime="2024-01-12T00:30:00+03:00">12 Ocak 2024</time></li>`;

test("mapping preserves listing text, local date, gallery order and original cover", () => {
  assert.deepEqual(parseListing(html).entries, [listing]);
  const result = mapPost(post, listing);
  assert.equal(result.date, "2024-01-12");
  assert.equal(result.category, "Kyu sınavları");
  assert.equal(result.location, "İstanbul");
  assert.deepEqual(result.images, [image, second]);
  assert.equal(result.cover, image);
  assert.match(result.description, /Kyu sınavı/i);
  assert.deepEqual(mapPost({ ...post, content: `<img src="${second}">` }, listing).images, [image, second]);
  const cases = [
    ["20 Haziran Çocuk Kyu Sınavı", "Kyu sınavları", "İstanbul"],
    ["Çocuk Buluşması", "Çocuk etkinlikleri", "İstanbul"],
    ["24 Haziran Antrenmanı", "Dojo yaşamı", "İstanbul"],
    ["İzmir Aikido Semineri", "Seminerler", "İzmir"],
    ["12-17 Mayıs Ankara", "", "Ankara"],
    ["28 Temmuz &#8211; 4 Ağustos Çanakkale", "", "Çanakkale"],
  ];
  for (const [title, category, location] of cases) {
    const mapped = mapPost({ ...post, title }, { ...listing, title });
    assert.equal(mapped.category, category);
    assert.equal(mapped.location, location);
  }
  assert.equal(mapPost(post, { ...listing, title: "A &amp; B &#8211; C" }).title, "A & B – C");
  assert.throws(() => mapPost({ ...post, content: '<img src="https://evil.test/a.jpg">' }, listing));
  assert.throws(() => mapPost({ ...post, content: '<video src="x"></video>' }, listing));
  assert.throws(() => parseListing(html.replace('datetime="2024-01-12T00:30:00+03:00"', 'datetime="bad"')));
});

test("inventory follows listing pagination and refuses missing API records", async () => {
  const next = `${origin}/etkinlikler/?query-16-page=2`;
  const other = { ...post, ID: 124, URL: `${origin}/2024/01/13/other/` };
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("public-api.wordpress.com")) return Response.json({ found: 2, posts: [post, other] });
    if (url === next) return new Response(html.replaceAll("post-123", "post-124").replaceAll(post.URL, other.URL));
    return new Response(`${html}<a class="wp-block-query-pagination-next" href="${next}">Sonraki</a>`);
  };
  assert.equal((await loadInventory(fetcher)).length, 2);
  await assert.rejects(loadInventory(async (input, init) => {
    if (String(input).includes("public-api.wordpress.com")) return Response.json({ found: 0, posts: [] });
    return fetcher(input, init);
  }));
});

test("interrupted imports resume, retain editability and never overwrite an existing event", async () => {
  const store = await testDatabase();
  try {
    await createAdmin(store.db, "sensei", "password-is-long-123");
    const admin = await store.db.collection("admins").findOne({ username: "sensei" });
    const unrelatedId = new ObjectId();
    await store.db.collection("events").insertOne({ _id: unrelatedId, title: "Mevcut kayıt" });
    const objects = new Map<string, Uint8Array>();
    const jpeg = Uint8Array.from([255,216,255,224,0,16,74,70,73,70,0,1,1,0,0,1,0,1,0,0,255,217]);
    const storage: ObjectStorage = {
      publicOrigin: "https://media.test",
      async sign(key) { return { url: `https://upload.test/${key}`, headers: {} }; },
      async inspect(key) {
        const bytes = objects.get(key);
        if (!bytes) throw new Error("Object missing");
        return { size: bytes.length, etag: '"etag"', bytes };
      },
      async freeze(source, key) { objects.set(key, objects.get(source)!); },
      async remove(key) { objects.delete(key); },
    };
    let failSecond = true;
    const fetcher: typeof fetch = async (input, init) => {
      const url = String(input);
      if (init?.method === "PUT") {
        objects.set(new URL(url).pathname.slice(1), new Uint8Array(init.body as Uint8Array));
        return new Response(null, { status: 200 });
      }
      if (url === second && failSecond) throw new Error("Interrupted download");
      return new Response(jpeg);
    };
    const source = mapPost(post, listing);
    await assert.rejects(importEvent(store.db, storage, admin!._id, source, fetcher), /Interrupted/);
    assert.equal(await store.db.collection("events").countDocuments(), 1);
    assert.equal(await store.db.collection("uploads").countDocuments({ state: "verified" }), 1);
    failSecond = false;
    await store.db.command({ collMod: "events", validator: { $jsonSchema: { required: ["reject_import"] } } });
    await assert.rejects(importEvent(store.db, storage, admin!._id, source, fetcher));
    assert.equal(await store.db.collection("events").countDocuments(), 1);
    await store.db.command({ collMod: "events", validator: {} });
    const imported = await importEvent(store.db, storage, admin!._id, source, fetcher);
    assert.equal(imported, "created");
    const event = await store.db.collection("events").findOne({ "source.postId": 123 });
    assert.ok(event);
    assert.equal(event.media.length, 2);
    assert.equal(event.coverMediaId, event.media[0].id);
    assert.equal(await store.db.collection("uploads").countDocuments({ adminId: admin!._id, eventId: event._id, state: "attached" }), 2);
    assert.deepEqual(await verifyEvent(store.db, storage, source), []);
    const config = loadConfig({ APP_ORIGIN: "http://localhost:3000", MONGODB_URI: "mongodb://unused", MONGODB_DB: "kaizen_test" });
    const app = buildApp({ db: store.db, config });
    const agent = request.agent(app);
    const login = await agent.post("/api/auth/login").set("Origin", config.origin).send({ username: "sensei", password: "password-is-long-123" });
    assert.equal((await request(app).get(`/api/events/${event._id}`)).status, 200);
    const updated = await agent.put(`/api/admin/events/${event._id}`).set("Origin", config.origin).set("X-CSRF-Token", login.body.csrfToken).send({ ...event, title: "Düzenlenmiş", category: "", mediaIds: event.media.map((m: any) => m.id) });
    assert.equal(updated.status, 200);
    const objectCount = objects.size;
    assert.equal(await importEvent(store.db, storage, admin!._id, source, async () => { throw new Error("Rerun must not download"); }), "skipped");
    assert.equal(objects.size, objectCount);
    assert.equal(await store.db.collection("events").countDocuments(), 2);
    assert.equal((await store.db.collection("events").findOne({ _id: event._id }))!.title, "Düzenlenmiş");
    assert.equal((await store.db.collection("events").findOne({ _id: event._id }))!.version, 2);
    assert.equal((await store.db.collection("events").findOne({ _id: unrelatedId }))!.title, "Mevcut kayıt");
    await cleanupMedia(store.db, storage, new Date(Date.now() + 172_800_000));
    assert.equal(objects.has(event.media[0].key), true);
    objects.delete(event.media[1].key);
    assert.ok((await verifyEvent(store.db, storage, source)).length > 0);
  } finally { await store.close(); }
});
