/* ==========================================================================
   SOLO HEKİM PRO — Interactive Calendar & Conflict Detection Controller
   ========================================================================== */

class CalendarController {
  constructor() {
    this.currentDate = new Date().toISOString().split('T')[0];
    this.viewMode = "day"; // 'day' or 'week'
    this.selectedDoctorFilter = "";
    this.selectedDoctorName = null;
  }

  render() {
    this.updateButtons();
    this.renderHeader();
    this.updateDoctorFilterDropdown();
    this.renderGrid();
  }

  updateDoctorFilterDropdown() {
    const filterEl = document.getElementById('cal-doctor-filter');
    if (!filterEl) return;
    const team = window.store?.data?.team || [];
    const doctors = team.filter(m => m.role === 'owner' || m.role === 'doctor');
    const currentVal = this.selectedDoctorFilter || "";

    let optionsHtml = `<option value="">👨‍⚕️ Tüm Hekimler (Genel Takvim)</option>`;
    if (doctors.length > 0) {
      optionsHtml += doctors.map(d => `<option value="${d.id}" ${d.id === currentVal ? 'selected' : ''}>🩺 ${d.full_name} (${d.title || 'Hekim'})</option>`).join('');
    }
    if (filterEl.innerHTML !== optionsHtml) {
      filterEl.innerHTML = optionsHtml;
      filterEl.value = currentVal;
    }
  }

  filterByDoctor(doctorId) {
    this.selectedDoctorFilter = doctorId;
    const team = window.store?.data?.team || [];
    const docObj = team.find(m => m.id === doctorId);
    this.selectedDoctorName = docObj ? docObj.full_name : null;
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
    let appts = window.store.getAppointments() || [];
    if (this.selectedDoctorFilter) {
      appts = appts.filter(a => a.doctor_id === this.selectedDoctorFilter || a.doctor_name === this.selectedDoctorName);
    }

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
              ${matchingAppt.doctor_name ? `<div style="font-size:10px;color:var(--primary-color);margin-top:2px;font-weight:700">🩺 ${matchingAppt.doctor_name}</div>` : ''}
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
              <div class="cal-event ${matchingAppt.status === 'Geldi' ? 'completed' : matchingAppt.status === 'Gelmedi' ? 'noshow' : 'waiting'}" style="position:relative;left:0;right:0;margin-bottom:4px;font-size:11px;padding:4px 6px;border-radius:6px" onclick="event.stopPropagation(); window.calendarCtrl.openApptModal('${matchingAppt.id}')">
                <div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${matchingAppt.time} ${matchingAppt.patientName}</div>
                <div style="font-size:10px;opacity:0.85">${matchingAppt.procedure}</div>
                ${matchingAppt.doctor_name ? `<div style="font-size:9.5px;color:var(--primary-color);font-weight:700">🩺 ${matchingAppt.doctor_name}</div>` : ''}
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
              <div class="cal-event ${a.status === 'Geldi' ? 'completed' : a.status === 'Gelmedi' ? 'noshow' : 'waiting'}" style="position:relative;left:0;right:0;padding:4px 6px;border-radius:6px;font-size:11px;display:flex;flex-direction:column" onclick="event.stopPropagation(); window.calendarCtrl.openApptModal('${a.id}')">
                <span style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.time} ${a.patientName}</span>
                ${a.doctor_name ? `<span style="font-size:9.5px;opacity:0.9">🩺 ${a.doctor_name}</span>` : ''}
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
    const docSelect = document.getElementById('na-doctor');
    if (docSelect) {
      const team = window.store?.data?.team || [];
      const user = window.apiClient?.getUser();
      const doctors = team.filter(m => m.role === 'owner' || m.role === 'doctor');
      const selectedId = this.selectedDoctorFilter || user?.id || '';
      if (doctors.length > 0) {
        docSelect.innerHTML = doctors.map(d => `<option value="${d.id}" ${d.id === selectedId ? 'selected' : ''}>${d.full_name} (${d.title || 'Diş Hekimi'})</option>`).join('');
      } else {
        docSelect.innerHTML = `<option value="">${user?.full_name || 'Solo Muayenehane Hekimi'}</option>`;
      }
    }
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
    const doctorId = document.getElementById('na-doctor')?.value || '';
    const team = window.store?.data?.team || [];
    const matchedDoc = team.find(m => m.id === doctorId);
    const doctorName = matchedDoc?.full_name || window.apiClient?.getUser()?.full_name || 'Diş Hekimi';

    // CONFLICT DETECTION REQUIREMENT (Section 6.2 P0: Çakışma Uyarısı)
    const conflict = window.store.checkConflict(date, time, doctorId);
    const newApptData = {
      patientName,
      phone,
      date,
      time,
      durationMinutes: 45,
      procedure,
      status: "Bekliyor",
      doctor_id: doctorId,
      doctor_name: doctorName,
      notes: ""
    };

    if (conflict) {
      this.pendingApptData = newApptData;
      this.showConflictModal(conflict, date, time);
      return;
    }

    this.saveAppointment(newApptData);
  }

  showConflictModal(conflict, date, time) {
    const infoText = document.getElementById('conflict-info-text');
    if (infoText) {
      infoText.innerHTML = `
        <strong>⚠️ Çakışan Randevu Tespit Edildi!</strong><br/>
        <b>Tarih & Saat:</b> ${date} • saat ${time}<br/>
        <b>Kayıtlı Hasta:</b> ${conflict.patientName} (${conflict.procedure})<br/>
        <b>Hekim:</b> ${conflict.doctor_name || 'Diş Hekimi'}<br/><br/>
        Aynı hekim / saat dilimine ikinci randevuyu kaydetmek istediğinize emin misiniz?
      `;
    }
    document.getElementById('conflict-modal')?.classList.add('active');
  }

  closeConflictModal() {
    document.getElementById('conflict-modal')?.classList.remove('active');
    this.pendingApptData = null;
  }

  confirmConflictSave() {
    if (this.pendingApptData) {
      const data = { ...this.pendingApptData };
      this.closeConflictModal();
      this.saveAppointment(data);
    }
  }

  saveAppointment(apptData) {
    window.store.addAppointment(apptData);

    // Auto send WhatsApp appointment confirmation link (Section 6.4)
    window.store.addWhatsAppMessage(
      apptData.patientName,
      apptData.phone,
      "Randevu Onay Linki (Otomatik)",
      `Sayın ${apptData.patientName}, ${apptData.date} saat ${apptData.time}'deki randevunuz (${apptData.doctor_name}) oluşturuldu. Onaylamak için: [ONAYLA]`
    );

    this.closeNewApptModal();
    this.render();
    window.appCtrl?.showToast(`${apptData.patientName} için randevu (${apptData.doctor_name}) oluşturuldu ve WhatsApp onay mesajı iletildi!`, "success");
  }

  openApptModal(id) {
    const appt = window.store.getAppointments().find(a => a.id === id);
    if (!appt) return;
    this.selectedApptId = id;

    const modal = document.getElementById("appt-action-modal");
    const infoBox = document.getElementById("appt-action-info");
    const noteField = document.getElementById("appt-quick-note");
    if (noteField) noteField.value = appt.notes || "";

    if (infoBox) {
      infoBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong style="font-size:17px;color:var(--text-main)">${appt.patientName}</strong>
          <span class="status-badge ${appt.status === 'Geldi' ? 'completed' : appt.status === 'Bekliyor' ? 'pending' : 'cancelled'}">${appt.status}</span>
        </div>
        <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:4px">📅 <strong>Saat:</strong> ${appt.time} • ${appt.date || ''}</div>
        <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:4px">🦷 <strong>Tedavi / İşlem:</strong> ${appt.procedure}</div>
        ${appt.doctor_name ? `<div style="font-size:13.5px;color:var(--primary);font-weight:700;margin-bottom:4px">🩺 <strong>Hekim:</strong> ${appt.doctor_name}</div>` : ''}
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

    const noteField = document.getElementById("appt-quick-note");
    if (noteField && noteField.value.trim()) {
      appt.notes = noteField.value.trim();
      const patient = window.store.getPatients().find(p => p.name === appt.patientName || p.phone === appt.phone);
      if (patient) {
        window.store.addTreatmentNote(patient.id, {
          type: appt.procedure || "Seans Kontrolü",
          tooth: "-",
          note: `[Seans Notu (${status})] ${appt.notes}`,
          cost: 0,
          date: new Date().toISOString().split('T')[0]
        });
      }
      window.store.save();
    }

    this.closeApptModal();
    this.render();

    const toastClass = status === "Geldi" ? "success" : status === "Gelmedi" ? "danger" : status === "İptal" ? "secondary" : "info";
    window.appCtrl?.showToast(`${appt.patientName} randevusu "${status}" olarak güncellendi. ${appt.notes ? 'Seans notu hasta kartına işlendi.' : ''}`, toastClass);
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
