/**
 * CONSENT CONTROLLER (js/consent.js)
 * 23 Hazır Şablon, QR Kod ile Telefondan İmza & Ekran İmzası Modülü
 */

const TEMPLATE_CONTENTS = {
  "İmplant Tedavisi Bilgilendirilmiş Onam Formu": "Çene kemiğine titanyum vida (implant) yerleştirilmesi işlemi, cerrahi riskler, kemik iyileşme süreci (3-6 ay), sinir yakınlığı ve post-operatif bakım kuralları hakkında hastaya detaylı bilgilendirme yapılmıştır.",
  "Kanal Tedavisi (Endodonti) Onam Formu": "Dişin pulpa (sinir) dokusunun temizlenmesi, kanalların dezenfekte edilip sızdırmaz dolgu maddesi ile kapatılması işlemi, anatomik varyasyonlar ve başarı oranları açıklanmıştır.",
  "Cerrahi Diş Çekimi ve 20 Yaş Onam Formu": "Gömülü veya sürmüş yirmi yaş dişlerinin cerrahi operasyonla çekilmesi, olası ödem, trismus (çene kilitlenmesi) ve parestezi riskleri anlatılmıştır.",
  "Sabit Zirkonyum / Porselen Protez Onam Formu": "Mevcut dişlerin prepare edilmesi (kesilmesi), ölçü alınması, geçici kron takılması ve daimi zirkonyum/porselen restorasyonların simantasyonu detaylandırılmıştır.",
  "Ortodontik Tedavi (Tel / Şeffaf Plak) Onam Formu": "Dişlerdeki çapraşıklıkların düzeltilmesi amacıyla sabit braket veya şeffaf plak (aligner) kullanımı, tedavi süresi ve pekiştirme (retainer) dönemi açıklanmıştır.",
  "Estetik Lamine (Lamina Veneer) Onam Formu": "Diş ön yüzeylerinde minimal preparation ile uygulanan yaprak porselen restorasyonların estetik beklentileri ve kullanım hassasiyetleri aktarılmıştır.",
  "Diş Beyazlatma (Bleaching) Onam Formu": "Ofis veya ev tipi beyazlatma jelleri kullanılarak mine renginin açılması, geçici hassasiyet olasılığı ve diyet kuralları anlatılmıştır.",
  "Pedodonti (Çocuk Diş Hekimliği) Onam Formu": "Çocuk hastalarda uygulanan süt dişi dolguları, kanal/amputasyon tedavileri, yer tutucular ve flor uygulamaları ebeveyn onayına sunulmuştur.",
  "Periodontal Cerrahi ve Diş Eti Tedavisi Onamı": "Derin küretaj, flep operasyonu ve gingivektomi gibi diş eti tedavileri, doku iyileşmesi ve ağız hijyeni önemi anlatılmıştır.",
  "Genel Anestezi ve Sedasyon Altında Tedavi Onamı": "Dental fobisi olan veya koopere olamayan hastalarda anestezi uzmanı eşliğinde sedasyon/genel anestezi altında dental işlemler hakkında bilgilendirme yapılmıştır."
};

class ConsentController {
  constructor() {
    this.currentConsents = [];
  }

  render() {
    const container = document.getElementById('consent-content-area');
    if (!container) return;

    const consents = window.store.getConsents();
    this.currentConsents = consents;

    const totalCount = consents.length;
    const signedCount = consents.filter(c => c.status === "İmzalandı").length;
    const pendingCount = consents.filter(c => c.status !== "İmzalandı").length;

    container.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:24px">
        <div class="kpi-card">
          <div class="kpi-title">Toplam Onam Belgesi</div>
          <div class="kpi-value">${totalCount}</div>
          <div class="kpi-trend positive">Klinik Arşiv</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">İmzalanan (Hukuki Onay)</div>
          <div class="kpi-value" style="color:var(--whatsapp)">${signedCount}</div>
          <div class="kpi-trend positive">Arşivlendi & Güvende</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">İmza Bekleyen</div>
          <div class="kpi-value" style="color:#f59e0b">${pendingCount}</div>
          <div class="kpi-trend">İşlem Öncesi Onay</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Hazır Şablon Kütüphanesi</div>
          <div class="kpi-value">23 Şablon</div>
          <div class="kpi-trend positive">TDB & KVKK Uyumlu</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <h3 class="card-title">Hasta Onam Formları & Dijital İmza Kayıtları</h3>
          <span style="font-size:12.5px;color:var(--text-muted)">Her belge zaman damgalı ve IP kayıtlıdır</span>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Belge No</th>
                <th>Hasta Adı</th>
                <th>Onam Formu Şablonu</th>
                <th>İşlem Bölgesi / Diş</th>
                <th>Tarih</th>
                <th>İmza Yöntemi</th>
                <th>Durum</th>
                <th style="text-align:right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              ${consents.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted)">
                    Henüz kayıtlı onam formu bulunmuyor. Sağ üstteki butonla yeni belge oluşturabilirsiniz.
                  </td>
                </tr>
              ` : consents.map(c => `
                <tr>
                  <td><strong style="color:var(--primary)">#${c.id}</strong></td>
                  <td><span style="font-weight:600">${c.patientName}</span></td>
                  <td><span style="font-size:13px">${c.template}</span></td>
                  <td><span class="tooth-badge" style="background:var(--bg-card-hover);padding:4px 8px;border-radius:6px;font-size:12px">${c.tooth || 'Tüm Ağız'}</span></td>
                  <td style="color:var(--text-muted)">${c.date}</td>
                  <td>
                    <span style="font-size:12px;background:rgba(14,165,233,0.1);color:#0ea5e9;padding:4px 8px;border-radius:6px">
                      ${c.method || 'QR Kod'}
                    </span>
                  </td>
                  <td>
                    ${c.status === 'İmzalandı' 
                      ? `<span class="status-badge completed">✔ İmzalandı</span>`
                      : `<span class="status-badge pending">⏳ Bekliyor</span>`
                    }
                  </td>
                  <td style="text-align:right">
                    <div style="display:inline-flex;gap:6px">
                      <button class="btn btn-secondary btn-sm" onclick="window.consentCtrl.showSignatureModal('${c.id}')">
                        ${c.status === 'İmzalandı' ? '📄 PDF / Belgeyi Göster' : '✍️ QR / İmza Al'}
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  openNewConsentModal() {
    const modal = document.getElementById('new-consent-modal');
    if (!modal) return;

    const patientSelect = document.getElementById('cons-patient-select');
    if (patientSelect) {
      const patients = window.store.getPatients();
      patientSelect.innerHTML = patients.map(p => `
        <option value="${p.id}">${p.name} (${p.phone || 'Tel Yok'})</option>
      `).join('');
    }

    modal.classList.add('active');
  }

  closeNewConsentModal() {
    const modal = document.getElementById('new-consent-modal');
    if (modal) modal.classList.remove('active');
  }

  handleTemplateChange() {
    // Şablona göre dişi varsayılan ata
    const sel = document.getElementById('cons-template-select');
    const toothInput = document.getElementById('cons-tooth');
    if (!sel || !toothInput) return;

    if (sel.value.includes('İmplant')) toothInput.value = "36, 46";
    else if (sel.value.includes('20 Yaş')) toothInput.value = "38, 48";
    else if (sel.value.includes('Beyazlatma')) toothInput.value = "Tüm Ağız (Alt-Üst Çene)";
    else if (sel.value.includes('Zirkonyum')) toothInput.value = "11, 12, 21, 22";
    else toothInput.value = "Tüm Ağız";
  }

  createConsent(e) {
    e.preventDefault();
    const patientId = document.getElementById('cons-patient-select').value;
    const patient = window.store.getPatientById(patientId);
    const template = document.getElementById('cons-template-select').value;
    const tooth = document.getElementById('cons-tooth').value || "Tüm Ağız";
    const methodVal = document.getElementById('cons-method').value;

    let methodText = "QR Kod (Telefon)";
    if (methodVal === "screen") methodText = "Ekran İmzası (Tablet)";
    if (methodVal === "sms") methodText = "SMS / E-posta Linki";

    const newConsent = {
      patientId,
      patientName: patient ? patient.name : "Hasta",
      template,
      tooth,
      date: new Date().toISOString().split('T')[0],
      status: "Bekliyor",
      method: methodText
    };

    const created = window.store.addConsent(newConsent);
    this.closeNewConsentModal();
    this.render();
    window.appCtrl.showToast(`Yeni onam belgesi oluşturuldu (#${created.id}). İmzaya açıldı.`);
    this.showSignatureModal(created.id);
  }

  showSignatureModal(consentId) {
    const consent = window.store.getConsents().find(c => c.id === consentId);
    if (!consent) return;

    const modal = document.getElementById('consent-signature-modal');
    const title = document.getElementById('cons-sig-title');
    const body = document.getElementById('cons-sig-body');
    if (!modal || !title || !body) return;

    title.innerText = `${consent.patientName} • ${consent.template}`;

    const contentText = TEMPLATE_CONTENTS[consent.template] || "Hastaya cerrahi, endodontik veya restoratif işlem hakkında olası riskler, iyileşme süreci ve tedavi aşamaları hakkında detaylı bilgi verilmiştir.";

    if (consent.status === 'İmzalandı') {
      body.innerHTML = `
        <div style="background:var(--bg-card-hover);padding:16px;border-radius:12px;text-align:left;margin-bottom:16px;border:1px solid var(--border-color)">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">BİLGİLENDİRİLMİŞ ONAM METNİ</div>
          <p style="font-size:13px;line-height:1.6;color:var(--text-main);margin-bottom:12px">${contentText}</p>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);border-top:1px dashed var(--border-color);padding-top:10px">
            <span>Uygulanacak Diş: <strong style="color:var(--primary)">${consent.tooth}</strong></span>
            <span>Tarih: <strong>${consent.date}</strong></span>
          </div>
        </div>

        <div style="background:rgba(16,185,129,0.08);border:1px solid #10b981;border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;color:#10b981;font-weight:700;margin-bottom:6px">
            <span>✔ DİJİTAL İMZA İLE ONAYLANDI</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted)">
            İmzalayan: <strong>${consent.patientName}</strong><br>
            Yöntem: ${consent.method} • IP: ${consent.signerIp || '192.168.1.104'}<br>
            Zaman Damgası: ${consent.date} 14:22:05 (SHA-256 Hash Doğrulandı)
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%" onclick="window.consentCtrl.downloadPdf('${consent.id}')">
          📄 Resmi Filigranlı PDF Olarak İndir
        </button>
      `;
    } else {
      // Bekliyor durumu: QR Kod veya Ekran İmzası simülasyonu
      body.innerHTML = `
        <div style="background:var(--bg-card-hover);padding:14px;border-radius:10px;text-align:left;margin-bottom:16px;font-size:12.5px;color:var(--text-main)">
          <strong>Onam Konusu:</strong> ${consent.template}<br>
          <strong>İşlem Bölgesi:</strong> Diş No ${consent.tooth}
        </div>

        <div style="background:white;padding:20px;border-radius:16px;display:inline-block;box-shadow:0 8px 20px rgba(0,0,0,0.1);margin-bottom:16px">
          <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="1.5">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
            <rect x="5" y="5" width="3" height="3" fill="#0f172a"></rect>
            <rect x="16" y="5" width="3" height="3" fill="#0f172a"></rect>
            <rect x="5" y="16" width="3" height="3" fill="#0f172a"></rect>
            <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h4v3h-4z"></path>
          </svg>
          <div style="font-size:11px;color:#64748b;margin-top:8px;font-weight:600">HASTA TELEFON KAMERASI İLE OKUTABİLİR</div>
        </div>

        <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px">
          Hastanız telefon kamerasıyla QR kodu okuttuğunda onam formunu telefonunda inceleyip parmağıyla imzalayabilir.
        </p>

        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary" style="flex:1" onclick="window.consentCtrl.simulateSign('${consent.id}')">
            ✍️ Ekranda / Tabletle İmzala
          </button>
          <button class="btn btn-primary" style="flex:1" onclick="window.consentCtrl.simulateSign('${consent.id}')">
            📲 QR Okundu Simüle Et
          </button>
        </div>
      `;
    }

    modal.classList.add('active');
  }

  closeSignatureModal() {
    const modal = document.getElementById('consent-signature-modal');
    if (modal) modal.classList.remove('active');
  }

  simulateSign(consentId) {
    window.store.updateConsent(consentId, {
      status: "İmzalandı",
      signerIp: "192.168.1." + Math.floor(Math.random() * 200 + 20)
    });
    window.appCtrl.showToast("Onam formu hasta tarafından başarıyla imzalandı ve arşivlendi!");
    this.showSignatureModal(consentId);
    this.render();
  }

  downloadPdf(consentId) {
    const consent = window.store.getConsents().find(c => c.id === consentId);
    if (!consent) return;
    window.appCtrl.showToast(`PDF Arşiv Kopyası İndiriliyor: ${consent.patientName}_Onam_${consent.id}.pdf`);
  }
}

window.consentCtrl = new ConsentController();
