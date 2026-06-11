/* ============================================================
   Instruktor – kolejka wypałów, odbiór i rozliczenia
   ============================================================ */
const Instruktor = (() => {
  const qState = { q: '', filter: 'pracownia', selected: new Set() };

  /* ---------- Kolejka ceramiki ---------- */
  function queue() {
    const root = UI.el(`
      <div>
        <div class="hello"><h1>Pracownia</h1><p>Najstarsze wyroby na początku. Dotknij, aby zaznaczyć; przytrzymaj, aby podejrzeć.</p></div>
        <div class="queue-bar">
          <div class="search">${UI.icon('search')}<input type="search" placeholder="Kursant, kod lub dostawa…" value="${UI.esc(qState.q)}"></div>
        </div>
        <div class="filters" style="margin-bottom:10px">
          <button class="f" data-f="pracownia">W pracowni</button>
          <button class="f" data-f="czeka_biskwit">Na biskwit</button>
          <button class="f" data-f="czeka_ostro">Na ostro</button>
          <button class="f" data-f="gotowe">Do odbioru</button>
          <button class="f" data-f="odebrane">Odebrane</button>
        </div>
        <div class="photogrid"></div>
      </div>`);

    const grid = root.querySelector('.photogrid');
    const searchInp = root.querySelector('.search input');
    searchInp.oninput = () => { qState.q = searchInp.value; paint(); };
    root.querySelectorAll('.filters .f').forEach((b) => {
      b.onclick = () => { qState.filter = b.dataset.f; paint(); };
    });

    function visible() {
      const q = qState.q.trim().toLowerCase();
      let items = Store.data.items.slice();
      if (qState.filter === 'pracownia') items = items.filter((i) => i.status !== 'odebrane');
      else items = items.filter((i) => i.status === qState.filter);
      if (q) {
        items = items.filter((i) => {
          const owner = Store.user(i.userId);
          return i.code.toLowerCase().includes(q) ||
            (owner && owner.name.toLowerCase().includes(q)) ||
            UI.fmtDay(i.createdAt).toLowerCase().includes(q);
        });
      }
      return items.sort((a, b) => a.createdAt - b.createdAt); // najstarsze pierwsze
    }

    function paint() {
      root.querySelectorAll('.filters .f').forEach((b) => b.classList.toggle('on', b.dataset.f === qState.filter));
      grid.innerHTML = '';
      const items = visible();
      if (!items.length) {
        grid.appendChild(UI.el(`
          <div class="empty" style="grid-column:1/-1">
            <div class="ic">${UI.icon('fire')}</div>
            <h3>Pusto</h3><p>Brak wyrobów dla tego filtra.</p>
          </div>`));
      }
      const ids = items.map((i) => i.id);
      items.forEach((it, ix) => {
        const st = Store.iStatus(it);
        const owner = Store.user(it.userId);
        const tile = UI.el(`
          <button class="tile ${qState.selected.has(it.id) ? 'selected' : ''}">
            <img src="${Store.img(Store.mainPhoto(it))}" alt="${it.code}" loading="lazy">
            <span class="dot ${st.key}"></span>
            <span class="code"><b class="mono">${it.code}</b><br>${UI.esc(owner ? owner.name.split(' ')[0] : '')} · ${UI.fmtDay(it.createdAt)}</span>
            <span class="sel"><span class="ck">${UI.icon('check')}</span></span>
          </button>`);
        UI.press(tile,
          () => { // dotknięcie = zaznaczenie
            if (qState.selected.has(it.id)) qState.selected.delete(it.id);
            else qState.selected.add(it.id);
            tile.classList.toggle('selected');
            paintBar();
          },
          () => Preview.open(ids, ix) // przytrzymanie = podgląd
        );
        grid.appendChild(tile);
      });
      paintBar();
    }

    /* pasek akcji dla zaznaczonych */
    function paintBar() {
      document.querySelectorAll('.selectionbar').forEach((b) => b.remove());
      const sel = [...qState.selected].map((id) => Store.item(id)).filter(Boolean);
      if (!sel.length) return;
      const allWaiting = sel.every((i) => i.status.startsWith('czeka'));
      const allReady = sel.every((i) => i.status === 'gotowe');
      const oneOwner = new Set(sel.map((i) => i.userId)).size === 1;

      const bar = UI.el(`
        <div class="selectionbar">
          <span class="n">${sel.length} zazn.</span>
          <button class="btn coral fired" ${allWaiting ? '' : 'disabled'}>${UI.icon('fire')} Wypalone</button>
          <button class="btn pickup" ${allReady && oneOwner ? '' : 'disabled'}>${UI.icon('box')} Odbiór</button>
          <button class="x" aria-label="Wyczyść">${UI.icon('x')}</button>
        </div>`);
      bar.querySelector('.x').onclick = () => { qState.selected.clear(); paint(); };
      bar.querySelector('.fired').onclick = async () => {
        const n = sel.length;
        const ok = await UI.confirm(
          `Oznaczyć ${n} ${Kursant.plural(n, 'wyrób', 'wyroby', 'wyrobów')} jako wypalone? Kursanci dostaną powiadomienie.`, 'Wypalone');
        if (!ok) return;
        Store.markFired(sel.map((i) => i.id));
        qState.selected.clear();
        paint();
        UI.toast('Oznaczono jako wypalone. Powiadomienia wysłane.');
      };
      bar.querySelector('.pickup').onclick = () => {
        pickupSheet(sel[0].userId, sel.map((i) => i.id), () => { qState.selected.clear(); paint(); });
      };
      document.body.appendChild(bar);
    }

    paint();
    return root;
  }

  /* ---------- Odbiór i rozliczenie ---------- */
  function pickupSheet(userId, itemIds, onDone) {
    const owner = Store.user(userId);
    const included = new Set(itemIds);

    const body = UI.el(`
      <div>
        <div class="pickup-items"></div>
        <div class="weights">
          <div class="w"><div class="l"><span class="dot czeka_biskwit"></span>Biskwit</div>
            <input class="wb" type="text" inputmode="decimal" placeholder="0"><span class="u">kg</span></div>
          <div class="w"><div class="l"><span class="dot czeka_ostro"></span>Na ostro</div>
            <input class="wo" type="text" inputmode="decimal" placeholder="0"><span class="u">kg</span></div>
        </div>
        <div class="total-line"><span class="l">Do zapłaty</span><span class="v total">0,00 zł</span></div>
        <div class="rates-line">Stawki:
          <input class="rb" type="text" inputmode="decimal" value="${Store.data.rates.biskwit}"> zł/kg biskwit ·
          <input class="ro" type="text" inputmode="decimal" value="${Store.data.rates.ostro}"> zł/kg na ostro
        </div>
        <button class="btn block go" style="margin-top:18px" disabled>Potwierdź odbiór</button>
      </div>`);

    const itemsEl = body.querySelector('.pickup-items');
    function paintItems() {
      itemsEl.innerHTML = '';
      itemIds.forEach((id) => {
        const it = Store.item(id);
        const pi = UI.el(`
          <button class="pi ${included.has(id) ? '' : 'off'}" title="${it.code}">
            <img src="${Store.img(Store.mainPhoto(it))}" alt=""><span class="dot ${it.firing}"></span>
          </button>`);
        pi.onclick = () => { included.has(id) ? included.delete(id) : included.add(id); paintItems(); recalc(); };
        itemsEl.appendChild(pi);
      });
    }

    const num = (s) => { const v = parseFloat(String(s).replace(',', '.')); return isFinite(v) && v >= 0 ? v : 0; };
    const wb = body.querySelector('.wb'), wo = body.querySelector('.wo');
    const rb = body.querySelector('.rb'), ro = body.querySelector('.ro');
    const totalEl = body.querySelector('.total'), go = body.querySelector('.go');

    function recalc() {
      const rateB = num(rb.value), rateO = num(ro.value);
      Store.data.rates.biskwit = rateB; Store.data.rates.ostro = rateO; Store.save();
      const total = num(wb.value) * rateB + num(wo.value) * rateO;
      totalEl.textContent = UI.money(total);
      const ok = included.size > 0 && (num(wb.value) > 0 || num(wo.value) > 0);
      go.disabled = !ok;
      go.textContent = ok ? `Potwierdź odbiór · ${UI.money(total)}` : 'Potwierdź odbiór';
    }
    [wb, wo, rb, ro].forEach((i) => i.addEventListener('input', recalc));

    paintItems();
    recalc();

    const sh = UI.sheet(`Odbiór · ${owner ? owner.name : ''}`, body);
    go.onclick = () => {
      Store.processPickup(userId, [...included], num(wb.value), num(wo.value));
      sh.close();
      UI.toast(`Rozliczono ${UI.money(num(wb.value) * num(rb.value) + num(wo.value) * num(ro.value))}. Powiadomienie wysłane.`);
      if (onDone) onDone();
    };
  }

  /* ---------- Rozliczenia (lista) ---------- */
  function billing() {
    const root = UI.el(`
      <div>
        <div class="hello"><h1>Odbiory i rozliczenia</h1><p>Kursanci z wyrobami gotowymi do odbioru.</p></div>
        <div class="card" style="padding:6px 18px"><div class="rowlist ready"></div></div>
        <div class="section-h"><h2>Ostatnie rozliczenia</h2></div>
        <div class="card" style="padding:6px 18px"><div class="rowlist hist"></div></div>
      </div>`);

    const ready = root.querySelector('.ready');
    const byUser = {};
    Store.data.items.forEach((it) => {
      if (it.status === 'gotowe') (byUser[it.userId] = byUser[it.userId] || []).push(it);
    });
    const userIds = Object.keys(byUser);
    if (!userIds.length) {
      ready.innerHTML = `<div class="empty" style="padding:28px"><div class="ic">${UI.icon('box')}</div><h3>Nikt nie czeka</h3><p>Brak wyrobów gotowych do odbioru.</p></div>`;
    }
    userIds
      .sort((a, b) => Math.min(...byUser[a].map((i) => i.firedAt || 0)) - Math.min(...byUser[b].map((i) => i.firedAt || 0)))
      .forEach((uId) => {
        const u = Store.user(uId);
        const its = byUser[uId];
        const oldest = Math.min(...its.map((i) => i.firedAt || i.createdAt));
        const row = UI.el(`
          <div class="row" style="cursor:pointer">
            <div class="avatar" style="background:${u.color}">${UI.esc(u.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</div>
            <div class="mid">
              <div class="t">${UI.esc(u.name)}</div>
              <div class="s">${its.length} ${Kursant.plural(its.length, 'wyrób', 'wyroby', 'wyrobów')} · wypalone ${UI.fmtRel(oldest)}</div>
            </div>
            <div class="amt">${UI.icon('chevR')}</div>
          </div>`);
        row.onclick = () => pickupSheet(uId, its.map((i) => i.id), () => App.render());
        ready.appendChild(row);
      });

    const hist = root.querySelector('.hist');
    const pays = Store.data.payments.slice().sort((a, b) => b.date - a.date).slice(0, 12);
    if (!pays.length) hist.innerHTML = '<p class="muted small" style="padding:10px 0">Jeszcze nic tu nie ma.</p>';
    pays.forEach((p) => {
      const u = Store.user(p.userId);
      hist.appendChild(UI.el(`
        <div class="row">
          <div class="ic">${UI.icon('receipt')}</div>
          <div class="mid">
            <div class="t">${UI.esc(u ? u.name : '')}</div>
            <div class="s">${UI.fmtRel(p.date)} · biskwit ${p.wB.toLocaleString('pl-PL')} kg · ostro ${p.wO.toLocaleString('pl-PL')} kg</div>
          </div>
          <div class="amt">${UI.money(p.total)}</div>
        </div>`));
    });
    return root;
  }

  return { queue, billing, pickupSheet };
})();
