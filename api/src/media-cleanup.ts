import type { Db } from "mongodb";
import type { ObjectStorage } from "./media.js";
export async function cleanupMedia(db: Db, storage: ObjectStorage, now: Date) {
  let removed = 0,
    failed = 0;
  const uploads = db.collection("uploads"),
    cutoff = new Date(now.getTime() - 86_400_000);
  const cursor = uploads.find({
    createdAt: { $lt: cutoff },
    $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lt: now } }],
  });
  for await (const record of cursor) {
    const live = await db
      .collection("events")
      .findOne({ "media.id": record._id.toHexString() });
    if (live) {
      try {
        if (record.stagingKey) await storage.remove(record.stagingKey);
        await uploads.updateOne(
          { _id: record._id },
          { $set: { state: "attached" }, $unset: { stagingKey: "" } },
        );
      } catch {
        failed++;
      }
      continue;
    }
    const claim = await uploads.updateOne(
      {
        _id: record._id,
        state: record.state,
        $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lt: now } }],
      },
      { $set: { state: "deleting" } },
    );
    if (!claim.matchedCount) continue;
    // Event saves can only claim verified/attached states; no new references after this claim.
    if (
      await db
        .collection("events")
        .findOne({ "media.id": record._id.toHexString() })
    ) {
      await uploads.updateOne(
        { _id: record._id },
        { $set: { state: "attached" } },
      );
      continue;
    }
    try {
      await storage.remove(record.key);
      if (record.stagingKey) await storage.remove(record.stagingKey);
      await uploads.deleteOne({ _id: record._id, state: "deleting" });
      removed++;
    } catch {
      failed++;
    }
  }
  return { removed, failed };
}
