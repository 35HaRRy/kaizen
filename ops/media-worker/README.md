# Alan adı olmadan R2 medya sunumu

Bu Worker, `r2.dev` adresine proxy olmaz: `MEDIA` R2 binding'iyle doğrudan bucket'tan okur.
Yalnızca `media/<24 küçük hex karakter>` yollarında GET/HEAD kabul eder. `staging/`, listeleme,
yazma ve silme dışarıya kapalıdır. Bu repodaki yükleme/import akışı bu anahtar biçimini üretir.
Video için tek byte range desteklenir; çoklu/geçersiz aralıklar 416 döner.

## Kurulum

1. `wrangler.jsonc` içindeki `replace-with-existing-bucket-name` yerine **mevcut**
   R2 bucket adını yazın. Yeni bucket oluşturmayın; dosyalar taşınmaz.
2. Repo kökünde Cloudflare hesabınızla oturum açıp dağıtın:

   ```powershell
   npx wrangler@latest login
   npx wrangler@latest deploy --config ops/media-worker/wrangler.jsonc
   ```

   İlk dağıtımda ücretsiz workers.dev alt alan adının etkinleştirilmesi istenebilir.
   Dashboard'da Worker > Settings > Bindings altında `MEDIA` değerinin doğru R2 bucket'a
   bağlı olduğunu kontrol edin. API anahtarlarını Worker kaynak koduna yazmayın.

3. Dağıtımın verdiği `https://kaizen-media.HESABINIZ.workers.dev` adresinde bilinen bir
   `/media/ID` dosyasını açın. GET ve HEAD 200, `Content-Type` doğru olmalı. Video için
   `Range: bytes=0-99` isteği 206 ve doğru `Content-Range` dönmeli. `/staging/ID` 404 olmalı.
4. API sunucusunda `production.env` dosyasındaki **yalnızca** `R2_PUBLIC_ORIGIN` değerini
   bu HTTPS origin ile değiştirin (path/query olmadan). Mevcut API dağıtım prosedürüyle
   container'ı yeniden oluşturun; yalnız restart ortam değişikliğini almaz.
   Bu ayar Vercel'e değil API sunucusuna aittir. R2 endpoint/bucket/anahtarlar değişmez.
5. API/web kodunu normal dağıtımınızla yayımlayın. `/api/events` cevaplarında yeni hostu,
   eski galerileri, yeni yüklemeyi ve video oynatma/ileri sarmayı kontrol edin.
   Geçersiz bir medya adresiyle dojo logo yedeğini doğrulayın.

API kayıtlı URL'yi yanıt oluştururken güncel `R2_PUBLIC_ORIGIN` + nesne anahtarından
üretir; MongoDB'ye toplu güncelleme veya görselleri yeniden yükleme gerekmez. Hata yedeği
web sürümü yayımlandığında devreye girer. Geri almak için önceki `R2_PUBLIC_ORIGIN`
değerini geri koyup API container'ını yeniden oluşturun.

## Sınırlar

- Workers Free: hesap genelinde günlük 100.000 istek; kota aşılırsa 1027 hatası.
  Browser cache aynı değişmez URL için tekrar indirmeleri azaltır, fakat ilk istekler,
  HEAD ve videoların parça istekleri de kota tüketir. Edge cache eklenmedi.
- R2 okuma/depolama kotası ayrıdır. Her GET bir metadata HEAD ve bir nesne GET okuması
  yapar; HEAD/304 yalnız metadata okur. Dashboard'dan kullanımı izleyin.
- `workers.dev` hobi/kritik olmayan projeler içindir, ticari canlı servis garantisi değildir.
  Trafik veya güvenilirlik gereksinimi artınca özel alan adı ve uygun plan değerlendirilmelidir.
- Worker tüm sonlandırılmış medyayı herkese açık sunar; özel dosya yüklemeyin.
- Dosyalar değişmez kabul edildiğinden başarılı cevaplar 1 yıl browser cache'i kullanır.
  Aynı anahtarın içeriğini elle değiştirmeyin; silinmiş dosyaların önceden cache'lenmiş
  kopyaları da süre sonuna kadar kalabilir. Hata cevapları cache'lenmez.
- Logo yedeği erişim sorununu çözmez; yalnızca tarayıcıdaki kırık görseli önler.

Test: `node --test ops/media-worker/worker.test.mjs` (root `pnpm test` içinde de çalışır).
Testler gerçek Cloudflare erişimini veya hesap/bucket eşlemesini doğrulamaz.

Kaynaklar: [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/),
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).
