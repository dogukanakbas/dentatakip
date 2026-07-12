# Solo Hekim Pro — Ticari Satış & Canlıya Alma Rehberi

Bu rehber, **Solo Hekim Pro** yazılımını ticari bir **SaaS (Software as a Service)** olarak canlıya alıp diş hekimlerine aylık abonelikle satmak için yapmanız gereken adım adım işlemleri açıklamaktadır.

---

## 1. Paket İçeriği ve Dosya Yapısı

| Dosya Adı | Açıklama |
| :--- | :--- |
| `landing.html` | Müşteriler (diş hekimleri) için değer önerisi ve fiyatlandırma sunan yüksek dönüşümlü **SaaS Satış Sayfası**. |
| `login.html` | Hekim ve asistanlar için giriş ve **5 Dakikada Muayenehane Kurulum Sihirbazı**. |
| `index.html` | Solo hekimlerin günlük randevu, hasta, cari ödeme ve WhatsApp otomasyonunu yönettiği **Ana Panel**. |
| `supabase_schema.sql` | Çoklu muayenehane (Multi-Tenant) izolasyonlu, KVKK uyumlu PostgreSQL veritabanı şeması. |
| `js/settings.js` | Meta WhatsApp Business API Token girişi ve KVKK veri yedeği indirme modülü. |

---

## 2. Ücretsiz veya Düşük Maliyetle Canlıya Alma (Hosting & Domain)

Uygulama statik HTML/CSS/JS önyüz dosyaları içerdiği için en hızlı şekilde global CDN destekli platformlarda canlıya alınabilir:

### Seçenek A: Vercel / Netlify (En Kolay 1 Dakikada Kurulum)
1. `/Users/erlikhan/Downloads/mahmutproje` klasörünüzü bir GitHub reposuna yükleyin.
2. [Vercel](https://vercel.com) veya [Netlify](https://netlify.com) paneline giriş yapıp reponuzu seçin.
3. Çıktı klasörüne dokunmadan **Deploy** butonuna basın.
4. Kendi alan adınızı (örn: `www.solohekimpro.com`) Vercel/Netlify alan adı ayarlarından bağlayın.
5. Ana giriş sayfanız otomatik olarak `landing.html` veya `index.html` olarak açılacaktır. (Önerilen: Kök alan adından `landing.html` açılsın, giriş yapanlar `index.html`'ye yönlensin).

---

## 3. Bulut Veritabanı Kurulumu (Supabase ile 10 Dakika)

Müşterilerinize çoklu cihaz (telefon + bilgisayar) senkronizasyonu sunmak istediğinizde:

1. [Supabase.com](https://supabase.com) üzerinde ücretsiz bir proje oluşturun.
2. Sol menüden **SQL Editor** kısmına gelin.
3. Proje klasörünüzdeki **`supabase_schema.sql`** dosyasının içeriğini kopyalayıp SQL Editor'e yapıştırıp **Run** deyin.
4. Supabase **Project Settings > API** bölümünden `Project URL` ve `anon public key` değerlerinizi alın.
5. Uygulama içerisindeki **Ayarlar & KVKK** menüsünden veya `js/api-client.js` içinden bu bilgileri tanımlayarak bulut senkronizasyonunu aktifleştirin.

---

## 4. Meta WhatsApp Business API Resmi Entegrasyonu Nasıl Açılır?

Solo Hekim Pro'nun en büyük farklılaştırıcısı olan otomatik randevu hatırlatmalarını resmi olarak işletmek için:

1. **Meta Developers (developers.facebook.com)** üzerinde bir uygulama (`Business Application`) oluşturun ve **WhatsApp** ürününü ekleyin.
2. Müşterinizin (diş hekiminin) muayenehane sabit veya mobil telefon numarasını Meta WhatsApp Business hesabına bağlayın.
3. Meta panelinde **Şablon Mesajlar (Message Templates)** oluşturun:
   - **Randevu Hatırlatma Şablonu:** `"Sayın {{1}}, {{2}} tarihindeki randevunuzu onaylamak için aşağıdaki butona tıklayın."` (İnteraktif Buton: `[Onaylıyorum]`)
   - **Ödeme Hatırlatma Şablonu:** `"Sayın {{1}}, tedavinizle ilgili kalan {{2}} TL borç kaydınız hatırlatılır."`
4. Meta'dan aldığınız **Phone Number ID** ve **Access Token** değerini uygulamanın **Ayarlar & KVKK > Meta WhatsApp Business API Bağlantısı** ekranına girin.

---

## 5. Satış ve Fiyatlandırma Stratejisi (PRD Bölüm 11)

- **Sabit Fiyat Güvencesi:** Satış sayfasında (`landing.html`) sunulduğu gibi karmaşık modül ücretleri yerine tek bir sade aylık paket (örn: **1.490 ₺/Ay**) önerilir.
- **14 Gün Ücretsiz Deneme:** Hekimler `login.html?signup=true` üzerinden kredi kartı girmeden 5 dakikada muayenehanesini kurup denemeye başlayabildiği için satışa dönüşüm oranı (Conversion Rate) çok yüksek olacaktır.
- **KVKK Güvencesi:** Hekimlere verilerinin Türkiye'de saklandığı ve istedikleri zaman **Ayarlar > KVKK** menüsünden tek tıkla tam yedek indirebilecekleri vurgulanmalıdır.
