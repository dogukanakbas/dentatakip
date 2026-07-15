/**
 * LAB CONTROLLER (js/lab.js)
 * Diş Protez Laboratuvarı İş Emirleri, Diş Rengi/Materyal ve Termin Takibi Modülü
 */

class LabController {
  constructor() {
    this.currentOrders = [];
  }

  async render() {
    const container = document.getElementById('lab-content-area');
    if (!container) return;

    const orders = await window.apiClient?.getLabJobs() || [];
    this.currentOrders = orders;

    const totalOrders = orders.length;
    const inProgress = orders.filter(o => o.status !== "Kliniğe Teslim Edildi" && o.status !== "Hastaya Uygulandı" && o.status !== "Teslim Edildi").length;
    const delivered = orders.filter(o => o.status === "Kliniğe Teslim Edildi" || o.status === "Hastaya Uygulandı" || o.status === "Teslim Edildi").length;
    const totalCost = orders.reduce((sum, o) => sum + (Number(o.cost) || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:24px">
        <div class="kpi-card">
          <div class="kpi-title">Toplam Lab İş Emri</div>
          <div class="kpi-value">${totalOrders}</div>
          <div class="kpi-trend positive">Protez Takibi</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Laboratuvarda (Süreçte)</div>
          <div class="kpi-value" style="color:#0ea5e9">${inProgress}</div>
          <div class="kpi-trend">Hazırlanıyor & Prova</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Kliniğe Teslim Edilen</div>
          <div class="kpi-value" style="color:var(--whatsapp)">${delivered}</div>
          <div class="kpi-trend positive">Hastaya Uygulamaya Hazır</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Lab Cari Maliyet Toplamı</div>
          <div class="kpi-value">${totalCost.toLocaleString('tr-TR')} ₺</div>
          <div class="kpi-trend">Laboratuvar Gideri</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <h3 class="card-title">Protez Laboratuvarı Sipariş Listesi & Prova Durumu</h3>
          <span style="font-size:12.5px;color:var(--text-muted)">Diş rengi, termin tarihi, hekim ataması ve prova kontrolü</span>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>İş No</th>
                <th>Hasta & Atanan Hekim</th>
                <th>İş Türü & Materyal</th>
                <th>Diş Rengi</th>
                <th>Laboratuvar</th>
                <th>Termin & Alarm</th>
                <th>Maliyet (Gider)</th>
                <th>Aşama / Durum</th>
                <th style="text-align:right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              ${orders.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align:center;padding:36px;color:var(--text-muted)">
                    Henüz laboratuvar iş emri bulunmuyor. Sağ üstteki butonla yeni protez siparişi oluşturabilirsiniz.
                  </td>
                </tr>
              ` : orders.map(o => {
                const isCompleted = o.status === 'Kliniğe Teslim Edildi' || o.status === 'Hastaya Uygulandı' || o.status === 'Teslim Edildi';
                const isOverdue = !isCompleted && o.due_date < todayStr;
                const isToday = !isCompleted && o.due_date === todayStr;

                let dateBadge = `<strong style="color:var(--text-main)">${o.due_date}</strong>`;
                if (isOverdue) {
                  dateBadge = `<div style="display:flex;align-items:center;gap:6px"><strong style="color:#ef4444">${o.due_date}</strong><span class="status-badge" style="background:#ef4444;color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px">🚨 GECİKTİ</span></div>`;
                } else if (isToday) {
                  dateBadge = `<div style="display:flex;align-items:center;gap:6px"><strong style="color:#f59e0b">${o.due_date}</strong><span class="status-badge" style="background:#f59e0b;color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px">⏳ BUGÜN</span></div>`;
                }

                let statusHtml = '';
                if (isCompleted) {
                  statusHtml = `<span class="status-badge completed">✔ ${o.status}</span>`;
                } else if (o.status === 'Altyapı Provası' || o.status === 'Porselen Provası' || o.status === 'Provada') {
                  statusHtml = `<span class="status-badge" style="background:rgba(245,158,11,0.15);color:#f59e0b">🔧 ${o.status}</span>`;
                } else {
                  statusHtml = `<span class="status-badge pending">🛠 ${o.status || 'Ölçü Gönderildi'}</span>`;
                }

                return `
                  <tr>
                    <td><strong style="color:var(--primary)">#${o.id.slice(-6)}</strong></td>
                    <td>
                      <div style="font-weight:700;color:var(--text-main);font-size:14px">${o.patient_name || o.patientName}</div>
                      <div style="font-size:11.5px;color:var(--primary-color);font-weight:600">🩺 ${o.doctor_name || 'Hekim Atanmadı'}</div>
                    </td>
                    <td>
                      <div style="font-weight:600;color:var(--text-main)">${o.work_type || o.type}</div>
                      <div style="font-size:11px;color:var(--text-muted)">Diş No: <strong>${o.tooth || (o.notes ? o.notes.slice(0,10) : '-')}</strong></div>
                    </td>
                    <td>
                      <span style="background:var(--bg-card-hover);border:1px solid var(--border-color);padding:3px 8px;border-radius:6px;font-size:12px;font-weight:700">
                        🎨 ${o.shade || o.color || 'A2'}
                      </span>
                    </td>
                    <td><span style="color:var(--text-main);font-size:13px;font-weight:500">${o.lab_name || o.labName}</span></td>
                    <td>${dateBadge}</td>
                    <td><strong style="color:#ef4444">₺${Number(o.cost || 0).toLocaleString('tr-TR')}</strong></td>
                    <td>${statusHtml}</td>
                    <td style="text-align:right">
                      <div style="display:inline-flex;gap:6px">
                        ${!isCompleted ? `
                          <button class="btn btn-secondary btn-sm" onclick="window.labCtrl.advanceStatus('${o.id}', '${o.status || 'Ölçü Gönderildi'}')">
                            ⏭ İlerlet
                          </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="window.labCtrl.notifyPatient('${o.id}', '${o.patient_id || o.patientId}', '${o.patient_name || o.patientName}', '${o.work_type || o.type}')" title="Hastayı WhatsApp'tan bilgilendir">
                          📲 WhatsApp
                        </button>
                        <button class="btn-icon" onclick="window.labCtrl.deleteOrder('${o.id}', '${o.patient_name || o.patientName}')" title="Siparişi Sil">🗑</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async openNewLabModal() {
    const modal = document.getElementById('new-lab-modal');
    if (!modal) return;

    await window.store.syncWithServer();
    const patientSelect = document.getElementById('lab-patient-select');
    if (patientSelect) {
      const patients = window.store.getPatients();
      patientSelect.innerHTML = patients.map(p => `
        <option value="${p.id}" data-doc-id="${p.doctor_id || ''}" data-doc-name="${p.doctor_name || ''}">${p.name}</option>
      `).join('');
    }

    const doctorSelect = document.getElementById('lab-doctor-select');
    if (doctorSelect) {
      const team = window.store.data.team || [];
      const doctors = team.filter(m => m.role === 'doctor' || m.role === 'owner');
      const currentUser = window.apiClient?.getUser() || {};
      doctorSelect.innerHTML = doctors.map(d => `
        <option value="${d.id}" ${d.id === currentUser.id ? 'selected' : ''}>${d.full_name} (${d.title || 'Diş Hekimi'})</option>
      `).join('');
    }

    const dueInput = document.getElementById('lab-due-date');
    if (dueInput) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dueInput.value = d.toISOString().split('T')[0];
    }

    modal.classList.add('active');
  }

  closeNewLabModal() {
    const modal = document.getElementById('new-lab-modal');
    if (modal) modal.classList.remove('active');
  }

  async createLabOrder(e) {
    e.preventDefault();
    const patientSelect = document.getElementById('lab-patient-select');
    const patientId = patientSelect.value;
    const patientName = patientSelect.options[patientSelect.selectedIndex]?.text || "Hasta";

    const doctorSelect = document.getElementById('lab-doctor-select');
    const doctor_id = doctorSelect ? doctorSelect.value : '';
    const doctor_name = doctorSelect && doctorSelect.selectedIndex >= 0 ? doctorSelect.options[doctorSelect.selectedIndex].text.split(' (')[0] : 'Diş Hekimi';

    const tooth = document.getElementById('lab-tooth').value;
    const color = document.getElementById('lab-color').value;
    const type = document.getElementById('lab-type').value;
    const labName = document.getElementById('lab-name').value;
    const dueDate = document.getElementById('lab-due-date').value;
    const cost = Number(document.getElementById('lab-cost').value) || 0;
    const notes = document.getElementById('lab-notes').value;

    const res = await window.apiClient.addLabJob({
      patient_id: patientId,
      patient_name: patientName,
      doctor_id,
      doctor_name,
      work_type: type,
      shade: color,
      lab_name: labName,
      due_date: dueDate,
      cost,
      notes: `Diş No: ${tooth} | ${notes || ''}`
    });

    if (res.ok) {
      this.closeNewLabModal();
      await this.render();
      window.appCtrl.showToast(`🎉 Yeni protez/lab siparişi (${type}) oluşturuldu ve hekim hakediş hesabına bağlandı.`, "success");
    } else {
      window.appCtrl.showToast("Hata: " + res.error, "danger");
    }
  }

  async advanceStatus(id, currentStatus) {
    let next = "Altyapı Provası";
    if (currentStatus === "Ölçü Gönderildi" || currentStatus === "Hazırlanıyor") next = "Altyapı Provası";
    else if (currentStatus === "Altyapı Provası") next = "Porselen Provası";
    else if (currentStatus === "Porselen Provası" || currentStatus === "Provada") next = "Kliniğe Teslim Edildi";
    else next = "Hastaya Uygulandı";

    const res = await window.apiClient.updateLabJobStatus(id, next);
    if (res.ok) {
      window.appCtrl.showToast(`Sipariş aşaması güncellendi: -> ${next}`, "info");
      await this.render();
    } else {
      window.appCtrl.showToast("Güncelleme hatası: " + res.error, "danger");
    }
  }

  async notifyPatient(id, patientId, patientName, workType) {
    const patient = window.store.getPatientById(patientId);
    const phone = patient ? patient.phone : "+90 532 000 00 00";
    const msg = `Sayın ${patientName}, ${workType} protez çalışmanız kliniğimize ulaşmış ve provaya hazır hale gelmiştir. Randevu gün ve saatiniz için bekliyoruz.`;

    await window.store.addWhatsAppMessage(patientName, phone, "Protez Prova/Teslim Bilgilendirme", msg, "İletildi");
    window.appCtrl.showToast(`Hastaya WhatsApp'tan protez hazır bilgilendirmesi gönderildi!`, "success");
  }

  async deleteOrder(id, patientName) {
    const proceed = await new Promise(resolve => {
      let m = document.getElementById('lab-delete-confirm-modal');
      if (!m) {
        m = document.createElement('div');
        m.className = 'modal-overlay';
        m.id = 'lab-delete-confirm-modal';
        m.innerHTML = `
          <div class="modal-box" style="max-width:400px;text-align:center;padding:24px">
            <div style="font-size:36px;margin-bottom:12px">🧪</div>
            <h3 style="font-size:18px;font-weight:700;color:var(--text-main);margin-bottom:8px">Siparişi İptal Et</h3>
            <p id="lab-del-msg" style="font-size:14px;color:var(--text-muted);margin-bottom:20px;line-height:1.5"></p>
            <div style="display:flex;gap:10px;justify-content:center">
              <button class="btn btn-secondary" id="lb-del-cancel">İptal</button>
              <button class="btn btn-primary" style="background:#ef4444;border-color:#ef4444" id="lb-del-ok">Evet, Siparişi Sil</button>
            </div>
          </div>
        `;
        document.body.appendChild(m);
      }
      document.getElementById('lab-del-msg').textContent = `"${patientName}" hastasına ait laboratuvar/protez iş emrini silmek istediğinize emin misiniz?`;
      m.classList.add('active');
      const cancelBtn = document.getElementById('lb-del-cancel');
      const okBtn = document.getElementById('lb-del-ok');
      const cleanup = (ans) => {
        m.classList.remove('active');
        cancelBtn.onclick = null;
        okBtn.onclick = null;
        resolve(ans);
      };
      cancelBtn.onclick = () => cleanup(false);
      okBtn.onclick = () => cleanup(true);
    });

    if (!proceed) return;

    const res = await window.apiClient.deleteLabJob(id);
    if (res.ok) {
      window.appCtrl.showToast("Sipariş kaydı silindi.", "info");
      await this.render();
    } else {
      window.appCtrl.showToast("Silme hatası: " + res.error, "danger");
    }
  }
}

window.labCtrl = new LabController();
