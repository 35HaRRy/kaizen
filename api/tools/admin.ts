import { createInterface } from "node:readline/promises";
import { loadConfig } from "../src/config.js";
import { connectDb } from "../src/db.js";
import { createAdmin } from "../src/auth.js";
const { db, client } = await connectDb(loadConfig());
try {
  const input = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const username =
    process.env.ADMIN_USERNAME ?? (await input.question("Kullanıcı adı: "));
  input.close();
  const password = process.env.ADMIN_PASSWORD;
  if (!password)
    throw new Error(
      "ADMIN_PASSWORD ortam değişkeni gerekli (en az 14 karakter).",
    );
  await createAdmin(db, username, password);
  console.log("Yönetici oluşturuldu.");
} catch {
  console.error(
    "Oluşturulamadı. Bilgileri ve mevcut kullanıcıyı kontrol edin.",
  );
  process.exitCode = 1;
} finally {
  await client.close();
}
