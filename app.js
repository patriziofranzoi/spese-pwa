// ─── State ───────────────────────────────────────────────
let spese = [];
let fotoTemporanee = [];

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  impostaDataOggi();
  caricaDati();
  renderLista();
  onTipologiaChange();
  onTipoPagamentoChange();
  document.getElementById('app-version').textContent = APP_VERSION + ' - ' + APP_VERSION_DATE;
  registraServiceWorker();
});

function impostaDataOggi() {
  const oggi = new Date().toISOString().split('T')[0];
  document.getElementById('data-spesa').value = oggi;
  document.getElementById('data-display').textContent = formatData(oggi);
}

function formatData(d) {
  if (!d) return '';
  const [y, m, g] = d.split('-');
  return `${g}/${m}/${y}`;
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
  // Ricalcola litri se siamo su rifornimento
  if (val === 'rifornimento') calcolaLitri();
}

function calcolaLitri() {
  const totale = parseFloat(document.getElementById('importo').value);
  const euroL = parseFloat(document.getElementById('euro-litro').value);
  if (!isNaN(totale) && !isNaN(euroL) && euroL > 0) {
    const litri = totale / euroL;
    document.getElementById('num-litri').value = litri.toFixed(2);
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

// ─── Aggiungi Spesa ──────────────────────────────────────
function aggiungiSpesa() {
  const data = document.getElementById('data-spesa').value;
  const importo = parseFloat(document.getElementById('importo').value);
  const tipoPag = document.getElementById('tipo-pagamento').value;
  const tipologia = document.getElementById('tipologia').value;
  const descrizione = document.getElementById('descrizione').value.trim();

  if (!data) { alert('Inserisci una data.'); return; }
  if (isNaN(importo) || importo <= 0) { alert('Inserisci un importo valido.'); return; }

  // Tipo pagamento label
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

  // Dati extra per tipologia
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

  const spesa = {
    id: Date.now(),
    data,
    importo,
    tipoPagamento: tipoPagLabel,
    tipologia: tipologia === 'spesa' ? 'Spesa' : tipologia === 'rifornimento' ? 'Rifornimento' : 'Spesa Generale',
    luogo,
    euroLitro,
    numLitri,
    km,
    descrizione,
    foto: [...fotoTemporanee]
  };

  spese.push(spesa);
  salvaDati();
  renderLista();
  resetForm();
}

function resetForm() {
  document.getElementById('importo').value = '';
  document.getElementById('descrizione').value = '';
  document.getElementById('tipo-pagamento').value = 'bancomat';
  document.getElementById('tipologia').value = 'generale';
  document.getElementById('luogo-spesa').value = 'Eurospin';
  document.getElementById('luogo-altro').value = '';
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
  salvaDati();
  renderLista();
}

// ─── Render Lista ────────────────────────────────────────
function renderLista() {
  const container = document.getElementById('lista-spese');
  container.innerHTML = '';

  if (spese.length === 0) {
    container.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa aggiunta.</p>';
    document.getElementById('riepilogo').style.display = 'none';
    document.getElementById('azioni-export').style.display = 'none';
    return;
  }

  document.getElementById('riepilogo').style.display = '';
  document.getElementById('azioni-export').style.display = '';

  const sorted = [...spese].sort((a, b) => b.id - a.id);
  sorted.forEach(s => {
    const card = document.createElement('div');
    card.className = 'spesa-card';

    let extraInfo = '';
    if (s.tipologia === 'Spesa' && s.luogo) {
      extraInfo += `<span>🏪 ${s.luogo}</span>`;
    }
    if (s.tipologia === 'Rifornimento') {
      if (s.euroLitro) extraInfo += `<span>⛽ €${s.euroLitro}/L</span>`;
      if (s.numLitri) extraInfo += `<span>🔢 ${s.numLitri}L</span>`;
      if (s.km) extraInfo += `<span>🛣️ ${s.km} km</span>`;
    }

    card.innerHTML = `
      <button class="btn-elimina" onclick="eliminaSpesa(${s.id})">🗑️</button>
      <div class="importo-badge">€ ${s.importo.toFixed(2)}</div>
      <div class="meta">
        <span>📅 ${formatData(s.data)}</span>
        <span>💳 ${s.tipoPagamento}</span>
        <span>🏷️ ${s.tipologia}</span>
        ${extraInfo}
      </div>
      ${s.descrizione ? `<div class="desc">📝 ${s.descrizione}</div>` : ''}
      ${s.foto.length > 0 ? `<div class="foto-row">${s.foto.map(f =>
        `<img src="${f}" onclick="apriModal('${encodeURIComponent(f)}')" />`
      ).join('')}</div>` : ''}
    `;
    container.appendChild(card);
  });

  renderRiepilogo();
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

// ─── Export PDF ──────────────────────────────────────────
function scaricaPDF() {
  const dataOggi = formatData(new Date().toISOString().split('T')[0]);
  let contenuto = `RIEPILOGO SPESE - ${dataOggi}\n`;
  contenuto += '═'.repeat(40) + '\n\n';

  const sorted = [...spese].sort((a, b) => new Date(a.data) - new Date(b.data));
  sorted.forEach((s, i) => {
    contenuto += `${i + 1}. ${s.tipologia} — € ${s.importo.toFixed(2)}\n`;
    contenuto += `   📅 ${formatData(s.data)}  |  💳 ${s.tipoPagamento}\n`;
    if (s.luogo) contenuto += `   🏪 ${s.luogo}\n`;
    if (s.tipologia === 'Rifornimento') {
      if (s.euroLitro) contenuto += `   ⛽ €${s.euroLitro}/L`;
      if (s.numLitri) contenuto += `  🔢 ${s.numLitri}L`;
      if (s.km) contenuto += `  🛣️ ${s.km} km`;
      if (s.euroLitro || s.numLitri || s.km) contenuto += '\n';
    }
    if (s.descrizione) contenuto += `   📝 ${s.descrizione}\n`;
    contenuto += '\n';
  });

  const totaleGen = spese.reduce((acc, s) => acc + s.importo, 0);
  contenuto += '─'.repeat(40) + '\n';
  contenuto += `TOTALE: € ${totaleGen.toFixed(2)}\n`;

  // Usa la Print API per generare PDF
  const win = window.open('', '_blank');
  win.document.write(`
    <html>
    <head>
      <title>Spese ${dataOggi}</title>
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
      </style>
    </head>
    <body>
      <h1>💶 Riepilogo Spese — ${dataOggi}</h1>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipologia</th>
            <th>Luogo/Info</th>
            <th>Pagamento</th>
            <th>Importo</th>
          </tr>
        </thead>
        <tbody>
          ${[...spese].sort((a, b) => new Date(a.data) - new Date(b.data)).map(s => `
            <tr>
              <td>${formatData(s.data)}</td>
              <td>${s.tipologia}</td>
              <td>
                ${s.luogo || ''}
                ${s.tipologia === 'Rifornimento' ? `<br><span class="extra">${s.euroLitro ? '⛽ €' + s.euroLitro + '/L' : ''} ${s.numLitri ? s.numLitri + 'L' : ''} ${s.km ? '🛣️ ' + s.km + ' km' : ''}</span>` : ''}
                ${s.descrizione ? `<br><span class="extra">📝 ${s.descrizione}</span>` : ''}
              </td>
              <td>${s.tipoPagamento}</td>
              <td><strong>€ ${s.importo.toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="totale">TOTALE: € ${spese.reduce((a, s) => a + s.importo, 0).toFixed(2)}</div>
      <br>
      <button onclick="window.print()">🖨️ Stampa / Salva PDF</button>
    </body>
    </html>
  `);
  win.document.close();
}

// ─── Condividi ───────────────────────────────────────────
async function condividi() {
  const dataOggi = formatData(new Date().toISOString().split('T')[0]);
  const totaleGen = spese.reduce((acc, s) => acc + s.importo, 0);

  let testo = `💶 *Spese del ${dataOggi}*\n\n`;
  const sorted = [...spese].sort((a, b) => new Date(a.data) - new Date(b.data));
  sorted.forEach((s, i) => {
    testo += `${i + 1}. ${s.tipologia} — *€ ${s.importo.toFixed(2)}*\n`;
    testo += `   💳 ${s.tipoPagamento}`;
    if (s.luogo) testo += `  |  🏪 ${s.luogo}`;
    if (s.tipologia === 'Rifornimento') {
      if (s.euroLitro) testo += `\n   ⛽ €${s.euroLitro}/L`;
      if (s.numLitri) testo += `  🔢 ${s.numLitri}L`;
      if (s.km) testo += `  🛣️ ${s.km} km`;
    }
    if (s.descrizione) testo += `\n   📝 ${s.descrizione}`;
    testo += '\n\n';
  });
  testo += `─────────────────\n`;
  testo += `💰 *TOTALE: € ${totaleGen.toFixed(2)}*`;

  if (navigator.share) {
    try {
      await navigator.share({ title: `Spese ${dataOggi}`, text: testo });
    } catch (e) {
      copiaNeglAppunti(testo);
    }
  } else {
    copiaNeglAppunti(testo);
  }
}

function copiaNeglAppunti(testo) {
  navigator.clipboard.writeText(testo).then(() => {
    alert('📋 Testo copiato! Incollalo dove vuoi (Telegram, WhatsApp...)');
  }).catch(() => {
    prompt('Copia questo testo:', testo);
  });
}

// ─── Salvataggio Locale ──────────────────────────────────
function salvaDati() {
  try {
    localStorage.setItem('spese_pwa', JSON.stringify(spese));
  } catch(e) {
    alert('Errore nel salvataggio: potrebbe essere necessario liberare spazio.');
  }
}

function caricaDati() {
  const raw = localStorage.getItem('spese_pwa');
  if (raw) spese = JSON.parse(raw);
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
  const modal = document.getElementById('foto-modal');
  if (modal) modal.classList.remove('show');
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
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

function applyUpdate() {
  if (pendingRegistration && pendingRegistration.waiting) {
    pendingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}
