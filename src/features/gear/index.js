import { getState, addGearKit, showToast } from '../../state/store.js';
import { icons } from '../../ui/icons.js';
import { escapeHtml } from '../../ui/format.js';

export function render(root) {
  function renderList() {
    const list = root.querySelector('#gear-list');
    const kits = getState().gearKits;
    if (kits.length === 0) {
      list.innerHTML = `<div class="empty-state"><h3>Brak zestawów</h3><p>Dodaj swój pierwszy zestaw sprzętu.</p></div>`;
      return;
    }
    list.innerHTML = kits.map((k) => `
      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <h3 style="margin:0; font-size:15px;">${escapeHtml(k.name)}</h3>
          ${icons.gear}
        </div>
        <ul style="margin:0; padding-left:18px; color:var(--text-secondary); font-size:13px;">
          ${k.items.map((i) => `<li>${escapeHtml(i.label)}</li>`).join('')}
        </ul>
      </div>`).join('');
  }

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header">
        <button type="button" class="icon-btn" id="back-btn" aria-label="Wstecz">${icons.back}</button>
        <h1>Ekwipunek</h1>
      </div>
      <div class="section" style="padding-top:0;">
        <div id="gear-list" style="margin-bottom:18px;"></div>
        <div class="card" id="add-gear-card">
          <div class="section-title" style="margin-bottom:10px;">Dodaj zestaw</div>
          <div class="field"><label for="g-name">Nazwa zestawu</label><input type="text" id="g-name" placeholder="Np. Feeder"></div>
          <div class="field"><label for="g-item">Elementy (po przecinku)</label><input type="text" id="g-item" placeholder="Wędka feederowa, Kołowrotek 4000"></div>
          <button type="button" class="btn btn-teal btn-block" id="add-gear-btn">Zapisz zestaw</button>
        </div>
      </div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => history.back());
  root.querySelector('#add-gear-btn').addEventListener('click', () => {
    const name = root.querySelector('#g-name').value.trim();
    const itemsRaw = root.querySelector('#g-item').value.trim();
    if (!name) { showToast('Podaj nazwę zestawu.'); return; }
    const items = itemsRaw ? itemsRaw.split(',').map((s) => ({ kind: 'przynęta', label: s.trim() })).filter((i) => i.label) : [];
    addGearKit({ name, items });
    root.querySelector('#g-name').value = '';
    root.querySelector('#g-item').value = '';
    renderList();
    showToast('Zestaw zapisany.');
  });

  renderList();
}
