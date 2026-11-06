import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { testDatabase } from './helpers.js';
import { validateUpload, completeUpload, type ObjectStorage } from '../src/media.js';
import { cleanupMedia } from '../src/media-cleanup.js';

test('uploads reject excessive size, MIME spoofing and foreign ownership',async()=>{
  assert.throws(()=>validateUpload({name:'big.jpg',mime:'image/jpeg',size:10_000_001}));
  assert.throws(()=>validateUpload({name:'big.mp4',mime:'video/mp4',size:100_000_001}));
  const store=await testDatabase(),owner=new ObjectId(),id=new ObjectId();
  const objects=new Map<string,Buffer>([['staging/a',Buffer.from('<html>not an image</html>')]]);
  const storage=fakeStorage(objects);
  try {
    await store.db.collection('uploads').insertOne({_id:id,adminId:owner,state:'pending',key:'media/a',stagingKey:'staging/a',mime:'image/jpeg',size:24,originalName:'a.jpg',createdAt:new Date()});
    await assert.rejects(completeUpload(store.db,storage,id,new ObjectId()), /Dosya/);
    await assert.rejects(completeUpload(store.db,storage,id,owner), /Dosya/);
    assert.equal(objects.has('media/a'),false);
  } finally {await store.close();}
});

test('cleanup preserves live references and retries failed object deletion',async()=>{
  const store=await testDatabase(),live=new ObjectId(),orphan=new ObjectId(),pending=new ObjectId();
  const objects=new Map<string,Buffer>([['media/live',Buffer.from('a')],['media/orphan',Buffer.from('b')],['staging/pending',Buffer.from('c')]]);
  const storage=fakeStorage(objects);
  let fail=true;
  const remove=storage.remove;
  storage.remove=async key=>{if(key==='media/orphan'&&fail)throw new Error('R2 down');await remove(key);};
  try {
    const old=new Date(Date.now()-172_800_000);
    await store.db.collection('uploads').insertMany([
      {_id:live,key:'media/live',state:'attached',createdAt:old},
      {_id:orphan,key:'media/orphan',state:'verified',createdAt:old},
      {_id:pending,key:'media/pending',stagingKey:'staging/pending',state:'pending',createdAt:old},
    ]);
    await store.db.collection('events').insertOne({media:[{id:live.toHexString()}]});
    assert.equal((await cleanupMedia(store.db,storage,new Date())).failed,1);
    assert.equal(objects.has('media/live'),true);
    assert.equal(objects.has('staging/pending'),false);
    fail=false;await cleanupMedia(store.db,storage,new Date());
    assert.equal(objects.has('media/orphan'),false);
  } finally {await store.close();}
});
function fakeStorage(objects:Map<string,Buffer>):ObjectStorage {
  return {publicOrigin:'https://media.test',sign:async()=>({url:'https://upload.test',headers:{}}),
    inspect:async key=>{const b=objects.get(key);if(!b)throw new Error('missing');return {size:b.length,etag:'etag',bytes:b};},
    freeze:async(source,key)=>{objects.set(key,objects.get(source)!);},remove:async key=>{objects.delete(key);}};
}
