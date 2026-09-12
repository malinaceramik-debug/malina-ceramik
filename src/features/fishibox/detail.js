import { getState, filterMapBySpecies } from '../../state/store.js';
import { computePersonalBests } from '../../domain/catch.js';
import { icons } from '../../ui/icons.js';
import { getFishArt } from '../../ui/fishArt.js';
import { escapeHtml, formatDatePl } from '../../ui/format.js';

const TABS = [
  { id: 'overview', label: 'Przegląd' },
  { id: 'regulations', label: 'Zasady' },
  { id: 'atlas', label: 'Atlas' },
  { id: 'stats', label: 'Statystyki' },
];

export function render(root, params) {
  const species = getState().species.find((s) => s.id === params.id);
  if (!species) {
    root.innerHTML = `<div class="screen"><div class="empty-state"><h3>Nie znaleziono gatunku</h3></div></div>`;
    return;
  }

  let activeTab = 'overview';

  function myCatches() {
    return getState().catches.filter((c) => c.ownerId === getState().user.id && c.speciesId === species.id);
  }

  function renderBody() {
    const body = root.querySelector('#species-body');
    const mine = myCatches();
    if (activeTab === 'overview') {
      body.innerHTML = `
        <div class="card" style="margin-bottom:14px;">
          <div class="section-title" style="margin-bottom:6px;">Rozpoznawanie</div>
          <p style="font-size:13.5px; color:var(--text-secondary); margin:0;">${escapeHtml(species.identification ?? '—')}</p>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <div class="section-title" style="margin-bottom:6px;">Środowisko</div>
          <p style="font-size:13.5px; color:var(--text-secondary); margin:0;">${escapeHtml(species.habitat ?? '—')}</p>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <div class="section-title" style="margin-bottom:6px;">Zachowanie</div>
          <p style="font-size:13.5px; color:var(--text-secondary); margin:0;">${escapeHtml(species.behavior ?? '—')}</p>
        </div>
        <div class="card">
          <div class="section-title" style="margin-bottom:6px;">Jak łowić <span class="demo-tag">treść redakcyjna</span></div>
          <p style="font-size:12.5px; color:var(--text-muted); margin:0 0 8px 0;">Metody: ${species.fishingKnowledge.methods.map(escapeHtml).join(', ')}</p>
          <p style="font-size:12.5px; color:var(--text-muted); margin:0 0 8px 0;">Typowy zestaw: ${species.fishingKnowledge.typicalRigs.map(escapeHtml).join(', ')}</p>
          <p style="font-size:12.5px; color:var(--text-muted); margin:0;">Wskazówka: ${species.fishingKnowledge.tips.map(escapeHtml).join(' ')}</p>
        </div>
      `;
    } else if (activeTab === 'regulations') {
      body.innerHTML = `
        <div class="unverified-note" style="margin-bottom:14px;">
          Brak zweryfikowanych danych o okresie ochronnym, wymiarze i limitach dla tego gatunku. Fishi pokaże realne przepisy dopiero po podłączeniu zweryfikowanego źródła (patrz fishi-data-provenance).
        </div>
        <div class="card">
          <div class="section-title" style="margin-bottom:6px;">Rekord Polski</div>
          <p style="font-size:13px; color:var(--text-secondary); margin:0;">${species.recordPl ? `${species.recordPl.value} ${species.recordPl.unit}` : 'Brak zweryfikowanych danych.'}</p>
        </div>
      `;
    } else if (activeTab === 'atlas') {
      body.innerHTML = `
        <div class="card" style="margin-bottom:14px;">
          <div class="section-title" style="margin-bottom:6px;">Taksonomia</div>
          <p style="font-size:13.5px; color:var(--text-secondary); margin:0;">Rząd: ${escapeHtml(species.taxonomy?.order ?? '—')} · Rodzina: ${escapeHtml(species.taxonomy?.family ?? '—')}</p>
        </div>
        <button type="button" class="btn btn-teal btn-block" id="find-places-btn">${icons.map}<span>Znajdź miejsca tego gatunku</span></button>
      `;
      body.querySelector('#find-places-btn').addEventListener('click', () => {
        filterMapBySpecies(species.id);
        location.hash = '#/map';
      });
    } else {
      const { lengthPB, weightPB } = computePersonalBests(mine, species.id);
      body.innerHTML = `
        <div class="stat-row" style="margin-bottom:14px;">
          <div class="stat-tile"><div class="label">Zapisane połowy</div><div class="value">${mine.length}</div></div>
          <div class="stat-tile"><div class="label">Pierwszy połów</div><div class="value" style="font-size:13px;">${mine.length ? formatDatePl(mine[0].caughtAt) : '—'}</div></div>
        </div>
        <div class="stat-row">
          <div class="stat-tile"><div class="label">PB długość</div><div class="value">${lengthPB ? lengthPB.length.value + ' cm' : '—'}</div></div>
          <div class="stat-tile"><div class="label">PB waga</div><div class="value">${weightPB ? weightPB.weight.value + ' kg' : '—'}</div></div>
        </div>
        ${mine.length === 0 ? '<p style="color:var(--text-muted); font-size:12.5px; margin-top:14px;">Nie masz jeszcze zapisanych połowów tego gatunku.</p>' : ''}
      `;
    }
  }

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header">
        <button type="button" class="icon-btn" id="back-btn" aria-label="Wstecz">${icons.back}</button>
        <div class="spacer"></div>
      </div>
      <div class="section" style="padding-top:0;">
        <div class="card species-hero-art" style="margin-bottom:16px; padding:0;">${getFishArt(species.id)}</div>
        <h1 style="margin:0; font-size:22px;">${escapeHtml(species.namePl)}</h1>
        <p style="margin:2px 0 16px 0; font-style:italic; color:var(--text-muted);">${escapeHtml(species.nameLatin)}</p>
        <div class="tabs" style="margin-bottom:16px;">
          ${TABS.map((t) => `<div class="tab ${t.id === activeTab ? 'is-active' : ''}" data-tab="${t.id}">${t.label}</div>`).join('')}
        </div>
        <div id="species-body"></div>
        <button type="button" class="btn btn-primary btn-block" id="plan-for-species" style="margin-top:20px;">Zaplanuj wyprawę na ten gatunek</button>
      </div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => history.back());
  root.querySelector('#plan-for-species').addEventListener('click', () => { location.hash = `#/plan?species=${species.id}`; });
  root.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeTab = tab.getAttribute('data-tab');
      root.querySelectorAll('[data-tab]').forEach((t) => t.classList.toggle('is-active', t === tab));
      renderBody();
    });
  });

  renderBody();
}
