# Bağımsız ortak gateway

## Amaç ve sınırlar

Kaizen API, MongoDB'nin bulunduğu Oracle instance üzerinde Docker container'ında çalışacak. Web Vercel'de kalacak. HTTPS giriş noktası uygulamalardan bağımsız bir Caddy Compose projesi olacak.

- Gateway kaynakları `hayrihabip.com/DevOps/gateway/` altında bulunacak.
- Kaizen domain, proxy ve API container tanımları yalnızca Kaizen reposunda bulunacak.
- Aisomedo domain ve proxy tanımları yalnızca Aisomedo reposunda bulunacak.
- Üç reponun kök README dosyaları minimum değişiklikle güncellenecek; ayrıntılı kurulum ilgili ops klasöründe olacak.
- Canlı sunucu, DNS ve Vercel hesabında bu çalışma kapsamında işlem yapılmayacak. Gerçek hostname ve bağlantı bilgileri ortamdan verilecek; sırlar commit edilmeyecek.

## Değerlendirilen yaklaşımlar

1. Aisomedo Caddy'sini paylaşmak: küçük değişiklik, ancak gateway'in yaşam döngüsü Aisomedo'ya bağlı kalır.
2. Ayrı ortak gateway: bağımsız deploy/restart, uygulamalara ait ayarların kendi repolarında kalması. Kullanıcının seçimi budur.

Gateway de aynı Oracle instance üzerinde olduğundan sunucu ve HTTPS gateway kesintileri ortak hata noktaları olmaya devam eder.

## Gateway sözleşmesi

Ortak proje yalnızca Caddy, sertifika/config volume'leri, genel site dosyası import'u ve işletim talimatlarını içerir. Uygulama domain'leri ve upstream servis adları burada bulunmaz.

Her uygulamanın kendi ops dosyaları, uygulamaya özel site dosyasını ve ortak gateway'e uygulanacak Compose override'ını sağlar. Gateway her uygulama için ayrı dış Docker ağına bağlanır; uygulamaların DB ağları paylaşılmaz. Bu override'lar sunucuda gateway'in Compose komutuna açıkça eklenir ve aynı komut sonraki gateway yönetim işlemlerinde korunur.

Uygulama ayarı güncellenirken Caddy yapılandırması önce doğrulanır, sonra reload edilir. Normal uygulama deploy'u ortak gateway'i yeniden oluşturmaz. Başka bir uygulamanın geçersiz site dosyası mevcut çalışan konfigürasyonun yerini alamaz.

## Aisomedo

Mevcut `existing-proxy` modu temel alınır. İç Caddy, statik web ve backend yönlendirmelerini sunmaya devam eder. Dış gateway HTTPS'yi sonlandırır ve iç Caddy'ye erişir. Yalnızca iç gateway dış proxy ağına katılır; PostgreSQL/backend/worker özel ağda kalır.

Yeni ağ/site tanımlarının mevcut release bundle, deploy ve rollback sürecine uyumu sağlanır. `dojo-prod` proje adı ve mevcut volume adları değiştirilmez. Local ve dedicated çalışma seçenekleri bozulmaz. Mevcut log gizleme kuralları ve proxy güven sınırları korunur.

## Kaizen

API için Dockerfile, Compose, örnek üretim ortamı ve uygulamaya ait gateway adaptörü eklenir. Container API'yi tüm container arayüzlerinden dinler; host üzerinde public API portu yayımlanmaz. API'nin MongoDB erişimi mevcut kurulum türüne göre özel ağ/host adresiyle yapılandırılır; container içindeki localhost host MongoDB değildir. MongoDB taşınmaz, yeniden kurulmaz veya verisi değiştirilmez.

Vercel artık backend uygulamasını çalıştırmaz. `/api/*` dış HTTPS API'ye aktarılır; frontend göreli API yollarını, host-only Secure/HttpOnly/SameSite cookie ve origin/CSRF kontrollerini korur. API sırları Vercel'den kaldırılır. Eski backend paketleme/kopyalama adımları temizlenir; shared frontend tipleri korunur.

Rate limit gerçek istemci IP'sini yalnızca doğrulanmış proxy zincirinden kabul eder. Public API'ye doğrudan gönderilen kullanıcı başlıkları güvenilir sayılmaz. Vercel external rewrite davranışı güncel doküman ve testle doğrulanmadan eski `VERCEL`/`x-real-ip` güveni taşınmaz; güvenli aktarım sağlanamıyorsa karar kullanıcıya sunulur.

## Geçiş ve doğrulama

Önce yeni dosyalar, ağlar ve container'lar hazırlanır; mevcut 80/443 sahibi kaydedilir. Aisomedo iç gateway'i public portları bırakır, ortak gateway portları devralır. Kısa kesinti ihtimali ve eski port düzenine dönüş adımları belgelenir. Volume silme veya genel `down -v` komutu kullanılmaz.

Kontroller: Compose render, Caddy adapt/validate, ağ izolasyonu, API unit/integration testleri, auth/CSRF/rate-limit testleri, Aisomedo ops testleri ve deploy bundle uyumu, frontend build/typecheck. Canlı HTTPS, sertifika yenileme, gerçek MongoDB/R2/Turnstile bağlantıları sunucuya erişim gerektiren ayrı doğrulamalardır.

## Güncellenen işletim koşulları: kaynak kodsuz sunucu ve otomatik CI/CD

Bu bölüm önceki sunucuda clone/build ve MongoDB topolojisini değiştirme önerilerinin yerine geçer.

- Sunucuda kaynak kod veya build aracı olmayacak. Yalnız Docker/Compose, Bash/standart Linux işletim araçları, deployment paketleri ve sunucuya özel ortam dosyaları bulunacak.
- MongoDB'nin mevcut public portu, IP izinleri, bind/firewall ve authentication/TLS ayarları değiştirilmeyecek. API mevcut URI'yi kullanacak; container erişimi sağlanamazsa işlem mevcut DB'yi değiştirmeden duracak.
- Manuel deployment alternatifi sunuldu; kullanıcı GitHub'dan SSH üzerinden tam otomatik CI/CD seçti.
- Kaizen varsayılan production branch'i `main` (yerel `origin/HEAD` ile doğrulandı). PR/push kontrollerinden sonra yalnız `main` sürümleri yayımlanıp otomatik deploy edilecek; development branch'inde çalışmak kendiliğinden production deploy başlatmayacak.
- GitHub Actions testleri üretim veritabanına bağlanmayacak. API image'ı linux/amd64 ve linux/arm64 için GHCR'a yayımlanacak; sunucu tag yerine immutable digest kullanacak.
- Workflow yalnız doğrulanmış SSH host key ile küçük release paketini aktaracak. Docker pull yetkisi ilk sunucu kurulumunda sağlanacak; API sırları sunucu ortam dosyasında kalacak.
- Bash deploy aracı release/image/path doğrulaması, tek deployment kilidi, önce pull, bounded sağlık kontrolü ve başarısız güncellemede önceki release'e otomatik dönüş sağlayacak. İlk kurulum başarısızsa önceki release olmadığı açıkça bildirilecek. Sunucuda git clone, npm/pnpm install veya docker build çalışmayacak.
- Normal Kaizen deployment'ı ortak gateway'i veya Aisomedo'yu yeniden başlatmayacak. Gateway'in ilk kurulumu ve DNS/credential hazırlığı bir kez operatör tarafından yapılacak; uygulama release'leri sonrası manuel deploy komutu gerekmeyecek.
- Aisomedo'nun mevcut CI/CD'si korunacak. Kendi site/adaptör dosyaları onun paketinde, ortak gateway'in genel dosyaları hayrihabip.com paketinde bulunacak; clone yollarına dayanan rehberler paket yollarına çevrilecek.
- İlk geçişte Vercel ayarları ve gateway'in port devri koordineli yapılacak. Vercel web deployment'ı mevcut Vercel entegrasyonuyla devam edecek; bu çalışma yeni bir Vercel yönetim otomasyonu eklemeyecek.
