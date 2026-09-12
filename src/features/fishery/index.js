import { getState, savePrivateSpot, showToast } from '../../state/store.js';
import { icons } from '../../ui/icons.js';
import { getFishArt } from '../../ui/fishArt.js';
import { escapeHtml } from '../../ui/format.js';

const TABS = [
  { id: 'info', label: 'Informacje' },
  { id: 'species', label: 'Ryby' },
  { id: 'reviews', label: 'Opinie' },
  { id: 'photos', label: 'Zdjęcia' },
];

export function render(root, params) {
  const fishery = getState().fisheries.find((f) => f.id === params.id);
  if (!fishery) {
    root.innerHTML = `<div class="screen"><div class="empty-state"><h3>Nie znaleziono łowiska</h3></div></div>`;
    return;
  }

  let activeTab = 'info';

  function speciesRows() {
    return fishery.speciesIds.map((sid) => {
      const s = getState().species.find((sp) => sp.id === sid);
      const presence = getState().speciesPresence.find((p) => p.waterBodyId === fishery.waterBodyId && p.speciesId === sid);
      const status = presence?.status ?? 'unknown';
      return { s, status };
    }).filter((r) => r.s);
  }

  function regulationsFor() {
    return getState().regulations.filter((r) => r.waterId === fishery.waterBodyId);
  }

  function renderBody() {
    const body = root.querySelector('#fishery-body');
    if (activeTab === 'info') {
      body.innerHTML = `
        <div class="stat-row" style="margin-bottom:14px;">
          <div class="stat-tile"><div class="label">Powierzchnia</div><div class="value">${fishery.areaHa ? fishery.areaHa + ' ha' : '—'}</div></div>
          <div class="stat-tile"><div class="label">Głębokość max</div><div class="value">${fishery.maxDepthM ? fishery.maxDepthM + ' m' : '—'}</div></div>
        </div>
        <div class="stat-row" style="margin-bottom:18px;">
          <div class="stat-tile"><div class="label">Typ łowiska</div><div class="value" style="font-size:14px;">${escapeHtml(fishery.type ?? '—')}</div></div>
          <div class="stat-tile"><div class="label">Zarządca</div><div class="value" style="font-size:14px;">${escapeHtml(fishery.authorityName ?? '—')}</div></div>
        </div>
        <div class="section-title">Zasady i przepisy</div>
        <div class="unverified-note" style="margin-bottom:18px;">
          Brak zweryfikowanych danych o przepisach dla tego łowiska. (${regulationsFor().length} pozycji oczekuje weryfikacji źródła.)
        </div>
        <div class="section-title">Dystans</div>
        <p style="color:var(--text-secondary); font-size:13.5px;"><span class="demo-tag">demo</span> ${fishery.distanceKm ?? '?'} km — obliczone na podstawie przykładowych współrzędnych, nie prawdziwego GPS.</p>
      `;
    } else if (activeTab === 'species') {
      const rows = speciesRows();
      body.innerHTML = `
        <div class="species-chip-row">
          ${rows.map(({ s, status }) => `
            <div class="species-chip" data-species="${s.id}">
              <span class="thumb">${getFishArt(s.id)}</span><span>${escapeHtml(s.namePl)}</span>
              <span class="presence-dot status-${status}" title="${statusLabel(status)}"></span>
            </div>`).join('')}
        </div>
        <p style="color:var(--text-muted); font-size:12px; margin-top:14px;">Kropka pokazuje pewność występowania: zielona = potwierdzone źródłowo, złota = potwierdzone społecznością, szara = szacowane/nieznane.</p>
      `;
      body.querySelectorAll('[data-species]').forEach((el) => {
        el.addEventListener('click', () => { location.hash = `#/species/${el.getAttribute('data-species')}`; });
      });
    } else if (activeTab === 'reviews') {
      body.innerHTML = `<div class="empty-state"><h3>Brak opinii</h3><p>Ta funkcja nie jest jeszcze zaimplementowana w Alpha.</p></div>`;
    } else {
      body.innerHTML = `<div class="empty-state"><h3>Brak zdjęć użytkowników</h3><p>Ta funkcja nie jest jeszcze zaimplementowana w Alpha.</p></div>`;
    }
  }

  root.innerHTML = `
    <div class="screen">
      <div class="fishery-hero" style="background:linear-gradient(135deg,#123a44,#081b22);">
        <button type="button" class="icon-btn" id="back-btn" aria-label="Wstecz">${icons.back}</button>
      </div>
      <div class="section" style="padding-top:16px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between;">
          <div>
            <h1 style="margin:0; font-size:20px;">${escapeHtml(fishery.name)}</h1>
            <p style="margin:2px 0 0 0; color:var(--text-secondary); font-size:13px;">${fishery.distanceKm ?? '?'} km · ${escapeHtml(fishery.type ?? '')}</p>
          </div>
          <button type="button" class="icon-btn" id="fav-btn" aria-label="Dodaj do ulubionych">${icons.heart}</button>
        </div>
        <div class="tabs" style="margin-top:16px;" id="fishery-tabs">
          ${TABS.map((t) => `<div class="tab ${t.id === activeTab ? 'is-active' : ''}" data-tab="${t.id}">${t.label}</div>`).join('')}
        </div>
        <div id="fishery-body" style="margin-top:16px;"></div>

        <div style="display:flex; gap:10px; margin-top:22px;">
          <button type="button" class="btn btn-primary" style="flex:1;" id="plan-btn">Zaplanuj wyprawę</button>
          <button type="button" class="btn btn-ghost" style="flex:1;" id="save-spot-btn">Zapisz miejsce</button>
        </div>
      </div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => history.back());
  root.querySelector('#fav-btn').addEventListener('click', () => showToast('Ulubione — moduł w przygotowaniu.'));
  root.querySelector('#plan-btn').addEventListener('click', () => { location.hash = `#/plan/${fishery.id}`; });
  root.querySelector('#save-spot-btn').addEventListener('click', () => {
    const label = prompt('Nazwa Twojej prywatnej miejscówki na tym łowisku:', fishery.name + ' — ');
    if (label && label.trim()) {
      savePrivateSpot({ fisheryId: fishery.id, position: fishery.coords, label: label.trim() });
      showToast('Zapisano jako prywatną miejscówkę (widoczna tylko dla Ciebie).');
    }
  });
  root.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeTab = tab.getAttribute('data-tab');
      root.querySelectorAll('[data-tab]').forEach((t) => t.classList.toggle('is-active', t === tab));
      renderBody();
    });
  });

  renderBody();
}

function statusLabel(status) {
  return { confirmed_source: 'Potwierdzone źródłowo', community_confirmed: 'Potwierdzone przez społeczność', inferred_distribution: 'Szacowane na podstawie atlasu', unknown: 'Nieznane' }[status] ?? status;
}
