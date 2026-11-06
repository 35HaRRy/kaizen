# Kaizen web, API ve etkinlik yönetimi tasarımı

## Amaç ve kararlar

Mevcut React arayüzünü çalışan iletişim formları ve yönetilebilir etkinlik galerisiyle yayına hazırlamak. Ziyaretçi mevcut site üzerinden bilgi alır, deneme dersi talep eder ve etkinlikleri görüntüler. Yönetici `/admin` üzerinden etkinlikleri ve medyalarını yönetir.

Kullanıcının kararları: `/web` frontend, yeni `/api` Node.js backend, aynı Vercel projesinde yayın, kişisel VM üzerindeki yeni MongoDB veritabanı; `odi-bid-battle` projesinin aynı origin API yönlendirme yaklaşımı. Medya için Cloudflare R2 seçimi onaylandı. Kullanıcı 2026-11-06 tarihinde bu tasarımı onayladı; aşağıda geliştirici önerisi olarak belirtilen varsayılanlar da onaylanan kapsamın parçasıdır.

## Yaklaşımlar

- Vercel Blob: en az servis kurulumu; ücretsiz depolama ve aktarım kotaları videolu galeri için küçük.
- Cloudflare R2: ayrı servis kurulumu gerekir; Standard sınıfında 10 GB-month ücretsiz depolama ve ücretsiz dışarı veri aktarımı sunar. Kullanıcı bu öneriyle ilerlemeyi seçti.
- VM dosya diski: mevcut altyapıyı kullanır ancak dosya sunumu, kapasite, yedekleme ve erişilebilirlik işletimini VM sahibine yükler; tercih edilmedi.

R2 işlem ve depolama kotaları aşıldığında ücretlenir. Vercel Hobby ticari olmayan kişisel kullanımla sınırlıdır; ücretli akademi hizmetlerini tanıtan canlı site için uygun Vercel planı gerekir.

## Mimari

- Mevcut React/TypeScript, Vite, Tailwind ve Motion yapısı korunur. API Node.js/TypeScript ve Express kullanır; bağımlılıklar kendi workspace'lerinde kalır.
- Referans projedeki gibi `/web/api/index.ts`, `/api` içindeki uygulamaya ince Vercel giriş noktası olur. `/api/*` yönlendirmesi bu function'a, `/admin` ve alt yolları SPA girişine gider. Yerelde Vite `/api` proxy'si Node sunucusuna bağlanır.
- MongoDB bağlantısı function instance'ı içinde yeniden kullanılır; başarısız ilk bağlantı sonraki isteği kalıcı olarak bozmaz. URI yalnızca backend ortam değişkenindedir.
- R2 medyayı, MongoDB etkinlik ve medya metadatasını tutar. Tarayıcı API'ye aynı origin üzerinden erişir; medya yükleme ve görüntüleme doğrudan R2 üzerinden olur.
- Canlı medyalar özel bir medya alan adı üzerinden sunulur; R2 geliştirme adresi canlı yayın için kullanılmaz. Bucket yazımı herkese açık değildir.

## Veri modeli

Etkinlik: `id`, `category`, `date` (YYYY-MM-DD takvim tarihi), `title`, `description`, `location`, sıralı `media` dizisi, `coverMediaId`, `version`, oluşturma/güncelleme zamanları.

Kategori değerleri tam olarak: `Seminerler`, `Kyu sınavları`, `Çocuk etkinlikleri`, `Dojo yaşamı`.

Medya: sunucunun verdiği ID ve object key, resim/video türü, MIME tipi, boyut, özgün dosya adı. URL sunucu tarafından güvenilen medya kökünden türetilir. Kullanıcı key veya dış URL seçemez. Kapak yalnızca resim olabilir ve tek bir medya ID'sine işaret eder; galeri sırasından bağımsızdır.

Geliştirici önerileri: etkinlikler tarih azalan sırayla listelenir; tek kategori seçilir ve mevcut `Tümü` filtresi kalır. Kartta istenen görsel sayısı yalnızca resimlerden hesaplanır; video varsa ayrıca video adedi gösterilir. Metin düz metindir, HTML kabul edilmez. Mevcut örnek etkinlikler canlı veritabanına otomatik yazılmaz.

## İletişim ve deneme dersi

- `POST /api/contact`: mevcut ad, e-posta, mesaj alanları.
- `POST /api/trial-requests`: mevcut ad soyad, telefon, e-posta, yaş grubu, not alanları.
- Her iki formda Cloudflare Turnstile bulunur. API token'ı Siteverify ile doğrular; beklenen hostname/action değerlerini kontrol eder. Süresi dolmuş veya tekrar kullanılan token ile işlem yapılmaz.
- Alan doğrulaması ve MongoDB destekli istek sınırlandırma uygulanır; function belleğine bağlı rate limit kullanılmaz. E-posta yalnızca sabit `kaizenaikidoakademi@gmail.com` alıcısına SMTP/Nodemailer ile gider. Gönderen yapılandırılmış adrestir, ziyaretçinin doğrulanmış biçimdeki adresi Reply-To olur.
- Başarı yalnızca SMTP kabulünden sonra gösterilir; bu, gelen kutusuna teslim garantisi değildir. Gönderimde buton kilitlenir; hata halinde değerler korunur ve Turnstile yenilenir. Sunucu anahtarları frontend'e taşınmaz.
- Deneme dersi bir talep e-postasıdır; takvim rezervasyonu veya kesin saat ataması değildir. Form kayıtları ayrıca arşivlenmez. E-posta kuyruğu bu kapsamda yoktur.

## Yönetici oturumu

Geliştirici önerisi: ilk sürümde tek yönetici, herkese açık kayıt ve şifre sıfırlama ekranı olmadan. Kullanıcı adı ve güçlü parola, yerel kurulum komutuyla MongoDB'ye hash'lenerek kaydedilir. Komut mevcut hesabı açık işlem olmadan değiştirmez.

Login/logout/session endpoint'leri; rastgele opak oturum token'ının hash'i MongoDB'de tutulur. Tarayıcıda HttpOnly, canlıda Secure, SameSite cookie kullanılır. Oturum süreli ve çıkışta iptal edilir. Yazma isteklerinde origin/CSRF koruması, girişte rate limit ve tüm admin endpoint'lerinde sunucu yetkilendirmesi bulunur. Parola ve token loglanmaz.

## Ziyaretçi galerisi ve admin arayüzü

Mevcut ziyaretçi görünümü temel alınır. API yüklenirken yükleme durumu, hata halinde tekrar deneme, boş listede boş durum gösterilir; sabit örnek veriye sessiz dönüş yapılmaz. Kart kapağı ayrı cover alanından gelir. Kart galerisinde resim veya kontrolleri olan video açılır, video otomatik başlamaz.

Admin için geliştirici önerisi: mevcut akademi kimliğiyle uyumlu, koyu mürekkep/açık taş tonlarında, güçlü tipografili sade editoryal çalışma alanı; mobilde de kullanılabilir. Ayrı bir tasarım sistemi kurulmaz.

- `/admin`: giriş yoksa giriş ekranı, varsa etkinlik listesi. Listede düzenleme ve onaylı silme; sağ üstte Yeni Etkinlik Ekle.
- Yeni etkinlik popup'ı: kategori, tarih, tek kapak resmi, başlık, açıklama, konum. Alanlar ve kapak zorunludur. Başarılı kayıttan sonra `/admin/events/:id` ekranına gidilir.
- Detay ekranı ziyaretçiyle ortak galeri sunumunu kullanır. Tür/tarih dropdown ve tarih alanıyla; başlık/açıklama/konum yerinde metin alanlarıyla düzenlenir. Kalem cursor ve görünür düzenleme işareti, klavyeyle erişilebilir odak ve etiketler bulunur.
- Küçük medya listesi sonunda çoklu resim/video ekleme düğmesi bulunur. Boş galeride sadece bu düğme ve büyük alanda `Henüz eklenmiş bir görsel bulunmuyor` mesajı vardır.
- Hover ve klavye odağında yıldız, crosshair taşıma tutamacı ve çöp kutusu görünür. Dokunmatik ekranda işlemler erişilebilir kalır. Seçili kapak yıldızı dolu, disabled ve tooltip'siz; diğer resimlerin yıldızı `Tanıtım görseli olarak seç` başlıklıdır. Videolar kapak seçilemez.
- Taşıma sırasında gölge ve bırakma konumu gösterilir; klavye ile sıralama da mümkündür. İstekteki crosshair tooltip metni kapak işlemiyle çeliştiğinden geliştirici önerisi `Sıralamak için sürükle` metnidir.
- Değişiklik yokken Kaydet disabled, değişiklik varken enabled olur. Kayıt sürerken tekrar gönderim engellenir; hata halinde taslak korunur. Kaydedilmemiş değişikliklerle ayrılırken onay istenir.
- Kapak silinirse ilk kalan resim yeni kapak olur; resim kalmazsa kapak null olur ve kartta yer tutucu gösterilir. Oluşturma sonrasında boş veya sadece videolu galeri mümkündür.

## Güvenli medya yükleme ve kayıt

API yalnızca giriş yapmış yöneticiye kısa ömürlü, rastgele key'li imzalı yükleme izni verir. R2 CORS izinleri gerçek frontend origin'leriyle sınırlanır. Başlangıç önerisi: JPEG/PNG/WebP resim en fazla 10 MB, MP4/WebM video en fazla 100 MB; etkinlik başına 50 medya. SVG/HTML gibi aktif içerikler kabul edilmez. Transcoding yoktur; video tarayıcıyla uyumlu codec içermelidir.

Sunucu yükleme tamamlandıktan sonra nesnenin boyutunu ve dosya imzasını doğrular; istemci MIME beyanına güvenmez. Başarısız doğrulamada nesne silinir. Doğrulanan yükleme kaydı onu yapan yöneticiye bağlanır; başka nesneye erişim/silme engellenir.

Yükleme dosyayı geçici olarak depolar ama etkinliği hemen değiştirmez. Oluşturma/güncelleme endpoint'i yalnızca doğrulanmış, sahipliği uygun medya ID'lerini kabul eder; tüm alanları ve diziyi tek etkinlik güncellemesinde kaydeder. `version` kontrolü eşzamanlı düzenlemede sessiz veri ezilmesini engeller.

Kaydet öncesi silme/sıralama/kapak işlemleri taslağı değiştirir. R2'den eski dosya silme yalnızca MongoDB kaydı başarıyla güncellendikten sonra yapılır. Silme hataları kayıt başarısını geri almaz, yeniden denenmek üzere tutulur. Etkinlik silmede de önce görünür kayıt kaldırılır, sonra medya temizlenir.

MongoDB destekli bekleyen yükleme/temizleme kayıtları ve tekrar çalıştırılabilir bir bakım komutu bulunur. VM'de günlük zamanlama ile kayda bağlanmamış 24 saatten eski yüklemeler ve bekleyen silmeler temizlenir. Bakım, canlı bir etkinlikte referansı bulunan nesneyi silmez. Sadece MongoDB TTL kullanmak R2 dosyasını silmeyeceğinden yeterli değildir.

## Endpoint kapsamı

- Public: etkinlik listeleme ve detay, iletişim ve deneme talebi.
- Admin: oturum aç/kapat/kontrol, etkinlik oluştur/güncelle/sil, medya yükleme izni/tamamlama.
- Güncelleme kategori, alanlar, medya sırası ve cover ID'yi birlikte doğrular. Yinelenen ID, yabancı medya, geçersiz kapak ve geçersiz tarih reddedilir.
- Sunucu istemciye güvenli hata döndürür; sırlar ve form içerikleri loglara yazılmaz.

## Kurulum ve teslim

Örnek ortam dosyaları: MongoDB URI/db adı, uygulama origin'i, SMTP ayarları, Turnstile site/secret ve hostname, R2 endpoint/bucket/kimlik bilgileri/public origin. Frontend'e yalnızca Turnstile public site key verilir.

Dokümantasyon; MongoDB kullanıcı/veritabanı ve indeks kurulumu, TLS ve ağ erişimi, Vercel root/workspace ayarları, R2 bucket/CORS/medya alan adı, Turnstile domain kaydı, SMTP, admin oluşturma ve bakım zamanlamasını kapsar. Gerçek hesap/VM erişimi sağlanmadan canlı kurulum yapılmış sayılmaz. MongoDB için yalnızca uygulamanın kendi veritabanına yetkili kullanıcı kullanılır.

## Doğrulama ve kapsam sınırı

Kritik testler: oturumsuz admin erişimi, hatalı Turnstile ile e-posta gönderilmemesi, SMTP hatası, alan doğrulamaları, medya sahipliği/boyut/tür, kapak/sıra kuralları, sürüm çakışması ve canlı dosyaların temizlenmemesi. Frontend typecheck/build; tarayıcıda form durumları, filtreler, giriş/çıkış, oluşturma, yerinde düzenleme, sürükleme, klavye erişimi ve mobil akış doğrulanır.

Kapsam dışı: çoklu yönetici/rol yönetimi, öğrenci üyeliği, takvim rezervasyonu, e-posta arşiv paneli, video dönüştürme ve gelişmiş medya kütüphanesi. Tasarımdaki geliştirici önerileri kullanıcı onayında değiştirilebilir; küçük uygulama ayrıntıları geliştiriciye bırakılır.
