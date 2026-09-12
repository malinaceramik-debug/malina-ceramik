/* ============================================================
   Preview – pełnoekranowy podgląd wyrobu
   (zdjęcia, statusy, notatki materiałowe, zdjęcia po wypale)
   ============================================================ */
const Preview = (() => {
  let root = null, list = [], idx = 0, photoIdx = 0, keyHandler = null;

  function open(itemIds, startIdx) {
    close();
    list = itemIds.slice();
    idx = Math.max(0, Math.min(startIdx || 0, list.length - 1));
    photoIdx = 0;

    root = UI.el('<div class="pv" role="dialog" aria-label="Podgląd wyrobu"></div>');
    document.getElementById('overlays').appendChild(root);

    keyHandler = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') nav(1);
      if (e.key === 'ArrowLeft') nav(-1);
    };
    document.addEventListener('keydown', keyHandler);
    render();
  }
  function close() {
    if (root) { root.remove(); root = null; }
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
  }
  function nav(d) {
    const ni = idx + d;
    if (ni < 0 || ni >= list.length) return;
    idx = ni; photoIdx = 0;
    render();
  }

  function render() {
    const it = Store.item(list[idx]);
    if (!it) { close(); return; }
    const meUser = Store.me();
    const own = meUser && meUser.id === it.userId;
    const isInstructor = meUser && meUser.role === 'instruktor';
    const photos = Store.allPhotos(it);
    if (photoIdx >= photos.length) photoIdx = 0;
    const kSt = Store.kStatus(it);
    const iSt = Store.iStatus(it);
    const st = isInstructor ? iSt : kSt;
    const di = Store.deliveryIndex(it);
    const fired = it.status === 'gotowe' || it.status === 'odebrane';
    const ownerName = (Store.user(it.userId) || {}).name || '';

    root.innerHTML = `
      <div class="stage">
        <div class="top">
          <button class="iconbtn back" aria-label="Wróć">${UI.icon('back')}</button>
          <div class="info">
            <div class="t1">Wyrób z ${UI.fmtDay(it.createdAt)}</div>
            <div class="t2">${di.i} z ${di.n} w tej dostawie · <span class="mono">${it.code}</span>${isInstructor ? ' · ' + UI.esc(ownerName) : ''}</div>
            <div class="chips">
              <span class="chip ${st.key}">${st.label}</span>
              <span class="chip ${it.firing}">${it.firing === 'ostro' ? 'Na ostro' : 'Biskwit'}</span>
            </div>
          </div>
        </div>
        <button class="arrow l" aria-label="Poprzedni">${UI.icon('chevL')}</button>
        <img class="main" src="${Store.img(photos[photoIdx].id)}" alt="Wyrób">
        <button class="arrow r" aria-label="Następny">${UI.icon('chevR')}</button>
        ${own && fired ? `<button class="afterbtn">${UI.icon('camera')} Dodaj zdjęcie po wypale</button>` : ''}
      </div>
      <div class="panel">
        <div class="grip"></div>
        <div class="thumbs"></div>
        <div class="notes"></div>
        <div class="actions"></div>
      </div>`;

    root.querySelector('.back').onclick = close;
    root.querySelector('.arrow.l').onclick = () => nav(-1);
    root.querySelector('.arrow.r').onclick = () => nav(1);
    if (list.length < 2) root.querySelectorAll('.arrow').forEach((a) => a.style.display = 'none');

    const stage = root.querySelector('.stage');
    UI.swipe(stage, () => nav(1), () => nav(-1));

    /* miniaturki: efekty finalne + zdjęcia przed wypałem */
    const thumbs = root.querySelector('.thumbs');
    if (photos.length > 1) {
      photos.forEach((p, i) => {
        const th = UI.el(`
          <button class="th ${i === photoIdx ? 'on' : ''}">
            <img src="${Store.img(p.id)}" alt="">
            ${it.after.length ? `<span class="tag">${p.kind === 'po wypale' ? 'po' : 'przed'}</span>` : ''}
          </button>`);
        th.onclick = () => { photoIdx = i; render(); };
        thumbs.appendChild(th);
      });
    } else {
      thumbs.style.display = 'none';
    }

    /* zdjęcie po wypale */
    const ab = root.querySelector('.afterbtn');
    if (ab) ab.onclick = () => {
      UI.pickPhotos(async (urls) => {
        for (const u of urls) Store.addAfterPhoto(it, await Store.addImage(u));
        photoIdx = 0;
        render();
        UI.toast(urls.length === 1 ? 'Dodano zdjęcie po wypale' : `Dodano ${urls.length} zdjęcia po wypale`);
      });
    };

    /* notatki materiałowe */
    const notes = root.querySelector('.notes');
    notes.appendChild(UI.beanEditor(it.materials, () => Store.save(), !own));

    const noteBox = UI.el(`
      <div class="field" style="margin-top:6px">
        <label>Notatka</label>
        ${own
          ? `<textarea placeholder="np. dwie warstwy szkliwa, cienko przy uchu…">${UI.esc(it.note)}</textarea>`
          : `<p class="muted" style="margin:0">${it.note ? UI.esc(it.note) : '—'}</p>`}
      </div>`);
    notes.appendChild(noteBox);

    /* akcje */
    const actions = root.querySelector('.actions');
    if (own) {
      const saveBtn = UI.el(`<button class="btn sm">Zapisz notatkę</button>`);
      saveBtn.onclick = () => {
        it.note = noteBox.querySelector('textarea').value.trim();
        Store.save();
        UI.toast('Notatka zapisana');
      };
      actions.appendChild(saveBtn);

      const toJournal = UI.el(`<button class="btn ghost sm">${UI.icon('book')} Zapisz w kombinacjach</button>`);
      toJournal.onclick = () => {
        const mats = JSON.parse(JSON.stringify(it.materials));
        Store.addJournalEntry(meUser.id, {
          photoIds: Store.allPhotos(it).map((p) => p.id),
          materials: mats,
          note: it.note
        });
        UI.toast('Zapisano w Moich kombinacjach');
      };
      actions.appendChild(toJournal);
    }
    if (isInstructor && it.status.startsWith('czeka')) {
      const fireBtn = UI.el(`<button class="btn coral sm">${UI.icon('fire')} Oznacz jako wypalony</button>`);
      fireBtn.onclick = async () => {
        if (await UI.confirm('Oznaczyć ten wyrób jako wypalony? Kursant dostanie powiadomienie.', 'Wypalony')) {
          Store.markFired([it.id]);
          render();
          UI.toast('Oznaczono jako wypalony');
        }
      };
      actions.appendChild(fireBtn);
    }
  }

  return { open, close };
})();
