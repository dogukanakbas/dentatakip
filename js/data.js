/* ==========================================================================
   SOLO HEKİM PRO — Realistic Sample Practice Data & Storage Management
   ========================================================================== */

const STORAGE_KEY = 'solo_hekim_app_data_v1';

const INITIAL_DATA = {
  doctor: {
    name: "Dr. Zeynep Aksoy",
    title: "Diş Hekimi • Solo Muayenehane",
    phone: "+90 (532) 412 88 90",
    address: "Nişantaşı, Valikonağı Cad. No: 42 D: 5 Şişli / İstanbul",
    whatsappApiActive: true
  },
  patients: [
    {
      id: "P-101",
      name: "Selin Yılmaz",
      phone: "+90 532 841 22 10",
      tc: "31458920144",
      birthDate: "1991-04-14",
      bloodGroup: "A Rh+",
      notes: "Penisilin alerjisi var. Kanal tedavisi seansları devam ediyor.",
      totalCost: 18500,
      paidAmount: 12000,
      balance: 6500,
      lastVisit: "2026-07-10",
      status: "Tedavisi Devam Ediyor",
      history: [
        { id: "H-1", date: "2026-07-10", type: "Kanal Tedavisi (2. Seans)", tooth: "36", note: "Kök kanalları temizlendi ve geçici dolgu yerleştirildi. Ağrı şikayeti azaldı." },
        { id: "H-2", date: "2026-07-03", type: "İlk Muayene & Röntgen", tooth: "36", note: "Panoramik röntgen çekildi. Sol alt azı dişinde derin çürük tespit edildi." }
      ],
      files: [
        { id: "F-1", name: "Panoramik_Rontgen_Selin_Yilmaz.jpg", date: "2026-07-03", type: "Röntgen" },
        { id: "F-2", name: "Dis_46_Oncesi.jpg", date: "2026-07-10", type: "Fotoğraf" }
      ],
      installmentPlan: {
        total: 18500,
        installments: [
          { no: 1, dueDate: "2026-07-03", amount: 6000, status: "Ödendi" },
          { no: 2, dueDate: "2026-07-10", amount: 6000, status: "Ödendi" },
          { no: 3, dueDate: "2026-07-25", amount: 6500, status: "Bekliyor" }
        ]
      }
    },
    {
      id: "P-102",
      name: "Ahmet Erdem",
      phone: "+90 533 912 45 88",
      tc: "12847593022",
      birthDate: "1984-11-20",
      bloodGroup: "0 Rh+",
      notes: "İmplant cerrahisi planlandı. Düzenli diş taşı temizliği yaptırıyor.",
      totalCost: 45000,
      paidAmount: 45000,
      balance: 0,
      lastVisit: "2026-07-09",
      status: "Tedavisi Tamamlandı",
      history: [
        { id: "H-3", date: "2026-07-09", type: "Zirkonyum Kuron Takişi", tooth: "14, 15", note: "Ölçüye uygun zirkonyum kaplamalar simante edildi. Kapanış kontrolü kusursuz." }
      ],
      files: [
        { id: "F-3", name: "Implant_3D_Tomografi.jpg", date: "2026-06-15", type: "Tomografi" }
      ],
      installmentPlan: null
    },
    {
      id: "P-103",
      name: "Merve Kaya",
      phone: "+90 542 678 11 04",
      tc: "49201837466",
      birthDate: "1995-08-03",
      bloodGroup: "B Rh+",
      notes: "Diş beyazlatma (bleaching) randevusu. Diş eti hassasiyeti mevcut.",
      totalCost: 7500,
      paidAmount: 2500,
      balance: 5000,
      lastVisit: "2026-07-08",
      status: "Ödeme Bekliyor",
      history: [
        { id: "H-4", date: "2026-07-08", type: "Detertraj & Polisaj", tooth: "Tümü", note: "Diş taşı temizliği yapıldı. Beyazlatma için diş eti bariyeri uygulandı." }
      ],
      files: [],
      installmentPlan: null
    },
    {
      id: "P-104",
      name: "Caner Şahin",
      phone: "+90 505 319 88 77",
      tc: "58291038472",
      birthDate: "1988-02-19",
      bloodGroup: "AB Rh-",
      notes: "Yirmilik diş çekimi (Gömülü). Dikiş alımı yapılacak.",
      totalCost: 6000,
      paidAmount: 3000,
      balance: 3000,
      lastVisit: "2026-07-05",
      status: "Kontrol Bekliyor",
      history: [
        { id: "H-5", date: "2026-07-05", type: "Gömülü 20'lik Çekimi", tooth: "38", note: "Lokal anestezi altında cerrahi çekim yapıldı. 3 adet ipek dikiş atıldı." }
      ],
      files: [],
      installmentPlan: null
    },
    {
      id: "P-105",
      name: "Elif Demirtaş",
      phone: "+90 530 455 19 23",
      tc: "20194857362",
      birthDate: "2001-09-12",
      bloodGroup: "A Rh-",
      notes: "Ortodontik şeffaf plak kontrolü (İnvisalign 4. Plak).",
      totalCost: 52000,
      paidAmount: 36000,
      balance: 16000,
      lastVisit: "2026-07-11",
      status: "Tedavisi Devam Ediyor",
      history: [
        { id: "H-6", date: "2026-07-11", type: "Şeffaf Plak Teslimi", tooth: "Tümü", note: "4. set plaklar teslim edildi. IPR (ara yüz aşındırma) işlemi 0.2mm uygulandı." }
      ],
      files: [],
      installmentPlan: {
        total: 52000,
        installments: [
          { no: 1, dueDate: "2026-05-15", amount: 18000, status: "Ödendi" },
          { no: 2, dueDate: "2026-06-15", amount: 18000, status: "Ödendi" },
          { no: 3, dueDate: "2026-07-15", amount: 16000, status: "Bekliyor" }
        ]
      }
    }
  ],
  appointments: [
    {
      id: "A-201",
      patientId: "P-101",
      patientName: "Selin Yılmaz",
      phone: "+90 532 841 22 10",
      date: "2026-07-11",
      time: "09:30",
      durationMinutes: 45,
      procedure: "Kanal Tedavisi (Daimi Dolgu)",
      status: "Geldi",
      notes: "Kök kanalı dolduruldu."
    },
    {
      id: "A-202",
      patientId: "P-103",
      patientName: "Merve Kaya",
      phone: "+90 542 678 11 04",
      date: "2026-07-11",
      time: "11:00",
      durationMinutes: 60,
      procedure: "Office Bleaching (Lazer Beyazlatma)",
      status: "Geldi",
      notes: "2 seans lazer uygulandı."
    },
    {
      id: "A-203",
      patientId: "P-104",
      patientName: "Caner Şahin",
      phone: "+90 505 319 88 77",
      date: "2026-07-11",
      time: "14:00",
      durationMinutes: 30,
      procedure: "Cerrahi Dikiş Alımı & Kontrol",
      status: "Bekliyor",
      notes: "Yara yeri iyileşmesi kontrol edilecek."
    },
    {
      id: "A-204",
      patientId: "P-105",
      patientName: "Elif Demirtaş",
      phone: "+90 530 455 19 23",
      date: "2026-07-11",
      time: "16:00",
      durationMinutes: 45,
      procedure: "Şeffaf Plak Kontrolü",
      status: "Bekliyor",
      notes: "5. set plaklar denenecek."
    },
    {
      id: "A-205",
      patientId: "P-102",
      patientName: "Ahmet Erdem",
      phone: "+90 533 912 45 88",
      date: "2026-07-12",
      time: "10:30",
      durationMinutes: 45,
      procedure: "İmplant Üstü Protez Rutin Kontrol",
      status: "Bekliyor",
      notes: "6 aylık kontrol randevusu."
    }
  ],
  payments: [
    {
      id: "PAY-301",
      patientId: "P-101",
      patientName: "Selin Yılmaz",
      amount: 6000,
      method: "Kredi Kartı",
      date: "2026-07-10",
      note: "Kanal tedavisi 2. taksit ödemesi"
    },
    {
      id: "PAY-302",
      patientId: "P-102",
      patientName: "Ahmet Erdem",
      amount: 25000,
      method: "EFT / Havale",
      date: "2026-07-09",
      note: "Zirkonyum protez kapanış ödemesi"
    },
    {
      id: "PAY-303",
      patientId: "P-103",
      patientName: "Merve Kaya",
      amount: 2500,
      method: "Nakit",
      date: "2026-07-08",
      note: "Diş taşı temizliği ön ödeme"
    },
    {
      id: "PAY-304",
      patientId: "P-104",
      patientName: "Caner Şahin",
      amount: 3000,
      method: "Kredi Kartı",
      date: "2026-07-05",
      note: "Gömülü yirmilik cerrahi işlem"
    }
  ],
  whatsappLog: [
    {
      id: "WA-401",
      patientName: "Selin Yılmaz",
      phone: "+90 532 841 22 10",
      type: "Randevu Hatırlatma (24 saat)",
      sentAt: "2026-07-10 09:30",
      status: "Onaylandı",
      message: "Sayın Selin Yılmaz, yarın saat 09:30'da Dr. Zeynep Aksoy Diş Muayenehanesindeki randevunuzu hatırlatırız. Onaylamak için: [ONAYLA]"
    },
    {
      id: "WA-402",
      patientName: "Caner Şahin",
      phone: "+90 505 319 88 77",
      type: "Randevu Hatırlatma (24 saat)",
      sentAt: "2026-07-10 14:00",
      status: "Onaylandı",
      message: "Sayın Caner Şahin, yarın saat 14:00'te dikiş alımı randevunuz bulunmaktadır. Sağlıklı günler dileriz."
    },
    {
      id: "WA-403",
      patientName: "Merve Kaya",
      phone: "+90 542 678 11 04",
      type: "Nazik Ödeme Hatırlatması",
      sentAt: "2026-07-09 11:15",
      status: "İletildi",
      message: "Sayın Merve Kaya, tedavinizle ilgili kalan 5.000 TL bakiye kaydınız bulunmaktadır. Sorularınız için bize WhatsApp'tan ulaşabilirsiniz."
    }
  ],
  consents: [
    {
      id: "C-101",
      patientId: "P-101",
      patientName: "Selin Yılmaz",
      template: "İmplant Tedavisi Bilgilendirilmiş Onam Formu",
      tooth: "36",
      date: "2026-07-10",
      status: "İmzalandı",
      method: "QR Kod (Telefon)",
      signerIp: "192.168.1.44"
    },
    {
      id: "C-102",
      patientId: "P-102",
      patientName: "Ahmet Erdem",
      template: "Sabit Zirkonyum / Porselen Protez Onam Formu",
      tooth: "14, 15",
      date: "2026-07-09",
      status: "İmzalandı",
      method: "Ekran İmzası (Tablet)"
    }
  ],
  labOrders: [
    {
      id: "L-301",
      patientId: "P-102",
      patientName: "Ahmet Erdem",
      tooth: "14, 15",
      type: "Monolitik Zirkonyum Kron",
      color: "A1",
      labName: "Apex Dental Lab",
      orderDate: "2026-07-06",
      dueDate: "2026-07-13",
      cost: 4200,
      status: "Provada",
      notes: "Kenar uyumu ve oklüzyon kontrol edilecek."
    },
    {
      id: "L-302",
      patientId: "P-101",
      patientName: "Selin Yılmaz",
      tooth: "36",
      type: "İmplant Üstü Zirkonyum",
      color: "A2",
      labName: "Nova Protez Laboratuvarı",
      orderDate: "2026-07-10",
      dueDate: "2026-07-17",
      cost: 3500,
      status: "Hazırlanıyor",
      notes: "Titanyum abutment üzerine zirkonyum kron."
    }
  ],
  inventory: [
    {
      id: "INV-1",
      name: "3M Filtek Z250 Kompozit A2",
      category: "Dolgu & Restoratif",
      unit: "Şırınga",
      qty: 8,
      minQty: 3,
      skt: "2027-10-15",
      status: "Yeterli"
    },
    {
      id: "INV-2",
      name: "Ultracain D-S Forte Anestezi",
      category: "Lokal Anestezi",
      unit: "Kutu",
      qty: 2,
      minQty: 3,
      skt: "2026-08-30",
      status: "Kritik Stok"
    },
    {
      id: "INV-3",
      name: "Straumann BLX İmplant 4.0x10mm",
      category: "İmplant & Cerrahi",
      unit: "Adet",
      qty: 4,
      minQty: 2,
      skt: "2028-05-01",
      status: "Yeterli"
    },
    {
      id: "INV-4",
      name: "Steril Nitril Muayene Eldiveni (M)",
      category: "Sarf & Hijyen",
      unit: "Kutu",
      qty: 1,
      minQty: 4,
      skt: "2027-12-31",
      status: "Kritik Stok"
    }
  ]
};

class PracticeStore {
  constructor() {
    this.data = this.load();
    this.data.consents = this.data.consents || [];
    this.data.labOrders = this.data.labOrders || [];
    this.data.inventory = this.data.inventory || [];
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
        inventory: []
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

      this.data.patients = Array.isArray(patients) ? patients : [];
      this.data.appointments = Array.isArray(appointments) ? appointments : [];
      this.data.payments = Array.isArray(payments) ? payments : [];

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

  checkConflict(date, time) {
    // Check if another appointment exists at exact same date & time slot
    return this.data.appointments.find(a => a.date === date && a.time === time && a.status !== "İptal");
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
