import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { lazy,Suspense } from 'react';
const AdminApp=lazy(()=>import('./admin/AdminApp'));

createRoot(document.getElementById('root')!).render(window.location.pathname.startsWith('/admin')?<Suspense fallback={<p role="status">Yükleniyor…</p>}><AdminApp/></Suspense>:<App/>);
