import * as store from '../state/store.js';
import { mountToastHost, showToastUI } from '../ui/toast.js';
import { startRouter, navigate } from './router.js';
import { getCurrentPosition, isGeolocationSupported } from '../adapters/geolocation.js';

const FORGOTTEN_END_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3h — demo heuristic only, see §16/§18

let lastToastId = null;

function wireToastBridge() {
  store.subscribe((s) => {
    if (s.ui.toast && s.ui.toast.id !== lastToastId) {
      lastToastId = s.ui.toast.id;
      showToastUI(s.ui.toast.message);
    }
  });
}

// Real foreground GPS route recording while a trip is active (never claims
// background tracking — see CLAUDE.md: NOT_VERIFIED_ON_DEVICE).
function startRouteRecording() {
  if (!isGeolocationSupported()) return;
  setInterval(async () => {
    const trip = store.getActiveTrip();
    if (!trip || trip.phase !== 'active') return;
    if (document.hidden) return; // foreground-only, honestly — no background claim
    const { status, position } = await getCurrentPosition({ timeoutMs: 6000 });
    if (status === 'granted' && position) {
      store.recordRoutePointForActiveTrip(position);
    }
  }, 45000);
}

// Demo-only "forgotten to end trip" heuristic: pure elapsed-time trigger,
// never inferred from GPS/shoreline signals we don't actually have.
function startForgottenEndWatcher() {
  setInterval(() => {
    const trip = store.getActiveTrip();
    if (!trip || trip.phase !== 'active') return;
    if (trip.forgottenEndSuggestion) return;
    const elapsed = Date.now() - new Date(trip.startAt).getTime();
    if (elapsed > FORGOTTEN_END_THRESHOLD_MS) {
      store.suggestForgottenEnd(trip.id, 'Wyprawa trwa nietypowo długo bez przerwy (heurystyka demo — wymaga potwierdzenia).');
    }
  }, 60000);
}

async function boot() {
  mountToastHost(document.getElementById('toast-root'));
  wireToastBridge();
  await store.init();
  startRouter();
  startRouteRecording();
  startForgottenEndWatcher();

  // re-render current screen when store changes that aren't route changes
  // (screens subscribe themselves for fine-grained updates; this is only a
  // safety net for nav active-state / activeTrip FAB icon).
  store.subscribe(() => {
    const hash = location.hash || '#/map';
    import('../ui/nav.js').then(({ renderBottomNav, shouldShowNavForRoute }) => {
      const navRoot = document.getElementById('nav-root');
      if (shouldShowNavForRoute(hash) && !navRoot.hidden) renderBottomNav(navRoot, hash);
    });
  });
}

boot();
