import { getState, createPlannedTrip, startPlannedTrip, addParticipantToTrip, showToast } from '../../state/store.js';
import { icons } from '../../ui/icons.js';
import { escapeHtml } from '../../ui/format.js';

export function render(root, params) {
  const fisheries = getState().fisheries;
  const gearKits = getState().gearKits;
  const friends = getState().friends;

  let selectedFisheryId = params.fisheryId ?? fisheries[0]?.id ?? '';
  let selectedSpeciesId = params.species ?? '';
  let selectedGearId = gearKits[0]?.id ?? '';
  const selectedFriendIds = new Set();

  function fisheryOptions() {
    return fisheries.map((f) => `<option value="${f.id}" ${f.id === selectedFisheryId ? 'selected' : ''}>${escapeHtml(f.name)}</option>`).join('');
  }
  function speciesOptions() {
    return `<option value="">Bez konkretnego celu</option>` + getState().species.map((s) => `<option value="${s.id}" ${s.id === selectedSpeciesId ? 'selected' : ''}>${escapeHtml(s.namePl)}</option>`).join('');
  }
  function gearOptions() {
    return gearKits.map((g) => `<option value="${g.id}" ${g.id === selectedGearId ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('');
  }

  const defaultDate = new Date(Date.now() + 24 * 3600 * 1000);
  const dateStr = defaultDate.toISOString().slice(0, 10);
  const timeStr = '07:00';

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header">
        <button type="button" class="icon-btn" id="back-btn" aria-label="Wstecz">${icons.back}</button>
        <h1>Zaplanuj wyprawę</h1>
      </div>
      <div class="section" style="padding-top:0;">
        <div class="field">
          <label for="p-fishery">Łowisko</label>
          <select id="p-fishery">${fisheryOptions()}</select>
        </div>
        <div style="display:flex; gap:10px;">
          <div class="field" style="flex:1;"><label for="p-date">Data</label><input type="date" id="p-date" value="${dateStr}"></div>
          <div class="field" style="flex:1;"><label for="p-time">Godzina</label><input type="time" id="p-time" value="${timeStr}"></div>
        </div>
        <div class="field">
          <label for="p-species">Cel (opcjonalnie)</label>
          <select id="p-species">${speciesOptions()}</select>
        </div>
        <div class="field">
          <label for="p-gear">Sprzęt</label>
          <select id="p-gear">${gearOptions()}</select>
        </div>
        <div class="field">
          <label>Znajomi</label>
          <div class="radio-group">
            ${friends.map((f) => `<label class="radio-pill" data-friend="${f.id}"><input type="checkbox" value="${f.id}">${escapeHtml(f.displayName)}</label>`).join('')}
          </div>
        </div>
        <div class="field">
          <label for="p-note">Notatka</label>
          <textarea id="p-note" placeholder="Np. sprawdzić poziom wody przed wyjazdem…"></textarea>
        </div>
        <div class="unverified-note" style="margin-bottom:18px;">Przygotowanie mapy offline dla tego obszaru — moduł w przygotowaniu (wymaga wybranego dostawcy map, patrz otwarte decyzje w CLAUDE.md).</div>
        <div style="display:flex; gap:10px;">
          <button type="button" class="btn btn-ghost" style="flex:1;" id="save-plan-btn">Zapisz plan</button>
          <button type="button" class="btn btn-primary" style="flex:1;" id="start-now-btn">Rozpocznij teraz</button>
        </div>
      </div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => history.back());
  root.querySelector('#p-fishery').addEventListener('change', (e) => { selectedFisheryId = e.target.value; });
  root.querySelector('#p-species').addEventListener('change', (e) => { selectedSpeciesId = e.target.value; });
  root.querySelector('#p-gear').addEventListener('change', (e) => { selectedGearId = e.target.value; });
  root.querySelectorAll('[data-friend]').forEach((pill) => {
    pill.addEventListener('click', () => {
      const id = pill.getAttribute('data-friend');
      const checkbox = pill.querySelector('input');
      if (selectedFriendIds.has(id)) { selectedFriendIds.delete(id); checkbox.checked = false; }
      else { selectedFriendIds.add(id); checkbox.checked = true; }
      pill.classList.toggle('is-checked', selectedFriendIds.has(id));
    });
  });

  function collectFields() {
    const date = root.querySelector('#p-date').value;
    const time = root.querySelector('#p-time').value;
    const plannedFor = date ? new Date(`${date}T${time || '00:00'}`).toISOString() : null;
    return {
      fisheryId: selectedFisheryId || undefined,
      plannedFor,
      goalSpeciesId: selectedSpeciesId || undefined,
      gearKitId: selectedGearId || undefined,
    };
  }

  root.querySelector('#save-plan-btn').addEventListener('click', () => {
    const trip = createPlannedTrip(collectFields());
    selectedFriendIds.forEach((fid) => addParticipantToTrip(trip.id, fid));
    showToast('Plan wyprawy zapisany na tym urządzeniu.');
    location.hash = '#/trips';
  });

  root.querySelector('#start-now-btn').addEventListener('click', () => {
    const trip = createPlannedTrip(collectFields());
    selectedFriendIds.forEach((fid) => addParticipantToTrip(trip.id, fid));
    startPlannedTrip(trip.id);
    location.hash = '#/trip/active';
  });
}
