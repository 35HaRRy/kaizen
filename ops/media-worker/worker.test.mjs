import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";

const key = "media/e49065316dc0ae827c52c736";
const url = `https://media.test/${key}`;
function bucket() {
  const metadata = {
    size: 6,
    httpEtag: '"version-1"',
    uploaded: new Date("2026-11-12T00:00:00Z"),
    writeHttpMetadata(headers) { headers.set("Content-Type", "video/mp4"); },
  };
  return {
    async head(k) { assert.equal(k, key); return metadata; },
    async get(k, options) {
      assert.equal(k, key);
      const range = options?.range;
      const content = range ? "abcdef".slice(range.offset, range.offset + range.length) : "abcdef";
      return { ...metadata, body: new Blob([content]).stream() };
    },
  };
}
const request = (options) => new Request(url, options);
test("streams finalized media with safe metadata and browser caching", async () => {
  const response = await worker.fetch(request(), { MEDIA: bucket() });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "abcdef");
  assert.equal(response.headers.get("Content-Type"), "video/mp4");
  assert.equal(response.headers.get("Content-Length"), "6");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.match(response.headers.get("Cache-Control"), /immutable/);
});
test("HEAD and ETag revalidation return no body", async () => {
  const env = { MEDIA: bucket() };
  const head = await worker.fetch(request({ method: "HEAD" }), env);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  const cached = await worker.fetch(request({ headers: { "If-None-Match": 'W/"version-1"' } }), env);
  assert.equal(cached.status, 304);
  assert.equal(await cached.text(), "");
});
test("video reads support bounded, open-ended and suffix ranges", async () => {
  for (const [range, body, contentRange] of [
    ["bytes=1-3", "bcd", "bytes 1-3/6"],
    ["bytes=4-", "ef", "bytes 4-5/6"],
    ["bytes=-2", "ef", "bytes 4-5/6"],
    ["bytes=4-99", "ef", "bytes 4-5/6"],
  ]) {
    const response = await worker.fetch(request({ headers: { Range: range } }), { MEDIA: bucket() });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("Content-Range"), contentRange);
    assert.equal(response.headers.get("Content-Length"), String(body.length));
    assert.equal(await response.text(), body);
  }
});
test("invalid ranges return 416, stale If-Range returns the full object", async () => {
  for (const range of ["bytes=9-", "bytes=3-1", "bytes=-0", "bytes=0-1,3-4", "garbage"]) {
    const response = await worker.fetch(request({ headers: { Range: range } }), { MEDIA: bucket() });
    assert.equal(response.status, 416);
    assert.equal(response.headers.get("Content-Range"), "bytes */6");
  }
  const response = await worker.fetch(request({ headers: { Range: "bytes=1-2", "If-Range": '"old"' } }), { MEDIA: bucket() });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "abcdef");
});
test("rejects private paths and writes without accessing storage", async () => {
  for (const path of ["staging/secret", "media/invalid", "", `${key}/extra`]) {
    assert.equal((await worker.fetch(new Request(`https://media.test/${path}`), {})).status, 404);
  }
  const response = await worker.fetch(request({ method: "PUT", body: "bad" }), {});
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, HEAD");
});
test("missing objects and storage outages are not cached", async () => {
  for (const [head, status] of [[async () => null, 404], [async () => { throw new Error("private detail"); }, 503]]) {
    const response = await worker.fetch(request(), { MEDIA: { head } });
    assert.equal(response.status, status);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.doesNotMatch(await response.text(), /private detail/);
  }
});
