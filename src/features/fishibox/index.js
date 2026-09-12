import { getState } from '../../state/store.js';
import { icons } from '../../ui/icons.js';
import { getFishArt } from '../../ui/fishArt.js';
import { escapeHtml } from '../../ui/format.js';

const FILTERS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'caught', label: 'W Twojej historii' },
  { id: 'not_caught', label: 'Jeszcze przed Tobą' },
];

export function render(root) {
  let query = '';
  let filter = 'all';

  function myCatchSpeciesIds() {
    return new Set(getState().catches.filter((c) => c.ownerId === getState().user.id && c.speciesId).map((c) => c.speciesId));
  }

  function filteredSpecies() {
    const mine = myCatchSpeciesIds();
    return getState().species.filter((s) => {
      if (query && !`${s.namePl} ${s.nameLatin}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === 'caught' && !mine.has(s.id)) return false;
      if (filter === 'not_caught' && mine.has(s.id)) return false;
      return true;
    });
  }

  function renderGrid() {
    const mine = myCatchSpeciesIds();
    const list = filteredSpecies();
    const grid = root.querySelector('#fishibox-grid');
    if (list.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Brak wyników</h3><p>Zmień filtr lub wyszukiwanie.</p></div>`;
      return;
    }
    grid.innerHTML = list.map((s) => `
      <div class="species-card" data-species="${s.id}">
        <div class="art">${getFishArt(s.id)}</div>
        <div class="body">
          <p class="name-pl">${escapeHtml(s.namePl)}</p>
          <p class="name-latin">${escapeHtml(s.nameLatin)}</p>
          <span class="badge ${mine.has(s.id) ? 'badge-teal' : 'badge-muted'}">${mine.has(s.id) ? 'W Twojej historii' : 'Jeszcze przed Tobą'}</span>
        </div>
      </div>`).join('');
    grid.querySelectorAll('[data-species]').forEach((el) => {
      el.addEventListener('click', () => { location.hash = `#/species/${el.getAttribute('data-species')}`; });
    });
  }

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header" style="position:static; background:none;">
        <h1>FishiBox</h1>
      </div>
      <div class="section" style="padding-top:0;">
        <div class="search-bar" style="margin-bottom:12px;">
          <span class="search-icon">${icons.search}</span>
          <input id="fb-search" type="search" placeholder="Szukaj gatunku…" />
        </div>
        <div class="tabs" style="margin-bottom:16px;">
          ${FILTERS.map((f) => `<div class="tab ${f.id === filter ? 'is-active' : ''}" data-filter="${f.id}">${f.label}</div>`).join('')}
        </div>
        <div class="fishibox-grid" id="fishibox-grid"></div>
      </div>
    </div>
  `;

  root.querySelector('#fb-search').addEventListener('input', (e) => { query = e.target.value; renderGrid(); });
  root.querySelectorAll('[data-filter]').forEach((tab) => {
    tab.addEventListener('click', () => {
      filter = tab.getAttribute('data-filter');
      root.querySelectorAll('[data-filter]').forEach((t) => t.classList.toggle('is-active', t === tab));
      renderGrid();
    });
  });

  renderGrid();
}
