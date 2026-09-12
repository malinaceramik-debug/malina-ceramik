export function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

export function formatHms(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const PL_MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

export function formatDatePl(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${PL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTimePl(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Polish plural rules: 1 -> one, 2-4 (not 12-14) -> few, else -> many. */
export function plPlural(n, one, few, many) {
  const abs = Math.abs(n);
  if (abs === 1) return one;
  const lastDigit = abs % 10;
  const lastTwo = abs % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return few;
  return many;
}

export function formatCatchCount(n) {
  return `${n} ${plPlural(n, 'zapisana ryba', 'zapisane ryby', 'zapisanych ryb')}`;
}

export function formatTripCount(n) {
  return `${n} ${plPlural(n, 'wyprawa', 'wyprawy', 'wypraw')}`;
}

export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
