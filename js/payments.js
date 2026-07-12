/* ==========================================================================
   SOLO HEKİM PRO — Payment Ledger & Installment Plan Controller
   ========================================================================== */

class PaymentsController {
  constructor() {
    this.filterMethod = 'all';
  }

  render() {
    this.renderSummary();
    this.renderTable();
    this.populatePatientSelect();
  }

  renderSummary() {
    const payments = window.store.getPayments() || [];
    const patients = window.store.getPatients() || [];

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPending = patients.reduce((sum, p) => sum + Number(p.balance || 0), 0);
    const debtorsCount = patients.filter(p => Number(p.balance || 0) > 0).length;

    const el = document.getElementById('payments-summary-grid');
    if (!el) return;

    el.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Gerçekleşen Toplam Tahsilat</span>
          <div class="kpi-icon-wrap success">₺</div>
        </div>
        <div class="kpi-value">${totalPaid.toLocaleString('tr-TR')} ₺</div>
        <div class="kpi-sub" style="color:var(--text-muted)">Nakit, Kredi Kartı & EFT</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Hasta Cari Alacakları (Borçlar)</span>
          <div class="kpi-icon-wrap warning">!</div>
        </div>
        <div class="kpi-value" style="color:var(--warning)">${totalPending.toLocaleString('tr-TR')} ₺</div>
        <div class="kpi-sub" style="color:var(--text-muted)">Otomatik WhatsApp hatırlatma aktif</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Bakiyesi Olan Hasta Sayısı</span>
          <div class="kpi-icon-wrap primary">#</div>
        </div>
        <div class="kpi-value">${debtorsCount} Hasta</div>
        <div class="kpi-sub" style="color:var(--text-muted)">Kalan ödeme bakiyesi bulunanlar</div>
      </div>
    `;
  }

  renderTable() {
    const el = document.getElementById('payments-table-body');
    if (!el) return;

    let payments = window.store.getPayments();
    if (this.filterMethod !== 'all') {
      payments = payments.filter(p => p.method === this.filterMethod);
    }

    if (payments.length === 0) {
      el.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Tahsilat kaydı bulunamadı.</td></tr>`;
      return;
    }

    el.innerHTML = payments.map(p => `
      <tr>
        <td><strong style="color:var(--text-main)">${p.patientName}</strong></td>
        <td><span style="font-weight:700;color:var(--success)">+${Number(p.amount).toLocaleString('tr-TR')} ₺</span></td>
        <td>
          <span class="status-badge" style="background:var(--primary-subtle);color:var(--primary)">${p.method}</span>
        </td>
        <td>${p.date}</td>
        <td><span style="font-size:12.5px;color:var(--text-muted)">${p.note || '-'}</span></td>
      </tr>
    `).join('');
  }

  populatePatientSelect() {
    const select = document.getElementById('pay-patient-select');
    if (!select) return;
    const patients = window.store.getPatients();
    select.innerHTML = patients.map(p => `
      <option value="${p.id}">${p.name} (Kalan Borç: ${p.balance.toLocaleString('tr-TR')} ₺)</option>
    `).join('');
  }

  openAddModal() {
    this.populatePatientSelect();
    document.getElementById('add-payment-modal')?.classList.add('active');
  }

  closeAddModal() {
    document.getElementById('add-payment-modal')?.classList.remove('active');
  }

  submitPayment(e) {
    e.preventDefault();
    const patientId = document.getElementById('pay-patient-select').value;
    const patient = window.store.getPatientById(patientId);
    const amount = document.getElementById('pay-amount').value;
    const method = document.getElementById('pay-method').value;
    const note = document.getElementById('pay-note').value;

    window.store.addPayment({
      patientId,
      patientName: patient ? patient.name : 'Hasta',
      amount,
      method,
      note
    });

    this.closeAddModal();
    this.render();
    window.appCtrl?.showToast(`${patient ? patient.name : ''} için ${amount} ₺ tahsilat kaydedildi!`, "success");
  }

  /* Installment Plan Creator Modal (Section 6.3 P1) */
  openInstallmentModal() {
    const select = document.getElementById('inst-patient-select');
    if (select) {
      const patients = window.store.getPatients() || [];
      select.innerHTML = patients.map(p => `
        <option value="${p.id}">${p.name} (Mevcut Bedel: ${(p.totalCost || 0).toLocaleString('tr-TR')} ₺)</option>
      `).join('');
    }
    document.getElementById('installment-modal')?.classList.add('active');
  }

  closeInstallmentModal() {
    document.getElementById('installment-modal')?.classList.remove('active');
  }

  createInstallmentPlan(e) {
    e.preventDefault();
    const patientId = document.getElementById('inst-patient-select')?.value;
    const patient = window.store.getPatientById(patientId);
    if (!patient) {
      window.appCtrl?.showToast("Lütfen bir hasta seçin", "danger");
      return;
    }

    const total = Number(document.getElementById('inst-total').value || 0);
    const count = Number(document.getElementById('inst-count').value || 1);
    const monthlyAmount = Math.round(total / count);

    // Hastanın tedavi bedelini taksit planı tutarı kadar artır veya ayarla
    patient.totalCost = Number(patient.totalCost || 0) + total;
    patient.balance = Math.max(0, patient.totalCost - Number(patient.paidAmount || 0));
    patient.status = "Taksitli Tedavi Planı";

    // Hastanın geçmişine taksit planını not olarak ekle
    patient.history = patient.history || [];
    patient.history.unshift({
      id: `H-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: `${count} Taksitli Tedavi Planı`,
      tooth: "Tümü",
      note: `Toplam ${total.toLocaleString('tr-TR')} ₺ bedel ${count} eşit aya (${monthlyAmount.toLocaleString('tr-TR')} ₺/Ay) bölündü. Vade takvimi aktif.`
    });

    window.store.save();
    this.closeInstallmentModal();
    this.render();
    if (window.patientsCtrl) window.patientsCtrl.renderTable();
    if (window.dashboardCtrl) window.dashboardCtrl.render();

    const msg = `${patient.name} için toplam ${total.toLocaleString('tr-TR')} ₺ bedel, ${count} eşit takside (${monthlyAmount.toLocaleString('tr-TR')} ₺/Ay) hasta kartına işlendi!`;
    window.appCtrl?.showToast(msg, "success");
  }
}

window.paymentsCtrl = new PaymentsController();
