import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { ensureIndexes } from "../src/db.js";

export async function testDatabase() {
  const server = process.env.TEST_MONGODB_URI
    ? null
    : await MongoMemoryServer.create();
  const client = await new MongoClient(
    process.env.TEST_MONGODB_URI ?? server!.getUri(),
  ).connect();
  const db = client.db(`kaizen_test_${randomUUID().replaceAll("-", "")}`);
  await ensureIndexes(db);
  return {
    db,
    async close() {
      await db.dropDatabase();
      await client.close();
      await server?.stop();
    },
  };
}
