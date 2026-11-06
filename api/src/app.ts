import express from 'express';
import type { Db } from 'mongodb';
import type { Config } from './config.js';
import { registerAuth } from './auth.js';
import { errorHandler } from './errors.js';
import { registerEvents } from './events.js';
import { registerMedia } from './media.js';
import { registerForms, type FormServices } from './forms.js';
export function buildApp({db,config,forms}:{db:Db;config:Config;forms?:FormServices}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req,res,next) => {res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}); next();});
  app.use(express.json({limit:'32kb'}));
  registerAuth(app,db,config);
  registerEvents(app,db);
  registerMedia(app,db);
  registerForms(app,db,config,forms);
  app.get('/api/health',(_req,res) => res.json({ok:true}));
  app.use((_req,res) => res.status(404).json({error:{code:'NOT_FOUND',message:'Kayıt bulunamadı.'}}));
  app.use(errorHandler);
  return app;
}
