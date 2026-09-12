import { loadDemoScenario, resetAllData, getState, showToast } from '../../state/store.js';
import { icons } from '../../ui/icons.js';

const SCENARIOS = [
  { id: 'new_user', label: 'Nowy użytkownik', desc: 'Zupełnie pusty stan — pierwsze uruchomienie.', go: '#/map' },
  { id: 'scanner_results', label: 'Wyniki skanera', desc: 'Mapa z gotowymi wynikami skanowania i kasetami.', go: '#/map' },
  { id: 'planned_trip', label: 'Zaplanowana wyprawa', desc: 'Jedna zapisana, jeszcze nierozpoczęta wyprawa.', go: '#/trips' },
  { id: 'active_empty_trip', label: 'Aktywna wyprawa (bez połowu)', desc: 'Trwająca wyprawa bez żadnego zapisanego połowu.', go: '#/trip/active' },
  { id: 'active_trip_with_catch', label: 'Aktywna wyprawa + połów', desc: 'Trwająca wyprawa z jednym zapisanym połowem.', go: '#/trip/active' },
  { id: 'shared_trip', label: 'Wspólna wyprawa', desc: 'Aktywna wyprawa z dwoma uczestnikami i połowem znajomego.', go: '#/trip/active' },
  { id: 'finished_trip', label: 'Zakończona wyprawa', desc: 'Wyprawa z połowami, gotowa do obejrzenia w Summary/Replay.', go: null },
  { id: 'zero_catch_summary', label: 'Wyprawa bez połowu (podsumowanie)', desc: 'Zakończona wyprawa bez żadnego zapisanego połowu.', go: null },
  { id: 'user_with_history', label: 'Użytkownik z historią', desc: 'Kilka zakończonych wypraw, rekordy, prywatna miejscówka.', go: '#/profile' },
];

export function render(root) {
  root.innerHTML = `
    <div class="screen">
      <div class="screen-header">
        <button type="button" class="icon-btn" id="back-btn" aria-label="Wstecz">${icons.back}</button>
        <h1>Tryb demo</h1>
      </div>
      <div class="section" style="padding-top:0;">
        <div class="unverified-note" style="margin-bottom:16px;">Ten ekran jest narzędziem deweloperskim do szybkiego testowania flow — nigdy nie jest to prawdziwa historia użytkownika.</div>
        <div class="card" style="padding:4px;">
          ${SCENARIOS.map((s) => `
            <div class="demo-scenario-row" data-scenario="${s.id}" style="border-bottom:1px solid var(--line); cursor:pointer;">
              <div><div class="label">${s.label}</div><div class="desc">${s.desc}</div></div>
              <span>${icons.chevronDown}</span>
            </div>`).join('')}
        </div>
        <button type="button" class="btn btn-danger btn-block" id="reset-btn" style="margin-top:18px;">Wyczyść wszystkie dane</button>
      </div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => history.back());
  root.querySelector('#reset-btn').addEventListener('click', async () => {
    await resetAllData();
    showToast('Wyczyszczono lokalne dane.');
    location.hash = '#/map';
  });

  root.querySelectorAll('[data-scenario]').forEach((row) => {
    row.addEventListener('click', async () => {
      const s = SCENARIOS.find((x) => x.id === row.getAttribute('data-scenario'));
      await loadDemoScenario(s.id);
      showToast(`Wczytano scenariusz: ${s.label}`);
      const target = s.go ?? (() => {
        const trip = getState().trips[0];
        return trip ? `#/trip/${trip.id}/summary` : '#/map';
      })();
      location.hash = target;
    });
  });
}
