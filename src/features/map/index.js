import { getState, subscribe, setSelectedFishery, setScanState, startSpontaneousTrip, showToast } from '../../state/store.js';
import { icons } from '../../ui/icons.js';
import { getFishArt } from '../../ui/fishArt.js';
import { renderMapTerrainSvg } from '../../ui/mapArt.js';
import { runDemoScan } from '../../adapters/scanner.js';
import { demoSearchPlaces } from '../../adapters/geocoder.js';
import { getCurrentPosition, isGeolocationSupported } from '../../adapters/geolocation.js';
import { escapeHtml } from '../../ui/format.js';

const MARKER_VARIANTS = ['variant-a', 'variant-b', 'variant-c'];

function computeProjector(fisheries) {
  const lats = fisheries.map((f) => f.coords.lat);
  const lons = fisheries.map((f) => f.coords.lon);
  const latMin = Math.min(...lats), latMax = Math.max(...lats);
  const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
  return (coords) => {
    const tX = lonMax > lonMin ? (coords.lon - lonMin) / (lonMax - lonMin) : 0.5;
    const tY = latMax > latMin ? (coords.lat - latMin) / (latMax - latMin) : 0.5;
    return { left: 14 + tX * 72, top: 20 + (1 - tY) * 44 };
  };
}

export function render(root) {
  root.innerHTML = `
    <div class="screen screen--map" id="map-screen">
      <div class="map-surface" data-map-status="prototype-placeholder" role="img"
           aria-label="Podgląd mapy okolicy (dane demonstracyjne, nie prawdziwa mapa)">
        ${renderMapTerrainSvg('map')}
        <div class="map-user-dot" aria-hidden="true"><span class="map-user-dot__ring"></span></div>
        <p class="map-placeholder-tag">Mapa demonstracyjna — bez rzeczywistych danych</p>
        <div id="markers-layer"></div>
        <div id="scan-layer"></div>
      </div>

      <header class="map-topbar">
        <div class="brand"><span class="brand-mark">Fishi</span></div>
        <div class="topbar-controls">
          <button type="button" class="icon-btn" data-action="locate" aria-label="Wyśrodkuj na mojej lokalizacji">${icons.locate}</button>
          <button type="button" class="icon-btn" data-action="layers" aria-label="Warstwy mapy">${icons.layers}</button>
        </div>
      </header>

      <div class="search-bar-wrap">
        <form class="search-bar" role="search" autocomplete="off" id="search-form">
          <span class="search-icon">${icons.search}</span>
          <label class="visually-hidden" for="location-search">Miejscowość lub adres</label>
          <input id="location-search" type="search" placeholder="Miejscowość lub adres…" autocomplete="off" />
        </form>
        <div id="search-results"></div>
      </div>

      <div id="species-rail-wrap"></div>

      <div id="bottom-region"></div>
    </div>
  `;

  const searchForm = root.querySelector('#search-form');
  const searchInput = root.querySelector('#location-search');
  const searchResultsEl = root.querySelector('#search-results');

  searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    if (!q.trim()) { searchResultsEl.innerHTML = ''; return; }
    const matches = demoSearchPlaces(q);
    searchResultsEl.innerHTML = `<div class="search-results">${
      matches.length
        ? matches.map((f) => `<div class="search-result-item" data-fishery="${f.id}">${escapeHtml(f.name)}</div>`).join('')
        : `<div class="search-empty">Brak wyników dla „${escapeHtml(q)}” w danych demo.</div>`
    }</div>`;
    searchResultsEl.querySelectorAll('[data-fishery]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-fishery');
        searchInput.value = '';
        searchResultsEl.innerHTML = '';
        setScanState({ phase: 'done', wave: 3, results: getState().fisheries });
        setSelectedFishery(id);
        renderDynamic();
      });
    });
  });
  searchForm.addEventListener('submit', (e) => e.preventDefault());

  root.querySelector('[data-action="locate"]').addEventListener('click', async () => {
    if (!isGeolocationSupported()) { showToast('Geolokalizacja niedostępna w tej przeglądarce.'); return; }
    showToast('Ustalanie lokalizacji…');
    const { status, position } = await getCurrentPosition();
    if (status === 'granted' && position) {
      showToast(`Lokalizacja: ${position.lat.toFixed(3)}, ${position.lon.toFixed(3)} (±${Math.round(position.accuracy)}m). Mapa to jeszcze placeholder, więc nie przesuwamy widoku.`);
    } else if (status === 'denied') {
      showToast('Odmówiono dostępu do lokalizacji.');
    } else {
      showToast('Nie udało się ustalić lokalizacji.');
    }
  });
  root.querySelector('[data-action="layers"]').addEventListener('click', () => showToast('Warstwy mapy — moduł w przygotowaniu.'));

  let scanAbort = null;

  function startScan() {
    if (getState().ui.scan.phase === 'scanning') return;
    scanAbort = { aborted: false };
    setScanState({ phase: 'scanning', wave: 0, results: [] });
    renderDynamic();
    runDemoScan({
      signal: scanAbort,
      onWave: (waveIdx, results) => {
        setScanState({ phase: waveIdx < 3 ? 'scanning' : 'done', wave: waveIdx, results });
        if (waveIdx === 3 && results.length > 0 && !getState().ui.selectedFisheryId) {
          setSelectedFishery(results[0].id);
        }
        renderDynamic();
      },
    });
  }

  function renderBottomRegion() {
    const { scan } = getState().ui;
    const bottomRegion = root.querySelector('#bottom-region');
    if (scan.phase === 'idle') {
      bottomRegion.innerHTML = `
        <div class="map-bottom-tools">
          <button type="button" class="ghost-chip" data-action="start-trip">${icons.water}<span>Jestem nad wodą</span></button>
          <button type="button" class="scan-btn" data-action="scan" aria-label="Skanuj okoliczne łowiska">${icons.scan}<span>Skanuj</span></button>
        </div>`;
      bottomRegion.querySelector('[data-action="scan"]').addEventListener('click', startScan);
      bottomRegion.querySelector('[data-action="start-trip"]').addEventListener('click', () => {
        startSpontaneousTrip();
        location.hash = '#/trip/active';
      });
    } else if (scan.phase === 'scanning') {
      const messages = [
        { title: 'Skanowanie okolicy…', subtitle: 'Jeszcze nie znaleziono łowisk.' },
        { title: 'Poszerzam zasięg…', subtitle: 'Brak łowisk w najbliższym obszarze — poszerzam automatycznie.' },
        { title: 'Znaleziono pierwsze łowiska', subtitle: `Odkryto ${scan.results.length} miejsc w promieniu.` },
        { title: 'Kończę skanowanie…', subtitle: 'Domykam obszar poszukiwań.' },
      ];
      const m = messages[Math.min(scan.wave, messages.length - 1)];
      bottomRegion.innerHTML = `
        <div class="scan-status-pill">
          <div class="spinner" aria-hidden="true"></div>
          <div>
            <div class="title">${m.title}</div>
            <div class="subtitle">${m.subtitle}</div>
            <div class="scan-progress-dots">${[0, 1, 2, 3].map((i) => `<span class="${i <= scan.wave ? 'is-active' : ''}"></span>`).join('')}</div>
          </div>
        </div>`;
    } else {
      renderDiscovery(bottomRegion);
    }
  }

  function renderDiscovery(bottomRegion) {
    const { scan, selectedFisheryId } = getState().ui;
    const results = scan.results;
    if (results.length === 0) {
      bottomRegion.innerHTML = `
        <div class="scan-status-pill">
          <div><div class="title">Brak wyników</div><div class="subtitle">Spróbuj zeskanować ponownie lub inną okolicę.</div></div>
        </div>`;
      return;
    }
    const selected = selectedFisheryId ?? results[0].id;

    bottomRegion.innerHTML = `
      <div class="cassette-carousel-wrap">
        <div class="cassette-carousel" id="cassette-carousel" tabindex="0" role="listbox" aria-label="Odkryte łowiska">
          ${results.map((f) => `
            <div class="cassette ${f.id === selected ? 'is-active' : ''}" data-fishery="${f.id}" role="option" aria-selected="${f.id === selected}">
              <div class="photo" style="background:linear-gradient(135deg,#123a44,#0b2430)">
                <span class="distance-tag demo-tag">${f.distanceKm ?? '?'} km · demo</span>
              </div>
              <div class="body">
                <p class="name">${escapeHtml(f.name)}</p>
                <p class="meta">${escapeHtml(f.type ?? '')} · ${escapeHtml(f.authorityName ?? '')}</p>
                <div class="species-row">${f.speciesIds.slice(0, 3).map((sid) => `<span>${escapeHtml(getState().species.find((s) => s.id === sid)?.namePl ?? sid)}</span>`).join('')}</div>
              </div>
            </div>`).join('')}
          <div class="cassette-end-card" data-action="search-further">
            <div style="font-weight:700;">Poszukać trochę dalej?</div>
            <p>To wszystkie łowiska znalezione w tym promieniu (dane demo).</p>
            <button type="button" class="btn btn-teal btn-sm" data-action="widen">Tak, szukaj dalej</button>
          </div>
        </div>
      </div>`;

    const carousel = bottomRegion.querySelector('#cassette-carousel');
    carousel.querySelectorAll('.cassette').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-fishery');
        setSelectedFishery(id);
        card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
        renderMarkers();
        renderSpeciesRail();
        highlightCassette();
      });
      card.addEventListener('dblclick', () => {
        location.hash = `#/fishery/${card.getAttribute('data-fishery')}`;
      });
    });
    bottomRegion.querySelector('[data-action="widen"]')?.addEventListener('click', () => showToast('Szersze skanowanie — moduł w przygotowaniu.'));

    carousel.addEventListener('keydown', (e) => {
      const cards = Array.from(carousel.querySelectorAll('.cassette'));
      const idx = cards.findIndex((c) => c.getAttribute('data-fishery') === getState().ui.selectedFisheryId);
      if (e.key === 'ArrowRight' && idx < cards.length - 1) {
        cards[idx + 1].click();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        cards[idx - 1].click();
        e.preventDefault();
      }
    });

    let scrollTimer = null;
    carousel.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const center = carousel.scrollLeft + carousel.clientWidth / 2;
        let closest = null, closestDist = Infinity;
        carousel.querySelectorAll('.cassette').forEach((card) => {
          const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
          if (dist < closestDist) { closestDist = dist; closest = card; }
        });
        if (closest) {
          const id = closest.getAttribute('data-fishery');
          if (id !== getState().ui.selectedFisheryId) {
            setSelectedFishery(id);
            renderMarkers();
            renderSpeciesRail();
            highlightCassette();
          }
        }
      }, 120);
    });
  }

  function highlightCassette() {
    const selected = getState().ui.selectedFisheryId;
    root.querySelectorAll('.cassette').forEach((c) => c.classList.toggle('is-active', c.getAttribute('data-fishery') === selected));
  }

  function renderMarkers() {
    const layer = root.querySelector('#markers-layer');
    const { scan, selectedFisheryId } = getState().ui;
    if (!layer || scan.phase !== 'done' || scan.results.length === 0) { if (layer) layer.innerHTML = ''; return; }
    const project = computeProjector(scan.results);
    layer.innerHTML = scan.results.map((f, i) => {
      const { left, top } = project(f.coords);
      const isSel = f.id === selectedFisheryId;
      return `<div class="map-marker ${MARKER_VARIANTS[i % MARKER_VARIANTS.length]} ${isSel ? 'is-selected' : ''}" style="left:${left}%; top:${top}%" data-fishery="${f.id}" title="${escapeHtml(f.name)}">
        <span class="pin">${icons.water}</span>
      </div>`;
    }).join('');
    layer.querySelectorAll('.map-marker').forEach((m) => {
      m.addEventListener('click', () => {
        const id = m.getAttribute('data-fishery');
        setSelectedFishery(id);
        renderMarkers();
        renderSpeciesRail();
        highlightCassette();
        const card = root.querySelector(`.cassette[data-fishery="${id}"]`);
        card?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      });
    });
  }

  function renderSpeciesRail() {
    const wrap = root.querySelector('#species-rail-wrap');
    const { scan, selectedFisheryId } = getState().ui;
    if (scan.phase !== 'done' || !selectedFisheryId) { wrap.innerHTML = ''; return; }
    const fishery = getState().fisheries.find((f) => f.id === selectedFisheryId);
    if (!fishery) { wrap.innerHTML = ''; return; }
    const speciesList = fishery.speciesIds.map((id) => getState().species.find((s) => s.id === id)).filter(Boolean);
    wrap.innerHTML = `
      <div class="species-rail" role="listbox" aria-label="Gatunki w tym łowisku">
        ${speciesList.map((s, i) => `
          <div class="species-bubble ${i === 0 ? 'is-focused' : ''}" data-species="${s.id}" role="option">
            <span class="dot">${getFishArt(s.id)}</span><span class="name">${escapeHtml(s.namePl)}</span>
          </div>`).join('')}
      </div>`;
    wrap.querySelectorAll('.species-bubble').forEach((b) => {
      b.addEventListener('click', () => {
        wrap.querySelectorAll('.species-bubble').forEach((x) => x.classList.toggle('is-focused', x === b));
        setTimeout(() => { location.hash = `#/species/${b.getAttribute('data-species')}`; }, prefersReducedMotion() ? 0 : 180);
      });
    });
  }

  function renderDynamic() {
    renderBottomRegion();
    renderMarkers();
    renderSpeciesRail();
  }

  // One-time consistency fix at mount (e.g. after loading a demo scenario
  // that seeded scan results without a selection) — never repeated inside
  // renderDynamic itself, to avoid a notify-triggered-by-render loop.
  const initialScan = getState().ui.scan;
  if (initialScan.phase === 'done' && initialScan.results.length > 0 && !getState().ui.selectedFisheryId) {
    setSelectedFishery(initialScan.results[0].id);
  }

  renderDynamic();

  const unsubscribe = subscribe(() => renderDynamic());
  return () => { if (scanAbort) scanAbort.aborted = true; unsubscribe(); };
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
