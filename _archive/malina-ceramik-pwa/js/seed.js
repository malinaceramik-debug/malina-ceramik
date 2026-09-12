/* ============================================================
   Seed – dane demonstracyjne + generator ilustracji naczyń
   (w prawdziwej pracowni zastąpią je zdjęcia z telefonu)
   ============================================================ */
const Seed = (() => {

  /* deterministyczny pseudolosowy generator */
  function rng(seedStr) {
    let h = 1779033703;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  const SHAPES = {
    wazon: 'M150 64 C158 64 170 67 170 80 C170 93 158 97 158 112 C158 130 204 140 204 204 C204 262 182 296 150 296 C118 296 96 262 96 204 C96 140 142 130 142 112 C142 97 130 93 130 80 C130 67 142 64 150 64 Z',
    miska: 'M62 178 C62 254 100 298 150 298 C200 298 238 254 238 178 C210 192 178 198 150 198 C122 198 90 192 62 178 Z',
    kubek: 'M104 130 C100 130 96 134 96 142 L100 280 C100 290 110 296 150 296 C190 296 200 290 200 280 L204 142 C204 134 200 130 196 130 Z',
    dzbanek: 'M150 70 C160 70 172 74 170 86 C168 96 160 100 162 114 C166 138 210 150 208 210 C206 266 184 296 150 296 C116 296 94 266 92 210 C90 150 134 138 138 114 C140 100 132 96 130 86 C128 74 140 70 150 70 Z',
    talerz: 'M150 222 C212 222 252 240 252 262 C252 284 212 300 150 300 C88 300 48 284 48 262 C48 240 88 222 150 222 Z'
  };

  const GLAZES = [
    ['#F6B58E', '#F39268'], ['#EED5C6', '#DF9183'], ['#B9C7CE', '#8FA5B5'],
    ['#F0A78F', '#DF7B66'], ['#D8CFC2', '#A99B86'], ['#ADBFB3', '#7E9B88'],
    ['#EAD9C2', '#CDA67E'], ['#454D50', '#222729']
  ];
  const BGS = ['#F6E8DE', '#F2DFD2', '#F9EFE7', '#EFD9CA', '#F4E6DB'];

  /* ilustracja naczynia jako dataURL (svg) */
  function vessel(seedStr, opts) {
    opts = opts || {};
    const r = rng(seedStr);
    const shapeNames = Object.keys(SHAPES);
    const shape = opts.shape || shapeNames[Math.floor(r() * shapeNames.length)];
    const glaze = opts.glaze || GLAZES[Math.floor(r() * GLAZES.length)];
    const bg = BGS[Math.floor(r() * BGS.length)];
    const path = SHAPES[shape];
    const gid = 'g' + Math.floor(r() * 1e9).toString(36);

    let speckles = '';
    const n = 26 + Math.floor(r() * 22);
    for (let i = 0; i < n; i++) {
      const x = 60 + r() * 180, y = 70 + r() * 220, s = 0.7 + r() * 1.7;
      speckles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="#222729" opacity="${(0.05 + r() * 0.1).toFixed(2)}"/>`;
    }
    /* wersja "po wypale": połysk i zacieki szkliwa */
    let gloss = '';
    if (opts.fired) {
      let drips = '';
      for (let i = 0; i < 4; i++) {
        const x = 105 + i * 28 + r() * 12, h = 60 + r() * 90;
        drips += `<rect x="${x.toFixed(0)}" y="64" width="${(8 + r() * 8).toFixed(0)}" height="${h.toFixed(0)}" rx="8" fill="${glaze[1]}" opacity="0.55"/>`;
      }
      gloss = `<g clip-path="url(#${gid}c)">${drips}
        <ellipse cx="118" cy="150" rx="14" ry="58" fill="#fff" opacity="0.30" transform="rotate(8 118 150)"/></g>`;
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340">
        <defs>
          <linearGradient id="${gid}" x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0" stop-color="${glaze[0]}"/><stop offset="1" stop-color="${glaze[1]}"/>
          </linearGradient>
          <clipPath id="${gid}c"><path d="${path}"/></clipPath>
        </defs>
        <rect width="300" height="340" fill="${bg}"/>
        <rect y="282" width="300" height="58" fill="#222729" opacity="0.05"/>
        <ellipse cx="150" cy="300" rx="86" ry="11" fill="#222729" opacity="0.13"/>
        <path d="${path}" fill="url(#${gid})"/>
        ${gloss}
        <g clip-path="url(#${gid}c)">${speckles}</g>
      </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\s{2,}/g, ' '));
  }

  /* ---------- Dane demo ---------- */
  async function run() {
    const d = Store.data;
    const day = 24 * 3600 * 1000;
    const now = Date.now();

    /* użytkownicy */
    const ania = { id: 'u_ania', name: 'Ania Kowalska', role: 'kursant', color: '#DF9183' };
    const marta = { id: 'u_marta', name: 'Marta Wilk', role: 'kursant', color: '#8FA5B5' };
    const tomek = { id: 'u_tomek', name: 'Tomek Lis', role: 'kursant', color: '#9DAF9B' };
    const malina = { id: 'u_malina', name: 'Malina', role: 'instruktor', color: '#222729' };
    d.users.push(ania, marta, tomek, malina);

    /* materiały */
    const M = (cat, brand, name) => Store.addMaterial(cat, brand, name);
    const gGS = M('glina', 'G&S', '239 jasna');
    const gGS2 = M('glina', 'G&S', '254 czarna');
    const gSib = M('glina', 'Sibelco', 'WM 2502');
    const sBotzT = M('szkliwa', 'Botz', '9106 Turkus');
    const sBotzB = M('szkliwa', 'Botz', '9351 Biel');
    const sAmacoPC = M('szkliwa', 'Amaco', 'PC-20 Blue Rutile');
    const sAmacoO = M('szkliwa', 'Amaco', 'C-1 Obsidian');
    const sMayco = M('szkliwa', 'Mayco', 'SW-145 Tea Dust');
    const fVelvet = M('farby', 'Amaco', 'Velvet V-326');
    const fUni = M('farby', 'Botz', 'Unidekor czerń');
    const t1050 = M('temperatura', '', '1050°C');
    const t1100 = M('temperatura', '', '1100°C');
    const t1230 = M('temperatura', '', '1230°C');

    /* zdjęcia-ilustracje */
    async function ph(seedStr, opts) { return Store.addImage(vessel(seedStr, opts)); }

    /* dostawa: tworzy wyroby ze statusem + datami */
    async function batch(user, daysAgo, defs) {
      const photos = [];
      for (const def of defs) {
        photos.push({ imgId: await ph(user.id + def.seed, { shape: def.shape }), firing: def.firing, def });
      }
      const del = Store.createDelivery(user.id, photos);
      const date = now - daysAgo * day;
      del.date = date;
      del.itemIds.forEach((id, i) => {
        const it = Store.item(id);
        const def = defs[i];
        it.createdAt = date;
        if (def.status) it.status = def.status;
        if (def.status === 'gotowe' || def.status === 'odebrane') it.firedAt = date + 4 * day;
        if (def.status === 'odebrane') it.pickedAt = date + 8 * day;
        if (def.after) { /* zdjęcie po wypale dodamy niżej */ }
        if (def.mats) it.materials = def.mats;
        if (def.note) it.note = def.note;
      });
      for (let i = 0; i < defs.length; i++) {
        if (defs[i].after) {
          const it = Store.item(del.itemIds[i]);
          it.after.push(await ph(user.id + defs[i].seed + '_po', { shape: defs[i].shape, fired: true }));
        }
      }
      return del;
    }
    const sel = (o) => Object.assign(Store.emptySel(), o);

    /* — Ania — */
    const aOld = await batch(ania, 24, [
      { seed: 'a1', shape: 'kubek', firing: 'biskwit', status: 'odebrane', after: true,
        mats: sel({ glina: [gGS], szkliwa: [sBotzT], temperatura: [t1050] }), note: 'Pierwszy kubek! Ucho trochę krzywe, ale mój.' },
      { seed: 'a2', shape: 'miska', firing: 'biskwit', status: 'odebrane', after: true,
        mats: sel({ glina: [gGS], szkliwa: [sAmacoPC], temperatura: [t1100] }) },
      { seed: 'a3', shape: 'talerz', firing: 'ostro', status: 'odebrane', after: true,
        mats: sel({ glina: [gSib], szkliwa: [sBotzB], farby: [fUni], temperatura: [t1230] }) }
    ]);
    const aMid = await batch(ania, 9, [
      { seed: 'a4', shape: 'wazon', firing: 'ostro', status: 'gotowe',
        mats: sel({ glina: [gGS2], szkliwa: [sMayco], temperatura: [t1230] }), note: 'Tea Dust na czarnej glinie – sprawdzić jak wyszło przy uchu.' },
      { seed: 'a5', shape: 'kubek', firing: 'ostro', status: 'gotowe' }
    ]);
    await batch(ania, 2, [
      { seed: 'a6', shape: 'miska', firing: 'biskwit' },
      { seed: 'a7', shape: 'kubek', firing: 'biskwit' },
      { seed: 'a8', shape: 'dzbanek', firing: 'ostro',
        mats: sel({ szkliwa: [sBotzT, sBotzB] }) }
    ]);

    /* — Marta — */
    await batch(marta, 16, [
      { seed: 'm1', shape: 'wazon', firing: 'biskwit', status: 'gotowe' },
      { seed: 'm2', shape: 'talerz', firing: 'ostro', status: 'gotowe',
        mats: sel({ glina: [gSib], szkliwa: [sAmacoO], temperatura: [t1230] }) }
    ]);
    await batch(marta, 4, [
      { seed: 'm3', shape: 'miska', firing: 'ostro' },
      { seed: 'm4', shape: 'kubek', firing: 'biskwit' }
    ]);

    /* — Tomek — */
    await batch(tomek, 6, [
      { seed: 't1', shape: 'dzbanek', firing: 'biskwit' },
      { seed: 't2', shape: 'miska', firing: 'biskwit' },
      { seed: 't3', shape: 'kubek', firing: 'ostro', status: 'odebrane', after: true,
        mats: sel({ glina: [gGS], szkliwa: [sAmacoPC], temperatura: [t1100] }) }
    ]);

    /* płatności Ani */
    d.payments.push({
      id: Store.uid(), userId: ania.id, date: now - 16 * day,
      wB: 1.2, wO: 0.9, rateB: 9, rateO: 14, total: 23.4,
      itemIds: aOld.itemIds.slice()
    });

    /* dziennik + udostępnienia do katalogu */
    const j1 = Store.addJournalEntry(ania.id, {
      photoIds: [Store.item(aOld.itemIds[0]).after[0], Store.item(aOld.itemIds[0]).before[0]],
      materials: sel({ glina: [gGS], szkliwa: [sBotzT], temperatura: [t1050] }),
      note: 'Turkus Botz pięknie spływa na krawędziach. Nakładać 2 warstwy, trzecia robi zacieki.'
    });
    j1.share = { materials: true, note: true, photoIds: [j1.photoIds[0]] };
    j1.createdAt = now - 14 * day;

    const j2 = Store.addJournalEntry(ania.id, {
      photoIds: [Store.item(aOld.itemIds[2]).after[0]],
      materials: sel({ glina: [gSib], szkliwa: [sBotzB], farby: [fUni], temperatura: [t1230] }),
      note: 'Czarny Unidekor pod białym szkliwem lekko się rozmywa – ciekawy efekt akwareli.'
    });
    j2.createdAt = now - 12 * day;

    const j3 = Store.addJournalEntry(marta.id, {
      photoIds: [],
      materials: sel({ glina: [gGS2], szkliwa: [sMayco], temperatura: [t1230] }),
      note: 'Tea Dust na czarnej glinie wychodzi matowo-złoto. Mój ulubiony zestaw.'
    });
    j3.share = { materials: true, note: true, photoIds: [] };
    j3.createdAt = now - 8 * day;

    const j4 = Store.addJournalEntry(malina.id, {
      photoIds: [await ph('malina_j1', { shape: 'wazon', fired: true })],
      materials: sel({ glina: [gSib], szkliwa: [sAmacoPC, sBotzB], temperatura: [t1230] }),
      note: 'Blue Rutile nad bielą – przetarcia na kantach. Do pokazania na warsztatach.'
    });
    j4.share = { materials: true, note: false, photoIds: [j4.photoIds[0]] };
    j4.createdAt = now - 5 * day;

    /* powiadomienia */
    d.notifications.push(
      { id: Store.uid(), userId: ania.id, kind: 'gotowe', text: 'Twoje wyroby (2 szt.) są już wypalone i czekają na odbiór w pracowni.', date: now - 5 * day, read: false },
      { id: Store.uid(), userId: ania.id, kind: 'wydarzenie', text: 'Warsztaty świątecznych talerzy – sobota 20 czerwca, 11:00. Zapisy u Maliny.', date: now - 1 * day, read: false },
      { id: Store.uid(), userId: marta.id, kind: 'gotowe', text: 'Twoje wyroby (2 szt.) są już wypalone i czekają na odbiór w pracowni.', date: now - 11 * day, read: true },
      { id: Store.uid(), userId: malina.id, kind: 'wydarzenie', text: 'Pełny piec biskwitowy – zaplanuj wypał w tym tygodniu.', date: now - 1 * day, read: false }
    );

    Store.save();
  }

  return { run, vessel };
})();
