import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import { testDatabase } from './helpers.js';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createAdmin } from '../src/auth.js';

test('events validate media, real calendar dates and optimistic versions',async () => {
  const store=await testDatabase();
  try {
    const config=loadConfig({APP_ORIGIN:'http://localhost:3000',MONGODB_URI:'mongodb://unused',MONGODB_DB:'kaizen_test'});
    await createAdmin(store.db,'sensei','password-is-long-123');
    const admin=await store.db.collection('admins').findOne({username:'sensei'});
    const mediaId=new ObjectId().toHexString();
    await store.db.collection('uploads').insertOne({_id:new ObjectId(mediaId),key:'media/a.jpg',adminId:admin!._id,state:'verified',createdAt:new Date(),media:{id:mediaId,key:'media/a.jpg',kind:'image',mime:'image/jpeg',size:200,originalName:'a.jpg',url:'https://media.test/a.jpg'}});
    const app=buildApp({db:store.db,config}), agent=request.agent(app);
    const login=await agent.post('/api/auth/login').set('Origin',config.origin).send({username:'sensei',password:'password-is-long-123'});
    const send=(method:'post'|'put',path:string,body:object)=>agent[method](path).set('Origin',config.origin).set('X-CSRF-Token',login.body.csrfToken).send(body);
    const input={category:'Seminerler',date:'2026-11-06',title:'Seminer',description:'Birlikte çalışma',location:'Dojo',mediaIds:[mediaId],coverMediaId:mediaId};
    assert.equal((await send('post','/api/admin/events',{...input,date:'2026-02-30'})).status,400);
    assert.equal((await send('post','/api/admin/events',{...input,category:'Other'})).status,400);
    assert.equal((await send('post','/api/admin/events',{...input,mediaIds:[mediaId,mediaId]})).status,400);
    assert.equal((await send('post','/api/admin/events',{...input,mediaIds:[new ObjectId().toHexString()]})).status,400);
    const created=await send('post','/api/admin/events',input);
    assert.equal(created.status,201);
    assert.equal(created.body.media[0].id,mediaId);
    const path=`/api/admin/events/${created.body.id}`;
    const first=await send('put',path,{...input,title:'Yeni',version:1});
    assert.equal(first.status,200);
    assert.equal((await send('put',path,{...input,title:'Eski',version:1})).status,409);
    assert.equal((await request(app).get(`/api/events/${created.body.id}`)).body.title,'Yeni');
    assert.equal((await send('put',path,{...input,mediaIds:[],coverMediaId:null,version:2})).status,200);
    assert.equal((await request(app).get('/api/events')).body.events.length,1);
    assert.equal((await request(app).get('/api/events?category=Dojo%20ya%C5%9Fam%C4%B1')).body.events.length,0);
    assert.equal((await request(app).get('/api/events/bad-id')).status,404);
    assert.equal((await request(app).delete(path).set('Origin',config.origin)).status,401);
  } finally {await store.close();}
});
