import { MongoClient, type Db } from 'mongodb';
import type { Config } from './config.js';
export async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection('admins').createIndex({username:1},{unique:true}),
    db.collection('sessions').createIndex({tokenHash:1},{unique:true}),
    db.collection('sessions').createIndex({expiresAt:1},{expireAfterSeconds:0}),
    db.collection('limits').createIndex({expiresAt:1},{expireAfterSeconds:0}),
    db.collection('events').createIndex({date:-1,_id:-1}),
    db.collection('uploads').createIndex({key:1},{unique:true}),
    db.collection('uploads').createIndex({state:1,createdAt:1}),
  ]);
}
export async function connectDb(config: Config) {
  const client = new MongoClient(config.uri,{maxPoolSize:5,minPoolSize:0,maxIdleTimeMS:10_000,serverSelectionTimeoutMS:10_000});
  await client.connect();
  try { const db = client.db(config.dbName); await ensureIndexes(db); return {db,client}; }
  catch (error) { await client.close(); throw error; }
}
