# Kullanıcı Mesajları Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SMTP yerine form gönderilerini kaydetmek ve admin panelinde ortak okunma durumuyla göstermek.

**Architecture:** Mevcut POST uçları doğrulanmış alanları `messages` koleksiyonuna yazar. Ayrı admin mesaj uçları mevcut oturum, Origin ve CSRF katmanının arkasındadır. React paneline mevcut sayfa yönlendirme ve görsel kalıplarıyla liste/detay eklenir.

**Tech Stack:** TypeScript, Express, MongoDB, React, node:test/Supertest, Vitest/Testing Library; pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-11-09-user-messages-design.md`

## Execution status

- [x] Task 1: Form kaydı ve SMTP temizliği — 4 form testi geçti.
- [x] Task 2: Korumalı mesaj API'si — tüm 12 API testi geçti.
- [x] Task 3: Admin ekranları — tüm 15 web testi, tür kontrolü ve üretim derlemesi geçti; 1440px/390px tarayıcı kontrolü yapıldı.
- [x] Bağımsız son inceleme ve bulguların değerlendirilmesi — uygulama hatası yok; doğrulama testlerinin Turnstile test verisi düzeltildi.

## Global Constraints

- “Okunma durumu tüm yöneticiler için ortaktır.”
- “Silme, yanıtlama, eski e-postaların aktarımı ve yönetici başına okunma takibi yoktur.”
- “Alan adları, API yolları, sayfalama ve ekran ayrıntıları mevcut proje kalıplarına uyarlanır; yeni bağımlılık eklenmez.”
- “Veritabanı kaydı başarısızsa form başarı yanıtı vermez.”
- Form doğrulamaları, Turnstile hostname/action kontrolü ve hız sınırı korunur.
- Mevcut kullanıcı değişiklikleri: `README.md`, kök ve web `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`; üzerine yazmadan yalnız ilgili satırlar değiştirilir. İzin olmadan commit yapılmaz.

## Review Focus

- İstemcinin gönderdiği `isRead`, tarih veya alıcı alanı kayıt durumunu belirleyemez: Task 1 test eder.
- Turnstile arızası ya da geçersiz giriş veri kaydetmez: Task 1 test eder.
- Liste açmak mesajı okunmuş yapmaz, GET uçları durum değiştirmez: Task 2 test eder.
- İkinci yönetici ve tekrarlanan okuma isteği aynı ortak durumu görür: Task 2 test eder.
- Detay/okunma isteği başarısızsa arayüz sahte başarı göstermez; kullanıcı metni HTML olarak çalıştırılmaz: Task 3 test eder.

---

### Task 1: Formları kalıcı kayda geçirmek ve SMTP'yi kaldırmak

**Files:**
- Create: `shared/messages.ts` — ortak form verisi ve mesaj DTO tipleri.
- Modify: `api/src/forms.ts`, `api/src/db.ts`, `api/test/forms.test.ts`.
- Modify: `api/package.json`, `api/.env.example`, `README.md`, mevcut kilit dosyaları — SMTP temizliği.

**Interfaces:**
- `MessageInput`: `{ type: "contact"; name: string; email: string; message: string } | { type: "trial"; name: string; email: string; phone: string; group: string; notes: string }`.
- `UserMessage`: `MessageInput & { id: string; createdAt: string; isRead: boolean }`.
- `FormServices` yalnız `verify(token: string): Promise<{ success: boolean; hostname?: string; action?: string }>` sağlar; `send` kaldırılır.
- Mevcut `POST /api/contact` ve `POST /api/trial-requests` başarılı kayıttan sonra `{ ok: true }` döndürmeye devam eder.

- [ ] **Step 1: Failing tests.** `api/test/forms.test.ts` içindeki SMTP testini kayıt testlerine dönüştür: iki formun tüm doğrulanmış alanları saklanır, `isRead === false`, tarih sunucudan gelir; Turnstile tokenı ve istemcinin ekstra alanları kaydedilmez. Geçersiz hostname/action, başarısız verification, servis hatası, geçersiz e-posta/telefon/grup/boş mesaj ve hız sınırı aşıldığında kayıt oluşmadığını doğrula. Kayıt ekleme hatasını dar kapsamlı test mock'u ile üret; yanıtın başarı olmadığını doğrula.
- [ ] **Step 2: Red.** `pnpm -C api exec tsx --test test/forms.test.ts` çalıştır; kayıt beklentilerinin mevcut SMTP koduyla başarısız olduğunu doğrula.
- [ ] **Step 3: Implement.** `registerForms` içinde mevcut alan doğrulamalarından `MessageInput` oluştur; Turnstile sonrasında `messages.insertOne` ile `createdAt` ISO tarihini ve `isRead: false` yaz. `createFormServices` içindeki SMTP ve `Mail` kodunu sil. `ensureIndexes` içine `messages` için `{ createdAt: -1, _id: -1 }` indeksi ekle.
- [ ] **Step 4: Cleanup.** `nodemailer` ve `@types/nodemailer` bağımlılıklarını kaldır; kullanılan kilit dosyalarını uygun paket yöneticisiyle güncelle. Örnek SMTP değişkenlerini ve README e-posta akışını veritabanı/admin akışıyla değiştir. Yerel gizli `.env` dosyalarının içeriğini açığa çıkarma veya bağımsız ayarlarını değiştirme. Kalan SMTP referanslarını tarayıp değerlendir.
- [ ] **Step 5: Green.** Step 2 komutunu yeniden çalıştır; tüm form testleri geçmeli.

### Task 2: Korumalı liste, detay ve ortak okunma API'si

**Files:**
- Create: `api/src/messages.ts`, `api/test/messages.test.ts`.
- Modify: `api/src/app.ts`.

**Interfaces:**
- `registerMessages(app: Express, db: Db): void`, `registerAuth` sonrasında kaydedilir.
- `GET /api/admin/messages?page=1` → `{ messages: UserMessage[]; page: number; hasMore: boolean }`. Sayfa pozitif tamsayı; sayfa boyutu 50, sıra `{ createdAt: -1, _id: -1 }`.
- `GET /api/admin/messages/:id` → `UserMessage`, durum değiştirmez.
- `POST /api/admin/messages/:id/read` → `{ ok: true }`; `$set: { isRead: true }`, idempotent. Eksik kayıt veya geçersiz ID: 404.
- ID doğrulaması için mevcut `objectId` yardımcı fonksiyonu kullanılır.

- [ ] **Step 1: Failing tests.** `messages.test.ts`: anonim tüm uçlar 401, CSRF/Origin eksik veya hatalı okuma isteği 403; liste ve GET detayı durumu değiştirmez. Aynı tarihli kayıtlarla kararlı sıralama, boş liste, 51 kayıtla ikinci sayfa, hatalı sayfa, geçersiz/olmayan ID test edilir. İki admin oturumuyla birinin okuduğu mesajın diğerinde okunmuş göründüğünü ve tekrar okumanın başarılı olduğunu doğrula.
- [ ] **Step 2: Red.** `pnpm -C api exec tsx --test test/messages.test.ts` çalıştır; eksik uçlar nedeniyle testler başarısız olmalı.
- [ ] **Step 3: Implement.** `registerMessages` uçlarını ekle; mevcut DTO örüntüsüyle `_id` yerine `id` döndür. Liste yalnız gereken özet alanlarını değil ortak tipteki kaydı döndürür; gizli Turnstile verisi zaten saklanmaz. Admin kimlik doğrulamasını tekrar uygulama, mevcut middleware'i kullan.
- [ ] **Step 4: Green.** Step 2 komutu ve `pnpm -C api test` başarılı olmalı.

### Task 3: Admin mesaj ekranları ve son doğrulama

**Files:**
- Create: `web/src/admin/MessageList.tsx`, `web/src/admin/MessageDetail.tsx`, `web/src/admin/Messages.test.tsx`, `web/src/admin/AdminApp.test.tsx`.
- Modify: `web/src/admin/AdminApp.tsx`, `web/src/admin/admin.css`.

**Interfaces:**
- `MessageList(): React.JSX.Element`: `/admin/messages`, Task 2 listesini mevcut `apiRequest` üzerinden okur, 50 kayıtlık önceki/sonraki sayfa düğmeleri sunar.
- `MessageDetail({ messageId }: { messageId: string }): React.JSX.Element`: `/admin/messages/:id`, önce GET detayı, sonra POST read; başarılı POST sonrasında yerel okunma durumunu günceller.
- Menü etiketi tam olarak `Kullanıcı mesajları`; her iki mesaj türü, ad, e-posta, tarih, `Okunmadı`/`Okundu` metni listede görünür. Detayda forma ait tüm alanlar, çok satırlı mesaj/notlar ve listeye dönüş bağlantısı görünür.

- [ ] **Step 1: Failing tests.** `Messages.test.tsx`: liste boş/yükleniyor/hata/yeniden deneme; tür ve okunma etiketleri; detay bağlantısı ve sayfalama istekleri. Detayda her form alanı, literal HTML benzeri metin, başarılı GET'ten sonra read POST, GET başarısızsa POST olmaması, POST başarısızsa hata ve yeniden deneme doğrulanır. `AdminApp.test.tsx`: oturumla menü/aktif bağlantı, doğrudan liste-detay yolları ve mevcut etkinlik yönlendirmesi test edilir. Mevcut testlerin mock/cleanup düzenine uyulur.
- [ ] **Step 2: Red.** `pnpm -C web exec vitest run src/admin/Messages.test.tsx src/admin/AdminApp.test.tsx` çalıştır; eksik bileşenler nedeniyle başarısız olmalı.
- [ ] **Step 3: Implement.** Mevcut admin sınıflarını, bağlantı tabanlı yönlendirmeyi, hata yardımcısını ve ikon bağımlılığını kullan. Aktif menüyü yola göre ayarla, üst başlığı mesaj sayfalarına uyarla. Erişilebilir yükleme/hata durumları, klavye ile detay erişimi ve küçük ekran düzeni ekle; kullanıcı verisini React metni olarak render et.
- [ ] **Step 4: Green.** Step 2 komutunu ve ardından `pnpm test`, `pnpm typecheck`, `pnpm build` çalıştır. Tüm çıktıları kontrol et; ortam nedeniyle çalışmayan kontrolleri açıkça bildir.
- [ ] **Step 5: Review.** Son diff'i tasarıma göre gözden geçir; kullanıcının önceki değişikliklerinin korunduğunu ve SMTP bağımlılık/referanslarının temizlendiğini doğrula. Yerel ortam elveriyorsa tarayıcıda liste/detay ve dar ekran kontrolü yap; canlı servis teslimi veya üretim deploy'u yapma.
