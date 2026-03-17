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
  document.getElementById('sezione-rifornimento').classList.toggle('hidden', val !== 'rifornimento');
  if (val === 'rifornimento') calcolaLitri();
}

function calcolaLitri() {
  const totale = parseFloat(document.getElementById('importo').value);
  const euroL = parseFloat(document.getElementById('euro-litro').value);
  if (!isNaN(totale) && !isNaN(euroL) && euroL > 0) {
    document.getElementById('num-litri').value = (totale / euroL).toFixed(2);
  } else {
    document.getElementById('num-litri').value = '';
  }
}

// ─── Foto ────────────────────────────────────────────────
function scattaFoto() {
  const input = document.getElementById('foto-input');
  input.setAttribute('capture', 'environment');
  input.setAttribute('accept', 'image/*');
  input.click();
}

function selezionaGalleria() {
  const input = document.getElementById('foto-input');
  input.removeAttribute('capture');
  input.setAttribute('accept', 'image/*');
  input.click();
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
  const importo = parseFloat(document.getElementById('importo').value);
  const tipoPag = document.getElementById('tipo-pagamento').value;
  const tipologia = document.getElementById('tipologia').value;
  const descrizione = document.getElementById('descrizione').value.trim();

  if (!data) { alert('Inserisci una data.'); return; }
  if (isNaN(importo) || importo <= 0) { alert('Inserisci un importo valido.'); return; }

  let tipoPagLabel = tipoPag;
  if (tipoPag === 'bancomat') {
    const sub = document.querySelector('input[name="bancomat-tipo"]:checked');
    tipoPagLabel = 'Bancomat - ' + (sub ? sub.value.charAt(0).toUpperCase() + sub.value.slice(1) : 'Mio');
  } else if (tipoPag === 'altro') {
    const altroText = document.getElementById('altro-pagamento-text').value.trim();
    tipoPagLabel = altroText || 'Altro';
  } else {
    tipoPagLabel = tipoPag.charAt(0).toUpperCase() + tipoPag.slice(1);
  }

  let luogo = '';
  let euroLitro = null;
  let numLitri = null;
  let km = null;

  if (tipologia === 'spesa') {
    const luogoSel = document.getElementById('luogo-spesa').value;
    const luogoAltro = document.getElementById('luogo-altro').value.trim();
    luogo = luogoSel === 'altro' ? (luogoAltro || 'Altro') : luogoSel;
  } else if (tipologia === 'rifornimento') {
    euroLitro = parseFloat(document.getElementById('euro-litro').value) || null;
    numLitri = parseFloat(document.getElementById('num-litri').value) || null;
    km = document.getElementById('km-percorsi').value.trim();
  }

  const tipologiaLabel = tipologia === 'spesa' ? 'Spesa' : tipologia === 'rifornimento' ? 'Rifornimento' : 'Spesa Generale';

  if (spesaInModifica !== null) {
    const idx = spese.findIndex(s => s.id === spesaInModifica);
    if (idx !== -1) {
      spese[idx] = { ...spese[idx], data, importo, tipoPagamento: tipoPagLabel, tipologia: tipologiaLabel, luogo, euroLitro, numLitri, km, descrizione, foto: [...fotoTemporanee] };
    }
    spesaInModifica = null;
    document.getElementById('btn-aggiungi').textContent = '➕ Aggiungi Spesa';
    document.getElementById('btn-annulla-modifica').classList.add('hidden');
  } else {
    spese.push({ id: Date.now(), data, importo, tipoPagamento: tipoPagLabel, tipologia: tipologiaLabel, luogo, euroLitro, numLitri, km, descrizione, foto: [...fotoTemporanee] });
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

  const tipoPagBase = s.tipoPagamento.toLowerCase().startsWith('bancomat') ? 'bancomat' : s.tipoPagamento.toLowerCase();
  const selectPag = document.getElementById('tipo-pagamento');
  const opzioniPag = Array.from(selectPag.options).map(o => o.value);
  selectPag.value = opzioniPag.includes(tipoPagBase) ? tipoPagBase : 'altro';
  onTipoPagamentoChange();

  let tipVal = 'generale';
  if (s.tipologia === 'Spesa') tipVal = 'spesa';
  else if (s.tipologia === 'Rifornimento') tipVal = 'rifornimento';
  document.getElementById('tipologia').value = tipVal;
  onTipologiaChange();

  if (tipVal === 'spesa' && s.luogo) {
    const sel = document.getElementById('luogo-spesa');
    const opzioni = Array.from(sel.options).map(o => o.value);
    if (opzioni.includes(s.luogo)) {
      sel.value = s.luogo;
    } else {
      sel.value = 'altro';
      document.getElementById('luogo-altro').value = s.luogo;
      document.getElementById('luogo-altro-div').classList.remove('hidden');
    }
  }

  if (tipVal === 'rifornimento') {
    if (s.euroLitro) document.getElementById('euro-litro').value = s.euroLitro;
    if (s.numLitri) document.getElementById('num-litri').value = s.numLitri;
    if (s.km) document.getElementById('km-percorsi').value = s.km;
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
  document.getElementById('importo').value = '';
  document.getElementById('descrizione').value = '';
  document.getElementById('tipo-pagamento').value = 'bancomat';
  document.getElementById('tipologia').value = 'generale';
  document.getElementById('luogo-spesa').value = 'Eurospin';
  document.getElementById('luogo-altro').value = '';
  document.getElementById('luogo-altro-div').classList.add('hidden');
  document.getElementById('euro-litro').value = '';
  document.getElementById('num-litri').value = '';
  document.getElementById('km-percorsi').value = '';
  onTipoPagamentoChange();
  onTipologiaChange();
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

function creaCardSpesa(s) {
  const card = document.createElement('div');
  card.className = 'spesa-card';

  let extraInfo = '';
  if (s.tipologia === 'Spesa' && s.luogo) extraInfo += `<span>🏪 ${s.luogo}</span>`;
  if (s.tipologia === 'Rifornimento') {
    if (s.euroLitro) extraInfo += `<span>⛽ €${s.euroLitro}/L</span>`;
    if (s.numLitri) extraInfo += `<span>🔢 ${s.numLitri}L</span>`;
    if (s.km) extraInfo += `<span>🛣️ ${s.km} km</span>`;
  }

  card.innerHTML = `
    <div class="card-azioni">
      <button class="btn-modifica" onclick="modificaSpesa(${s.id})">✏️</button>
      <button class="btn-elimina" onclick="eliminaSpesa(${s.id})">🗑️</button>
    </div>
    <div class="importo-badge">€ ${s.importo.toFixed(2)}</div>
    <div class="meta">
      <span>📅 ${formatData(s.data)}</span>
      <span>💳 ${s.tipoPagamento}</span>
      <span>🏷️ ${s.tipologia}</span>
      ${extraInfo}
    </div>
    ${s.descrizione ? `<div class="desc">📝 ${s.descrizione}</div>` : ''}
    ${s.foto && s.foto.length > 0 ? `<div class="foto-row">${s.foto.map(f =>
      `<img src="${f}" onclick="apriModal('${encodeURIComponent(f)}')" />`
    ).join('')}</div>` : ''}
  `;
  return card;
}

// ─── Riepilogo ───────────────────────────────────────────
function renderRiepilogo() {
  const totali = {};
  let totaleGen = 0;
  spese.forEach(s => {
    totali[s.tipoPagamento] = (totali[s.tipoPagamento] || 0) + s.importo;
    totaleGen += s.importo;
  });
  const content = document.getElementById('riepilogo-content');
  content.innerHTML = '';
  Object.entries(totali).forEach(([tipo, tot]) => {
    const row = document.createElement('div');
    row.className = 'riepilogo-row';
    row.innerHTML = `<span>${tipo}</span><span>€ ${tot.toFixed(2)}</span>`;
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
