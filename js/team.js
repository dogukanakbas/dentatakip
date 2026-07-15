/* ==============================================================================
   DENTATAKİP 2.0 • MULTI-DOCTOR & TEAM MANAGEMENT CONTROLLER (CLINIC OWNER)
   ============================================================================== */

class TeamController {
  constructor() {
    this.container = null;
    this.activeTab = 'list';
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.render();
  }

  async render() {
    this.container = document.getElementById('team-content-area');
    if (!this.container) return;

    // Önce güncel ekip listesini sunucudan çek
    await window.store.syncWithServer();
    const team = window.store.data.team || [];
    const user = window.apiClient?.getUser();
    const practice = window.apiClient?.getPractice() || {};
    const isOwnerOrSuper = user?.role === 'owner' || user?.role === 'superadmin';

    const doctorCount = team.filter(m => m.role === 'owner' || m.role === 'doctor').length || 1;
    const assistantCount = team.filter(m => m.role === 'assistant').length || 0;
    const planLabel = practice.plan_type === 'clinic' ? '🏥 Poliklinik Pro (Çoklu Koltuk)' : '👨‍⚕️ Solo Hekim Pro (Tek Koltuk + Ekip)';
    const chairLimit = practice.chair_count || 1;

    // Hekim bazlı hasta ve ciro istatistiklerini hesapla
    const patients = window.store.getPatients() || [];
    const appts = window.store.getAppointments() || [];
    const payments = window.store.getPayments() || [];

    let tabButtonsHtml = `
      <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <button class="btn ${this.activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}" onclick="window.teamCtrl.switchTab('list')" style="font-weight:700">
          👨‍⚕️ Kadro & Yetki Listesi (${team.length})
        </button>
        <button class="btn ${this.activeTab === 'payouts' ? 'btn-primary' : 'btn-secondary'}" onclick="window.teamCtrl.switchTab('payouts')" style="font-weight:700">
          📊 Hekim Hakediş & Prim Raporu (Net Ciro - Lab)
        </button>
      </div>
    `;

    let cardContentHtml = '';

    if (this.activeTab === 'list') {
      let rowsHtml = '';
      if (team.length === 0) {
        rowsHtml = `
          <tr>
            <td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">
              Henüz eklenmiş bir ekip üyesi bulunmuyor. Sağ üstteki "+ Yeni Hekim / Asistan Ekle" butonuna basarak ekibinize davet edebilirsiniz.
            </td>
          </tr>
        `;
      } else {
        rowsHtml = team.map(member => {
          let roleBadge = '';
          if (member.role === 'owner') {
            roleBadge = `<span class="status-badge completed" style="background:#8b5cf6;color:#fff">👑 Başhekim (Sahip)</span>`;
          } else if (member.role === 'doctor') {
            roleBadge = `<span class="status-badge pending" style="background:#0ea5e9;color:#fff">🩺 Diş Hekimi</span>`;
          } else {
            roleBadge = `<span class="status-badge pending" style="background:#f59e0b;color:#fff">📋 Asistan / Sekreter</span>`;
          }

          const docPatientsCount = patients.filter(p => p.doctor_id === member.id || p.doctor_name === member.full_name).length;
          const docApptsCount = appts.filter(a => a.doctor_id === member.id || a.doctor_name === member.full_name).length;

          const docPaymentsTotal = payments.reduce((sum, pay) => {
            if (pay.doctor_id === member.id || pay.doctor_name === member.full_name) {
              return sum + (Number(pay.amount) || 0);
            }
            const matchedPatient = patients.find(p => p.id === pay.patientId);
            if (matchedPatient && (matchedPatient.doctor_id === member.id || matchedPatient.doctor_name === member.full_name)) {
              return sum + (Number(pay.amount) || 0);
            }
            return sum;
          }, 0);

          let deleteBtn = '';
          if (isOwnerOrSuper && member.role !== 'owner' && member.id !== user?.id) {
            deleteBtn = `
              <button class="btn btn-outline" style="padding:6px 12px;font-size:12px;border-color:#ef4444;color:#ef4444" onclick="window.teamCtrl.deleteMember('${member.id}', '${member.full_name}')">🗑️ Sil</button>
            `;
          } else if (member.id === user?.id) {
            deleteBtn = `<span style="font-size:12px;color:var(--text-muted);font-style:italic">Mevcut Oturum</span>`;
          }

          let rateBadge = member.role !== 'assistant' ? `
            <span style="background:var(--bg-card-hover);border:1px solid var(--border-color);padding:3px 8px;border-radius:6px;font-size:12px;font-weight:700;color:var(--primary-color);cursor:pointer" onclick="window.teamCtrl.openCommissionModal('${member.id}', '${member.full_name}', ${member.commission_rate || 40})">
              %${member.commission_rate || 40} ✏️
            </span>
          ` : '<span style="color:var(--text-muted);font-size:12px">-</span>';

          return `
            <tr style="border-bottom:1px solid var(--border-color);transition:background 0.2s">
              <td style="padding:16px 12px">
                <div style="display:flex;align-items:center;gap:12px">
                  <div style="width:40px;height:40px;border-radius:10px;background:var(--bg-card);border:1px solid var(--border-color);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary-color)">
                    ${member.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style="font-weight:700;color:var(--text-main);font-size:14px">${member.full_name}</div>
                    <div style="font-size:12px;color:var(--text-muted)">${member.title || 'Diş Hekimi'}</div>
                  </div>
                </div>
              </td>
              <td style="padding:16px 12px">
                <div style="font-size:13px;color:var(--text-main)">✉️ ${member.email}</div>
                <div style="font-size:12px;color:var(--text-muted)">📞 ${member.phone || '-'}</div>
              </td>
              <td style="padding:16px 12px">
                ${roleBadge}
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">📍 ${member.room || '1. Koltuk'}</div>
              </td>
              <td style="padding:16px 12px;text-align:center">
                <div style="font-size:14px;font-weight:700;color:var(--text-main)">${member.role !== 'assistant' ? docPatientsCount + ' Hasta' : '-'}</div>
                <div style="font-size:12px;color:var(--text-muted)">${member.role !== 'assistant' ? docApptsCount + ' Randevu' : '-'}</div>
              </td>
              <td style="padding:16px 12px;text-align:center">
                ${rateBadge}
              </td>
              <td style="padding:16px 12px;text-align:right">
                <div style="font-size:14px;font-weight:800;color:#10b981">${member.role !== 'assistant' ? '₺' + docPaymentsTotal.toLocaleString('tr-TR') : '-'}</div>
                <div style="font-size:11px;color:var(--text-muted)">Tahsilat Katkısı</div>
              </td>
              <td style="padding:16px 12px;text-align:right">
                ${deleteBtn}
              </td>
            </tr>
          `;
        }).join('');
      }

      cardContentHtml = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div>
            <h3 style="font-size:18px;font-weight:700;color:var(--text-main);margin:0">Kadro & Yetki Listesi (${team.length})</h3>
            <p style="font-size:13px;color:var(--text-muted);margin:4px 0 0">Bu ekrandan eklediğiniz hekimler kendilerine tanımlanan e-posta ve şifreyle hemen giriş yapabilir.</p>
          </div>
          ${isOwnerOrSuper ? `<button class="btn btn-primary" style="font-size:13px" onclick="window.teamCtrl.openAddModal()">+ Yeni Hekim / Ekip Üyesi Ekle</button>` : ''}
        </div>

        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:780px">
            <thead>
              <tr style="background:var(--bg-main);border-bottom:2px solid var(--border-color);text-align:left;font-size:12px;color:var(--text-muted);text-transform:uppercase">
                <th style="padding:12px">Ad Soyad & Ünvan</th>
                <th style="padding:12px">İletişim</th>
                <th style="padding:12px">Rol & Çalışma Odası</th>
                <th style="padding:12px;text-align:center">Hasta / Randevu</th>
                <th style="padding:12px;text-align:center">Prim Oranı</th>
                <th style="padding:12px;text-align:right">Ciro Katkısı</th>
                <th style="padding:12px;text-align:right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeTab === 'payouts') {
      const payouts = await window.apiClient.getTeamPayouts();
      let payoutRowsHtml = '';
      if (payouts.length === 0) {
        payoutRowsHtml = `
          <tr>
            <td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">
              Henüz hekim hakediş verisi bulunamadı.
            </td>
          </tr>
        `;
      } else {
        payoutRowsHtml = payouts.map(p => `
          <tr style="border-bottom:1px solid var(--border-color);transition:background 0.2s">
            <td style="padding:16px 12px">
              <div style="font-weight:700;color:var(--text-main);font-size:14px">${p.doctor_name}</div>
              <div style="font-size:12px;color:var(--text-muted)">${p.title || 'Diş Hekimi'} (${p.role === 'owner' ? '👑 Başhekim' : '🩺 Hekim'})</div>
            </td>
            <td style="padding:16px 12px;text-align:right">
              <strong style="color:var(--text-main);font-size:14px">₺${Number(p.gross_revenue || 0).toLocaleString('tr-TR')}</strong>
            </td>
            <td style="padding:16px 12px;text-align:right">
              <strong style="color:#ef4444;font-size:14px">- ₺${Number(p.lab_cost || 0).toLocaleString('tr-TR')}</strong>
            </td>
            <td style="padding:16px 12px;text-align:right">
              <strong style="color:#0ea5e9;font-size:14px">₺${Number(p.net_base || 0).toLocaleString('tr-TR')}</strong>
            </td>
            <td style="padding:16px 12px;text-align:center">
              <span style="background:var(--bg-card-hover);border:1px solid var(--border-color);padding:4px 10px;border-radius:8px;font-size:13px;font-weight:800;color:var(--primary-color);cursor:pointer" onclick="window.teamCtrl.openCommissionModal('${p.doctor_id}', '${p.doctor_name}', ${p.commission_rate || 40})" title="Oranı değiştirmek için tıklayın">
                %${p.commission_rate || 40} ✏️
              </span>
            </td>
            <td style="padding:16px 12px;text-align:right">
              <div style="font-size:15px;font-weight:800;color:#10b981">₺${Number(p.doctor_share || 0).toLocaleString('tr-TR')}</div>
              <div style="font-size:11px;color:var(--text-muted)">Hekim Net Payı</div>
            </td>
            <td style="padding:16px 12px;text-align:right">
              <div style="font-size:15px;font-weight:800;color:#8b5cf6">₺${Number(p.clinic_share || 0).toLocaleString('tr-TR')}</div>
              <div style="font-size:11px;color:var(--text-muted)">Klinik Payı</div>
            </td>
          </tr>
        `).join('');
      }

      cardContentHtml = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div>
            <h3 style="font-size:18px;font-weight:700;color:var(--text-main);margin:0">Hekim Hakediş & Prim Raporlama Tablosu</h3>
            <p style="font-size:13px;color:var(--text-muted);margin:4px 0 0">Net hakediş hesabı, hekimin ürettiği brüt cirodan o hekime ait laboratuvar kesintileri düşüldükten sonra prim yüzdesi uygulanarak hesaplanır.</p>
          </div>
          <span style="font-size:12px;color:var(--text-muted);background:var(--bg-app);padding:6px 12px;border-radius:8px;border:1px solid var(--border-color)">
            💡 <strong>Formül:</strong> Hakediş = (Brüt Ciro - Lab Masrafı) × %Prim Oranı
          </span>
        </div>

        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:780px">
            <thead>
              <tr style="background:var(--bg-main);border-bottom:2px solid var(--border-color);text-align:left;font-size:12px;color:var(--text-muted);text-transform:uppercase">
                <th style="padding:12px">Hekim & Ünvan</th>
                <th style="padding:12px;text-align:right">Brüt Tahsilat Ciro</th>
                <th style="padding:12px;text-align:right">Laboratuvar Kesintisi</th>
                <th style="padding:12px;text-align:right">Net Baz Tutar</th>
                <th style="padding:12px;text-align:center">Prim Oranı (%)</th>
                <th style="padding:12px;text-align:right">Hekim Hakediş (Pay)</th>
                <th style="padding:12px;text-align:right">Klinik Kalan Pay</th>
              </tr>
            </thead>
            <tbody>
              ${payoutRowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }

    this.container.innerHTML = `
      <!-- CLINIC OVERVIEW CARDS -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;margin-bottom:24px">
        <div class="card" style="padding:20px;display:flex;align-items:center;gap:16px;border-left:4px solid #8b5cf6">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(139,92,246,0.15);display:flex;align-items:center;justify-content:center;font-size:24px">🏥</div>
          <div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Klinik Lisans Paketi</div>
            <div style="font-size:16px;font-weight:800;color:var(--text-main)">${planLabel}</div>
            <div style="font-size:12px;color:var(--primary-color)">Yetkili Koltuk Sayısı: <strong>${chairLimit} Koltuk</strong></div>
          </div>
        </div>

        <div class="card" style="padding:20px;display:flex;align-items:center;gap:16px;border-left:4px solid #0ea5e9">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(14,165,233,0.15);display:flex;align-items:center;justify-content:center;font-size:24px">🩺</div>
          <div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Aktif Hekim Kadrosu</div>
            <div style="font-size:24px;font-weight:800;color:#0ea5e9">${doctorCount} Hekim</div>
            <div style="font-size:11px;color:var(--text-muted)">${assistantCount} Asistan / Sekreter</div>
          </div>
        </div>

        <div class="card" style="padding:20px;display:flex;align-items:center;gap:16px;border-left:4px solid #10b981">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;font-size:24px">📊</div>
          <div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Ortak Veri Havuzu</div>
            <div style="font-size:24px;font-weight:800;color:#10b981">${patients.length} Toplam Hasta</div>
            <div style="font-size:11px;color:var(--text-muted)">Tüm hekimler eşzamanlı izlenebilir</div>
          </div>
        </div>
      </div>

      ${tabButtonsHtml}

      <div class="card" style="padding:24px">
        ${cardContentHtml}
      </div>
    `;
  }

  openCommissionModal(docId, docName, currentRate) {
    document.getElementById('payout-target-id').value = docId;
    document.getElementById('payout-doc-name').value = docName;
    document.getElementById('payout-comm-rate').value = currentRate || 40;
    document.getElementById('payout-rate-modal').classList.add('active');
  }

  async saveCommissionRate() {
    const docId = document.getElementById('payout-target-id').value;
    const rate = Number(document.getElementById('payout-comm-rate').value) || 0;

    const res = await window.apiClient.updateTeamMember(docId, { commission_rate: rate });
    if (res.ok) {
      window.appCtrl?.showToast(`🎉 Hekim prim oranı %${rate} olarak güncellendi.`, "success");
      document.getElementById('payout-rate-modal').classList.remove('active');
      await this.render();
    } else {
      window.appCtrl?.showToast("Hata: " + res.error, "danger");
    }
  }

  openAddModal() {
    const user = window.apiClient?.getUser();
    if (user?.role !== 'owner' && user?.role !== 'superadmin') {
      window.appCtrl?.showToast("Yalnızca muayenehane sahibi / başhekim yeni hekim veya asistan ekleyebilir.", "danger");
      return;
    }

    let modal = document.getElementById('team-add-modal');
    if (!modal) {
      const modalDiv = document.createElement('div');
      modalDiv.className = 'modal-overlay';
      modalDiv.id = 'team-add-modal';
      modalDiv.innerHTML = `
        <div class="modal-box" style="max-width:520px">
          <div class="modal-header">
            <div>
              <h3 style="font-size:18px;font-weight:700">Yeni Hekim / Asistan Tanımla</h3>
              <p style="font-size:13px;color:var(--text-muted)">Eklenen üye anında e-posta ve şifresiyle oturum açabilecektir.</p>
            </div>
            <button class="btn-icon" onclick="window.teamCtrl.closeAddModal()">✕</button>
          </div>
          <div class="modal-body" style="display:flex;flex-direction:column;gap:16px">
            <div>
              <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Ad Soyad <span style="color:#ef4444">*</span></label>
              <input type="text" id="tm-name" class="form-input" placeholder="Örn: Dr. Zeynep Aksoy" />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Sistem Yetki Rolü <span style="color:#ef4444">*</span></label>
                <select id="tm-role" class="form-input" onchange="document.getElementById('tm-comm-container').style.display = this.value === 'doctor' ? 'block' : 'none'">
                  <option value="doctor">🩺 Diş Hekimi</option>
                  <option value="assistant">📋 Asistan / Sekreter</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Uzmanlık / Ünvan</label>
                <input type="text" id="tm-title" class="form-input" placeholder="Örn: Ortodonti Uzmanı" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Oda / Koltuk No</label>
                <input type="text" id="tm-room" class="form-input" placeholder="Örn: 2. Koltuk / VIP" />
              </div>
              <div id="tm-comm-container">
                <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Prim / Hakediş Oranı (%)</label>
                <input type="number" id="tm-comm" class="form-input" min="0" max="100" value="40" />
              </div>
            </div>
            <div>
              <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Telefon</label>
              <input type="text" id="tm-phone" class="form-input" placeholder="05XX XXX XX XX" />
            </div>
            <div style="border-top:1px solid var(--border-color);padding-top:12px">
              <div style="font-weight:700;font-size:13px;color:var(--primary-color);margin-bottom:8px">🔐 Giriş Bilgileri (Oturum Açma İçin)</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div>
                  <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">E-posta <span style="color:#ef4444">*</span></label>
                  <input type="email" id="tm-email" class="form-input" placeholder="hekim@klinik.com" />
                </div>
                <div>
                  <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Şifre <span style="color:#ef4444">*</span></label>
                  <input type="password" id="tm-pass" class="form-input" placeholder="******" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:12px;margin-top:20px">
            <button class="btn btn-outline" onclick="window.teamCtrl.closeAddModal()">İptal</button>
            <button class="btn btn-primary" onclick="window.teamCtrl.submitMember()">✓ Ekibi Kaydet ve Aktif Et</button>
          </div>
        </div>
      `;
      document.body.appendChild(modalDiv);
      modal = modalDiv;
    }

    modal.classList.add('active');
  }

  closeAddModal() {
    document.getElementById('team-add-modal')?.classList.remove('active');
  }

  async submitMember() {
    const full_name = document.getElementById('tm-name')?.value.trim();
    const role = document.getElementById('tm-role')?.value;
    const title = document.getElementById('tm-title')?.value.trim();
    const room = document.getElementById('tm-room')?.value.trim();
    const phone = document.getElementById('tm-phone')?.value.trim();
    const email = document.getElementById('tm-email')?.value.trim();
    const password = document.getElementById('tm-pass')?.value;
    const commission_rate = Number(document.getElementById('tm-comm')?.value) || 40;

    if (!full_name || !email || !password) {
      window.appCtrl?.showToast("Lütfen Ad Soyad, E-posta ve Şifre alanlarını eksiksiz doldurunuz.", "danger");
      return;
    }

    const res = await window.apiClient.addTeamMember({ full_name, email, password, role, title, phone, room, commission_rate });
    if (res.ok) {
      window.appCtrl?.showToast(`🎉 "${full_name}" ekibe başarıyla eklendi! Hemen oturum açabilir.`, "success");
      this.closeAddModal();
      await this.render();
    } else {
      if (res.code === 'PLAN_LIMIT_REACHED' || (res.error && res.error.includes('Solo Hekim Pro'))) {
        this.closeAddModal();
        document.getElementById('upsell-modal')?.classList.add('active');
      } else {
        window.appCtrl?.showToast("Hata: " + res.error, "danger");
      }
    }
  }

  async deleteMember(id, name) {
    // Zero-popup custom confirmation modal / prompt
    const proceed = await new Promise(resolve => {
      let m = document.getElementById('team-delete-confirm-modal');
      if (!m) {
        m = document.createElement('div');
        m.className = 'modal-overlay';
        m.id = 'team-delete-confirm-modal';
        m.innerHTML = `
          <div class="modal-box" style="max-width:400px;text-align:center;padding:24px">
            <div style="font-size:36px;margin-bottom:12px">⚠️</div>
            <h3 style="font-size:18px;font-weight:700;color:var(--text-main);margin-bottom:8px">Ekip Üyesini Çıkar</h3>
            <p id="team-delete-msg" style="font-size:14px;color:var(--text-muted);margin-bottom:20px;line-height:1.5"></p>
            <div style="display:flex;gap:10px;justify-content:center">
              <button class="btn btn-secondary" id="tm-del-cancel">İptal</button>
              <button class="btn btn-primary" style="background:#ef4444;border-color:#ef4444" id="tm-del-ok">Evet, Kadrodan Çıkar</button>
            </div>
          </div>
        `;
        document.body.appendChild(m);
      }
      document.getElementById('team-delete-msg').textContent = `"${name}" adlı ekip üyesini muayenehane kadrosundan çıkarmak istediğinize emin misiniz?`;
      m.classList.add('active');
      const cancelBtn = document.getElementById('tm-del-cancel');
      const okBtn = document.getElementById('tm-del-ok');
      const cleanup = (ans) => {
        m.classList.remove('active');
        cancelBtn.onclick = null;
        okBtn.onclick = null;
        resolve(ans);
      };
      cancelBtn.onclick = () => cleanup(false);
      okBtn.onclick = () => cleanup(true);
    });

    if (!proceed) return;

    const res = await window.apiClient.removeTeamMember(id);
    if (res.ok) {
      window.appCtrl?.showToast(`"${name}" kadrodan çıkarıldı.`, "info");
      await this.render();
    } else {
      window.appCtrl?.showToast("Hata: " + res.error, "danger");
    }
  }
}

window.teamCtrl = new TeamController();
