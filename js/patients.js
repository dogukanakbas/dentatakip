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
                ${p.doctor_name ? `<div style="font-size:11px;color:var(--primary-color);margin-top:2px">🩺 ${p.doctor_name}</div>` : ''}
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
            <div style="display:flex;gap:6px">
              <button class="btn-icon" title="Hızlı WhatsApp" onclick="event.stopPropagation(); window.patientsCtrl.sendQuickWa('${p.phone}', '${p.name}')">💬</button>
              <button class="btn-icon" title="Odontogram Aç" onclick="event.stopPropagation(); window.patientsCtrl.openPatientDetail('${p.id}')">🦷</button>
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
    document.getElementById('pd-meta').innerText = `Telefon: ${patient.phone} • T.C: ${patient.tc || '-'} • Kan Grubu: ${patient.bloodGroup || 'Bilinmiyor'}${patient.doctor_name ? ' • Sorumlu Hekim: ' + patient.doctor_name : ''}`;

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
            <div>
              <button class="btn-icon" onclick="window.open('${f.url || '#'}', '_blank')" title="Önizle">👁️</button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      filesList.innerHTML = `<div style="color:var(--text-muted);font-size:13px">Henüz röntgen veya laboratuvar dosyası yüklenmemiş.</div>`;
    }

    modalEl.classList.add('active');
  }

  closePatientDetail() {
    document.getElementById('patient-detail-modal')?.classList.remove('active');
  }

  /* Add new patient modal */
  openAddModal() {
    const docSelect = document.getElementById('np-doctor');
    if (docSelect) {
      const team = window.store?.data?.team || [];
      const user = window.apiClient?.getUser();
      const doctors = team.filter(m => m.role === 'owner' || m.role === 'doctor');
      if (doctors.length > 0) {
        docSelect.innerHTML = doctors.map(d => `<option value="${d.id}" ${d.id === user?.id ? 'selected' : ''}>${d.full_name} (${d.title || 'Diş Hekimi'})</option>`).join('');
      } else {
        docSelect.innerHTML = `<option value="">${user?.full_name || 'Solo Muayenehane Hekimi'}</option>`;
      }
    }
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
    const doctorId = document.getElementById('np-doctor')?.value || '';
    const team = window.store?.data?.team || [];
    const matchedDoc = team.find(m => m.id === doctorId);
    const doctorName = matchedDoc?.full_name || window.apiClient?.getUser()?.full_name || 'Diş Hekimi';

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
      doctor_id: doctorId,
      doctor_name: doctorName,
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
    window.appCtrl?.showToast(`${name} hasta kartı (${doctorName} atamasıyla) oluşturuldu!`, "success");
  }

  editPatientFinancials(patientId) {
    const p = window.store.getPatientById(patientId || this.activePatientId);
    if (!p) return;

    const modal = document.getElementById("patient-cost-modal");
    const idInput = document.getElementById("pc-patient-id");
    const totalInput = document.getElementById("pc-total-cost");
    const paidInput = document.getElementById("pc-paid-amount");

    if (idInput) idInput.value = p.id;
    if (totalInput) totalInput.value = p.totalCost || 0;
    if (paidInput) paidInput.value = p.paidAmount || 0;
    if (modal) modal.classList.add("active");
  }

  closeCostModal() {
    const modal = document.getElementById("patient-cost-modal");
    if (modal) modal.classList.remove("active");
  }

  submitCostModal(e) {
    e.preventDefault();
    const patientId = document.getElementById("pc-patient-id")?.value || this.activePatientId;
    const p = window.store.getPatientById(patientId);
    if (!p) return;

    const newTotal = Number(document.getElementById("pc-total-cost")?.value) || 0;
    const newPaid = Number(document.getElementById("pc-paid-amount")?.value) || 0;

    p.totalCost = newTotal;
    p.paidAmount = newPaid;
    p.balance = Math.max(0, newTotal - newPaid);

    window.store.save();
    this.closeCostModal();
    this.openPatientDetail(p.id);
    this.renderTable();
    if (window.paymentsCtrl) window.paymentsCtrl.render();
    window.appCtrl?.showToast(`${p.name} finansal bakiyesi güncellendi! Kalan Borç: ${p.balance.toLocaleString('tr-TR')} ₺`, "success");
  }

  /* Add Treatment Note modal inside patient detail */
  addTreatmentNoteModal(defaultTooth = "") {
    if (!this.activePatientId) return;

    const modal = document.getElementById("patient-treatment-modal");
    const idInput = document.getElementById("pt-patient-id");
    const toothInput = document.getElementById("pt-tooth");
    const noteInput = document.getElementById("pt-note");
    const costInput = document.getElementById("pt-cost");

    if (idInput) idInput.value = this.activePatientId;
    if (toothInput) toothInput.value = defaultTooth || "36";
    if (noteInput) noteInput.value = "";
    if (costInput) costInput.value = "";
    if (modal) modal.classList.add("active");
  }

  closeTreatmentModal() {
    const modal = document.getElementById("patient-treatment-modal");
    if (modal) modal.classList.remove("active");
  }

  submitTreatmentModal(e) {
    e.preventDefault();
    const patientId = document.getElementById("pt-patient-id")?.value || this.activePatientId;
    const p = window.store.getPatientById(patientId);
    if (!p) return;

    const proc = document.getElementById("pt-proc")?.value || "Kanal Tedavisi";
    const tooth = document.getElementById("pt-tooth")?.value || "-";
    const cost = Number(document.getElementById("pt-cost")?.value) || 0;
    const note = document.getElementById("pt-note")?.value || "İşlem uygulandı.";

    window.store.addTreatmentNote(patientId, {
      type: proc,
      tooth: tooth,
      note: note,
      cost: cost,
      date: new Date().toISOString().split('T')[0]
    });

    if (cost > 0) {
      p.totalCost = (p.totalCost || 0) + cost;
      p.balance = Math.max(0, p.totalCost - (p.paidAmount || 0));
      window.store.save();
    }

    this.closeTreatmentModal();
    this.openPatientDetail(patientId);
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
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      this.pendingUploadFile = file;

      const modal = document.getElementById("xray-upload-modal");
      const idInput = document.getElementById("xm-patient-id");
      if (idInput) idInput.value = this.activePatientId;
      if (modal) modal.classList.add("active");
    };
    input.click();
  }

  closeXrayModal() {
    const modal = document.getElementById("xray-upload-modal");
    if (modal) modal.classList.remove("active");
    this.pendingUploadFile = null;
  }

  async submitXrayModal(e) {
    e.preventDefault();
    if (!this.pendingUploadFile || !this.activePatientId) return;

    const file = this.pendingUploadFile;
    const category = document.getElementById("xm-category")?.value || "Panoramik Röntgen";
    const note = document.getElementById("xm-note")?.value || "";

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      const patient = window.store.getPatientById(this.activePatientId);

      let fileObj = {
        id: `F-${Date.now()}`,
        name: file.name,
        url: base64Data,
        date: new Date().toISOString().split('T')[0],
        type: category,
        note: note
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
