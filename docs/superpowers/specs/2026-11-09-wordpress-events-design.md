# WordPress etkinlik aktarımı

## Amaç ve kapsam

Eski sitenin `/etkinlikler/` listesindeki bütün etkinlikleri, kapakları ve galeri görselleriyle yeni sitede görüntülenebilir ve mevcut yönetici hesabıyla düzenlenebilir yapmak. Kullanıcı hedef olarak `api/.env` bağlantılarını ve tekrar çalıştırılabilir güvenli aktarım yaklaşımını seçti.

Ön inceleme: WordPress API 20 yazı ve içeriklerinde 315 görsel referansı döndürüyor. Liste dört sayfa. En büyük galeri 40 görsel; mevcut 50 medya sınırını değiştirmek gerekmiyor. Hedef MongoDB erişilebilir; 1 yönetici, 1 etkinlik ve 12 yükleme mevcut. Bunlar korunacak. Gerçek bağlantı bilgileri raporlara yazılmayacak.

## Yaklaşımlar

- **Seçilen:** Önce envanter, sonra tekrar çalıştırılabilir aktarım betiği. Kaynak kimliğiyle mükerrer kayıtları engeller, mevcut etkinlikleri güncellemez, yarım kalan dosya aktarımından devam eder.
- Tek kullanımlık aktarım daha kısa hazırlık gerektirir fakat kesinti ve eksik kayıt denetimi daha zordur; seçilmedi.

## Veri eşlemesi

- Başlık ve listede görünen tarih korunur; başlıktaki tarihle değiştirilmez. WordPress HTML karakterleri görünür metne çevrilir.
- Tür yalnızca başlığın anlamıyla belirlenir: sınav → `Kyu sınavları`, diğer çocuk etkinliği → `Çocuk etkinlikleri`, açık seminer → `Seminerler`, antrenman/dojo → `Dojo yaşamı`. Sadece şehir ve tarih içeren belirsiz başlıklar boş bırakılır.
- Konum başlıktaki şehirden alınır; bulunamazsa `İstanbul`.
- Açıklama kısa Türkçe metindir; kaynakta olmayan eğitmen, seminer veya mekan bilgisi uydurulmaz.
- Listedeki tanıtım görselinin özgün dosyası kapak olur; galeri sırası korunur. Kapak galeride zaten varsa aynı dosya ikinci kez eklenmez.

## Uygulama ve güvenlik

WordPress herkese açık API içeriği, dört liste sayfasıyla kapsam açısından karşılaştırılır. Dosyalar yalnızca izin verilen kaynak hostundan indirilir; dosya imzası, boyut ve tür doğrulaması mevcut medya altyapısıyla yapılır. R2 ve MongoDB hedefleri yalnızca `api/.env` üzerinden okunur.

Aktarım varsayılan olarak hedefe yazmayan envanter kipinde çalışır; açık yazma seçeneği aktarımı başlatır. Kaynak URL/kimliği sabit hedef kimlikleriyle ilişkilendirilir. Tamamlanmış kayıtlar atlanır; kullanıcı düzenlemeleri ezilmez. Yüklemeler mevcut yöneticinin hesabına ve etkinliğe bağlı olur; bakım işlemi canlı dosyaları silemez. Bir etkinliğin tüm dosyaları doğrulanmadan etkinlik yayımlanmaz. Hatalar başarı gibi raporlanmaz; yeniden çalıştırma ve son doğrulama desteklenir.

Boş tür, ortak tipler, API doğrulaması ve yönetici tür seçicisinde desteklenir. Mevcut dört kategori ve filtreleri korunur. Genel amaçlı göç sistemi, yeni yönetim ekranı, yeni bağımlılık veya içeriklerin yeniden tasarımı kapsam dışıdır.

## Başarı ölçütleri

Kaynak listeyle hedef kayıtlar bire bir eşleşir; başlık, tarih, kapak ve sıralı görsel sayıları doğrulanır. R2 nesneleri erişilebilir olur. Aktarılmış kayıt mevcut API'den okunabilir ve mevcut yöneticiyle sürüm kontrollü düzenlenebilir. Aynı aktarımı ikinci kez çalıştırmak etkinlikleri/dosyaları çoğaltmaz ve sonradan yapılan düzenlemeleri değiştirmez.
