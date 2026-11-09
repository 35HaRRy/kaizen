# Kullanıcı mesajları

## Amaç ve kapsam

SMTP ve uygulamadan e-posta gönderimi kaldırılır. “Hızlı Mesaj Gönderin” ve “Ücretsiz Deneme Dersi” formlarının mevcut API uçları, doğrulama ve spam korumasını koruyarak gönderilen alanları veritabanına kaydeder. Yeni kayıtlar okunmamıştır.

## Yaklaşımlar

- **Seçilen:** İki form tek mesaj koleksiyonunda form türüyle saklanır. Tek liste ve ortak okunma davranışı için en az tekrar gerektirir. Kullanıcı bu yaklaşımla ilerlemeyi onayladı.
- Alternatif: Her form için ayrı koleksiyon. Aynı liste ve okunma işlemlerini iki yerde uygulamayı gerektirdiği için seçilmedi.

## Davranış

- Admin menüsüne mevcut tasarıma uygun “Kullanıcı mesajları” bağlantısı eklenir.
- Liste en yeni kayıtları önce gösterir; gönderen, form türü, tarih ve okunma durumu görünür.
- Detay ekranı ilgili formda doldurulan tüm alanları gösterir.
- Detay başarıyla açıldığında mesaj okunmuş işaretlenir. Okunma durumu tüm yöneticiler için ortaktır.
- Mesaj listeleme, detay ve okunma işlemleri mevcut admin kimlik doğrulamasıyla korunur. Durum değiştiren işlem mevcut CSRF korumasını kullanır.
- SMTP kodu, bağımlılıkları, ortam değişkeni örnekleri ve ilgili dokümantasyon temizlenir.

## Sınırlar ve doğrulama

Silme, yanıtlama, eski e-postaların aktarımı ve yönetici başına okunma takibi yoktur. Mevcut etkinlik yönetimi korunur. Kayıt, doğrulama, yetkisiz erişim ve ortak okunma davranışı test edilir; tür kontrolü ve mevcut ilgili testler çalıştırılır.

## Uygulayıcının kararları

Alan adları, API yolları, sayfalama ve ekran ayrıntıları mevcut proje kalıplarına uyarlanır; yeni bağımlılık eklenmez. Veritabanı kaydı başarısızsa form başarı yanıtı vermez.
