/* ============================================================
   Catalog – wspólny katalog szkliw pracowni
   (tylko świadomie udostępnione kombinacje)
   ============================================================ */
const Catalog = (() => {
  /* stan filtrów: zaznaczone marki i konkretne pozycje */
  const f = { glazeBrands: new Set(), glazeIds: new Set(), clayBrands: new Set(), clayIds: new Set() };

  function entryMats(e, cat) {
    return (e.materials[cat] || []).map((id) => Store.mat(id)).filter(Boolean);
  }

  function matches(e) {
    const glazes = entryMats(e, 'szkliwa');
    const clays = entryMats(e, 'glina');
    if (f.glazeIds.size && !glazes.some((m) => f.glazeIds.has(m.id))) return false;
    else if (!f.glazeIds.size && f.glazeBrands.size && !glazes.some((m) => f.glazeBrands.has(m.brand))) return false;
    if (f.clayIds.size && !clays.some((m) => f.clayIds.has(m.id))) return false;
    else if (!f.clayIds.size && f.clayBrands.size && !clays.some((m) => f.clayBrands.has(m.brand))) return false;
    return true;
  }

  function render() {
    const root = UI.el('<div></div>');
    root.appendChild(UI.el(`
      <div class="hello">
        <h1>Katalog szkliw pracowni</h1>
        <p>Sprawdzone połączenia udostępnione przez całą pracownię.</p>
      </div>`));

    const filtersEl = UI.el('<div class="cat-filters card" style="padding:15px 16px"></div>');
    const resultsEl = UI.el('<div class="cat-results"></div>');
    root.appendChild(filtersEl);
    root.appendChild(resultsEl);

    const shared = Store.sharedEntries();

    function brandGroup(label, cat, brandSet, idSet) {
      const wrap = UI.el(`<div class="cat-group"><div class="lbl">${label}</div><div class="bean-wrap brands"></div></div>`);
      const brandsEl = wrap.querySelector('.brands');
      const mats = [];
      shared.forEach((e) => entryMats(e, cat).forEach((m) => { if (!mats.some((x) => x.id === m.id)) mats.push(m); }));
      const brands = [...new Set(mats.map((m) => m.brand).filter(Boolean))].sort();

      brands.forEach((brand) => {
        const b = UI.el(`<button class="bean ${brandSet.has(brand) ? 'on' : ''}">${UI.esc(brand)}</button>`);
        b.onclick = () => {
          if (brandSet.has(brand)) {
            brandSet.delete(brand);
            mats.filter((m) => m.brand === brand).forEach((m) => idSet.delete(m.id));
          } else brandSet.add(brand);
          paint();
        };
        brandsEl.appendChild(b);
        /* modele bezpośrednio pod zaznaczoną marką */
        if (brandSet.has(brand)) {
          const sub = UI.el('<div class="cat-sub"></div>');
          mats.filter((m) => m.brand === brand).forEach((m) => {
            const mb = UI.el(`<button class="bean ${idSet.has(m.id) ? 'on' : ''}" style="font-size:12px;padding:4px 11px">${UI.esc(m.name)}</button>`);
            mb.onclick = () => { idSet.has(m.id) ? idSet.delete(m.id) : idSet.add(m.id); paint(); };
            sub.appendChild(mb);
          });
          brandsEl.insertAdjacentElement('afterend', sub);
        }
      });
      if (!brands.length) wrap.querySelector('.brands').innerHTML = '<span class="muted small">Jeszcze nic tu nie ma.</span>';
      return wrap;
    }

    function paintFilters() {
      filtersEl.innerHTML = '';
      filtersEl.appendChild(brandGroup('Marka szkliwa', 'szkliwa', f.glazeBrands, f.glazeIds));
      filtersEl.appendChild(brandGroup('Marka gliny', 'glina', f.clayBrands, f.clayIds));
      if (f.glazeBrands.size || f.clayBrands.size) {
        const clr = UI.el('<button class="btn subtle sm">Wyczyść filtry</button>');
        clr.onclick = () => { f.glazeBrands.clear(); f.glazeIds.clear(); f.clayBrands.clear(); f.clayIds.clear(); paint(); };
        filtersEl.appendChild(clr);
      }
    }

    function paintResults() {
      resultsEl.innerHTML = '';
      const hits = shared.filter(matches);
      if (!hits.length) {
        resultsEl.appendChild(UI.el(`
          <div class="empty" style="grid-column:1/-1">
            <div class="ic">${UI.icon('drop')}</div>
            <h3>Nie mamy jeszcze takiej kombinacji</h3>
            <p>Może to Ty ją pierwszy wypróbujesz i udostępnisz?</p>
          </div>`));
        return;
      }
      hits.forEach((e) => {
        const author = Store.user(e.userId);
        const photos = e.share.photoIds.filter((id) => Store.img(id)).slice(0, 2);
        const glazeB = entryMats(e, 'szkliwa').map((m) => `<span class="b glaze">${UI.esc(Store.matLabel(m.id))}</span>`).join('');
        const clayB = entryMats(e, 'glina').map((m) => `<span class="b clay">${UI.esc(Store.matLabel(m.id))}</span>`).join('');
        const restB = entryMats(e, 'farby').concat(entryMats(e, 'temperatura'))
          .map((m) => `<span class="b">${UI.esc(Store.matLabel(m.id))}</span>`).join('');
        const card = UI.el(`
          <div class="card cat-card">
            ${photos.length ? `<div class="imgs">${photos.map((id) => `<img src="${Store.img(id)}" alt="">`).join('')}</div>` : ''}
            <div class="body">
              <div class="beans">${glazeB}${clayB}${restB}</div>
              ${e.share.note && e.note ? `<div class="note">„${UI.esc(e.note)}”</div>` : ''}
              <div class="by">${author ? UI.esc(author.name.split(' ')[0]) : ''} · ${UI.fmtRel(e.createdAt)}</div>
            </div>
          </div>`);
        resultsEl.appendChild(card);
      });
    }

    function paint() { paintFilters(); paintResults(); }
    paint();
    return root;
  }

  return { render };
})();
