
// ─── State ───────────────────────────────────────────────
let spese = [];
let fotoTemporanee = []; // array di dataURL

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  impostaDataOggi();
  caricaDati();
  renderLista();
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

// ─── Foto ────────────────────────────────────────────────
function scattaFoto() {
  const input = document.getElementById('foto-input');
  input.setAttribute('capture', 'environment');
  input.click();
}

function selezionaGalleria() {
  const input = document.getElementById('foto-input');
  input.removeAttribute('capture');
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

  const spesa = {
    id: Date.now(),
    data,
    importo,
    tipoPagamento: tipoPagLabel,
    tipologia: tipologia.charAt(0).toUpperCase() + tipologia.slice(1),
    descrizione,
    foto: [...fotoTemporanee]
  };

  spese.push(spesa);
  salvaDati();
  renderLista();

  // Reset form
  document.getElementById('importo').value = '';
  document.getElementById('descrizione').value = '';
  document.getElementById('tipo-pagamento').value = 'contanti';
  onTipoPagamentoChange();
  fotoTemporanee = [];
  renderFotoPreview();
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
    return;
  }

  document.getElementById('riepilogo').style.display = '';

  const sorted = [...spese].sort((a, b) => b.id - a.id);
  sorted.forEach(s => {
    const card = document.createElement('div');
    card.className = 'spesa-card';
    card.innerHTML = `
      <button class="btn-elimina" onclick="eliminaSpesa(${s.id})">🗑️</button>
      <div class="importo-badge">€ ${s.importo.toFixed(2)}</div>
      <div class="meta">
        <span>📅 ${formatData(s.data)}</span>
        <span>💳 ${s.tipoPagamento}</span>
        <span>🏷️ ${s.tipologia}</span>
      </div>
      ${s.descrizione ? `<div class="desc">📝 ${s.descrizione}</div>` : ''}
      ${s.foto.length > 0 ? `<div class="foto-row">${s.foto.map((f, i) =>
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

// ─── Service Worker & Aggiornamenti ─────────────────────
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
      // Controlla aggiornamenti ogni 60 secondi
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
