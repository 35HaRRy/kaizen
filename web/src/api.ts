import type { MediaItem } from '../../shared/events';
let csrfToken='';
export function setCsrfToken(token:string){csrfToken=token;}
export class ApiError extends Error {
  constructor(public status:number,public code:string,message:string){super(message);}
}
export async function apiRequest<T>(path:string,options:RequestInit={}):Promise<T> {
  const response=await fetch(`/api${path}`,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...(csrfToken?{'X-CSRF-Token':csrfToken}:{}),...options.headers}});
  if(response.status===204)return undefined as T;
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new ApiError(response.status,data?.error?.code??'REQUEST',data?.error?.message??'İşlem tamamlanamadı. Lütfen yeniden deneyin.');
  return data;
}
export async function uploadMedia(file:File):Promise<MediaItem> {
  const mime=file.type;
  if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(mime)||file.size<1||file.size>(mime.startsWith('image/')?10_000_000:100_000_000))throw new Error('Resimler en fazla 10 MB, videolar 100 MB olmalı. JPEG, PNG, WebP, MP4 ve WebM desteklenir.');
  const signed=await apiRequest<{uploadId:string;url:string;headers:Record<string,string>}>('/admin/media/uploads',{method:'POST',body:JSON.stringify({name:file.name,size:file.size,mime})});
  const result=await fetch(signed.url,{method:'PUT',headers:signed.headers,body:file});
  if(!result.ok)throw new Error('Dosya yüklenemedi. Bağlantınızı kontrol edin.');
  return apiRequest<MediaItem>(`/admin/media/uploads/${signed.uploadId}/complete`,{method:'POST',body:'{}'});
}
export function errorMessage(error:unknown){return error instanceof Error?error.message:'İşlem tamamlanamadı. Lütfen yeniden deneyin.';}
