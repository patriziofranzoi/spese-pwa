// ─── Icone SVG metodi di pagamento ───────────────────────
const ICONE_PAGAMENTO = {
  bancomat: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/><line x1="1" y1="10" x2="23" y2="10" stroke="#1b5e20" stroke-width="2.5"/></svg>`,
  contanti: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#fdd835"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#5d4037">€</text></svg>`,
  bonifico: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="13" rx="2" fill="#e3f2fd"/><path d="M8 21h8M12 16v5M7 8h.01M7 12h10"/></svg>`,
  hype:     `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#1565c0"/><text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="bold" fill="white">H</text></svg>`,
  satispay: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#e53935"/><text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="bold" fill="white">S</text></svg>`,
  pagopa:   `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#0046ad"/><text x="12" y="16" text-anchor="middle" font-size="8.5" font-weight="bold" fill="white">PA</text></svg>`,
  f24:      `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><rect x="2" y="2" width="20" height="20" rx="4" fill="#e65100"/><text x="12" y="16" text-anchor="middle" font-size="8.5" font-weight="bold" fill="white">F24</text></svg>`,
  altro:    `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px" fill="none" stroke="#757575" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
};

// ─── Tipologie di sistema (ordine alfabetico) ─────────────
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
  try {
    localStorage.setItem(keyPerData(oggi()), JSON.stringify(spese));
  } catch(e) {
    // localStorage pieno — prova a salvare senza le foto
    console.error('localStorage pieno, salvo senza foto:', e);
    const speseSenzaFoto = spese.map(s => ({ ...s, foto: [] }));
    try {
      localStorage.setItem(keyPerData(oggi()), JSON.stringify(speseSenzaFoto));
      alert('⚠️ Spazio esaurito: la spesa è stata salvata ma le foto non sono state conservate. Elimina vecchie spese per liberare spazio.');
    } catch(e2) {
      alert('❌ Errore: impossibile salvare. La memoria del dispositivo è piena.');
    }
  }
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
  // Default personalizzate
  return [
    { valore: 'amazon', label: '🛍️ Amazon' },
    { valore: 'misto',  label: '🔀 Misto' },
    { valore: 'altro',  label: '✏️ Altro' },
  ];
}
function salvaTipologieCustom(arr) { localStorage.setItem('tipologie_custom', JSON.stringify(arr)); }
function tutteLeTipologie() { return [...TIPOLOGIE_SISTEMA, ...getTipologieCustom()]; }

function popolaTipologie(valoreSelezionato) {
  const sel = document.getElementById('tipologia');
  const currentVal = (valoreSelezionato !== undefined) ? valoreSelezionato : (sel.value || 'spesa');
  sel.innerHTML = '';
  tutteLeTipologie().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.valore; opt.textContent = t.label;
    if (t.valore === currentVal) opt.selected = true;
    sel.appendChild(opt);
  });
  onTipologiaChange();
}

// ─── Tipologia change ─────────────────────────────────────
function onTipologiaChange() {
  const val = document.getElementById('tipologia').value;
  document.getElementById('sezione-spesa').classList.toggle('hidden', val !== 'spesa');
  const isBenz = val === 'benzinaio' || val === 'rifornimento';
  document.getElementById('sezione-rifornimento').classList.toggle('hidden', !isBenz);
  if (isBenz) calcolaConsumi();
}

// ─── Impostazioni ─────────────────────────────────────────
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
    const row = document.createElement('div'); row.className = 'tip-row tip-sistema';
    row.innerHTML = `<span class="tip-label">${t.label}</span><span class="tip-badge-sistema">Sistema</span>`;
    container.appendChild(row);
  });
  const sep = document.createElement('div'); sep.className = 'tip-separatore';
  sep.textContent = 'Tipologie personali'; container.appendChild(sep);
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
  if (!v.trim()) return;
  const c = getTipologieCustom(); c[idx].label = v.trim(); salvaTipologieCustom(c);
}
function eliminaTipologia(idx) {
  const c = getTipologieCustom();
  if (!confirm(`Eliminare "${c[idx].label}"?`)) return;
  c.splice(idx,1); salvaTipologieCustom(c); renderTipologieLista();
}

// ─── Input importo con virgola automatica ────────────────
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

// ─── Commissioni: virgola automatica come importo ────────
function onCommissioniInput(el) {
  let val = el.value.replace(/\D/g, '');
  if (!val) { el.value = ''; return; }
  val = val.padStart(3, '0');
  el.value = parseInt(val.slice(0,-2), 10) + ',' + val.slice(-2);
}
function commissioniAsFloat() {
  const el = document.getElementById('commissioni');
  if (!el || !el.value.trim()) return 0;
  return parseFloat(el.value.replace(',', '.')) || 0;
}

// ─── Input euro/litro con virgola automatica (3 dec.) ────
function onEuroLitroInput(el) {
  let val = el.value.replace(/\D/g, '');
  if (!val) { el.value = ''; calcolaConsumi(); return; }
  val = val.padStart(4, '0');
  el.value = parseInt(val.slice(0,-3), 10) + ',' + val.slice(-3);
  calcolaConsumi();
}
function euroLitroAsFloat() {
  const el = document.getElementById('euro-litro');
  return parseFloat((el ? el.value : '0').replace(',', '.')) || 0;
}

// ─── Calcola consumi benzinaio ────────────────────────────
function calcolaConsumi() {
  const totale = importoAsFloat();
  const euroL  = euroLitroAsFloat();
  const kmEl   = document.getElementById('km-percorsi');
  const km     = kmEl ? (parseFloat(kmEl.value) || 0) : 0;
  const setV   = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
  if (totale > 0 && euroL > 0) {
    const litri = totale / euroL;
    setV('num-litri', litri.toFixed(2));
    if (km > 0) { setV('euro-km', (totale/km).toFixed(3)); setV('km-litro', (km/litri).toFixed(2)); }
    else        { setV('euro-km', ''); setV('km-litro', ''); }
  } else { setV('num-litri',''); setV('euro-km',''); setV('km-litro',''); }
}

// ─── Foto ─────────────────────────────────────────────────
function scattaFoto() {
  const inp = document.getElementById('foto-input-camera');
  if (inp) inp.click();
}
function selezionaGalleria() {
  const inp = document.getElementById('foto-input-galleria');
  if (inp) inp.click();
}
// ─── Foto con compressione automatica ────────────────────
// Le foto vengono ridimensionate a max 800px e compresse
// per stare dentro il limite di localStorage (~5MB totale)
function onFotoSelezionata(event) {
  for (const file of event.target.files) {
    comprimiFoto(file).then(dataUrl => {
      fotoTemporanee.push(dataUrl);
      renderFotoPreview();
    }).catch(err => {
      console.error('Errore compressione foto:', err);
      alert('Errore nel caricamento della foto. Riprova.');
    });
  }
  event.target.value = '';
}

function comprimiFoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // Ridimensiona a max 800px mantenendo proporzioni
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        else if (h > MAX)     { w = Math.round(w * MAX / h); h = MAX; }

        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        // Qualità 0.7 = buon compromesso qualità/peso (~50-150KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
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

// ─── Aggiungi / Modifica Spesa ────────────────────────────
function aggiungiSpesa() {
  const data        = document.getElementById('data-spesa').value;
  const importo     = importoAsFloat();
  const commissioni = commissioniAsFloat();
  const tipoPag     = document.getElementById('tipo-pagamento').value;
  const tipologia   = document.getElementById('tipologia').value;
  const descrizione = document.getElementById('descrizione').value.trim();

  if (!data)                          { alert('Inserisci una data.'); return; }
  if (isNaN(importo) || importo <= 0) { alert('Inserisci un importo valido.'); return; }

  // Label pagamento con icona
  let tipoPagLabel;
  if (tipoPag === 'bancomat') {
    const sub = document.querySelector('input[name="bancomat-tipo"]:checked');
    const sv  = sub ? sub.value : 'mio';
    const si  = sv === 'mio' ? '👤' : sv === 'condiviso' ? '👥' : '👨';
    tipoPagLabel = `Bancomat ${si} ${sv.charAt(0).toUpperCase()+sv.slice(1)}`;
  } else if (tipoPag === 'altro') {
    tipoPagLabel = document.getElementById('altro-pagamento-text').value.trim() || 'Altro';
  } else {
    const nomi = { contanti:'Contanti', bonifico:'Bonifico', hype:'Hype', satispay:'Satispay', pagopa:'PagoPa', f24:'F24' };
    tipoPagLabel = nomi[tipoPag] || (tipoPag.charAt(0).toUpperCase()+tipoPag.slice(1));
  }

  // Dati extra tipologia
  let luogo = '', euroLitro = null, numLitri = null, km = null, euroKm = null, kmLitro = null;
  if (tipologia === 'spesa') {
    const ls = document.getElementById('luogo-spesa').value;
    luogo = ls === 'altro' ? (document.getElementById('luogo-altro').value.trim() || 'Altro') : ls;
  } else if (tipologia === 'benzinaio' || tipologia === 'rifornimento') {
    euroLitro = euroLitroAsFloat() || null;
    numLitri  = parseFloat(document.getElementById('num-litri').value) || null;
    const kmEl = document.getElementById('km-percorsi');
    km        = kmEl ? (kmEl.value.trim() || null) : null;
    const ekEl = document.getElementById('euro-km');
    euroKm    = ekEl ? (parseFloat(ekEl.value) || null) : null;
    const klEl = document.getElementById('km-litro');
    kmLitro   = klEl ? (parseFloat(klEl.value) || null) : null;
  }

  const tutteT = tutteLeTipologie();
  const trovata = tutteT.find(t => t.valore === tipologia);
  const tipologiaLabel = trovata ? trovata.label : tipologia;

  const obj = {
    id: Date.now(), data, importo,
    commissioni: commissioni > 0 ? commissioni : null,
    tipoPagamento: tipoPagLabel, tipologiaValore: tipologia,
    tipologia: tipologiaLabel, luogo, euroLitro, numLitri, km, euroKm, kmLitro,
    descrizione, foto: [...fotoTemporanee]
  };

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
  } else { salvaSpeseDiOggi(); renderLista(); }
  resetForm();
}

function modificaSpesa(id) {
  const s = spese.find(s => s.id === id);
  if (!s) return;
  spesaInModifica = id;

  document.getElementById('data-spesa').value  = s.data;
  document.getElementById('importo').value      = s.importo.toFixed(2).replace('.', ',');
  document.getElementById('descrizione').value  = s.descrizione || '';
  const cEl = document.getElementById('commissioni');
  if (cEl) cEl.value = s.commissioni ? String(Math.round(s.commissioni)) : '';

  // Tipo pagamento
  const pLow = s.tipoPagamento.toLowerCase();
  let tipoPagBase = 'altro';
  if (pLow.includes('bancomat'))  tipoPagBase = 'bancomat';
  else if (pLow.includes('bonifico')) tipoPagBase = 'bonifico';
  else if (pLow.includes('contanti')) tipoPagBase = 'contanti';
  else if (pLow.includes('satispay')) tipoPagBase = 'satispay';
  else if (pLow.includes('hype'))     tipoPagBase = 'hype';
  else if (pLow.includes('pagopa'))   tipoPagBase = 'pagopa';
  else if (pLow.includes('f24'))      tipoPagBase = 'f24';
  const selectPag = document.getElementById('tipo-pagamento');
  selectPag.value = Array.from(selectPag.options).map(o=>o.value).includes(tipoPagBase) ? tipoPagBase : 'altro';
  if (tipoPagBase === 'bancomat') {
    const sv = pLow.includes('condiviso') ? 'condiviso' : pLow.includes('pap') ? 'papà' : 'mio';
    const r  = document.querySelector(`input[name="bancomat-tipo"][value="${sv}"]`);
    if (r) r.checked = true;
  }
  onTipoPagamentoChange();

  // Tipologia
  const tutteT = tutteLeTipologie();
  const tipVal = s.tipologiaValore || (tutteT.find(t => t.label === s.tipologia) || {}).valore || 'spesa';
  popolaTipologie(tipVal);

  if (tipVal === 'spesa' && s.luogo) {
    const sel = document.getElementById('luogo-spesa');
    if (sel) {
      if (Array.from(sel.options).map(o=>o.value).includes(s.luogo)) { sel.value = s.luogo; }
      else { sel.value = 'altro'; document.getElementById('luogo-altro').value = s.luogo; document.getElementById('luogo-altro-div').classList.remove('hidden'); }
    }
  }
  if (tipVal === 'benzinaio' || tipVal === 'rifornimento') {
    const setF = (id, v) => { const e=document.getElementById(id); if(e&&v) e.value=String(v).replace('.',','); };
    const setN = (id, v) => { const e=document.getElementById(id); if(e&&v) e.value=v; };
    setF('euro-litro', s.euroLitro); setN('num-litri', s.numLitri);
    setN('km-percorsi', s.km); setN('euro-km', s.euroKm); setN('km-litro', s.kmLitro);
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
  document.getElementById('importo').value        = '';
  document.getElementById('descrizione').value    = '';
  document.getElementById('tipo-pagamento').value = 'bancomat';
  document.getElementById('luogo-spesa').value    = 'Aldì';
  document.getElementById('luogo-altro').value    = '';
  document.getElementById('luogo-altro-div').classList.add('hidden');
  const clear = id => { const e=document.getElementById(id); if(e) e.value=''; };
  clear('commissioni'); clear('euro-litro'); clear('num-litri');
  clear('km-percorsi'); clear('euro-km'); clear('km-litro');
  onTipoPagamentoChange();
  popolaTipologie('spesa');
  fotoTemporanee = []; renderFotoPreview();
  impostaDataOggi();
}

// ─── Elimina ──────────────────────────────────────────────
function eliminaSpesa(id) {
  if (!confirm('Eliminare questa spesa?')) return;
  spese = spese.filter(s => s.id !== id);
  if (modalitaArchivio && dataSelezionataArchivio) {
    localStorage.setItem(keyPerData(dataSelezionataArchivio), JSON.stringify(spese));
    renderListaArchivioDettaglio(dataSelezionataArchivio);
  } else { salvaSpeseDiOggi(); renderLista(); }
}

// ─── Icona pagamento ──────────────────────────────────────
function iconaPag(tipoPag) {
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
  [...spese].sort((a,b) => b.id-a.id).forEach(s => container.appendChild(creaCardSpesa(s)));
  renderRiepilogo();
}

function creaCardSpesa(s) {
  const card = document.createElement('div'); card.className = 'spesa-card';
  const isBenz  = s.tipologiaValore==='benzinaio' || s.tipologiaValore==='rifornimento' || s.euroLitro;
  const isSpesa = s.tipologiaValore==='spesa' || (s.tipologia||'').toLowerCase().includes('spesa');
  let extraInfo = '';
  if (isSpesa && s.luogo) extraInfo += `<span>🏪 ${s.luogo}</span>`;
  if (isBenz) {
    if (s.euroLitro) extraInfo += `<span>⛽ €${s.euroLitro}/L</span>`;
    if (s.numLitri)  extraInfo += `<span>🔢 ${s.numLitri}L</span>`;
    if (s.km)        extraInfo += `<span>🛣️ ${s.km}km</span>`;
    if (s.euroKm)    extraInfo += `<span>💶 €${s.euroKm}/km</span>`;
    if (s.kmLitro)   extraInfo += `<span>📊 ${s.kmLitro}km/L</span>`;
  }
  const commBadge = s.commissioni ? `<span style="font-size:0.75rem;color:#e65100;margin-left:6px">+€${s.commissioni.toFixed(2)} comm.</span>` : '';

  card.innerHTML = `
    <div class="card-azioni">
      <button class="btn-modifica" onclick="modificaSpesa(${s.id})">✏️</button>
      <button class="btn-elimina"  onclick="eliminaSpesa(${s.id})">🗑️</button>
    </div>
    <div class="importo-badge">€ ${s.importo.toFixed(2)}${commBadge}</div>
    <div class="meta">
      <span>📅 ${formatData(s.data)}</span>
      <span>${iconaPag(s.tipoPagamento)}${s.tipoPagamento}</span>
      <span>🏷️ ${s.tipologia}</span>
      ${extraInfo}
    </div>
    ${s.descrizione ? `<div class="desc">📝 ${s.descrizione}</div>` : ''}
    ${s.foto && s.foto.length ? `<div class="foto-row">${s.foto.map(f=>`<img src="${f}" onclick="apriModal('${encodeURIComponent(f)}')" />`).join('')}</div>` : ''}`;
  return card;
}

function renderRiepilogo() {
  const totali = {}; let totaleGen = 0;
  spese.forEach(s => {
    const tot = s.importo + (s.commissioni || 0);
    totali[s.tipoPagamento] = (totali[s.tipoPagamento]||0) + tot;
    totaleGen += tot;
  });
  const content = document.getElementById('riepilogo-content');
  content.innerHTML = '';
  Object.entries(totali).forEach(([tipo, tot]) => {
    const row = document.createElement('div'); row.className = 'riepilogo-row';
    row.innerHTML = `<span>${iconaPag(tipo)}${tipo}</span><span>€ ${tot.toFixed(2)}</span>`;
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
    const arr    = JSON.parse(localStorage.getItem(keyPerData(d)) || '[]');
    const totale = arr.reduce((acc,s) => acc + s.importo + (s.commissioni||0), 0);
    const item   = document.createElement('div'); item.className = 'archivio-item';
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
  const totale = spese.reduce((a,s) => a+s.importo+(s.commissioni||0), 0);
  document.getElementById('archivio-dettaglio-totale').textContent = `Totale: € ${totale.toFixed(2)}`;
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

// ─── Export PDF ───────────────────────────────────────────
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
  <table><thead><tr><th>Data</th><th>Tipologia</th><th>Info</th><th>Pagamento</th><th>Importo</th><th>Comm.</th></tr></thead><tbody>
  ${[...spese].sort((a,b)=>new Date(a.data)-new Date(b.data)).map(s => {
    const isBenz  = s.tipologiaValore==='benzinaio'||s.euroLitro;
    const isSpesa = s.tipologiaValore==='spesa';
    let info = (s.luogo && isSpesa) ? s.luogo : '';
    if (isBenz) { const p=[]; if(s.euroLitro)p.push('⛽€'+s.euroLitro+'/L'); if(s.numLitri)p.push(s.numLitri+'L'); if(s.km)p.push('🛣️'+s.km+'km'); if(s.euroKm)p.push('€'+s.euroKm+'/km'); if(s.kmLitro)p.push(s.kmLitro+'km/L'); info='<span class="extra">'+p.join(' · ')+'</span>'; }
    if(s.descrizione) info+=(info?'<br>':'')+'<span class="extra">📝 '+s.descrizione+'</span>';
    return '<tr><td>'+formatData(s.data)+'</td><td>'+s.tipologia+'</td><td>'+info+'</td><td>'+s.tipoPagamento+'</td><td><strong>€ '+s.importo.toFixed(2)+'</strong></td><td>'+(s.commissioni?'€'+s.commissioni.toFixed(2):'')+'</td></tr>';
  }).join('')}
  </tbody></table>
  <div class="totale">TOTALE: € ${spese.reduce((a,s)=>a+s.importo+(s.commissioni||0),0).toFixed(2)}</div>
  <br><button onclick="window.print()">🖨️ Stampa / Salva PDF</button></body></html>`);
  win.document.close();
}

// ─── Condividi ────────────────────────────────────────────
async function condividi() {
  const dataLabel = modalitaArchivio && dataSelezionataArchivio ? formatData(dataSelezionataArchivio) : formatData(oggi());
  const totaleGen = spese.reduce((acc,s)=>acc+s.importo+(s.commissioni||0),0);
  let testo = `💶 *Spese del ${dataLabel}*\n\n`;
  [...spese].sort((a,b)=>new Date(a.data)-new Date(b.data)).forEach((s,i) => {
    testo += `${i+1}. ${s.tipologia} — *€ ${s.importo.toFixed(2)}*`;
    if (s.commissioni) testo += ` (+€${s.commissioni.toFixed(2)} comm.)`;
    testo += `\n   ${s.tipoPagamento}`;
    if (s.luogo) testo += `  |  🏪 ${s.luogo}`;
    if (s.euroLitro||s.km) {
      if(s.euroLitro) testo+=`\n   ⛽€${s.euroLitro}/L`;
      if(s.numLitri)  testo+=` 🔢${s.numLitri}L`;
      if(s.km)        testo+=` 🛣️${s.km}km`;
      if(s.euroKm)    testo+=` €${s.euroKm}/km`;
      if(s.kmLitro)   testo+=` ${s.kmLitro}km/L`;
    }
    if (s.descrizione) testo += `\n   📝 ${s.descrizione}`;
    testo += '\n\n';
  });
  testo += `─────────────────\n💰 *TOTALE: € ${totaleGen.toFixed(2)}*`;
  if (navigator.share) { try { await navigator.share({ title:`Spese ${dataLabel}`, text:testo }); return; } catch(e){} }
  copiaNeglAppunti(testo);
}
async function condividiPDFTelegram() { await condividi(); }
function copiaNeglAppunti(t) { navigator.clipboard.writeText(t).then(()=>alert('📋 Copiato!')).catch(()=>prompt('Copia:',t)); }

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
  _generaCSV(tutteSpese);
}
async function condividiCSVTelegram() { esportaCSVSettimana(); }

function _generaCSV(tutteSpese) {
  const int = ['Data','Contanti','Bancomat Mio','Bancomat Condiviso','Bancomat Papa',
    'Hype','Satispay','Bonifico','PagoPa','F24','Altro',
    'Commissioni','Tipologia','Luogo','Euro/Litro','Litri','Km','Euro/Km','Km/Litro','Note'];
  const righe = [int.join(';')];
  tutteSpese.forEach(s => {
    const imp = s.importo.toFixed(2).replace('.',',');
    const p   = s.tipoPagamento.toLowerCase();
    const c   = s.commissioni ? s.commissioni.toFixed(2).replace('.',',') : '';
    const bancMio  = p.includes('bancomat')&&p.includes('mio')       ? imp:'';
    const bancCond = p.includes('bancomat')&&p.includes('condiviso') ? imp:'';
    const bancPapa = p.includes('bancomat')&&p.includes('pap')       ? imp:'';
    const noti = ['contanti','bancomat','hype','satispay','bonifico','pagopa','f24'];
    righe.push([
      formatData(s.data),
      p.includes('contanti') ? imp : '',
      bancMio, bancCond, bancPapa,
      p.includes('hype')     ? imp : '',
      p.includes('satispay') ? imp : '',
      p.includes('bonifico') ? imp : '',
      p.includes('pagopa')   ? imp : '',
      p.includes('f24')      ? imp : '',
      !noti.some(n=>p.includes(n)) ? imp : '',
      c, s.tipologia||'', s.luogo||'',
      s.euroLitro ? String(s.euroLitro).replace('.',',') : '',
      s.numLitri  ? String(s.numLitri).replace('.',',')  : '',
      s.km||'',
      s.euroKm  ? String(s.euroKm).replace('.',',')  : '',
      s.kmLitro ? String(s.kmLitro).replace('.',',') : '',
      (s.descrizione||'').replace(/;/g,',')
    ].join(';'));
  });
  const totale = tutteSpese.reduce((acc,s)=>acc+s.importo+(s.commissioni||0),0);
  righe.push(''); righe.push('TOTALE;;;;;;;;;;;;;;'+totale.toFixed(2).replace('.',','));
  const blob = new Blob(['\uFEFF'+righe.join('\n')],{type:'text/csv;charset=utf-8;'});
  const dI   = formatData(new Date(new Date().setDate(new Date().getDate()-6)).toISOString().split('T')[0]);
  const dF   = formatData(oggi());
  const nome = 'Spese_'+dI.replace(/\//g,'-')+'_'+dF.replace(/\//g,'-')+'.csv';
  const file = new File([blob],nome,{type:'text/csv'});
  if (navigator.share&&navigator.canShare&&navigator.canShare({files:[file]}))
    navigator.share({files:[file],title:`Spese ${dI}-${dF}`}).catch(()=>scaricaFile(blob,nome));
  else scaricaFile(blob,nome);
}
function scaricaFile(blob,nome) {
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=nome; a.click(); URL.revokeObjectURL(url);
}

// ─── Modal Foto ───────────────────────────────────────────
function apriModal(enc) {
  const src=decodeURIComponent(enc);
  let m=document.getElementById('foto-modal');
  if(!m){m=document.createElement('div');m.id='foto-modal';m.innerHTML='<button onclick="chiudiModal()">✕</button><img id="modal-img"/>';document.body.appendChild(m);}
  document.getElementById('modal-img').src=src; m.classList.add('show');
}
function chiudiModal(){document.getElementById('foto-modal')?.classList.remove('show');}

// ─── Modal Info App ───────────────────────────────────────
function apriInfo() {
  const el = document.getElementById('info-version');
  if (el) el.textContent = APP_VERSION + ' · ' + APP_VERSION_DATE;
  document.getElementById('info-modal').classList.remove('hidden');
}
function chiudiInfo() { document.getElementById('info-modal').classList.add('hidden'); }

// ─── Service Worker ───────────────────────────────────────
let pendingRegistration = null;
function registraServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw.addEventListener('statechange', () => {
        if (nw.state==='installed'&&navigator.serviceWorker.controller) {
          pendingRegistration=reg;
          document.getElementById('update-banner').classList.remove('hidden');
        }
      });
    });
    setInterval(()=>reg.update(), 5*60*1000);
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>window.location.reload());
}
function applyUpdate() {
  if (pendingRegistration&&pendingRegistration.waiting)
    pendingRegistration.waiting.postMessage({type:'SKIP_WAITING'});
}

// ─── Changelog & aggiornamenti ────────────────────────────
function controllaVersioneNuova() {
  const ul = localStorage.getItem('ultima_versione_vista');
  if (ul !== APP_VERSION) { setTimeout(()=>apriChangelog(true),1000); localStorage.setItem('ultima_versione_vista',APP_VERSION); }
}
function apriChangelog(soloUltima=false) {
  const body=document.getElementById('changelog-body'); body.innerHTML='';
  const cl=typeof APP_CHANGELOG!=='undefined'?APP_CHANGELOG:[];
  if(!cl.length){body.innerHTML='<p style="color:#aaa;text-align:center;padding:20px">Nessuna nota.</p>';}
  else {
    (soloUltima?[cl[0]]:cl).forEach(entry=>{
      const isCurrent=entry.version===APP_VERSION;
      const block=document.createElement('div'); block.className='cl-version-block';
      block.innerHTML=`<div class="cl-version-title"><span class="cl-version-badge ${isCurrent?'current':''}">v${entry.version}${isCurrent?' ✓':''}</span><span class="cl-version-date">📅 ${formatData(entry.date)}</span></div><ul class="cl-notes">${entry.notes.map(n=>`<li>${n}</li>`).join('')}</ul>`;
      body.appendChild(block);
    });
  }
  document.getElementById('changelog-modal').classList.remove('hidden');
}
function chiudiChangelog(){document.getElementById('changelog-modal').classList.add('hidden');}
async function cercaAggiornamenti() {
  const btn=document.querySelector('#changelog-modal .cl-btn-cerca');
  btn.disabled=true; btn.textContent='⏳ Controllo...';
  try {
    const res=await fetch(`./version.js?t=${Date.now()}`,{cache:'no-store'});
    const txt=await res.text();
    const m=txt.match(/APP_VERSION\s*=\s*"([^"]+)"/);
    const vO=m?m[1]:null;
    if(!vO){alert('⚠️ Impossibile leggere la versione online.');}
    else if(vO===APP_VERSION){btn.textContent='✅ Sei aggiornato!';btn.style.background='#43a047';setTimeout(()=>{btn.textContent='🔍 Cerca aggiornamenti';btn.style.background='';btn.disabled=false;},3000);return;}
    else{chiudiChangelog();mostraModalAggiornamento(vO);}
  } catch{alert('⚠️ Errore di rete.');}
  btn.textContent='🔍 Cerca aggiornamenti'; btn.disabled=false;
}
function mostraModalAggiornamento(vO) {
  document.getElementById('update-modal-body').innerHTML=`<div style="text-align:center;padding:8px 0 16px"><div style="font-size:2.5rem;margin-bottom:8px">🆕</div><div style="font-size:1rem;font-weight:700;color:#1976d2">Versione ${vO} disponibile</div><div style="font-size:0.85rem;color:#888;margin-top:4px">Stai usando la v${APP_VERSION}</div></div><p style="font-size:0.88rem;color:#555;text-align:center">Tocca <strong>Aggiorna ora</strong> per installare.</p>`;
  document.getElementById('update-modal').classList.remove('hidden');
}
function chiudiUpdateModal(){document.getElementById('update-modal').classList.add('hidden');}
