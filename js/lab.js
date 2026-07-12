/**
 * LAB CONTROLLER (js/lab.js)
 * Diş Protez Laboratuvarı İş Emirleri, Diş Rengi/Materyal ve Termin Takibi Modülü
 */

class LabController {
  constructor() {
    this.currentOrders = [];
  }

  render() {
    const container = document.getElementById('lab-content-area');
    if (!container) return;

    const orders = window.store.getLabOrders();
    this.currentOrders = orders;

    const totalOrders = orders.length;
    const inProgress = orders.filter(o => o.status !== "Teslim Edildi").length;
    const delivered = orders.filter(o => o.status === "Teslim Edildi").length;
    const totalCost = orders.reduce((sum, o) => sum + (Number(o.cost) || 0), 0);

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
          <span style="font-size:12.5px;color:var(--text-muted)">Diş rengi, termin tarihi ve prova kontrolü</span>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>İş No</th>
                <th>Hasta Adı</th>
                <th>Diş No</th>
                <th>İş Türü & Materyal</th>
                <th>Diş Rengi</th>
                <th>Laboratuvar</th>
                <th>Termin Tarihi</th>
                <th>Ücret</th>
                <th>Durum</th>
                <th style="text-align:right">Aşama / İşlem</th>
              </tr>
            </thead>
            <tbody>
              ${orders.length === 0 ? `
                <tr>
                  <td colspan="10" style="text-align:center;padding:32px;color:var(--text-muted)">
                    Henüz laboratuvar iş emri bulunmuyor. Sağ üstteki butonla yeni protez siparişi oluşturabilirsiniz.
                  </td>
                </tr>
              ` : orders.map(o => `
                <tr>
                  <td><strong style="color:var(--primary)">#${o.id}</strong></td>
                  <td><span style="font-weight:600">${o.patientName}</span></td>
                  <td><span class="tooth-badge" style="background:var(--bg-card-hover);padding:4px 8px;border-radius:6px;font-size:12px;font-weight:700">${o.tooth}</span></td>
                  <td><span style="font-weight:500">${o.type}</span></td>
                  <td>
                    <span style="background:var(--bg-card-hover);border:1px solid var(--border-color);padding:3px 8px;border-radius:6px;font-size:12px;font-weight:700">
                      🎨 ${o.color}
                    </span>
                  </td>
                  <td><span style="color:var(--text-muted);font-size:13px">${o.labName}</span></td>
                  <td><strong style="color:var(--text-main)">${o.dueDate}</strong></td>
                  <td>${Number(o.cost || 0).toLocaleString('tr-TR')} ₺</td>
                  <td>
                    ${o.status === 'Teslim Edildi' 
                      ? `<span class="status-badge completed">✔ Teslim Edildi</span>`
                      : o.status === 'Provada'
                      ? `<span class="status-badge" style="background:rgba(245,158,11,0.15);color:#f59e0b">🔧 Provada</span>`
                      : `<span class="status-badge pending">🛠 Hazırlanıyor</span>`
                    }
                  </td>
                  <td style="text-align:right">
                    <div style="display:inline-flex;gap:6px">
                      ${o.status !== 'Teslim Edildi' ? `
                        <button class="btn btn-secondary btn-sm" onclick="window.labCtrl.advanceStatus('${o.id}')">
                          ⏭ İlerlet
                        </button>
                      ` : ''}
                      <button class="btn btn-secondary btn-sm" onclick="window.labCtrl.notifyPatient('${o.id}')" title="Hastayı WhatsApp'tan bilgilendir">
                        📲 WhatsApp
                      </button>
                      <button class="btn-icon" onclick="window.labCtrl.deleteOrder('${o.id}')" title="Siparişi Sil">🗑</button>
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

  openNewLabModal() {
    const modal = document.getElementById('new-lab-modal');
    if (!modal) return;

    const patientSelect = document.getElementById('lab-patient-select');
    if (patientSelect) {
      const patients = window.store.getPatients();
      patientSelect.innerHTML = patients.map(p => `
        <option value="${p.id}">${p.name}</option>
      `).join('');
    }

    // Default due date: +7 gün
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

  createLabOrder(e) {
    e.preventDefault();
    const patientId = document.getElementById('lab-patient-select').value;
    const patient = window.store.getPatientById(patientId);

    const tooth = document.getElementById('lab-tooth').value;
    const color = document.getElementById('lab-color').value;
    const type = document.getElementById('lab-type').value;
    const labName = document.getElementById('lab-name').value;
    const dueDate = document.getElementById('lab-due-date').value;
    const cost = Number(document.getElementById('lab-cost').value) || 0;
    const notes = document.getElementById('lab-notes').value;

    const newOrder = {
      patientId,
      patientName: patient ? patient.name : "Hasta",
      tooth,
      color,
      type,
      labName,
      dueDate,
      cost,
      notes,
      orderDate: new Date().toISOString().split('T')[0],
      status: "Hazırlanıyor"
    };

    const created = window.store.addLabOrder(newOrder);
    this.closeNewLabModal();
    this.render();
    window.appCtrl.showToast(`Yeni lab siparişi #${created.id} (${type}) gönderildi.`);
  }

  advanceStatus(id) {
    const order = window.store.getLabOrders().find(o => o.id === id);
    if (!order) return;

    let next = "Provada";
    if (order.status === "Hazırlanıyor") next = "Provada";
    else if (order.status === "Provada") next = "Teslim Edildi";

    window.store.updateLabOrder(id, { status: next });
    window.appCtrl.showToast(`Sipariş durumu güncellendi: #${id} -> ${next}`);
    this.render();
  }

  notifyPatient(id) {
    const order = window.store.getLabOrders().find(o => o.id === id);
    if (!order) return;

    const patient = window.store.getPatientById(order.patientId);
    const phone = patient ? patient.phone : "+90 532 000 00 00";
    const msg = `Sayın ${order.patientName}, ${order.type} protez çalışmanız kliniğimize ulaşmıştır. Prova randevunuz için bekliyoruz.`;

    window.store.addWhatsAppMessage(order.patientName, phone, "Protez Teslim Bilgilendirme", msg, "İletildi");
    window.appCtrl.showToast(`Hastaya protez hazır WhatsApp mesajı gönderildi!`);
  }

  deleteOrder(id) {
    if (confirm("Bu laboratuvar sipariş kaydını silmek istediğinize emin misiniz?")) {
      window.store.deleteLabOrder(id);
      this.render();
      window.appCtrl.showToast("Sipariş kaydı silindi.");
    }
  }
}

window.labCtrl = new LabController();
