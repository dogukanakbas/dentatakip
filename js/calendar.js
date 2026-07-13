/* ==========================================================================
   SOLO HEKİM PRO — Interactive Calendar & Conflict Detection Controller
   ========================================================================== */

class CalendarController {
  constructor() {
    this.currentDate = new Date().toISOString().split('T')[0];
    this.viewMode = "day"; // 'day' or 'week'
  }

  render() {
    this.updateButtons();
    this.renderHeader();
    this.renderGrid();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.render();
  }

  updateButtons() {
    ['day', 'week', 'month'].forEach(mode => {
      const btn = document.getElementById(`cal-btn-${mode}`);
      if (!btn) return;
      if (mode === this.viewMode) {
        btn.style.background = 'var(--primary)';
        btn.style.color = '#fff';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-main)';
      }
    });
  }

  navigate(step) {
    const d = new Date(this.currentDate);
    if (this.viewMode === 'day') {
      d.setDate(d.getDate() + step);
    } else if (this.viewMode === 'week') {
      d.setDate(d.getDate() + (step * 7));
    } else if (this.viewMode === 'month') {
      d.setMonth(d.getMonth() + step);
    }
    this.currentDate = d.toISOString().split('T')[0];
    this.render();
  }

  goToday() {
    this.currentDate = new Date().toISOString().split('T')[0];
    this.render();
  }

  renderHeader() {
    const el = document.getElementById('calendar-date-display');
    if (!el) return;
    try {
      const dateObj = new Date(this.currentDate);
      if (this.viewMode === 'day') {
        const formatted = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'full' }).format(dateObj);
        el.innerText = `${formatted} (Günlük Program)`;
      } else if (this.viewMode === 'week') {
        el.innerText = `Haftalık Takvim • Seçili Hafta Başlangıcı: ${this.currentDate}`;
      } else {
        const monthFormatted = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(dateObj);
        el.innerText = `${monthFormatted} (Aylık Takvim Izgarası)`;
      }
    } catch (e) {
      el.innerText = `${this.currentDate} • Canlı Muayenehane Programı`;
    }
  }

  renderGrid() {
    const container = document.getElementById('calendar-grid-container');
    if (!container) return;

    const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:30", "14:30", "15:30", "16:30", "17:30"];
    const appts = window.store.getAppointments();

    if (this.viewMode === 'month') {
      this.renderMonthGrid(container, appts);
      return;
    }
    if (this.viewMode === 'week') {
      this.renderWeekGrid(container, appts, timeSlots);
      return;
    }
    this.renderDayGrid(container, appts, timeSlots);
  }

  renderDayGrid(container, appts, timeSlots) {
    let html = `
      <div class="calendar-grid" style="grid-template-columns: 85px 1fr">
        <div class="cal-time-col">
          ${timeSlots.map(t => `<div class="time-slot-label">${t}</div>`).join('')}
        </div>
        <div class="cal-day-col">
    `;

    timeSlots.forEach(slot => {
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

  renderWeekGrid(container, appts, timeSlots) {
    const curr = new Date(this.currentDate);
    const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({ iso, label: `${dayNames[i]} (${d.getDate()}/${d.getMonth()+1})` });
    }

    let html = `
      <div style="display:grid;grid-template-columns:70px repeat(7, 1fr);border:1px solid var(--border-color);border-radius:12px;overflow:hidden;background:var(--bg-main)">
        <div style="background:var(--bg-light);border-bottom:1px solid var(--border-color);padding:10px;font-weight:700;font-size:12px;color:var(--text-muted)">SAAT</div>
        ${days.map(d => `<div style="background:var(--bg-light);border-bottom:1px solid var(--border-color);border-left:1px solid var(--border-color);padding:10px;text-align:center;font-weight:700;font-size:13px;color:var(--text-main)">${d.label}</div>`).join('')}
    `;

    timeSlots.forEach(slot => {
      html += `<div style="padding:10px 6px;font-size:12px;font-weight:600;color:var(--text-muted);border-bottom:1px solid var(--border-color)">${slot}</div>`;
      days.forEach(d => {
        const matchingAppt = appts.find(a => a.date === d.iso && a.time.startsWith(slot.slice(0, 2)));
        html += `
          <div style="min-height:54px;border-bottom:1px solid var(--border-color);border-left:1px solid var(--border-color);padding:4px;cursor:pointer;position:relative" onclick="window.calendarCtrl.handleSlotClick('${d.iso}', '${slot}', '${matchingAppt?.id || ''}')">
            ${matchingAppt ? `
              <div class="cal-event ${matchingAppt.status === 'Geldi' ? 'completed' : matchingAppt.status === 'Gelmedi' ? 'noshow' : 'waiting'}" style="font-size:11px;padding:4px 6px;border-radius:6px" onclick="event.stopPropagation(); window.calendarCtrl.openApptModal('${matchingAppt.id}')">
                <div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${matchingAppt.time} ${matchingAppt.patientName}</div>
                <div style="font-size:10px;opacity:0.85">${matchingAppt.procedure}</div>
              </div>
            ` : ''}
          </div>
        `;
      });
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  renderMonthGrid(container, appts) {
    const curr = new Date(this.currentDate);
    const year = curr.getFullYear();
    const month = curr.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDay.getDate();

    const dayHeaders = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
    let html = `
      <div style="display:grid;grid-template-columns:repeat(7, 1fr);border:1px solid var(--border-color);border-radius:12px;overflow:hidden;background:var(--bg-main)">
        ${dayHeaders.map(h => `<div style="background:var(--bg-light);border-bottom:1px solid var(--border-color);padding:12px;text-align:center;font-weight:700;font-size:13px;color:var(--text-muted)">${h}</div>`).join('')}
    `;

    // Empty cells before the 1st of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      html += `<div style="min-height:115px;background:var(--bg-light);border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color);opacity:0.4"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAppts = appts.filter(a => a.date === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      html += `
        <div style="min-height:115px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color);padding:8px;display:flex;flex-direction:column;gap:4px;cursor:pointer;background:${isToday ? 'rgba(37,99,235,0.04)' : 'transparent'}" onclick="window.calendarCtrl.openNewApptModal('${dateStr}', '10:00')">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-weight:800;font-size:13px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;${isToday ? 'background:var(--primary);color:#fff' : 'color:var(--text-main)'}">${day}</span>
            ${dayAppts.length > 0 ? `<span style="font-size:11px;font-weight:700;color:var(--primary)">${dayAppts.length} Randevu</span>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;overflow-y:auto;max-height:85px">
            ${dayAppts.map(a => `
              <div class="cal-event ${a.status === 'Geldi' ? 'completed' : a.status === 'Gelmedi' ? 'noshow' : 'waiting'}" style="padding:4px 6px;border-radius:6px;font-size:11px;display:flex;align-items:center;justify-content:space-between" onclick="event.stopPropagation(); window.calendarCtrl.openApptModal('${a.id}')">
                <span style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.time} ${a.patientName}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    html += `</div>`;
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
