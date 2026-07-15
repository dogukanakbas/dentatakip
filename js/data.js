/* ==========================================================================
   SOLO HEKİM PRO — Realistic Sample Practice Data & Storage Management
   ========================================================================== */

const STORAGE_KEY = 'dentatakip_app_data_v2';

const INITIAL_DATA = {
  doctor: {
    name: "Dr. DentaTakip Hekimi",
    title: "Diş Hekimi • Solo Muayenehane",
    phone: "",
    address: "Muayenehane Adresi • Türkiye",
    whatsappApiActive: false
  },
  patients: [],
  appointments: [],
  payments: [],
  whatsappLog: [],
  consents: [],
  labOrders: [],
  inventory: [],
  team: []
};

class PracticeStore {
  constructor() {
    this.data = this.load();
    this.data.consents = this.data.consents || [];
    this.data.labOrders = this.data.labOrders || [];
    this.data.inventory = this.data.inventory || [];
    this.data.team = this.data.team || [];
    this.syncWithServer();
  }

  load() {
    const authUser = window.apiClient?.getUser();
    const authPractice = window.apiClient?.getPractice();
    const isLoggedIn = Boolean(window.apiClient?.getToken());

    // Oturum açılmışsa kesinlikle KENDİ SQL veritabanı boş/dolu verisini kullan, eski demo verisini kullanma!
    if (isLoggedIn) {
      const hasWaToken = Boolean(localStorage.getItem('sh_wa_token') && localStorage.getItem('sh_wa_phone_id'));
      return {
        doctor: {
          name: authUser?.full_name || authPractice?.doctor_name || "Diş Hekimi",
          title: authPractice?.name || "Solo Muayenehane",
          phone: authPractice?.phone || "",
          address: authPractice?.address || "Türkiye • Solo Muayenehane",
          whatsappApiActive: hasWaToken
        },
        patients: [],
        appointments: [],
        payments: [],
        whatsappLog: [],
        consents: [],
        labOrders: [],
        inventory: [],
        team: []
      };
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Data parse error", e);
      }
    }

    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  async syncWithServer() {
    if (!window.apiClient || !window.apiClient.getToken()) return;

    try {
      // Önce canlı veritabanından oturum sahibinin güncel profilini çek
      const meRes = await window.apiClient.getMe();
      if (meRes && meRes.ok && meRes.data) {
        window.apiClient.setSession(window.apiClient.getToken(), meRes.data.user, meRes.data.practice);
      }

      const patients = await window.apiClient.getPatients();
      const appointments = await window.apiClient.getAppointments();
      const payments = await window.apiClient.getPayments();
      const team = await window.apiClient.getTeam();
      const labJobs = await window.apiClient.getLabJobs();

      this.data.patients = Array.isArray(patients) ? patients : [];
      this.data.appointments = Array.isArray(appointments) ? appointments : [];
      this.data.payments = Array.isArray(payments) ? payments : [];
      this.data.team = Array.isArray(team) ? team : [];
      this.data.labOrders = Array.isArray(labJobs) ? labJobs : [];

      const authUser = window.apiClient.getUser();
      const authPractice = window.apiClient.getPractice();
      const hasWaToken = Boolean(localStorage.getItem('sh_wa_token') && localStorage.getItem('sh_wa_phone_id'));
      this.data.doctor = {
        name: authUser?.full_name || authPractice?.doctor_name || "Diş Hekimi",
        title: authPractice?.name || "Solo Muayenehane",
        phone: authPractice?.phone || "",
        address: authPractice?.address || "Türkiye • Solo Muayenehane",
        whatsappApiActive: hasWaToken
      };

      this.save();

      if (window.appCtrl && typeof window.appCtrl.renderHeaderDoctorInfo === 'function') {
        window.appCtrl.renderHeaderDoctorInfo();
      }
      if (window.dashboardCtrl) window.dashboardCtrl.render();
      if (window.patientsCtrl) window.patientsCtrl.render();
      if (window.calendarCtrl) window.calendarCtrl.render();
      if (window.paymentsCtrl) window.paymentsCtrl.render();
    } catch (e) {
      console.warn("Sunucu senkronizasyon uyarısı:", e);
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  resetDemoData() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
    return this.data;
  }

  /* Patient Methods */
  getPatients() {
    return this.data.patients;
  }

  getPatientById(id) {
    return this.data.patients.find(p => p.id === id);
  }

  addPatient(patient) {
    patient.id = `P-${Date.now().toString().slice(-4)}`;
    patient.history = patient.history || [];
    patient.files = patient.files || [];
    patient.paidAmount = patient.paidAmount || 0;
    patient.totalCost = patient.totalCost || 0;
    patient.balance = patient.totalCost - patient.paidAmount;
    this.data.patients.unshift(patient);
    this.save();
    if (window.apiClient && window.apiClient.getToken()) {
      window.apiClient.createPatient(patient).catch(e => console.error("Server save err:", e));
    }
    return patient;
  }

  updatePatient(id, updates) {
    const index = this.data.patients.findIndex(p => p.id === id);
    if (index > -1) {
      this.data.patients[index] = { ...this.data.patients[index], ...updates };
      this.save();
    }
  }

  addTreatmentNote(patientId, noteObj) {
    const p = this.getPatientById(patientId);
    if (p) {
      p.history.unshift({
        id: `H-${Date.now().toString().slice(-4)}`,
        date: noteObj.date || new Date().toISOString().split('T')[0],
        type: noteObj.type,
        tooth: noteObj.tooth || "-",
        note: noteObj.note
      });
      p.lastVisit = noteObj.date || new Date().toISOString().split('T')[0];
      this.save();
    }
  }

  /* Appointment Methods & Conflict Detection (P0 requirement) */
  getAppointments() {
    return this.data.appointments;
  }

  checkConflict(date, time, doctorId) {
    // Check if another appointment exists at exact same date & time slot for the same doctor
    return this.data.appointments.find(a => {
      if (a.date !== date || a.time !== time || a.status === "İptal") return false;
      if (doctorId && a.doctor_id && a.doctor_id !== doctorId) return false;
      return true;
    });
  }

  addAppointment(appointment) {
    appointment.id = `A-${Date.now().toString().slice(-4)}`;
    appointment.status = appointment.status || "Bekliyor";
    this.data.appointments.push(appointment);
    this.save();
    if (window.apiClient && window.apiClient.getToken()) {
      window.apiClient.createAppointment(appointment).catch(e => console.error("Server appt save err:", e));
    }
    return appointment;
  }

  updateAppointmentStatus(id, newStatus) {
    const appt = this.data.appointments.find(a => a.id === id);
    if (appt) {
      appt.status = newStatus;
      this.save();
      if (window.apiClient && window.apiClient.getToken()) {
        window.apiClient.updateAppointmentStatus(id, newStatus).catch(e => console.error("Server appt update err:", e));
      }
    }
  }

  /* Payment & Ledger Methods */
  getPayments() {
    return this.data.payments;
  }

  addPayment(payment) {
    payment.id = `PAY-${Date.now().toString().slice(-4)}`;
    payment.date = payment.date || new Date().toISOString().split('T')[0];
    this.data.payments.unshift(payment);

    // Update patient balance
    const patient = this.getPatientById(payment.patientId);
    if (patient) {
      patient.paidAmount = (patient.paidAmount || 0) + Number(payment.amount);
      patient.balance = Math.max(0, patient.totalCost - patient.paidAmount);
    }

    this.save();
    if (window.apiClient && window.apiClient.getToken()) {
      window.apiClient.createPayment(payment).catch(e => console.error("Server payment save err:", e));
    }
    return payment;
  }

  /* WhatsApp Log & Automation */
  getWhatsAppLogs() {
    return this.data.whatsappLog;
  }

  addWhatsAppMessage(patientName, phone, type, messageText, status = "İletildi") {
    const entry = {
      id: `WA-${Date.now().toString().slice(-4)}`,
      patientName,
      phone,
      type,
      sentAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      status,
      message: messageText
    };
    this.data.whatsappLog.unshift(entry);
    this.save();
    return entry;
  }

  /* Consent Methods */
  getConsents() {
    return this.data.consents || [];
  }

  addConsent(consent) {
    consent.id = `C-${Date.now().toString().slice(-4)}`;
    this.data.consents = this.data.consents || [];
    this.data.consents.unshift(consent);
    this.save();
    return consent;
  }

  updateConsent(id, updates) {
    const item = (this.data.consents || []).find(c => c.id === id);
    if (item) {
      Object.assign(item, updates);
      this.save();
    }
    return item;
  }

  /* Lab Order Methods */
  getLabOrders() {
    return this.data.labOrders || [];
  }

  addLabOrder(order) {
    order.id = `L-${Date.now().toString().slice(-4)}`;
    this.data.labOrders = this.data.labOrders || [];
    this.data.labOrders.unshift(order);
    this.save();
    return order;
  }

  updateLabOrder(id, updates) {
    const item = (this.data.labOrders || []).find(l => l.id === id);
    if (item) {
      Object.assign(item, updates);
      this.save();
    }
    return item;
  }

  deleteLabOrder(id) {
    this.data.labOrders = (this.data.labOrders || []).filter(l => l.id !== id);
    this.save();
  }

  /* Inventory Methods */
  getInventory() {
    return this.data.inventory || [];
  }

  addInventoryItem(item) {
    item.id = `INV-${Date.now().toString().slice(-4)}`;
    this.data.inventory = this.data.inventory || [];
    this.data.inventory.unshift(item);
    this.save();
    return item;
  }

  updateInventoryItem(id, updates) {
    const item = (this.data.inventory || []).find(i => i.id === id);
    if (item) {
      Object.assign(item, updates);
      this.save();
    }
    return item;
  }

  deleteInventoryItem(id) {
    this.data.inventory = (this.data.inventory || []).filter(i => i.id !== id);
    this.save();
  }
}

window.store = new PracticeStore();
