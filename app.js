/* Thrive Images: draws every page from data/designs.json and data/photos.json. */

const TRAINING = [
  ['Getting started', [['Using the Thrive Images Document', 'https://youtu.be/CFwbcn-AfCc', true], ['What Is Canva?', 'https://youtu.be/mey484U7Zac']]],
  ['Editing images', [['How to Add a New Image in Canva', 'https://youtu.be/Tv9rcXZlqM8'], ['How to Add and Edit Elements in Canva', 'https://youtu.be/iMCBbCVfeys'], ['How to Edit Text in Canva', 'https://youtu.be/U0Vyn6w-L6E']]],
  ['Finishing images', [['How to Download and File Your Images', 'https://youtu.be/glWCAnrS-YM'], ['How to Make an Image from Start to Finish', 'https://youtu.be/3npraqmYuuM']]],
  ['Tips', [['Tips on Making Your Images Quickly', 'https://youtu.be/jcJSFaditiM'], ['A Few Things That Could Go Wrong', 'https://youtu.be/y1Ygz165FO8']]]
];
const STD = ['Square', 'Square Shaded', 'Review Card', 'Vertical', 'Circle'];
const FALLBACK_SHAPE = { Vertical: 9 / 16, Header: 900 / 365, 'Series Image': 16 / 9, 'Series App Image': 16 / 9 };
const LANGS = [['es', 'Spanish'], ['fr', 'French'], ['pt', 'Portuguese'], ['ru', 'Russian'], ['uk', 'Ukrainian'], ['ar', 'Arabic'], ['fa', 'Persian'], ['zh-CN', 'Chinese (Simplified)'], ['zh-TW', 'Chinese (Traditional)'], ['hi', 'Hindi'], ['bn', 'Bengali'], ['ur', 'Urdu'], ['id', 'Indonesian'], ['vi', 'Vietnamese'], ['th', 'Thai'], ['tl', 'Tagalog'], ['ko', 'Korean'], ['ja', 'Japanese'], ['sw', 'Swahili'], ['am', 'Amharic'], ['sq', 'Albanian'], ['ro', 'Romanian'], ['pl', 'Polish'], ['de', 'German'], ['it', 'Italian'], ['tr', 'Turkish']];
const PLAY = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';

let DATA = null, PHOTOS = [], PHOTO_BY_STUDY = {};

const store = {
  get(k, d) { try { const v = localStorage.getItem('thrive:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('thrive:' + k, JSON.stringify(v)); } catch (e) { /* private window: skip */ } }
};
const state = {
  opened: new Set(store.get('opened', [])),
  working: false, size: store.get('size', 'M'), wordsOnly: false, showOld: false, search: '', typeOff: new Set()
};

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s).toUpperCase().replace(/’/g, "'").replace(/&/g, 'AND').replace(/[^A-Z0-9]/g, '');
const thumbUrl = u => /\/view$/.test(u) ? u.replace(/\/view$/, '/screen?type=thumbnail') : '';
const download = id => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
const fmtMB = b => b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.round(b / 1e3) + ' KB';

function chipOf(t) { return STD.includes(t) ? t : 'Extras'; }
function isOld(img) { return img.status === 'old' || (DATA.types[img.type] || {}).status === 'old'; }
function isHidden(img) { return img.status === 'hidden' || (DATA.types[img.type] || {}).status === 'hidden'; }

/* ---------- Tiles ---------- */
function tileHTML(img, study) {
  const ar = img.w && img.h ? img.w / img.h : (FALLBACK_SHAPE[img.type] || 1);
  const t = thumbUrl(img.url);
  const old = isOld(img);
  const label = STD.includes(img.type) ? img.type : img.name;
  const cls = ['tile', img.type === 'Circle' ? 'round' : '', old ? 'old' : '', state.opened.has(img.url) ? 'opened' : ''].join(' ');
  const size = img.w ? ` · ${img.w} × ${img.h}` : '';
  const inner = t
    ? `<img src="${esc(t)}" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'texttile',textContent:this.closest('.tile').dataset.name}))">`
    : `<span class="texttile">${esc(img.name)}</span>`;
  const tags = (old ? ' <span class="oldtag">Old design</span>' : '') + (img.dark ? ' · Dark mode' : '');
  return `<a class="${cls}" href="${esc(img.url)}" target="_blank" rel="noopener" style="--ar:${ar.toFixed(4)}"
      data-u="${esc(img.url)}" data-chip="${chipOf(img.type)}" data-w="${img.words ? 1 : 0}" data-old="${old ? 1 : 0}" data-name="${esc(img.name)}"
      title="${esc(`${study} · ${img.name}${size}${img.words ? ' · has words to translate' : ''}`)}">
    <span class="thumb">${img.words ? '<span class="badge" title="Has words to translate">Aa</span>' : ''}${inner}<span class="done" aria-hidden="true">✓</span></span>
    ${img.words ? `<button class="trx" type="button" data-study="${esc(study)}" data-name="${esc(img.name)}">Translate</button>` : ''}
    <span class="cap">${esc(label)}${tags}</span></a>`;
}

function studyHTML(st, opts = {}) {
  const imgs = st.images.filter(i => !isHidden(i));
  if (!imgs.length) return '';
  const order = i => { const k = STD.indexOf(i.type); return (isOld(i) ? 100 : 0) + (k < 0 ? 50 : k); };
  const sorted = [...imgs].sort((a, b) => order(a) - order(b));
  const active = imgs.filter(i => !isOld(i));
  const words = active.filter(i => i.words).length;
  const photos = opts.noPhoto ? [] : (PHOTO_BY_STUDY[norm(st.name)] || []);
  const photoLinks = photos.map((p, n) => `<a class="linkbtn" href="${download(p.id)}" title="${esc(p.file)} · ${p.w} × ${p.h}">Original photo${photos.length > 1 ? ' ' + (n + 1) : ''} ↓</a>`).join('');
  return `<div class="study" data-search="${esc(norm(st.name))}">
    <div class="sname"><b>${esc(st.name)}</b><small>${active.length} images · ${words} with words</small>
      <button class="linkbtn open1" type="button">Open all</button>${photoLinks}</div>
    <div class="tiles">${sorted.map(i => tileHTML(i, st.name)).join('')}</div></div>`;
}

/* ---------- Pages ---------- */
function pages() {
  return [['home', 'Home'], ...DATA.levels.map(l => [l.id, l.name]), ['sep'], ['appweb', 'App & Web'], ['photos', 'Original Photos'], ['training', 'Training']];
}
function renderTabs(cur) {
  document.getElementById('tabs').innerHTML = pages().map(p => p[0] === 'sep' ? '<span class="sep" aria-hidden="true"></span>'
    : `<a href="#${p[0]}" ${p[0] === cur ? 'aria-current="page"' : ''}>${p[1]}</a>`).join('');
}
const allImages = L => L.series.flatMap(se => se.studies.flatMap(s => s.images));

function renderHome() {
  const card = L => {
    const imgs = allImages(L).filter(i => i.type === 'Square Shaded' && !isOld(i)).slice(0, 4);
    const n = allImages(L).filter(i => !isOld(i) && !isHidden(i)).length;
    const studies = L.series.reduce((a, se) => a + se.studies.filter(s => s.images.some(i => STD.includes(i.type))).length, 0);
    return `<a class="lcard" href="#${L.id}"><span class="pics">${imgs.map(i => `<img src="${esc(thumbUrl(i.url))}" alt="" loading="lazy" onerror="this.remove()">`).join('')}</span>
      <span><b>${esc(L.name)}</b><small>${studies} studies · ${n} images</small></span></a>`;
  };
  const appN = DATA.appWeb.reduce((a, g) => a + g.images.length, 0);
  document.getElementById('main').innerHTML = `
    <section class="hero"><h1>Every Thrive image, ready for your language</h1>
      <p>Each picture here links to its Canva template. Open it, make your own copy, and change the words into your language. You only need a free Canva account.</p></section>
    <div class="steps">
      <div class="step"><span class="n">1</span><b>Watch the first video</b><p>Two short videos on <a href="#training">Training</a> show how this works.</p></div>
      <div class="step"><span class="n">2</span><b>Pick a level</b><p>Start, Walk, Run, or Guide. Each study is one row of pictures.</p></div>
      <div class="step"><span class="n">3</span><b>Work through it</b><p>Press <b>Work through this page</b> and use <b>Open next</b> to go one by one. We remember what you opened.</p></div>
    </div>
    <div class="levels">${DATA.levels.map(card).join('')}
      <a class="lcard" href="#appweb"><span class="pics"></span><span><b>App &amp; Web</b><small>${appN} images: logos, app, website</small></span></a>
      <a class="lcard" href="#photos"><span class="pics"></span><span><b>Original Photos</b><small>${PHOTOS.length} photos to download</small></span></a></div>
    <p class="note"><b>Aa</b> on a picture means it has words to translate. Pictures without it are photos only, but you still need your own copy, because the app uses them too.
      If a picture doesn't fit your culture, email us and we'll help you find a better one.</p>`;
}

function renderLevel(key) {
  const isApp = key === 'appweb';
  const L = isApp ? { name: 'App & Web', series: [{ name: 'App and website images', studies: DATA.appWeb }] } : DATA.levels.find(l => l.id === key);
  const all = allImages(L).filter(i => !isHidden(i));
  const live = all.filter(i => !isOld(i));
  const oldN = all.length - live.length;
  const studies = L.series.reduce((n, se) => n + se.studies.length, 0);
  const blurb = isApp ? 'Logos, app headers and icons, carousels, and website images.'
    : `Every ${L.name} study, one row each. Click a picture to open its Canva template and make your own copy.`;
  let html = `<section class="intro"><div><h1>${esc(L.name)}</h1><p>${blurb}</p></div>
      <div class="stats"><div class="stat"><b>${studies}</b><span>${isApp ? 'groups' : 'studies'}</span></div><div class="stat"><b>${live.length}</b><span>images</span></div><div class="stat"><b>${live.filter(i => i.words).length}</b><span>with words</span></div></div></section>
    <div class="toolbar">
      <input class="search" id="q" type="search" placeholder="Find a study…" value="${esc(state.search)}" aria-label="Find a study">
      ${isApp ? '' : `<span class="chips" role="group" aria-label="Image types"><span class="lbl">Types</span>${[...STD, 'Extras'].map(t => `<button class="chip" type="button" data-chip="${t}" aria-pressed="${!state.typeOff.has(t)}">${t}</button>`).join('')}</span>`}
      <label class="check"><input type="checkbox" id="wonly" ${state.wordsOnly ? 'checked' : ''}> Only images with words</label>
      ${oldN ? `<label class="check"><input type="checkbox" id="showold" ${state.showOld ? 'checked' : ''}> Show old designs (${oldN})</label>` : ''}
      <span class="seg" role="group" aria-label="Picture size"><span class="lbl">Size</span>${['S', 'M', 'L'].map(s => `<button type="button" data-size="${s}" aria-pressed="${state.size === s}">${s}</button>`).join('')}</span>
      <span class="spacer"></span>
      <button class="btn primary" type="button" id="startwork">${state.working ? 'Stop working' : 'Work through this page'}</button>
    </div>
    <div id="workbar" class="workbar" ${state.working ? '' : 'hidden'}><div class="workin">
      <span class="t">${esc(L.name)}</span><span class="bar"><i id="barfill"></i></span><span class="num" id="barnum"></span>
      <a class="btn primary small" id="next1" href="#" target="_blank" rel="noopener">Open next</a>
      <button class="btn small ghost" type="button" id="next5">Open next 5</button>
      <button class="btn small ghost" type="button" id="reset">Start over</button>
    </div><div class="worktip">Checkmarks only mean a picture was opened, and they're saved in this browser only.</div></div>`;
  L.series.forEach((se, si) => {
    const rows = se.studies.map(st => studyHTML(st, { noPhoto: isApp })).join('');
    if (!rows) return;
    html += `<section class="series" data-series="${si}"><div class="shead"><h2>${esc(se.name)}</h2><span class="count"></span><span class="spacer"></span>
      <button class="btn small openSeries" type="button">Open this series</button></div>${rows}</section>`;
  });
  html += `<p class="empty" id="noresults" hidden>No studies match. Try fewer letters, or turn the type buttons back on.</p>`;
  document.getElementById('main').innerHTML = html;
  applyFilters(); updateBar();
}

function applyFilters() {
  document.documentElement.style.setProperty('--tile-h', { S: '64px', M: '96px', L: '140px' }[state.size]);
  const q = norm(state.search); let shown = 0;
  document.querySelectorAll('.study').forEach(row => {
    const sec = row.closest('.series');
    const match = !q || row.dataset.search.includes(q) || norm(sec.querySelector('h2').textContent).includes(q);
    let vis = 0;
    row.querySelectorAll('.tile').forEach(t => {
      const off = state.typeOff.has(t.dataset.chip) || (state.wordsOnly && t.dataset.w !== '1') || (!state.showOld && t.dataset.old === '1');
      t.hidden = off; if (!off) vis++;
    });
    row.hidden = !match || !vis; if (!row.hidden) shown++;
  });
  document.querySelectorAll('.series').forEach(s => {
    const n = visibleTiles(s).length;
    s.hidden = !n;
    const c = s.querySelector('.count'); if (c) c.textContent = `${s.querySelectorAll('.study:not([hidden])').length} rows · ${n} images`;
    const b = s.querySelector('.openSeries'); if (b) b.textContent = `Open this series (${n})`;
  });
  const nr = document.getElementById('noresults'); if (nr) nr.hidden = shown > 0;
}
function visibleTiles(scope = document) { return [...scope.querySelectorAll('.study:not([hidden]) .tile:not([hidden])')]; }
function markOpened(u) {
  state.opened.add(u); store.set('opened', [...state.opened]);
  document.querySelectorAll('.tile').forEach(t => { if (t.dataset.u === u) t.classList.add('opened'); });
  updateBar();
}
function updateBar() {
  const fill = document.getElementById('barfill'); if (!fill) return;
  const tiles = visibleTiles();
  const done = tiles.filter(t => state.opened.has(t.dataset.u)).length;
  fill.style.width = (tiles.length ? done / tiles.length * 100 : 0) + '%';
  document.getElementById('barnum').textContent = `${done} of ${tiles.length} opened`;
  const nxt = tiles.find(t => !state.opened.has(t.dataset.u));
  const a = document.getElementById('next1');
  if (nxt) { a.href = nxt.dataset.u; a.dataset.u = nxt.dataset.u; a.textContent = 'Open next'; a.removeAttribute('aria-disabled'); }
  else { a.removeAttribute('href'); delete a.dataset.u; a.textContent = 'All opened'; a.setAttribute('aria-disabled', 'true'); }
}
function openMany(tiles) {
  if (!tiles.length) return;
  let ok = 0;
  for (const t of tiles) { const w = window.open(t.dataset.u, '_blank'); if (w) { ok++; markOpened(t.dataset.u); } }
  if (ok < tiles.length) toast(ok ? `Your browser blocked ${tiles.length - ok} of the tabs. Look for a pop-up notice in the address bar, choose "Always allow" for this site, then try again.`
    : `Your browser blocked the new tabs. Look for a pop-up notice in the address bar, choose "Always allow" for this site, then try again. "Open next" always works.`, 9000);
  else toast(`Opened ${ok} tabs.`);
}
let tt; function toast(m, ms = 5000) { const el = document.getElementById('toast'); el.textContent = m; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => el.hidden = true, ms); }

/* ---------- Photos ---------- */
function renderPhotos() {
  const seen = new Set();
  const groups = DATA.levels.map(L => {
    const items = [];
    L.series.forEach(se => se.studies.forEach(st => (PHOTO_BY_STUDY[norm(st.name)] || []).forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); items.push(p); } })));
    return [L.name, items];
  });
  groups.push(['Other photos', PHOTOS.filter(p => !seen.has(p.id))]);
  const card = p => `<div class="photo" data-search="${esc(norm(p.file))}">
      <a class="pi" href="https://drive.google.com/file/d/${esc(p.id)}/view" target="_blank" rel="noopener" title="See it full size"><img src="${esc(p.thumb)}" alt="${esc(p.file)}" loading="lazy"></a>
      <b>${esc(p.file)}</b><small>${p.w} × ${p.h} · ${fmtMB(p.bytes)}</small>
      <a class="btn" href="${download(p.id)}">Download</a></div>`;
  document.getElementById('main').innerHTML = `<section class="intro"><div><h1>Original Photos</h1>
      <p>The full-size pictures behind the designs, straight from our Google Drive. Use them to rebuild an image, or to swap in a photo that fits your country better. Click a picture to see it big.</p></div>
      <div class="stats"><div class="stat"><b>${PHOTOS.length}</b><span>photos</span></div></div></section>
    <div class="toolbar"><input class="search" id="pq" type="search" placeholder="Find a photo…" aria-label="Find a photo"><span class="spacer"></span>
      <a class="btn" href="https://drive.google.com/drive/folders/${esc(PHOTOS_FOLDER)}" target="_blank" rel="noopener">Open the whole folder in Drive</a></div>
    ${groups.filter(g => g[1].length).map(([name, items]) => `<section class="pgroup"><div class="shead"><h2>${esc(name)}</h2><span class="count">${items.length} photos</span></div><div class="pgrid">${items.map(card).join('')}</div></section>`).join('')}
    <p class="empty" id="noresults" hidden>No photos match that search.</p>`;
}
let PHOTOS_FOLDER = '';

/* ---------- Training ---------- */
function renderTraining() {
  document.getElementById('main').innerHTML = `<section class="intro"><div><h1>Training</h1><p>Short videos on using Canva and making Thrive images. New here? Start with the first one.</p></div>
    <div class="stats"><div class="stat"><b>${TRAINING.reduce((n, g) => n + g[1].length, 0)}</b><span>videos</span></div></div></section>
    <div class="tgrid">${TRAINING.map(([h, vs]) => `<div class="tcol"><h3>${h}</h3>${vs.map(([t, u, f]) => `<a class="vid ${f ? 'first' : ''}" href="${u}" target="_blank" rel="noopener"><span class="play">${PLAY}</span><span>${esc(t)}<small>${f ? 'Start here' : 'YouTube'}</small></span></a>`).join('')}</div>`).join('')}</div>`;
}

/* ---------- Router ---------- */
function route() {
  let k = (location.hash || '').slice(1) || 'home';
  if (!pages().some(p => p[0] === k)) k = 'home';
  renderTabs(k);
  if (k === 'home') renderHome(); else if (k === 'photos') renderPhotos(); else if (k === 'training') renderTraining(); else renderLevel(k);
  document.body.classList.toggle('working', state.working);
  setHdr();
}
function setHdr() { document.documentElement.style.setProperty('--hdr', document.getElementById('hdr').offsetHeight + 'px'); }
addEventListener('hashchange', () => { state.search = ''; route(); scrollTo(0, 0); });
addEventListener('resize', setHdr);

document.addEventListener('click', e => {
  const el = e.target;
  const trx = el.closest('.trx');
  if (trx) { e.preventDefault(); e.stopPropagation(); openDrawer(trx.dataset.study, trx.dataset.name); return; }
  if (el.closest('#next1')) { const a = el.closest('#next1'); if (a.dataset.u) setTimeout(() => markOpened(a.dataset.u), 50); else e.preventDefault(); return; }
  const tile = el.closest('.tile');
  if (tile) { markOpened(tile.dataset.u); return; }
  const chip = el.closest('.chip');
  if (chip) { const t = chip.dataset.chip; state.typeOff.has(t) ? state.typeOff.delete(t) : state.typeOff.add(t); chip.setAttribute('aria-pressed', !state.typeOff.has(t)); applyFilters(); updateBar(); return; }
  const sz = el.closest('[data-size]');
  if (sz) { state.size = sz.dataset.size; store.set('size', state.size); document.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', b === sz)); applyFilters(); return; }
  if (el.id === 'startwork') {
    state.working = !state.working; document.body.classList.toggle('working', state.working);
    document.getElementById('workbar').hidden = !state.working; el.textContent = state.working ? 'Stop working' : 'Work through this page'; updateBar(); return;
  }
  if (el.id === 'next5') { openMany(visibleTiles().filter(t => !state.opened.has(t.dataset.u)).slice(0, 5)); return; }
  if (el.id === 'reset') { visibleTiles().forEach(t => { state.opened.delete(t.dataset.u); t.classList.remove('opened'); }); store.set('opened', [...state.opened]); updateBar(); toast('Checkmarks cleared for this page.'); return; }
  const os = el.closest('.openSeries'); if (os) { openMany(visibleTiles(os.closest('.series'))); return; }
  const o1 = el.closest('.open1'); if (o1) { openMany(visibleTiles(o1.closest('.study'))); return; }
  if (el.id === 'dclose') document.getElementById('drawer').hidden = true;
});
document.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'q') { state.search = e.target.value; applyFilters(); updateBar(); }
  if (id === 'wonly') { state.wordsOnly = e.target.checked; applyFilters(); updateBar(); }
  if (id === 'showold') { state.showOld = e.target.checked; applyFilters(); updateBar(); }
  if (id === 'dtext') updateTranslate();
  if (id === 'pq') {
    const q = norm(e.target.value);
    document.querySelectorAll('.photo').forEach(p => p.hidden = q && !p.dataset.search.includes(q));
    document.querySelectorAll('.pgroup').forEach(g => g.hidden = !g.querySelector('.photo:not([hidden])'));
    document.getElementById('noresults').hidden = !!document.querySelector('.photo:not([hidden])');
  }
});
document.addEventListener('change', e => { if (e.target.id === 'dlang') { store.set('lang', e.target.value); updateTranslate(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('drawer').hidden = true; });

function openDrawer(study, name) {
  document.getElementById('dtitle').textContent = `Translate: ${study} · ${name}`;
  document.getElementById('dtext').value = '';
  document.getElementById('drawer').hidden = false; document.getElementById('dtext').focus(); updateTranslate();
}
function updateTranslate() {
  const txt = document.getElementById('dtext').value, lang = document.getElementById('dlang').value;
  document.getElementById('dgo').href = `https://translate.google.com/?sl=en&tl=${encodeURIComponent(lang)}&text=${encodeURIComponent(txt)}&op=translate`;
}

/* ---------- Start ---------- */
async function start() {
  const dl = document.getElementById('dlang');
  dl.innerHTML = LANGS.map(([c, n]) => `<option value="${c}">${n}</option>`).join('');
  dl.value = store.get('lang', 'es');
  try {
    const [d, p] = await Promise.all(['data/designs.json', 'data/photos.json'].map(u => fetch(u, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(u); return r.json(); })));
    DATA = d; PHOTOS = p.photos; PHOTOS_FOLDER = p.folderId;
    PHOTOS.forEach(ph => {
      const base = ph.file.replace(/\.\w+$/, '').replace(/\s+(\d+|wide|square)$/i, '');
      (PHOTO_BY_STUDY[norm(base)] = PHOTO_BY_STUDY[norm(base)] || []).push(ph);
    });
    Object.values(PHOTO_BY_STUDY).forEach(list => list.sort((a, b) => a.file.length - b.file.length));
    route();
  } catch (err) {
    document.getElementById('main').innerHTML = `<p class="loading">The images didn't load. Check your connection and <a href="">try again</a>.</p>`;
  }
}
start();
