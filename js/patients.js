/* ==========================================================================
   SOLO HEKİM PRO — Patients Module & 360° Medical Record Controller
   ========================================================================== */

class PatientsController {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.activePatientId = null;
  }

  render() {
    this.renderTable();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.renderTable();
  }

  setSearch(query) {
    this.searchQuery = query.toLowerCase();
    this.renderTable();
  }

  renderTable() {
    const el = document.getElementById('patients-table-body');
    if (!el) return;

    let patients = window.store.getPatients();

    // Filter by tab
    if (this.currentFilter === 'debtors') {
      patients = patients.filter(p => p.balance > 0);
    } else if (this.currentFilter === 'active') {
      patients = patients.filter(p => p.status === 'Tedavisi Devam Ediyor');
    }

    // Filter by search query
    if (this.searchQuery) {
      patients = patients.filter(p =>
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.phone.includes(this.searchQuery) ||
        p.tc.includes(this.searchQuery) ||
        p.notes.toLowerCase().includes(this.searchQuery)
      );
    }

    if (patients.length === 0) {
      el.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">Kayıtlı hasta bulunamadı.</td></tr>`;
      return;
    }

    el.innerHTML = patients.map(p => {
      const initials = p.name.split(' ').map(n => n[0]).join('');
      const balanceBadge = p.balance > 0
        ? `<span class="nav-badge danger">${p.balance.toLocaleString('tr-TR')} ₺ Borç</span>`
        : `<span class="nav-badge" style="background:var(--success-subtle);color:var(--success)">Temiz</span>`;

      return `
        <tr style="cursor:pointer" onclick="window.patientsCtrl.openPatientDetail('${p.id}')">
          <td>
            <div class="patient-cell">
              <div class="patient-initials">${initials}</div>
              <div>
                <div style="font-weight:700;color:var(--text-main)">${p.name}</div>
                <div style="font-size:12px;color:var(--text-muted)">T.C: ${p.tc || '-'}</div>
              </div>
            </div>
          </td>
          <td>${p.phone}</td>
          <td>
            <div style="font-weight:600">${p.lastVisit || '-'}</div>
          </td>
          <td>
            <span class="status-badge waiting" style="background:var(--primary-subtle);color:var(--primary)">
              ${p.status || 'Kayıtlı'}
            </span>
          </td>
          <td>${balanceBadge}</td>
          <td>
            <div style="font-size:12px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-muted)">
              ${p.notes || 'Not yok'}
            </div>
          </td>
          <td>
            <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
              <button class="btn-icon" title="360° Hasta Kartını Aç" onclick="window.patientsCtrl.openPatientDetail('${p.id}')">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <a href="https://wa.me/${p.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn-icon" title="WhatsApp ile Yaz" style="display:inline-flex;align-items:center;justify-content:center">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="#25d366" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* 360° Patient Record Modal / Drawer */
  openPatientDetail(id) {
    const patient = window.store.getPatientById(id);
    if (!patient) return;

    this.activePatientId = id;
    const modalEl = document.getElementById('patient-detail-modal');
    if (!modalEl) return;

    // Render header
    document.getElementById('pd-name').innerText = patient.name;
    document.getElementById('pd-meta').innerText = `Telefon: ${patient.phone} • T.C: ${patient.tc || '-'} • Kan Grubu: ${patient.bloodGroup || 'Bilinmiyor'}`;

    // Financial banner
    const totalCost = Number(patient.totalCost || 0);
    const paidAmount = Number(patient.paidAmount || 0);
    const balance = Number(patient.balance || 0);

    document.getElementById('pd-balance-card').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;background:var(--bg-subtle);padding:14px 18px;border-radius:12px;margin-bottom:20px;border:1px solid var(--border-color)">
        <div>
          <div style="font-size:12px;color:var(--text-muted)">Toplam Tedavi Bedeli / Ödenen</div>
          <div style="font-weight:700;font-size:16px">${totalCost.toLocaleString('tr-TR')} ₺ / ${paidAmount.toLocaleString('tr-TR')} ₺</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;color:var(--text-muted)">Kalan Borç Bakiyesi</div>
          <div style="font-weight:800;font-size:18px;color:${balance > 0 ? 'var(--danger)' : 'var(--success)'}">
            ${balance.toLocaleString('tr-TR')} ₺
          </div>
        </div>
        <div>
          <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;font-weight:600" onclick="window.patientsCtrl.editPatientFinancials('${patient.id}')">✏️ Ücret & Bakiye Düzenle</button>
        </div>
      </div>
    `;

    // Clinical Alert / General Note
    document.getElementById('pd-general-note').innerHTML = `
      <div style="background:rgba(245, 158, 11, 0.12);border-left:4px solid var(--warning);padding:12px 14px;border-radius:8px;font-size:13px;margin-bottom:20px">
        <strong>Tıbbi Uyarı & Not:</strong> ${patient.notes || 'Özel not bulunmuyor.'}
      </div>
    `;

    // Render FDI Odontogram (Daimi / Süt Dişi Katmanı)
    this.renderOdontogram(patient, 'adult');

    // Render Treatment Notes (Kronolojik Tedavi Geçmişi - Section 6.1 P0)
    const historyList = document.getElementById('pd-history-list');
    if (patient.history && patient.history.length > 0) {
      historyList.innerHTML = patient.history.map(h => `
        <div style="border-left:2px solid var(--primary);padding-left:14px;margin-bottom:16px;position:relative">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-weight:700;color:var(--primary);font-size:13.5px">${h.type}</span>
            <span style="font-size:11.5px;color:var(--text-muted)">Tarih: ${h.date} • Diş No: #${h.tooth}</span>
          </div>
          <p style="font-size:13px;color:var(--text-main);margin-top:4px">${h.note}</p>
        </div>
      `).join('');
    } else {
      historyList.innerHTML = `<div style="color:var(--text-muted);font-size:13px">Henüz tedavi notu eklenmemiş.</div>`;
    }

    // Render Files / X-Ray simulation (Section 6.1 P1)
    const filesList = document.getElementById('pd-files-list');
    if (patient.files && patient.files.length > 0) {
      filesList.innerHTML = patient.files.map(f => {
        const isImg = f.name?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/) || f.url?.startsWith('data:image');
        const thumbHtml = isImg && f.url
          ? `<img src="${f.url}" style="width:38px;height:38px;border-radius:6px;object-fit:cover;border:1px solid var(--border-color)" />`
          : `<div style="width:38px;height:38px;border-radius:6px;background:var(--primary-subtle);display:flex;align-items:center;justify-content:center;color:var(--primary);font-weight:700;font-size:12px">RX</div>`;

        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-subtle);border-radius:8px;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:12px">
              ${thumbHtml}
              <div>
                <div style="font-weight:600;font-size:13px">${f.name}</div>
                <div style="font-size:11px;color:var(--text-muted)">Tür: ${f.type || 'Röntgen'} • ${f.date}</div>
              </div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-secondary" style="padding:5px 12px;font-size:11.5px" onclick="window.patientsCtrl.viewRealFile('${f.url || ''}', '${(f.name || '').replace(/'/g, "\\'")}')">Görüntüle / Büyüt</button>
              <button class="btn-icon" style="color:#ef4444;font-size:12px" title="Sil" onclick="window.patientsCtrl.deletePatientFile('${f.id}')">🗑️</button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      filesList.innerHTML = `<div style="color:var(--text-muted);font-size:13px">Kayıtlı röntgen veya fotoğraf dosyası yok. Yukarıdaki butonla bilgisayarınızdan/telefonunuzdan gerçek dosya yükleyebilirsiniz.</div>`;
    }

    modalEl.classList.add('active');
  }

  closePatientDetail() {
    document.getElementById('patient-detail-modal')?.classList.remove('active');
  }

  /* Add new patient modal */
  openAddModal() {
    document.getElementById('new-patient-modal')?.classList.add('active');
  }

  closeAddModal() {
    document.getElementById('new-patient-modal')?.classList.remove('active');
  }

  submitNewPatient(e) {
    e.preventDefault();
    const name = document.getElementById('np-name').value;
    const phone = document.getElementById('np-phone').value;
    const tc = document.getElementById('np-tc').value;
    const notes = document.getElementById('np-notes').value;

    const totalCost = Number(document.getElementById('np-total-cost')?.value || 0);
    const paidAmount = Number(document.getElementById('np-paid-amount')?.value || 0);
    const balance = Math.max(0, totalCost - paidAmount);

    const newPatient = window.store.addPatient({
      name,
      phone,
      tc,
      notes,
      status: balance > 0 ? "Ödeme Bekliyor" : "Yeni Kayıt",
      totalCost,
      paidAmount,
      balance,
      lastVisit: new Date().toISOString().split('T')[0]
    });

    if (paidAmount > 0 && newPatient) {
      window.store.addPayment({
        patientId: newPatient.id,
        patientName: name,
        amount: paidAmount,
        method: "Nakit / Kart (Peşinat)",
        note: "Hasta kaydı sırasında ilk tahsilat"
      });
    }

    this.closeAddModal();
    this.renderTable();
    window.appCtrl?.showToast(`${name} hasta kartı (Bedel: ${totalCost.toLocaleString('tr-TR')} ₺) oluşturuldu!`, "success");
  }

  editPatientFinancials(patientId) {
    const p = window.store.getPatientById(patientId || this.activePatientId);
    if (!p) return;

    const newTotalStr = prompt(`"${p.name}" için Planlanan Toplam Tedavi Bedeli (₺):`, p.totalCost || 0);
    if (newTotalStr === null) return;
    const newTotal = Number(newTotalStr) || 0;

    const newPaidStr = prompt(`"${p.name}" için Şu Ana Kadar Tahsil Edilen Toplam Ödeme (₺):`, p.paidAmount || 0);
    if (newPaidStr === null) return;
    const newPaid = Number(newPaidStr) || 0;

    p.totalCost = newTotal;
    p.paidAmount = newPaid;
    p.balance = Math.max(0, newTotal - newPaid);

    window.store.save();
    this.openPatientDetail(p.id);
    this.renderTable();
    if (window.paymentsCtrl) window.paymentsCtrl.render();
    window.appCtrl?.showToast(`${p.name} tedavi bedeli ve borç bakiyesi güncellendi!`, "success");
  }

  /* Add Treatment Note modal inside patient detail */
  addTreatmentNoteModal(defaultTooth = "") {
    if (!this.activePatientId) return;
    const proc = prompt("Tedavi Tipi (Örn: Kanal Tedavisi, İmplant, Dolgu, Çekim):", "Kanal Tedavisi");
    if (!proc) return;
    const tooth = prompt("Diş Numarası (Örn: 36, 14 veya Tümü):", defaultTooth || "36");
    const note = prompt("Tedavi Detay Notu:", "İşlem başarıyla uygulandı.");
    if (!note) return;

    window.store.addTreatmentNote(this.activePatientId, {
      type: proc,
      tooth: tooth || "-",
      note: note,
      date: new Date().toISOString().split('T')[0]
    });

    this.openPatientDetail(this.activePatientId);
    window.appCtrl?.showToast("Tedavi notu ve diş kaydı hasta kartına eklendi.", "success");
  }

  renderOdontogram(patient, layer = 'adult') {
    const container = document.getElementById('pd-odontogram-card');
    if (!container) return;

    const history = patient.history || [];
    const treatedTeethSet = new Set();
    history.forEach(h => {
      if (h.tooth && h.tooth !== '-' && h.tooth !== 'Tümü') {
        h.tooth.split(',').map(t => t.trim()).forEach(num => treatedTeethSet.add(num));
      }
    });

    let upperRow, lowerRow;
    if (layer === 'pediatric') {
      upperRow = ['55','54','53','52','51', '61','62','63','64','65'];
      lowerRow = ['85','84','83','82','81', '71','72','73','74','75'];
    } else {
      upperRow = ['18','17','16','15','14','13','12','11', '21','22','23','24','25','26','27','28'];
      lowerRow = ['48','47','46','45','44','43','42','41', '31','32','33','34','35','36','37','38'];
    }

    const renderTooth = (tNum) => {
      const isTreated = treatedTeethSet.has(tNum);
      const bg = isTreated ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-subtle)';
      const border = isTreated ? '#10b981' : 'var(--border-color)';
      const color = isTreated ? '#10b981' : 'var(--text-main)';

      return `
        <div onclick="window.patientsCtrl.addTreatmentNoteModal('${tNum}')"
             style="cursor:pointer;background:${bg};border:1.5px solid ${border};border-radius:8px;padding:8px 4px;text-align:center;min-width:34px;transition:all 0.15s"
             title="Diş #${tNum} işlem eklemek için tıklayın">
          <div style="font-size:11px;font-weight:800;color:${color}">${tNum}</div>
          <div style="font-size:14px;margin-top:2px">${isTreated ? '✔' : '🦷'}</div>
        </div>
      `;
    };

    container.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div>
            <span style="font-weight:700;font-size:14px">İnteraktif FDI Dijital Odontogram</span>
            <span style="font-size:12px;color:var(--text-muted);margin-left:8px">(İşlem eklemek için dişe tıklayın)</span>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm ${layer === 'adult' ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 10px;font-size:11.5px"
                    onclick="window.patientsCtrl.switchOdontogramLayer('${patient.id}', 'adult')">
              🦷 Daimi Dişler (32)
            </button>
            <button class="btn btn-sm ${layer === 'pediatric' ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 10px;font-size:11.5px"
                    onclick="window.patientsCtrl.switchOdontogramLayer('${patient.id}', 'pediatric')">
              👶 Süt Dişleri (20)
            </button>
          </div>
        </div>

        <div style="margin-bottom:12px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;text-align:center;font-weight:700">ÜST ÇENE (MAKSİLLA)</div>
          <div style="display:flex;justify-content:center;gap:4px;flex-wrap:wrap">
            ${upperRow.map(t => renderTooth(t)).join('')}
          </div>
        </div>

        <div style="border-top:1px dashed var(--border-color);margin:10px 0"></div>

        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;text-align:center;font-weight:700">ALT ÇENE (MANDİBULA)</div>
          <div style="display:flex;justify-content:center;gap:4px;flex-wrap:wrap">
            ${lowerRow.map(t => renderTooth(t)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  switchOdontogramLayer(patientId, layer) {
    const p = window.store.getPatientById(patientId);
    if (p) this.renderOdontogram(p, layer);
  }

  uploadRealFile() {
    if (!this.activePatientId) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const category = prompt("Dosya Türü (Örn: Panoramik Röntgen, Periapikal, Fotoğraf, Tahlil):", "Panoramik Röntgen") || "Röntgen";

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        const patient = window.store.getPatientById(this.activePatientId);

        let fileObj = {
          id: `F-${Date.now()}`,
          name: file.name,
          url: base64Data,
          date: new Date().toISOString().split('T')[0],
          type: category
        };

        if (window.apiClient && window.apiClient.getToken()) {
          window.appCtrl?.showToast("Dosya sunucuya yükleniyor...", "primary");
          const res = await window.apiClient.uploadPatientFile(this.activePatientId, file.name, base64Data, category);
          if (res.ok && res.data?.file) {
            fileObj = res.data.file;
          }
        }

        patient.files = patient.files || [];
        patient.files.unshift(fileObj);
        window.store.save();
        this.openPatientDetail(this.activePatientId);
        window.appCtrl?.showToast(`"${file.name}" dosyası başarıyla arşivlendi!`, "success");
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  viewRealFile(fileUrl, fileName) {
    if (!fileUrl) {
      window.appCtrl?.showToast("Dosya görüntülenemiyor", "danger");
      return;
    }
    let viewer = document.getElementById('sh-lightbox-modal');
    if (!viewer) {
      viewer = document.createElement('div');
      viewer.id = 'sh-lightbox-modal';
      viewer.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.88);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;';
      document.body.appendChild(viewer);
    }

    const isPdf = fileName?.toLowerCase().endsWith('.pdf') || fileUrl.includes('application/pdf');
    viewer.innerHTML = `
      <div style="background:#1e293b;color:#fff;padding:18px 24px;border-radius:14px;max-width:92vw;max-height:92vh;display:flex;flex-direction:column;gap:14px;box-shadow:0 25px 60px rgba(0,0,0,0.6)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:24px">
          <div style="font-weight:700;font-size:16px;color:#38bdf8">${fileName || 'Röntgen Dosyası'}</div>
          <button onclick="document.getElementById('sh-lightbox-modal').style.display='none'" style="background:#ef4444;color:#fff;border:none;padding:7px 16px;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px">Kapat ✕</button>
        </div>
        <div style="overflow:auto;max-height:78vh;display:flex;align-items:center;justify-content:center;background:#0f172a;border-radius:8px;padding:12px">
          ${isPdf
            ? `<iframe src="${fileUrl}" style="width:82vw;height:72vh;border:none;border-radius:6px"></iframe>`
            : `<img src="${fileUrl}" style="max-width:100%;max-height:72vh;object-fit:contain;border-radius:6px" alt="${fileName}" />`
          }
        </div>
      </div>
    `;
    viewer.style.display = 'flex';
  }

  deletePatientFile(fileId) {
    if (!confirm("Bu dosyayı arşivden silmek istediğinize emin misiniz?")) return;
    const patient = window.store.getPatientById(this.activePatientId);
    if (patient && patient.files) {
      patient.files = patient.files.filter(f => f.id !== fileId);
      window.store.save();
      this.openPatientDetail(this.activePatientId);
      window.appCtrl?.showToast("Dosya arşivden silindi.", "success");
    }
  }
}

window.patientsCtrl = new PatientsController();
