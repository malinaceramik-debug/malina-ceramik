/* ============================================================
   Store – stan aplikacji (localStorage) + zdjęcia (IndexedDB)
   ============================================================ */
const Store = (() => {
  const KEY = 'malina_ceramik_v2'; // v2: rebranding – świeże dane demo w kolorach marki
  const DB_NAME = 'malina-ceramik-img';

  let data = null;
  let db = null;
  const imgCache = new Map(); // id -> dataURL

  /* ---------- IndexedDB (zdjęcia) ---------- */
  function openDb() {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) return resolve(null);
      const rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('img');
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => resolve(null);
    });
  }
  function idbPut(id, val) {
    return new Promise((resolve) => {
      if (!db) return resolve();
      const tx = db.transaction('img', 'readwrite');
      tx.objectStore('img').put(val, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  function idbLoadAll() {
    return new Promise((resolve) => {
      if (!db) return resolve();
      const tx = db.transaction('img');
      const rq = tx.objectStore('img').openCursor();
      rq.onsuccess = () => {
        const c = rq.result;
        if (c) { imgCache.set(c.key, c.value); c.continue(); }
        else resolve();
      };
      rq.onerror = () => resolve();
    });
  }

  let imgSeq = 1;
  async function addImage(dataUrl) {
    const id = 'img_' + Date.now().toString(36) + '_' + (imgSeq++);
    imgCache.set(id, dataUrl);
    await idbPut(id, dataUrl);
    return id;
  }
  function img(id) { return imgCache.get(id) || ''; }

  /* ---------- Stan ---------- */
  function blank() {
    return {
      v: 1,
      seeded: false,
      currentUser: null,
      seq: 1, // numeracja kodów MC-XXXX
      users: [],
      materials: [],   // {id, cat, brand, name}
      deliveries: [],  // {id, userId, date, itemIds}
      items: [],       // {id, code, userId, deliveryId, createdAt, firing, status, before[], after[], materials{}, note, firedAt, pickedAt, reminded}
      journal: [],     // {id, userId, createdAt, photoIds[], materials{}, note, share{materials,note,photoIds[]}}
      payments: [],    // {id, userId, date, wB, wO, rateB, rateO, total, itemIds[]}
      notifications: [], // {id, userId, kind, text, date, read}
      rates: { biskwit: 9, ostro: 14 } // zł / kg
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? JSON.parse(raw) : blank();
    } catch (e) { data = blank(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
  }
  function uid() {
    return 'x' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }
  function emptySel() { return { glina: [], szkliwa: [], farby: [], temperatura: [] }; }

  /* ---------- Użytkownicy ---------- */
  function me() { return data.users.find((u) => u.id === data.currentUser) || null; }
  function user(id) { return data.users.find((u) => u.id === id) || null; }
  function setUser(id) { data.currentUser = id; save(); }

  /* ---------- Wyroby ---------- */
  function nextCode() {
    const c = 'MC-' + String(data.seq).padStart(4, '0');
    data.seq += 1;
    return c;
  }
  function itemsOf(userId) { return data.items.filter((i) => i.userId === userId); }
  function item(id) { return data.items.find((i) => i.id === id) || null; }
  function delivery(id) { return data.deliveries.find((d) => d.id === id) || null; }

  function deliveryIndex(it) {
    const d = delivery(it.deliveryId);
    if (!d) return { i: 1, n: 1 };
    return { i: d.itemIds.indexOf(it.id) + 1, n: d.itemIds.length };
  }
  function mainPhoto(it) {
    return it.after.length ? it.after[it.after.length - 1] : it.before[0];
  }
  function allPhotos(it) {
    const out = [];
    for (let k = it.after.length - 1; k >= 0; k--) out.push({ id: it.after[k], kind: 'po wypale' });
    it.before.forEach((p) => out.push({ id: p, kind: 'przed wypałem' }));
    return out;
  }

  function createDelivery(userId, photos) {
    // photos: [{imgId, firing:'biskwit'|'ostro'}]
    const d = { id: uid(), userId, date: Date.now(), itemIds: [] };
    photos.forEach((p) => {
      const it = {
        id: uid(), code: nextCode(), userId, deliveryId: d.id,
        createdAt: d.date, firing: p.firing,
        status: p.firing === 'ostro' ? 'czeka_ostro' : 'czeka_biskwit',
        before: [p.imgId], after: [],
        materials: emptySel(), note: '',
        firedAt: null, pickedAt: null, reminded: false
      };
      data.items.push(it);
      d.itemIds.push(it.id);
    });
    data.deliveries.push(d);
    save();
    return d;
  }

  function addAfterPhoto(it, imgId) {
    it.after.push(imgId);
    save();
  }

  function markFired(itemIds) {
    const byUser = {};
    itemIds.forEach((id) => {
      const it = item(id);
      if (!it || !it.status.startsWith('czeka')) return;
      it.status = 'gotowe';
      it.firedAt = Date.now();
      byUser[it.userId] = (byUser[it.userId] || 0) + 1;
    });
    Object.keys(byUser).forEach((uId) => {
      const n = byUser[uId];
      notify(uId, 'gotowe', n === 1
        ? 'Twój wyrób jest już wypalony i czeka na odbiór w pracowni.'
        : `Twoje wyroby (${n} szt.) są już wypalone i czekają na odbiór w pracowni.`);
    });
    save();
  }

  function processPickup(userId, itemIds, wB, wO) {
    const total = wB * data.rates.biskwit + wO * data.rates.ostro;
    const pay = {
      id: uid(), userId, date: Date.now(),
      wB, wO, rateB: data.rates.biskwit, rateO: data.rates.ostro,
      total: Math.round(total * 100) / 100, itemIds: itemIds.slice()
    };
    data.payments.push(pay);
    itemIds.forEach((id) => {
      const it = item(id);
      if (it) { it.status = 'odebrane'; it.pickedAt = pay.date; }
    });
    notify(userId, 'oplata', `Odbiór rozliczony: ${UI.money(pay.total)}. Dziękujemy i do zobaczenia!`);
    save();
    return pay;
  }

  /* statusy – widok kursanta */
  function kStatus(it) {
    if (it.status === 'gotowe') return { key: 'gotowe', label: 'Do odbioru' };
    if (it.status === 'odebrane') return { key: 'odebrane', label: 'Odebrany' };
    return { key: it.status, label: 'Czeka na wypał' };
  }
  /* statusy – widok instruktora */
  function iStatus(it) {
    return {
      czeka_biskwit: { key: 'czeka_biskwit', label: 'Czeka na biskwit' },
      czeka_ostro: { key: 'czeka_ostro', label: 'Czeka na ostro' },
      gotowe: { key: 'gotowe', label: 'Do odbioru' },
      odebrane: { key: 'odebrane', label: 'Odebrany' }
    }[it.status];
  }

  /* ---------- Materiały ---------- */
  function matsByCat(cat) { return data.materials.filter((m) => m.cat === cat); }
  function mat(id) { return data.materials.find((m) => m.id === id) || null; }
  function matLabel(id) {
    const m = mat(id);
    return m ? [m.brand, m.name].filter(Boolean).join(' ') : '';
  }
  function addMaterial(cat, brand, name) {
    brand = (brand || '').trim();
    name = (name || '').trim();
    if (!brand && !name) return null;
    const dup = data.materials.find((m) =>
      m.cat === cat &&
      m.brand.toLowerCase() === brand.toLowerCase() &&
      m.name.toLowerCase() === name.toLowerCase());
    if (dup) return dup.id;
    const m = { id: uid(), cat, brand, name };
    data.materials.push(m);
    save();
    return m.id;
  }

  /* ---------- Dziennik (kombinacje) ---------- */
  function journalOf(userId) {
    return data.journal.filter((e) => e.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  }
  function addJournalEntry(userId, fields) {
    const e = Object.assign({
      id: uid(), userId, createdAt: Date.now(),
      photoIds: [], materials: emptySel(), note: '',
      share: { materials: false, note: false, photoIds: [] }
    }, fields || {});
    data.journal.push(e);
    save();
    return e;
  }
  function sharedEntries() {
    return data.journal.filter((e) => e.share.materials).sort((a, b) => b.createdAt - a.createdAt);
  }

  /* ---------- Powiadomienia ---------- */
  function notify(userId, kind, text) {
    data.notifications.push({ id: uid(), userId, kind, text, date: Date.now(), read: false });
    save();
    if (window.App && App.refreshHeader) App.refreshHeader();
  }
  function notifsOf(userId) {
    return data.notifications.filter((n) => n.userId === userId).sort((a, b) => b.date - a.date);
  }
  function unread(userId) {
    return data.notifications.filter((n) => n.userId === userId && !n.read).length;
  }
  function markAllRead(userId) {
    data.notifications.forEach((n) => { if (n.userId === userId) n.read = true; });
    save();
  }

  /* przypomnienie o długim nieodebraniu (14 dni) */
  function checkReminders() {
    const limit = Date.now() - 14 * 24 * 3600 * 1000;
    const byUser = {};
    data.items.forEach((it) => {
      if (it.status === 'gotowe' && it.firedAt && it.firedAt < limit && !it.reminded) {
        it.reminded = true;
        byUser[it.userId] = (byUser[it.userId] || 0) + 1;
      }
    });
    Object.keys(byUser).forEach((uId) => {
      notify(uId, 'przypomnienie', 'Twoje wyroby czekają w pracowni już ponad dwa tygodnie. Wpadnij po nie przy okazji!');
    });
    if (Object.keys(byUser).length) save();
  }

  /* ---------- Init ---------- */
  async function init() {
    load();
    db = await openDb();
    await idbLoadAll();
    if (!data.seeded) {
      await Seed.run();
      data.seeded = true;
      save();
    }
    checkReminders();
  }

  return {
    init, save, uid, emptySel,
    get data() { return data; },
    addImage, img,
    me, user, setUser,
    itemsOf, item, delivery, deliveryIndex, mainPhoto, allPhotos,
    createDelivery, addAfterPhoto, markFired, processPickup,
    kStatus, iStatus,
    matsByCat, mat, matLabel, addMaterial,
    journalOf, addJournalEntry, sharedEntries,
    notify, notifsOf, unread, markAllRead
  };
})();
