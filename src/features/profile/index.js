import { getState, getAchievements } from '../../state/store.js';
import { computePersonalBests } from '../../domain/catch.js';
import * as Trip from '../../domain/trip.js';
import { icons } from '../../ui/icons.js';
import { formatDuration, escapeHtml } from '../../ui/format.js';

export function render(root) {
  const user = getState().user;
  const trips = getState().trips.filter((t) => t.phase !== 'planned');
  const myCatches = getState().catches.filter((c) => c.ownerId === user.id);
  const distinctSpecies = new Set(myCatches.filter((c) => c.speciesId).map((c) => c.speciesId));
  const totalTimeMs = trips.reduce((sum, t) => sum + Trip.totalDurationMs(t), 0);
  const sharedTrips = trips.filter((t) => t.participantIds.length > 0).length;
  const earned = getAchievements();

  const records = [...distinctSpecies].map((sid) => {
    const species = getState().species.find((s) => s.id === sid);
    const { lengthPB, weightPB } = computePersonalBests(myCatches, sid);
    return { species, lengthPB, weightPB };
  }).filter((r) => r.lengthPB || r.weightPB);

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header" style="position:static; background:none;"><h1>Profil</h1></div>
      <div class="section" style="padding-top:0;">
        <div class="profile-header" style="margin-bottom:20px;">
          <div class="big-avatar">${user.displayName.slice(0, 1)}</div>
          <div>
            <h2>${escapeHtml(user.displayName)}</h2>
            <div class="sub">${trips.length} ${trips.length === 1 ? 'wyprawa' : 'wypraw'} · ${earned.size}/5 osiągnięć</div>
          </div>
        </div>

        <div class="stat-row" style="margin-bottom:10px;">
          <div class="stat-tile"><div class="label">Czas nad wodą</div><div class="value">${formatDuration(totalTimeMs)}</div></div>
          <div class="stat-tile"><div class="label">Gatunki</div><div class="value">${distinctSpecies.size}</div></div>
        </div>
        <div class="stat-row" style="margin-bottom:20px;">
          <div class="stat-tile"><div class="label">Połowy</div><div class="value">${myCatches.length}</div></div>
          <div class="stat-tile"><div class="label">Wspólne wyprawy</div><div class="value">${sharedTrips}</div></div>
        </div>

        ${records.length ? `
          <div class="section-title">Rekordy osobiste</div>
          <div class="card" style="margin-bottom:18px;">
            ${records.map((r) => `
              <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line);">
                <span>${escapeHtml(r.species.namePl)}</span>
                <span style="color:var(--text-secondary); font-size:13px;">${r.lengthPB ? r.lengthPB.length.value + ' cm' : ''} ${r.weightPB ? r.weightPB.weight.value + ' kg' : ''}</span>
              </div>`).join('')}
          </div>` : ''}

        <div class="list-row" id="go-achievements"><div class="thumb" style="display:flex;align-items:center;justify-content:center;">${icons.award}</div><div class="main"><div class="title">Osiągnięcia</div><div class="sub">${earned.size}/5 zdobytych</div></div></div>
        <div class="list-row" id="go-spots"><div class="thumb" style="display:flex;align-items:center;justify-content:center;">${icons.water}</div><div class="main"><div class="title">Moje miejscówki</div><div class="sub">${getState().privateSpots.length} zapisanych</div></div></div>
        <div class="list-row" id="go-gear"><div class="thumb" style="display:flex;align-items:center;justify-content:center;">${icons.gear}</div><div class="main"><div class="title">Ekwipunek</div><div class="sub">${getState().gearKits.length} zestawów</div></div></div>
        <div class="list-row" id="go-trips"><div class="thumb" style="display:flex;align-items:center;justify-content:center;">${icons.trips}</div><div class="main"><div class="title">Historia wypraw</div><div class="sub">Zobacz wszystkie</div></div></div>
        <div class="list-row" id="go-demo"><div class="thumb" style="display:flex;align-items:center;justify-content:center;">${icons.bolt}</div><div class="main"><div class="title">Tryb demo</div><div class="sub">Przełącz scenariusz testowy</div></div></div>
      </div>
    </div>
  `;

  root.querySelector('#go-achievements').addEventListener('click', () => { location.hash = '#/achievements'; });
  root.querySelector('#go-spots').addEventListener('click', () => { location.hash = '#/spots'; });
  root.querySelector('#go-gear').addEventListener('click', () => { location.hash = '#/gear'; });
  root.querySelector('#go-trips').addEventListener('click', () => { location.hash = '#/trips'; });
  root.querySelector('#go-demo').addEventListener('click', () => { location.hash = '#/demo'; });
}
