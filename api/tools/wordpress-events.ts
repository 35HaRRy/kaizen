import { MongoClient } from "mongodb";
import { loadConfig } from "../src/config.js";
import { createStorage } from "../src/media.js";
import { importEvent, loadInventory, verifyEvent } from "../src/wordpress-import.js";

const args = process.argv.slice(2);
if (args.length > 1 || (args[0] && !["--apply", "--verify"].includes(args[0]))) {
  console.error("Kullanım: pnpm -C api events:import [--apply | --verify]");
  process.exit(1);
}
let client: MongoClient | undefined;
try {
  const sources = await loadInventory();
  console.log(JSON.stringify({ events: sources.length, images: sources.reduce((n, s) => n + s.images.length, 0), mode: args[0] ?? "inventory", entries: sources.map(({ images, cover, url, postId, ...fields }) => ({ postId, ...fields, images: images.length })) }, null, 2));
  if (args[0]) {
    const config = loadConfig();
    client = await new MongoClient(config.uri, { serverSelectionTimeoutMS: 10_000 }).connect();
    const db = client.db(config.dbName), storage = createStorage();
    const admins = await db.collection("admins").find({}).project({ _id: 1 }).toArray();
    if (admins.length !== 1) throw new Error("Aktarım için tek mevcut yönetici gerekli; yönetici seçimini açıkça yapılandırın.");
    let created = 0, skipped = 0, failed = 0;
    for (const source of sources) {
      try {
        if (args[0] === "--apply") {
          const result = await importEvent(db, storage, admins[0]._id, source);
          if (result === "created") created++; else skipped++;
          console.log(`${source.postId}: ${result} (${source.images.length} görsel)`);
        } else {
          const errors = await verifyEvent(db, storage, source);
          if (errors.length) { failed++; console.error(`${source.postId}: ${errors.join(" ")}`); }
          else console.log(`${source.postId}: verified (${source.images.length} görsel)`);
        }
      } catch (error) {
        failed++;
        console.error(`${source.postId}: başarısız (${error instanceof Error ? error.name : "Error"}); bağlantıları kontrol edip yeniden çalıştırın.`);
      }
    }
    console.log(JSON.stringify({ created, skipped, failed }));
    if (failed) process.exitCode = 1;
  }
} catch (error) {
  console.error(`Aktarım tamamlanamadı (${error instanceof Error ? error.name : "Error"}). Yapılandırmayı ve kaynak erişimini kontrol edin; sırlar yazdırılmadı.`);
  process.exitCode = 1;
} finally { await client?.close(); }
