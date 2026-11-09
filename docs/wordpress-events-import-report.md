# WordPress etkinlik aktarımı — 9 Kasım 2026

Kaynak: https://kaizenaikidoakademi.wordpress.com/etkinlikler/

Hedef: Kullanıcının onayladığı `api/.env` MongoDB ve R2 yapılandırması. Bağlantı sırları bu raporda yer almaz.

## Aktarım sonucu

| Kontrol | Sonuç |
| --- | --- |
| Kaynak liste | Dört sayfa, 20 etkinlik |
| Yeni etkinlik | 20 |
| R2'ye aktarılan galeri görseli | 315 |
| Başarısız etkinlik | 0 |
| Mevcut etkinlik | 1; alanları değişmeden korundu |
| Mevcut yükleme | 12; alanları değişmeden korundu |
| Son toplam | 21 etkinlik, 327 yükleme kaydı |
| Tekrar çalıştırma | 0 yeni kayıt, 20 atlanan etkinlik, 0 hata |
| Tekrar çalıştırma sonrası karşılaştırma | Tüm etkinlik ve yükleme belgeleri bire bir aynı |
| Kaynak/hedef ve R2 dosya doğrulaması | 20/20 etkinlik, 315/315 nesne doğrulandı; 0 hata |

Başlıklar, listede görünen tarihler, kapak kimlikleri ve galeri sırası korunmuştur. Kısa açıklamalar başlıklardan türetilmiştir. Konumlar İstanbul, Ankara, İzmir ve Çanakkale olarak çıkarılmış; konumsuz başlıklarda İstanbul kullanılmıştır.

`--verify` bütün kayıtların başlık, tarih, tür, konum, açıklama, kaynak ve kapak kimliğini karşılaştırdı; 315 görselin sırasını, yükleme bağlantısını, mevcut yönetici sahipliğini, R2 boyutunu, dosya imzasını ve hedef URL'sini kontrol etti. Kontrol sıfır hata ile tamamlandı.

Tür dağılımı: **5 Kyu sınavları**, **1 Dojo yaşamı**, **14 belirtilmemiş**. Yalnızca şehir/tarih içeren başlıklara kanıtsız “Seminerler” türü verilmemiştir. Çocuk Kyu sınavları sınav türünde tutulmuştur. Türü boş kayıtlar yönetimde **Belirtilmemiş** seçeneğiyle düzenlenebilir.

## Görüntüleme ve düzenleme kontrolleri

- Yerel çalışan gerçek API'nin etkinlik listesi 20 aktarılan kaydı döndürdü; 20 detay adresinin tamamı HTTP 200 verdi.
- Yerel ziyaretçi sayfasında 20 aktarılan etkinlik ve korunmuş eski etkinliğin başlıkları görüldü; liste hata uyarısı göstermedi.
- Gerçek geçici MongoDB kullanan entegrasyon testi, aktarılan medyanın mevcut yöneticiye bağlı olduğunu ve etkinliğin kimlik doğrulamalı API üzerinden düzenlenebildiğini doğruladı. Kesilen indirme, başarısız DB yayını, tekrar çalıştırma, kullanıcı düzenlemelerinin korunması ve bakım temizliği de test edildi.
- Gerçek yönetici parolası alınmadı/değiştirilmedi; canlı yönetici hesabıyla tarayıcıda kaydetme yapılmadı.
- Testler: API **15/15**, frontend **16/16** geçti. Typecheck, üretim build'i ve `git diff --check` geçti.

## Medya erişimi ve sınırlar

R2 kimlik doğrulamalı erişimi çalışıyor. Yeni aktarılmış bir kapak görselinin ve önceden mevcut bir görselin herkese açık erişimi dış ağ üzerinden doğrulandı. Ancak bu çalışma ortamında hem Node/curl hem tarayıcı, yapılandırılmış `r2.dev` adresine doğrudan TLS bağlantısında hata veriyor; yerel tarayıcıdaki görseller bu nedenle yüklenmeyebilir. TLS doğrulaması kapatılmadı ve HTTP'ye düşürülmedi.

Her görselin public URL'si ayrı ayrı dış ağdan denenmedi. Bu ağda görüntüleme için erişilebilir bir özel medya alan adı gerekebilir; bu, mevcut kayıtların URL'leriyle birlikte ayrıca ele alınmalıdır.

Kod değişiklikleri çalışma alanında bırakılmıştır; commit, push veya yeni dağıtım yapılmamıştır. Boş tür düzenleme desteğinin yayımdaki sunucuda kullanılabilmesi için bu kodun normal dağıtım sürecinizle yayımlanması gerekir. Staging dosyaları mevcut günlük bakım işlemiyle temizlenecektir; aktarım mevcut R2 nesnelerini silmemiştir.

## Yeniden çalıştırma

```powershell
pnpm -C api events:import
pnpm -C api events:import --apply
pnpm -C api events:import --verify
```

Son komut daha sonra elle düzenlediğiniz alanları kaynak farkı olarak bildirebilir; bunları geri almaz. Tamamlanan etkinliklere kaynakta sonradan eklenen görseller otomatik eklenmez.
