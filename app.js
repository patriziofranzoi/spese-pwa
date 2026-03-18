// ═══════════════════════════════════════════════════════
// GESTIONE SPESE - app.js
// ═══════════════════════════════════════════════════════

// ─── Icone SVG pagamento ─────────────────────────────
const ICONE_PAG = {
  bancomat: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/><line x1="1" y1="10" x2="23" y2="10" stroke="#1b5e20" stroke-width="2.5"/></svg>`,
  contanti: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#fdd835"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#5d4037">€</text></svg>`,
  bonifico: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="13" rx="2" fill="#e3f2fd"/><path d="M8 21h8M12 16v5M7 8h.01M7 12h10"/></svg>`,
  hype:     `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#1565c0"/><text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="bold" fill="white">H</text></svg>`,
  satispay: `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#e53935"/><text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="bold" fill="white">S</text></svg>`,
  pagopa:   `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="11" fill="#0046ad"/><text x="12" y="16" text-anchor="middle" font-size="8.5" font-weight="bold" fill="white">PA</text></svg>`,
  f24:      `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><rect x="2" y="2" width="20" height="20" rx="4" fill="#e65100"/><text x="12" y="16" text-anchor="middle" font-size="8.5" font-weight="bold" fill="white">F24</text></svg>`,
  altro:    `<svg width="15" height="15" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px" fill="none" stroke="#757575" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
};

function iconaPag(tip) {
  const p = (tip||'').toLowerCase();
  if (p.includes('bancomat')) return ICONE_PAG.bancomat;
  if (p.includes('contanti')) return ICONE_PAG.contanti;
  if (p.includes('bonifico')) return ICONE_PAG.bonifico;
  if (p.includes('hype'))     return ICONE_PAG.hype;
  if (p.includes('satispay')) return ICONE_PAG.satispay;
  if (p.includes('pagopa'))   return ICONE_PAG.pagopa;
  if (p.includes('f24'))      return ICONE_PAG.f24;
  return ICONE_PAG.altro;
}

// ─── Tipologie sistema ───────────────────────────────
const TIP_SISTEMA = [
  { v:'ads',          l:'📣 ADS' },
  { v:'benzinaio',    l:'⛽ Benzinaio' },
  { v:'casa',         l:'🏠 Casa' },
  { v:'farmacia',     l:'💊 Farmacia' },
  { v:'generale',     l:'📦 Generale' },
  { v:'personali',    l:'👤 Personali' },
  { v:'professionali',l:'💼 Professionali' },
  { v:'ristorante',   l:'🍽️ Ristorante' },
  { v:'spesa',        l:'🛒 Spesa' },
];

// ─── State ───────────────────────────────────────────
let spese = [];
let fotoTemporanee = [];
let inArchivio = false;
let dataArchivio = null;
let idInModifica = null;

// ─── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setDataOggi();
  caricaOggi();
  buildTipologie('spesa');
  onTipChange();
  onPagChange();
  const av = document.getElementById('app-version');
  if (av) av.textContent = (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '') +
                            (typeof APP_VERSION_DATE !== 'undefined' ? ' - ' + APP_VERSION_DATE : '');
  swInit();
  checkVersioneNuova();
  window.addEventListener('beforeunload', salvaOggi);
});

// ─── DATA ────────────────────────────────────────────
function oggi() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

function setDataOggi() {
  const d = oggi();
  const el = document.getElementById('data-spesa');
  if (el) el.value = d;
  const dd = document.getElementById('data-display');
  if (dd) dd.textContent = fmtData(d);
}

function fmtData(d) {
  if (!d) return '';
  const p = d.split('-');
  if (p.length !== 3) return d;
  return p[2]+'/'+p[1]+'/'+p[0];
}

// ─── STORAGE ─────────────────────────────────────────
function kData(d) { return 'spese_'+d; }

function caricaOggi() {
  spese = JSON.parse(localStorage.getItem(kData(oggi()))||'[]');
  renderLista();
}

function salvaOggi() {
  try {
    localStorage.setItem(kData(oggi()), JSON.stringify(spese));
  } catch(e) {
    const ss = spese.map(s=>({...s, foto:[]}));
    try { localStorage.setItem(kData(oggi()), JSON.stringify(ss)); } catch(e2) {}
  }
}

function tutteDate() {
  const arr = [];
  for (let i=0; i<localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('spese_')) continue;
    const d = k.replace('spese_','');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const a = JSON.parse(localStorage.getItem(k)||'[]');
    if (a.length > 0) arr.push(d);
  }
  return arr.sort((a,b)=>b.localeCompare(a));
}

// ─── PAGAMENTO ───────────────────────────────────────
function onPagChange() {
  const v = document.getElementById('tipo-pagamento').value;
  document.getElementById('bancomat-sub').classList.toggle('hidden', v!=='bancomat');
  document.getElementById('altro-pag-div').classList.toggle('hidden', v!=='altro');
}

// ─── TIPOLOGIE ───────────────────────────────────────
function getTipCustom() {
  const r = localStorage.getItem('tipologie_custom');
  if (r) return JSON.parse(r);
  return [
    {v:'amazon', l:'🛍️ Amazon'},
    {v:'misto',  l:'🔀 Misto'},
    {v:'altro',  l:'✏️ Altro'},
  ];
}
function saveTipCustom(a) { localStorage.setItem('tipologie_custom', JSON.stringify(a)); }
function tutteTip() { return [...TIP_SISTEMA, ...getTipCustom()]; }

function buildTipologie(sel) {
  const el = document.getElementById('tipologia');
  if (!el) return;
  const cur = sel !== undefined ? sel : (el.value || 'spesa');
  el.innerHTML = '';
  tutteTip().forEach(t => {
    const o = document.createElement('option');
    o.value = t.v; o.textContent = t.l;
    if (t.v === cur) o.selected = true;
    el.appendChild(o);
  });
  onTipChange();
}

function onTipChange() {
  const v = document.getElementById('tipologia').value;
  document.getElementById('sez-spesa').classList.toggle('hidden', v!=='spesa');
  const benz = v==='benzinaio'||v==='rifornimento';
  document.getElementById('sez-benz').classList.toggle('hidden', !benz);
  if (benz) calcConsumi();
}

// ─── IMPOSTAZIONI ────────────────────────────────────
function apriImpostazioni() {
  document.getElementById('schermata-principale').classList.add('hidden');
  document.getElementById('schermata-impostazioni').classList.remove('hidden');
  renderTipLista();
}
function chiudiImpostazioni() {
  document.getElementById('schermata-impostazioni').classList.add('hidden');
  document.getElementById('schermata-principale').classList.remove('hidden');
  buildTipologie();
}
function renderTipLista() {
  const c = document.getElementById('tip-lista');
  if (!c) return;
  c.innerHTML = '';
  TIP_SISTEMA.forEach(t => {
    const r = document.createElement('div'); r.className='tip-row tip-sistema';
    r.innerHTML=`<span class="tip-label">${t.l}</span><span class="tip-badge-sistema">Sistema</span>`;
    c.appendChild(r);
  });
  const sep = document.createElement('div'); sep.className='tip-separatore';
  sep.textContent='Tipologie personali'; c.appendChild(sep);
  getTipCustom().forEach((t,i) => {
    const r = document.createElement('div'); r.className='tip-row';
    r.innerHTML=`<input type="text" class="tip-input" value="${t.l}" onchange="rinTip(${i},this.value)"/>
      <button class="tip-btn-del" onclick="delTip(${i})">🗑️</button>`;
    c.appendChild(r);
  });
}
function addTip() {
  const inp = document.getElementById('nuova-tip-input');
  const l = inp.value.trim(); if(!l){alert('Inserisci un nome.');return;}
  const a = getTipCustom(); a.push({v:'custom_'+Date.now(), l});
  saveTipCustom(a); inp.value=''; renderTipLista();
}
function rinTip(i,v) {
  if(!v.trim()) return;
  const a=getTipCustom(); a[i].l=v.trim(); saveTipCustom(a);
}
function delTip(i) {
  const a=getTipCustom();
  if(!confirm(`Eliminare "${a[i].l}"?`)) return;
  a.splice(i,1); saveTipCustom(a); renderTipLista();
}

// ─── INPUT IMPORTO (virgola auto) ────────────────────
function onImpInput(el) {
  let v = el.value.replace(/\D/g,'');
  if (!v) { el.value=''; calcConsumi(); return; }
  v = v.padStart(3,'0');
  el.value = parseInt(v.slice(0,-2),10)+','+v.slice(-2);
  calcConsumi();
}
function getImp() {
  return parseFloat((document.getElementById('importo').value||'').replace(',','.'))||0;
}

// ─── INPUT COMMISSIONI (virgola auto) ────────────────
function onCommInput(el) {
  let v = el.value.replace(/\D/g,'');
  if (!v) { el.value=''; return; }
  v = v.padStart(3,'0');
  el.value = parseInt(v.slice(0,-2),10)+','+v.slice(-2);
}
function getComm() {
  const el = document.getElementById('commissioni');
  if (!el||!el.value.trim()) return 0;
  return parseFloat(el.value.replace(',','.'))||0;
}

// ─── INPUT €/LITRO (virgola auto 3 dec) ──────────────
function onELInput(el) {
  let v = el.value.replace(/\D/g,'');
  if (!v) { el.value=''; calcConsumi(); return; }
  v = v.padStart(4,'0');
  el.value = parseInt(v.slice(0,-3),10)+','+v.slice(-3);
  calcConsumi();
}
function getEL() {
  const el = document.getElementById('euro-litro');
  return parseFloat((el?el.value:'0').replace(',','.'))||0;
}

// ─── CALCOLO CONSUMI BENZINAIO ────────────────────────
function calcConsumi() {
  const tot = getImp(), el = getEL();
  const km = parseFloat((document.getElementById('km-percorsi')||{value:''}).value)||0;
  const set = (id,v) => { const e=document.getElementById(id); if(e) e.value=v; };
  if (tot>0 && el>0) {
    const lit = tot/el;
    set('num-litri', lit.toFixed(2));
    if (km>0) { set('euro-km',(tot/km).toFixed(3)); set('km-litro',(km/lit).toFixed(2)); }
    else { set('euro-km',''); set('km-litro',''); }
  } else { set('num-litri',''); set('euro-km',''); set('km-litro',''); }
}

// ─── FOTO ────────────────────────────────────────────
function scattaFoto()    { const e=document.getElementById('foto-cam'); if(e) e.click(); }
function apriGalleria()  { const e=document.getElementById('foto-gal'); if(e) e.click(); }

function onFotoSel(event) {
  for (const f of event.target.files) {
    comprimi(f).then(d=>{ fotoTemporanee.push(d); renderFotoPreview(); })
               .catch(()=>alert('Errore caricamento foto.'));
  }
  event.target.value='';
}

function comprimi(file) {
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onerror=rej;
    r.onload=e=>{
      const img=new Image();
      img.onerror=rej;
      img.onload=()=>{
        const MAX=800; let w=img.width, h=img.height;
        if(w>h&&w>MAX){h=Math.round(h*MAX/w);w=MAX;}
        else if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
        const cv=document.createElement('canvas');
        cv.width=w; cv.height=h;
        cv.getContext('2d').drawImage(img,0,0,w,h);
        res(cv.toDataURL('image/jpeg',0.7));
      };
      img.src=e.target.result;
    };
    r.readAsDataURL(file);
  });
}

function renderFotoPreview() {
  const c=document.getElementById('foto-preview'); if(!c) return;
  c.innerHTML='';
  fotoTemporanee.forEach((src,i)=>{
    const w=document.createElement('div'); w.className='foto-thumb-wrap';
    const im=document.createElement('img'); im.src=src;
    const b=document.createElement('button'); b.className='del-foto'; b.textContent='✕';
    b.onclick=()=>{ fotoTemporanee.splice(i,1); renderFotoPreview(); };
    w.appendChild(im); w.appendChild(b); c.appendChild(w);
  });
}

// ─── AGGIUNGI / MODIFICA SPESA ────────────────────────
function aggiungiSpesa() {
  const data = document.getElementById('data-spesa').value;
  const imp  = getImp();
  const comm = getComm();
  const pag  = document.getElementById('tipo-pagamento').value;
  const tip  = document.getElementById('tipologia').value;
  const desc = document.getElementById('descrizione').value.trim();

  if (!data)         { alert('Inserisci una data.'); return; }
  if (imp <= 0)      { alert('Inserisci un importo valido.'); return; }

  // Label pagamento
  let pagLabel;
  if (pag==='bancomat') {
    const sub = document.querySelector('input[name="bancomat-tipo"]:checked');
    const sv  = sub ? sub.value : 'mio';
    const si  = sv==='mio'?'👤':sv==='condiviso'?'👥':'👨';
    pagLabel  = `Bancomat ${si} ${sv.charAt(0).toUpperCase()+sv.slice(1)}`;
  } else if (pag==='altro') {
    pagLabel = document.getElementById('altro-pag-txt').value.trim()||'Altro';
  } else {
    const nm = {contanti:'Contanti',bonifico:'Bonifico',hype:'Hype',satispay:'Satispay',pagopa:'PagoPa',f24:'F24'};
    pagLabel = nm[pag]||(pag.charAt(0).toUpperCase()+pag.slice(1));
  }

  // Dati tipologia
  let luogo='',el=null,lit=null,km=null,ekm=null,kl=null;
  if (tip==='spesa') {
    const ls = document.getElementById('luogo-spesa').value;
    luogo = ls==='altro'?(document.getElementById('luogo-altro').value.trim()||'Altro'):ls;
  } else if (tip==='benzinaio'||tip==='rifornimento') {
    el  = getEL()||null;
    lit = parseFloat((document.getElementById('num-litri')||{value:''}).value)||null;
    km  = (document.getElementById('km-percorsi')||{value:''}).value.trim()||null;
    ekm = parseFloat((document.getElementById('euro-km')||{value:''}).value)||null;
    kl  = parseFloat((document.getElementById('km-litro')||{value:''}).value)||null;
  }

  const tt = tutteTip().find(t=>t.v===tip);
  const tipLabel = tt ? tt.l : tip;

  const obj = {
    id: Date.now(), data, importo:imp,
    commissioni: comm>0?comm:null,
    pagamento: pagLabel, tipV: tip, tipologia: tipLabel,
    luogo, euroLitro:el, litri:lit, km, euroKm:ekm, kmLitro:kl,
    descrizione:desc, foto:[...fotoTemporanee]
  };

  if (idInModifica !== null) {
    const idx = spese.findIndex(s=>s.id===idInModifica);
    if (idx!==-1) spese[idx] = {...obj, id:spese[idx].id};
    idInModifica = null;
    document.getElementById('btn-aggiungi').textContent = '➕ Aggiungi Spesa';
    document.getElementById('btn-annulla').classList.add('hidden');
  } else {
    spese.push(obj);
  }

  if (inArchivio && dataArchivio) {
    localStorage.setItem(kData(dataArchivio), JSON.stringify(spese));
    renderDettaglio(dataArchivio);
  } else { salvaOggi(); renderLista(); }
  resetForm();
}

function modificaSpesa(id) {
  const s = spese.find(s=>s.id===id); if(!s) return;
  idInModifica = id;

  document.getElementById('data-spesa').value    = s.data;
  document.getElementById('importo').value        = s.importo.toFixed(2).replace('.',',');
  document.getElementById('descrizione').value    = s.descrizione||'';
  const ce = document.getElementById('commissioni');
  if (ce) ce.value = s.commissioni ? s.commissioni.toFixed(2).replace('.',',') : '';

  // Pagamento
  const pl = s.pagamento.toLowerCase();
  let pb='altro';
  if(pl.includes('bancomat')) pb='bancomat';
  else if(pl.includes('bonifico')) pb='bonifico';
  else if(pl.includes('contanti')) pb='contanti';
  else if(pl.includes('satispay')) pb='satispay';
  else if(pl.includes('hype'))     pb='hype';
  else if(pl.includes('pagopa'))   pb='pagopa';
  else if(pl.includes('f24'))      pb='f24';
  const sp = document.getElementById('tipo-pagamento');
  sp.value = Array.from(sp.options).map(o=>o.value).includes(pb)?pb:'altro';
  if(pb==='bancomat'){
    const sv=pl.includes('condiviso')?'condiviso':pl.includes('pap')?'papà':'mio';
    const rr=document.querySelector(`input[name="bancomat-tipo"][value="${sv}"]`);
    if(rr) rr.checked=true;
  }
  onPagChange();

  // Tipologia
  const tv = s.tipV || (tutteTip().find(t=>t.l===s.tipologia)||{}).v || 'spesa';
  buildTipologie(tv);

  if (tv==='spesa'&&s.luogo) {
    const sl=document.getElementById('luogo-spesa');
    if(sl){ if(Array.from(sl.options).map(o=>o.value).includes(s.luogo)){sl.value=s.luogo;}
            else{sl.value='altro';document.getElementById('luogo-altro').value=s.luogo;document.getElementById('luogo-altro-div').classList.remove('hidden');}}
  }
  if (tv==='benzinaio'||tv==='rifornimento') {
    const sf=(id,v)=>{const e=document.getElementById(id);if(e&&v)e.value=String(v).replace('.',',');};
    const sn=(id,v)=>{const e=document.getElementById(id);if(e&&v)e.value=v;};
    sf('euro-litro',s.euroLitro); sn('num-litri',s.litri);
    sn('km-percorsi',s.km); sn('euro-km',s.euroKm); sn('km-litro',s.kmLitro);
  }

  fotoTemporanee=[...(s.foto||[])]; renderFotoPreview();
  document.getElementById('btn-aggiungi').textContent='💾 Salva Modifiche';
  document.getElementById('btn-annulla').classList.remove('hidden');
  document.getElementById('form-section').scrollIntoView({behavior:'smooth'});
}

function annullaModifica() {
  idInModifica=null;
  document.getElementById('btn-aggiungi').textContent='➕ Aggiungi Spesa';
  document.getElementById('btn-annulla').classList.add('hidden');
  resetForm();
}

function resetForm() {
  document.getElementById('importo').value='';
  document.getElementById('descrizione').value='';
  document.getElementById('tipo-pagamento').value='bancomat';
  document.getElementById('luogo-spesa').value='Aldì';
  document.getElementById('luogo-altro').value='';
  document.getElementById('luogo-altro-div').classList.add('hidden');
  const cl=id=>{const e=document.getElementById(id);if(e)e.value='';};
  cl('commissioni');cl('euro-litro');cl('num-litri');cl('km-percorsi');cl('euro-km');cl('km-litro');
  onPagChange();
  buildTipologie('spesa');
  fotoTemporanee=[]; renderFotoPreview();
  setDataOggi();
}

// ─── ELIMINA ─────────────────────────────────────────
function eliminaSpesa(id) {
  if(!confirm('Eliminare questa spesa?')) return;
  spese=spese.filter(s=>s.id!==id);
  if(inArchivio&&dataArchivio){
    localStorage.setItem(kData(dataArchivio),JSON.stringify(spese));
    renderDettaglio(dataArchivio);
  } else { salvaOggi(); renderLista(); }
}

// ─── RENDER LISTA ────────────────────────────────────
function renderLista() {
  const c=document.getElementById('lista-spese'); if(!c) return;
  c.innerHTML='';
  const riem=document.getElementById('riepilogo');
  const aex=document.getElementById('azioni-export');
  if(!spese.length){
    c.innerHTML='<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa aggiunta oggi.</p>';
    if(riem) riem.style.display='none';
    if(aex)  aex.style.display='none';
    return;
  }
  if(riem) riem.style.display='';
  if(aex)  aex.style.display='';
  [...spese].sort((a,b)=>b.id-a.id).forEach(s=>c.appendChild(cardSpesa(s)));
  renderRiepilogo();
}

function cardSpesa(s) {
  const card=document.createElement('div'); card.className='spesa-card';
  const isBenz = s.tipV==='benzinaio'||s.tipV==='rifornimento'||s.euroLitro;
  const isSpesa = s.tipV==='spesa';
  let extra='';
  if(isSpesa&&s.luogo) extra+=`<span>🏪 ${s.luogo}</span>`;
  if(isBenz){
    if(s.euroLitro) extra+=`<span>⛽ €${s.euroLitro}/L</span>`;
    if(s.litri)     extra+=`<span>🔢 ${s.litri}L</span>`;
    if(s.km)        extra+=`<span>🛣️ ${s.km}km</span>`;
    if(s.euroKm)    extra+=`<span>💶 €${s.euroKm}/km</span>`;
    if(s.kmLitro)   extra+=`<span>📊 ${s.kmLitro}km/L</span>`;
  }
  const cb = s.commissioni?`<span style="font-size:.75rem;color:#e65100;margin-left:6px">+€${s.commissioni.toFixed(2)} comm.</span>`:'';
  card.innerHTML=`
    <div class="card-azioni">
      <button class="btn-modifica" onclick="modificaSpesa(${s.id})">✏️</button>
      <button class="btn-elimina"  onclick="eliminaSpesa(${s.id})">🗑️</button>
    </div>
    <div class="importo-badge">€ ${s.importo.toFixed(2)}${cb}</div>
    <div class="meta">
      <span>📅 ${fmtData(s.data)}</span>
      <span>${iconaPag(s.pagamento)}${s.pagamento}</span>
      <span>🏷️ ${s.tipologia}</span>
      ${extra}
    </div>
    ${s.descrizione?`<div class="desc">📝 ${s.descrizione}</div>`:''}
    ${s.foto&&s.foto.length?`<div class="foto-row">${s.foto.map(f=>`<img src="${f}" onclick="apriModal('${encodeURIComponent(f)}')" />`).join('')}</div>`:''}`;
  return card;
}

function renderRiepilogo() {
  const tot={};let gen=0;
  spese.forEach(s=>{const t=s.importo+(s.commissioni||0);tot[s.pagamento]=(tot[s.pagamento]||0)+t;gen+=t;});
  const c=document.getElementById('riepilogo-content'); if(!c) return;
  c.innerHTML='';
  Object.entries(tot).forEach(([k,v])=>{
    const r=document.createElement('div');r.className='riepilogo-row';
    r.innerHTML=`<span>${iconaPag(k)}${k}</span><span>€ ${v.toFixed(2)}</span>`;
    c.appendChild(r);
  });
  const tg=document.getElementById('totale-generale');
  if(tg) tg.textContent=`Totale: € ${gen.toFixed(2)}`;
}

// ─── ARCHIVIO ────────────────────────────────────────
function apriArchivio() {
  inArchivio=true; dataArchivio=null;
  document.getElementById('schermata-principale').classList.add('hidden');
  document.getElementById('schermata-archivio').classList.remove('hidden');
  document.getElementById('arch-lista').classList.remove('hidden');
  document.getElementById('arch-dettaglio').classList.add('hidden');
  renderArchLista();
}
function chiudiArchivio() {
  inArchivio=false; dataArchivio=null;
  spese=JSON.parse(localStorage.getItem(kData(oggi()))||'[]');
  document.getElementById('schermata-principale').classList.remove('hidden');
  document.getElementById('schermata-archivio').classList.add('hidden');
  renderLista();
}
function renderArchLista() {
  const c=document.getElementById('arch-date-list'); if(!c) return;
  c.innerHTML='';
  const dd=tutteDate();
  if(!dd.length){c.innerHTML='<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa archiviata.</p>';return;}
  dd.forEach(d=>{
    const arr=JSON.parse(localStorage.getItem(kData(d))||'[]');
    const tot=arr.reduce((a,s)=>a+s.importo+(s.commissioni||0),0);
    const item=document.createElement('div'); item.className='archivio-item';
    item.innerHTML=`
      <div class="archivio-item-info" onclick="apriDettaglio('${d}')">
        <span class="archivio-data">📅 ${fmtData(d)}</span>
        <span class="archivio-voci">${arr.length} voci</span>
        <span class="archivio-totale">€ ${tot.toFixed(2)}</span>
      </div>
      <button class="btn-elimina-giorno" onclick="elimGiornata('${d}')">🗑️</button>`;
    c.appendChild(item);
  });
}
function apriDettaglio(d) {
  dataArchivio=d;
  spese=JSON.parse(localStorage.getItem(kData(d))||'[]');
  document.getElementById('arch-lista').classList.add('hidden');
  document.getElementById('arch-dettaglio').classList.remove('hidden');
  document.getElementById('arch-det-titolo').textContent=`📅 Spese del ${fmtData(d)}`;
  renderDettaglio(d);
}
function renderDettaglio(d) {
  const c=document.getElementById('arch-det-lista'); if(!c) return;
  c.innerHTML='';
  if(!spese.length){
    c.innerHTML='<p style="color:#aaa;text-align:center;padding:20px">Nessuna spesa.</p>';
    document.getElementById('arch-det-totale').textContent='Totale: € 0.00'; return;
  }
  [...spese].sort((a,b)=>b.id-a.id).forEach(s=>c.appendChild(cardSpesa(s)));
  const tot=spese.reduce((a,s)=>a+s.importo+(s.commissioni||0),0);
  document.getElementById('arch-det-totale').textContent=`Totale: € ${tot.toFixed(2)}`;
}
function tornaArch() {
  dataArchivio=null; spese=[];
  document.getElementById('arch-lista').classList.remove('hidden');
  document.getElementById('arch-dettaglio').classList.add('hidden');
  renderArchLista();
}
function elimGiornata(d) {
  if(!confirm(`Eliminare tutte le spese del ${fmtData(d)}?`)) return;
  localStorage.removeItem(kData(d)); renderArchLista();
}

// ─── MODAL FOTO ──────────────────────────────────────
function apriModal(enc) {
  const src=decodeURIComponent(enc);
  let m=document.getElementById('foto-modal');
  if(!m){m=document.createElement('div');m.id='foto-modal';
    m.innerHTML='<button onclick="chiudiModal()">✕</button><img id="modal-img"/>';
    document.body.appendChild(m);}
  document.getElementById('modal-img').src=src; m.classList.add('show');
}
function chiudiModal(){document.getElementById('foto-modal')?.classList.remove('show');}

// ─── INFO APP ────────────────────────────────────────
function apriInfo() {
  const el=document.getElementById('info-version');
  if(el) el.textContent=(typeof APP_VERSION!=='undefined'?APP_VERSION:'')+(typeof APP_VERSION_DATE!=='undefined'?' · '+APP_VERSION_DATE:'');
  document.getElementById('info-modal').classList.remove('hidden');
}
function chiudiInfo(){document.getElementById('info-modal').classList.add('hidden');}

// ─── PDF ─────────────────────────────────────────────
function scaricaPDF() {
  const lbl=inArchivio&&dataArchivio?fmtData(dataArchivio):fmtData(oggi());
  const win=window.open('','_blank');
  win.document.write(`<html><head><title>Spese ${lbl}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{color:#1976d2;margin-bottom:20px}
  table{width:100%;border-collapse:collapse}th{background:#1976d2;color:white;padding:8px 12px;text-align:left}
  td{padding:8px 12px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f5f9ff}
  .tot{font-size:1.1rem;font-weight:bold;color:#1976d2;text-align:right;margin-top:12px}
  .sm{font-size:.82rem;color:#888}@media print{button{display:none}}</style></head><body>
  <h1>💶 Spese — ${lbl}</h1>
  <table><thead><tr><th>Data</th><th>Tipologia</th><th>Info</th><th>Pagamento</th><th>Importo</th><th>Comm.</th></tr></thead><tbody>
  ${[...spese].sort((a,b)=>new Date(a.data)-new Date(b.data)).map(s=>{
    const iB=s.tipV==='benzinaio'||s.euroLitro;
    let inf=s.tipV==='spesa'&&s.luogo?s.luogo:'';
    if(iB){const p=[];if(s.euroLitro)p.push('€'+s.euroLitro+'/L');if(s.litri)p.push(s.litri+'L');if(s.km)p.push(s.km+'km');if(s.euroKm)p.push('€'+s.euroKm+'/km');if(s.kmLitro)p.push(s.kmLitro+'km/L');inf='<span class="sm">'+p.join(' · ')+'</span>';}
    if(s.descrizione) inf+=(inf?'<br>':'')+'<span class="sm">📝 '+s.descrizione+'</span>';
    return '<tr><td>'+fmtData(s.data)+'</td><td>'+s.tipologia+'</td><td>'+inf+'</td><td>'+s.pagamento+'</td><td><b>€'+s.importo.toFixed(2)+'</b></td><td>'+(s.commissioni?'€'+s.commissioni.toFixed(2):'')+'</td></tr>';
  }).join('')}
  </tbody></table>
  <div class="tot">TOTALE: € ${spese.reduce((a,s)=>a+s.importo+(s.commissioni||0),0).toFixed(2)}</div>
  <br><button onclick="window.print()">🖨️ Stampa</button></body></html>`);
  win.document.close();
}

// ─── CONDIVIDI ───────────────────────────────────────
async function condividi() {
  const lbl=inArchivio&&dataArchivio?fmtData(dataArchivio):fmtData(oggi());
  const tot=spese.reduce((a,s)=>a+s.importo+(s.commissioni||0),0);
  let t=`💶 *Spese del ${lbl}*\n\n`;
  [...spese].sort((a,b)=>new Date(a.data)-new Date(b.data)).forEach((s,i)=>{
    t+=`${i+1}. ${s.tipologia} — *€ ${s.importo.toFixed(2)}*`;
    if(s.commissioni) t+=` (+€${s.commissioni.toFixed(2)} comm.)`;
    t+=`\n   ${s.pagamento}`;
    if(s.luogo) t+=`  |  🏪 ${s.luogo}`;
    if(s.euroLitro) t+=`\n   ⛽€${s.euroLitro}/L`;
    if(s.litri)     t+=` 🔢${s.litri}L`;
    if(s.km)        t+=` 🛣️${s.km}km`;
    if(s.descrizione) t+=`\n   📝 ${s.descrizione}`;
    t+='\n\n';
  });
  t+=`─────────────\n💰 *TOTALE: € ${tot.toFixed(2)}*`;
  if(navigator.share){try{await navigator.share({title:`Spese ${lbl}`,text:t});return;}catch(e){}}
  navigator.clipboard.writeText(t).then(()=>alert('📋 Copiato!')).catch(()=>prompt('Copia:',t));
}
async function condividiTelegram(){await condividi();}

// ─── CSV ─────────────────────────────────────────────
function esportaCSV() {
  const ss=[];
  for(let i=0;i<7;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    JSON.parse(localStorage.getItem(kData(k))||'[]').forEach(s=>ss.push(s));
  }
  if(!ss.length){alert("Nessuna spesa nell'ultima settimana.");return;}
  ss.sort((a,b)=>new Date(b.data)-new Date(a.data));
  const hdr=['Data','Contanti','Bancomat Mio','Bancomat Condiviso','Bancomat Papa','Hype','Satispay','Bonifico','PagoPa','F24','Altro','Commissioni','Tipologia','Luogo','€/L','Litri','Km','€/Km','Km/L','Note'];
  const rows=[hdr.join(';')];
  ss.forEach(s=>{
    const im=s.importo.toFixed(2).replace('.',',');
    const p=s.pagamento.toLowerCase();
    const c=s.commissioni?s.commissioni.toFixed(2).replace('.',','):'';
    const nm=['contanti','bancomat','hype','satispay','bonifico','pagopa','f24'];
    rows.push([
      fmtData(s.data),
      p.includes('contanti')?im:'',
      p.includes('bancomat')&&p.includes('mio')?im:'',
      p.includes('bancomat')&&p.includes('condiviso')?im:'',
      p.includes('bancomat')&&p.includes('pap')?im:'',
      p.includes('hype')?im:'',
      p.includes('satispay')?im:'',
      p.includes('bonifico')?im:'',
      p.includes('pagopa')?im:'',
      p.includes('f24')?im:'',
      !nm.some(n=>p.includes(n))?im:'',
      c,s.tipologia||'',s.luogo||'',
      s.euroLitro?String(s.euroLitro).replace('.',','):'',
      s.litri?String(s.litri).replace('.',','):'',
      s.km||'',
      s.euroKm?String(s.euroKm).replace('.',','):'',
      s.kmLitro?String(s.kmLitro).replace('.',','):'',
      (s.descrizione||'').replace(/;/g,',')
    ].join(';'));
  });
  const tot=ss.reduce((a,s)=>a+s.importo+(s.commissioni||0),0);
  rows.push('');rows.push('TOTALE;;;;;;;;;;;;;'+tot.toFixed(2).replace('.',','));
  const blob=new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8;'});
  const dI=fmtData(new Date(new Date().setDate(new Date().getDate()-6)).toISOString().split('T')[0]);
  const dF=fmtData(oggi());
  const nm='Spese_'+dI.replace(/\//g,'-')+'_'+dF.replace(/\//g,'-')+'.csv';
  const fl=new File([blob],nm,{type:'text/csv'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[fl]}))
    navigator.share({files:[fl],title:`Spese ${dI}-${dF}`}).catch(()=>dlFile(blob,nm));
  else dlFile(blob,nm);
}
async function csvTelegram(){esportaCSV();}
function dlFile(b,n){const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=n;a.click();URL.revokeObjectURL(u);}

// ─── BACKUP & RIPRISTINO ─────────────────────────────
function esportaBackup() {
  const dati={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k||!k.startsWith('spese_')) continue;
    const d=k.replace('spese_','');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const a=JSON.parse(localStorage.getItem(k)||'[]');
    if(a.length>0) dati[d]=a;
  }
  const bk={
    versione: typeof APP_VERSION!=='undefined'?APP_VERSION:'',
    data: oggi(),
    tipologieCustom: getTipCustom(),
    spese: dati
  };
  const blob=new Blob([JSON.stringify(bk,null,2)],{type:'application/json;charset=utf-8;'});
  const nm=`Backup_Spese_${oggi()}.json`;
  const fl=new File([blob],nm,{type:'application/json'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[fl]}))
    navigator.share({files:[fl],title:'Backup Spese',text:`Backup spese del ${fmtData(oggi())}`})
      .catch(()=>dlFile(blob,nm));
  else dlFile(blob,nm);
}

function importaBackup(event) {
  const f=event.target.files[0]; if(!f) return;
  event.target.value='';
  const r=new FileReader();
  r.onload=e=>{
    try {
      const bk=JSON.parse(e.target.result);
      if(!bk.spese||typeof bk.spese!=='object'){alert('❌ File non valido.');return;}
      let nDate=0,nSpese=0;
      Object.entries(bk.spese).forEach(([d,arr])=>{
        if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
        const ex=JSON.parse(localStorage.getItem(kData(d))||'[]');
        const ids=new Set(ex.map(s=>s.id));
        const nuove=arr.filter(s=>!ids.has(s.id));
        if(nuove.length>0){localStorage.setItem(kData(d),JSON.stringify([...ex,...nuove]));nSpese+=nuove.length;nDate++;}
      });
      if(bk.tipologieCustom&&Array.isArray(bk.tipologieCustom)){
        const ex=getTipCustom(); const vs=new Set(ex.map(t=>t.v));
        const nuove=bk.tipologieCustom.filter(t=>!vs.has(t.v));
        if(nuove.length>0) saveTipCustom([...ex,...nuove]);
      }
      if(nSpese===0) alert('ℹ️ Nessuna spesa nuova — tutte già presenti.');
      else { alert(`✅ Importate ${nSpese} spese in ${nDate} giorni!`); caricaOggi(); }
    } catch(err){alert('❌ Errore importazione. File corrotto?');}
  };
  r.readAsText(f);
}

// ─── SERVICE WORKER ──────────────────────────────────
let swReg=null;
function swInit() {
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then(r=>{
    swReg=r;
    r.addEventListener('updatefound',()=>{
      const w=r.installing;
      w.addEventListener('statechange',()=>{
        if(w.state==='installed'&&navigator.serviceWorker.controller)
          document.getElementById('update-banner').classList.remove('hidden');
      });
    });
    setInterval(()=>r.update(),5*60*1000);
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());
}
function applyUpdate(){if(swReg&&swReg.waiting) swReg.waiting.postMessage({type:'SKIP_WAITING'});}

// ─── CHANGELOG ───────────────────────────────────────
function checkVersioneNuova() {
  if(typeof APP_VERSION==='undefined') return;
  const ul=localStorage.getItem('ultima_v');
  if(ul!==APP_VERSION){setTimeout(()=>apriChangelog(true),1000);localStorage.setItem('ultima_v',APP_VERSION);}
}
function apriChangelog(solo=false) {
  const b=document.getElementById('changelog-body'); if(!b) return;
  b.innerHTML='';
  const cl=typeof APP_CHANGELOG!=='undefined'?APP_CHANGELOG:[];
  if(!cl.length){b.innerHTML='<p style="color:#aaa;text-align:center;padding:20px">Nessuna nota.</p>';return;}
  (solo?[cl[0]]:cl).forEach(e=>{
    const isc=e.version===APP_VERSION;
    const d=document.createElement('div'); d.className='cl-version-block';
    d.innerHTML=`<div class="cl-version-title"><span class="cl-version-badge ${isc?'current':''}">v${e.version}${isc?' ✓':''}</span><span class="cl-version-date">📅 ${fmtData(e.date)}</span></div><ul class="cl-notes">${e.notes.map(n=>`<li>${n}</li>`).join('')}</ul>`;
    b.appendChild(d);
  });
  document.getElementById('changelog-modal').classList.remove('hidden');
}
function chiudiChangelog(){document.getElementById('changelog-modal').classList.add('hidden');}
async function cercaAgg(){
  const btn=document.querySelector('#changelog-modal .cl-btn-cerca');
  btn.disabled=true;btn.textContent='⏳...';
  try{
    const r=await fetch('./version.js?t='+Date.now(),{cache:'no-store'});
    const t=await r.text();
    const m=t.match(/APP_VERSION\s*=\s*"([^"]+)"/);
    const vo=m?m[1]:null;
    if(!vo) alert('⚠️ Impossibile leggere versione online.');
    else if(vo===(typeof APP_VERSION!=='undefined'?APP_VERSION:'')) {btn.textContent='✅ Aggiornato!';btn.style.background='#43a047';setTimeout(()=>{btn.textContent='🔍 Cerca aggiornamenti';btn.style.background='';btn.disabled=false;},3000);return;}
    else{chiudiChangelog();mostraAgg(vo);}
  }catch{alert('⚠️ Errore rete.');}
  btn.textContent='🔍 Cerca aggiornamenti';btn.disabled=false;
}
function mostraAgg(v){
  document.getElementById('update-modal-body').innerHTML=`<div style="text-align:center;padding:8px 0 16px"><div style="font-size:2.5rem">🆕</div><div style="font-size:1rem;font-weight:700;color:#1976d2">Versione ${v} disponibile</div></div>`;
  document.getElementById('update-modal').classList.remove('hidden');
}
function chiudiUpdateModal(){document.getElementById('update-modal').classList.add('hidden');}
