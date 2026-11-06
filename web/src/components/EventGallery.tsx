import { useState,type ReactNode } from 'react';
import { Calendar,MapPin,ChevronLeft,ChevronRight,Play } from 'lucide-react';
import type { EventItem,MediaItem } from '../../../shared/events';
export function formatDate(date:string){return new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));}
export function MediaThumbnail({media}:{media:MediaItem}) {return media.kind==='image'?<img src={media.url} alt="" loading="lazy"/>:<span className="video-thumb"><Play size={22}/><span>Video</span></span>;}
export function EventGallery({event,renderFields,renderThumbnails}:{event:EventItem;renderFields?:()=>ReactNode;renderThumbnails?:(selectedId:string|undefined,onSelect:(id:string)=>void)=>ReactNode}) {
  const [selectedId,setSelectedId]=useState<string>();
  const selected=event.media.find(m=>m.id===selectedId)??event.media[0];
  const index=selected?event.media.findIndex(m=>m.id===selected.id):-1;
  const move=(delta:number)=>setSelectedId(event.media[(index+delta+event.media.length)%event.media.length].id);
  return <div className="event-gallery">
    {renderFields?renderFields():<header className="event-heading"><span className="event-category">{event.category}</span><h2>{event.title}</h2><div className="event-facts"><span><Calendar size={16}/>{formatDate(event.date)}</span><span><MapPin size={16}/>{event.location}</span></div><p>{event.description}</p></header>}
    <div className="event-stage">
      {!selected?<p>Henüz eklenmiş bir görsel bulunmuyor</p>:selected.kind==='image'?<img src={selected.url} alt={event.title}/>:<video key={selected.id} aria-label={`${event.title} — video`} src={selected.url} controls preload="metadata" playsInline/>}
      {event.media.length>1&&<><button className="stage-prev" type="button" aria-label="Önceki medya" onClick={()=>move(-1)}><ChevronLeft/></button><button className="stage-next" type="button" aria-label="Sonraki medya" onClick={()=>move(1)}><ChevronRight/></button></>}
      {selected&&<span className="stage-count">{index+1} / {event.media.length}</span>}
    </div>
    {renderThumbnails?renderThumbnails(selected?.id,setSelectedId):<div className="event-thumbnails">{event.media.map(media=><button key={media.id} type="button" aria-label={`${media.originalName} seç`} aria-pressed={selected?.id===media.id} onClick={()=>setSelectedId(media.id)}><MediaThumbnail media={media}/></button>)}</div>}
  </div>;
}
