/* ==========================================================================
   SOLO HEKİM PRO — Interactive Calendar & Conflict Detection Controller
   ========================================================================== */

class CalendarController {
  constructor() {
    this.currentDate = new Date().toISOString().split('T')[0];
    this.viewMode = "day"; // 'day' or 'week'
  }

  render() {
    this.renderHeader();
    this.renderGrid();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.render();
  }

  renderHeader() {
    const el = document.getElementById('calendar-date-display');
    if (el) {
      try {
        const dateObj = new Date(this.currentDate);
        const formatted = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'full' }).format(dateObj);
        el.innerText = `${formatted} (Tek Koltuk • Canlı Muayenehane Programı)`;
      } catch (e) {
        el.innerText = `${this.currentDate} • Canlı Muayenehane Programı`;
      }
    }
  }

  renderGrid() {
    const container = document.getElementById('calendar-grid-container');
    if (!container) return;

    const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:30", "14:30", "15:30", "16:30", "17:30"];
    const appts = window.store.getAppointments();

    let html = `
      <div class="calendar-grid" style="grid-template-columns: 85px 1fr">
        <div class="cal-time-col">
          ${timeSlots.map(t => `<div class="time-slot-label">${t}</div>`).join('')}
        </div>
        <div class="cal-day-col">
    `;

    timeSlots.forEach(slot => {
      // Find appointment at this time slot for currentDate
      const matchingAppt = appts.find(a => a.date === this.currentDate && a.time.startsWith(slot.slice(0, 2)));

      html += `
        <div class="day-slot" onclick="window.calendarCtrl.handleSlotClick('${this.currentDate}', '${slot}', '${matchingAppt?.id || ''}')">
          ${matchingAppt ? `
            <div class="cal-event ${matchingAppt.status === 'Geldi' ? 'completed' : matchingAppt.status === 'Gelmedi' ? 'noshow' : 'waiting'}" onclick="event.stopPropagation(); window.calendarCtrl.openApptModal('${matchingAppt.id}')">
              <div style="font-weight:700">${matchingAppt.time} - ${matchingAppt.patientName}</div>
              <div style="font-size:11px;opacity:0.9">${matchingAppt.procedure} • [${matchingAppt.status}]</div>
            </div>
          ` : `
            <div style="opacity:0;font-size:11px;color:var(--text-light);padding:8px;transition:0.2s" class="hover-add-hint">+ Boş Saat • Randevu Ekle</div>
          `}
        </div>
      `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
  }

  handleSlotClick(date, time, existingId) {
    if (existingId) {
      this.openApptModal(existingId);
    } else {
      this.openNewApptModal(date, time);
    }
  }

  openNewApptModal(date, time) {
    document.getElementById('na-date').value = date;
    document.getElementById('na-time').value = time;
    document.getElementById('new-appt-modal')?.classList.add('active');
  }

  closeNewApptModal() {
    document.getElementById('new-appt-modal')?.classList.remove('active');
  }

  submitNewAppointment(e) {
    e.preventDefault();
    const patientName = document.getElementById('na-patient').value;
    const phone = document.getElementById('na-phone').value;
    const date = document.getElementById('na-date').value;
    const time = document.getElementById('na-time').value;
    const procedure = document.getElementById('na-procedure').value;

    // CONFLICT DETECTION REQUIREMENT (Section 6.2 P0: Çakışma Uyarısı)
    const conflict = window.store.checkConflict(date, time);
    if (conflict) {
      const proceed = confirm(`⚠️ ÇAKIŞMA UYARISI!\nBu saat aralığında (${date} saat ${time}) zaten "${conflict.patientName}" hastasının "${conflict.procedure}" randevusu bulunmaktadır.\n\nYine de aynı saate ikinci randevuyu kaydetmek istiyor musunuz?`);
      if (!proceed) return;
    }

    window.store.addAppointment({
      patientName,
      phone,
      date,
      time,
      durationMinutes: 45,
      procedure,
      status: "Bekliyor",
      notes: ""
    });

    // Auto send WhatsApp appointment confirmation link (Section 6.4)
    window.store.addWhatsAppMessage(
      patientName,
      phone,
      "Randevu Onay Linki (Otomatik)",
      `Sayın ${patientName}, ${date} saat ${time}'deki randevunuz oluşturuldu. Onaylamak için: [ONAYLA]`
    );

    this.closeNewApptModal();
    this.render();
    window.appCtrl?.showToast(`${patientName} için randevu oluşturuldu ve WhatsApp onay mesajı iletildi!`, "success");
  }

  openApptModal(id) {
    const appt = window.store.getAppointments().find(a => a.id === id);
    if (!appt) return;
    this.selectedApptId = id;

    const modal = document.getElementById("appt-action-modal");
    const infoBox = document.getElementById("appt-action-info");
    if (infoBox) {
      infoBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong style="font-size:17px;color:var(--text-main)">${appt.patientName}</strong>
          <span class="status-badge ${appt.status === 'Geldi' ? 'completed' : appt.status === 'Bekliyor' ? 'pending' : 'cancelled'}">${appt.status}</span>
        </div>
        <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:4px">📅 <strong>Saat:</strong> ${appt.time}</div>
        <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:4px">🦷 <strong>Tedavi / İşlem:</strong> ${appt.procedure}</div>
        ${appt.phone ? `<div style="font-size:13.5px;color:var(--text-muted)">📱 <strong>Telefon:</strong> ${appt.phone}</div>` : ''}
      `;
    }
    if (modal) modal.classList.add("active");
  }

  closeApptModal() {
    const modal = document.getElementById("appt-action-modal");
    if (modal) modal.classList.remove("active");
    this.selectedApptId = null;
  }

  handleApptStatus(status) {
    if (!this.selectedApptId) return;
    const appt = window.store.getAppointments().find(a => a.id === this.selectedApptId);
    if (!appt) return;

    window.store.updateAppointmentStatus(this.selectedApptId, status);
    this.closeApptModal();
    this.render();

    const toastClass = status === "Geldi" ? "success" : status === "Gelmedi" ? "danger" : status === "İptal" ? "secondary" : "info";
    window.appCtrl?.showToast(`${appt.patientName} randevusu "${status}" olarak güncellendi.`, toastClass);
  }

  handleApptWhatsApp() {
    if (!this.selectedApptId) return;
    const appt = window.store.getAppointments().find(a => a.id === this.selectedApptId);
    if (!appt) return;

    this.closeApptModal();
    window.dashboardCtrl.sendQuickWhatsApp(appt.patientName, appt.phone, appt.time);
  }
}

window.calendarCtrl = new CalendarController();
