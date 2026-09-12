import { getState } from '../../state/store.js';
import { icons } from '../../ui/icons.js';
import { escapeHtml, formatDatePl } from '../../ui/format.js';

export function render(root) {
  const spots = getState().privateSpots;

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header">
        <button type="button" class="icon-btn" id="back-btn" aria-label="Wstecz">${icons.back}</button>
        <h1>Moje miejscówki</h1>
      </div>
      <div class="section" style="padding-top:0;">
        ${spots.length === 0 ? `
          <div class="empty-state">
            <h3>Brak zapisanych miejscówek</h3>
            <p>Po zakończonej wyprawie Fishi zapyta, czy chcesz zapamiętać miejsce. Możesz też zapisać je z profilu łowiska.</p>
          </div>` : spots.map((s) => {
            const fishery = getState().fisheries.find((f) => f.id === s.fisheryId);
            return `
              <div class="list-row">
                <div class="thumb" style="display:flex; align-items:center; justify-content:center;">${icons.water}</div>
                <div class="main">
                  <div class="title">${escapeHtml(s.label)}</div>
                  <div class="sub">${escapeHtml(fishery?.name ?? 'Miejsce prywatne')} · ${formatDatePl(s.createdAt)}</div>
                </div>
                <span class="badge badge-muted">Tylko ja</span>
              </div>`;
          }).join('')}
      </div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => history.back());
}
