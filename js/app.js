/* ==========================================================================
   SOLO HEKİM PRO — Main Router, Search & Application Shell Controller
   ========================================================================== */

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.theme = localStorage.getItem('solo_hekim_theme') || 'light';
    this.applyTheme(this.theme);
    this.initListeners();
  }

  init() {
    this.renderHeaderDoctorInfo();
    this.navigateTo('dashboard');
  }

  renderHeaderDoctorInfo() {
    const user = window.apiClient?.getUser();
    const practice = window.apiClient?.getPractice();
    const storeDoctor = window.store?.data?.doctor;

    const docName = user?.full_name || practice?.doctor_name || storeDoctor?.name || "Diş Hekimi";
    const docTitle = practice?.name || storeDoctor?.title || "Solo Muayenehane";

    // İsimden baş harfleri hesapla
    const initials = docName
      .replace(/^Dr\.\s*|^Dt\.\s*/i, '')
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase())
      .slice(0, 2)
      .join('') || "DT";

    const avatarEl = document.getElementById('sidebar-doc-avatar');
    const nameEl = document.getElementById('sidebar-doc-name');
    const titleEl = document.getElementById('sidebar-doc-title');

    if (avatarEl) avatarEl.innerText = initials;
    if (nameEl) nameEl.innerText = docName;
    if (titleEl) titleEl.innerText = docTitle;
  }

  initListeners() {
    // Keyboard Shortcut Cmd+K / Ctrl+K for Global Search Modal
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.openGlobalSearch();
      }
      if (e.key === 'Escape') {
        this.closeGlobalSearch();
        window.patientsCtrl?.closePatientDetail();
        window.patientsCtrl?.closeAddModal();
        window.calendarCtrl?.closeNewApptModal();
        window.paymentsCtrl?.closeAddModal();
        window.paymentsCtrl?.closeInstallmentModal();
        window.consentCtrl?.closeNewConsentModal();
        window.consentCtrl?.closeSignatureModal();
        window.labCtrl?.closeNewLabModal();
        window.inventoryCtrl?.closeNewItemModal();
      }
    });
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('solo_hekim_theme', theme);

    const btnLight = document.getElementById('btn-theme-light');
    const btnDark = document.getElementById('btn-theme-dark');
    if (btnLight) btnLight.classList.toggle('active', theme === 'light');
    if (btnDark) btnDark.classList.toggle('active', theme === 'dark');
  }

  toggleTheme() {
    this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  navigateTo(viewId) {
    this.currentView = viewId;

    // Update Nav Sidebar items
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-view') === viewId);
    });

    // Update Page Views
    document.querySelectorAll('.page-view').forEach(el => {
      el.classList.toggle('active', el.id === `view-${viewId}`);
    });

    // Trigger corresponding controller render
    if (viewId === 'dashboard') window.dashboardCtrl?.render();
    if (viewId === 'patients') window.patientsCtrl?.render();
    if (viewId === 'calendar') window.calendarCtrl?.render();
    if (viewId === 'payments') window.paymentsCtrl?.render();
    if (viewId === 'whatsapp') window.whatsappCtrl?.render();
    if (viewId === 'settings') window.settingsCtrl?.render();
    if (viewId === 'consent') window.consentCtrl?.render();
    if (viewId === 'lab') window.labCtrl?.render();
    if (viewId === 'inventory') window.inventoryCtrl?.render();
  }

  openGlobalSearch() {
    const modal = document.getElementById('global-search-modal');
    if (modal) {
      modal.classList.add('active');
      const input = document.getElementById('gs-input');
      if (input) {
        input.value = '';
        input.focus();
        this.handleGlobalSearch('');
      }
    }
  }

  closeGlobalSearch() {
    document.getElementById('global-search-modal')?.classList.remove('active');
  }

  handleGlobalSearch(query) {
    const resultsContainer = document.getElementById('gs-results');
    if (!resultsContainer) return;

    query = query.trim().toLowerCase();
    const patients = window.store.getPatients();
    const appointments = window.store.getAppointments();

    if (!query) {
      // Show quick suggestions
      resultsContainer.innerHTML = `
        <div style="font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;margin-bottom:8px">Hızlı Erişim Önerileri</div>
        ${patients.slice(0, 3).map(p => `
          <div class="timeline-item" style="cursor:pointer;margin-bottom:6px" onclick="window.appCtrl.closeGlobalSearch(); window.appCtrl.navigateTo('patients'); window.patientsCtrl.openPatientDetail('${p.id}')">
            <div>
              <div style="font-weight:700;color:var(--text-main)">${p.name}</div>
              <div style="font-size:11.5px;color:var(--text-muted)">Hasta • Telefon: ${p.phone}</div>
            </div>
            <span class="status-badge" style="background:var(--primary-subtle);color:var(--primary)">Kartı Aç</span>
          </div>
        `).join('')}
      `;
      return;
    }

    const filteredPatients = patients.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.tc.includes(query)
    );

    const filteredAppts = appointments.filter(a =>
      a.patientName.toLowerCase().includes(query) ||
      a.procedure.toLowerCase().includes(query)
    );

    if (filteredPatients.length === 0 && filteredAppts.length === 0) {
      resultsContainer.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted)">"${query}" için sonuç bulunamadı.</div>`;
      return;
    }

    resultsContainer.innerHTML = `
      ${filteredPatients.map(p => `
        <div class="timeline-item" style="cursor:pointer;margin-bottom:6px" onclick="window.appCtrl.closeGlobalSearch(); window.appCtrl.navigateTo('patients'); window.patientsCtrl.openPatientDetail('${p.id}')">
          <div>
            <div style="font-weight:700;color:var(--text-main)">${p.name}</div>
            <div style="font-size:11.5px;color:var(--text-muted)">Hasta • ${p.phone} • Bakiye: ${p.balance} ₺</div>
          </div>
          <span class="status-badge" style="background:var(--primary-subtle);color:var(--primary)">Kartı İncele</span>
        </div>
      `).join('')}
      ${filteredAppts.map(a => `
        <div class="timeline-item" style="cursor:pointer;margin-bottom:6px" onclick="window.appCtrl.closeGlobalSearch(); window.appCtrl.navigateTo('calendar')">
          <div>
            <div style="font-weight:700;color:var(--text-main)">${a.patientName} (${a.time})</div>
            <div style="font-size:11.5px;color:var(--text-muted)">Randevu • ${a.procedure} • ${a.date}</div>
          </div>
          <span class="status-badge waiting">${a.status}</span>
        </div>
      `).join('')}
    `;
  }

  logout() {
    if (confirm("Oturumunuzu kapatmak istediğinize emin misiniz?")) {
      if (window.apiClient) window.apiClient.clearSession();
      localStorage.setItem('sh_logged_out', 'true');
      localStorage.removeItem('solo_hekim_app_data_v1');
      window.location.replace("login.html");
    }
  }

  resetDemoData() {
    if (confirm("Tüm değişiklikler sıfırlanıp Dr. Zeynep Aksoy muayenehanesinin başlangıç örnek verileri yüklenecektir. Onaylıyor musunuz?")) {
      window.store.resetDemoData();
      this.navigateTo(this.currentView);
      this.showToast("Örnek veriler başarıyla yüklendi.", "success");
    }
  }

  showToast(message, type = "primary") {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'whatsapp') toast.style.borderLeftColor = 'var(--whatsapp)';
    if (type === 'danger') toast.style.borderLeftColor = 'var(--danger)';

    toast.innerHTML = `
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appCtrl = new AppController();
  window.appCtrl.init();
});
