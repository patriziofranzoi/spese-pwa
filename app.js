// ─── Icone SVG metodi di pagamento ──────────────────────
const ICONE_PAGAMENTO = {
  bancomat: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="3" fill="#e8f5e9"/><line x1="1" y1="10" x2="23" y2="10" stroke="#1b5e20" stroke-width="2.5"/></svg>`,
  contanti: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#fdd835"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#5d4037">€</text></svg>`,
  bonifico: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="13" rx="2" fill="#e3f2fd"/><path d="M8 21h8M12 16v5M7 8h.01M7 12h10"/></svg>`,
  hype:     `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#1565c0"/><text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="bold" fill="white">H</text></svg>`,
  satispay: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#e53935"/><text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="bold" fill="white">S</text></svg>`,
  pagopa:   `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#0066cc"/><text x="12" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill="white">PA</text></svg>`,
  f24:      `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><rect x="2" y="2" width="20" height="20" rx="4" fill="#ff6f00"/><text x="12" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill="white">F24</text></svg>`,
  altro:    `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px" fill="none" stroke="#757575" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
};

// ─── Tipologie di sistema (ordine alfabetico, default = spesa) ──
const TIPOLOGIE_SISTEMA = [
  { valore: 'ads',          label: '📣 ADS' },
  { valore: 'benzinaio',    label: '⛽ Benzinaio' },
  { valore: 'casa',         label: '🏠 Casa' },
  { valore: 'farmacia',     label: '💊 Farmacia' },
  { valore: 'generale',     label: '📦 Generale' },
  { valore: 'personali',    label: '👤 Personali' },
  { valore: 'professionali',label: '💼 Professionali' },
  { valore: 'ristorante',   label: '🍽️ Ristorante' },
  { valore: 'spesa',        label: '🛒 Spesa' },
];

// ─── State ───────────────────────────────────────────────
let spese = [];
let fotoTemporanee = [];
let modalitaArchivio = false;
let dataSelezionataArchivio = null;
let spesaInModifica = null;

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  impostaDataOggi();
  caricaSpeseDiOggi();
  popolaTipologie('spesa');
  onTipologiaChange();
  onTipoPagamentoChange();
  document.getElementById('app-version').textContent = APP_VERSION + ' - ' + APP_VERSION_DATE;
  registraServiceWorker();
  window.addEventListener('beforeunload', salvaSpeseDiOggi);
});

function oggi() {
  return new Date().toISOString().split('T')[0];
}

function impostaDataOggi() {
  const d = oggi();
  document.getElementById('data-spesa').value = d;
  document.getElementById('data-display').textContent = formatData(d);
}

function formatData(d) {
  if (!d) return '';
  const [y, m, g] = d.split('-');
  return `${g}/${m}/${y}`;
}

// ─── Storage per data ────────────────────────────────────
function keyPerData(data) {
  return 'spese_' + data;
}

function caricaSpeseDiOggi() {
  const raw = localStorage.getItem(keyPerData(oggi()));
  spese = raw ? JSON.parse(raw) : [];
  renderLista();
}

function salvaSpeseDiOggi() {
  localStorage.setItem(keyPerData(oggi()), JSON.stringify(spese));
}

function tutteLeDate() {
  const date = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('spese_')) {
      const data = key.replace('spese_', '');
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      if (arr.length > 0) date.push(data);
    }
  }
  return date.sort((a, b) => b.localeCompare(a));
}

// ─── Tipo Pagamento ──────────────────────────────────────
function onTipoPagamentoChange() {
  const val = document.getElementById('tipo-pagamento').value;
  document.getElementById('bancomat-sub').classList.toggle('hidden', val !== 'bancomat');
  document.getElementById('altro-pagamento-div').classList.toggle('hidden', val !== 'altro');
}

// ─── Tipologia ───────────────────────────────────────────
function onTipologiaChange() {
  const val = document.getElementById('tipologia').value;
  document.getElementById('sezione-spesa').classList.toggle('hidden', val !== 'spesa');
  // Benzinaio usa ancora sezione-rifornimento nell'HTML vecchio
  const isBenz = val === 'benzinaio' || val === 'rifornimento';
  document.getElementById('sezione-rifornimento').classList.toggle('hidden', !isBenz);
  if (isBenz) calcolaConsumi();
}

function calcolaConsumi() {
  const totale = importoAsFloat();
  const euroLEl = document.getElementById('euro-litro');
  const euroL = parseFloat((euroLEl ? euroLEl.value : '0').replace(',', '.')) || 0;
  const km = parseFloat((document.getElementById('km-percorsi') || {value:''}).value) || 0;
  const numLitriEl = document.getElementById('num-litri');
  const euroKmEl   = document.getElementById('euro-km');
  const kmLitroEl  = document.getElementById('km-litro');
  if (totale > 0 && euroL > 0) {
    const litri = totale / euroL;
    if (numLitriEl) numLitriEl.value = litri.toFixed(2);
    if (km > 0) {
      if (euroKmEl)  euroKmEl.value  = (totale / km).toFixed(3);
      if (kmLitroEl) kmLitroEl.value = (km / litri).toFixed(2);
    } else {
      if (euroKmEl)  euroKmEl.value  = '';
      if (kmLitroEl) kmLitroEl.value = '';
    }
  } else {
    if (numLitriEl) numLitriEl.value = '';
    if (euroKmEl)   euroKmEl.value   = '';
    if (kmLitroEl)  kmLitroEl.value  = '';
  }
}

// ─── Tipologie dinamiche ─────────────────────────────────
function getTipologieCustom() {
  const raw = localStorage.getItem('tipologie_custom');
  if (raw) return JSON.parse(raw);
  return [
    { valore: 'amazon', label: '📦 Amazon' },
    { valore: 'misto',  label: '🔀 Misto' },
    { valore: 'altro',  label: '✏️ Altro' },
  ];
}
function salvaTipologieCustom(arr) { localStorage.setItem('tipologie_custom', JSON.stringify(arr)); }
function tutteLeTipologie() { return [...TIPOLOGIE_SISTEMA, ...getTipologieCustom()]; }

function popolaTipologie(valoreSelezionato) {
  const sel = document.getElementById('tipologia');
  const currentVal = valoreSelezionato !== undefined ? valoreSelezionato : (sel.value || 'spesa');
  sel.innerHTML = '';
  tutteLeTipologie().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.valore; opt.textContent = t.label;
    if (t.valore === currentVal) opt.selected = true;
    sel.appendChild(opt);
  });
  onTipologiaChange();
}

// ─── Impostazioni ────────────────────────────────────────
function apriImpostazioni() {
  document.getElementById('schermata-principale').classList.add('hidden');
  let sc = document.getElementById('schermata-impostazioni');
  if (!sc) { _creaSchermatImpostazioni(); sc = document.getElementById('schermata-impostazioni'); }
  sc.classList.remove('hidden');
  renderTipologieLista();
}
function chiudiImpostazioni() {
  document.getElementById('schermata-impostazioni').classList.add('hidden');
  document.getElementById('schermata-principale').classList.remove('hidden');
  popolaTipologie();
}
function renderTipologieLista() {
  const container = document.getElementById('tipologie-lista');
  if (!container) return;
  container.innerHTML = '';
  TIPOLOGIE_SISTEMA.forEach(t => {
    const row = document.createElement('div'); row.className = 'tip-row tip-sistema';
    row.innerHTML = `<span class="tip-label">${t.label}</span><span class="tip-badge-sistema">Sistema</span>`;
    container.appendChild(row);
  });
  const sep = document.createElement('div'); sep.className = 'tip-separatore'; sep.textContent = 'Tipologie personali';
  container.appendChild(sep);
  getTipologieCustom().forEach((t, idx) => {
    const row = document.createElement('div'); row.className = 'tip-row';
    row.innerHTML = `<input type="text" class="tip-input" value="${t.label}" onchange="rinominaTipologia(${idx},this.value)"/>
      <button class="tip-btn-del" onclick="eliminaTipologia(${idx})">🗑️</button>`;
    container.appendChild(row);
  });
}
function aggiuntaTipologia() {
  const input = document.getElementById('nuova-tipologia-input');
  const label = input.value.trim();
  if (!label) { alert('Inserisci un nome.'); return; }
  const c = getTipologieCustom(); c.push({ valore: 'custom_' + Date.now(), label });
  salvaTipologieCustom(c); input.value = ''; renderTipologieLista();
}
function rinominaTipologia(idx, v) {
  if (!v.trim()) return; const c = getTipologieCustom(); c[idx].label = v.trim(); salvaTipologieCustom(c);
}
function eliminaTipologia(idx) {
  const c = getTipologieCustom();
  if (!confirm(`Eliminare "${c[idx].label}"?`)) return;
  c.splice(idx,1); salvaTipologieCustom(c); renderTipologieLista();
}
function _creaSchermatImpostazioni() {
  const div = document.createElement('div');
  div.id = 'schermata-impostazioni'; div.className = 'hidden schermata-full';
  div.innerHTML = `<header><button class="btn-back" onclick="chiudiImpostazioni()">← Indietro</button><h1>⚙️ Impostazioni</h1></header>
  <main><section class="form-card"><h2>🏷️ Gestione Tipologie</h2>
  <p style="font-size:0.82rem;color:#888;margin-bottom:12px">Le tipologie <strong>Sistema</strong> non possono essere eliminate.</p>
  <div id="tipologie-lista"></div>
  <div style="display:flex;gap:8px;margin-top:14px;align-items:center">
    <input type="text" id="nuova-tipologia-input" placeholder="Es. Cinema, Sport..." style="flex:1"/>
    <button class="btn-aggiungi" style="width:auto;padding:10px 16px;margin:0" onclick="aggiuntaTipologia()">➕</button>
  </div></section></main>`;
  document.body.appendChild(div);
}

function onImportoInput(el) {
  let val = el.value.replace(/\D/g, '');
  if (!val) { el.value = ''; calcolaConsumi(); return; }
  val = val.padStart(3, '0');
  el.value = parseInt(val.slice(0,-2), 10) + ',' + val.slice(-2);
  calcolaConsumi();
}

function importoAsFloat() {
  return parseFloat(document.getElementById('importo').value.replace(',', '.')) || 0;
}

function onEuroLitroInput(el) {
  let val = el.value.replace(/\D/g, '');
  if (!val) { el.value = ''; calcolaConsumi(); return; }
  val = val.padStart(4, '0');
  el.value = parseInt(val.slice(0,-3), 10) + ',' + val.slice(-3);
  calcolaConsumi();
}

// alias legacy
function calcolaLitri() { calcolaConsumi(); }

// ─── Foto ────────────────────────────────────────────────
function scattaFoto() {
  const inp = document.getElementById('foto-input-camera') || document.getElementById('foto-input');
  if (inp) { inp.setAttribute('capture','environment'); inp.click(); }
}

function selezionaGalleria() {
  const inp = document.getElementById('foto-input-galleria') || document.getElementById('foto-input');
  if (inp) { inp.removeAttribute('capture'); inp.click(); }
}

function onFotoSelezionata(event) {
  const files = event.target.files;
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      fotoTemporanee.push(e.target.result);
      renderFotoPreview();
    };
    reader.readAsDataURL(file);
  }
  event.target.value = '';
}

function renderFotoPreview() {
  const container = document.getElementById('foto-preview-container');
  container.innerHTML = '';
  fotoTemporanee.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'foto-thumb-wrap';
    const img = document.createElement('img');
    img.src = src;
    const btn = document.createElement('button');
    btn.className = 'del-foto';
    btn.textContent = '✕';
    btn.onclick = () => { fotoTemporanee.splice(i, 1); renderFotoPreview(); };
    wrap.appendChild(img);
    wrap.appendChild(btn);
    container.appendChild(wrap);
  });
}

// ─── Aggiungi / Modifica Spesa ───────────────────────────
function aggiungiSpesa() {
  const data = document.getElementById('data-spesa').value;
  const importo = importoAsFloat();
  const tipoPag = document.getElementById('tipo-pagamento').value;
  const tipologia = document.getElementById('tipologia').value;
  const descrizione = document.getElementById('descrizione').value.trim();

  if (!data) { alert('Inserisci una data.'); return; }
  if (isNaN(importo) || importo <= 0) { alert('Inserisci un importo valido.'); return; }

  let tipoPagLabel = tipoPag;
  if (tipoPag === 'bancomat') {
    const sub = document.querySelector('input[name="bancomat-tipo"]:checked');
    const subVal = sub ? sub.value : 'mio';
    const subIcon = subVal === 'mio' ? '👤' : subVal === 'condiviso' ? '👥' : '👨';
    tipoPagLabel = `Bancomat ${subIcon} ${subVal.charAt(0).toUpperCase()+subVal.slice(1)}`;
  } else if (tipoPag === 'altro') {
    tipoPagLabel = document.getElementById('altro-pagamento-text').value.trim() || 'Altro';
  } else {
    const nomi = { contanti:'Contanti', bonifico:'Bonifico', hype:'Hype', satispay:'Satispay', pagopa:'PagoPa', f24:'F24' };
    tipoPagLabel = nomi[tipoPag] || (tipoPag.charAt(0).toUpperCase()+tipoPag.slice(1));
  }

  let luogo = '';
  let euroLitro = null;
  let numLitri = null;
  let km = null;
  let euroKm = null;
  let kmLitro = null;

  if (tipologia === 'spesa') {
    const luogoSel = document.getElementById('luogo-spesa').value;
    const luogoAltro = document.getElementById('luogo-altro').value.trim();
    luogo = luogoSel === 'altro' ? (luogoAltro || 'Altro') : luogoSel;
  } else if (tipologia === 'benzinaio' || tipologia === 'rifornimento') {
    const elEL = document.getElementById('euro-litro');
    const elNL = document.getElementById('num-litri');
    const elKM = document.getElementById('km-percorsi');
    const elEK = document.getElementById('euro-km');
    const elKL = document.getElementById('km-litro');
    euroLitro = elEL ? (parseFloat(elEL.value.replace(',','.')) || null) : null;
    numLitri  = elNL ? (parseFloat(elNL.value) || null) : null;
    km        = elKM ? (elKM.value.trim() || null) : null;
    euroKm    = elEK ? (parseFloat(elEK.value) || null) : null;
    kmLitro   = elKL ? (parseFloat(elKL.value) || null) : null;
  }

  // Ricava label dalla lista completa delle tipologie
  const tutteT = tutteLeTipologie();
  const trovata = tutteT.find(t => t.valore === tipologia);
  const tipologiaLabel = trovata ? trovata.label : tipologia;

  const spesaObj = { id: Date.now(), data, importo, tipoPagamento: tipoPagLabel,
    tipologiaValore: tipologia, tipologia: tipologiaLabel,
    luogo, euroLitro, numLitri, km, euroKm, kmLitro, descrizione, foto: [...fotoTemporanee] };

  if (spesaInModifica !== null) {
    const idx = spese.findIndex(s => s.id === spesaInModifica);
    if (idx !== -1) spese[idx] = { ...spesaObj, id: spese[idx].id };
    spesaInModifica = null;
    document.getElementById('btn-aggiungi').textContent = '➕ Aggiungi Spesa';
    document.getElementById('btn-annulla-modifica').classList.add('hidden');
  } else {
    spese.push(spesaObj);
  }

  if (modalitaArchivio && dataSelezionataArchivio) {
    localStorage.setItem(keyPerData(dataSelezionataArchivio), JSON.stringify(spese));
    renderListaArchivioDettaglio(dataSelezionataArchivio);
  } else {
    salvaSpeseDiOggi();
    renderLista();
  }

  resetForm();
}

function modificaSpesa(id) {
  const s = spese.find(s => s.id === id);
  if (!s) return;
  spesaInModifica = id;

  document.getElementById('data-spesa').value = s.data;
  document.getElementById('importo').value = s.importo;
  document.getElementById('descrizione').value = s.descrizione || '';

  const tipoPagBase = s.tipoPagamento.toLowerCase().startsWith('bancomat') ? 'bancomat' :
    s.tipoPagamento.toLowerCase().includes('bonifico') ? 'bonifico' :
    s.tipoPagamento.toLowerCase().includes('contanti') ? 'contanti' :
    s.tipoPagamento.toLowerCase().includes('satispay') ? 'satispay' :
    s.tipoPagamento.toLowerCase().includes('hype')     ? 'hype' :
    s.tipoPagamento.toLowerCase().includes('pagopa')   ? 'pagopa' :
    s.tipoPagamento.toLowerCase().includes('f24')      ? 'f24' : 'altro';
  const selectPag = document.getElementById('tipo-pagamento');
  const opzioniPag = Array.from(selectPag.options).map(o => o.value);
  selectPag.value = opzioniPag.includes(tipoPagBase) ? tipoPagBase : 'altro';
  onTipoPagamentoChange();

  // Ripristina tipologia
  const tutteT = tutteLeTipologie();
  const tipVal = s.tipologiaValore || (tutteT.find(t => t.label === s.tipologia) || {}).valore || 'spesa';
  popolaTipologie(tipVal);

  if (tipVal === 'spesa' && s.luogo) {
    const sel = document.getElementById('luogo-spesa');
    if (sel) {
      const opzioni = Array.from(sel.options).map(o => o.value);
      if (opzioni.includes(s.luogo)) { sel.value = s.luogo; }
      else { sel.value = 'altro'; document.getElementById('luogo-altro').value = s.luogo; document.getElementById('luogo-altro-div').classList.remove('hidden'); }
    }
  }
  if (tipVal === 'benzinaio' || tipVal === 'rifornimento') {
    const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = String(v).replace('.',','); };
    set('euro-litro', s.euroLitro); set('num-litri', s.numLitri);
    if (document.getElementById('km-percorsi') && s.km) document.getElementById('km-percorsi').value = s.km;
    const setN = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    setN('euro-km', s.euroKm); setN('km-litro', s.kmLitro);
  }

  fotoTemporanee = [...(s.foto || [])];
  renderFotoPreview();

  document.getElementById('btn-aggiungi').textContent = '💾 Salva Modifiche';
  document.getElementById('btn-annulla-modifica').classList.remove('hidden');
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

function annullaModifica() {
  spesaInModifica = null;
  document.getElementById('btn-aggiungi').textContent = '➕ Aggiungi Spesa';
  document.getElementById('btn-annulla-modifica').classList.add('hidden');
  resetForm();
}

function resetForm() {
  document.getElementById('importo').value      = '';
  document.getElementById('descrizione').value  = '';
  document.getElementById('tipo-pagamento').value = 'bancomat';
  document.getElementById('luogo-spesa').value  = 'Aldì';
  document.getElementById('luogo-altro').value  = '';
  document.getElementById('luogo-altro-div').classList.add('hidden');
  const clearIfExists = id => { const el = document.getElementById(id); if (el) el.value = ''; };
  clearIfExists('euro-litro'); clearIfExists('num-litri'); clearIfExists('km-percorsi');
  clearIfExists('euro-km');    clearIfExists('km-litro');
  onTipoPagamentoChange();
  popolaTipologie('spesa'); // default sempre "Spesa"
  fotoTemporanee = [];
  renderFotoPreview();
  impostaDataOggi();
}

// ─── Elimina Spesa ───────────────────────────────────────
function eliminaSpesa(id) {
  if (!confirm('Eliminare questa spesa?')) return;
  spese = spese.filter(s => s.id !== id);
  if (modalitaArchivio && dataSelezionataArchivio) {
    localStorage.setItem(keyPerData(dataSelezionataArchivio), JSON.stringify(spese));
    renderListaArchivioDettaglio(dataSelezionataArchivio);
  } else {
    salvaSpeseDiOggi();
    renderLista();
  }
}

// ─── Render Lista (oggi) ─────────────────────────────────
function renderLista() {
  const container = document.getElementById('lista-spese');
  container.innerHTML = '';

  if (spese.length === 0) {
    container.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa aggiunta oggi.</p>';
    document.getElementById('riepilogo').style.display = 'none';
    document.getElementById('azioni-export').style.display = 'none';
    return;
  }

  document.getElementById('riepilogo').style.display = '';
  document.getElementById('azioni-export').style.display = '';
  [...spese].sort((a, b) => b.id - a.id).forEach(s => container.appendChild(creaCardSpesa(s)));
  renderRiepilogo();
}

function iconaPagamento(tipoPag) {
  const p = (tipoPag || '').toLowerCase();
  if (p.includes('bancomat'))  return ICONE_PAGAMENTO.bancomat;
  if (p.includes('contanti'))  return ICONE_PAGAMENTO.contanti;
  if (p.includes('bonifico'))  return ICONE_PAGAMENTO.bonifico;
  if (p.includes('hype'))      return ICONE_PAGAMENTO.hype;
  if (p.includes('satispay'))  return ICONE_PAGAMENTO.satispay;
  if (p.includes('pagopa'))    return ICONE_PAGAMENTO.pagopa;
  if (p.includes('f24'))       return ICONE_PAGAMENTO.f24;
  return ICONE_PAGAMENTO.altro;
}

function creaCardSpesa(s) {
  const card = document.createElement('div');
  card.className = 'spesa-card';
  const isBenz  = s.tipologiaValore === 'benzinaio' || s.tipologiaValore === 'rifornimento' || s.euroLitro;
  const isSpesa = s.tipologiaValore === 'spesa' || (s.tipologia||'').toLowerCase().includes('spesa');

  let extraInfo = '';
  if (isSpesa && s.luogo) extraInfo += `<span>🏪 ${s.luogo}</span>`;
  if (isBenz) {
    if (s.euroLitro) extraInfo += `<span>⛽ €${s.euroLitro}/L</span>`;
    if (s.numLitri)  extraInfo += `<span>🔢 ${s.numLitri}L</span>`;
    if (s.km)        extraInfo += `<span>🛣️ ${s.km}km</span>`;
    if (s.euroKm)    extraInfo += `<span>💶 €${s.euroKm}/km</span>`;
    if (s.kmLitro)   extraInfo += `<span>📊 ${s.kmLitro}km/L</span>`;
  }

  card.innerHTML = `
    <div class="card-azioni">
      <button class="btn-modifica" onclick="modificaSpesa(${s.id})">✏️</button>
      <button class="btn-elimina"  onclick="eliminaSpesa(${s.id})">🗑️</button>
    </div>
    <div class="importo-badge">€ ${s.importo.toFixed(2)}</div>
    <div class="meta">
      <span>📅 ${formatData(s.data)}</span>
      <span>${iconaPagamento(s.tipoPagamento)}${s.tipoPagamento}</span>
      <span>🏷️ ${s.tipologia}</span>
      ${extraInfo}
    </div>
    ${s.descrizione ? `<div class="desc">📝 ${s.descrizione}</div>` : ''}
    ${s.foto && s.foto.length ? `<div class="foto-row">${s.foto.map(f=>`<img src="${f}" onclick="apriModal('${encodeURIComponent(f)}')" />`).join('')}</div>` : ''}`;
  return card;
}

function renderRiepilogo() {
  const totali = {}; let totaleGen = 0;
  spese.forEach(s => { totali[s.tipoPagamento] = (totali[s.tipoPagamento]||0)+s.importo; totaleGen += s.importo; });
  const content = document.getElementById('riepilogo-content');
  content.innerHTML = '';
  Object.entries(totali).forEach(([tipo, tot]) => {
    const row = document.createElement('div'); row.className = 'riepilogo-row';
    row.innerHTML = `<span>${iconaPagamento(tipo)}${tipo}</span><span>€ ${tot.toFixed(2)}</span>`;
    content.appendChild(row);
  });
  document.getElementById('totale-generale').textContent = `Totale: € ${totaleGen.toFixed(2)}`;
}

// ─── ARCHIVIO ────────────────────────────────────────────
function apriArchivio() {
  modalitaArchivio = true;
  dataSelezionataArchivio = null;
  document.getElementById('schermata-principale').classList.add('hidden');
  document.getElementById('schermata-archivio').classList.remove('hidden');
  document.getElementById('archivio-lista-date').classList.remove('hidden');
  document.getElementById('archivio-dettaglio').classList.add('hidden');
  renderArchivioLista();
}

function chiudiArchivio() {
  modalitaArchivio = false;
  dataSelezionataArchivio = null;
  spese = JSON.parse(localStorage.getItem(keyPerData(oggi())) || '[]');
  document.getElementById('schermata-principale').classList.remove('hidden');
  document.getElementById('schermata-archivio').classList.add('hidden');
  renderLista();
}

function renderArchivioLista() {
  const list = document.getElementById('archivio-date-list');
  list.innerHTML = '';
  const date = tutteLeDate();
  if (date.length === 0) {
    list.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa archiviata.</p>';
    return;
  }
  date.forEach(d => {
    const arr = JSON.parse(localStorage.getItem(keyPerData(d)) || '[]');
    const totale = arr.reduce((acc, s) => acc + s.importo, 0);
    const item = document.createElement('div');
    item.className = 'archivio-item';
    item.innerHTML = `
      <div class="archivio-item-info" onclick="apriDettaglioArchivio('${d}')">
        <span class="archivio-data">📅 ${formatData(d)}</span>
        <span class="archivio-voci">${arr.length} voci</span>
        <span class="archivio-totale">€ ${totale.toFixed(2)}</span>
      </div>
      <button class="btn-elimina-giorno" onclick="eliminaGiornata('${d}')">🗑️</button>
    `;
    list.appendChild(item);
  });
}

function apriDettaglioArchivio(data) {
  dataSelezionataArchivio = data;
  spese = JSON.parse(localStorage.getItem(keyPerData(data)) || '[]');
  document.getElementById('archivio-lista-date').classList.add('hidden');
  document.getElementById('archivio-dettaglio').classList.remove('hidden');
  document.getElementById('archivio-dettaglio-titolo').textContent = `📅 Spese del ${formatData(data)}`;
  renderListaArchivioDettaglio(data);
}

function renderListaArchivioDettaglio(data) {
  const container = document.getElementById('archivio-dettaglio-lista');
  container.innerHTML = '';
  if (spese.length === 0) {
    container.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa.</p>';
    document.getElementById('archivio-dettaglio-totale').textContent = 'Totale: € 0.00';
    return;
  }
  [...spese].sort((a, b) => b.id - a.id).forEach(s => container.appendChild(creaCardSpesa(s)));
  const totale = spese.reduce((acc, s) => acc + s.importo, 0);
  document.getElementById('archivio-dettaglio-totale').textContent = `Totale: € ${totale.toFixed(2)}`;
}

function tornaAllaLista() {
  dataSelezionataArchivio = null;
  spese = [];
  document.getElementById('archivio-lista-date').classList.remove('hidden');
  document.getElementById('archivio-dettaglio').classList.add('hidden');
  renderArchivioLista();
}

function eliminaGiornata(data) {
  if (!confirm(`Eliminare tutte le spese del ${formatData(data)}?`)) return;
  localStorage.removeItem(keyPerData(data));
  renderArchivioLista();
}

// ─── Export PDF ──────────────────────────────────────────
function scaricaPDF() {
  const dataOggi = formatData(oggi());
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Spese ${dataOggi}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
      h1 { color: #1976d2; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th { background: #1976d2; color: white; padding: 8px 12px; text-align: left; }
      td { padding: 8px 12px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) { background: #f5f9ff; }
      .totale { font-size: 1.2rem; font-weight: bold; color: #1976d2; text-align: right; margin-top: 10px; }
      .extra { font-size: 0.85rem; color: #888; }
      @media print { button { display: none; } }
    </style></head><body>
    <h1>💶 Riepilogo Spese — ${dataOggi}</h1>
    <table><thead><tr><th>Data</th><th>Tipologia</th><th>Luogo/Info</th><th>Pagamento</th><th>Importo</th></tr></thead>
    <tbody>
      ${[...spese].sort((a, b) => new Date(a.data) - new Date(b.data)).map(s => `
        <tr>
          <td>${formatData(s.data)}</td><td>${s.tipologia}</td>
          <td>${s.luogo || ''}${s.tipologia === 'Rifornimento' ? `<br><span class="extra">${s.euroLitro ? '⛽ €' + s.euroLitro + '/L ' : ''}${s.numLitri ? s.numLitri + 'L ' : ''}${s.km ? '🛣️ ' + s.km + ' km' : ''}</span>` : ''}${s.descrizione ? `<br><span class="extra">📝 ${s.descrizione}</span>` : ''}</td>
          <td>${s.tipoPagamento}</td><td><strong>€ ${s.importo.toFixed(2)}</strong></td>
        </tr>`).join('')}
    </tbody></table>
    <div class="totale">TOTALE: € ${spese.reduce((a, s) => a + s.importo, 0).toFixed(2)}</div>
    <br><button onclick="window.print()">🖨️ Stampa / Salva PDF</button>
    </body></html>`);
  win.document.close();
}

// ─── Condividi ───────────────────────────────────────────
async function condividi() {
  const dataOggi = formatData(oggi());
  const totaleGen = spese.reduce((acc, s) => acc + s.importo, 0);
  let testo = `💶 *Spese del ${dataOggi}*\n\n`;
  [...spese].sort((a, b) => new Date(a.data) - new Date(b.data)).forEach((s, i) => {
    testo += `${i + 1}. ${s.tipologia} — *€ ${s.importo.toFixed(2)}*\n   💳 ${s.tipoPagamento}`;
    if (s.luogo) testo += `  |  🏪 ${s.luogo}`;
    if (s.tipologia === 'Rifornimento') {
      if (s.euroLitro) testo += `\n   ⛽ €${s.euroLitro}/L`;
      if (s.numLitri) testo += `  🔢 ${s.numLitri}L`;
      if (s.km) testo += `  🛣️ ${s.km} km`;
    }
    if (s.descrizione) testo += `\n   📝 ${s.descrizione}`;
    testo += '\n\n';
  });
  testo += `─────────────────\n💰 *TOTALE: € ${totaleGen.toFixed(2)}*`;
  if (navigator.share) {
    try { await navigator.share({ title: `Spese ${dataOggi}`, text: testo }); }
    catch (e) { copiaNeglAppunti(testo); }
  } else { copiaNeglAppunti(testo); }
}

function copiaNeglAppunti(testo) {
  navigator.clipboard.writeText(testo)
    .then(() => alert('📋 Testo copiato! Incollalo dove vuoi (Telegram, WhatsApp...)'))
    .catch(() => prompt('Copia questo testo:', testo));
}

// ─── Modal Foto ──────────────────────────────────────────
function apriModal(encodedSrc) {
  const src = decodeURIComponent(encodedSrc);
  let modal = document.getElementById('foto-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'foto-modal';
    modal.innerHTML = '<button onclick="chiudiModal()">✕</button><img id="modal-img"/>';
    document.body.appendChild(modal);
  }
  document.getElementById('modal-img').src = src;
  modal.classList.add('show');
}

function chiudiModal() {
  document.getElementById('foto-modal')?.classList.remove('show');
}

// ─── Service Worker ──────────────────────────────────────
let pendingRegistration = null;

function registraServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            pendingRegistration = reg;
            document.getElementById('update-banner').classList.remove('hidden');
          }
        });
      });
      setInterval(() => reg.update(), 60000);
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
  }
}

function applyUpdate() {
  if (pendingRegistration && pendingRegistration.waiting) {
    pendingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

// ─── Export CSV Settimana ────────────────────────────────
function esportaCSVSettimana() {
  const tutteSpese = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const chiave = d.toISOString().split('T')[0];
    const arr = JSON.parse(localStorage.getItem(keyPerData(chiave)) || '[]');
    arr.forEach(s => tutteSpese.push(s));
  }

  if (tutteSpese.length === 0) {
    alert("Nessuna spesa nell'ultima settimana.");
    return;
  }

  tutteSpese.sort((a, b) => new Date(b.data) - new Date(a.data));

  const intestazioni = [
    'Data', 'Contanti', 'Bancomat Mio', 'Bancomat Condiviso', 'Bancomat Papa',
    'Hype', 'Satispay', 'Bonifico', 'PagoPa', 'F24', 'Altro',
    'Tipologia', 'Luogo/Supermercato', 'Euro/Litro', 'Litri', 'Km', 'Euro/Km', 'Km/Litro', 'Note'
  ];

  const righe = [intestazioni.join(';')];

  tutteSpese.forEach(s => {
    const imp = s.importo.toFixed(2).replace('.', ',');
    const pag = s.tipoPagamento.toLowerCase();
    const contanti  = pag.includes('contanti')                        ? imp : '';
    const bancMio   = pag.includes('bancomat') && pag.includes('mio')       ? imp : '';
    const bancCond  = pag.includes('bancomat') && pag.includes('condiviso') ? imp : '';
    const bancPapa  = pag.includes('bancomat') && pag.includes('pap')       ? imp : '';
    const hype      = pag.includes('hype')                            ? imp : '';
    const satispay  = pag.includes('satispay')                        ? imp : '';
    const bonifico  = pag.includes('bonifico')                        ? imp : '';
    const pagopa    = pag.includes('pagopa')                          ? imp : '';
    const f24       = pag.includes('f24')                             ? imp : '';
    const noti      = ['contanti','bancomat','hype','satispay','bonifico','pagopa','f24'];
    const altro     = !noti.some(n => pag.includes(n))               ? imp : '';

    righe.push([
      formatData(s.data),
      contanti, bancMio, bancCond, bancPapa, hype, satispay, bonifico, pagopa, f24, altro,
      s.tipologia || '', s.luogo || '',
      s.euroLitro ? String(s.euroLitro).replace('.', ',') : '',
      s.numLitri  ? String(s.numLitri).replace('.', ',')  : '',
      s.km  || '',
      s.euroKm  ? String(s.euroKm).replace('.', ',')  : '',
      s.kmLitro ? String(s.kmLitro).replace('.', ',') : '',
      (s.descrizione || '').replace(/;/g, ',')
    ].join(';'));
  });

  const totale = tutteSpese.reduce((acc, s) => acc + s.importo, 0);
  righe.push('');
  righe.push('TOTALE SETTIMANA;;;;;;;;;;;;' + totale.toFixed(2).replace('.', ','));

  const bom = '\uFEFF';
  const csvContent = bom + righe.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const dataInizio = formatData(new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0]);
  const dataFine   = formatData(oggi());
  const nomeFile   = 'Spese_' + dataInizio.replace(/\//g,'-') + '_' + dataFine.replace(/\//g,'-') + '.csv';

  const file = new File([blob], nomeFile, { type: 'text/csv' });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'Spese settimana ' + dataInizio + ' - ' + dataFine })
      .catch(() => scaricaFile(blob, nomeFile));
  } else {
    scaricaFile(blob, nomeFile);
  }
}

function scaricaFile(blob, nomeFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile;
  a.click();
  URL.revokeObjectURL(url);
}
