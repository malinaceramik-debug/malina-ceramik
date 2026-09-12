import { getAchievements } from '../../state/store.js';
import { ACHIEVEMENT_DEFS } from '../../domain/achievement.js';
import { icons } from '../../ui/icons.js';
import { escapeHtml } from '../../ui/format.js';

export function render(root) {
  const earned = getAchievements();

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header">
        <button type="button" class="icon-btn" id="back-btn" aria-label="Wstecz">${icons.back}</button>
        <h1>Osiągnięcia</h1>
      </div>
      <div class="section" style="padding-top:0;">
        <p style="color:var(--text-muted); font-size:12.5px; margin:0 0 16px 0;">Bez poziomów i punktów doświadczenia — każda odznaka po prostu jest zdobyta albo nie.</p>
        ${ACHIEVEMENT_DEFS.map((a) => `
          <div class="list-row achievement-row ${earned.has(a.id) ? 'is-earned' : ''}">
            <div class="glyph">${icons.award}</div>
            <div class="main">
              <div class="title">${escapeHtml(a.label)}</div>
              <div class="sub">${escapeHtml(a.description)}</div>
            </div>
            ${earned.has(a.id) ? `<span class="badge badge-gold">Zdobyte</span>` : ''}
          </div>`).join('')}
      </div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => history.back());
}
