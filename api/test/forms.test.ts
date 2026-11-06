import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { testDatabase } from './helpers.js';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';
import type { FormServices } from '../src/forms.js';

test('form mail is sent only after hostname/action verification and SMTP acceptance',async()=>{
  const store=await testDatabase(),outbox:object[]=[];
  const config=loadConfig({APP_ORIGIN:'https://kaizen.test',MONGODB_URI:'mongodb://unused',MONGODB_DB:'kaizen_test'});
  let verification={success:false,hostname:'kaizen.test',action:'contact'}, smtpFails=false;
  const forms:FormServices={verify:async()=>verification,send:async mail=>{if(smtpFails)throw new Error('SMTP timeout');outbox.push(mail);}};
  try {
    const app=buildApp({db:store.db,config,forms});
    const send=()=>request(app).post('/api/contact').set('Origin',config.origin).send({name:'Ayşe',email:'ayse@example.com',message:'Bilgi almak istiyorum.',turnstileToken:'test-token',to:'attacker@example.com'});
    assert.equal((await send()).status,400);assert.equal(outbox.length,0);
    verification={success:true,hostname:'evil.test',action:'contact'};
    assert.equal((await send()).status,400);assert.equal(outbox.length,0);
    verification={success:true,hostname:'kaizen.test',action:'trial_request'};
    assert.equal((await send()).status,400);assert.equal(outbox.length,0);
    verification={success:true,hostname:'kaizen.test',action:'contact'};
    smtpFails=true;assert.equal((await send()).status,503);
    smtpFails=false;assert.equal((await send()).status,200);
    assert.equal((outbox[0] as any).to,'kaizenaikidoakademi@gmail.com');
    assert.equal((outbox[0] as any).replyTo,'ayse@example.com');
  } finally {await store.close();}
});
