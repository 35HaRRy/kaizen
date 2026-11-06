# Kaizen Aikido Akademi

React ziyaretçi sitesi ve `/admin` içerik yönetimi; aynı Vercel projesinde Express API. MongoDB VM'de, resim/video dosyaları Cloudflare R2'de tutulur.

## Yerel geliştirme

Node.js **22.12+** (canlı ortam 22.x), npm kullanılır. Komutları repo kökünde çalıştırın:

```powershell
npm ci
Copy-Item api/.env.example api/.env
Copy-Item web/.env.example web/.env
# Ortam dosyalarını kendi bağlantı bilgilerinizle doldurun.
npm run dev
```

Frontend `http://localhost:3000`, API `http://127.0.0.1:3001`. Vite `/api` isteklerini API'ye proxy eder. `APP_ORIGIN`, tarayıcıdaki adresle tam eşleşmelidir; localhost ve 127.0.0.1 birbirinin yerine geçmez. İlk gerçek bağlantıda indeksler oluşturulur. Üretimde localhost veritabanı fallback'i yoktur.

`api/.env`: backend sırları. `web/.env`: sadece public `VITE_TURNSTILE_SITE_KEY`. Turnstile/SMTP/R2 eksikse ilgili özellik açık hata verir; doğrulama atlanmaz veya sahte başarı gösterilmez. Galeriye örnek etkinlik otomatik yazılmaz.

## Yönetici oluşturma

Uygulama DB kullanıcısının `admins`, `sessions`, `limits`, `events`, `uploads` koleksiyonlarına erişimi olmalıdır. `api/.env` ayarlandıktan sonra PowerShell'de parolayı komut geçmişine düz metin koymadan:

```powershell
$env:ADMIN_USERNAME = Read-Host 'Kullanıcı adı'
$secure = Read-Host 'Şifre (en az 14 karakter)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $secure).Password
npm run admin:create -w api
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

## Turnstile ve e-posta

- Cloudflare Turnstile widget'ı oluşturun, gerçek site hostname'ini ekleyin. Site key frontend'e, secret key backend'e gider. API Siteverify sonucunda **hostname** ile `APP_ORIGIN` hostname'ini ve action (`contact`/`trial_request`) değerlerini kontrol eder. Token tek kullanımlı ve 5 dakika geçerlidir. Yerelde Cloudflare'ın resmi test anahtarlarını kullanabilirsiniz; üretimde gerçek anahtarlara geçin.
- SMTP sağlayıcınızın host, port, kullanıcı/parola ve onaylı gönderen adresini girin. 587 için `SMTP_SECURE=false` ile zorunlu STARTTLS, 465 için `true` kullanılır. TLS sertifikası doğrulaması kapatılmaz.
- Alıcı sabit `kaizenaikidoakademi@gmail.com`; ziyaretçinin adresi Reply-To'dur. Başarı SMTP kabulünden sonradır, gelen kutusuna teslim garantisi değildir. SPF/DKIM/DMARC ve spam klasörünü gerçek gönderimle kontrol edin. Gmail kullanılıyorsa normal hesap parolası yerine sağlayıcının desteklediği uygulama parolası/SMTP yöntemi gerekir.
- Formlar e-posta gönderir; başvurular ayrıca DB'de arşivlenmez. “Ücretsiz Randevu Oluştur”, kesin saat ayırmaz, deneme dersi talebidir.
- IP başına iki form toplam 15 dakikada 5 istek; login 15 dakikada 10 deneme. IP yalnızca limit anahtarında hash olarak tutulur; TTL indeksleri süreli kayıtları temizler. Yerelde forwarded IP header'larına güvenilmez; Vercel'de platformun yazdığı `x-real-ip` kullanılır.

## Bakım

Kaydetmeden kapatılan yüklemeler ve etkinlikten çıkarılan dosyalar anında silinmez. 24 saatten eski, etkinlikte referansı olmayan dosyaları günlük bakım temizler. Silme hataları sonraki çalışmada tekrar denenir; canlı referanslı dosyalar korunur.

```powershell
npm run media:cleanup -w api
```

VM'de projeyi/Node bağımlılıklarını kurup API ortamını güvenli dosyada tanımlayın ve cron/systemd timer ile her gün çalıştırın. Örnek cron (gerçek proje yolunu ve Node PATH'ini uyarlayın):

```cron
15 3 * * * cd /srv/kaizen && /usr/bin/npm run media:cleanup -w api >> /var/log/kaizen-media-cleanup.log 2>&1
```

`api/.env` CLI tarafından yüklenir; Vercel ortam değişkenleri VM'e otomatik aktarılmaz. Bakım çalışmazsa dosyalar birikir; DB TTL indeksi R2 dosyasını silemez. Staging prefix'ine ek olarak birkaç günlük R2 lifecycle kuralı koyabilirsiniz; `media/` prefix'ine yaş bazlı toplu silme kuralı koymayın.

## Vercel: tek proje

1. Repo'yu bağlayın, Root Directory=`web`, framework=Vite seçin. Root dışındaki dosyaların build'e dahil edilmesi ayarını açın; `/api` ve `/shared` bu root'un dışındadır.
2. Node runtime **22.x** seçin. `web/vercel.json` üst kökteki lockfile ile `npm ci`, frontend build ve rewrite'ları tanımlar. Function `/web/api/index.ts` backend'i içe aktarır; tüm istekler `/api` önekini korur.
3. `api/.env.example` değişkenlerini Vercel'e girin; `PORT` gerekmez. `APP_ORIGIN=https://gercek-domain` olmalı. Frontend için `VITE_TURNSTILE_SITE_KEY` build sırasında verilmelidir.
4. Preview deployment'a gerçek domain'den farklı `APP_ORIGIN`, uygun Turnstile hostname ve tercihen ayrı test DB/bucket tanımlayın. Üretim verisiyle preview testi yapmayın.
5. Yayından sonra `/api/health`, `/api/events`, `/admin` ve direkt `/admin/events/ID` navigasyonunu kontrol edin. Login cookie'sinde Secure/HttpOnly/SameSite, çıkış sonrası 401, gerçek resim/video yükleme, sıralama ve formlardan gerçek e-posta teslimini kontrol edin.

**Ücretli ders/hizmet tanıtımı ticari kullanım olduğundan Vercel Hobby koşullarına uymaz; uygun Pro planını değerlendirin.** R2 ücretsiz kalması uygulamanın tamamının ücretsiz olacağı anlamına gelmez.

## Test ve doğrulama

```powershell
npm test
npm run typecheck
npm run build
git diff --check
```

API testleri varsayılan olarak `mongodb-memory-server` ile **gerçek, geçici MongoDB** başlatır. İlk çalışmada MongoDB binary'si indirilir; ağ/disk alanı gerekir. Alternatif `TEST_MONGODB_URI` tanımlayabilirsiniz: testler rastgele `kaizen_test_*` DB oluşturup yalnızca kendi DB'sini siler. Üretim URI'si vermeyin. R2/SMTP/Turnstile dış servisleri test adapter'larıyla simüle edilir; bu testler gerçek servis erişiminin doğrulandığı anlamına gelmez.

API sözleşmesi: hatalar `{error:{code,message}}`, liste `{events:[...]}`. Etkinlik yazmaları `version` kontrolüyle eski sekmenin yeni kaydı ezmesini engeller (409). Medya sayıları frontend'de hesaplanır. Galeri sıralaması ve kapak `Kaydet` öncesinde sadece taslaktır. Kaydedilmemiş sayfadan ayrılırken tarayıcı onayı gösterilir.
