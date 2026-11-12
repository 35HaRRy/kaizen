import { test } from "node:test";
import assert from "node:assert/strict";
import { publicMedia } from "../src/media-url.js";
import type { MediaItem } from "../../shared/events.js";

const media: MediaItem = {
  id: "e49065316dc0ae827c52c736",
  key: "media/e49065316dc0ae827c52c736",
  kind: "image", mime: "image/jpeg", size: 20, originalName: "dojo.jpg",
  url: "https://old.r2.dev/media/e49065316dc0ae827c52c736",
};
test("current media origin replaces stored URLs without mutating records", () => {
  const result = publicMedia(media, "https://kaizen-media.example.workers.dev/");
  assert.equal(result.url, `https://kaizen-media.example.workers.dev/${media.key}`);
  assert.equal(media.url, `https://old.r2.dev/${media.key}`);
  assert.equal(publicMedia(media, ""), media);
});
test("media origin rejects non-HTTPS or non-origin configuration", () => {
  for (const origin of ["http://media.test", "https://media.test/path", "https://user:pass@media.test", "https://media.test?bad=1"]) {
    assert.throws(() => publicMedia(media, origin));
  }
});
