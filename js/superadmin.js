/* ==============================================================================
   DENTATAKİP 2.0 • SUPER ADMIN COMMAND CENTER CONTROLLER (SAAS OWNER)
   ============================================================================== */

class SuperAdminController {
  constructor() {
    this.container = null;
    this.practices = [];
    this.overview = null;
  }

  async render() {
    this.container = document.getElementById('superadmin-content-area');
    if (!this.container) return;

    const user = window.apiClient?.getUser();
    if (!user || user.role !== 'superadmin') {
      this.container.innerHTML = `
        <div class="card" style="padding:40px;text-align:center;max-width:600px;margin:40px auto;border:2px dashed #ef4444">
          <div style="font-size:48px;margin-bottom:16px">🚫</div>
          <h3 style="font-size:20px;font-weight:700;color:#ef4444;margin-bottom:8px">Yetkisiz Erişim (Süper Admin Girişi Gereklidir)</h3>
          <p style="color:var(--text-muted);font-size:14px;margin-bottom:24px">
            Bu sayfa yalnızca platform sahibi ve sistem yöneticileri içindir. Lütfen süper admin hesabınızla (<code>admin@dentatakip.com</code>) giriş yapınız.
          </p>
          <button class="btn btn-primary" onclick="window.appCtrl.navigateTo('dashboard')">🏠 Ana Sahneye Dön</button>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-muted)">
        <div class="spinner" style="margin:0 auto 12px"></div>
        <p>SaaS platform verileri, abone muayenehaneler ve gelir tablosu yükleniyor...</p>
      </div>
    `;

    try {
      const [overviewRes, practicesRes] = await Promise.all([
        window.apiClient.getAdminOverview(),
        window.apiClient.getAdminPractices()
      ]);

      if (overviewRes.ok) this.overview = overviewRes.data;
      if (practicesRes.ok) this.practices = practicesRes.data || [];

      this.renderDashboard();
    } catch (e) {
      this.container.innerHTML = `
        <div class="card" style="padding:24px;background:#fee2e2;color:#991b1b;border:1px solid #f87171">
          <h4 style="font-weight:700">❌ Veri Yükleme Hatası</h4>
          <p style="font-size:13px">${e.message}</p>
        </div>
      `;
    }
  }

  renderDashboard() {
    const ov = this.overview || {
      totalPractices: 0,
      activePractices: 0,
      trialPractices: 0,
      expiredPractices: 0,
      suspendedPractices: 0,
      totalDoctors: 0,
      totalPatients: 0,
      estimatedMRR: 0
    };

    let tableRows = '';
    if (this.practices.length === 0) {
      tableRows = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">
            Henüz sistemde kayıtlı alt muayenehane bulunmuyor. Yeni bir kayıt oluşturulduğunda burada listelenecektir.
          </td>
        </tr>
      `;
    } else {
      tableRows = this.practices.map(p => {
        let statusBadge = '';
        if (p.computed_status === 'active') {
          statusBadge = `<span class="status-badge completed" style="background:#10b981;color:#fff">🟢 Aktif Abone</span>`;
        } else if (p.computed_status === 'trial') {
          statusBadge = `<span class="status-badge pending" style="background:#3b82f6;color:#fff">⏳ Deneme Süresinde</span>`;
        } else if (p.computed_status === 'expired') {
          statusBadge = `<span class="status-badge cancelled" style="background:#6b7280;color:#fff">🔴 Süresi Dolmuş</span>`;
        } else if (p.computed_status === 'suspended') {
          statusBadge = `<span class="status-badge cancelled" style="background:#ef4444;color:#fff">🚫 Askıya Alındı</span>`;
        }

        const planLabel = p.plan_type === 'clinic' ? '🏥 Poliklinik Pro' : '👨‍⚕️ Solo Hekim';
        const chairInfo = `${p.chair_count || 1} Koltuk`;
        const actionSuspendText = p.status === 'suspended' ? '✅ Aktif Et' : '🚫 Askıya Al';
        const actionSuspendColor = p.status === 'suspended' ? '#10b981' : '#ef4444';

        return `
          <tr style="border-bottom:1px solid var(--border-color);transition:background 0.2s">
            <td style="padding:16px 12px">
              <div style="font-weight:700;color:var(--text-main);font-size:14px">${p.name}</div>
              <div style="font-size:12px;color:var(--text-muted)">👤 ${p.owner_name}</div>
            </td>
            <td style="padding:16px 12px">
              <div style="font-size:13px;color:var(--text-main)">✉️ ${p.email}</div>
              <div style="font-size:12px;color:var(--text-muted)">📞 ${p.owner_phone}</div>
            </td>
            <td style="padding:16px 12px">
              <span style="display:inline-block;padding:3px 8px;border-radius:6px;background:var(--bg-card);border:1px solid var(--border-color);font-size:12px;font-weight:600">
                ${planLabel} • ${chairInfo}
              </span>
            </td>
            <td style="padding:16px 12px;text-align:center">
              <div style="font-size:13px;font-weight:700">${p.doctor_count || 1} Hekim</div>
              <div style="font-size:12px;color:var(--text-muted)">${p.patient_count || 0} Hasta</div>
            </td>
            <td style="padding:16px 12px;text-align:center">
              ${statusBadge}
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Bitiş: <strong>${p.end_date || '-'}</strong></div>
            </td>
            <td style="padding:16px 12px;text-align:right">
              <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">
                <button class="btn btn-outline" style="padding:5px 10px;font-size:11px;border-color:#3b82f6;color:#3b82f6" onclick="window.superAdminCtrl.openExtendModal('${p.id}', '${p.name}')">🎁 Süre Uzat</button>
                <button class="btn btn-outline" style="padding:5px 10px;font-size:11px;border-color:#8b5cf6;color:#8b5cf6" onclick="window.superAdminCtrl.openPlanModal('${p.id}', '${p.name}', '${p.plan_type}', ${p.chair_count || 1})">⚙️ Paket / Koltuk</button>
                <button class="btn btn-outline" style="padding:5px 10px;font-size:11px;border-color:${actionSuspendColor};color:${actionSuspendColor}" onclick="window.superAdminCtrl.toggleStatus('${p.id}', '${p.status}')">${actionSuspendText}</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    this.container.innerHTML = `
      <!-- KPI CARDS -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:24px">
        <div class="card" style="padding:20px;display:flex;align-items:center;gap:16px;border-left:4px solid #ef4444">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;font-size:24px">🏢</div>
          <div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Toplam Muayenehane</div>
            <div style="font-size:26px;font-weight:800;color:var(--text-main)">${ov.totalPractices}</div>
            <div style="font-size:11px;color:var(--text-muted)">${ov.totalDoctors} Hekim • ${ov.totalPatients} Hasta</div>
          </div>
        </div>

        <div class="card" style="padding:20px;display:flex;align-items:center;gap:16px;border-left:4px solid #10b981">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;font-size:24px">💰</div>
          <div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Tahmini Aylık Gelir (MRR)</div>
            <div style="font-size:26px;font-weight:800;color:#10b981">₺${ov.estimatedMRR.toLocaleString('tr-TR')}</div>
            <div style="font-size:11px;color:var(--text-muted)">${ov.activePractices} Ücretli Abone</div>
          </div>
        </div>

        <div class="card" style="padding:20px;display:flex;align-items:center;gap:16px;border-left:4px solid #3b82f6">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;font-size:24px">⏳</div>
          <div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Deneme Süresinde (Trial)</div>
            <div style="font-size:26px;font-weight:800;color:#3b82f6">${ov.trialPractices}</div>
            <div style="font-size:11px;color:var(--text-muted)">14 Günlük Ücretsiz Dönem</div>
          </div>
        </div>

        <div class="card" style="padding:20px;display:flex;align-items:center;gap:16px;border-left:4px solid #f59e0b">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;font-size:24px">🔴</div>
          <div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Süresi Dolan / Askıda</div>
            <div style="font-size:26px;font-weight:800;color:#f59e0b">${ov.expiredPractices + ov.suspendedPractices}</div>
            <div style="font-size:11px;color:var(--text-muted)">${ov.expiredPractices} Bitti • ${ov.suspendedPractices} Askıda</div>
          </div>
        </div>
      </div>

      <!-- TENANTS TABLE -->
      <div class="card" style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div>
            <h3 style="font-size:18px;font-weight:700;color:var(--text-main);margin:0">Kayıtlı Muayenehaneler & Klinikler (${this.practices.length})</h3>
            <p style="font-size:13px;color:var(--text-muted);margin:4px 0 0">Platformunuza kayıtlı tüm klinikleri buradan tek tıkla yönetebilir, süre hediye edebilir ve paket değiştirebilirsiniz.</p>
          </div>
          <button class="btn btn-outline" style="font-size:13px" onclick="window.superAdminCtrl.render()">🔄 Tabloyu Yenile</button>
        </div>

        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:800px">
            <thead>
              <tr style="background:var(--bg-main);border-bottom:2px solid var(--border-color);text-align:left;font-size:12px;color:var(--text-muted);text-transform:uppercase">
                <th style="padding:12px">Muayenehane & Başhekim</th>
                <th style="padding:12px">İletişim</th>
                <th style="padding:12px">Lisans Paketi</th>
                <th style="padding:12px;text-align:center">Hekim / Hasta</th>
                <th style="padding:12px;text-align:center">Abonelik & Bitiş</th>
                <th style="padding:12px;text-align:right">Yönetim Aksiyonları</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  openExtendModal(practiceId, practiceName) {
    document.getElementById('sa-ext-id').value = practiceId;
    document.getElementById('sa-ext-name').innerText = practiceName;
    document.getElementById('sa-ext-days').value = "30";
    document.getElementById('sa-ext-date').value = "";
    document.getElementById('sa-extend-modal')?.classList.add('active');
  }

  closeExtendModal() {
    document.getElementById('sa-extend-modal')?.classList.remove('active');
  }

  async submitExtendModal(e) {
    e.preventDefault();
    const practiceId = document.getElementById('sa-ext-id')?.value;
    if (!practiceId) return;

    const customDate = document.getElementById('sa-ext-date')?.value;
    const daysVal = Number(document.getElementById('sa-ext-days')?.value || 0);

    let days = null;
    let targetDate = null;
    if (customDate && customDate.includes('-')) {
      targetDate = customDate;
    } else {
      if (isNaN(daysVal) || daysVal <= 0) {
        window.appCtrl?.showToast("Lütfen geçerli bir gün sayısı veya tarih seçiniz.", "danger");
        return;
      }
      days = daysVal;
    }

    const res = await window.apiClient.extendPractice(practiceId, days, targetDate);
    if (res.ok) {
      this.closeExtendModal();
      window.appCtrl?.showToast(res.data.message || "Lisans süresi başarıyla uzatıldı!", "success");
      await this.render();
    } else {
      window.appCtrl?.showToast("Hata: " + res.error, "danger");
    }
  }

  async toggleStatus(practiceId, currentStatus) {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = newStatus === 'suspended'
      ? `Bu muayenehanenin hesabını askıya almak (dondurmak) istediğinize emin misiniz? Klinikteki hekimler sisteme giriş yapamayacak!`
      : `Bu muayenehanenin hesabını tekrar aktif etmek istediğinize emin misiniz?`;

    if (!confirm(confirmMsg)) return;

    const res = await window.apiClient.updatePracticeStatus(practiceId, newStatus);
    if (res.ok) {
      window.appCtrl?.showToast(newStatus === 'suspended' ? "Hesap donduruldu." : "Hesap aktif edildi.", "info");
      await this.render();
    } else {
      window.appCtrl?.showToast("Hata: " + res.error, "danger");
    }
  }

  openPlanModal(practiceId, practiceName, currentPlan, currentChairs) {
    document.getElementById('sa-plan-id').value = practiceId;
    document.getElementById('sa-plan-name').innerText = practiceName;
    document.getElementById('sa-plan-select').value = currentPlan || 'solo';
    document.getElementById('sa-plan-chairs').value = currentChairs || 1;
    document.getElementById('sa-plan-modal')?.classList.add('active');
  }

  closePlanModal() {
    document.getElementById('sa-plan-modal')?.classList.remove('active');
  }

  async submitPlanModal(e) {
    e.preventDefault();
    const practiceId = document.getElementById('sa-plan-id')?.value;
    const newPlan = document.getElementById('sa-plan-select')?.value || 'solo';
    const newChairs = Number(document.getElementById('sa-plan-chairs')?.value || 1);

    const res = await window.apiClient.updatePracticePlan(practiceId, newPlan, newChairs);
    if (res.ok) {
      this.closePlanModal();
      window.appCtrl?.showToast("Lisans paketi ve koltuk sayısı güncellendi!", "success");
      await this.render();
    } else {
      window.appCtrl?.showToast("Hata: " + res.error, "danger");
    }
  }
}

window.superAdminCtrl = new SuperAdminController();
