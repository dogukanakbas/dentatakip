# DentaTakip — Yeni Nesil Diş Muayenehanesi & WhatsApp Otomasyon Platformu (dentatakip.com)

**DentaTakip (`dentatakip.com`)**, Türkiye'deki diş hekimleri ve solo/çoklu muayenehaneler için tasarlanmış, **kurulumu 5 dakika süren**, **WhatsApp ile hasta takibi ve tahsilatı otomatikleştiren**, **FDI Odontogram**, **QR Dijital Onam** ve **Protez Laboratuvarı** takibi sunan yeni nesil bulut & yerel destekli muayenehane platformudur.

---

## 🌟 Öne Çıkan Özellikler

### 1. Hasta Yönetimi & Odontogram
- **360° Hasta Kartı:** Ad soyad, telefon, T.C. kimlik no, doğum tarihi, kan grubu ve özel uyarılar.
- **İnteraktif FDI Odontogram (Yetişkin 32 & Süt Dişi 20):** Diş numarasına tıklandığında anında işlem, tedavi notu ve ücret belirleme.
- **23 Hazır Dijital Onam & QR İmza Modülü:** Hastanın telefon kamerasından QR okutarak KVKK/TDB uyumlu onam imzalama.

### 2. Takvim, Randevu & WhatsApp Otomasyonu
- **Günlük & Haftalık Görünüm:** Çakışma denetimli akıllı randevu takvimi.
- **Resmi Meta WhatsApp Business API Otomasyonu:** Randevudan 24 saat önce hastaya otomatik onay linki gönderimi.
- **Canlı WhatsApp Simülatörü:** Hekimin ekranda interaktif iPhone sohbet arayüzü üzerinden hastanın gözünden mesajları inceleyebileceği simülasyon.

### 3. Ödeme, Finans & Protez Laboratuvarı
- **Hasta Cari & Taksitli Tedavi Planı:** Toplam tedavi bedeli, tahsil edilen ve kalan borç tutarının anlık takibi.
- **Protez Laboratuvarı İş Emri Takibi:** Zirkonyum, Lamine, İmplant provalarının aşama takibi.

---

## 🚀 VPS Sunucuda (dentatakip.com) Yayına Alma Rehberi (Ubuntu / Debian Linux)

`dentatakip.com` alan adınızla projemizi bir VPS sunucuda (DigitalOcean, AWS, Hetzner, Vultr vb.) canlıya almak için aşağıdaki adımları sırasıyla uygulayabilirsiniz:

### 1. Adım: Sunucu Ön Hazırlığı ve Node.js Kurulumu
Sunucunuza SSH ile bağlanın ve Node.js v20 LTS ile gerekli araçları yükleyin:
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git build-essential
```

### 2. Adım: Proje Dosyalarını Sunucuya Aktarma
Projenizi `/var/www/dentatakip` klasörüne taşıyın ve bağımlılıkları yükleyin:
```bash
sudo mkdir -p /var/www/dentatakip
# Dosyalarınızı SFTP/Git ile /var/www/dentatakip içine yükleyin
cd /var/www/dentatakip
npm install --omit=dev
```

### 3. Adım: PM2 ile Arka Plan Servisi Olarak Başlatma
Sunucu yeniden başlasa bile uygulamanızın kesintisiz çalışması için PM2 kullanın:
```bash
sudo npm install -g pm2
pm2 start server.js --name "dentatakip-backend"
pm2 save
pm2 startup
```

### 4. Adım: Nginx Reverse Proxy Yapılandırması
`sudo nano /etc/nginx/sites-available/dentatakip.com` dosyasını oluşturun ve aşağıdaki yapılandırmayı ekleyin:

```nginx
server {
    listen 80;
    server_name dentatakip.com www.dentatakip.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Nginx ayarını etkinleştirin ve test edin:
```bash
sudo ln -s /etc/nginx/sites-available/dentatakip.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Adım: Ücretsiz SSL Sertifikası (HTTPS - Let's Encrypt)
`dentatakip.com` için HTTPS güvenlik sertifikasını tek komutla kurun:
```bash
sudo certbot --nginx -d dentatakip.com -d www.dentatakip.com --non-interactive --agree-tos -m admin@dentatakip.com --redirect
```

### 6. Adım: Güvenlik Duvarı (UFW) Yapılandırması
Sadece HTTP (80), HTTPS (443) ve SSH (22) portlarına izin verin:
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

Tebrikler! Artık `https://dentatakip.com` adresine girdiğinizde **DentaTakip** muayenehane yazılımınız canlı veritabanı, çoklu hekim desteği ve KVKK 6698 uyumuyla yayında çalışacaktır!

---

## 🎨 Lisans & İletişim
© 2026 DentaTakip SaaS Platformu • Tüm Hakları Saklıdır.
Destek: `destek@dentatakip.com`
