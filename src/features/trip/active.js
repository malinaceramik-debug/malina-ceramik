import {
  getState, subscribe, getActiveTrip, pauseActiveTrip, resumeActiveTrip, finishActiveTrip,
  inviteFriendToActiveTrip, dismissForgottenEnd, addFriendCatch, showToast,
} from '../../state/store.js';
import { listInvitableFriends, simulateFriendCatch } from '../../adapters/friends.js';
import { getDemoWeatherSnapshot } from '../../adapters/weather.js';
import * as Trip from '../../domain/trip.js';
import { icons } from '../../ui/icons.js';
import { getFishArt } from '../../ui/fishArt.js';
import { renderMapTerrainSvg } from '../../ui/mapArt.js';
import { formatHms, formatCatchCount, escapeHtml } from '../../ui/format.js';

export function render(root) {
  const trip = getActiveTrip();
  if (!trip) {
    root.innerHTML = `<div class="screen"><div class="empty-state"><h3>Brak aktywnej wyprawy</h3><p>Rozpocznij wyprawę z mapy.</p></div></div>`;
    return;
  }

  const weather = getDemoWeatherSnapshot();
  const fishery = getState().fisheries.find((f) => f.id === trip.fisheryId);
  let collapsed = false;
  const friendCancelers = [];

  root.innerHTML = `
    <div class="screen screen--map">
      <div class="map-surface" data-map-status="prototype-placeholder">
        ${renderMapTerrainSvg('trip')}
        <div id="participant-pins"></div>
        <div id="catch-markers"></div>
        <p class="map-placeholder-tag">Mapa demonstracyjna — trasa zapisywana w tle na potrzeby replayu</p>
      </div>

      <div id="forgotten-end-slot"></div>

      <div class="trip-topbar">
        <div class="trip-status-pill">
          <span class="live-dot ${trip.phase === 'paused' ? 'is-paused' : ''}" id="live-dot"></span>
          <div>
            <div class="duration" id="trip-duration">00:00:00</div>
            <div class="place">${escapeHtml(fishery?.name ?? 'Miejsce prywatne')} · ${weather.tempC}°C <span class="demo-tag">pogoda demo</span></div>
          </div>
        </div>
        <div class="trip-participants" id="participant-avatars"></div>
        <button type="button" class="icon-btn" id="invite-btn" aria-label="Zaproś znajomego">${icons.users}</button>
      </div>


      <div class="sheet" id="trip-sheet">
        <div class="collapse-handle" id="collapse-handle"><div class="sheet-handle"></div></div>
        <div class="trip-sheet-priority">
          <div class="trip-sheet-header">
            <div>
              <h2>${escapeHtml(fishery?.name ?? 'Miejsce prywatne')}</h2>
              <div class="place-sub" id="catch-count-label">${formatCatchCount(getState().catches.filter((c) => c.tripId === trip.id).length)}</div>
            </div>
          </div>
          <button type="button" class="trip-add-catch-btn" id="add-catch-btn">${icons.camera}<span>Dodaj rybę</span></button>
          <div class="trip-secondary-row">
            <button type="button" class="btn btn-ghost" style="flex:1;" id="gear-chip">${icons.gear}<span>Sprzęt</span></button>
            <button type="button" class="btn btn-ghost" style="flex:1;" id="pause-btn"></button>
          </div>
          <button type="button" class="btn btn-danger btn-block" id="finish-btn">Zakończ wyprawę</button>
        </div>
      </div>
    </div>
  `;

  function renderParticipants() {
    const t = getActiveTrip();
    const avatarsEl = root.querySelector('#participant-avatars');
    avatarsEl.innerHTML = t.participantIds.map((pid) => {
      const u = getState().friends.find((f) => f.id === pid);
      return `<span class="avatar" title="${escapeHtml(u?.displayName ?? pid)}">${u?.avatarInitial ?? '?'}</span>`;
    }).join('');

    const pinsEl = root.querySelector('#participant-pins');
    pinsEl.innerHTML = t.participantIds.map((pid, i) => {
      const u = getState().friends.find((f) => f.id === pid);
      const left = 30 + i * 22, top = 34 + (i % 2) * 14;
      return `<div class="map-marker" style="left:${left}%; top:${top}%; transform:translate(-50%,-50%);"><span class="avatar" style="border-color:var(--scan-blue);">${u?.avatarInitial ?? '?'}</span></div>`;
    }).join('');
  }

  function renderCatchMarkers() {
    const catches = getState().catches.filter((c) => c.tripId === trip.id);
    const layer = root.querySelector('#catch-markers');
    layer.innerHTML = catches.map((c, i) => {
      const left = 25 + ((i * 37) % 55) + 10;
      const top = 45 + ((i * 23) % 30);
      const species = getState().species.find((s) => s.id === c.speciesId);
      return `<div class="catch-marker" style="left:${left}%; top:${top}%;" title="${escapeHtml(species?.namePl ?? 'Nieznany gatunek')}"><span class="dot">${c.speciesId ? getFishArt(c.speciesId) : icons.water}</span></div>`;
    }).join('');
  }

  function renderCatchCount() {
    root.querySelector('#catch-count-label').textContent = `${formatCatchCount(getState().catches.filter((c) => c.tripId === trip.id).length)}`;
  }

  function renderPauseButton() {
    const t = getActiveTrip();
    const btn = root.querySelector('#pause-btn');
    if (t.phase === 'paused') {
      btn.innerHTML = `${icons.play}<span>Wznów</span>`;
    } else {
      btn.innerHTML = `${icons.pause}<span>Pauza</span>`;
    }
    root.querySelector('#live-dot').classList.toggle('is-paused', t.phase === 'paused');
  }

  function renderForgottenEndBanner() {
    const t = getActiveTrip();
    const slot = root.querySelector('#forgotten-end-slot');
    if (!t.forgottenEndSuggestion) { slot.innerHTML = ''; return; }
    const suggestedTime = new Date(t.forgottenEndSuggestion.suggestedAt);
    const timeLabel = `${String(suggestedTime.getHours()).padStart(2, '0')}:${String(suggestedTime.getMinutes()).padStart(2, '0')}`;
    slot.innerHTML = `
      <div class="forgotten-end-banner">
        <strong>Czy skończyłeś już łowienie?</strong>
        <p>${escapeHtml(t.forgottenEndSuggestion.reason)}</p>
        <div class="actions">
          <button type="button" class="btn btn-teal btn-sm" id="fe-end">Zakończ o ${timeLabel}</button>
          <button type="button" class="btn btn-ghost btn-sm" id="fe-change">Zmień godzinę</button>
          <button type="button" class="btn btn-ghost btn-sm" id="fe-continue">Nadal łowię</button>
        </div>
      </div>`;
    slot.querySelector('#fe-end').addEventListener('click', () => {
      finishActiveTrip({ at: t.forgottenEndSuggestion.suggestedAt });
      location.hash = `#/trip/${t.id}/summary`;
    });
    slot.querySelector('#fe-change').addEventListener('click', () => {
      const input = prompt('Podaj godzinę zakończenia (GG:MM):', timeLabel);
      if (input && /^\d{1,2}:\d{2}$/.test(input)) {
        const [h, m] = input.split(':').map(Number);
        const at = new Date(); at.setHours(h, m, 0, 0);
        finishActiveTrip({ at: at.toISOString() });
        location.hash = `#/trip/${t.id}/summary`;
      }
    });
    slot.querySelector('#fe-continue').addEventListener('click', () => dismissForgottenEnd(t.id));
  }

  function tick() {
    const t = getActiveTrip();
    if (!t) return;
    root.querySelector('#trip-duration').textContent = formatHms(Trip.totalDurationMs(t));
  }

  renderParticipants();
  renderCatchMarkers();
  renderPauseButton();
  renderForgottenEndBanner();
  tick();
  const timer = setInterval(tick, 1000);

  root.querySelector('#collapse-handle').addEventListener('click', () => {
    collapsed = !collapsed;
    root.querySelector('#trip-sheet').classList.toggle('is-collapsed', collapsed);
  });
  root.querySelector('#add-catch-btn').addEventListener('click', () => { location.hash = `#/trip/${trip.id}/catch`; });
  root.querySelector('#gear-chip').addEventListener('click', () => { location.hash = '#/gear'; });
  root.querySelector('#pause-btn').addEventListener('click', () => {
    const t = getActiveTrip();
    if (t.phase === 'paused') resumeActiveTrip(); else pauseActiveTrip();
    renderPauseButton();
  });
  root.querySelector('#finish-btn').addEventListener('click', () => {
    finishActiveTrip();
    location.hash = `#/trip/${trip.id}/summary`;
  });
  root.querySelector('#invite-btn').addEventListener('click', () => openInviteSheet());

  function openInviteSheet() {
    const t = getActiveTrip();
    const available = listInvitableFriends().filter((f) => !t.participantIds.includes(f.id));
    if (available.length === 0) { showToast('Wszyscy dostępni znajomi już dołączyli.'); return; }
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
      <div class="celebration-card" style="text-align:left; max-width:320px;">
        <h3 style="margin-top:0;">Zaproś znajomego</h3>
        ${available.map((f) => `<button type="button" class="btn btn-ghost btn-block" style="margin-bottom:8px;" data-invite="${f.id}">${f.displayName}</button>`).join('')}
        <button type="button" class="btn btn-ghost btn-block" id="invite-cancel">Anuluj</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('[data-invite]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fid = btn.getAttribute('data-invite');
        inviteFriendToActiveTrip(fid);
        renderParticipants();
        showToast(`${btn.textContent} dołączył do wyprawy.`);
        const friend = available.find((f) => f.id === fid);
        const cancel = simulateFriendCatch({
          friend, delayMs: 5000 + Math.random() * 4000,
          onCatch: ({ friend: f, species }) => {
            addFriendCatch({ friendId: f.id, speciesId: species.id });
            renderCatchMarkers();
            renderCatchCount();
            showToast(`${f.displayName} zapisał ${species.namePl.toLowerCase()}a`);
          },
        });
        friendCancelers.push(cancel);
        document.body.removeChild(overlay);
      });
    });
    overlay.querySelector('#invite-cancel').addEventListener('click', () => document.body.removeChild(overlay));
  }

  const unsubscribe = subscribe(() => {
    renderForgottenEndBanner();
  });

  return () => {
    clearInterval(timer);
    unsubscribe();
    friendCancelers.forEach((c) => c());
  };
}
