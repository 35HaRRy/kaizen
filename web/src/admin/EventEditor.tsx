import { useEffect,useState } from 'react';
import { ArrowLeft,Check,Save,RotateCcw } from 'lucide-react';
import type { EventItem } from '../../../shared/events';
import { apiRequest,ApiError,errorMessage,uploadMedia } from '../api';
import { EventGallery } from '../components/EventGallery';
import { EventFields } from './EventFields';
import { MediaStrip } from './MediaStrip';
export function EventEditor({eventId,onDirtyChange}:{eventId:string;onDirtyChange?:(dirty:boolean)=>void}) {
  const [snapshot,setSnapshot]=useState<EventItem>(),[draft,setDraft]=useState<EventItem>(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[saved,setSaved]=useState(false),[conflict,setConflict]=useState(false),[retry,setRetry]=useState(0);
  const dirty=!!draft&&JSON.stringify(draft)!==JSON.stringify(snapshot);
  useEffect(()=>{let active=true;setError('');apiRequest<EventItem>(`/events/${eventId}`).then(event=>{if(active){setSnapshot(event);setDraft(event);setConflict(false);}}).catch(error=>{if(active)setError(errorMessage(error));});return()=>{active=false;};},[eventId,retry]);
  useEffect(()=>{onDirtyChange?.(dirty||uploading);const guard=(e:BeforeUnloadEvent)=>{if(dirty||uploading){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>{window.removeEventListener('beforeunload',guard);onDirtyChange?.(false);};},[dirty,uploading,onDirtyChange]);
  async function save(e:React.FormEvent){
    e.preventDefault();if(!draft||busy||uploading)return;setBusy(true);setError('');setSaved(false);
    try {const event=await apiRequest<EventItem>(`/admin/events/${eventId}`,{method:'PUT',body:JSON.stringify({...draft,mediaIds:draft.media.map(m=>m.id)})});setSnapshot(event);setDraft(event);setSaved(true);setConflict(false);}
    catch(error){setError(errorMessage(error));setConflict(error instanceof ApiError&&error.status===409);}
    finally{setBusy(false);}
  }
  async function addFiles(files:File[]){
    if(!draft||uploading||busy)return;
    if(draft.media.length+files.length>50){setError('Bir etkinliğe en fazla 50 medya eklenebilir.');return;}
    setUploading(true);setError('');setSaved(false);const failures:string[]=[];
    for(const file of files){try{const media=await uploadMedia(file);setDraft(current=>current?{...current,media:[...current.media,media],coverMediaId:current.coverMediaId??(media.kind==='image'?media.id:null)}:current);}catch(error){failures.push(`${file.name}: ${errorMessage(error)}`);}}
    if(failures.length)setError(failures.join('\n'));setUploading(false);
  }
  if(!draft)return <div className="admin-empty">{error?<><p role="alert">{error}</p><button type="button" className="admin-button" onClick={()=>setRetry(n=>n+1)}>Yeniden dene</button></>:<p role="status">Etkinlik yükleniyor…</p>}</div>;
  return <form onSubmit={save} className="editor-form">
    <div className="admin-page-heading"><div><a className="admin-back" href="/admin"><ArrowLeft size={16}/> Etkinliklere dön</a><h1>Bir anı düzenleyin.</h1><p>Metinlerin üzerine tıklayın. Ziyaretçinin göreceği haliyle çalışın.</p></div><span className="draft-status"><span/>{dirty?'Kaydedilmemiş değişiklikler':'Tüm değişiklikler kaydedildi'}</span></div>
    <EventGallery event={draft} renderFields={()=><EventFields inline disabled={busy} value={draft} onChange={fields=>{setDraft({...draft,...fields});setSaved(false);}}/>} renderThumbnails={(selectedId,onSelect)=><MediaStrip media={draft.media} coverId={draft.coverMediaId} selectedId={selectedId} onSelect={onSelect} onChange={(media,coverMediaId)=>{setDraft({...draft,media,coverMediaId});setSaved(false);}} onUpload={addFiles} busy={busy||uploading}/>}/>
    <div className="editor-save-bar"><div aria-live="polite">{error&&<p role="alert" className="admin-error">{error}</p>}{saved&&<p className="admin-success"><Check size={16}/> Etkinlik kaydedildi.</p>}{uploading&&<p role="status">Dosyalar yükleniyor ve doğrulanıyor…</p>}{!error&&!saved&&!uploading&&<p>Değişiklikleriniz kaydedilene kadar yayına yansımaz.</p>}</div><div className="save-actions">{conflict&&<button type="button" className="admin-button secondary" onClick={()=>{if(window.confirm('Kaydedilmemiş değişiklikleriniz silinecek. Güncel kaydı yüklemek istiyor musunuz?'))setRetry(n=>n+1);}}><RotateCcw size={16}/>Güncel kaydı yükle</button>}<button type="submit" className="admin-button" disabled={!dirty||busy||uploading}><Save size={16}/>{busy?'Kaydediliyor…':'Kaydet'}</button></div></div>
  </form>;
}
