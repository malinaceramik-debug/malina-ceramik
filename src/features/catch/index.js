import { getState, addCatchToActiveTrip, consumeCatchCelebration } from '../../state/store.js';
import { icons } from '../../ui/icons.js';
import { escapeHtml } from '../../ui/format.js';

const RELEASE_OPTIONS = [
  { id: 'released', label: 'Wypuszczona' },
  { id: 'kept', label: 'Zabrana' },
  { id: 'unknown', label: 'Nie wiem' },
];

function resizeToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      const maxW = 480;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function render(root, params) {
  let mode = 'photo'; // 'photo' | 'quick'
  let selectedSpeciesId = null; // null = unknown, explicitly allowed
  let photoDataUrl = null;
  let releaseStatus = 'unknown';

  function speciesGrid() {
    const species = getState().species;
    return `
      <div class="species-picker-grid">
        <div class="species-pick ${selectedSpeciesId === null ? 'is-selected' : ''}" data-species="">
          <span class="thumb">❓</span><span>Nieznany</span>
        </div>
        ${species.map((s) => `
          <div class="species-pick ${selectedSpeciesId === s.id ? 'is-selected' : ''}" data-species="${s.id}">
            <span class="thumb">🐟</span><span>${escapeHtml(s.namePl)}</span>
          </div>`).join('')}
      </div>`;
  }

  function renderForm() {
    const body = root.querySelector('#catch-form-body');
    body.innerHTML = `
      ${mode === 'photo' ? `
        <div class="field">
          <label>Zdjęcie</label>
          <label class="catch-photo-drop" id="photo-drop">
            ${photoDataUrl ? `<img src="${photoDataUrl}" alt="Podgląd zdjęcia połowu">` : `${icons.camera}<span>Zrób zdjęcie lub wybierz plik</span>`}
            <input type="file" accept="image/*" capture="environment" id="photo-input" class="visually-hidden">
          </label>
        </div>` : ''}
      <div class="field">
        <label>Gatunek</label>
        ${speciesGrid()}
      </div>
      <div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;"><label for="c-length">Długość (cm)</label><input type="number" id="c-length" inputmode="decimal" placeholder="np. 54"></div>
        <div class="field" style="flex:1;"><label for="c-weight">Waga (kg)</label><input type="number" id="c-weight" inputmode="decimal" step="0.1" placeholder="np. 2.1"></div>
      </div>
      <div class="field">
        <label>Los ryby</label>
        <div class="radio-group">
          ${RELEASE_OPTIONS.map((o) => `<label class="radio-pill ${releaseStatus === o.id ? 'is-checked' : ''}" data-release="${o.id}"><input type="radio" name="release" value="${o.id}" ${releaseStatus === o.id ? 'checked' : ''}>${o.label}</label>`).join('')}
        </div>
      </div>
      <div class="field"><label for="c-note">Notatka (opcjonalnie)</label><textarea id="c-note" placeholder="Np. wzięła na woblera przy trzcinach"></textarea></div>
    `;

    if (mode === 'photo') {
      const dropLabel = body.querySelector('#photo-drop');
      const input = body.querySelector('#photo-input');
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        photoDataUrl = await resizeToDataUrl(file);
        renderForm();
      });
    }

    body.querySelectorAll('[data-species]').forEach((el) => {
      el.addEventListener('click', () => {
        selectedSpeciesId = el.getAttribute('data-species') || null;
        renderForm();
      });
    });
    body.querySelectorAll('[data-release]').forEach((el) => {
      el.addEventListener('click', () => {
        releaseStatus = el.getAttribute('data-release');
        renderForm();
      });
    });
  }

  root.innerHTML = `
    <div class="screen">
      <div class="screen-header">
        <button type="button" class="icon-btn" id="back-btn" aria-label="Anuluj">${icons.back}</button>
        <h1>Dodaj rybę</h1>
      </div>
      <div class="section" style="padding-top:0;">
        <div class="tabs" style="margin-bottom:16px;">
          <div class="tab ${mode === 'photo' ? 'is-active' : ''}" data-mode="photo">Zrób zdjęcie</div>
          <div class="tab ${mode === 'quick' ? 'is-active' : ''}" data-mode="quick">Szybki zapis</div>
        </div>
        <div id="catch-form-body"></div>
        <button type="button" class="btn btn-primary btn-block" id="save-catch-btn" style="margin-top:8px;">Zapisz połów</button>
      </div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => history.back());
  root.querySelectorAll('[data-mode]').forEach((tab) => {
    tab.addEventListener('click', () => {
      mode = tab.getAttribute('data-mode');
      root.querySelectorAll('[data-mode]').forEach((t) => t.classList.toggle('is-active', t === tab));
      renderForm();
    });
  });

  root.querySelector('#save-catch-btn').addEventListener('click', () => {
    const lengthVal = parseFloat(root.querySelector('#c-length').value);
    const weightVal = parseFloat(root.querySelector('#c-weight').value);
    const note = root.querySelector('#c-note').value.trim();
    const trip = getState().trips.find((t) => t.id === params.id);

    addCatchToActiveTrip({
      speciesId: selectedSpeciesId,
      photoIds: photoDataUrl ? [photoDataUrl] : [],
      length: Number.isFinite(lengthVal) && lengthVal > 0 ? { value: lengthVal, unit: 'cm', method: 'measured_user' } : null,
      weight: Number.isFinite(weightVal) && weightVal > 0 ? { value: weightVal, unit: 'kg', method: 'measured_user' } : null,
      releaseStatus,
      gearKitId: trip?.gearKitId ?? null,
      note,
    });

    showCelebrationThenExit(params.id);
  });

  renderForm();
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function showCelebrationThenExit(tripId) {
  const celebration = consumeCatchCelebration();
  const exit = () => { location.hash = '#/trip/active'; };
  if (!celebration || (!celebration.isFirstEver && !celebration.isFirstSpeciesEver && !celebration.isPbLength && !celebration.isPbWeight)) {
    exit();
    return;
  }
  const messages = [];
  if (celebration.isFirstEver) messages.push({ glyph: '🎉', title: 'Pierwszy połów!', body: 'To Twój pierwszy zapisany połów w Fishi.' });
  if (celebration.isFirstSpeciesEver) messages.push({ glyph: '🐟', title: 'Nowy gatunek w FishiBox', body: 'Pierwszy raz zapisałeś ten gatunek.' });
  if (celebration.isPbLength) messages.push({ glyph: '📏', title: 'Nowy rekord długości!', body: 'To najdłuższa zmierzona ryba tego gatunku w Twojej historii.' });
  if (celebration.isPbWeight) messages.push({ glyph: '⚖️', title: 'Nowy rekord wagi!', body: 'To najcięższa zmierzona ryba tego gatunku w Twojej historii.' });
  const m = messages[0];

  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';
  overlay.innerHTML = `
    <div class="celebration-card">
      <div class="glyph">${m.glyph}</div>
      <h3>${m.title}</h3>
      <p>${m.body}${messages.length > 1 ? ` (+${messages.length - 1} więcej)` : ''}</p>
      <button type="button" class="btn btn-primary btn-block" id="celebration-continue">Świetnie</button>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { document.body.removeChild(overlay); exit(); };
  overlay.querySelector('#celebration-continue').addEventListener('click', close);
  if (prefersReducedMotion()) {
    // still shown (state is already saved before this point either way),
    // just without relying on the pop-in animation to be noticed.
  }
}
