import { startSpontaneousTrip } from '../../state/store.js';
import { icons } from '../../ui/icons.js';

export function render(root) {
  root.innerHTML = `
    <div class="screen" style="display:flex; align-items:flex-end;">
      <div class="sheet" style="position:relative; width:100%;">
        <div class="sheet-handle"></div>
        <div class="section" style="padding-top:0;">
          <h2 style="margin:0 0 4px 0;">Szybka akcja</h2>
          <p style="color:var(--text-secondary); font-size:13.5px; margin:0 0 20px 0;">Jak chcesz zacząć?</p>
          <button type="button" class="btn btn-primary btn-block" id="qs-now" style="margin-bottom:12px;">${icons.bolt}<span>Rozpocznij wyprawę teraz</span></button>
          <button type="button" class="btn btn-ghost btn-block" id="qs-plan" style="margin-bottom:12px;">${icons.compass}<span>Zaplanuj wyprawę</span></button>
          <button type="button" class="btn btn-ghost btn-block" id="qs-cancel">Anuluj</button>
        </div>
      </div>
    </div>
  `;

  root.querySelector('#qs-now').addEventListener('click', () => {
    startSpontaneousTrip();
    location.hash = '#/trip/active';
  });
  root.querySelector('#qs-plan').addEventListener('click', () => { location.hash = '#/plan'; });
  root.querySelector('#qs-cancel').addEventListener('click', () => { history.back(); });
}
