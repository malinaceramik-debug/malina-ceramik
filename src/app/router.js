import { renderBottomNav, shouldShowNavForRoute } from '../ui/nav.js';
import { setRoute } from '../state/store.js';

const routes = [
  { pattern: '#/map', load: () => import('../features/map/index.js') },
  { pattern: '#/quickstart', load: () => import('../features/trip/quickstart.js') },
  { pattern: '#/fishery/:id', load: () => import('../features/fishery/index.js') },
  { pattern: '#/plan', load: () => import('../features/plan/index.js') },
  { pattern: '#/plan/:fisheryId', load: () => import('../features/plan/index.js') },
  { pattern: '#/fishibox', load: () => import('../features/fishibox/index.js') },
  { pattern: '#/species/:id', load: () => import('../features/fishibox/detail.js') },
  { pattern: '#/trip/active', load: () => import('../features/trip/active.js') },
  { pattern: '#/trip/:id/catch', load: () => import('../features/catch/index.js') },
  { pattern: '#/trip/:id/summary', load: () => import('../features/trip/summary.js') },
  { pattern: '#/trip/:id/replay', load: () => import('../features/replay/index.js') },
  { pattern: '#/trips', load: () => import('../features/trip/list.js') },
  { pattern: '#/gear', load: () => import('../features/gear/index.js') },
  { pattern: '#/spots', load: () => import('../features/spots/index.js') },
  { pattern: '#/profile', load: () => import('../features/profile/index.js') },
  { pattern: '#/achievements', load: () => import('../features/achievements/index.js') },
  { pattern: '#/demo', load: () => import('../features/demo/index.js') },
];

function matchRoute(hash) {
  const [path] = hash.split('?');
  const pathSegs = path.split('/');
  for (const r of routes) {
    const patSegs = r.pattern.split('/');
    if (patSegs.length !== pathSegs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < patSegs.length; i += 1) {
      if (patSegs[i].startsWith(':')) {
        params[patSegs[i].slice(1)] = decodeURIComponent(pathSegs[i]);
      } else if (patSegs[i] !== pathSegs[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { route: r, params };
  }
  return null;
}

function parseQuery(hash) {
  const q = hash.split('?')[1];
  if (!q) return {};
  return Object.fromEntries(new URLSearchParams(q));
}

let currentCleanup = null;
const screenRoot = () => document.getElementById('screen-root');
const navRoot = () => document.getElementById('nav-root');

export async function navigate() {
  const hash = location.hash || '#/map';
  const matched = matchRoute(hash);

  if (currentCleanup) {
    try { currentCleanup(); } catch (e) { console.error('[fishi] screen cleanup failed', e); }
    currentCleanup = null;
  }

  setRoute(hash);

  const navContainer = navRoot();
  if (shouldShowNavForRoute(hash)) {
    navContainer.hidden = false;
    renderBottomNav(navContainer, hash);
  } else {
    navContainer.hidden = true;
    navContainer.innerHTML = '';
  }

  const root = screenRoot();
  if (!matched) {
    root.innerHTML = `<div class="not-found">Nie znaleziono ekranu dla „${hash}”.</div>`;
    return;
  }

  root.setAttribute('aria-busy', 'true');
  try {
    const mod = await matched.route.load();
    const params = { ...matched.params, ...parseQuery(hash) };
    const cleanup = await mod.render(root, params);
    currentCleanup = typeof cleanup === 'function' ? cleanup : null;
  } finally {
    root.removeAttribute('aria-busy');
  }

  // re-render nav after screen mount too, in case active-trip state changed
  if (shouldShowNavForRoute(hash)) renderBottomNav(navContainer, hash);
}

export function startRouter() {
  window.addEventListener('hashchange', navigate);
  navigate();
}
