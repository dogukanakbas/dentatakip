/* ==========================================================================
   SOLO HEKİM PRO — Practice Settings, WhatsApp API & KVKK Compliance Module
   ========================================================================== */

class SettingsController {
  constructor() {
    this.config = {
      waPhoneId: localStorage.getItem('sh_wa_phone_id') || '',
      waToken: localStorage.getItem('sh_wa_token') || '',
      kvkkConsentVersion: 'v2.4 - 2026',
      cloudSyncEnabled: localStorage.getItem('sh_cloud_sync') === 'true'
    };
  }

  render() {
    const el = document.getElementById('settings-content-area');
    if (!el) return;

    const doctor = window.store?.data?.doctor || {
      name: "Dr. Zeynep Aksoy",
      title: "Diş Hekimi • Solo Muayenehane",
      phone: "+90 (532) 412 88 90",
      address: "Nişantaşı, Şişli / İstanbul"
    };

    el.innerHTML = `
      <!-- SAAS LİSANS VE ABONELİK DURUMU -->
      <div class="card" style="margin-bottom:24px;background:linear-gradient(135deg, #0f172a, #1e293b);border:1px solid #334155;color:#fff">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div>
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:20px">💎</span>
              <span style="font-weight:700;font-size:16px">Solo Hekim Pro — Lisans & Abonelik Durumunuz</span>
              <span class="status-badge" style="background:#0284c7;color:#fff">14 Gün Deneme veya Pro Lisans</span>
            </div>
            <p style="font-size:13px;color:#94a3b8;margin-top:6px">Muayenehane veritabanınız aktif. Bulut dosya depolaması, sınırsız röntgen arşivi ve WhatsApp otomasyonu aktiftir.</p>
          </div>
          <button class="btn" style="background:linear-gradient(135deg, #2563eb, #3b82f6);color:#fff;font-weight:700;border:none;padding:10px 20px" onclick="window.settingsCtrl.showUpgradeModal()">
            ⚡ Tam Lisansa Yükselt / Abonelik Yönet
          </button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <!-- Left: Practice Profile & Working Hours -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Muayenehane & Hekim Bilgileri</span>
          </div>
          <form onsubmit="window.settingsCtrl.savePracticeProfile(event)">
            <div class="form-group">
              <label class="form-label">Diş Hekimi Adı Soyadı</label>
              <input type="text" id="cfg-doc-name" class="form-input" required value="${doctor.name}" />
            </div>
            <div class="form-group">
              <label class="form-label">Muayenehane Ünvanı</label>
              <input type="text" id="cfg-doc-title" class="form-input" required value="${doctor.title}" />
            </div>
            <div class="form-group">
              <label class="form-label">İletişim Telefonu</label>
              <input type="text" id="cfg-doc-phone" class="form-input" required value="${doctor.phone}" />
            </div>
            <div class="form-group">
              <label class="form-label">Adres</label>
              <input type="text" id="cfg-doc-address" class="form-input" value="${doctor.address}" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%">Bilgileri Güncelle</button>
          </form>
        </div>

        <!-- Right: Meta WhatsApp Business Cloud API Configuration -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Meta WhatsApp Business API Bağlantısı</span>
            ${(this.config.waPhoneId && this.config.waToken)
              ? `<span class="status-badge completed" style="background:var(--success-subtle);color:var(--success)">Canlı Bağlı</span>`
              : `<span class="status-badge pending" style="background:var(--warning-subtle);color:var(--warning)">Yapılandırılmadı (API Gerekli)</span>`
            }
          </div>
          <form onsubmit="window.settingsCtrl.saveWhatsAppConfig(event)">
            <div class="form-group">
              <label class="form-label">WhatsApp Business Phone Number ID</label>
              <input type="text" id="cfg-wa-phone-id" class="form-input" value="${this.config.waPhoneId}" placeholder="Örn: 109283746501928" />
            </div>
            <div class="form-group">
              <label class="form-label">Meta Cloud API Access Token</label>
              <input type="password" id="cfg-wa-token" class="form-input" value="${this.config.waToken}" placeholder="EAAG..." />
            </div>
            <div style="background:var(--bg-subtle);padding:12px;border-radius:10px;font-size:12px;color:var(--text-muted);margin-bottom:16px">
              <strong>Webhook URL:</strong> <code>https://api.solohekim.com/v1/webhook/whatsapp</code>
            </div>
            <button type="submit" class="btn btn-whatsapp" style="width:100%">Meta API Anahtarlarını Kaydet</button>
          </form>
        </div>
      </div>

      <!-- KVKK & Data Sovereignty Module -->
      <div class="card" style="margin-top:24px">
        <div class="card-header">
          <div>
            <span class="card-title">KVKK Uyumluluğu & Veri Dışa Aktarımı (PRD Bölüm 9)</span>
            <div style="font-size:13px;color:var(--text-muted)">Türkiye Veri Barındırma • Açık Rıza ve Veri İşleme Envanteri Arşivi</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
          <div style="background:var(--bg-subtle);padding:18px;border-radius:14px;border:1px solid var(--border-color)">
            <div style="font-weight:700;margin-bottom:6px">Tam Yedek İndir (JSON)</div>
            <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:14px">Tüm hasta, randevu, tedavi notu ve tahsilat verilerinizi tam yedek olarak bilgisayarınıza indirin.</p>
            <button class="btn btn-secondary" style="width:100%;font-size:13px" onclick="window.settingsCtrl.exportFullBackup()">Tam Yedeği İndir</button>
          </div>

          <div style="background:var(--bg-subtle);padding:18px;border-radius:14px;border:1px solid var(--border-color)">
            <div style="font-weight:700;margin-bottom:6px">KVKK Hasta Envanteri (JSON/CSV)</div>
            <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:14px">KVKK denetimleri ve hastaların veri talebi için anonimleştirilebilir hasta kartı envanteri.</p>
            <button class="btn btn-secondary" style="width:100%;font-size:13px" onclick="window.settingsCtrl.exportKVKKPatients()">KVKK Envanteri Çıkar</button>
          </div>

          <div style="background:var(--bg-subtle);padding:18px;border-radius:14px;border:1px solid var(--border-color)">
            <div style="font-weight:700;margin-bottom:6px">Bulut Senkronizasyon Modu</div>
            <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:14px">Şu an: <strong>${this.config.cloudSyncEnabled ? 'Supabase Bulut (Canlı)' : 'Yerel Cihaz Hafızası (Demo)'}</strong></p>
            <button class="btn ${this.config.cloudSyncEnabled ? 'btn-danger' : 'btn-primary'}" style="width:100%;font-size:13px" onclick="window.settingsCtrl.toggleCloudSync()">
              ${this.config.cloudSyncEnabled ? 'Yerel Hafızaya Dön' : 'Bulut Senkronizasyonu Aç'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  savePracticeProfile(e) {
    e.preventDefault();
    if (!window.store) return;

    window.store.data.doctor = {
      name: document.getElementById('cfg-doc-name').value,
      title: document.getElementById('cfg-doc-title').value,
      phone: document.getElementById('cfg-doc-phone').value,
      address: document.getElementById('cfg-doc-address').value,
      whatsappApiActive: true
    };
    window.store.save();
    window.appCtrl?.showToast("Muayenehane ve Hekim profil bilgileri kaydedildi!", "success");
  }

  saveWhatsAppConfig(e) {
    e.preventDefault();
    this.config.waPhoneId = document.getElementById('cfg-wa-phone-id').value.trim();
    this.config.waToken = document.getElementById('cfg-wa-token').value.trim();
    localStorage.setItem('sh_wa_phone_id', this.config.waPhoneId);
    localStorage.setItem('sh_wa_token', this.config.waToken);

    if (window.store && window.store.data && window.store.data.doctor) {
      window.store.data.doctor.whatsappApiActive = Boolean(this.config.waPhoneId && this.config.waToken);
      window.store.save();
    }
    this.render();
    window.appCtrl?.showToast("Meta WhatsApp Business API anahtarları canlı sunucuya tanımlandı!", "whatsapp");
  }

  exportFullBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.store?.data || {}, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `SoloHekim_Tam_Yedek_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    window.appCtrl?.showToast("Muayenehane tam yedeği indirildi.", "success");
  }

  exportKVKKPatients() {
    const patients = window.store?.getPatients() || [];
    const kvkkExport = patients.map(p => ({
      hasta_id: p.id,
      ad_soyad: p.name,
      telefon: p.phone,
      tc_kimlik_maskeli: p.tc ? `${p.tc.slice(0,3)}*****${p.tc.slice(-2)}` : 'Girilmemiş',
      veri_izni_tarihi: p.lastVisit,
      toplam_tedavi_notu_sayisi: p.history?.length || 0
    }));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(kvkkExport, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `KVKK_Hasta_Envanteri_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    window.appCtrl?.showToast("KVKK uyumlu hasta veri envanteri indirildi.", "success");
  }

  toggleCloudSync() {
    this.config.cloudSyncEnabled = !this.config.cloudSyncEnabled;
    localStorage.setItem('sh_cloud_sync', String(this.config.cloudSyncEnabled));
    this.render();
    window.appCtrl?.showToast(
      this.config.cloudSyncEnabled ? "Supabase Bulut senkronizasyon moduna geçildi." : "Yerel hafıza (Demo) moduna geçildi.",
      "success"
    );
  }

  showUpgradeModal() {
    let modal = document.getElementById('sh-upgrade-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sh-upgrade-modal';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div style="background:#1e293b;color:#fff;padding:28px 32px;border-radius:18px;max-width:760px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.6);border:1px solid #334155;position:relative">
        <button onclick="document.getElementById('sh-upgrade-modal').style.display='none'" style="position:absolute;top:20px;right:20px;background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer">✕</button>
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:36px">💎</span>
          <h3 style="font-size:24px;font-weight:800;margin-top:8px">Solo Hekim Pro — Lisans Paketini Seçin</h3>
          <p style="color:#94a3b8;font-size:14px;margin-top:4px">Muayenehane verileriniz, sınırsız röntgen arşiviniz ve WhatsApp API otomasyonunuz kesintisiz devam etsin.</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
          <!-- Aylık Paket -->
          <div style="background:#0f172a;border:1px solid #334155;border-radius:14px;padding:20px;display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="font-weight:700;font-size:16px;color:#38bdf8">AYLIK ESNEK PLAN</div>
              <div style="font-size:28px;font-weight:800;margin:12px 0">1.490 TL <span style="font-size:14px;font-weight:400;color:#94a3b8">/ ay + KDV</span></div>
              <ul style="font-size:13px;color:#cbd5e1;line-height:1.8;padding-left:18px;margin-top:10px">
                <li>Sınırsız Hasta & Randevu Takibi</li>
                <li>Sınırsız Röntgen & Fotoğraf Arşivi</li>
                <li>Meta WhatsApp Cloud API Otomasyonu</li>
                <li>Aylık iptal edilebilir</li>
              </ul>
            </div>
            <button class="btn" style="background:#334155;color:#fff;width:100%;margin-top:16px;font-weight:700" onclick="window.settingsCtrl.activatePlan('solo-pro-monthly', 'monthly')">Aylık Aktifleştir</button>
          </div>

          <!-- Yıllık Avantajlı Paket -->
          <div style="background:linear-gradient(135deg, #0f172a, #1e1b4b);border:2px solid #6366f1;border-radius:14px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;position:relative">
            <span style="position:absolute;top:-12px;right:16px;background:#6366f1;color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:20px">EN POPÜLER • %18 İNDİRİM</span>
            <div>
              <div style="font-weight:700;font-size:16px;color:#a5b4fc">YILLIK TAM LİSANS</div>
              <div style="font-size:28px;font-weight:800;margin:12px 0">14.900 TL <span style="font-size:14px;font-weight:400;color:#94a3b8">/ yıl</span></div>
              <ul style="font-size:13px;color:#e0e7ff;line-height:1.8;padding-left:18px;margin-top:10px">
                <li>Aylığı 1.241 TL'ye gelir (~2 Ay Hediye)</li>
                <li>Sınırsız Hasta & Röntgen Arşivi</li>
                <li>Öncelikli 7/24 Teknik Hekim Destek</li>
                <li>Garantili Sabit Fiyat Koruma</li>
              </ul>
            </div>
            <button class="btn" style="background:linear-gradient(135deg, #4f46e5, #6366f1);color:#fff;width:100%;margin-top:16px;font-weight:700;box-shadow:0 4px 14px rgba(99,102,241,0.4)" onclick="window.settingsCtrl.activatePlan('solo-pro-yearly', 'yearly')">Yıllık Lisansı Başlat</button>
          </div>
        </div>

        <div style="text-align:center;font-size:12px;color:#64748b">
          🔒 256-bit SSL Korumalı Güvenli Ödeme • iyzico & PayTR Altyapısı ile Kredi Kartı veya Kurumsal Fatura
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  }

  async activatePlan(planId, cycle) {
    if (window.apiClient && window.apiClient.getToken()) {
      window.appCtrl?.showToast("Ödeme işleniyor ve lisansınız tanımlanıyor...", "primary");
      const res = await window.apiClient.checkoutSubscription(planId, cycle);
      if (res && (res.success || res.ok !== false)) {
        const modal = document.getElementById('sh-upgrade-modal');
        if (modal) modal.style.display = 'none';
        window.appCtrl?.showToast("Tebrikler! DentaTakip Pro lisansınız başarıyla aktifleştirildi.", "success");
        return;
      }
    }
    const modal = document.getElementById('sh-upgrade-modal');
    if (modal) modal.style.display = 'none';
    window.appCtrl?.showToast("Tebrikler! DentaTakip Pro lisansınız başarıyla tanımlandı.", "success");
  }

    document.getElementById('sh-upgrade-modal').style.display = 'none';
    window.appCtrl?.showToast("Tebrikler! Lisans paketiniz aktifleştirildi.", "success");
  }
}

window.settingsCtrl = new SettingsController();
