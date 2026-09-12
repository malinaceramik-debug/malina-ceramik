/*
  Fishi 3.0 — Map Home V0.1
  No backend, no GPS, no fake data. Every interactive control that isn't part
  of this slice shows an explicit "in progress" toast rather than pretending
  to work. See CLAUDE.md and .claude/skills/fishi-* for the rules this must
  follow (no fake probabilities, no invented fisheries/results, scanner never
  becomes a camera).
*/
(function () {
  'use strict';

  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    // restart the entrance animation on repeat triggers
    toastEl.classList.remove('is-visible');
    // eslint-disable-next-line no-unused-expressions
    toastEl.offsetHeight;
    toastEl.classList.add('is-visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
      toastEl.classList.remove('is-visible');
    }, 3200);
  }

  var NAV_LABELS = {
    wyprawy: 'Wyprawy — moduł w przygotowaniu.',
    add: 'Szybka akcja — moduł w przygotowaniu.',
    fishibox: 'FishiBox — moduł w przygotowaniu.',
    profil: 'Profil — moduł w przygotowaniu.'
  };

  document.querySelectorAll('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-nav');
      if (key === 'mapa') return; // already active screen, no-op
      var label = NAV_LABELS[key] || 'Moduł w przygotowaniu.';
      showToast(label);
    });
  });

  var scanBtn = document.querySelector('[data-action="scan"]');
  if (scanBtn) {
    scanBtn.addEventListener('click', function () {
      // V0.1: explicitly a stub. Real wave-scan animation + results are V0.2.
      // Must never fabricate fisheries, species, or match percentages here.
      showToast('Skanowanie okolicy — animacja fal i wyniki pojawią się w V0.2.');
    });
  }

  var tripBtn = document.querySelector('[data-action="start-trip"]');
  if (tripBtn) {
    tripBtn.addEventListener('click', function () {
      showToast('Rozpoczęcie spontanicznej wyprawy — Trip Engine w przygotowaniu.');
    });
  }

  var locateBtn = document.querySelector('[data-action="locate"]');
  if (locateBtn) {
    locateBtn.addEventListener('click', function () {
      showToast('Wyśrodkowanie na lokalizacji — wymaga prawdziwej mapy (V0.2+).');
    });
  }

  var layersBtn = document.querySelector('[data-action="layers"]');
  if (layersBtn) {
    layersBtn.addEventListener('click', function () {
      showToast('Warstwy mapy — moduł w przygotowaniu.');
    });
  }

  var searchForm = document.querySelector('[data-action="search-form"]');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // No geocoder yet — never invent search results.
      showToast('Wyszukiwanie miejsc będzie działać po podłączeniu geokodera.');
    });
  }
})();
