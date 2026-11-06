import nodemailer from 'nodemailer';
import type { Express } from 'express';
import type { Db } from 'mongodb';
import type { Config } from './config.js';
import { HttpError,text } from './errors.js';
import { rateLimit } from './rate-limit.js';
interface Mail {to:string;replyTo:string;subject:string;text:string}
export interface FormServices {
  verify(token:string):Promise<{success:boolean;hostname?:string;action?:string}>;
  send(mail:Mail):Promise<void>;
}
export function createFormServices(env=process.env):FormServices {
  return {
    async verify(token) {
      if(!env.TURNSTILE_SECRET_KEY)throw new HttpError(503,'TURNSTILE','Güvenlik servisi yapılandırılmamış.');
      const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token}),signal:AbortSignal.timeout(10_000)});
      if(!response.ok)throw new Error('Turnstile unavailable');
      return response.json();
    },
    async send(mail) {
      const port=Number(env.SMTP_PORT);
      if(!env.SMTP_HOST||!env.SMTP_FROM||!Number.isInteger(port)||port<1||port>65535||!['true','false'].includes(env.SMTP_SECURE??'')||!!env.SMTP_USER!==!!env.SMTP_PASS)throw new Error('SMTP configuration invalid');
      const secure=env.SMTP_SECURE==='true';
      const transport=nodemailer.createTransport({host:env.SMTP_HOST,port,secure,requireTLS:!secure,auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASS}:undefined,connectionTimeout:10_000,greetingTimeout:10_000,socketTimeout:15_000,disableFileAccess:true,disableUrlAccess:true,logger:false,debug:false});
      try {const result=await transport.sendMail({...mail,from:env.SMTP_FROM});if(!result.accepted.length||result.rejected.length)throw new Error('Rejected');}
      finally{transport.close();}
    },
  };
}
export function registerForms(app:Express,db:Db,config:Config,services:FormServices=createFormServices()) {
  for(const trial of [false,true])app.post(trial?'/api/trial-requests':'/api/contact',async(req,res)=>{
    await rateLimit(db,req,config,'forms',5);
    const body=req.body??{},name=text(trial?body.fullName:body.name,120),email=text(body.email,254);
    if(!/^[^\s@<>(),;:\\"]+@[^\s@<>(),;:\\"]+\.[^\s@<>(),;:\\"]+$/.test(email)||/[\r\n]/.test(email))throw new HttpError(400,'EMAIL','E-posta adresini kontrol edin.');
    let content:string;
    if(trial) {
      const phone=text(body.phone,30,7),group=text(body.group,80);
      if(!/^[+\d\s()\-]+$/.test(phone)||!['Minikler Grubu (5-7 Yaş)','Çocuklar Grubu (7-13 Yaş)','Yetişkinler Grubu (13+ Yaş)'].includes(group))throw new HttpError(400,'VALIDATION','Telefon ve eğitim grubunu kontrol edin.');
      content=`Ad soyad: ${name}\nE-posta: ${email}\nTelefon: ${phone}\nGrup: ${group}\nNot: ${text(body.notes??'',5000,0)}\n\nBu bir deneme dersi talebidir; kesinleşmiş randevu değildir.`;
    } else content=`Ad soyad: ${name}\nE-posta: ${email}\n\nMesaj:\n${text(body.message,5000)}`;
    const token=text(body.turnstileToken,2048);
    let result;
    try {result=await services.verify(token);}catch{throw new HttpError(503,'TURNSTILE','Güvenlik servisine ulaşılamıyor. Lütfen yeniden deneyin.');}
    if(result.success!==true||result.hostname!==new URL(config.origin).hostname||result.action!==(trial?'trial_request':'contact'))throw new HttpError(400,'TURNSTILE','Güvenlik doğrulaması başarısız. Lütfen yeniden deneyin.');
    try {await services.send({to:'kaizenaikidoakademi@gmail.com',replyTo:email,subject:trial?'Kaizen — Ücretsiz deneme dersi talebi':'Kaizen — Web sitesi iletişim mesajı',text:content});}
    catch{throw new HttpError(503,'MAIL','Mesaj gönderilemedi. Lütfen yeniden deneyin veya telefonla ulaşın.');}
    res.json({ok:true});
  });
}
