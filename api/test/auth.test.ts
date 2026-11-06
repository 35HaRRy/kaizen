import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { testDatabase } from './helpers.js';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createAdmin } from '../src/auth.js';

test('production configuration never falls back to local database', () => {
  assert.throws(() => loadConfig({NODE_ENV:'production'}), /MONGODB_URI/);
});

test('admin sessions enforce origin, CSRF, expiry and logout', async () => {
  const store = await testDatabase();
  try {
    const config = loadConfig({APP_ORIGIN:'http://localhost:3000',MONGODB_URI:'mongodb://unused',MONGODB_DB:'kaizen_test'});
    await createAdmin(store.db, 'sensei', 'A-long-unique-password-123!');
    await assert.rejects(createAdmin(store.db, 'sensei', 'other-password-123!'));
    const app = buildApp({db:store.db,config});
    const agent = request.agent(app);
    assert.equal((await agent.get('/api/auth/session')).status,401);
    assert.equal((await agent.post('/api/auth/login').set('Origin','https://evil.test').send({username:'sensei',password:'A-long-unique-password-123!'})).status,403);
    assert.equal((await agent.post('/api/auth/login').set('Origin',config.origin).send({username:'sensei',password:'wrong'})).status,401);
    const login = await agent.post('/api/auth/login').set('Origin',config.origin).send({username:'sensei',password:'A-long-unique-password-123!'});
    assert.equal(login.status,200);
    assert.match(login.headers['set-cookie'][0], /HttpOnly/);
    assert.equal((await agent.get('/api/auth/session')).body.username,'sensei');
    assert.equal((await agent.post('/api/auth/logout').set('Origin',config.origin)).status,403);
    assert.equal((await agent.post('/api/auth/logout').set('Origin',config.origin).set('X-CSRF-Token',login.body.csrfToken)).status,204);
    assert.equal((await agent.get('/api/auth/session')).status,401);
    const again = await agent.post('/api/auth/login').set('Origin',config.origin).send({username:'sensei',password:'A-long-unique-password-123!'});
    assert.equal(again.status,200);
    await store.db.collection('sessions').updateMany({},{$set:{expiresAt:new Date(0)}});
    assert.equal((await agent.get('/api/auth/session')).status,401);
  } finally { await store.close(); }
});
