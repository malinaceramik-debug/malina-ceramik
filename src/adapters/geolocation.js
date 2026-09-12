// Real foreground GPS via the browser Geolocation API. This is genuinely
// real — no fixture — but only for as long as the tab is foregrounded.
// Background tracking through a locked phone screen is NOT_VERIFIED_ON_DEVICE
// (see CLAUDE.md) and this module makes no attempt to fake it.

/** @typedef {'idle'|'locating'|'granted'|'denied'|'unavailable'|'stale'} GeoStatus */

const STALE_AFTER_MS = 2 * 60 * 1000;

export function isGeolocationSupported() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export function getCurrentPosition({ timeoutMs = 8000 } = {}) {
  if (!isGeolocationSupported()) {
    return Promise.resolve({ status: 'unavailable', position: null, error: 'Geolocation API not supported' });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          status: 'granted',
          position: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            at: new Date(pos.timestamp).toISOString(),
          },
          error: null,
        });
      },
      (err) => {
        const status = err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable';
        resolve({ status, position: null, error: err.message });
      },
      { timeout: timeoutMs, maximumAge: 30000, enableHighAccuracy: false }
    );
  });
}

export function isStale(position, now = Date.now()) {
  if (!position) return true;
  return now - new Date(position.at).getTime() > STALE_AFTER_MS;
}
