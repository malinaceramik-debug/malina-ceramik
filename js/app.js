/* ============================================================
   App – start, role, nawigacja, powiadomienia
   ============================================================ */
const App = (() => {
  const app = document.getElementById('app');

  const NAV = {
    kursant: [
      ['#/home', 'Start', 'home'],
      ['#/wyroby', 'Wyroby', 'grid'],
      ['#/kombinacje', 'Kombinacje', 'book'],
      ['#/szkliwa', 'Szkliwa', 'drop']
    ],
    instruktor: [
      ['#/pracownia', 'Pracownia', 'fire'],
      ['#/rozliczenia', 'Rozliczenia', 'receipt'],
      ['#/dziennik', 'Dziennik', 'book'],
      ['#/szkliwa', 'Szkliwa', 'drop']
    ]
  };
  const VIEWS = {
    '#/home': () => Kursant.home(),
    '#/wyroby': () => Kursant.gallery(),
    '#/dodaj': () => Kursant.addFlow(),
    '#/oplaty': () => Kursant.payments(),
    '#/kombinacje': () => Journal.render(),
    '#/szkliwa': () => Catalog.render(),
    '#/pracownia': () => Instruktor.queue(),
    '#/rozliczenia': () => Instruktor.billing(),
    '#/dziennik': () => Journal.render()
  };

  function homeRoute() {
    const u = Store.me();
    return u && u.role === 'instruktor' ? '#/pracownia' : '#/home';
  }

  /* ---------- Ekran wyboru osoby ---------- */
  function roleSelect() {
    document.querySelectorAll('.selectionbar').forEach((b) => b.remove());
    const wrap = UI.el(`
      <div class="rolewrap">
        <img class="mark" src="icons/icon.svg" alt="">
        <h1>Malina Ceramik</h1>
        <div class="sub">Studio Ceramiki</div>
        <div class="who">
          <div class="lbl">Wejdź jako</div>
        </div>
        <p class="demo-note">Wersja demonstracyjna – dane i zdjęcia zapisują się tylko na tym urządzeniu.</p>
      </div>`);
    const who = wrap.querySelector('.who');
    Store.data.users.forEach((u) => {
      const initials = u.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
      const card = UI.el(`
        <button class="rolecard">
          <span class="avatar" style="background:${u.color}">${UI.esc(initials)}</span>
          <span><span class="t">${UI.esc(u.name)}</span><br><span class="s">${u.role === 'instruktor' ? 'Instruktorka · prowadzi pracownię' : 'Kursantka / kursant'}</span></span>
          <span class="chev">${UI.icon('chevR')}</span>
        </button>`);
      card.onclick = () => {
        Store.setUser(u.id);
        location.hash = homeRoute();
        render();
      };
      who.appendChild(card);
    });
    app.innerHTML = '';
    app.appendChild(wrap);
  }

  /* ---------- Nagłówek + nawigacja ---------- */
  function header() {
    const u = Store.me();
    const n = Store.unread(u.id);
    const initials = u.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
    const bar = UI.el(`
      <header class="appbar">
        <button class="brand">
          <img src="icons/icon.svg" alt="">
          <span><span class="t">Malina Ceramik</span><br><span class="s">Studio Ceramiki</span></span>
        </button>
        <div class="spacer"></div>
        <nav class="tabs"></nav>
        <div class="spacer"></div>
        <button class="iconbtn bell" aria-label="Powiadomienia">${UI.icon('bell')}${n ? `<span class="badge">${n}</span>` : ''}</button>
        <button class="avatar" style="background:${u.color}" aria-label="Konto">${UI.esc(initials)}</button>
      </header>`);
    bar.querySelector('.brand').onclick = () => { location.hash = homeRoute(); };
    bar.querySelector('.bell').onclick = notifSheet;
    bar.querySelector('.avatar').onclick = accountSheet;
    const tabs = bar.querySelector('.tabs');
    NAV[u.role].forEach(([href, label, ic]) => {
      const b = UI.el(`<button class="${location.hash === href ? 'on' : ''}">${UI.icon(ic)} ${label}</button>`);
      b.onclick = () => { location.hash = href; };
      tabs.appendChild(b);
    });
    return bar;
  }
  function bottomNav() {
    const u = Store.me();
    const nav = UI.el('<nav class="bottomnav"></nav>');
    NAV[u.role].forEach(([href, label, ic]) => {
      const b = UI.el(`<button class="${location.hash === href ? 'on' : ''}">${UI.icon(ic)}<span>${label}</span></button>`);
      b.onclick = () => { location.hash = href; };
      nav.appendChild(b);
    });
    return nav;
  }

  /* ---------- Powiadomienia ---------- */
  function notifSheet() {
    const u = Store.me();
    const list = Store.notifsOf(u.id);
    const body = UI.el('<div class="rowlist"></div>');
    if (!list.length) {
      body.innerHTML = `<div class="empty"><div class="ic">${UI.icon('bell')}</div><h3>Cisza</h3><p>Damy znać, gdy coś się wydarzy.</p></div>`;
    }
    const icons = { gotowe: 'sparkle', oplata: 'receipt', przypomnienie: 'box', wydarzenie: 'calendar' };
    list.forEach((nf) => {
      body.appendChild(UI.el(`
        <div class="row ${nf.read ? '' : 'unread'}">
          <div class="ic">${UI.icon(icons[nf.kind] || 'bell')}</div>
          <div class="mid"><div class="t" style="font-weight:${nf.read ? 400 : 600}">${UI.esc(nf.text)}</div>
          <div class="s">${UI.fmtRel(nf.date)}</div></div>
        </div>`));
    });
    UI.sheet('Powiadomienia', body, {
      onClose: () => { Store.markAllRead(u.id); refreshHeader(); }
    });
  }

  /* ---------- Konto / zmiana osoby ---------- */
  function accountSheet() {
    const u = Store.me();
    const body = UI.el(`
      <div>
        <div class="rowlist">
          <div class="row">
            <div class="avatar" style="background:${u.color}">${UI.esc(u.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</div>
            <div class="mid"><div class="t">${UI.esc(u.name)}</div>
            <div class="s">${u.role === 'instruktor' ? 'Instruktorka' : 'Kursantka / kursant'}</div></div>
          </div>
        </div>
        <button class="btn ghost block sw" style="margin-top:14px">Zmień osobę</button>
        <p class="muted small" style="text-align:center;margin-top:14px">Wersja demonstracyjna · dane lokalne na tym urządzeniu</p>
      </div>`);
    const sh = UI.sheet('Twoje konto', body);
    body.querySelector('.sw').onclick = () => {
      sh.close();
      Store.setUser(null);
      render();
    };
  }

  function refreshHeader() {
    const bell = document.querySelector('.appbar .bell');
    const u = Store.me();
    if (!bell || !u) return;
    const n = Store.unread(u.id);
    bell.innerHTML = UI.icon('bell') + (n ? `<span class="badge">${n}</span>` : '');
  }

  /* ---------- Render ---------- */
  function render() {
    Preview.close();
    document.querySelectorAll('.selectionbar').forEach((b) => b.remove());
    document.getElementById('overlays').innerHTML = '';

    const u = Store.me();
    if (!u) { roleSelect(); return; }

    let route = location.hash || homeRoute();
    if (!VIEWS[route]) route = homeRoute();
    /* prosty strażnik ról */
    const allowed = NAV[u.role].map((t) => t[0]).concat(u.role === 'kursant' ? ['#/dodaj', '#/oplaty'] : []);
    if (!allowed.includes(route)) route = homeRoute();
    if (location.hash !== route) { location.hash = route; return; }

    app.innerHTML = '';
    app.appendChild(header());
    const view = UI.el('<main class="view"></main>');
    view.appendChild(VIEWS[route]());
    app.appendChild(view);
    app.appendChild(bottomNav());
    window.scrollTo(0, 0);
  }

  /* ---------- Start ---------- */
  async function boot() {
    await Store.init();
    window.addEventListener('hashchange', render);
    render();
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* demo */ });
    }
  }
  boot();

  return { render, refreshHeader };
})();
