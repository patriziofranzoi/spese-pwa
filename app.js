// ─── Tipologie di sistema ─────────────────────────────────
const TIPOLOGIE_SISTEMA = [
  { valore: 'spesa',         label: '🛒 Spesa' },
  { valore: 'benzinaio',     label: '⛽ Benzinaio' },
  { valore: 'farmacia',      label: '💊 Farmacia' },
  { valore: 'personali',     label: '👤 Personali' },
  { valore: 'casa',          label: '🏠 Casa' },
  { valore: 'professionali', label: '💼 Professionali' },
  { valore: 'ristorante',    label: '🍽️ Ristorante' },
  { valore: 'generale',      label: '📦 Generale' },
  { valore: 'ads',           label: '📣 ADS' },
];

// Icone SVG inline per i metodi di pagamento
const ICONE_PAGAMENTO = {
  bancomat:  `<svg width="16" height="16" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:4px" fill="none" stroke="#2e7d32" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="3"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  contanti:  `<svg width="16" height="16" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:4px" fill="none" stroke="#f9a825" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.5 9.5c0-1.1.9-2 2.5-2s2.5.9 2.5 2-1.1 2-2.5 2-2.5.9-2.5 2 .9 2 2.5 2 2.5-.9 2.5-2"/></svg>`,
  bonifico:  `<svg width="16" height="16" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:4px" fill="none" stroke="#1565c0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h.01M7 12h10"/></svg>`,
  hype:      `<svg width="16" height="16" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:4px" fill="none" stroke="#7b1fa2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1.5" fill="#7b1fa2"/></svg>`,
  satispay:  `<svg width="16" height="16" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10" fill="#e53935"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="white">S</text></svg>`,
  altro:     `<svg width="16" height="16" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:4px" fill="none" stroke="#757575" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
};

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
  popolaTipologie();
  onTipologiaChange();
  onTipoPagamentoChange();
  document.getElementById('app-version').textContent = APP_VERSION + ' - ' + APP_VERSION_DATE;
  registraServiceWorker();
  window.addEventListener('beforeunload', salvaSpeseDiOggi);
  controllaVersioneNuova();
});

function oggi() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

function impostaDataOggi() {
  const d = oggi();
  document.getElementById('data-spesa').value = d;
  document.getElementById('data-display').textContent = formatData(d);
}

function formatData(d) {
  if (!d || d === 'undefined') return '';
  const p = d.split('-');
  if (p.length !== 3) return d;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

// ─── Storage ─────────────────────────────────────────────
function keyPerData(data) { return 'spese_' + data; }

function caricaSpeseDiOggi() {
  spese = JSON.parse(localStorage.getItem(keyPerData(oggi())) || '[]');
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
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;
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

// ─── Tipologie dinamiche ─────────────────────────────────
function getTipologieCustom() {
  const raw = localStorage.getItem('tipologie_custom');
  if (raw) return JSON.parse(raw);
  return [
    { valore: 'misto', label: '🔀 Misto' },
    { valore: 'altro', label: '✏️ Altro' },
  ];
}
function salvaTipologieCustom(arr) { localStorage.setItem('tipologie_custom', JSON.stringify(arr)); }
function tutteLeTipologie() { return [...TIPOLOGIE_SISTEMA, ...getTipologieCustom()]; }

function popolaTipologie(valoreSelezionato = null) {
  const sel = document.getElementById('tipologia');
  const currentVal = valoreSelezionato || sel.value || 'spesa';
  sel.innerHTML = '';
  tutteLeTipologie().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.valore;
    opt.textContent = t.label;
    if (t.valore === currentVal) opt.selected = true;
    sel.appendChild(opt);
  });
  onTipologiaChange();
}

// ─── Tipologia change ────────────────────────────────────
function onTipologiaChange() {
  const val = document.getElementById('tipologia').value;
  document.getElementById('sezione-spesa').classList.toggle('hidden', val !== 'spesa');
  document.getElementById('sezione-rifornimento').classList.toggle('hidden', val !== 'benzinaio');
  if (val === 'benzinaio') calcolaConsumi();
}

// ─── Impostazioni ────────────────────────────────────────
function apriImpostazioni() {
  document.getElementById('schermata-principale').classList.add('hidden');
  document.getElementById('schermata-impostazioni').classList.remove('hidden');
  renderTipologieLista();
}
function chiudiImpostazioni() {
  document.getElementById('schermata-impostazioni').classList.add('hidden');
  document.getElementById('schermata-principale').classList.remove('hidden');
  popolaTipologie();
}

function renderTipologieLista() {
  const container = document.getElementById('tipologie-lista');
  container.innerHTML = '';
  TIPOLOGIE_SISTEMA.forEach(t => {
    const row = document.createElement('div');
    row.className = 'tip-row tip-sistema';
    row.innerHTML = `<span class="tip-label">${t.label}</span><span class="tip-badge-sistema">Sistema</span>`;
    container.appendChild(row);
  });
  const sep = document.createElement('div');
  sep.className = 'tip-separatore';
  sep.textContent = 'Tipologie personali';
  container.appendChild(sep);
  getTipologieCustom().forEach((t, idx) => {
    const row = document.createElement('div');
    row.className = 'tip-row';
    row.innerHTML = `<input type="text" class="tip-input" value="${t.label}" onchange="rinominaTipologia(${idx},this.value)"/>
      <button class="tip-btn-del" onclick="eliminaTipologia(${idx})">🗑️</button>`;
    container.appendChild(row);
  });
}

function aggiuntaTipologia() {
  const input = document.getElementById('nuova-tipologia-input');
  const label = input.value.trim();
  if (!label) { alert('Inserisci un nome.'); return; }
  const custom = getTipologieCustom();
  custom.push({ valore: 'custom_' + Date.now(), label });
  salvaTipologieCustom(custom);
  input.value = '';
  renderTipologieLista();
}
function rinominaTipologia(idx, v) {
  if (!v.trim()) return;
  const c = getTipologieCustom(); c[idx].label = v.trim(); salvaTipologieCustom(c);
}
function eliminaTipologia(idx) {
  const c = getTipologieCustom();
  if (!confirm(`Eliminare "${c[idx].label}"?`)) return;
  c.splice(idx,1); salvaTipologieCustom(c); renderTipologieLista();
}

// ─── Input Importo (virgola automatica) ──────────────────
function onImportoInput(el) {
  let val = el.value.replace(/\D/g, '');
  if (!val) { el.value = ''; calcolaConsumi(); return; }
  val = val.padStart(3, '0');
  el.value = parseInt(val.slice(0, -2), 10) + ',' + val.slice(-2);
  calcolaConsumi();
}
function importoAsFloat() {
  return parseFloat(document.getElementById('importo').value.replace(',', '.')) || 0;
}

// ─── Input Euro/Litro (virgola automatica a 3 decimali) ──
function onEuroLitroInput(el) {
  let val = el.value.replace(/\D/g, '');
  if (!val) { el.value = ''; calcolaConsumi(); return; }
  val = val.padStart(4, '0');
  el.value = parseInt(val.slice(0, -3), 10) + ',' + val.slice(-3);
  calcolaConsumi();
}
function euroLitroAsFloat() {
  return parseFloat(document.getElementById('euro-litro').value.replace(',', '.')) || 0;
}

// ─── Calcola consumi (auto su ogni input) ────────────────
function calcolaConsumi() {
  const totale = importoAsFloat();
  const euroL  = euroLitroAsFloat();
  const km     = parseFloat(document.getElementById('km-percorsi').value) || 0;

  if (totale > 0 && euroL > 0) {
    const litri = totale / euroL;
    document.getElementById('num-litri').value = litri.toFixed(2);
    if (km > 0) {
      document.getElementById('euro-km').value  = (totale / km).toFixed(3);
      document.getElementById('km-litro').value = (km / litri).toFixed(2);
    } else {
      document.getElementById('euro-km').value  = '';
      document.getElementById('km-litro').value = '';
    }
  } else {
    document.getElementById('num-litri').value = '';
    document.getElementById('euro-km').value   = '';
    document.getElementById('km-litro').value  = '';
  }
}

// ─── Foto ────────────────────────────────────────────────
function scattaFoto()      { document.getElementById('foto-input-camera').click(); }
function selezionaGalleria(){ document.getElementById('foto-input-galleria').click(); }

function onFotoSelezionata(event) {
  for (const file of event.target.files) {
    const reader = new FileReader();
    reader.onload = e => { fotoTemporanee.push(e.target.result); renderFotoPreview(); };
    reader.readAsDataURL(file);
  }
  event.target.value = '';
}

function renderFotoPreview() {
  const container = document.getElementById('foto-preview-container');
  container.innerHTML = '';
  fotoTemporanee.forEach((src, i) => {
    const wrap = document.createElement('div'); wrap.className = 'foto-thumb-wrap';
    const img = document.createElement('img'); img.src = src;
    const btn = document.createElement('button'); btn.className = 'del-foto'; btn.textContent = '✕';
    btn.onclick = () => { fotoTemporanee.splice(i,1); renderFotoPreview(); };
    wrap.appendChild(img); wrap.appendChild(btn); container.appendChild(wrap);
  });
}

// ─── Aggiungi / Modifica Spesa ───────────────────────────
function aggiungiSpesa() {
  const data       = document.getElementById('data-spesa').value;
  const importo    = importoAsFloat();
  const tipoPag    = document.getElementById('tipo-pagamento').value;
  const tipologia  = document.getElementById('tipologia').value;
  const descrizione = document.getElementById('descrizione').value.trim();

  if (!data)                          { alert('Inserisci una data.'); return; }
  if (isNaN(importo) || importo <= 0) { alert('Inserisci un importo valido.'); return; }

  // Label pagamento con icona
  let tipoPagLabel;
  if (tipoPag === 'bancomat') {
    const sub    = document.querySelector('input[name="bancomat-tipo"]:checked');
    const subVal = sub ? sub.value : 'mio';
    const subIcon = subVal === 'mio' ? '👤' : subVal === 'condiviso' ? '👥' : '👨';
    tipoPagLabel = `Bancomat ${subIcon} ${subVal.charAt(0).toUpperCase()+subVal.slice(1)}`;
  } else if (tipoPag === 'altro') {
    tipoPagLabel = document.getElementById('altro-pagamento-text').value.trim() || 'Altro';
  } else {
    const nomi = { contanti:'Contanti', bonifico:'Bonifico', hype:'Hype', satispay:'Satispay' };
    tipoPagLabel = nomi[tipoPag] || (tipoPag.charAt(0).toUpperCase()+tipoPag.slice(1));
  }

  // Dati extra
  let luogo = '', euroLitro = null, numLitri = null, km = null, euroKm = null, kmLitro = null;
  if (tipologia === 'spesa') {
    const luogoSel = document.getElementById('luogo-spesa').value;
    luogo = luogoSel === 'altro' ? (document.getElementById('luogo-altro').value.trim() || 'Altro') : luogoSel;
  } else if (tipologia === 'benzinaio') {
    euroLitro = euroLitroAsFloat() || null;
    numLitri  = parseFloat(document.getElementById('num-litri').value)  || null;
    km        = document.getElementById('km-percorsi').value.trim() || null;
    euroKm    = parseFloat(document.getElementById('euro-km').value)    || null;
    kmLitro   = parseFloat(document.getElementById('km-litro').value)   || null;
  }

  const tutteT = tutteLeTipologie();
  const trovata = tutteT.find(t => t.valore === tipologia);
  const tipologiaLabel = trovata ? trovata.label : tipologia;

  const obj = { id: Date.now(), data, importo, tipoPagamento: tipoPagLabel, tipologiaValore: tipologia,
    tipologia: tipologiaLabel, luogo, euroLitro, numLitri, km, euroKm, kmLitro, descrizione, foto: [...fotoTemporanee] };

  if (spesaInModifica !== null) {
    const idx = spese.findIndex(s => s.id === spesaInModifica);
    if (idx !== -1) spese[idx] = { ...obj, id: spese[idx].id };
    spesaInModifica = null;
    document.getElementById('btn-aggiungi').textContent = '➕ Aggiungi Spesa';
    document.getElementById('btn-annulla-modifica').classList.add('hidden');
  } else {
    spese.push(obj);
  }

  if (modalitaArchivio && dataSelezionataArchivio) {
    localStorage.setItem(keyPerData(dataSelezionataArchivio), JSON.stringify(spese));
    renderListaArchivioDettaglio(dataSelezionataArchivio);
  } else {
    salvaSpeseDiOggi(); renderLista();
  }
  resetForm();
}

function modificaSpesa(id) {
  const s = spese.find(s => s.id === id);
  if (!s) return;
  spesaInModifica = id;

  document.getElementById('data-spesa').value  = s.data;
  document.getElementById('importo').value      = s.importo.toFixed(2).replace('.', ',');
  document.getElementById('descrizione').value  = s.descrizione || '';

  // Tipo pagamento
  const pLow = s.tipoPagamento.toLowerCase();
  let tipoPagBase = 'contanti';
  if (pLow.includes('bancomat')) tipoPagBase = 'bancomat';
  else if (pLow.includes('bonifico')) tipoPagBase = 'bonifico';
  else if (pLow.includes('hype')) tipoPagBase = 'hype';
  else if (pLow.includes('satispay')) tipoPagBase = 'satispay';
  else if (pLow.includes('contanti')) tipoPagBase = 'contanti';
  const selectPag = document.getElementById('tipo-pagamento');
  const opzioniPag = Array.from(selectPag.options).map(o => o.value);
  selectPag.value = opzioniPag.includes(tipoPagBase) ? tipoPagBase : 'altro';
  if (tipoPagBase === 'bancomat') {
    const subVal = pLow.includes('condiviso') ? 'condiviso' : pLow.includes('pap') ? 'papà' : 'mio';
    const radio = document.querySelector(`input[name="bancomat-tipo"][value="${subVal}"]`);
    if (radio) radio.checked = true;
  }
  onTipoPagamentoChange();

  // Tipologia — cerca prima per valore salvato, poi per label
  const tutteT  = tutteLeTipologie();
  let tipVal = s.tipologiaValore || null;
  if (!tipVal) {
    const trovata = tutteT.find(t => t.label === s.tipologia);
    tipVal = trovata ? trovata.valore : 'generale';
  }
  popolaTipologie(tipVal);

  if (tipVal === 'spesa' && s.luogo) {
    const sel = document.getElementById('luogo-spesa');
    const opzioni = Array.from(sel.options).map(o => o.value);
    if (opzioni.includes(s.luogo)) { sel.value = s.luogo; }
    else { sel.value = 'altro'; document.getElementById('luogo-altro').value = s.luogo; document.getElementById('luogo-altro-div').classList.remove('hidden'); }
  }
  if (tipVal === 'benzinaio') {
    if (s.euroLitro) document.getElementById('euro-litro').value  = String(s.euroLitro).replace('.', ',');
    if (s.numLitri)  document.getElementById('num-litri').value   = s.numLitri;
    if (s.km)        document.getElementById('km-percorsi').value = s.km;
    if (s.euroKm)    document.getElementById('euro-km').value     = s.euroKm;
    if (s.kmLitro)   document.getElementById('km-litro').value    = s.kmLitro;
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
  document.getElementById('luogo-spesa').value  = 'Eurospin';
  document.getElementById('luogo-altro').value  = '';
  document.getElementById('luogo-altro-div').classList.add('hidden');
  document.getElementById('euro-litro').value   = '';
  document.getElementById('num-litri').value    = '';
  document.getElementById('km-percorsi').value  = '';
  document.getElementById('euro-km').value      = '';
  document.getElementById('km-litro').value     = '';
  onTipoPagamentoChange();
  popolaTipologie('spesa');
  fotoTemporanee = []; renderFotoPreview();
  impostaDataOggi();
}

// ─── Elimina ─────────────────────────────────────────────
function eliminaSpesa(id) {
  if (!confirm('Eliminare questa spesa?')) return;
  spese = spese.filter(s => s.id !== id);
  if (modalitaArchivio && dataSelezionataArchivio) {
    localStorage.setItem(keyPerData(dataSelezionataArchivio), JSON.stringify(spese));
    renderListaArchivioDettaglio(dataSelezionataArchivio);
  } else { salvaSpeseDiOggi(); renderLista(); }
}

// ─── Render lista ─────────────────────────────────────────
function renderLista() {
  const container = document.getElementById('lista-spese');
  container.innerHTML = '';
  if (!spese.length) {
    container.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa aggiunta oggi.</p>';
    document.getElementById('riepilogo').style.display     = 'none';
    document.getElementById('azioni-export').style.display = 'none';
    return;
  }
  document.getElementById('riepilogo').style.display     = '';
  document.getElementById('azioni-export').style.display = '';
  [...spese].sort((a,b) => b.id - a.id).forEach(s => container.appendChild(creaCardSpesa(s)));
  renderRiepilogo();
}

function iconaPagamento(tipoPag) {
  const p = tipoPag.toLowerCase();
  if (p.includes('bancomat'))  return ICONE_PAGAMENTO.bancomat;
  if (p.includes('contanti'))  return ICONE_PAGAMENTO.contanti;
  if (p.includes('bonifico'))  return ICONE_PAGAMENTO.bonifico;
  if (p.includes('hype'))      return ICONE_PAGAMENTO.hype;
  if (p.includes('satispay'))  return ICONE_PAGAMENTO.satispay;
  return ICONE_PAGAMENTO.altro;
}

function creaCardSpesa(s) {
  const card = document.createElement('div');
  card.className = 'spesa-card';
  const tipLow = (s.tipologia || '').toLowerCase();
  const isBenz = s.tipologiaValore === 'benzinaio' || tipLow.includes('benzinaio') || s.euroLitro;
  const isSpesa = s.tipologiaValore === 'spesa' || tipLow.includes('spesa');

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

// ─── Archivio ─────────────────────────────────────────────
function apriArchivio() {
  modalitaArchivio = true; dataSelezionataArchivio = null;
  document.getElementById('schermata-principale').classList.add('hidden');
  document.getElementById('schermata-archivio').classList.remove('hidden');
  document.getElementById('archivio-lista-date').classList.remove('hidden');
  document.getElementById('archivio-dettaglio').classList.add('hidden');
  renderArchivioLista();
}
function chiudiArchivio() {
  modalitaArchivio = false; dataSelezionataArchivio = null;
  spese = JSON.parse(localStorage.getItem(keyPerData(oggi())) || '[]');
  document.getElementById('schermata-principale').classList.remove('hidden');
  document.getElementById('schermata-archivio').classList.add('hidden');
  renderLista();
}
function renderArchivioLista() {
  const list = document.getElementById('archivio-date-list');
  list.innerHTML = '';
  const date = tutteLeDate();
  if (!date.length) { list.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa archiviata.</p>'; return; }
  date.forEach(d => {
    const arr = JSON.parse(localStorage.getItem(keyPerData(d)) || '[]');
    const totale = arr.reduce((acc,s) => acc+s.importo, 0);
    const item = document.createElement('div'); item.className = 'archivio-item';
    item.innerHTML = `
      <div class="archivio-item-info" onclick="apriDettaglioArchivio('${d}')">
        <span class="archivio-data">📅 ${formatData(d)}</span>
        <span class="archivio-voci">${arr.length} voci</span>
        <span class="archivio-totale">€ ${totale.toFixed(2)}</span>
      </div>
      <button class="btn-elimina-giorno" onclick="eliminaGiornata('${d}')">🗑️</button>`;
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
  if (!spese.length) {
    container.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa.</p>';
    document.getElementById('archivio-dettaglio-totale').textContent = 'Totale: € 0.00'; return;
  }
  [...spese].sort((a,b) => b.id-a.id).forEach(s => container.appendChild(creaCardSpesa(s)));
  document.getElementById('archivio-dettaglio-totale').textContent = `Totale: € ${spese.reduce((a,s)=>a+s.importo,0).toFixed(2)}`;
}
function tornaAllaLista() {
  dataSelezionataArchivio = null; spese = [];
  document.getElementById('archivio-lista-date').classList.remove('hidden');
  document.getElementById('archivio-dettaglio').classList.add('hidden');
  renderArchivioLista();
}
function eliminaGiornata(data) {
  if (!confirm(`Eliminare tutte le spese del ${formatData(data)}?`)) return;
  localStorage.removeItem(keyPerData(data)); renderArchivioLista();
}

// ─── Export PDF ──────────────────────────────────────────
function scaricaPDF() {
  const dataLabel = modalitaArchivio && dataSelezionataArchivio ? formatData(dataSelezionataArchivio) : formatData(oggi());
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Spese ${dataLabel}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{color:#1976d2;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#1976d2;color:white;padding:8px 12px;text-align:left}
  td{padding:8px 12px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f5f9ff}
  .totale{font-size:1.2rem;font-weight:bold;color:#1976d2;text-align:right;margin-top:10px}
  .extra{font-size:0.82rem;color:#888}@media print{button{display:none}}</style></head><body>
  <h1>💶 Riepilogo Spese — ${dataLabel}</h1>
  <table><thead><tr><th>Data</th><th>Tipologia</th><th>Info</th><th>Pagamento</th><th>Importo</th></tr></thead><tbody>
  ${[...spese].sort((a,b)=>new Date(a.data)-new Date(b.data)).map(s => {
    const isBenz = s.tipologiaValore==='benzinaio'||s.euroLitro;
    const isSpesa = s.tipologiaValore==='spesa';
    let info = (s.luogo && isSpesa) ? s.luogo : '';
    if (isBenz) { const p=[]; if(s.euroLitro)p.push(`⛽€${s.euroLitro}/L`); if(s.numLitri)p.push(`${s.numLitri}L`); if(s.km)p.push(`🛣️${s.km}km`); if(s.euroKm)p.push(`€${s.euroKm}/km`); if(s.kmLitro)p.push(`${s.kmLitro}km/L`); info=`<span class="extra">${p.join(' · ')}</span>`; }
    if(s.descrizione) info+=`${info?'<br>':''}<span class="extra">📝 ${s.descrizione}</span>`;
    return `<tr><td>${formatData(s.data)}</td><td>${s.tipologia}</td><td>${info}</td><td>${s.tipoPagamento}</td><td><strong>€ ${s.importo.toFixed(2)}</strong></td></tr>`;
  }).join('')}
  </tbody></table>
  <div class="totale">TOTALE: € ${spese.reduce((a,s)=>a+s.importo,0).toFixed(2)}</div>
  <br><button onclick="window.print()">🖨️ Stampa / Salva PDF</button></body></html>`);
  win.document.close();
}

// ─── Condividi ───────────────────────────────────────────
async function condividi() {
  const dataLabel = modalitaArchivio && dataSelezionataArchivio ? formatData(dataSelezionataArchivio) : formatData(oggi());
  const totaleGen = spese.reduce((acc,s)=>acc+s.importo,0);
  let testo = `💶 *Spese del ${dataLabel}*\n\n`;
  [...spese].sort((a,b)=>new Date(a.data)-new Date(b.data)).forEach((s,i) => {
    testo += `${i+1}. ${s.tipologia} — *€ ${s.importo.toFixed(2)}*\n   ${s.tipoPagamento}`;
    if (s.luogo) testo += `  |  🏪 ${s.luogo}`;
    if (s.euroLitro||s.km) { if(s.euroLitro)testo+=`\n   ⛽ €${s.euroLitro}/L`; if(s.numLitri)testo+=`  🔢 ${s.numLitri}L`; if(s.km)testo+=`  🛣️ ${s.km}km`; if(s.euroKm)testo+=`  💶 €${s.euroKm}/km`; if(s.kmLitro)testo+=`  📊 ${s.kmLitro}km/L`; }
    if (s.descrizione) testo += `\n   📝 ${s.descrizione}`;
    testo += '\n\n';
  });
  testo += `─────────────────\n💰 *TOTALE: € ${totaleGen.toFixed(2)}*`;
  if (navigator.share) { try { await navigator.share({ title:`Spese ${dataLabel}`, text:testo }); return; } catch(e){} }
  copiaNeglAppunti(testo);
}
function copiaNeglAppunti(testo) {
  navigator.clipboard.writeText(testo).then(()=>alert('📋 Copiato!')).catch(()=>prompt('Copia:',testo));
}
async function condividiPDFTelegram() { await condividi(); }

// ─── Export CSV ───────────────────────────────────────────
function esportaCSVSettimana() {
  const tutteSpese = [];
  for (let i=0; i<7; i++) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    JSON.parse(localStorage.getItem(keyPerData(k))||'[]').forEach(s=>tutteSpese.push(s));
  }
  if (!tutteSpese.length) { alert("Nessuna spesa nell'ultima settimana."); return; }
  tutteSpese.sort((a,b)=>new Date(b.data)-new Date(a.data));
  _generaEScaricoCSV(tutteSpese);
}
async function condividiCSVTelegram() { esportaCSVSettimana(); }

function _generaEScaricoCSV(tutteSpese) {
  const intestazioni = ['Data','Contanti','Bancomat Mio','Bancomat Condiviso','Bancomat Papa','Hype','Satispay','Bonifico','Altro','Tipologia','Luogo/Supermercato','Euro/Litro','Litri','Km','Euro/Km','Km/Litro','Note'];
  const righe = [intestazioni.join(';')];
  tutteSpese.forEach(s => {
    const imp = s.importo.toFixed(2).replace('.',',');
    const pag = s.tipoPagamento.toLowerCase();
    const contanti = pag.includes('contanti')  ? imp : '';
    const bancMio  = pag.includes('bancomat') && pag.includes('mio')       ? imp : '';
    const bancCond = pag.includes('bancomat') && pag.includes('condiviso') ? imp : '';
    const bancPapa = pag.includes('bancomat') && pag.includes('pap')       ? imp : '';
    const hype     = pag.includes('hype')      ? imp : '';
    const satispay = pag.includes('satispay')  ? imp : '';
    const bonifico = pag.includes('bonifico')  ? imp : '';
    const noti     = ['contanti','bancomat','hype','satispay','bonifico'];
    const altro    = !noti.some(n=>pag.includes(n)) ? imp : '';
    righe.push([formatData(s.data),contanti,bancMio,bancCond,bancPapa,hype,satispay,bonifico,altro,
      s.tipologia||'',s.luogo||'',
      s.euroLitro?String(s.euroLitro).replace('.',','):'',
      s.numLitri ?String(s.numLitri).replace('.',',') :'',
      s.km||'',
      s.euroKm ?String(s.euroKm).replace('.',',') :'',
      s.kmLitro?String(s.kmLitro).replace('.',','):'',
      (s.descrizione||'').replace(/;/g,',')].join(';'));
  });
  const totale = tutteSpese.reduce((acc,s)=>acc+s.importo,0);
  righe.push(''); righe.push('TOTALE;;;;;;;;;;;'+totale.toFixed(2).replace('.',','));
  const blob = new Blob(['\uFEFF'+righe.join('\n')], {type:'text/csv;charset=utf-8;'});
  const dataInizio = formatData(new Date(new Date().setDate(new Date().getDate()-6)).toISOString().split('T')[0]);
  const dataFine   = formatData(oggi());
  const nomeFile   = 'Spese_'+dataInizio.replace(/\//g,'-')+'_'+dataFine.replace(/\//g,'-')+'.csv';
  const file = new File([blob], nomeFile, {type:'text/csv'});
  if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
    navigator.share({files:[file], title:`Spese ${dataInizio} - ${dataFine}`}).catch(()=>scaricaFile(blob,nomeFile));
  } else { scaricaFile(blob,nomeFile); }
}
function scaricaFile(blob, nomeFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=nomeFile; a.click();
  URL.revokeObjectURL(url);
}

// ─── Modal Foto ──────────────────────────────────────────
function apriModal(encodedSrc) {
  const src = decodeURIComponent(encodedSrc);
  let modal = document.getElementById('foto-modal');
  if (!modal) { modal=document.createElement('div'); modal.id='foto-modal'; modal.innerHTML='<button onclick="chiudiModal()">✕</button><img id="modal-img"/>'; document.body.appendChild(modal); }
  document.getElementById('modal-img').src = src;
  modal.classList.add('show');
}
function chiudiModal() { document.getElementById('foto-modal')?.classList.remove('show'); }

// ─── Service Worker ──────────────────────────────────────
let pendingRegistration = null;
function registraServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw.addEventListener('statechange', () => {
        if (nw.state==='installed' && navigator.serviceWorker.controller) {
          pendingRegistration = reg;
          document.getElementById('update-banner').classList.remove('hidden');
        }
      });
    });
    setInterval(()=>reg.update(), 5*60*1000);
  });
  navigator.serviceWorker.addEventListener('controllerchange', ()=>window.location.reload());
}
function applyUpdate() {
  if (pendingRegistration && pendingRegistration.waiting)
    pendingRegistration.waiting.postMessage({type:'SKIP_WAITING'});
}

// ─── Changelog ───────────────────────────────────────────
function controllaVersioneNuova() {
  const ultima = localStorage.getItem('ultima_versione_vista');
  if (ultima !== APP_VERSION) { setTimeout(()=>apriChangelog(true), 1000); localStorage.setItem('ultima_versione_vista', APP_VERSION); }
}
function apriChangelog(soloUltima=false) {
  const body = document.getElementById('changelog-body');
  body.innerHTML = '';
  const cl = typeof APP_CHANGELOG !== 'undefined' ? APP_CHANGELOG : [];
  if (!cl.length) { body.innerHTML='<p style="color:#aaa;text-align:center;padding:20px">Nessuna nota.</p>'; }
  else {
    (soloUltima?[cl[0]]:cl).forEach(entry => {
      const isCurrent = entry.version===APP_VERSION;
      const block = document.createElement('div'); block.className='cl-version-block';
      block.innerHTML=`<div class="cl-version-title"><span class="cl-version-badge ${isCurrent?'current':''}">v${entry.version}${isCurrent?' ✓':''}</span><span class="cl-version-date">📅 ${formatData(entry.date)}</span></div><ul class="cl-notes">${entry.notes.map(n=>`<li>${n}</li>`).join('')}</ul>`;
      body.appendChild(block);
    });
  }
  document.getElementById('changelog-modal').classList.remove('hidden');
}
function chiudiChangelog() { document.getElementById('changelog-modal').classList.add('hidden'); }
async function cercaAggiornamenti() {
  const btn = document.querySelector('#changelog-modal .cl-btn-cerca');
  btn.disabled=true; btn.textContent='⏳ Controllo...';
  try {
    const res = await fetch(`./version.js?t=${Date.now()}`, {cache:'no-store'});
    const testo = await res.text();
    const match = testo.match(/APP_VERSION\s*=\s*"([^"]+)"/);
    const vOnline = match?match[1]:null;
    if (!vOnline) { alert('⚠️ Impossibile leggere la versione online.'); }
    else if (vOnline===APP_VERSION) { btn.textContent='✅ Sei aggiornato!'; btn.style.background='#43a047'; setTimeout(()=>{btn.textContent='🔍 Cerca aggiornamenti';btn.style.background='';btn.disabled=false;},3000); return; }
    else { chiudiChangelog(); mostraModalAggiornamento(vOnline); }
  } catch { alert('⚠️ Errore di rete.'); }
  btn.textContent='🔍 Cerca aggiornamenti'; btn.disabled=false;
}
function mostraModalAggiornamento(vOnline) {
  document.getElementById('update-modal-body').innerHTML=`<div style="text-align:center;padding:8px 0 16px"><div style="font-size:2.5rem;margin-bottom:8px">🆕</div><div style="font-size:1rem;font-weight:700;color:#1976d2">Versione ${vOnline} disponibile</div><div style="font-size:0.85rem;color:#888;margin-top:4px">Stai usando la v${APP_VERSION}</div></div><p style="font-size:0.88rem;color:#555;text-align:center;line-height:1.5">Tocca <strong>Aggiorna ora</strong> per installare.</p>`;
  document.getElementById('update-modal').classList.remove('hidden');
}
function chiudiUpdateModal() { document.getElementById('update-modal').classList.add('hidden'); }
