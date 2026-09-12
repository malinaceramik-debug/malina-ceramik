/* ============================================================
   Journal – prywatny dziennik ceramiczny („Moje kombinacje”
   kursanta oraz dziennik instruktora). Udostępnianie do katalogu.
   ============================================================ */
const Journal = (() => {

  function render() {
    const meUser = Store.me();
    const isInstructor = meUser.role === 'instruktor';
    const root = UI.el('<div></div>');
    root.appendChild(UI.el(`
      <div class="hello">
        <h1>${isInstructor ? 'Dziennik ceramiczny' : 'Moje kombinacje'}</h1>
        <p>Twoje prywatne zapiski. Udostępniasz tylko to, co sama wybierzesz.</p>
      </div>`));

    const bar = UI.el(`<div class="gallery-bar"><div class="spacer"></div></div>`);
    const addBtn = UI.el(`<button class="btn sm coral">${UI.icon('plus')} Nowy wpis</button>`);
    addBtn.onclick = () => entrySheet(null, paint);
    bar.appendChild(addBtn);
    root.appendChild(bar);

    const grid = UI.el('<div class="journal-grid"></div>');
    root.appendChild(grid);

    function paint() {
      grid.innerHTML = '';
      const entries = Store.journalOf(meUser.id);
      if (!entries.length) {
        grid.appendChild(UI.el(`
          <div class="empty" style="grid-column:1/-1">
            <div class="ic">${UI.icon('book')}</div>
            <h3>Twój dziennik jest pusty</h3>
            <p>Zapisuj kombinacje glin i szkliw, żeby wracać do tych najlepszych.</p>
          </div>`));
        return;
      }
      entries.forEach((e) => {
        const ph = e.photoIds.find((id) => Store.img(id));
        const sharedAny = e.share.materials || e.share.note || e.share.photoIds.length;
        const card = UI.el(`
          <button class="jcard">
            ${ph ? `<img src="${Store.img(ph)}" alt="">` : ''}
            <div class="body">
              <div class="beans">${UI.beanPills(e.materials, 3) || '<span class="b">bez materiałów</span>'}</div>
              <div class="meta">${UI.icon(sharedAny ? 'eye' : 'lock')} ${sharedAny ? 'udostępnione pracowni' : 'prywatne'} · ${UI.fmtRel(e.createdAt)}</div>
            </div>
          </button>`);
        card.onclick = () => entrySheet(e, paint);
        grid.appendChild(card);
      });
    }
    paint();
    return root;
  }

  /* arkusz wpisu: nowy lub edycja istniejącego */
  function entrySheet(entry, onDone) {
    const meUser = Store.me();
    const isNew = !entry;
    const draft = entry || {
      photoIds: [], materials: Store.emptySel(), note: '',
      share: { materials: false, note: false, photoIds: [] }
    };

    const body = UI.el('<div></div>');

    /* zdjęcia */
    const photosWrap = UI.el('<div class="field"><label>Zdjęcia</label><div class="jphotos"></div></div>');
    const jph = photosWrap.querySelector('.jphotos');
    function paintPhotos() {
      jph.innerHTML = '';
      draft.photoIds.forEach((id) => {
        const shared = draft.share.photoIds.includes(id);
        const p = UI.el(`
          <button class="jp ${shared ? 'shared' : ''}" title="${shared ? 'Udostępnione' : 'Prywatne'}">
            <img src="${Store.img(id)}" alt="">
            <span class="shr">${UI.icon(shared ? 'eye' : 'lock')}</span>
          </button>`);
        p.onclick = () => {
          const ix = draft.share.photoIds.indexOf(id);
          if (ix >= 0) draft.share.photoIds.splice(ix, 1);
          else draft.share.photoIds.push(id);
          if (!isNew) Store.save();
          paintPhotos();
        };
        jph.appendChild(p);
      });
      const add = UI.el(`<button class="jp" style="border:2px dashed var(--line-strong);background:none;display:flex;align-items:center;justify-content:center;color:var(--muted)">${UI.icon('plus')}</button>`);
      add.onclick = () => UI.pickPhotos(async (urls) => {
        for (const u of urls) draft.photoIds.push(await Store.addImage(u));
        if (!isNew) Store.save();
        paintPhotos();
      });
      jph.appendChild(add);
    }
    paintPhotos();
    body.appendChild(photosWrap);
    body.appendChild(UI.el('<p class="muted small" style="margin:2px 0 14px">Dotknij zdjęcia, aby zdecydować, czy trafi do wspólnego katalogu.</p>'));

    /* materiały */
    body.appendChild(UI.beanEditor(draft.materials, () => { if (!isNew) Store.save(); }));

    /* notatka */
    const noteF = UI.el(`
      <div class="field" style="margin-top:4px">
        <label>Notatka</label>
        <textarea placeholder="np. dwie warstwy, mocne zacieki na kantach…">${UI.esc(draft.note)}</textarea>
      </div>`);
    body.appendChild(noteF);

    /* udostępnianie */
    const shareBox = UI.el(`
      <div style="margin-top:6px">
        <div class="bean-row"><div class="lbl">Udostępnianie</div></div>
        <div class="switchrow">
          <div class="txt"><div class="t">Kombinacja materiałów</div><div class="s">Glina, szkliwa i temperatura w katalogu pracowni</div></div>
          <label class="switch"><input type="checkbox" class="sw-mat" ${draft.share.materials ? 'checked' : ''}><span class="tr"></span></label>
        </div>
        <div class="switchrow">
          <div class="txt"><div class="t">Notatka</div><div class="s">Twoja notatka widoczna przy kombinacji</div></div>
          <label class="switch"><input type="checkbox" class="sw-note" ${draft.share.note ? 'checked' : ''}><span class="tr"></span></label>
        </div>
        <p class="muted small" style="margin:10px 0 0">To, czego nie udostępnisz, zostaje wyłącznie w Twoim prywatnym dzienniku.</p>
      </div>`);
    body.appendChild(shareBox);

    /* akcje */
    const actions = UI.el('<div class="hrow" style="margin-top:18px"></div>');
    const saveBtn = UI.el(`<button class="btn block">${isNew ? 'Zapisz wpis' : 'Zapisz zmiany'}</button>`);
    actions.appendChild(saveBtn);
    if (!isNew) {
      const del = UI.el('<button class="btn ghost sm" style="margin-top:8px;width:100%">Usuń wpis</button>');
      del.onclick = async () => {
        if (await UI.confirm('Usunąć ten wpis z dziennika? Tej decyzji nie można cofnąć.', 'Usuń')) {
          const ix = Store.data.journal.indexOf(entry);
          if (ix >= 0) Store.data.journal.splice(ix, 1);
          Store.save();
          sh.close();
          if (onDone) onDone();
        }
      };
      actions.appendChild(del);
    }
    body.appendChild(actions);

    const sh = UI.sheet(isNew ? 'Nowy wpis' : 'Wpis z ' + UI.fmtDay(draft.createdAt || Date.now()), body);

    saveBtn.onclick = () => {
      draft.note = noteF.querySelector('textarea').value.trim();
      draft.share.materials = shareBox.querySelector('.sw-mat').checked;
      draft.share.note = shareBox.querySelector('.sw-note').checked;
      if (isNew) Store.addJournalEntry(meUser.id, draft);
      else Store.save();
      sh.close();
      UI.toast(isNew ? 'Wpis zapisany w dzienniku' : 'Zmiany zapisane');
      if (onDone) onDone();
    };
  }

  return { render, entrySheet };
})();
