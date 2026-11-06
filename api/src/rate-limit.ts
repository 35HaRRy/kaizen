import { createHash } from 'node:crypto';
import type { Request } from 'express';
import type { Db } from 'mongodb';
import type { Config } from './config.js';
import { HttpError } from './errors.js';
export async function rateLimit(db: Db, req: Request, config: Config, scope: string, max: number) {
  // Vercel overwrites x-real-ip; do not trust client-supplied forwarded headers locally.
  const ip = config.vercel ? req.get('x-real-ip') ?? 'unknown' : req.socket.remoteAddress ?? 'unknown';
  const window = Math.floor(Date.now() / 900_000);
  const _id = createHash('sha256').update(`${scope}:${ip}:${window}`).digest('hex');
  const limits = db.collection<{_id:string;count:number;expiresAt:Date}>('limits');
  const record = await limits.findOneAndUpdate({_id},{$inc:{count:1},$setOnInsert:{expiresAt:new Date((window+2)*900_000)}},{upsert:true,returnDocument:'after'});
  if (record!.count > max) throw new HttpError(429,'RATE_LIMIT','Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.');
}
