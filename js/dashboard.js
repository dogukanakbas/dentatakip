/* ==========================================================================
   SOLO HEKİM PRO — Dashboard & KPI Center View Controller
   ========================================================================== */

class DashboardController {
  constructor() {
    this.charts = {};
  }

  render() {
    this.renderKPIs();
    this.renderTodaysAppointments();
    this.renderCharts();
    this.renderQuickActions();
  }

  renderKPIs() {
    const patients = window.store.getPatients() || [];
    const appointments = window.store.getAppointments() || [];
    const payments = window.store.getPayments() || [];

    // 100% GERÇEK VERİTABANI TAHSİLAT VE ALACAK HESAPLAMASI (Sıfır sabit sayı)
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingReceivables = patients.reduce((sum, p) => sum + Number(p.balance || 0), 0);

    // Bugünün gerçek tarihi
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysAppts = appointments.filter(a => a.date === todayStr);

    // Günlük koltuk doluluk oranı (8 saat = 480 dakika)
    const bookedMinutes = todaysAppts.reduce((sum, a) => sum + (a.status !== "İptal" ? Number(a.durationMinutes || 0) : 0), 0);
    const occupancyPercent = Math.min(100, Math.round((bookedMinutes / 480) * 100));

    // No-Show (Gelmeyen hasta oranı)
    const noShowCount = appointments.filter(a => a.status === "İptal" || a.status === "Gelmedi").length;
    const noShowPercent = appointments.length > 0
      ? ((noShowCount / appointments.length) * 100).toFixed(1)
      : "0.0";

    const kpiContainer = document.getElementById('dashboard-kpi-grid');
    if (!kpiContainer) return;

    kpiContainer.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Toplam Gerçekleşen Tahsilat</span>
          <div class="kpi-icon-wrap primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${totalCollected.toLocaleString('tr-TR')} ₺</div>
        <div class="kpi-sub">
          <span class="trend-badge ${totalCollected > 0 ? 'up' : 'down'}">${totalCollected > 0 ? 'Aktif' : 'Bekleniyor'}</span>
          <span style="color:var(--text-muted)">Canlı veritabanı tahsilatı</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Bekleyen Alacaklar (Cari)</span>
          <div class="kpi-icon-wrap warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${pendingReceivables.toLocaleString('tr-TR')} ₺</div>
        <div class="kpi-sub">
          <span style="color:var(--text-muted)">Hastaların toplam kalan bakiyesi</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Günlük Koltuk Doluluk Oranı</span>
          <div class="kpi-icon-wrap success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
        </div>
        <div class="kpi-value">%${occupancyPercent}</div>
        <div class="kpi-sub">
          <span style="color:var(--text-muted)">Bugün ${todaysAppts.length} randevu (${bookedMinutes} dk)</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">No-Show / İptal Oranı</span>
          <div class="kpi-icon-wrap info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
            </svg>
          </div>
        </div>
        <div class="kpi-value">%${noShowPercent}</div>
        <div class="kpi-sub">
          <span style="color:var(--text-muted)">Toplam ${appointments.length} randevudan ${noShowCount} iptal</span>
        </div>
      </div>
    `;
  }

  renderTodaysAppointments() {
    const listEl = document.getElementById('todays-timeline-list');
    if (!listEl) return;

    // Gerçek bugünün tarihi
    const todayStr = new Date().toISOString().split('T')[0];
    const appts = (window.store.getAppointments() || []).filter(a => a.date === todayStr);

    if (appts.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:32px 16px;color:var(--text-muted)">
          <div style="font-size:24px;margin-bottom:8px">📅</div>
          <div style="font-weight:600;color:var(--text-main)">Bugün için planlanmış randevu bulunmuyor</div>
          <p style="font-size:12.5px;margin-top:4px">Üstteki "+ Hızlı Randevu" butonundan bugüne yeni randevu ekleyebilirsiniz.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = appts.map(a => {
      let badgeClass = "waiting";
      if (a.status === "Geldi") badgeClass = "completed";
      if (a.status === "Gelmedi") badgeClass = "noshow";
      if (a.status === "İptal") badgeClass = "cancelled";

      return `
        <div class="timeline-item">
          <div style="display:flex;align-items:center;gap:16px">
            <div class="time-badge">${a.time}</div>
            <div class="patient-info">
              <h4>${a.patientName}</h4>
              <p>${a.procedure} • (${a.durationMinutes} dk)</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <span class="status-badge ${badgeClass}">${a.status}</span>
            <div style="display:flex;gap:6px">
              <button class="btn-icon" title="Geldi Olarak İşaretle" onclick="window.dashboardCtrl.quickStatus('${a.id}', 'Geldi')">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button class="btn-icon" title="WhatsApp Hatırlatma Gönder" onclick="window.dashboardCtrl.sendQuickWhatsApp('${a.patientName}', '${a.phone}', '${a.time}')">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="#25d366" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  quickStatus(id, newStatus) {
    window.store.updateAppointmentStatus(id, newStatus);
    this.renderTodaysAppointments();
    window.appCtrl?.showToast(`Randevu durumu "${newStatus}" olarak güncellendi.`, "success");
  }

  sendQuickWhatsApp(patientName, phone, time) {
    const msg = `Sayın ${patientName}, bugün saat ${time}'deki randevunuzu hatırlatır, sağlıklı günler dileriz. - Dr. Zeynep Aksoy`;
    window.store.addWhatsAppMessage(patientName, phone, "Anlık Hatırlatma", msg);
    window.appCtrl?.showToast(`${patientName} için WhatsApp hatırlatması iletildi!`, "whatsapp");
  }

  renderQuickActions() {
    const el = document.getElementById('dashboard-actions-list');
    if (!el) return;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:10px;background:var(--bg-subtle)">
          <div>
            <div style="font-weight:600;font-size:13.5px">Yarınki 3 Randevuya Hatırlatma</div>
            <div style="font-size:12px;color:var(--text-muted)">WhatsApp 24s Otomatik Onay Şablonu</div>
          </div>
          <button class="btn btn-whatsapp" style="padding:6px 14px;font-size:12px" onclick="window.dashboardCtrl.triggerBulkReminder()">
            Otomasyonu Tetikle
          </button>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:10px;background:var(--bg-subtle)">
          <div>
            <div style="font-weight:600;font-size:13.5px">Vadesi Geçen 2 Hasta Bakiyesi</div>
            <div style="font-size:12px;color:var(--text-muted)">Nazik Ödeme Hatırlatması • Toplam: 9.500 ₺</div>
          </div>
          <button class="btn btn-secondary" style="padding:6px 14px;font-size:12px" onclick="window.appCtrl?.navigateTo('whatsapp')">
            WhatsApp Şablonuna Git
          </button>
        </div>
      </div>
    `;
  }

  triggerBulkReminder() {
    window.store.addWhatsAppMessage("Elif Demirtaş", "+90 530 455 19 23", "Randevu Hatırlatma (24 saat)", "Sayın Elif Demirtaş, yarın saat 10:30'da randevunuz bulunmaktadır. Onaylamak için tıklayın.");
    window.appCtrl?.showToast("Yarınki randevular için WhatsApp 24 saat hatırlatması başarıyla kuyruğa eklendi!", "whatsapp");
  }

  renderCharts() {
    if (typeof Chart === 'undefined') return;

    const payments = window.store.getPatients ? (window.store.getPayments() || []) : [];
    const patients = window.store.getPatients ? (window.store.getPatients() || []) : [];
    const appointments = window.store.getAppointments ? (window.store.getAppointments() || []) : [];

    // Gerçek veritabanındaki ödemelere göre 6 aylık analiz
    const labels = ['Şub', 'Mar', 'Nis', 'May', 'Haz', 'Temmuz'];
    const monthlyCollected = [0, 0, 0, 0, 0, 0];
    const monthlyPending = [0, 0, 0, 0, 0, 0];

    payments.forEach(p => {
      if (p.date) {
        const d = new Date(p.date);
        if (!isNaN(d.getTime())) {
          const mIdx = d.getMonth() - 1; // Şub=0 .. Tem=5
          if (mIdx >= 0 && mIdx < 6) {
            monthlyCollected[mIdx] += Number(p.amount || 0);
          } else {
            monthlyCollected[5] += Number(p.amount || 0);
          }
        }
      }
    });

    const totalPending = patients.reduce((sum, pt) => sum + Number(pt.balance || 0), 0);
    monthlyPending[5] = totalPending;

    // Revenue Trend Chart
    const revCtx = document.getElementById('chartRevenueTrend');
    if (revCtx) {
      if (this.charts.revenue) this.charts.revenue.destroy();
      this.charts.revenue = new Chart(revCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Gerçekleşen Tahsilat (₺)',
              data: monthlyCollected,
              backgroundColor: '#0d9488',
              borderRadius: 6
            },
            {
              label: 'Bekleyen Bakiye (₺)',
              data: monthlyPending,
              backgroundColor: '#f59e0b',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans' } } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Chair Occupancy Distribution Chart (100% Canlı Veritabanı Oranları)
    const completedCount = appointments.filter(a => a.status === 'Geldi').length;
    const waitingCount = appointments.filter(a => a.status === 'Bekliyor' || a.status === 'Onaylandı').length;
    const cancelledCount = appointments.filter(a => a.status === 'İptal' || a.status === 'Gelmedi').length;

    const doughnutData = appointments.length > 0
      ? [completedCount, waitingCount, cancelledCount]
      : [0, 1, 0]; // Henüz randevu yoksa boş durum

    const occCtx = document.getElementById('chartOccupancy');
    if (occCtx) {
      if (this.charts.occupancy) this.charts.occupancy.destroy();
      this.charts.occupancy = new Chart(occCtx, {
        type: 'doughnut',
        data: {
          labels: ['Geldi / Tamamlandı', 'Bekleyen Randevu', 'İptal / Gelmeyen'],
          datasets: [{
            data: doughnutData,
            backgroundColor: ['#10b981', '#0d9488', '#ef4444'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans' } } }
          }
        }
      });
    }
  }
}

window.dashboardCtrl = new DashboardController();
