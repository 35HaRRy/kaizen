# Kaizen Aikido Akademi

Kaizen Aikido Akademi ziyaretçi sitesi ve admin içerik yönetimi; aynı Vercel projesinde Express API.
MongoDB VM'de, resim/video dosyaları Cloudflare R2'de tutulur.

## Yerel geliştirme

Node.js **26.13+**, pnpm kullanılır. Komutları repo kökünde çalıştırın:

```powershell
pnpm install
Copy-Item api/.env.example api/.env
Copy-Item web/.env.example web/.env
# Ortam dosyalarını kendi bağlantı bilgilerinizle doldurun.
pnpm dev
```

Frontend `http://localhost:3000`, API `http://127.0.0.1:3001`. Vite `/api` isteklerini API'ye proxy eder. `APP_ORIGIN`, tarayıcıdaki adresle tam eşleşmelidir; localhost ve 127.0.0.1 birbirinin yerine geçmez. İlk gerçek bağlantıda indeksler oluşturulur. Üretimde localhost veritabanı fallback'i yoktur.

`api/.env`: backend sırları. `web/.env`: sadece public `VITE_TURNSTILE_SITE_KEY`. Turnstile/R2 eksikse ilgili özellik açık hata verir; doğrulama atlanmaz veya sahte başarı gösterilmez. Galeriye örnek etkinlik otomatik yazılmaz.

## Yönetici oluşturma

Uygulama DB kullanıcısının `admins`, `sessions`, `limits`, `events`, `uploads` koleksiyonlarına erişimi olmalıdır. `api/.env` ayarlandıktan sonra PowerShell'de parolayı komut geçmişine düz metin koymadan:

```powershell
$env:ADMIN_USERNAME = Read-Host 'Kullanıcı adı'
$secure = Read-Host 'Şifre (en az 14 karakter)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $secure).Password
pnpm -C api admin:create
Remove-Item Env:ADMIN_PASSWORD
Remove-Item Env:ADMIN_USERNAME
```

Var olan kullanıcı değiştirilmez. Herkese açık kayıt/parola sıfırlama yoktur; hesabın kurtarılması VM sahibi tarafından güvenli bakım işlemi olarak yapılır. `/admin` girişinden sonra 12 saatlik oturum açılır. Çıkış oturumu DB'den iptal eder. Token HttpOnly cookie'dedir; parola scrypt hash'i olarak tutulur. Admin yazmaları origin ve CSRF token kontrolünden geçer.

## MongoDB: VM kurulumu

1. Yeni `kaizen` veritabanı için ayrı, yalnızca bu DB'ye `readWrite` yetkili uygulama kullanıcısı oluşturun. Root/admin bağlantısını uygulamaya vermeyin.
2. MongoDB kimlik doğrulamasını ve geçerli sunucu sertifikasıyla TLS'yi etkinleştirin. URI'de özel karakterli kullanıcı/parola URL-encode edilmelidir; örneğin `mongodb://USER:PASSWORD@db.example.com:27017/kaizen?authSource=kaizen&tls=true`.
3. VM güvenlik duvarını daraltın. MongoDB'yi kimlik doğrulamasız veya TLS olmadan internete açmayın. Vercel'in dinamik çıkış adresleri için güvenli erişim stratejisi belirleyin; sabit egress gereksinimi ek plan/ağ altyapısı gerektirebilir. Yerel SSH tüneli Vercel'de kalıcı bağlantı yöntemi değildir.
4. Günlük DB yedeği ve geri yükleme denemesi kurun. R2 dosyaları ile DB metadatasının birlikte geri yüklenebilmesi gerekir; yalnızca DB yedeği dosyaları geri getirmez.

## Cloudflare R2

1. Standard sınıfında bucket oluşturun. `R2_BUCKET` adını girin; bu bucket'a sınırlı object read/write token üretin.
2. S3 endpoint ve access/secret anahtarlarını yalnızca API ortamına ekleyin.
3. Public medya için kendi Cloudflare alan adınızı bağlayın (`R2_PUBLIC_ORIGIN`, ör. `https://media.example.com`). Canlıda rate-limitli geliştirme `r2.dev` adresini kullanmayın. Galeri dosyaları herkese açık görüntülenir; kişisel/özel dosya yüklemeyin.
4. CORS kuralı (örnekteki domain'i kendi site adresinizle değiştirin):

```json
[
  {
    "AllowedOrigins": ["https://example.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Yerel geliştirme için yalnızca gerekiyorsa `http://localhost:3000` origin'ini ekleyin. Medya domain'inde `X-Content-Type-Options: nosniff` response header kuralı önerilir.

İmzalı PUT bağlantısı 5 dakika geçerlidir; imza content-type/content-length'i sınırlar. Dosya önce `staging/` anahtarına yüklenir. API boyut ve dosya imzasını doğrular; ETag koşullu kopyayla değiştirilemeyen `media/` anahtarına taşır. Böylece imzalı URL tekrar kullanılarak yayımlanmış dosya değiştirilemez. Header doğrulaması tam bir virüs taraması veya video codec kontrolü değildir.

Desteklenen dosyalar: JPEG/PNG/WebP (10.000.000 bayt), MP4/WebM (100.000.000 bayt). Etkinlik başına en fazla 50 medya. Kapak yalnızca resimdir. Videolar dönüştürülmez: yaygın tarayıcılar için MP4 H.264/AAC veya WebM VP8/VP9/Opus tercih edin. Büyük yüklemeler doğrudan R2'ye gider, Vercel function payload sınırından geçmez.

R2 ücretsiz kotası sınırsız değildir. Depolama ve işlem tüketimini panelden izleyin; kota aşımı ücretlenir. Test/üretim için ayrı bucket ve anahtar kullanın.

## Turnstile ve kullanıcı mesajları

- Cloudflare Turnstile widget'ı oluşturun, gerçek site hostname'ini ekleyin. Site key frontend'e, secret key backend'e gider. API Siteverify sonucunda **hostname** ile `APP_ORIGIN` hostname'ini ve action (`contact`/`trial_request`) değerlerini kontrol eder. Token tek kullanımlı ve 5 dakika geçerlidir. Yerelde Cloudflare'ın resmi test anahtarlarını kullanabilirsiniz; üretimde gerçek anahtarlara geçin.
- İletişim ve ücretsiz deneme dersi formları MongoDB `messages` koleksiyonuna form türü, doldurulan alanlar, tarih ve `isRead: false` ile kaydedilir. Başarı yalnızca kayıt tamamlandıktan sonra döner; e-posta gönderimi ve SMTP yapılandırması yoktur. Eski SMTP ortam değişkenleri dağıtım ayarlarından kaldırılabilir.
- Admin panelinde `/admin/messages` altındaki **Kullanıcı mesajları** sayfası en yeni kayıtları önce gösterir. Detay açılınca mesaj tüm yöneticiler için ortak olarak okunmuş işaretlenir. Mesajlar otomatik silinmez; erişim yalnızca yönetici oturumuyla mümkündür.
- “Ücretsiz Randevu Oluştur”, kesin saat ayırmaz, deneme dersi talebidir.
- IP başına iki form toplam 15 dakikada 5 istek; login 15 dakikada 10 deneme. IP yalnızca limit anahtarında hash olarak tutulur; TTL indeksleri süreli kayıtları temizler. Yerelde forwarded IP header'larına güvenilmez; Vercel'de platformun yazdığı `x-real-ip` kullanılır.

## Bakım

### Eski WordPress etkinliklerini aktarma

```powershell
# Yalnızca kaynak envanteri; MongoDB/R2'ye yazmaz.
pnpm -C api events:import
# api/.env hedeflerine aktarır; tek işlem olarak çalıştırın.
pnpm -C api events:import --apply
# Kaynak/hedef alanlarını, galeri sırasını ve R2 dosyalarını denetler; yazmaz.
pnpm -C api events:import --verify
```

Betik eski sitenin bütün liste sayfalarını WordPress API galerileriyle eşleştirir. Listede görünen tarih, başlık ve özgün kapak korunur. Başlıktan tür çıkarılamazsa tür boş kalır; yönetimde **Belirtilmemiş** olarak seçilebilir. Şehir çıkarılamazsa konum İstanbul olur. Açıklamalar kaynaktaki başlıktan oluşturulur; belirsiz şehir/tarih başlıkları seminer sayılmaz.

Aktarım mevcut tek yöneticiye bağlanır; yönetici oluşturmaz veya parolasını istemez. Birden fazla yönetici varsa yanlış kişiye dosya bağlamamak için durur. Sabit kaynak kimlikleri mükerrer kayıtları engeller. Tamamlanmış etkinlikler yeniden çalıştırmada **atlanır**; sonradan yaptığınız düzenlemeler ezilmez. Yeni kaynak görsellerini sonradan mevcut etkinliğe otomatik eklemez. Kesinti sonrası aynı komutu çalıştırın; doğrulama aşamasında kesildiyse dosya kilidinin bitmesi için 5 dakika beklemek gerekebilir. Bir etkinlik ancak bütün dosyaları doğrulanınca yayımlanır. Başarısız kayıtlar sıfırdan farklı çıkış koduyla raporlanır.

`--verify` sonradan düzenlenmiş alanları kaynak farkı olarak bildirir; bunları geri almaz. R2 nesnelerini kimlik doğrulamalı bağlantıyla denetler; bu kontrol, public medya alan adının her ağdan erişilebildiğini kanıtlamaz. `r2.dev` erişiminin kısıtlandığı ağlarda görseller için erişilebilir bir özel medya alan adı gerekir; TLS doğrulamasını kapatmayın. Staging dosyaları mevcut günlük bakım işlemiyle temizlenir.

Kaydetmeden kapatılan yüklemeler ve etkinlikten çıkarılan dosyalar anında silinmez. 24 saatten eski, etkinlikte referansı olmayan dosyaları günlük bakım temizler. Silme hataları sonraki çalışmada tekrar denenir; canlı referanslı dosyalar korunur.

```powershell
pnpm -C api media:cleanup
```

VM'de projeyi/Node bağımlılıklarını kurup API ortamını güvenli dosyada tanımlayın ve cron/systemd timer ile her gün çalıştırın. Örnek cron (gerçek proje yolunu ve Node PATH'ini uyarlayın):

```cron
15 3 * * * cd /srv/kaizen && /usr/bin/pnpm -C api media:cleanup >> /var/log/kaizen-media-cleanup.log 2>&1
```

`api/.env` CLI tarafından yüklenir; Vercel ortam değişkenleri VM'e otomatik aktarılmaz. Bakım çalışmazsa dosyalar birikir; DB TTL indeksi R2 dosyasını silemez. Staging prefix'ine ek olarak birkaç günlük R2 lifecycle kuralı koyabilirsiniz; `media/` prefix'ine yaş bazlı toplu silme kuralı koymayın.

## Vercel: tek proje

1. Repo'yu bağlayın, Root Directory=`web`, framework=Vite seçin. Root dışındaki dosyaların build'e dahil edilmesi ayarını açın; `/api` ve `/shared` bu root'un dışındadır.
2. Node runtime **22.x** seçin. `web/vercel.json` üst kökteki lockfile ile `npm ci`, frontend build ve rewrite'ları tanımlar. Function `/web/api/index.ts` backend'i içe aktarır; tüm istekler `/api` önekini korur.
3. `api/.env.example` değişkenlerini Vercel'e girin; `PORT` gerekmez. `APP_ORIGIN=https://gercek-domain` olmalı. Frontend için `VITE_TURNSTILE_SITE_KEY` build sırasında verilmelidir.
4. Preview deployment'a gerçek domain'den farklı `APP_ORIGIN`, uygun Turnstile hostname ve tercihen ayrı test DB/bucket tanımlayın. Üretim verisiyle preview testi yapmayın.
5. Yayından sonra `/api/health`, `/api/events`, `/admin`, `/admin/messages` ve direkt `/admin/events/ID` ile `/admin/messages/ID` navigasyonunu kontrol edin. Login cookie'sinde Secure/HttpOnly/SameSite, çıkış sonrası 401, gerçek resim/video yükleme, sıralama ve iki formdan kaydedilen mesajların panelde görünmesini ve detay açılınca okunmuş olmasını kontrol edin.

**Ücretli ders/hizmet tanıtımı ticari kullanım olduğundan Vercel Hobby koşullarına uymaz; uygun Pro planını değerlendirin.** R2 ücretsiz kalması uygulamanın tamamının ücretsiz olacağı anlamına gelmez.

## Test ve doğrulama

```powershell
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

API testleri varsayılan olarak `mongodb-memory-server` ile **gerçek, geçici MongoDB** başlatır. İlk çalışmada MongoDB binary'si indirilir; ağ/disk alanı gerekir. Alternatif `TEST_MONGODB_URI` tanımlayabilirsiniz: testler rastgele `kaizen_test_*` DB oluşturup yalnızca kendi DB'sini siler. Üretim URI'si vermeyin. R2/Turnstile dış servisleri test adapter'larıyla simüle edilir; bu testler gerçek servis erişiminin doğrulandığı anlamına gelmez.

API sözleşmesi: hatalar `{error:{code,message}}`, liste `{events:[...]}`. Etkinlik yazmaları `version` kontrolüyle eski sekmenin yeni kaydı ezmesini engeller (409). Medya sayıları frontend'de hesaplanır. Galeri sıralaması ve kapak `Kaydet` öncesinde sadece taslaktır. Kaydedilmemiş sayfadan ayrılırken tarayıcı onayı gösterilir.
