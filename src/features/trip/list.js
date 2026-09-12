import { getState, startPlannedTrip } from '../../state/store.js';
import { formatDatePl, formatDuration, plPlural, escapeHtml } from '../../ui/format.js';
import * as Trip from '../../domain/trip.js';

const PHASE_LABEL = { planned: 'Zaplanowana', active: 'Trwa', paused: 'Pauza', ended: 'Zakończona' };
const PHASE_BADGE = { planned: 'badge-muted', active: 'badge-teal', paused: 'badge-gold', ended: 'badge-muted' };

export function render(root) {
  const trips = [...getState().trips].sort((a, b) => new Date(b.plannedFor ?? b.startAt ?? b.createdAt) - new Date(a.plannedFor ?? a.startAt ?? a.createdAt));

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header" style="position:static; background:none;"><h1>Wyprawy</h1></div>
      <div class="section" style="padding-top:0;">
        ${trips.length === 0 ? `
          <div class="empty-state">
            <h3>Brak wypraw</h3>
            <p>Rozpocznij spontaniczną wyprawę z mapy albo zaplanuj następną.</p>
          </div>` : trips.map((t) => tripRow(t)).join('')}
      </div>
    </div>
  `;

  root.querySelectorAll('[data-trip]').forEach((row) => {
    row.addEventListener('click', () => {
      const trip = getState().trips.find((t) => t.id === row.getAttribute('data-trip'));
      if (!trip) return;
      if (trip.phase === 'planned') {
        startPlannedTrip(trip.id);
        location.hash = '#/trip/active';
      } else if (trip.phase === 'ended') {
        location.hash = `#/trip/${trip.id}/summary`;
      } else {
        location.hash = '#/trip/active';
      }
    });
  });
}

function tripRow(t) {
  const fishery = getState().fisheries.find((f) => f.id === t.fisheryId);
  const catches = getState().catches.filter((c) => c.tripId === t.id);
  const dateLabel = t.startAt ? formatDatePl(t.startAt) : (t.plannedFor ? `Plan: ${formatDatePl(t.plannedFor)}` : '—');
  const durationLabel = t.startAt ? formatDuration(Trip.totalDurationMs(t)) : '';
  return `
    <div class="list-row" data-trip="${t.id}">
      <div class="thumb" style="background:linear-gradient(135deg,#123a44,#0b2430); display:flex; align-items:center; justify-content:center;">🎣</div>
      <div class="main">
        <div class="title">${escapeHtml(fishery?.name ?? t.privatePlaceName ?? 'Nieznane miejsce')}</div>
        <div class="sub">${dateLabel}${durationLabel ? ' · ' + durationLabel : ''} · ${catches.length} ${plPlural(catches.length, 'połów', 'połowy', 'połowów')}</div>
      </div>
      <span class="badge ${PHASE_BADGE[t.phase]}">${PHASE_LABEL[t.phase]}</span>
    </div>`;
}
