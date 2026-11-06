# Kaizen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut akademi sitesine çalışan formlar, MongoDB destekli etkinlik galerisi ve güvenli admin yönetimi eklemek.

**Architecture:** `/web` Vite frontend ve `/api` Express backend aynı Vercel projesinde, `/web/api/index.ts` üzerinden çalışır. MongoDB kişisel VM'de, medya Cloudflare R2'de tutulur. Tarayıcı aynı origin API'yi kullanır, yetkilendirilmiş dosyaları doğrudan R2'ye yükler.

**Tech Stack:** React, TypeScript, Vite, Tailwind, Motion, Express, MongoDB native driver, Nodemailer, Cloudflare Turnstile, AWS S3 SDK ile R2. npm workspaces ve tek kök lockfile; Node 22 LTS. API testleri Node test runner + tsx, gerçek MongoDB gerektiren testler ayrılmış test veritabanıyla; UI davranış testleri Vitest/Testing Library. Sürükleme için erişilebilir klavye desteği olan dnd-kit kullanılır.

**Spec:** `docs/superpowers/specs/2026-11-06-kaizen-design.md` (kullanıcı onaylı).

## Global Constraints

- `/web` frontend, `/api` backend, aynı Vercel projesi; MongoDB yalnızca VM üzerinde.
- Kategoriler: `Seminerler`, `Kyu sınavları`, `Çocuk etkinlikleri`, `Dojo yaşamı`.
- Alıcı: `kaizenaikidoakademi@gmail.com`; her iki formda sunucu taraflı Turnstile doğrulaması.
- JPEG/PNG/WebP en fazla 10 MB; MP4/WebM en fazla 100 MB; etkinlik başına 50 medya. Uygulamada MB = 1,000,000 bayt.
- Kapak yalnızca resim; oluşturma sırasında zorunlu, sonradan boş galeri mümkün.
- Düzenleme tek Kaydet işlemiyle yayınlanır; değişiklik yokken buton disabled.
- Tek admin; kullanıcı kaydı, parola sıfırlama UI'sı, video transcoding ve kesin randevu rezervasyonu yok.
- Mevcut ziyaretçi tasarımı ve Vite HMR ayarları korunur. Yeni bağımlılık sürümleri kurulmadan önce registry ve ilgili resmi belgelerle doğrulanır; mevcut manifestteki sürümler varsayılarak kurulmaz.
- Canlı servis anahtarları git'e veya frontend bundle'ına konmaz. Hesap/VM erişimi olmadan canlı kurulumun tamamlandığı söylenmez.

## Review Focus

1. Yükleme bittikten sonra sekmenin kapanması: sahipsiz dosya bakımda temizlenmeli, canlı dosya korunmalı (Görev 3).
2. Aynı etkinliğin iki sekmede düzenlenmesi: ikinci kayıt 409 dönmeli, ilk kayıt ezilmemeli (Görev 2 ve 6).
3. SMTP veya Turnstile timeout'u: sahte başarı gösterilmemeli, ziyaretçinin girdileri korunmalı (Görev 4).
4. Kapak silme, yalnızca videolu galeri ve sıfır medya: kart/galeri kırılmamalı (Görev 5 ve 6).
5. Mobil/klavye kullanımı ve kaydedilmemiş taslaktan ayrılma: hover'a bağlı işlemler erişilebilir, kayıp için onay bulunmalı (Görev 6).

## Dosya haritası

- Kök `package.json`, `package-lock.json`, `.gitignore`: workspace, komutlar ve sır/build dışlamaları.
- `shared/events.ts`: kategori sabitleri ve tarayıcı/sunucunun paylaştığı DTO tipleri; runtime sunucu kodu içermez.
- `api/src/config.ts`, `db.ts`, `app.ts`, `server.ts`: ortam doğrulama, bağlantı/indeksler, middleware/routes, yerel giriş.
- `api/src/auth.ts`, `rate-limit.ts`: oturum ve istek sınırlama.
- `api/src/events.ts`: doğrulama ve atomik etkinlik CRUD.
- `api/src/media.ts`, `media-cleanup.ts`: imzalı yükleme, doğrulama, kayıt durumları ve temizlik.
- `api/src/forms.ts`: Turnstile/SMTP form endpoint'leri.
- `api/tools/admin.ts`, `maintenance.ts`: yönetici oluşturma ve tekrar çalıştırılabilir temizlik CLI'ları.
- `api/test/{app,auth,events,media,forms}.test.ts`: kritik API ve kalıcılık davranışları.
- `web/api/index.ts`, `web/vercel.json`: Vercel adaptörü ve yönlendirme.
- `web/src/api.ts`, `router.tsx`: JSON istemcisi ve yalnızca gereken history tabanlı yollar.
- `web/src/components/{Modal,EventGallery,Turnstile}.tsx`: ortak erişilebilir sunum bileşenleri.
- `web/src/admin/{AdminApp,EventList,EventEditor,EventCreateDialog}.tsx`, `admin.css`: yönetim ekranları.
- `web/src/App.tsx`: mevcut ziyaretçi sayfasının API/form entegrasyonu; ilgisiz bölümler yeniden yazılmaz.
- `web/src/{forms,gallery}.test.tsx`, `web/src/admin/EventEditor.test.tsx`: gerçek kullanıcı davranışları.
- `api/.env.example`, `web/.env.example`, `README.md`: kurulum ve doğrulama.

## Task 1: Çalıştırılabilir API, MongoDB ve admin oturumu

**Files:** Kök workspace dosyaları; `api/package.json`, `api/tsconfig.json`; config/db/app/server/auth/rate-limit dosyaları; `api/tools/admin.ts`; `api/test/app.test.ts`, `auth.test.ts`; Vercel giriş/config; `web/vite.config.ts`, `web/tsconfig.json`.

**Interfaces:** `loadConfig(env): Config`; `connectDb(config): Promise<Db>`; `ensureIndexes(db): Promise<void>`; `buildApp({db,config}): Express`; `requireAdmin` middleware. `POST /api/auth/login {username,password}` → `{username,csrfToken}`; GET session aynı DTO veya 401; POST logout → 204. Login ve tüm yazmalarda exact origin kontrolü, login dışındaki admin yazmalarda `X-CSRF-Token`.

- [ ] Test komutlarını ve workspace'i kur; auth testlerinde `assert.equal(unauthenticated.status,401)`, `assert.equal(wrongOrigin.status,403)`, `assert.equal(afterLogout.status,401)` yaz. Eksik live ortamda localhost fallback olmamasını doğrula. Mongo testleri yalnızca `TEST_MONGODB_URI` ve `kaizen_test_` önekli DB ile çalışsın; gerçek uygulama DB'sini temizlemesin.
- [ ] `npm run test -w api -- test/auth.test.ts` çalıştır; eksik implementasyon yüzünden FAIL olduğunu kaydet.
- [ ] Node scrypt ile parola hash'i, opak rastgele cookie token'ı ve MongoDB'de token hash'i uygula. Oturum 12 saatlik mutlak süreli; expiry her istekte kontrol edilir, TTL yalnızca temizliktir. Sabit boyutlu değerlerde timing-safe karşılaştırma kullan. Login limitini IP başına 15 dakikada 10 deneme olarak MongoDB'de atomik uygula; Vercel/local IP kaynağını güvenilen proxy sınırlarıyla ele al.
- [ ] Admin CLI kullanıcı yoksa oluştursun, var olan kullanıcıyı varsayılan olarak reddetsin; parola interaktif gizli giriş veya ortamdan alınsın, argümanda/logda taşınmasın. Session ve rate-limit indekslerini oluştur.
- [ ] API/Vercel adaptörü ve localhost proxy'sini bağla; function girişinde tek app promise kullan ve init hatasında sıfırla. `/api/*` ve `/admin/*` rewrite'larını, assets ve SPA yollarını ayır. Mevcut frontend TS config'inin backend dosyalarını browser ayarlarıyla taramasını önle.
- [ ] Auth ve app testlerini çalıştır; `npm run typecheck` ve `npm run build` PASS. Test DB erişimi yoksa bu testleri geçmiş sayma; bloke durumunu kaydet.
- [ ] Yalnızca bu görevin dosyalarını commit et: `feat: add API workspace and admin sessions`.

## Task 2: Etkinlik veri sözleşmesi ve CRUD

**Files:** `shared/events.ts`, `api/src/events.ts`, `api/src/app.ts`, `api/test/events.test.ts`.

**Interfaces:** `EventCategory`; `MediaItem {id,key,kind,mime,size,originalName,url}`; `EventItem {id,category,date,title,description,location,media,coverMediaId,version,createdAt,updatedAt}`. `EventInput {category,date,title,description,location,mediaIds,coverMediaId}`. Public GET `/api/events?category=...` → `{events: EventItem[]}`, GET `/api/events/:id` → `EventItem`. Admin POST `/api/admin/events` → 201 `EventItem`; PUT `/api/admin/events/:id` `{...EventInput,version}` → `EventItem`; DELETE aynı yol → 204. Hatalar `{error:{code,message,fields?}}`.

- [ ] Testler: geçersiz kategori ve 2026-02-30 → 400; yabancı/tekrarlı medya → 400; videoyu kapak yapma → 400; aynı version ile ikinci PUT → 409; tarih sırası azalan. `assert.equal(secondSave.status,409)` ve `assert.equal(stored.title,firstSave.title)` kullan.
- [ ] `npm run test -w api -- test/events.test.ts` ile RED doğrula.
- [ ] Sınırları uygula: başlık 1–160, açıklama 1–5000, konum 1–250 karakter; gerçek YYYY-MM-DD tarihi; en fazla 50 benzersiz medya ID. Oluşturmada kapak zorunlu. Güncellemede boş galeriye izin ver. Mongo ObjectId veya parse hatalarını 500'e dönüştürme.
- [ ] Medya çözümlemesini doğrulanmış yükleme kayıtlarından yap; istemci URL/key/mime değerlerini kabul etme. Update filtresine version ekle, version'ı atomik artır. Silinmiş/yeni eklenmiş dosyalar için Görev 3 temizlik protokolünü kullan; dosyayı DB kaydından önce silme.
- [ ] CRUD testlerini gerçek test MongoDB üzerinde çalıştır; tüm yetkili/yetkisiz ve çakışma durumları PASS.
- [ ] Commit: `feat: add persistent event management`.

## Task 3: R2 yükleme ve güvenilir temizleme

**Files:** `api/src/media.ts`, `media-cleanup.ts`, `api/tools/maintenance.ts`, `api/src/events.ts`, `api/src/app.ts`, `api/test/media.test.ts`.

**Interfaces:** POST `/api/admin/media/uploads` `{name,size,mime}` → `{uploadId,url,headers}`; POST `/api/admin/media/uploads/:id/complete` → `MediaItem`. `cleanupMedia(db,r2,now): Promise<{removed:number,failed:number}>`. Upload record durumları `pending|verified|attached|deleting`; key, admin ID, createdAt, eventId bulunur.

- [ ] Testler: limit+1 bayt reddedilir; bildirilen JPEG ama HTML içerik reddedilir; başka adminin/key'in nesnesi bağlanamaz; 24 saatten eski sahipsiz dosya temizlenir; etkinlikte referansı olan dosya silinmez; R2 silme hatası sonraki bakımda yeniden denenir.
- [ ] `npm run test -w api -- test/media.test.ts` RED sonucunu doğrula.
- [ ] Resmi R2/S3 belgelerini doğrulayarak 5 dakika geçerli presigned PUT üret; rastgele key önceden MongoDB'ye yazılsın. Yükleme bitişinde HEAD ile boyut ve sınırlı Range okumasıyla dosya imzası doğrula; MIME tespiti için bakımlı file-type paketi kullan. İmzanın codec/playback garantisi olmadığını dokümante et.
- [ ] İzin aşamasında ve tamamlamada 10,000,000/100,000,000 bayt limitleri uygula. Hatalı yüklemeyi sil veya cleanup'a işaretle. Aynı upload ID'nin tamamlanması idempotent; süresi geçmiş pending kayıt reddedilir.
- [ ] Etkinliğe bağlama ile bakım yarışını durum üzerinde atomik claim ile engelle. `attached` medya yalnızca ait olduğu etkinlikte kullanılabilir; DB update başarısızlığında claim geri alınır. Bakım silmeden önce canlı referansları tekrar denetler. Kesinti sonrası toparlama canlı referansı olan kayıtları attached durumuna getirir. Silinmiş etkinliklerin attached dosyaları canlı referans kontrolüyle temizlenir.
- [ ] Temizlik komutu ve CRUD entegrasyonu testlerini PASS yap; R2 adapter'ı test double ile dış hata senaryolarına sok. Gerçek R2 erişimi varsa ayrı test prefix'iyle yükle/oku/sil smoke testi yap, yoksa bloke olarak belirt.
- [ ] Commit: `feat: add verified R2 uploads and media cleanup`.

## Task 4: Turnstile ve SMTP ile iki çalışan form

**Files:** `api/src/forms.ts`, `api/src/app.ts`, `api/test/forms.test.ts`, `web/src/components/Turnstile.tsx`, `web/src/api.ts`, `web/src/App.tsx`, `web/src/forms.test.tsx`, web test config/package.

**Interfaces:** `apiRequest<T>(path, options?): Promise<T>` ve status/code taşıyan `ApiError`. POST `/api/contact` `{name,email,message,turnstileToken}`, POST `/api/trial-requests` `{fullName,phone,email,group,notes,turnstileToken}` → `{ok:true}`. `Turnstile({action,onToken})`; action `contact` veya `trial_request`.

- [ ] API testleri: başarısız/yanlış hostname/action Turnstile → 400, SMTP çağrısı sıfır; SMTP reject/timeout → 503; alıcı kullanıcı girdisinden etkilenmez. UI testi: failed submit sonrasında `expect(nameInput).toHaveValue('Ayşe')`, başarı mesajı yok ve token yenilenmiş.
- [ ] API/UI testlerini çalıştır ve RED doğrula.
- [ ] Turnstile ve Nodemailer güncel belgelerini doğrula. Form limitleri ad 120, e-posta 254, mesaj/not 5000, telefon 7–30 karakter; mesaj zorunlu, not opsiyonel, grup mevcut UI seçenekleriyle allowlist. IP başına 15 dakikada toplam 5 talep. Gelen JSON body en fazla 32 KB. Siteverify 10 saniye timeout; SMTP sınırlı timeout ve TLS ile çalışsın.
- [ ] Turnstile script'ini bir kez yükle, widget lifecycle/expiry/reset ve ayrı iki formu destekle. Submit sürerken tekrar gönderimi engelle. API tarafından doğrulanmış kabulden önce başarı gösterme; hatada form değerlerini koru. Mevcut sahte setTimeout başarı akışlarını kaldır.
- [ ] Form testlerini PASS yap; mevcut public sayfada etiket, hata mesajı ve success durumunu kontrol et. Gerçek e-posta testi yalnızca yapılandırılmış servisle yapılır, yoksa bloke olarak yazılır.
- [ ] Commit: `feat: connect contact and trial forms`.

## Task 5: API destekli ortak etkinlik galerisi

**Files:** `web/src/components/Modal.tsx`, `EventGallery.tsx`, `web/src/App.tsx`, `web/src/gallery.test.tsx`, `web/src/api.ts`.

**Interfaces:** `EventGallery({event,selectedMediaId,onSelectMedia,renderFields?,renderThumbnails?})`; aynı sunum admin tarafından kullanılabilir. Modal focus trap, Escape kapatma, önceki odağa dönüş ve scroll lock sağlar. Galeri seçimi ID ile tutulur, dizi indeksine bağımlı kalmaz.

- [ ] Test: kategori seçimi API verisini filtreler; kart sayacı resimleri sayar; video `<video controls>` olarak açılır; sıfır medyada `Henüz eklenmiş bir görsel bulunmuyor` görünür; seçili medya kaldırılınca kalan ilk medyaya geçilir.
- [ ] `npm run test -w web -- src/gallery.test.tsx` RED doğrula.
- [ ] App içindeki sabit etkinlikleri kaldır; GET yükleme/hata/retry/boş durumlarını ekle. Tarih formatını saat dilimi kaydırmadan Türkçe göster. Kapak yoksa placeholder kullan; kategori etiketlerini onaylı değerlere eşitle. API hatasında demo veriye dönme.
- [ ] Mevcut galeri görünümünü ortak bileşene çıkar; ziyaretçi ve ileride admin için aynı büyük medya/küçük liste düzenini koru. Klavye ve mobil modal davranışını uygula. Mevcut `/src/assets/...` görsel adreslerini production build'de çalışan import/public adreslerine dönüştür.
- [ ] Testleri PASS yap; build edilmiş sayfada galeri ve diğer mevcut görselleri doğrula.
- [ ] Commit: `feat: load public events and support video galleries`.

## Task 6: Admin listesi, oluşturma ve yerinde düzenleme

**Files:** `web/src/router.tsx`, `main.tsx`, admin dosyaları ve CSS; `web/src/admin/EventEditor.test.tsx`; ortak API/galeri bileşenleri.

**Interfaces:** `AdminApp` oturum ve `/admin`/`/admin/events/:id` yollarını yönetir; `EventCreateDialog({onCreated,onClose})`; `EventEditor({eventId})`. Editör persisted snapshot ve draft tutar; `save` başarılı dönen EventItem'ı ikisine birden uygular.

- [ ] Testler: yeni etkinlik başarılı olduğunda detay yoluna geçiş; değişiklik yokken save disabled; alan veya galeri değişince enabled; kaydet hatası taslağı korur; 409 üzerine açık çakışma hatası; silme iptalinde API çağrılmaz; kapak silince ilk resim kapak olur; video varsa yıldız yok; sürükleme/klavye sıralaması aynı dizi sonucunu verir.
- [ ] `npm run test -w web -- src/admin/EventEditor.test.tsx` RED doğrula.
- [ ] Uygulamadan önce frontend tasarım/erişilebilirlik becerilerini yükle. Tasarımdaki koyu mürekkep/açık taş, tipografi odaklı admin görünümünü mevcut bileşenlerle kur. Login/logout, oturum bekleme, liste, silme onayı ve oluşturma modalını tamamla.
- [ ] Oluşturma önce kapak yükleme/tamamlama, sonra event POST yapar; başarılıysa detay sayfasına geçer. Hata halinde alanları ve doğrulanmış upload ID'sini korur; tekrar gönderimde gereksiz yeniden yükleme yapmaz.
- [ ] Ortak galeri üzerinde yerinde alan editörleri, kalem cursor/işareti, tarih/kategori kontrollerini ekle. Save medya yüklenirken disabled olsun. Çoklu upload hatalarını dosya bazında göster, başarılı dosyaları tut; 50 medya sınırını hem istemci hem sunucuda uygula.
- [ ] dnd-kit pointer/keyboard sensor, crosshair tutamacı, drag overlay/gölge, bırakma göstergesi; yıldız/trash kontrolleri hover, focus ve touch için erişilebilir olsun. Seçili yıldız disabled ve title'sız; görsel silme sadece draft'ı değiştirsin.
- [ ] Kirli taslaktan uygulama içi ayrılmada onay ve sekme kapanışında beforeunload ekle. Çakışmada sessiz overwrite veya otomatik veri kaybı yapma; yeniden yükleme kullanıcı onayına bağlı olsun.
- [ ] Admin testlerini PASS yap. Tarayıcıda mobil/desktop ve yalnızca klavyeyle login → create → upload → reorder → save → public view → delete akışını doğrula.
- [ ] Commit: `feat: add inline event administration`.

## Task 7: Canlı kurulum rehberi ve uçtan uca doğrulama

**Files:** `README.md`, `api/.env.example`, `web/.env.example`, gerekirse Vercel/config düzeltmeleri.

**Interfaces:** Root `npm run dev`, `npm run build`, `npm run typecheck`, `npm test`; `npm run admin:create -w api`, `npm run media:cleanup -w api`. Test DB komutları ve environment gereksinimleri README'de birebir çalıştırılabilir olmalı.

- [ ] Örnek environment dosyalarını kodun gerçek adlarıyla eşleştir; root secret gitignore kurallarını doğrula. README'de MongoDB ayrı DB kullanıcısı/TLS/ağ erişimi, Turnstile hostname/site key, SMTP, R2 bucket/CORS/custom domain ve Vercel root=`web`/workspace dış dosya erişimi/rewrites ayarlarını yaz.
- [ ] Yönetici oluşturma, yerel dev, test DB ve VM'de günlük bakım komutu kurulumunu yaz. Vercel ticari plan koşulu, R2 limitleri, backup sorumluluğu ve video codec sınırı kısaca yer alsın.
- [ ] `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` çalıştır. Hata varsa ilgili göreve dönüp düzelt; yapılandırılmamış servis testlerini PASS diye raporlama.
- [ ] Browser testi için çalışan uygulamada public ve admin akışlarını kontrol et. Vercel önizleme erişimi varsa `/api` JSON'u, `/admin/events/:id` doğrudan navigasyonu, production assets ve güvenli cookie davranışını doğrula.
- [ ] Dalın bütünü için son bağımsız inceleme al; bulguları düzelt, etkilenen testleri tekrar çalıştır. Gerçek servis erişimi isteyen kalan işleri açık listele.
- [ ] Commit: `docs: document deployment and verify integration`.

## Plan öz incelemesi

- [x] Tasarımın tüm bölümleri bir göreve eşlendi; kimlik doğrulama, medya temizleme, ziyaretçi/admin ortak görünümü ve canlı kurulum dahil.
- [x] DTO/property ve endpoint isimleri görevler arasında tutarlı.
- [x] Beş Review Focus senaryosu ilgili görevlerin testlerinde yer alıyor.
- [x] Görevler ayrı doğrulanabilir; aynı veri sözleşmesine bağlı oldukları için bu tek plan içinde sıralı uygulanacak.
- [x] Dış servislere erişim olmadan doğrulanamayan adımlar ayrı belirtiliyor.

## Yürütme durumu

- [x] Tasarım onaylandı.
- [x] Plan yazıldı ve öz incelemesi yapıldı.
- [ ] Kullanıcı planı ve yürütme yöntemini onayladı.
- [ ] Görevler 1–7 tamamlandı.
