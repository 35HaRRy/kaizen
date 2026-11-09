import { createHash } from "node:crypto";
import { ObjectId, type Db } from "mongodb";
import { fileTypeFromBuffer } from "file-type";
import { validateEvent } from "./events.js";
import { completeUpload, validateUpload, type ObjectStorage } from "./media.js";
import type { EventInput, MediaItem } from "../../shared/events.js";

export const wordpressOrigin = "https://kaizenaikidoakademi.wordpress.com";
const apiOrigin = "https://public-api.wordpress.com";
interface Post {
  ID: number;
  URL: string;
  title: string;
  date: string;
  featured_image: string;
  content: string;
}
interface Listing {
  id: number;
  url: string;
  title: string;
  date: string;
  cover: string;
}
export interface SourceEvent {
  postId: number;
  url: string;
  title: string;
  date: string;
  category: EventInput["category"];
  description: string;
  location: string;
  cover: string;
  images: string[];
}
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function plain(value: string) {
  const entities: Record<string, string> = {
    amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
    ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", hellip: "…",
  };
  return value.replace(/<[^>]*>/g, "").replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (_, code: string) => {
    if (code.startsWith("#")) return String.fromCodePoint(code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
    check(code in entities, "Bilinmeyen HTML karakteri.");
    return entities[code];
  }).replace(/\s+/g, " ").trim();
}
function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? plain(match[2]) : "";
}
function sourceUrl(value: string, image = false) {
  const url = new URL(value, wordpressOrigin);
  check(url.origin === wordpressOrigin && !url.username && !url.password, "Kaynak adresine izin verilmiyor.");
  check(!image || url.pathname.startsWith("/wp-content/uploads/"), "Kaynak görsel adresi geçersiz.");
  url.search = "";
  url.hash = "";
  return url.href;
}
function dateOnly(value: string) {
  const date = value.slice(0, 10);
  check(/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date, "Kaynak tarihi geçersiz.");
  return date;
}
export function parseListing(html: string): { entries: Listing[]; next: string | null } {
  const entries: Listing[] = [];
  // shortcut: WordPress'in mevcut post blokları ayrıştırılır; tema değişirse DOM ayrıştırıcıya geçmeden önce hata verir.
  for (const match of html.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)) {
    const classes = attribute(match[1], "class");
    if (!classes.split(/\s+/).includes("wp-block-post")) continue;
    const id = classes.match(/(?:^|\s)post-(\d+)(?:\s|$)/)?.[1];
    const body = match[2];
    const heading = body.match(/<h\d\b[^>]*>([\s\S]*?)<\/h\d>/i)?.[1];
    const anchor = heading?.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    const image = body.match(/<img\b[^>]*>/i)?.[0];
    const time = body.match(/<time\b[^>]*>/i)?.[0];
    check(id && anchor && image && time, "Etkinlik listesi biçimi değişmiş veya alanlar eksik.");
    entries.push({
      id: Number(id), url: sourceUrl(attribute(anchor[1], "href")), title: plain(anchor[2]),
      date: dateOnly(attribute(time, "datetime")),
      cover: sourceUrl(attribute(image, "data-orig-file") || attribute(image, "src"), true),
    });
  }
  check(entries.length, "Etkinlik listesi boş veya ayrıştırılamadı.");
  const nextTag = [...html.matchAll(/<a\b[^>]*>/gi)].find((m) => attribute(m[0], "class").split(/\s+/).includes("wp-block-query-pagination-next"))?.[0];
  const next = nextTag ? new URL(attribute(nextTag, "href"), wordpressOrigin) : null;
  check(!next || (next.origin === wordpressOrigin && next.pathname === "/etkinlikler/"), "Sonraki sayfa adresi geçersiz.");
  return { entries, next: next?.href ?? null };
}
export function mapPost(post: Post, listing: Listing): SourceEvent {
  check(post.ID === listing.id && sourceUrl(post.URL) === listing.url, "Liste ve galeri kimlikleri uyuşmuyor.");
  check(!/<(?:video|audio|iframe)\b/i.test(post.content), "Desteklenmeyen galeri içeriği var; elle inceleyin.");
  const images = [...new Set([...post.content.matchAll(/<img\b[^>]*>/gi)].map((m) => {
    const src = attribute(m[0], "data-orig-file") || attribute(m[0], "src");
    check(src, "Galeri görselinin adresi eksik.");
    return sourceUrl(src, true);
  }))];
  check(images.length, "Galeri boş; etkinlik aktarılmadı.");
  const title = plain(listing.title), location = ["İstanbul", "Ankara", "İzmir", "Çanakkale"].find((city) => title.toLocaleLowerCase("tr-TR").includes(city.toLocaleLowerCase("tr-TR"))) ?? "İstanbul";
  const lower = title.toLocaleLowerCase("tr-TR");
  const category: SourceEvent["category"] = /kyu|sınav/.test(lower) ? "Kyu sınavları" : /çocuk|minik/.test(lower) ? "Çocuk etkinlikleri" : /seminer/.test(lower) ? "Seminerler" : /antrenman|dojo/.test(lower) ? "Dojo yaşamı" : "";
  const subject = category === "Kyu sınavları" ? (/çocuk|minik/.test(lower) ? "Çocuk Kyu sınavından" : "Kyu sınavından") : category === "Dojo yaşamı" ? "Aikido antrenmanından" : category === "Çocuk etkinlikleri" ? "Çocuk etkinliğinden" : category === "Seminerler" ? "Aikido seminerinden" : "Aikido buluşmasından";
  const description = `${title}: ${location} konumundaki ${subject.toLocaleLowerCase("tr-TR")} kareler.`;
  const cover = sourceUrl(listing.cover, true);
  if (!images.includes(cover)) images.unshift(cover);
  check(images.length <= 50, "Galeri mevcut 50 medya sınırını aşıyor.");
  const { mediaIds: _, coverMediaId: __, ...fields } = validateEvent({ title, category, date: dateOnly(listing.date), description, location, mediaIds: [], coverMediaId: null });
  return { postId: post.ID, url: listing.url, ...fields, cover, images };
}
async function get(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(60_000), redirect: "error" });
  check(response.ok, `Kaynak isteği başarısız (HTTP ${response.status}).`);
  return response;
}
export async function loadInventory(fetcher: typeof fetch = fetch): Promise<SourceEvent[]> {
  const posts = new Map<number, Post>();
  let found = 0, page = 1;
  do {
    const result = await (await get(`${apiOrigin}/rest/v1.1/sites/kaizenaikidoakademi.wordpress.com/posts/?number=100&page=${page}`, fetcher)).json() as { found: number; posts: Post[] };
    check(Number.isInteger(result.found) && result.found >= 0 && Array.isArray(result.posts), "WordPress yanıtı geçersiz.");
    found = result.found;
    const previous = posts.size;
    for (const post of result.posts) posts.set(post.ID, post);
    check(posts.size > previous || found === 0, "WordPress sayfalaması ilerlemiyor.");
    page++;
  } while (posts.size < found);
  const listings = new Map<number, Listing>(), visited = new Set<string>();
  let next: string | null = `${wordpressOrigin}/etkinlikler/`;
  while (next) {
    check(!visited.has(next), "Liste sayfalaması döngüye girdi.");
    visited.add(next);
    const parsed = parseListing(await (await get(next, fetcher)).text());
    for (const entry of parsed.entries) {
      check(!listings.has(entry.id), "Liste sayfalarında mükerrer etkinlik var.");
      listings.set(entry.id, entry);
    }
    next = parsed.next;
  }
  return [...listings.values()].map((entry) => {
    const post = posts.get(entry.id);
    check(post, "Listedeki etkinlik WordPress API yanıtında bulunamadı.");
    return mapPost(post, entry);
  });
}
function identity(value: string) {
  return new ObjectId(createHash("sha256").update(`kaizen-wordpress:${value}`).digest("hex").slice(0, 24));
}
async function download(url: string, fetcher: typeof fetch) {
  const response = await get(sourceUrl(url, true), fetcher);
  check(Number(response.headers.get("content-length") ?? 0) <= 10_000_000 && response.body, "Kaynak dosya boş veya 10 MB sınırını aşıyor.");
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      check(size <= 10_000_000, "Kaynak dosya 10 MB sınırını aşıyor.");
      chunks.push(chunk.value);
    }
  } finally { await reader.cancel(); }
  const bytes = Buffer.concat(chunks);
  const detected = await fileTypeFromBuffer(bytes);
  check(detected && detected.mime.startsWith("image/"), "Kaynak dosya resim değil.");
  const input = validateUpload({ name: decodeURIComponent(new URL(url).pathname.split("/").at(-1)!).slice(0, 200), mime: detected.mime, size });
  return { bytes, ...input };
}
export async function importEvent(db: Db, storage: ObjectStorage, adminId: ObjectId, source: SourceEvent, fetcher: typeof fetch = fetch): Promise<"created" | "skipped"> {
  const id = identity(source.url), events = db.collection("events"), uploads = db.collection("uploads");
  const existing = await events.findOne({ _id: id });
  if (existing) {
    check(existing.source?.url === source.url, "Hedef etkinlik kimliği çakıştı.");
    return "skipped";
  }
  check(await db.collection("admins").findOne({ _id: adminId }), "Geçerli yönetici bulunamadı.");
  const media: MediaItem[] = [];
  for (const url of source.images) {
    const mediaId = identity(`${source.url}\n${url}`), key = `media/${mediaId}`, stagingKey = `staging/${mediaId}`;
    await uploads.updateOne({ _id: mediaId }, { $setOnInsert: { adminId, state: "pending", key, stagingKey, sourceUrl: url, importEventId: id, createdAt: new Date() } }, { upsert: true });
    const now = new Date();
    const record = await uploads.findOneAndUpdate({
      _id: mediaId, adminId, sourceUrl: url, importEventId: id,
      $or: [{ state: { $in: ["pending", "verified", "attached"] } }, { state: "verifying", leaseUntil: { $lt: now } }],
    }, { $set: { leaseUntil: new Date(now.getTime() + 3_600_000) } }, { returnDocument: "before" });
    check(record, "Dosya başka bir işlemde veya kimliği çakıştı; daha sonra tekrar deneyin.");
    let item: MediaItem;
    if (["verified", "attached"].includes(record.state)) {
      const object = await storage.inspect(key);
      check(object.size === record.media?.size, "Önceden yüklenen dosyanın boyutu uyuşmuyor.");
      item = record.media;
    } else {
      const file = await download(url, fetcher);
      await uploads.updateOne({ _id: mediaId, adminId }, { $set: { state: "pending", createdAt: now, mime: file.mime, size: file.size, originalName: file.name } });
      const signed = await storage.sign(stagingKey, file.mime, file.size);
      const response = await fetcher(signed.url, { method: "PUT", headers: signed.headers, body: file.bytes, signal: AbortSignal.timeout(120_000), redirect: "error" });
      check(response.ok, `R2 yüklemesi başarısız (HTTP ${response.status}).`);
      item = await completeUpload(db, storage, mediaId, adminId);
    }
    const claim = await uploads.updateOne({ _id: mediaId, adminId, state: { $in: ["verified", "attached"] } }, { $set: { leaseUntil: new Date(Date.now() + 3_600_000) } });
    check(claim.matchedCount, "Dosya bakım işlemi tarafından alındı; aktarımı yeniden çalıştırın.");
    media.push(item);
  }
  const input = validateEvent({ ...source, mediaIds: media.map((m) => m.id), coverMediaId: identity(`${source.url}\n${source.cover}`).toHexString() });
  for (const item of media) {
    const attached = await uploads.updateOne({ _id: new ObjectId(item.id), adminId, importEventId: id, state: { $in: ["verified", "attached"] } }, { $set: { state: "attached", eventId: id, leaseUntil: new Date(Date.now() + 3_600_000) } });
    check(attached.matchedCount, "Dosya etkinliğe bağlanamadı.");
  }
  const { mediaIds: _, ...fields } = input, now = new Date().toISOString();
  const result = await events.updateOne({ _id: id }, { $setOnInsert: { ...fields, media, version: 1, createdAt: now, updatedAt: now, source: { site: wordpressOrigin, postId: source.postId, url: source.url } } }, { upsert: true });
  return result.upsertedCount ? "created" : "skipped";
}
export async function verifyEvent(db: Db, storage: ObjectStorage, source: SourceEvent): Promise<string[]> {
  const event = await db.collection("events").findOne({ _id: identity(source.url) });
  if (!event) return ["Etkinlik bulunamadı."];
  const errors: string[] = [];
  for (const field of ["title", "date", "category", "location", "description"] as const) {
    if (event[field] !== source[field]) errors.push(`${field}: kaynakla farklı (sonradan düzenlenmiş olabilir).`);
  }
  if (event.source?.url !== source.url || event.source?.postId !== source.postId) errors.push("Kaynak kimliği farklı.");
  if (event.coverMediaId !== identity(`${source.url}\n${source.cover}`).toHexString()) errors.push("Kapak farklı.");
  if (event.media.length !== source.images.length) errors.push("Galeri sayısı farklı.");
  for (const [index, url] of source.images.entries()) {
    const mediaId = identity(`${source.url}\n${url}`), item = event.media[index];
    const upload = await db.collection("uploads").findOne({ _id: mediaId });
    if (!item || item.id !== mediaId.toHexString() || upload?.sourceUrl !== url || upload?.state !== "attached" || !upload?.eventId?.equals(event._id) || !(await db.collection("admins").findOne({ _id: upload?.adminId }))) {
      errors.push(`Görsel ${index + 1}: sıra veya yükleme bağlantısı farklı.`);
      continue;
    }
    try {
      const object = await storage.inspect(item.key);
      const type = await fileTypeFromBuffer(object.bytes);
      if (object.size !== item.size || type?.mime !== item.mime || item.url !== `${storage.publicOrigin}/${item.key}`) errors.push(`Görsel ${index + 1}: nesne doğrulaması başarısız.`);
    } catch { errors.push(`Görsel ${index + 1}: R2 nesnesine erişilemiyor.`); }
  }
  return errors;
}
