/* ============================================================
   Kursant – strona główna, Moje wyroby, dodawanie, opłaty
   ============================================================ */
const Kursant = (() => {
  const galState = { mode: 'pracownia', filter: 'all' };

  function plural(n, one, few, many) {
    if (n === 1) return one;
    const m10 = n % 10, m100 = n % 100;
    return (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? few : many;
  }

  /* ---------- Strona główna ---------- */
  function home() {
    const meUser = Store.me();
    const items = Store.itemsOf(meUser.id).sort((a, b) => b.createdAt - a.createdAt);
    const nGotowe = items.filter((i) => i.status === 'gotowe').length;
    const nCzeka = items.filter((i) => i.status.startsWith('czeka')).length;
    const nOdebrane = items.filter((i) => i.status === 'odebrane').length;
    const h = new Date().getHours();
    const greet = h < 5 ? 'Dobranoc' : h < 18 ? 'Dzień dobry' : 'Dobry wieczór';
    const heroBg = items.length ? Store.img(Store.mainPhoto(items[0])) : Seed.vessel('hero', { shape: 'wazon', fired: true });

    const root = UI.el(`
      <div>
        <div class="hello">
          <h1>${greet}, ${UI.esc(meUser.name.split(' ')[0])}</h1>
          <p>Miło Cię widzieć w pracowni.</p>
        </div>
        <button class="hero-add">
          <img class="bg" src="${heroBg}" alt="">
          <div class="veil"></div>
          <div class="cam">${UI.icon('camera')}</div>
          <div class="txt">
            <div class="big">Dodaj moje wyroby</div>
            <div class="sub">Zdjęcie każdej sztuki przed wypałem</div>
          </div>
        </button>
        <div class="counters">
          <button class="counter" data-f="gotowe"><span class="n">${nGotowe}</span><span class="l"><span class="dot gotowe"></span>Do odbioru</span></button>
          <button class="counter" data-f="czeka"><span class="n">${nCzeka}</span><span class="l"><span class="dot czeka_biskwit"></span>Czekają</span></button>
          <button class="counter" data-f="odebrane"><span class="n">${nOdebrane}</span><span class="l"><span class="dot odebrane"></span>Odebrane</span></button>
        </div>
        <div class="section-h"><h2>Ostatnio dodane</h2><button class="more">Wszystkie</button></div>
        <div class="recent-strip"></div>
        <button class="glaze-card">
          <span class="ic">${UI.icon('drop')}</span>
          <span><span class="t">Katalog szkliw pracowni</span><br><span class="s">Sprawdzone połączenia od całej pracowni</span></span>
          <span class="chev">${UI.icon('chevR')}</span>
        </button>
      </div>`);

    root.querySelector('.hero-add').onclick = () => location.hash = '#/dodaj';
    root.querySelectorAll('.counter').forEach((c) => {
      c.onclick = () => {
        const fl = c.dataset.f;
        galState.mode = fl === 'odebrane' ? 'archiwum' : 'pracownia';
        galState.filter = fl === 'odebrane' ? 'all' : fl;
        location.hash = '#/wyroby';
      };
    });
    root.querySelector('.more').onclick = () => { galState.mode = 'pracownia'; galState.filter = 'all'; location.hash = '#/wyroby'; };
    root.querySelector('.glaze-card').onclick = () => location.hash = '#/szkliwa';

    const strip = root.querySelector('.recent-strip');
    const recent = items.slice(0, 10);
    if (!recent.length) {
      strip.replaceWith(UI.el('<p class="muted small">Tu pojawią się Twoje najnowsze wyroby.</p>'));
    } else {
      recent.forEach((it) => {
        const k = Store.kStatus(it);
        const ph = UI.el(`<button class="ph"><img src="${Store.img(Store.mainPhoto(it))}" alt=""><span class="dot ${k.key}"></span></button>`);
        ph.onclick = () => Preview.open(recent.map((x) => x.id), recent.indexOf(it));
        strip.appendChild(ph);
      });
    }
    return root;
  }

  /* ---------- Moje wyroby ---------- */
  function gallery() {
    const meUser = Store.me();
    const root = UI.el('<div></div>');

    const bar = UI.el(`
      <div class="gallery-bar">
        <div class="seg">
          <button data-m="pracownia">W pracowni</button>
          <button data-m="archiwum">Archiwum</button>
        </div>
        <div class="spacer"></div>
        <button class="iconbtn pay" title="Opłaty" aria-label="Opłaty">${UI.icon('receipt')}</button>
        <button class="btn sm coral add">${UI.icon('plus')} Dodaj</button>
      </div>`);
    const filters = UI.el(`
      <div class="filters" style="margin-bottom:10px">
        <button class="f" data-f="all">Wszystkie</button>
        <button class="f" data-f="gotowe">Do odbioru</button>
        <button class="f" data-f="czeka">Czekają</button>
      </div>`);
    const grid = UI.el('<div class="photogrid"></div>');
    root.appendChild(bar);
    root.appendChild(filters);
    root.appendChild(grid);

    bar.querySelector('.pay').onclick = () => location.hash = '#/oplaty';
    bar.querySelector('.add').onclick = () => location.hash = '#/dodaj';
    bar.querySelectorAll('.seg button').forEach((b) => {
      b.onclick = () => { galState.mode = b.dataset.m; galState.filter = 'all'; paint(); };
    });
    filters.querySelectorAll('.f').forEach((b) => {
      b.onclick = () => { galState.filter = b.dataset.f; paint(); };
    });

    function visible() {
      let items = Store.itemsOf(meUser.id);
      items = galState.mode === 'archiwum'
        ? items.filter((i) => i.status === 'odebrane')
        : items.filter((i) => i.status !== 'odebrane');
      if (galState.mode === 'pracownia') {
        if (galState.filter === 'gotowe') items = items.filter((i) => i.status === 'gotowe');
        if (galState.filter === 'czeka') items = items.filter((i) => i.status.startsWith('czeka'));
      }
      return items.sort((a, b) => b.createdAt - a.createdAt);
    }

    function paint() {
      bar.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('on', b.dataset.m === galState.mode));
      filters.style.display = galState.mode === 'pracownia' ? '' : 'none';
      filters.querySelectorAll('.f').forEach((b) => b.classList.toggle('on', b.dataset.f === galState.filter));

      grid.innerHTML = '';
      const items = visible();
      if (!items.length) {
        grid.appendChild(UI.el(`
          <div class="empty" style="grid-column:1/-1">
            <div class="ic">${UI.icon(galState.mode === 'archiwum' ? 'box' : 'camera')}</div>
            <h3>${galState.mode === 'archiwum' ? 'Archiwum jest puste' : 'Nic tu jeszcze nie ma'}</h3>
            <p>${galState.mode === 'archiwum' ? 'Trafią tu odebrane wyroby.' : 'Dodaj zdjęcia wyrobów, które zostawiasz w pracowni.'}</p>
          </div>`));
        return;
      }
      const ids = items.map((i) => i.id);
      items.forEach((it, ix) => {
        const k = Store.kStatus(it);
        const tile = UI.el(`
          <button class="tile">
            <img src="${Store.img(Store.mainPhoto(it))}" alt="Wyrób z ${UI.fmtDay(it.createdAt)}" loading="lazy">
            <span class="dot ${k.key}"></span>
          </button>`);
        UI.press(tile, () => Preview.open(ids, ix), () => Preview.open(ids, ix));
        grid.appendChild(tile);
      });
    }
    paint();
    return root;
  }

  /* ---------- Dodawanie wyrobów (2 kroki) ---------- */
  function addFlow() {
    const meUser = Store.me();
    let step = 1;
    let photos = []; // {url, firing}
    let allOstroPrev = null;

    const root = UI.el('<div class="addflow"></div>');

    function paint() {
      root.innerHTML = `
        <div class="hello"><h1>Dodaj moje wyroby</h1></div>
        <div class="steps">
          <span class="st ${step === 1 ? 'on' : ''}"><span class="num">1</span> Zdjęcia</span>
          <span class="ln"></span>
          <span class="st ${step === 2 ? 'on' : ''}"><span class="num">2</span> Rodzaj wypału</span>
        </div>
        <div class="shotgrid"></div>
        <div class="hintbox"></div>
        <div class="foot"></div>`;

      const gridEl = root.querySelector('.shotgrid');
      const hintEl = root.querySelector('.hintbox');
      const foot = root.querySelector('.foot');

      if (step === 1) {
        const add = UI.el(`<button class="addtile">${UI.icon('camera')}<span>Dodaj lub zrób<br>zdjęcia</span></button>`);
        add.onclick = () => UI.pickPhotos((urls) => {
          urls.forEach((u) => photos.push({ url: u, firing: 'biskwit' }));
          paint();
        });
        gridEl.appendChild(add);
        photos.forEach((p, i) => {
          const s = UI.el(`
            <div class="shot">
              <img src="${p.url}" alt="">
              <button class="rm" aria-label="Usuń zdjęcie">${UI.icon('x')}</button>
            </div>`);
          s.querySelector('.rm').onclick = () => { photos.splice(i, 1); paint(); };
          gridEl.appendChild(s);
        });
        hintEl.innerHTML = `
          <div class="hint">${UI.icon('info')}
            <span>Jedno zdjęcie = jedna sztuka ceramiki. Jeżeli Ty nie poznajesz swojego wyrobu na zdjęciu, my też go później nie poznamy.</span>
          </div>`;
        const next = UI.el(`<button class="btn" ${photos.length ? '' : 'disabled'}>Dalej${photos.length ? ` · ${photos.length}` : ''}</button>`);
        next.onclick = () => { step = 2; paint(); };
        foot.appendChild(next);
      } else {
        photos.forEach((p) => {
          const s = UI.el(`
            <button class="shot firing">
              <img src="${p.url}" alt="">
              <span class="chip fbadge ${p.firing}">${p.firing === 'ostro' ? 'Na ostro' : 'Biskwit'}</span>
            </button>`);
          s.onclick = () => {
            p.firing = p.firing === 'ostro' ? 'biskwit' : 'ostro';
            allOstroPrev = null;
            paint();
          };
          gridEl.appendChild(s);
        });
        const applied = allOstroPrev !== null;
        const allBtn = UI.el(`<button class="btn ${applied ? 'subtle' : 'ghost'}" style="margin-top:14px;width:100%">${applied ? 'Cofnij – przywróć oznaczenia' : 'Wszystko jest na ostro'}</button>`);
        allBtn.onclick = () => {
          if (applied) {
            photos.forEach((p, i) => p.firing = allOstroPrev[i]);
            allOstroPrev = null;
          } else {
            allOstroPrev = photos.map((p) => p.firing);
            photos.forEach((p) => p.firing = 'ostro');
          }
          paint();
        };
        hintEl.appendChild(allBtn);

        const back = UI.el('<button class="btn ghost">Wstecz</button>');
        back.onclick = () => { step = 1; paint(); };
        const done = UI.el('<button class="btn coral">Zostawiam w pracowni</button>');
        done.onclick = async () => {
          done.disabled = true;
          const withIds = [];
          for (const p of photos) withIds.push({ imgId: await Store.addImage(p.url), firing: p.firing });
          Store.createDelivery(meUser.id, withIds);
          const n = withIds.length;
          UI.toast(`Dodano ${n} ${plural(n, 'wyrób', 'wyroby', 'wyrobów')}. Damy znać po wypale!`);
          galState.mode = 'pracownia'; galState.filter = 'all';
          location.hash = '#/wyroby';
        };
        foot.appendChild(back);
        foot.appendChild(done);
      }
    }
    paint();
    return root;
  }

  /* ---------- Opłaty ---------- */
  function payments() {
    const meUser = Store.me();
    const pays = Store.data.payments
      .filter((p) => p.userId === meUser.id)
      .sort((a, b) => b.date - a.date);

    const root = UI.el(`
      <div>
        <div class="hello"><h1>Opłaty</h1><p>Historia rozliczeń za wypały.</p></div>
        <div class="card" style="padding:6px 18px"><div class="rowlist"></div></div>
      </div>`);
    const list = root.querySelector('.rowlist');
    if (!pays.length) {
      root.querySelector('.card').replaceWith(UI.el(`
        <div class="empty">
          <div class="ic">${UI.icon('receipt')}</div>
          <h3>Brak rozliczeń</h3>
          <p>Pojawią się tu po odbiorze wypalonych wyrobów.</p>
        </div>`));
      return root;
    }
    pays.forEach((p) => {
      const parts = [];
      if (p.wB) parts.push(`biskwit ${p.wB.toLocaleString('pl-PL')} kg`);
      if (p.wO) parts.push(`na ostro ${p.wO.toLocaleString('pl-PL')} kg`);
      list.appendChild(UI.el(`
        <div class="row">
          <div class="ic">${UI.icon('receipt')}</div>
          <div class="mid">
            <div class="t">Odbiór · ${UI.fmtDay(p.date)}</div>
            <div class="s">${parts.join(' · ') || '—'}</div>
          </div>
          <div class="amt">${UI.money(p.total)}</div>
        </div>`));
    });
    return root;
  }

  return { home, gallery, addFlow, payments, galState, plural };
})();
