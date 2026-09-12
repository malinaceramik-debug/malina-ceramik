import { getState, savePrivateSpot, assignGearToTrip, showToast } from '../../state/store.js';
import * as Trip from '../../domain/trip.js';
import { icons } from '../../ui/icons.js';
import { formatDuration, formatDatePl, formatTimePl, escapeHtml } from '../../ui/format.js';

export function render(root, params) {
  const trip = getState().trips.find((t) => t.id === params.id);
  if (!trip) {
    root.innerHTML = `<div class="screen"><div class="empty-state"><h3>Nie znaleziono wyprawy</h3></div></div>`;
    return;
  }
  const fishery = getState().fisheries.find((f) => f.id === trip.fisheryId);
  const catches = getState().catches.filter((c) => c.tripId === trip.id);
  const mine = catches.filter((c) => c.ownerId === getState().user.id);
  const friendCatches = catches.filter((c) => c.ownerId !== getState().user.id);

  const highlights = [];
  if (mine.length > 0) {
    const withLength = mine.filter((c) => c.length);
    if (withLength.length) {
      const biggest = withLength.reduce((a, b) => (a.length.value > b.length.value ? a : b));
      const species = getState().species.find((s) => s.id === biggest.speciesId);
      highlights.push(`Największa ryba dnia: ${species?.namePl ?? 'nieznany gatunek'} (${biggest.length.value} cm).`);
    }
    const allReleased = mine.every((c) => c.releaseStatus === 'released');
    if (allReleased) highlights.push('Wszystkie ryby wypuszczone.');
  }
  if (friendCatches.length > 0) highlights.push(`Znajomi zapisali ${friendCatches.length} ${friendCatches.length === 1 ? 'połów' : 'połowy'}.`);

  root.innerHTML = `
    <div class="screen">
      <div class="fishery-hero" style="background:linear-gradient(135deg,#123a44,#081b22); height:200px;"></div>
      <div class="section" style="padding-top:16px;">
        <h1 style="margin:0 0 4px 0; font-size:20px;">${mine.length > 0 ? 'Dobrze było być nad wodą' : 'Nie zapisano połowów'}</h1>
        <p style="color:var(--text-secondary); font-size:13.5px; margin:0 0 18px 0;">${formatDatePl(trip.startAt)} · ${escapeHtml(fishery?.name ?? trip.privatePlaceName ?? 'Miejsce prywatne')}</p>

        <div class="stat-row" style="margin-bottom:18px;">
          <div class="stat-tile"><div class="label">Czas nad wodą</div><div class="value">${formatDuration(Trip.totalDurationMs(trip))}</div></div>
          <div class="stat-tile"><div class="label">Zapisane ryby</div><div class="value">${catches.length}</div></div>
          <div class="stat-tile"><div class="label">Uczestnicy</div><div class="value">${1 + trip.participantIds.length}</div></div>
        </div>

        ${highlights.length ? `
          <div class="section-title">Najważniejsze momenty</div>
          <div class="card" style="margin-bottom:18px;">
            <ul style="margin:0; padding-left:18px; font-size:13.5px; color:var(--text-secondary);">
              ${highlights.map((h) => `<li>${h}</li>`).join('')}
            </ul>
          </div>` : `
          <div class="unverified-note" style="margin-bottom:18px;">
            Brak zapisanych połowów — wyprawa nadal ma wartość: ${formatDuration(Trip.totalDurationMs(trip))} nad wodą${fishery ? ` przy ${escapeHtml(fishery.name)}` : ''}.
          </div>`}

        <button type="button" class="btn btn-teal btn-block" id="replay-btn" style="margin-bottom:12px;">${icons.play}<span>Zobacz replay</span></button>

        ${!hasSavedSpotForTrip(trip) ? `
          <div class="card" style="margin-bottom:12px;">
            <div class="section-title" style="margin-bottom:8px;">Zapamiętać to miejsce?</div>
            <div class="field"><input type="text" id="spot-label" placeholder="Np. Pod trzcinami"></div>
            <button type="button" class="btn btn-ghost btn-block" id="save-spot-btn">Zapisz jako prywatną miejscówkę</button>
          </div>` : ''}

        ${!trip.gearKitId ? `
          <div class="card" style="margin-bottom:12px;">
            <div class="section-title" style="margin-bottom:6px;">Dodaj mój sprzęt</div>
            <p style="font-size:12.5px; color:var(--text-secondary); margin:0 0 10px 0;">Chcesz przypisać zestaw, którym dzisiaj łowiłeś?</p>
            <select id="assign-gear-select" style="width:100%; margin-bottom:10px;">
              ${getState().gearKits.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('')}
            </select>
            <button type="button" class="btn btn-ghost btn-block" id="assign-gear-btn">Przypisz zestaw do tej wyprawy</button>
          </div>` : ''}

        <button type="button" class="btn btn-ghost btn-block" id="fishibox-btn" style="margin-bottom:12px;">${icons.box}<span>Zobacz FishiBox</span></button>
        <button type="button" class="btn btn-primary btn-block" id="done-btn">Gotowe</button>
      </div>
    </div>
  `;

  root.querySelector('#replay-btn').addEventListener('click', () => { location.hash = `#/trip/${trip.id}/replay`; });
  root.querySelector('#fishibox-btn').addEventListener('click', () => { location.hash = '#/fishibox'; });
  root.querySelector('#done-btn').addEventListener('click', () => { location.hash = '#/map'; });

  root.querySelector('#save-spot-btn')?.addEventListener('click', () => {
    const label = root.querySelector('#spot-label').value.trim();
    if (!label) { showToast('Podaj nazwę miejscówki.'); return; }
    savePrivateSpot({ fisheryId: trip.fisheryId, position: fishery?.coords ?? null, label, createdFromTripId: trip.id });
    showToast('Zapisano prywatną miejscówkę.');
    render(root, params);
  });

  root.querySelector('#assign-gear-btn')?.addEventListener('click', () => {
    const gearId = root.querySelector('#assign-gear-select').value;
    // This patches the trip's own gearKitId only — existing catches keep
    // whatever gear snapshot they were created with (immutable per
    // fishi-domain-integrity), so this never rewrites historical catches.
    assignGearToTrip(trip.id, gearId);
    showToast('Zestaw przypisany do wyprawy.');
    render(root, params);
  });
}

function hasSavedSpotForTrip(trip) {
  return getState().privateSpots.some((s) => s.createdFromTripId === trip.id);
}
