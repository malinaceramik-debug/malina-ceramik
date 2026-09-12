import { icons } from './icons.js';
import { getState } from '../state/store.js';

const TAB_ROUTES = new Set(['#/map', '#/trips', '#/fishibox', '#/profile']);

export function shouldShowNavForRoute(route) {
  return TAB_ROUTES.has(route.split('?')[0]);
}

export function renderBottomNav(container, currentRoute) {
  const base = currentRoute.split('?')[0];
  const activeTrip = getState().ui.activeTripId;

  container.innerHTML = `
    <nav class="bottom-nav" aria-label="Główna nawigacja">
      <button type="button" class="nav-item ${base === '#/map' ? 'is-active' : ''}" data-go="#/map" ${base === '#/map' ? 'aria-current="page"' : ''}>
        ${icons.map}<span>Mapa</span>
      </button>
      <button type="button" class="nav-item ${base === '#/trips' ? 'is-active' : ''}" data-go="#/trips" ${base === '#/trips' ? 'aria-current="page"' : ''}>
        ${icons.trips}<span>Wyprawy</span>
      </button>
      <button type="button" class="nav-item nav-item--fab" data-go="${activeTrip ? '#/trip/active' : '#/quickstart'}" aria-label="${activeTrip ? 'Wróć do aktywnej wyprawy' : 'Szybka akcja'}">
        ${activeTrip ? icons.bolt : icons.plus}
      </button>
      <button type="button" class="nav-item ${base === '#/fishibox' ? 'is-active' : ''}" data-go="#/fishibox" ${base === '#/fishibox' ? 'aria-current="page"' : ''}>
        ${icons.box}<span>FishiBox</span>
      </button>
      <button type="button" class="nav-item ${base === '#/profile' ? 'is-active' : ''}" data-go="#/profile" ${base === '#/profile' ? 'aria-current="page"' : ''}>
        ${icons.profile}<span>Profil</span>
      </button>
    </nav>
  `;

  container.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      location.hash = btn.getAttribute('data-go');
    });
  });
}
