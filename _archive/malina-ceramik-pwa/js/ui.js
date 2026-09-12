/* ============================================================
   UI – ikony, pomocniki, arkusze, dialogi, fasolki, gesty
   ============================================================ */
const UI = (() => {

  /* ---------- Ikony (stroke 1.8, viewBox 24) ---------- */
  const ICONS = {
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    book: '<path d="M12 6c-2.2-1.6-5.3-1.6-8 0v13c2.7-1.6 5.8-1.6 8 0 2.2-1.6 5.3-1.6 8 0V6c-2.7-1.6-5.8-1.6-8 0z"/><path d="M12 6v13"/>',
    drop: '<path d="M12 3s6 6.6 6 11a6 6 0 1 1-12 0c0-4.4 6-11 6-11z"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2.2 2.2 0 0 0 4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    camera: '<path d="M4 8h3.2L9 5.4h6L16.8 8H20v11H4z"/><circle cx="12" cy="13" r="3.2"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    chevL: '<path d="M15 5l-7 7 7 7"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>',
    back: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h5"/>',
    fire: '<path d="M12 3c1 3.5 5 5.2 5 9.5a5 5 0 1 1-10 0C7 8.2 11 6.5 12 3z"/><path d="M12 13c.6 1.2 1.5 2 1.5 3.4A1.9 1.9 0 0 1 12 18a1.9 1.9 0 0 1-1.5-1.6c0-1.4.9-2.2 1.5-3.4z"/>',
    scale: '<path d="M12 4v13"/><path d="M5 7h14"/><path d="M5 7l-2.5 6a3 3 0 0 0 5.6 0z"/><path d="M19 7l-2.5 6a3 3 0 0 0 5.6 0z" transform="translate(-2.6 0)"/><path d="M8 19h8"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-3.4-3.4"/>',
    share: '<path d="M12 14V4"/><path d="M8 7.5L12 4l4 3.5"/><path d="M5 12v8h14v-8"/>',
    lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
    eye: '<path d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    calendar: '<rect x="4" y="6" width="16" height="15" rx="2"/><path d="M4 10.5h16M8.5 3v5M15.5 3v5"/>',
    box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
    sparkle: '<path d="M12 3l1.9 5.4L19.5 10l-5.6 1.6L12 17l-1.9-5.4L4.5 10l5.6-1.6z"/>',
    pen: '<path d="M4 20l4.5-1L20 7.5 16.5 4 5 15.5z"/><path d="M14 6.5L17.5 10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.5"/>'
  };
  function icon(name, cls) {
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  /* ---------- DOM ---------- */
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- Formatowanie ---------- */
  const fmtDayF = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long' });
  const fmtFullF = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  function fmtDay(ts) { return fmtDayF.format(new Date(ts)); }
  function fmtFull(ts) { return fmtFullF.format(new Date(ts)); }
  function fmtRel(ts) {
    const d = new Date(ts); const now = new Date();
    const day = (x) => Math.floor(x.getTime() / 86400000 - x.getTimezoneOffset() * 60000 / 86400000);
    const diff = day(now) - day(d);
    if (diff <= 0) return 'dzisiaj';
    if (diff === 1) return 'wczoraj';
    return d.getFullYear() === now.getFullYear() ? fmtDay(ts) : fmtFull(ts);
  }
  function money(n) {
    return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
  }

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = el(`<div class="toast">${esc(msg)}</div>`);
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 2600);
  }

  /* ---------- Arkusz (sheet) ---------- */
  function sheet(title, bodyEl, opts) {
    opts = opts || {};
    const scrim = el(`<div class="scrim"></div>`);
    const sh = el(`
      <div class="sheet" role="dialog" aria-label="${esc(title)}">
        <div class="sh-head">
          <h2>${esc(title)}</h2>
          <button class="iconbtn cl" aria-label="Zamknij">${icon('x')}</button>
        </div>
        <div class="sh-body"></div>
      </div>`);
    sh.querySelector('.sh-body').appendChild(bodyEl);
    scrim.appendChild(sh);
    function close() {
      scrim.remove();
      if (opts.onClose) opts.onClose();
    }
    sh.querySelector('.cl').onclick = close;
    scrim.addEventListener('click', (e) => { if (e.target === scrim) close(); });
    document.getElementById('overlays').appendChild(scrim);
    return { close, el: sh };
  }

  /* ---------- Potwierdzenie ---------- */
  function confirm(text, okLabel) {
    return new Promise((resolve) => {
      const scrim = el(`<div class="scrim" style="align-items:center"></div>`);
      const d = el(`
        <div class="dialog" role="alertdialog">
          <p>${esc(text)}</p>
          <div class="row">
            <button class="btn ghost sm no">Wróć</button>
            <button class="btn sm yes">${esc(okLabel || 'Potwierdź')}</button>
          </div>
        </div>`);
      scrim.appendChild(d);
      d.querySelector('.no').onclick = () => { scrim.remove(); resolve(false); };
      d.querySelector('.yes').onclick = () => { scrim.remove(); resolve(true); };
      scrim.addEventListener('click', (e) => { if (e.target === scrim) { scrim.remove(); resolve(false); } });
      document.getElementById('overlays').appendChild(scrim);
    });
  }

  /* ---------- Zdjęcia: wczytanie + pomniejszenie ---------- */
  function readPhoto(file, maxSide) {
    maxSide = maxSide || 1100;
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, maxSide / Math.max(im.width, im.height));
        const w = Math.round(im.width * k), h = Math.round(im.height * k);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(im, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      im.src = url;
    });
  }
  /* ukryty input plików -> dataURL[] */
  function pickPhotos(onDone, multiple) {
    const inp = el(`<input type="file" accept="image/*" ${multiple !== false ? 'multiple' : ''} style="display:none">`);
    document.body.appendChild(inp);
    inp.onchange = async () => {
      const out = [];
      for (const f of inp.files) {
        try { out.push(await readPhoto(f)); } catch (e) { /* pomiń */ }
      }
      inp.remove();
      if (out.length) onDone(out);
    };
    inp.click();
  }

  /* ---------- Gesty ---------- */
  function press(elm, onTap, onLong) {
    let timer = null, longFired = false, sx = 0, sy = 0;
    elm.addEventListener('pointerdown', (e) => {
      longFired = false; sx = e.clientX; sy = e.clientY;
      timer = setTimeout(() => { longFired = true; if (onLong) onLong(); }, 450);
    });
    elm.addEventListener('pointermove', (e) => {
      if (Math.abs(e.clientX - sx) > 12 || Math.abs(e.clientY - sy) > 12) clearTimeout(timer);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
      elm.addEventListener(ev, () => clearTimeout(timer)));
    elm.addEventListener('click', (e) => {
      if (longFired) { e.preventDefault(); e.stopPropagation(); return; }
      if (onTap) onTap(e);
    });
    elm.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  function swipe(elm, onLeft, onRight) {
    let sx = null, sy = null;
    elm.addEventListener('touchstart', (e) => {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    elm.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) onLeft(); else onRight();
      }
      sx = sy = null;
    }, { passive: true });
  }

  /* ---------- Edytor fasolek materiałowych ---------- */
  const CATS = [
    ['glina', 'Glina'],
    ['szkliwa', 'Szkliwa'],
    ['farby', 'Farby'],
    ['temperatura', 'Temperatura']
  ];
  function beanEditor(sel, onChange, readOnly) {
    const root = el('<div class="beans-editor"></div>');
    CATS.forEach(([cat, label]) => {
      if (readOnly && !(sel[cat] || []).length) return;
      const row = el(`<div class="bean-row"><div class="lbl">${label}</div><div class="bean-wrap"></div></div>`);
      const wrap = row.querySelector('.bean-wrap');

      function paint() {
        wrap.innerHTML = '';
        const pool = readOnly
          ? (sel[cat] || []).map((id) => Store.mat(id)).filter(Boolean)
          : Store.matsByCat(cat);
        pool.forEach((m) => {
          const on = (sel[cat] || []).includes(m.id);
          if (readOnly && !on) return;
          const b = el(`<button type="button" class="bean ${on ? 'on' : ''}">${esc(Store.matLabel(m.id))}</button>`);
          if (!readOnly) b.onclick = () => {
            const arr = sel[cat];
            const ix = arr.indexOf(m.id);
            if (ix >= 0) arr.splice(ix, 1); else arr.push(m.id);
            paint();
            if (onChange) onChange();
          };
          wrap.appendChild(b);
        });
        if (!readOnly) {
          const add = el(`<button type="button" class="bean add">+ Dodaj</button>`);
          add.onclick = () => {
            const isTemp = cat === 'temperatura';
            const form = el(`
              <div class="bean-form">
                ${isTemp ? '' : '<input class="f-brand" placeholder="Marka / producent">'}
                <input class="f-name" placeholder="${isTemp ? 'np. 1060°C' : 'Nazwa lub numer'}">
                <button type="button" class="ok" aria-label="Dodaj">${icon('check')}</button>
              </div>`);
            add.replaceWith(form);
            const fName = form.querySelector('.f-name');
            const fBrand = form.querySelector('.f-brand');
            (fBrand || fName).focus();
            function submit() {
              const id = Store.addMaterial(cat, fBrand ? fBrand.value : '', fName.value);
              if (id) { sel[cat].push(id); if (onChange) onChange(); }
              paint();
            }
            form.querySelector('.ok').onclick = submit;
            form.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
          };
          wrap.appendChild(add);
        }
      }
      paint();
      root.appendChild(row);
    });
    if (readOnly && !root.children.length) {
      root.appendChild(el('<p class="muted small" style="margin:0">Brak notatek materiałowych.</p>'));
    }
    return root;
  }

  /* skrócone fasolki do kart (tylko nazwy) */
  function beanPills(sel, max) {
    const ids = [].concat(sel.glina, sel.szkliwa, sel.farby, sel.temperatura).filter(Boolean);
    const shown = ids.slice(0, max || 4);
    let html = shown.map((id) => `<span class="b">${esc(Store.matLabel(id))}</span>`).join('');
    if (ids.length > shown.length) html += `<span class="b">+${ids.length - shown.length}</span>`;
    return html;
  }

  return { icon, el, esc, fmtDay, fmtFull, fmtRel, money, toast, sheet, confirm, readPhoto, pickPhotos, press, swipe, beanEditor, beanPills, CATS };
})();
