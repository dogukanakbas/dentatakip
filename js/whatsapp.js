/* ==========================================================================
   SOLO HEKİM PRO — WhatsApp Automation Engine & Live iPhone Simulator
   ========================================================================== */

class WhatsAppController {
  constructor() {
    this.selectedPhonePatient = "Selin Yılmaz";
    this.selectedPhoneNum = "+90 532 841 22 10";
    this.chatHistory = [
      {
        sender: 'outgoing',
        time: '09:30',
        text: 'Sayın Selin Yılmaz, 11 Temmuz saat 09:30 daki Dr. Zeynep Aksoy muayenehanesi randevunuzu onaylamak için lütfen aşağıdaki butona tıklayın.',
        buttons: ['Onaylıyorum', 'İptal Talebi']
      },
      {
        sender: 'incoming',
        time: '09:35',
        text: 'Randevumu onaylıyorum, teşekkürler hocam.'
      }
    ];
  }

  render() {
    const badge = document.getElementById('wa-header-status-badge');
    if (badge) {
      const hasApi = Boolean(localStorage.getItem('sh_wa_token') && localStorage.getItem('sh_wa_phone_id'));
      if (hasApi) {
        badge.className = "status-badge completed";
        badge.style.background = "var(--success-subtle)";
        badge.style.color = "var(--success)";
        badge.innerText = "WhatsApp Business API Canlı Bağlı";
      } else {
        badge.className = "status-badge pending";
        badge.style.background = "var(--warning-subtle)";
        badge.style.color = "var(--warning)";
        badge.innerText = "API Tanımlanmadı (Simülatör Modunda)";
      }
    }

    this.renderLogTable();
    this.renderSimulator();
  }

  renderLogTable() {
    const el = document.getElementById('whatsapp-log-table-body');
    if (!el) return;

    const logs = window.store.getWhatsAppLogs();
    if (logs.length === 0) {
      el.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Henüz gönderilmiş mesaj kaydı yok.</td></tr>`;
      return;
    }

    el.innerHTML = logs.map(l => `
      <tr>
        <td><strong style="color:var(--text-main)">${l.patientName}</strong><br><span style="font-size:11.5px;color:var(--text-muted)">${l.phone}</span></td>
        <td><span class="nav-badge" style="background:var(--primary-subtle);color:var(--primary)">${l.type}</span></td>
        <td><span style="font-size:12.5px">${l.message}</span></td>
        <td><span class="status-badge completed">${l.status}</span></td>
        <td><span style="font-size:12px;color:var(--text-muted)">${l.sentAt}</span></td>
      </tr>
    `).join('');
  }

  renderSimulator() {
    const chatContainer = document.getElementById('wa-sim-chat');
    if (!chatContainer) return;

    chatContainer.innerHTML = this.chatHistory.map(bubble => `
      <div class="wa-bubble ${bubble.sender}">
        <div>${bubble.text}</div>
        ${bubble.buttons ? `
          <div class="wa-actions">
            ${bubble.buttons.map(btn => `
              <div class="wa-btn" onclick="window.whatsappCtrl.handleSimButton('${btn}')">${btn}</div>
            `).join('')}
          </div>
        ` : ''}
        <div class="wa-time">${bubble.time}</div>
      </div>
    `).join('');

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  handleSimButton(btnText) {
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    this.chatHistory.push({
      sender: 'incoming',
      time,
      text: `${btnText}`
    });

    if (btnText.includes('Onaylıyorum')) {
      // Automatically update appointment in store
      const appts = window.store.getAppointments();
      const match = appts.find(a => a.patientName === this.selectedPhonePatient);
      if (match) {
        match.status = 'Geldi';
        window.store.save();
      }
      setTimeout(() => {
        this.chatHistory.push({
          sender: 'outgoing',
          time,
          text: 'Harika! Randevunuz sistemimizde ONAYLANDI olarak güncellendi. Sağlıklı günler dileriz.'
        });
        this.renderSimulator();
        window.appCtrl?.showToast(`${this.selectedPhonePatient} hastasının randevusu WhatsApp üzerinden otomatik onaylandı!`, "whatsapp");
      }, 400);
    }

    this.renderSimulator();
  }

  sendManualTestTemplate(templateType) {
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    let text = "";
    let buttons = null;

    if (templateType === 'reminder') {
      text = "Sayın Selin Yılmaz, yarın saat 09:30'da Dr. Zeynep Aksoy Diş Muayenehanesindeki randevunuzu hatırlatırız.";
      buttons = ['Onaylıyorum', 'Yeniden Planla'];
    } else if (templateType === 'payment') {
      text = "Sayın Selin Yılmaz, tedavinizle ilgili kalan 6.500 TL bakiye kaydınız bulunmaktadır. Bilginize sunar, sağlıklı günler dileriz.";
      buttons = ['Kredi Kartı ile Öde', 'Hekim ile Konuş'];
    }

    this.chatHistory.push({
      sender: 'outgoing',
      time,
      text,
      buttons
    });

    window.store.addWhatsAppMessage(
      this.selectedPhonePatient,
      this.selectedPhoneNum,
      templateType === 'reminder' ? '24 Saat Hatırlatma' : 'Ödeme Hatırlatma',
      text,
      "İletildi"
    );

    this.renderSimulator();
    this.renderLogTable();
    window.appCtrl?.showToast("WhatsApp şablonu simülatöre ve bildirim kuyruğuna gönderildi!", "whatsapp");
  }
}

window.whatsappCtrl = new WhatsAppController();
