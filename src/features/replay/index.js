import { getState } from '../../state/store.js';
import { icons } from '../../ui/icons.js';
import { renderMapTerrainSvg } from '../../ui/mapArt.js';
import { formatTimePl, escapeHtml } from '../../ui/format.js';

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildPath(trip, fishery) {
  if (trip.routeSegments.length >= 2) {
    const lats = trip.routeSegments.map((p) => p.lat);
    const lons = trip.routeSegments.map((p) => p.lon);
    const latMin = Math.min(...lats), latMax = Math.max(...lats);
    const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
    return {
      isReal: true,
      points: trip.routeSegments.map((p) => ({
        left: 20 + (lonMax > lonMin ? (p.lon - lonMin) / (lonMax - lonMin) : 0.5) * 60,
        top: 20 + (1 - (latMax > latMin ? (p.lat - latMin) / (latMax - latMin) : 0.5)) * 60,
      })),
    };
  }
  // No real GPS track recorded for this trip — synthesize an illustrative
  // loop so replay is still demonstrable. Always labeled, never presented
  // as a recorded path (see fishi-domain-integrity).
  const base = fishery ? 50 : 50;
  return {
    isReal: false,
    points: [
      { left: base - 18, top: 55 }, { left: base - 6, top: 38 }, { left: base + 10, top: 32 },
      { left: base + 22, top: 46 }, { left: base + 8, top: 62 }, { left: base - 10, top: 58 },
    ],
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

function positionAt(points, t) {
  const segCount = points.length - 1;
  const scaled = Math.min(0.999999, Math.max(0, t)) * segCount;
  const idx = Math.floor(scaled);
  const localT = scaled - idx;
  const a = points[idx], b = points[Math.min(idx + 1, points.length - 1)];
  return { left: lerp(a.left, b.left, localT), top: lerp(a.top, b.top, localT) };
}

export function render(root, params) {
  const trip = getState().trips.find((t) => t.id === params.id);
  if (!trip || !trip.startAt) {
    root.innerHTML = `<div class="screen"><div class="empty-state"><h3>Brak danych do replayu</h3></div></div>`;
    return;
  }
  const fishery = getState().fisheries.find((f) => f.id === trip.fisheryId);
  const path = buildPath(trip, fishery);
  const startMs = new Date(trip.startAt).getTime();
  const endMs = new Date(trip.endAt ?? Date.now()).getTime();
  const durationMs = Math.max(1, endMs - startMs);

  const catches = getState().catches.filter((c) => c.tripId === trip.id).sort((a, b) => new Date(a.caughtAt) - new Date(b.caughtAt));
  const events = catches.map((c) => ({
    t: Math.min(1, Math.max(0, (new Date(c.caughtAt).getTime() - startMs) / durationMs)),
    catchRef: c,
    isMine: c.ownerId === getState().user.id,
  }));

  const reduced = prefersReducedMotion();
  let t = reduced ? 1 : 0;
  let playing = false;
  let timer = null;
  const PLAYBACK_MS = 9000;

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header">
        <button type="button" class="icon-btn" id="back-btn" aria-label="Wstecz">${icons.back}</button>
        <h1>Replay wyprawy</h1>
      </div>
      <div class="replay-stage">
        ${renderMapTerrainSvg('replay')}
        <div class="replay-track" id="replay-track">
          ${!path.isReal ? '<p class="map-placeholder-tag" style="bottom:10px;">Trasa przykładowa — brak zarejestrowanego GPS dla tej wyprawy</p>' : ''}
          ${events.map((ev, i) => {
            const pos = positionAt(path.points, ev.t);
            const species = getState().species.find((s) => s.id === ev.catchRef.speciesId);
            return `<div class="replay-ping" data-ping="${i}" style="left:${pos.left}%; top:${pos.top}%; opacity:0;">
              <span class="dot" style="width:20px;height:20px;border-radius:50%;background:${ev.isMine ? 'var(--gold-strong)' : 'var(--scan-blue)'}; display:flex; align-items:center; justify-content:center; font-size:10px;">${ev.isMine ? '🎣' : '👤'}</span>
            </div>`;
          }).join('')}
          <div class="replay-dot" id="replay-dot"></div>
        </div>
      </div>
      <div class="replay-controls">
        <button type="button" class="icon-btn" id="reset-btn" aria-label="Reset">↺</button>
        <button type="button" class="icon-btn" id="play-btn" aria-label="Odtwórz">${icons.play}</button>
        <div class="replay-scrubber" id="scrubber"><div class="fill" id="scrubber-fill"></div></div>
        <button type="button" class="btn btn-ghost btn-sm" id="skip-btn">Pomiń</button>
      </div>
      <div class="replay-events" id="event-list"></div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => history.back());

  function renderEventList() {
    const list = root.querySelector('#event-list');
    if (events.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">Brak zapisanych połowów do pokazania w tej wyprawie.</p>`;
      return;
    }
    list.innerHTML = events.map((ev, i) => {
      const species = getState().species.find((s) => s.id === ev.catchRef.speciesId);
      const owner = ev.isMine ? 'Ty' : (getState().friends.find((f) => f.id === ev.catchRef.ownerId)?.displayName ?? 'Znajomy');
      return `<div class="replay-event-row ${ev.t <= t ? 'is-current' : ''}" data-event="${i}">
        <time>${formatTimePl(ev.catchRef.caughtAt)}</time>
        <span>${escapeHtml(owner)} zapisał${ev.isMine ? '(a)' : ''} ${escapeHtml(species?.namePl ?? 'nieznany gatunek')}${ev.catchRef.length ? ` (${ev.catchRef.length.value} cm)` : ''}</span>
      </div>`;
    }).join('');
  }

  function applyFrame() {
    const pos = positionAt(path.points, t);
    root.querySelector('#replay-dot').style.left = pos.left + '%';
    root.querySelector('#replay-dot').style.top = pos.top + '%';
    root.querySelector('#scrubber-fill').style.width = (t * 100) + '%';
    root.querySelectorAll('.replay-ping').forEach((el, i) => {
      el.style.opacity = events[i].t <= t ? '1' : '0';
    });
    renderEventList();
  }

  function play() {
    if (playing || reduced) return;
    playing = true;
    root.querySelector('#play-btn').innerHTML = icons.pause;
    const stepMs = 60;
    timer = setInterval(() => {
      t = Math.min(1, t + stepMs / PLAYBACK_MS);
      applyFrame();
      if (t >= 1) pause();
    }, stepMs);
  }
  function pause() {
    playing = false;
    clearInterval(timer);
    root.querySelector('#play-btn').innerHTML = icons.play;
  }

  root.querySelector('#play-btn').addEventListener('click', () => {
    if (reduced) return; // reduced-motion: no continuous animation, use skip/reset instead
    playing ? pause() : play();
  });
  root.querySelector('#reset-btn').addEventListener('click', () => { pause(); t = 0; applyFrame(); });
  root.querySelector('#skip-btn').addEventListener('click', () => { pause(); t = 1; applyFrame(); });
  root.querySelector('#scrubber').addEventListener('click', (e) => {
    pause();
    const rect = e.currentTarget.getBoundingClientRect();
    t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    applyFrame();
  });

  applyFrame();
  if (reduced) {
    root.querySelector('#play-btn').setAttribute('aria-disabled', 'true');
    root.querySelector('#play-btn').title = 'Animacja wyłączona (prefers-reduced-motion) — użyj suwaka.';
  }

  return () => pause();
}
