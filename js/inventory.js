/**
 * INVENTORY CONTROLLER (js/inventory.js)
 * Stok & Sarf Malzeme Envanteri, Kritik Stok Alarmları ve Son Kullanma Tarihi (SKT) Takibi
 */

class InventoryController {
  constructor() {
    this.currentItems = [];
  }

  render() {
    const container = document.getElementById('inventory-content-area');
    if (!container) return;

    const items = window.store.getInventory();
    this.currentItems = items;

    const totalItems = items.length;
    const criticalCount = items.filter(i => i.qty <= i.minQty || i.status === "Kritik Stok").length;

    // SKT kontrolü: < 90 gün kalmışsa yaklaşan kabul et
    const now = new Date();
    const sktAlertCount = items.filter(i => {
      if (!i.skt) return false;
      const diffDays = (new Date(i.skt) - now) / (1000 * 60 * 60 * 24);
      return diffDays <= 90;
    }).length;

    container.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:24px">
        <div class="kpi-card">
          <div class="kpi-title">Toplam Envanter Kalemi</div>
          <div class="kpi-value">${totalItems}</div>
          <div class="kpi-trend positive">Kayıtlı Sarf Malzeme</div>
        </div>
        <div class="kpi-card" style="${criticalCount > 0 ? 'border-color:#ef4444' : ''}">
          <div class="kpi-title">Kritik Stok Alarmları</div>
          <div class="kpi-value" style="color:#ef4444">${criticalCount}</div>
          <div class="kpi-trend negative">Sipariş Edilmeli</div>
        </div>
        <div class="kpi-card" style="${sktAlertCount > 0 ? 'border-color:#f59e0b' : ''}">
          <div class="kpi-title">SKT Uyarıları (&lt; 90 Gün)</div>
          <div class="kpi-value" style="color:#f59e0b">${sktAlertCount}</div>
          <div class="kpi-trend">Son Kullanma Kontrolü</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Otomatik Düşüm</div>
          <div class="kpi-value" style="color:var(--whatsapp)">Aktif</div>
          <div class="kpi-trend positive">Barkod & Tedavi Uyumlu</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <h3 class="card-title">Klinik Malzeme Envanteri & Kritik Eşik Kontrolü</h3>
          <span style="font-size:12.5px;color:var(--text-muted)">Stok miktarını +/- butonlarıyla anında güncelleyebilirsiniz</span>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Stok Kodu</th>
                <th>Malzeme / Ürün Adı</th>
                <th>Kategori</th>
                <th>Mevcut Miktar</th>
                <th>Alarm Eşiği</th>
                <th>Son Kullanma Tarihi (SKT)</th>
                <th>Durum</th>
                <th style="text-align:right">Stok Hareketi / İşlem</th>
              </tr>
            </thead>
            <tbody>
              ${items.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted)">
                    Henüz kayıtlı sarf malzemesi bulunmuyor. Sağ üstteki butonla malzeme ekleyebilirsiniz.
                  </td>
                </tr>
              ` : items.map(i => {
                const isCritical = i.qty <= i.minQty;
                const diffDays = i.skt ? (new Date(i.skt) - now) / (1000 * 60 * 60 * 24) : 999;
                const isSktClose = diffDays <= 90;

                return `
                  <tr>
                    <td><strong style="color:var(--primary)">#${i.id}</strong></td>
                    <td><span style="font-weight:600">${i.name}</span></td>
                    <td><span style="font-size:13px;color:var(--text-muted)">${i.category}</span></td>
                    <td>
                      <strong style="font-size:15px;color:${isCritical ? '#ef4444' : 'var(--text-main)'}">
                        ${i.qty}
                      </strong> <span style="font-size:12px;color:var(--text-muted)">${i.unit}</span>
                    </td>
                    <td><span style="color:var(--text-muted)">Min: ${i.minQty} ${i.unit}</span></td>
                    <td>
                      <span style="font-weight:600;color:${isSktClose ? '#f59e0b' : 'var(--text-main)'}">
                        ${i.skt || '-'}
                      </span>
                    </td>
                    <td>
                      ${isCritical 
                        ? `<span class="status-badge cancelled" style="background:rgba(239,68,68,0.15);color:#ef4444">⚠ Kritik Stok</span>`
                        : isSktClose
                        ? `<span class="status-badge pending" style="background:rgba(245,158,11,0.15);color:#f59e0b">⏰ SKT Yaklaşıyor</span>`
                        : `<span class="status-badge completed">✔ Yeterli</span>`
                      }
                    </td>
                    <td style="text-align:right">
                      <div style="display:inline-flex;gap:6px">
                        <button class="btn btn-secondary btn-sm" onclick="window.inventoryCtrl.adjustQty('${i.id}', 1)" title="+1 Stok Ekle">
                          +1 Ekle
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.inventoryCtrl.adjustQty('${i.id}', -1)" title="-1 Sarf Et (Kullan)">
                          -1 Kullan
                        </button>
                        <button class="btn-icon" onclick="window.inventoryCtrl.deleteItem('${i.id}')" title="Sil">🗑</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  openNewItemModal() {
    const modal = document.getElementById('new-inventory-modal');
    if (!modal) return;

    const sktInput = document.getElementById('inv-skt');
    if (sktInput) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 2);
      sktInput.value = d.toISOString().split('T')[0];
    }

    modal.classList.add('active');
  }

  closeNewItemModal() {
    const modal = document.getElementById('new-inventory-modal');
    if (modal) modal.classList.remove('active');
  }

  createInventoryItem(e) {
    e.preventDefault();
    const name = document.getElementById('inv-name').value;
    const category = document.getElementById('inv-category').value;
    const unit = document.getElementById('inv-unit').value;
    const qty = Number(document.getElementById('inv-qty').value) || 0;
    const minQty = Number(document.getElementById('inv-min').value) || 1;
    const skt = document.getElementById('inv-skt').value;

    const status = qty <= minQty ? "Kritik Stok" : "Yeterli";

    const newItem = {
      name,
      category,
      unit,
      qty,
      minQty,
      skt,
      status
    };

    const created = window.store.addInventoryItem(newItem);
    this.closeNewItemModal();
    this.render();
    window.appCtrl.showToast(`Envantere yeni malzeme eklendi: ${name}`);
  }

  adjustQty(id, delta) {
    const item = window.store.getInventory().find(i => i.id === id);
    if (!item) return;

    const nextQty = Math.max(0, item.qty + delta);
    const status = nextQty <= item.minQty ? "Kritik Stok" : "Yeterli";

    window.store.updateInventoryItem(id, {
      qty: nextQty,
      status
    });

    if (nextQty <= item.minQty) {
      window.appCtrl.showToast(`DİKKAT: ${item.name} kritik stok eşiğinin altına indi (${nextQty} ${item.unit})!`);
    } else {
      window.appCtrl.showToast(`${item.name} stok miktarı güncellendi (${nextQty} ${item.unit}).`);
    }

    this.render();
  }

  deleteItem(id) {
    if (confirm("Bu malzemeyi envanterden silmek istediğinize emin misiniz?")) {
      window.store.deleteInventoryItem(id);
      this.render();
      window.appCtrl.showToast("Malzeme envanterden silindi.");
    }
  }
}

window.inventoryCtrl = new InventoryController();
