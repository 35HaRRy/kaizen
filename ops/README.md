# Kaizen: kaynak kodsuz Oracle sunucusu ve otomatik CI/CD

Web Vercel'de kalır. API image'ı GitHub Actions'ta build edilir ve GHCR'dan
sunucuya **digest ile** çekilir. Sunucuda repo clone'u, uygulama kaynak kodu,
Node/pnpm veya `docker build` gerekmez. MongoDB'nin mevcut URI/port/IP izinleri,
firewall ve TLS ayarları **değiştirilmez**.

## Akış

`master` push → test/typecheck/build + Linux deploy testleri + gerçek Docker
rollback testi → amd64/arm64 image → GHCR → release paketi → SSH/SCP → otomatik
deploy. PR/development kontrolleri üretime erişmez. `workflow_dispatch` yalnız
`master` üzerinde yayın yapar. Vercel web yayını mevcut entegrasyonla devam eder.

`ops/compose.yml` yalnız image çalıştırır; build içermez. `compose.build.yml`
sadece yerel/CI build alternatifi olup sunucu paketine girmez. `package.sh`
yalnız Compose, deploy aracı, image/revision metadata ve Kaizen'in gateway
dosyalarını paketler; `.env`, kaynak kod ve bağımlılıklar pakete girmez.

## 1. Bir defalık sunucu hazırlığı

Linux: Docker Engine + güncel Compose (`--wait` desteği), Bash, GNU coreutils,
diffutils (`cmp`), util-linux (`flock`) ve SSH gerekir. Deploy kullanıcısının Docker
ve `/srv/kaizen` erişimi olmalı; Docker yetkisi pratikte host yönetim yetkisidir.
Sunucu değişkenleri/SSH hesabı aşağıdaki örnek yollardan farklıysa uyarlayın.

```sh
install -d -m 700 /srv/kaizen/config/gateway
docker network create gateway-kaizen
```

Mevcut ağ varsa inspect edip yeniden kullanın. GitHub runner'ın SSH erişimini
mevcut ağ politikanıza göre sağlayın; dar IP izinlerinde sabit çıkışlı runner
gerekebilir. Bunun için MongoDB izinlerini değiştirmeyin. API 3001 portu host'a
yayımlanmaz. Yeni API DNS A kaydını Oracle public IP'ye ekleyin; mevcut Aisomedo
DNS kaydını koruyun. Ortak gateway için TCP 80/443 açık olmalı.

`ops/.env.example` içeriğini **güvenli biçimde**, gerçek değerlerle
`/srv/kaizen/config/production.env` olarak sunucuya yerleştirin ve `chmod 600`
uygulayın. Bu dosya release klasörlerinin dışında kalır:

- `MONGODB_URI`: mevcut URI, aynen; `MONGODB_DB`: mevcut DB.
- `APP_ORIGIN`: canonical **web** HTTPS origin'i, API domain'i değil.
- `ORIGIN_SECRET`: `openssl rand -hex 32` ile üretilmiş 64 karakter hex değer.
- R2/Turnstile backend sırları: mevcut değerler.

Container'ın mevcut MongoDB URI'sine erişimi ayrıca doğrulanmalıdır. Aynı
sunucudaki public IP'ye geri erişim her ağda çalışmayabilir. Bağlantı başarısızsa
deploy başarısız olur; script bind/IP/firewall/TLS ayarını veya URI'yi değiştirmez.
`docker compose config` çıktısı sırları içerebilir; paylaşmayın, `--quiet` kullanın.

GHCR image private ise deploy kullanıcısıyla bir kez `docker login ghcr.io`
yapın: yalnız gerekli package için `read:packages` yetkili token'ı
`--password-stdin` üzerinden verin. Token'ı komut geçmişine yazmayın. Public
package için login gerekmez. CI yayınlama için kendi `GITHUB_TOKEN`'ını kullanır;
sunucudaki registry kimliği bundan bağımsızdır.

## 2. GitHub production ortamı

Kaizen repo → Settings → Environments → `production`:

| Tür | Ad | Örnek / açıklama |
| --- | --- | --- |
| Variable | `DEPLOY_HOST` | Sunucunun erişilebilir public IP/hostname'i |
| Variable | `DEPLOY_PORT` | `22` veya mevcut SSH portu |
| Variable | `DEPLOY_USER` | Docker yetkili deploy kullanıcısı |
| Variable | `DEPLOY_ROOT` | `/srv/kaizen` (mutlak, boşluksuz yol) |
| Variable | `DEPLOY_ORIGIN` | `https://api.siteadresiniz.com`, sonda `/` yok |
| Secret | `DEPLOY_SSH_KEY` | Bu hesaba ait SSH private key |
| Secret | `DEPLOY_KNOWN_HOSTS` | Güvenilir kanaldan doğrulanmış sunucu host key kaydı |

Host key fingerprint'ini sunucu konsolundan doğrulayın; deploy sırasında kör
`ssh-keyscan`/`StrictHostKeyChecking=no` kullanılmaz. Standart dışı SSH portunda
known_hosts kaydı `[host]:port` biçiminde olmalı. Secrets'ı PR/build ortamına veya
repoya koymayın. Tam otomatik yayın için production ortamında manuel reviewer
bekletmeyin; erişimi master branch ile sınırlandırın.

## 3. İlk paket ve ortak gateway (bir kez)

Önce `master` üzerinde CI'ın image ve `api-release-SHA` artifact'ını üretmesini
sağlayın. Sunucu hazırlığı henüz bitmediyse ilk deploy job'ının başarısız olması
normaldir; hazırlık bitince **yalnız failed deploy job'ını** yeniden çalıştırın.
Publish başarılı olduğu için mevcut artifact/digest tekrar kullanılabilir.

Artifact'ı güvenilir kanaldan indirip yalnız `gateway/` içeriğini bir kez
`/srv/kaizen/config/gateway/` altına yerleştirin. Normal API deploy'u bu kalıcı
gateway dosyalarını değiştirmez/restart etmez. Routing değişiklikleri ayrı gateway
operasyonudur; yeni dosyaları doğrulamadan aktifleştirmeyin.

Ortak Caddy'nin genel paketi `hayrihabip.com` repo'sundaki **Package shared
gateway** workflow artifact'ındadır; `/srv/shared-gateway/` altına açılır.
Aisomedo site/adaptörü kendi release paketinden kendi kalıcı config dizinine
kurulur. Hiçbir repo sunucuda clone edilmez. Aisomedo'nun paket tabanlı port devri
ve state adoption adımları kendi `ops/gateway/README.md` rehberindedir.

`/srv/shared-gateway/config/gateway.env` örneği (backend sırrı içermez):

```dotenv
AISOMEDO_DOMAIN=mevcut-aisomedo-domaininiz.com
AISOMEDO_GATEWAY_CONFIG=/srv/aisomedo/config/gateway/gateway-aisomedo.caddy
KAIZEN_API_DOMAIN=api.siteadresiniz.com
KAIZEN_GATEWAY_CONFIG=/srv/kaizen/config/gateway/kaizen.caddy
```

İki uygulama adaptörünü içeren tam komut:

```sh
gateway() {
  docker compose --env-file /srv/shared-gateway/config/gateway.env \
    -f /srv/shared-gateway/compose.yml \
    -f /srv/aisomedo/config/gateway/gateway-adapter.yml \
    -f /srv/kaizen/config/gateway/compose.yml "$@"
}
gateway run --rm --no-deps gateway caddy validate --config /etc/caddy/Caddyfile
# Aisomedo public portları bıraktıktan sonra:
gateway up -d --wait
```

Gateway API'den önce açılabilir: ilk API deploy'una kadar Kaizen API 502 döner,
mevcut Vercel backend'iyle web erişimi devam eder. Gateway'in kendi healthcheck'i
upstream'e bağlı değildir. Caddy public sertifikayı otomatik alır/yeniler.

## 4. Otomatik deploy ve rollback

Hazırlık sonrası failed deploy job'ını tekrar çalıştırın. Sonraki master push'ları
otomatik yayımlanır. Workflow eski commit'leri atlar; deployment'lar concurrency
grubu ve sunucuda `flock` ile seri çalışır. Release'in checksum/digest/path
kontrolleri yapılır, image önceden çekilir, `--no-build --pull never --wait`
ile başlatılır. Authenticated DB erişimi ve public HTTPS health kontrol edilir.

Başarıyla `releases/SHA`, `current` ve `previous` kayıtları tutulur. Başarısız
güncelleme önceki release'i otomatik başlatır ve job kırmızı kalır. İlk kurulumda
önceki release yoksa başarısız API durdurulur; sahte başarılı state yazılmaz.
Deployment schema migration veya volume silme yapmaz. DB yedeği yerine geçmez.

Aynı SHA'nın farklı içerik/digest ile üstüne yazılmaz; publish job'ını tekrar
build etmek yerine failed deploy job'ını tekrar çalıştırın veya yeni commit
yayımlayın. Tüm release dosyalarını/digest metadata'sını rollback için koruyun.
Manuel acil rollback (ilk kurulum dışında):

```sh
ROOT=/srv/kaizen
CURRENT=$(cat "$ROOT/current")
bash "$ROOT/releases/$CURRENT/deploy.sh" rollback "$ROOT" https://api.siteadresiniz.com
```

Script çıktısına backend sırları/driver hataları basılmaz. Hata teşhisinde
sunucudaki API loglarını yerel inceleyin; env/header/body loglamayın.

## 5. Vercel ve son doğrulama

Root=`web`, framework=Vite, root dışındaki `shared/` dahil; Node sürümü repo
gereksinimi 26.13+ ile uyumlu olmalı. API sağlıklı olduktan sonra Vercel'e
`API_ORIGIN=https://api.siteadresiniz.com`, API ile **aynı** sensitive
`ORIGIN_SECRET` ve public `VITE_TURNSTILE_SITE_KEY` verip redeploy edin.
MongoDB/R2/Turnstile backend sırlarını başarılı geçişten sonra Vercel'den kaldırın;
geri dönüş için güvenli kopyalarını koruyun. Preview için ayrı test API/DB kullanın.

Vercel secret başlığını overwrite eder; API timing-safe doğrular, sonra `x-real-ip`
kabul edilir. Tarayıcı göreli `/api` kullanır; host-only Secure/HttpOnly/SameSite
cookie, Origin ve CSRF korunur. API cache'i kapalıdır. R2 CORS/Turnstile hostname'i
web adresinde kalır. Secret rotasyonu API + Vercel koordinasyonu gerektirir.

Her iki domain'de health, web üzerinden `/api/events`, admin login/logout,
deep link, gerçek yükleme ve iki formu kontrol edin. API domain'inde secretsız
`/api/events` **403** olmalı. Aisomedo live/media akışlarını da doğrulayın.

Günlük medya temizliği (sunucuda Node gerekmez):

```cron
15 3 * * * ROOT=/srv/kaizen; SHA=$(cat "$ROOT/current"); KAIZEN_API_IMAGE=$(cat "$ROOT/releases/$SHA/image") /usr/bin/docker compose --env-file "$ROOT/config/production.env" -p kaizen -f "$ROOT/releases/$SHA/compose.yml" exec -T api node api/tools/maintenance.js >> /var/log/kaizen-media-cleanup.log 2>&1
```

Admin/import bakım araçları da çalışan API container'ında `node api/tools/…js`
ile çalışır; mevcut admin'i yeniden oluşturmayın. Volume/certificate prune veya
`down -v` kullanmayın. DNS/TLS yenilenmesi, disk, DB/R2 yedeklerini izleyin.
