# DentaTakip (dentatakip.com) • Production VPS Sunucu Kurulum ve Yayına Alma Rehberi

Bu rehber, **DentaTakip** akıllı muayenehane ve WhatsApp otomasyon platformunu `dentatakip.com` alan adı (domain) üzerinden **Ubuntu 22.04 / 24.04 LTS veya Debian Linux VPS** sunucunuzda canlıya almanız için adım adım teknik talimatlar içerir.

---

## 🏗️ Mimarinin Özeti
- **Backend Servisi:** Node.js + Express (Port `3000`)
- **Veritabanı:** Better-SQLite3 WAL Modu (`solohekim_production.db`)
- **İşlem Yöneticisi (Process Manager):** PM2 (Otomatik yeniden başlatma ve log yönetimi)
- **Web Sunucusu & Reverse Proxy:** Nginx (Port `80` HTTP ➔ Port `443` HTTPS)
- **SSL Sertifikası:** Let's Encrypt Certbot (Ücretsiz Otomatik Yenilenen HTTPS)

---

## 📋 Adım Adım Kurulum Talimatları

### 1. DNS Yönlendirmesi (Alan Adı Ayarı)
Alan adınızı aldığınız firmanın (Godaddy, Namecheap, Turkticaret, Cloudflare vb.) DNS yönetim panelinden aşağıdaki kayıtları VPS sunucunuzun IP adresine yönlendirin:
- **A Kaydı:** `@` ➔ `SUNUCU_IP_ADRESINIZ`
- **A Kaydı:** `www` ➔ `SUNUCU_IP_ADRESINIZ`

---

### 2. Sunucunun Güncellenmesi ve Gereksinimlerin Yüklenmesi
SSH ile sunucunuza bağlanın (`ssh root@SUNUCU_IP_ADRESINIZ`) ve aşağıdaki komutları çalıştırın:

```bash
# Sistem paketlerini güncelle
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS repository ekle ve kur
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential git nginx certbot python3-certbot-nginx
```

---

### 3. GitHub'dan Projeyi Sunucuya Çekme (`git clone`)
Proje klasörünü doğrudan GitHub deponuzdan `/var/www/dentatakip` dizinine indirin:

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/dogukanakbas/dentatakip.git
```

Dosyalar sunucuya indirildikten sonra klasöre girin ve bağımlılıkları kurun:
```bash
cd /var/www/dentatakip
npm install --omit=dev
```

---

### 4. PM2 ile Kesintisiz Arka Plan Servisi Oluşturma
Uygulamanızın sunucu yeniden başladığında bile otomatik açılması ve çökme durumunda kendini kurtarması için PM2 kullanın:

```bash
# PM2 küresel olarak yükle
sudo npm install -g pm2

# DentaTakip servisini başlat
pm2 start server.js --name "dentatakip-pro"

# Başlangıçta otomatik başlamasını kaydet
pm2 save
pm2 startup
```
*Not: `pm2 startup` komutunun size ekranda verdiği `sudo env PATH=...` komutunu kopyalayıp çalıştırın.*

---

### 5. Nginx Reverse Proxy Yapılandırması
Nginx yapılandırma dosyasını oluşturun:
```bash
sudo nano /etc/nginx/sites-available/dentatakip.com
```

İçerisine aşağıdaki bloğu yapıştırın ve kaydedin (`Ctrl + O`, `Enter`, `Ctrl + X`):

```nginx
server {
    listen 80;
    server_name dentatakip.com www.dentatakip.com;

    client_max_body_size 50M;

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

Ayarları etkinleştirin ve Nginx'i yeniden başlatın:
```bash
sudo ln -s /etc/nginx/sites-available/dentatakip.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

### 6. Ücretsiz Let's Encrypt SSL (HTTPS) Kurulumu
Tek komutla HTTPS sertifikanızı alın ve HTTP trafiğini HTTPS'e yönlendirin:

```bash
sudo certbot --nginx -d dentatakip.com -d www.dentatakip.com --non-interactive --agree-tos -m admin@dentatakip.com --redirect
```

---

### 7. Güvenlik Duvarı (UFW) Ayarları
Sadece web (80, 443) ve SSH (22) trafiğine izin vererek sunucunuzu güvenceye alın:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 🛠️ Yararlı Yönetim Komutları

| İşlem | Komut |
| :--- | :--- |
| Canlı sunucu loglarını izleme | `pm2 logs dentatakip-pro` |
| Uygulamayı yeniden başlatma | `pm2 restart dentatakip-pro` |
| Servisin bellek ve işlemci durumu | `pm2 monit` |
| Veritabanını yedekleme | `cp /var/www/dentatakip/solohekim_production.db /yedekler/db_backup_$(date +%F).db` |

Tebrikler! **DentaTakip (`dentatakip.com`)** muayenehane platformunuz canlı üretim ortamında güvende ve erişime hazır! 🚀
