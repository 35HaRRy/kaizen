import { useId,useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { apiRequest,errorMessage } from '../api';
import { Turnstile } from './Turnstile';
const inputClass='w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500';
export function PublicForm({kind}:{kind:'contact'|'trial'}) {
  const trial=kind==='trial',id=useId();
  const [data,setData]=useState({name:'',fullName:'',phone:'',email:'',message:'',group:'Yetişkinler Grubu (13+ Yaş)',notes:''});
  const [token,setToken]=useState(''),[reset,setReset]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false);
  const field=(key:keyof typeof data,label:string,type='text',maxLength=120)=> <div><label htmlFor={`${id}-${key}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label><input id={`${id}-${key}`} name={key} className={inputClass} required type={type} maxLength={maxLength} value={data[key]} onChange={e=>setData({...data,[key]:e.target.value})}/></div>;
  async function submit(e:React.FormEvent){
    e.preventDefault();if(busy||!token)return;setBusy(true);setError('');
    try {await apiRequest(trial?'/trial-requests':'/contact',{method:'POST',body:JSON.stringify({...data,turnstileToken:token})});setSuccess(true);}
    catch(error){setError(errorMessage(error));}
    finally{setBusy(false);setToken('');setReset(n=>n+1);}
  }
  if(success)return <div role="status" className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center space-y-3"><CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto"/><h4 className="font-bold text-emerald-900 dark:text-emerald-200">{trial?'Kayıt Talebiniz Alındı!':'Mesajınız Alındı!'}</h4><p className="text-sm text-emerald-800 dark:text-emerald-200">{trial?'Deneme dersi saatinizi kesinleştirmek için sizi arayacağız.':'En kısa sürede sizinle iletişime geçeceğiz.'}</p></div>;
  return <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
    {field(trial?'fullName':'name',trial?'Ad Soyad':'Adınız Soyadınız')}
    {trial&&field('phone','Telefon Numarası','tel',30)}
    {field('email',trial?'E-posta':'E-posta Adresiniz','email',254)}
    {trial&&<div><label htmlFor={`${id}-group`} className="block text-xs font-semibold mb-1.5">Yaş / Eğitim Grubu</label><select id={`${id}-group`} className={inputClass} value={data.group} onChange={e=>setData({...data,group:e.target.value})}>{['Minikler Grubu (5-7 Yaş)','Çocuklar Grubu (7-13 Yaş)','Yetişkinler Grubu (13+ Yaş)'].map(group=><option key={group}>{group}</option>)}</select></div>}
    <div><label htmlFor={`${id}-message`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{trial?'Notunuz (isteğe bağlı)':'Mesajınız'}</label><textarea id={`${id}-message`} rows={4} maxLength={5000} required={!trial} className={inputClass} value={trial?data.notes:data.message} onChange={e=>setData({...data,[trial?'notes':'message']:e.target.value})}/></div>
    <Turnstile key={reset} action={trial?'trial_request':'contact'} onToken={setToken}/>
    {error&&<p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
    <button type="submit" disabled={busy||!token} className="w-full py-4 text-center text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider">{busy?'Gönderiliyor…':trial?'Ücretsiz Randevu Oluştur':'Mesaj Gönder'}</button>
  </form>;
}
