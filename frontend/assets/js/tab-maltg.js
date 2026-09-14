// ═══════════════════════════════════════════════════════════════════
//  tab-maltg.js — Página MALTG · Arquitectura (02): panel principal con
//  KPIs, árbol de configuración por capa y drill-down JSON-LD.
//  Requiere core.js. Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//  TAB 01 — MALTG · Multidimensional architecture (JSON-LD) + drill-down
// ════════════════════════════════════════════════════════════════════
let pendingMaltg = null;
let maltgView = 'main';
const MALTG_TX='#2b3245', MALTG_SUB='#6b7280', MALTG_RTX='#4b5563';

function maltgPaint(vbW, vbH, inner, scale){
  const svg=document.getElementById('maltg-svg');
  const wrap=document.getElementById('maltg-canvas-wrap');
  if(!svg) return;
  const s = scale || 1;
  svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);
  svg.setAttribute('preserveAspectRatio','xMidYMin meet');
  svg.innerHTML=inner;
  const w=((wrap&&wrap.clientWidth)||700) * s;
  svg.style.width  = (s*100)+'%';
  svg.style.display= 'block';
  svg.style.margin = '0 auto';            /* centrado al reducir */
  svg.style.height = (vbH*(w/vbW))+'px';
}

function renderMaltg(data){
  if(!data || data.error) return;
  pendingMaltg=data;
  const empty=document.getElementById('maltg-empty'); if(empty) empty.style.display='none';
  if(maltgView==='foundation') maltgRenderDetail(data);
  else                          maltgRenderMain(data);
}

function maltgShow(view){
  maltgView=view;
  const back=document.getElementById('maltg-back'), hint=document.getElementById('maltg-hint');
  if(back) back.style.display = view==='foundation' ? '' : 'none';
  if(hint) hint.style.display = view==='foundation' ? 'none' : '';
  if(pendingMaltg) renderMaltg(pendingMaltg);
}

/* ═══ TAB 01 · ÁRBOL DE COMPONENTES + CARD DE CONFIGURACIÓN (ex tab 02) ═══ */
let maltgOnto = null;      // MALTG_ontology.json
let maltgSelNorm = null;   // marco/norma cuya card está visible
let _mtUid = 0;

function _mtIndex(){
  const o=maltgOnto; if(!o||!o.nodes) return null;
  const parent={}; (o.links||[]).forEach(l=>{ if(l.type==='subClassOf') parent[l.t]=l.s; });
  const byId={}; o.nodes.forEach(n=>byId[n.id]=n);
  const core=(o.nodes.find(n=>n.type==='core')||{}).id||'MALTG_Core';
  const layers=o.nodes.filter(n=>parent[n.id]===core).map(n=>n.id);
  return {parent,byId,core,layers,nodes:o.nodes};
}
function _mtLayerIdByName(name){
  const ix=_mtIndex(); if(!ix) return null;
  const nm=(name||'').toLowerCase().replace(/\s+/g,' ').trim();
  return ix.layers.find(id=>(ix.byId[id].label||'').toLowerCase().replace(/\s+/g,' ').trim()===nm)
      || ix.layers.find(id=>(ix.byId[id].cluster||'').toLowerCase()===nm.split(' ')[0]);
}

/* Icono de capa → despliega árbol de marcos y elementos */
async function maltgOpenTree(layerName){
  if(!maltgOnto){
    try{ maltgOnto=await (await fetch('/api/ontology?_='+Date.now())).json(); }catch(e){}
  }
  const ix=_mtIndex();
  const card=document.getElementById('maltg-tree-card');
  if(!card) return;
  if(!ix){ card.innerHTML='<div style="padding:.8rem;color:var(--t3);font-size:.66rem">Sin datos de ontología — pulsa "Recargar Datos".</div>'; return; }
  const lid=_mtLayerIdByName(layerName);
  if(!lid){ card.innerHTML='<div style="padding:.8rem;color:var(--t3);font-size:.66rem">Capa no encontrada en la ontología: '+wfEsc(layerName||'')+'</div>'; return; }
  const L=ix.byId[lid], lc=nodeColor(L.type);
  const normas=ix.nodes.filter(n=>ix.parent[n.id]===lid);
  const total=normas.reduce((s,nm)=>s+ix.nodes.filter(n=>ix.parent[n.id]===nm.id).length,0);
  let h=`<div class="mt-head">
      <span class="mt-ldot" style="background:${lc};box-shadow:0 0 10px ${lc}66"></span>
      <span class="mt-ltitle" style="color:${lc}">${wfEsc(L.label)}</span>
      <span class="mt-lbadge">${normas.length} marco(s) · ${total} elementos</span>
    </div><div class="mt-tree">`;
  normas.forEach((nm,i)=>{
    const aspects=ix.nodes.filter(n=>ix.parent[n.id]===nm.id);
    const c=nodeColor(nm.type);
    h+=`<details class="mt-branch"${i===0?' open':''}>
      <summary><span class="mt-chev">▸</span><span class="mt-dot" style="background:${c}"></span>
        <span class="mt-name" onclick="event.preventDefault();event.stopPropagation();maltgShowConfig('${wfEsc(nm.id)}')">${wfEsc(nm.label)}</span>
        <span class="mt-count">${aspects.length}</span></summary>`;
    aspects.forEach(a=>{
      const sc=parseInt(a.score,10)||0;
      h+=`<div class="mt-leaf" data-node="${wfEsc(a.id)}" onclick="maltgShowConfig('${wfEsc(nm.id)}','${wfEsc(a.id)}')">
        <span class="mt-dot sm" style="background:${c}"></span><span class="mt-name">${wfEsc(a.label)}</span>
        <span class="mt-score" style="color:${sc>0?'var(--green,#10e98c)':'var(--t3)'}">${sc||'—'}%</span></div>`;
    });
    h+=`</details>`;
  });
  h+='</div>';
  card.innerHTML=h;
  const first=normas[0];
  if(maltgSelNorm && normas.some(n=>n.id===maltgSelNorm)) maltgShowConfig(maltgSelNorm);
  else if(first) maltgShowConfig(first.id);
}

/* Card de configuración (idéntica al ex tab 02; sliders persisten en los JSON) */
function _mtSkCard(norm){
  const ix=_mtIndex(); if(!ix) return '';
  const c=nodeColor(norm.type);
  const aspects=ix.nodes.filter(n=>ix.parent[n.id]===norm.id);
  const SKPAL=['#111827','#ef4444','#16a34a','#2563eb','#9333ea','#0891b2','#db2777','#15803d',
               '#7c3aed','#0d9488','#be123c','#1e293b','#65a30d','#c026d3'];
  const col=i=>SKPAL[i%SKPAL.length];
  const id='mtsk-'+(_mtUid++);
  const scored=aspects.filter(a=>parseInt(a.score,10)>0);
  const avg=scored.length?Math.round(scored.reduce((s,a)=>s+parseInt(a.score,10),0)/scored.length):(parseInt(norm.score,10)||0);
  const N=aspects.length;
  const bars=aspects.map((a,i)=>{
    const sc=parseInt(a.score,10)||0; const hid=(i%2===1)?' class="hidden"':'';
    return `<div class="day" title="${wfEsc(a.label)} — ${sc||'—'}%"><div class="line-container"><div class="line" data-node="${wfEsc(a.id)}" style="height:${sc}%;background:${col(i)}"></div></div><p${hid}>${String(i+1).padStart(2,'0')}</p></div>`;
  }).join('');
  const legend=aspects.map((a,i)=>{
    const sc=parseInt(a.score,10)||0;
    return `<div class="lg" data-aspect="${wfEsc(a.id)}">
      <div class="lg-top"><span class="dot" style="background:${col(i)}"></span><span class="nm" style="color:${col(i)}">${wfEsc(a.label)}</span><span class="pc">${sc}%</span></div>
      <input type="range" class="lg-sl" min="0" max="100" value="${sc}" data-node="${wfEsc(a.id)}" style="--c:${col(i)}">
    </div>`;
  }).join('');
  return `<div class="skcard" style="--c:${c}">
    <input type="checkbox" class="sk-toggle" id="${id}">
    <div class="header">
      <label class="sk-fab" for="${id}" title="Ver gráfico">
        <svg width="18" height="16" viewBox="0 0 18 16">
          <rect x="1"  y="8"  width="3.4" height="8"  rx="1" fill="#fff"/>
          <rect x="7.3" y="4"  width="3.4" height="12" rx="1" fill="#fff"/>
          <rect x="13.6" y="1" width="3.4" height="15" rx="1" fill="#fff"/>
        </svg>
      </label>
      <label class="sk-back" for="${id}" title="Volver">
        <svg width="16" height="16" viewBox="0 0 16 16"><polyline points="10,2 4,8 10,14" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </label>
      <div class="content">
        <div class="data">
          <div class="top"><p class="title">${wfEsc(norm.label)}</p><p class="date">${N} elementos</p></div>
          <div class="graph">
            <div class="horizontal"><div><hr><p>100</p></div><div><hr></div><div><hr><p>50</p></div><div><hr></div><div><hr><p>0</p></div></div>
            <div class="vertical">${bars}</div>
          </div>
        </div>
        <p class="title">${wfEsc(norm.label)}</p>
        <p class="date">${N} elementos</p>
        <div class="float"></div>
      </div>
    </div>
    <div class="sk-legend">${legend}</div>
    <div class="info">
      <p>Madurez <br>Promedio de ${N} elementos</p>
      <p class="counter">${avg||'—'} %<span class="unit"></span></p>
    </div>
  </div>`;
}

/* ── Sliders del árbol de configuración ──────────────────────────────
   Vivían en tab-ontology.js (herencia del viejo dashboard.html de una
   sola página), pero esta es la ÚNICA página con sliders .lg-sl —
   ontology.html no los tiene. Al dividirse en páginas separadas,
   maltg.html quedó sin estas funciones definidas: cada slider disparaba
   un ReferenceError silencioso, así que nunca llegaba a POSTear
   /api/ontology/score — ni el indicador, ni el .json, ni (en cascada)
   el nivel de madurez que lee la página Gemelo Digital & Validación se
   actualizaban. Movidas aquí, donde el DOM que tocan (.skcard,
   #maltg-tree-card, los KPIs k-onto/k-dt/k-gap) sí existe. */
function ontoSliderLive(sl){
  const id = sl.dataset.node, v = parseInt(sl.value,10) || 0;
  const card = sl.closest('.skcard'); if(!card) return;
  const line = card.querySelector('.line[data-node="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');
  if(line) line.style.height = v + '%';
  const lg = sl.closest('.lg'); const pc = lg && lg.querySelector('.pc');
  if(pc) pc.textContent = v + '%';
  let sum=0,n=0; card.querySelectorAll('.lg-sl').forEach(s=>{ const x=parseInt(s.value,10)||0; if(x>0){ sum+=x; n++; } });
  const avg = n ? Math.round(sum/n) : 0;
  const counter = card.querySelector('.counter');
  if(counter) counter.innerHTML = (avg||'—') + ' %<span class="unit"></span>';
}

/* Slider de leyenda → persiste el score en el backend (MALTG_ontology.json + Info.json) */
async function ontoSliderSave(sl){
  const id = sl.dataset.node, score = parseInt(sl.value,10) || 0;
  // refleja en memoria (maltgOnto = /api/ontology cacheado) para que el
  // árbol y la card reflejen el nuevo valor sin esperar un recargo.
  const nd = maltgOnto && maltgOnto.nodes && maltgOnto.nodes.find(x=>x.id===id);
  if(nd) nd.score = String(score);
  try{
    const r = await fetch('/api/ontology/score', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, score }) });
    const j = await r.json();
    if(j && j.error){ console.warn('score no guardado:', j.error); return; }
    // % del elemento en el árbol de configuración, al instante
    document.querySelectorAll('#maltg-tree-card .mt-leaf').forEach(el=>{
      if(el.getAttribute('data-node')===id){
        const sc=el.querySelector('.mt-score');
        if(sc){ sc.textContent=score+'%'; sc.style.color = score>0 ? 'var(--green,#10e98c)' : 'var(--t3)'; }
      }
    });
    // recalcular la comparación vs el gemelo digital (Radar de Madurez + GAP + KPIs)
    maltgRefreshValidation();
  }catch(e){ console.warn('score save', e); }
}

/* Recalcula /api/validation (mismo MALTG_ontology.json que persiste el
   slider) y repinta los KPIs de esta página (Score MALTG_onto / Score
   DT_arch / GAP Global) sin pulsar "Recargar Datos". Debounce: varios
   sliders seguidos = una sola llamada. El radar de la página Gemelo
   Digital & Validación es OTRA página — no se repinta en caliente desde
   aquí, pero al abrirla (o recargarla) lee /api/validation de nuevo y
   ya encuentra el score persistido por el slider. */
let _valRefreshT=null;
function maltgRefreshValidation(){
  clearTimeout(_valRefreshT);
  _valRefreshT=setTimeout(async ()=>{
    try{
      const val=await (await fetch('/api/validation?_='+Date.now())).json();
      if(!val || val.error) return;
      setTxt('k-onto',  val.overall_onto);
      setTxt('k-dt',    val.overall_dt);
      setTxt('k-gap',   val.overall_gap);
      setTxt('k-gap-d', `↓ ${val.gap_pct}% del onto`);
    }catch(e){ console.warn('refresh validation', e); }
  }, 450);
}

function maltgShowConfig(normId, aspectId){
  const ix=_mtIndex(); const box=document.getElementById('maltg-config');
  if(!ix||!box) return;
  const norm=ix.byId[normId]; if(!norm) return;
  maltgSelNorm=normId;
  _injectPowerCardCSS();
  box.innerHTML='<div class="sk-grid" style="grid-template-columns:1fr">'+_mtSkCard(norm)+'</div>';
  box.querySelectorAll('.lg-sl').forEach(sl=>{
    sl.addEventListener('input', ()=>ontoSliderLive(sl));
    sl.addEventListener('change',()=>ontoSliderSave(sl));
  });
  document.querySelectorAll('#maltg-tree-card .mt-leaf').forEach(el=>
    el.classList.toggle('sel', el.getAttribute('data-node')===(aspectId||'')));
  if(aspectId){
    const lg=box.querySelector('.lg[data-aspect="'+aspectId+'"]');
    if(lg){ lg.classList.add('mt-hl'); lg.scrollIntoView({block:'nearest'}); setTimeout(()=>lg.classList.remove('mt-hl'),1600); }
  }
}

// ── Main figure — leyendas a la IZQUIERDA + icono de árbol por capa ──
const MT_ICON = (st)=>`
  <rect x="-4" y="-4" width="38" height="38" fill="transparent"/>
  <rect x="10.5" y="1.5" width="9" height="7" rx="1.8" fill="none" stroke="${st}" stroke-width="2.1"/>
  <rect x="1.5" y="18" width="9" height="7" rx="1.8" fill="none" stroke="${st}" stroke-width="2.1"/>
  <rect x="19.5" y="18" width="9" height="7" rx="1.8" fill="none" stroke="${st}" stroke-width="2.1"/>
  <path d="M15 8.5 v4.5 M6 18 v-3 h18 v3" fill="none" stroke="${st}" stroke-width="1.9"/>`;

function maltgRenderMain(data){
  setTxt('maltg-ptitle', data.title || 'Multidimensional Architecture');
  const layers=data.layers||[];
  const BX=172, BW=420;
  let boxes='';
  layers.forEach((l,i)=>{
    const top=24+i*118, cx=BX+BW/2, drill=!!l.drillable;
    const comps=(l.components||[]).join('  –  ');
    let inner = `
      <rect x="${BX}" y="${top}" width="${BW}" height="64" rx="14" fill="${l.fill||'#eee'}" stroke="${l.stroke||'#999'}" stroke-width="${drill?2.4:1.4}"/>
      <text x="${cx}" y="${top+27}" text-anchor="middle" font-family="'Outfit',sans-serif" font-size="17" font-weight="700" fill="${MALTG_TX}">${wfEsc((l.name||'').toUpperCase())}</text>
      <text x="${cx}" y="${top+50}" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="13" font-weight="700" fill="${MALTG_TX}">${wfEsc(comps)}</text>
      <text x="${cx}" y="${top+82}" text-anchor="middle" font-family="'Outfit',sans-serif" font-size="12.5" font-style="italic" fill="${MALTG_SUB}">${wfEsc(l.description||'')}</text>
      <text x="${BX-40}" y="${top+31}" text-anchor="end" font-family="'Space Grotesk',sans-serif" font-size="12.5" font-weight="700" letter-spacing="1" fill="${MALTG_RTX}">${wfEsc((l.role||'').toUpperCase())}</text>
      <circle cx="${BX-24}" cy="${top+26}" r="8" fill="${l.roleColor||'#888'}"/>
      <g class="maltg-tree-ico" data-layer="${wfEsc(l.name||'')}" transform="translate(${BX+BW-42},${top+6})" style="cursor:pointer">
        ${MT_ICON(l.stroke||'#556')}
        <title>Configurar componentes de ${wfEsc(l.name||'')}</title>
      </g>`;
    if(drill){
      inner += `<g id="maltg-foundation" transform="translate(${BX+12},${top+15})" style="cursor:pointer" opacity="0.9">
        <rect x="-3" y="-3" width="31" height="31" rx="7" fill="rgba(255,255,255,.55)" stroke="${l.stroke||'#888'}" stroke-width="1"/>
        <circle cx="10" cy="10" r="7.5" fill="none" stroke="${l.stroke||'#888'}" stroke-width="2"/>
        <line x1="16" y1="16" x2="22.5" y2="22.5" stroke="${l.stroke||'#888'}" stroke-width="2.4" stroke-linecap="round"/>
        <title>Ver detalle de ${wfEsc(l.name||'')}</title>
      </g>`;
    }
    boxes += `<g>${inner}</g>`;
  });

  // cross-cutting concerns — columna IZQUIERDA (bajo el rol de la capa 2)
  let cross='';
  (data.crossCutting||[]).forEach((c,i)=>{
    cross += `<text x="10" y="${188+i*17}" font-family="'Outfit',sans-serif" font-size="11.5" fill="#374151">• ${wfEsc(c)}</text>`;
  });

  // governance council (caja punteada, bajo las capas)
  const ct=600, gc=data.governanceCouncil||{};
  const dims=gc.dimensions||[];
  const chip=(x,y,w,h,t,fs)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#f3f4f6" stroke="#b9bfcc"/><text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-family="'Outfit',sans-serif" font-size="${fs||11.5}" fill="#374151">${wfEsc(t)}</text>`;
  let council=`<rect x="${BX}" y="${ct}" width="420" height="120" rx="8" fill="none" stroke="#9aa0c0" stroke-width="1.5" stroke-dasharray="6 5"/>`;
  council += chip(BX+130,ct+12,150,26, gc.anchor||'Vision and Mission');
  council += `<rect x="${BX+118}" y="${ct+46}" width="174" height="36" rx="5" fill="#eef0f5" stroke="#b9bfcc"/><text x="${BX+205}" y="${ct+69}" text-anchor="middle" font-family="'Outfit',sans-serif" font-size="11.5" font-weight="600" fill="#374151">${wfEsc(gc.name||'Digital Governance Council')}</text>`;
  if(dims[0]) council+=chip(BX+12,ct+18,104,26,dims[0]);
  if(dims[1]) council+=chip(BX+28,ct+70,78,26,dims[1]);
  if(dims[2]) council+=chip(BX+306,ct+18,96,26,dims[2]);
  if(dims[3]) council+=chip(BX+306,ct+70,96,26,dims[3]);

  // impact legend — IZQUIERDA (junto al council)
  let leg=`<text x="24" y="${ct+10}" font-family="'Space Grotesk',sans-serif" font-size="13" font-weight="700" letter-spacing="1.5" fill="#374151">IMPACT</text>`;
  (data.impactLegend||[]).forEach((m,i)=>{
    const y=ct+34+i*24;
    leg += `<circle cx="32" cy="${y-4}" r="7" fill="${m.color}"/><text x="48" y="${y}" font-family="'Outfit',sans-serif" font-size="12.5" fill="#374151">${wfEsc(m.level)}</text>`;
  });

  maltgPaint(640, 740, boxes+cross+council+leg, 0.92);
  const fg=document.querySelector('#maltg-foundation');
  if(fg) fg.addEventListener('click',(e)=>{ e.stopPropagation(); maltgShow('foundation'); });
  document.querySelectorAll('#maltg-svg .maltg-tree-ico').forEach(g=>
    g.addEventListener('click', ()=>maltgOpenTree(g.getAttribute('data-layer'))));
}

// ── Foundation Layer detail (image 2) ──
function maltgRenderDetail(data){
  const fl=(data.layers||[]).find(l=>l.drillable) || {};
  const d=fl.detail||{};
  setTxt('maltg-ptitle', d.title || 'Foundation Layer Architecture');
  const subs=d.sublayers||[];
  const vbW=1000, boxH=120, gap=46, top0=70, stepY=boxH+gap;
  const vbH=top0 + subs.length*stepY + 30;

  let defs=`<defs><marker id="maltg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="#374151"/></marker></defs>`;
  let spine=`<line x1="70" y1="${top0+30}" x2="70" y2="${top0+(subs.length-1)*stepY+boxH-30}" stroke="#333" stroke-width="2.5" stroke-dasharray="3 7"/>`;
  spine += `<text x="34" y="${top0+(subs.length*stepY)/2}" transform="rotate(-90 34 ${top0+(subs.length*stepY)/2})" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="13" fill="#475569">${wfEsc(d.crossLayer||'')}</text>`;
  let subtitle=`<text x="500" y="34" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="15" fill="#475569">${wfEsc(d.subtitle||'')}</text>`;

  let bodies='', tags='', trans='', arrows='', nodes='';
  subs.forEach((s,i)=>{
    const top=top0+i*stepY, cy=top+boxH/2;
    const items=(s.items||[]).join('  ·  ')+(s.note?('  ('+s.note+')'):'');
    const lines=wfWrap(items, 64, 3);
    const lh=21, startY=cy+8 - ((lines.length-1)*lh)/2;
    const tspans=lines.map((ln,k)=>`<text x="440" y="${(startY+k*lh).toFixed(0)}" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="14" fill="#374151">${wfEsc(ln)}</text>`).join('');
    bodies += `<g>
      <rect x="120" y="${top}" width="640" height="${boxH}" rx="10" fill="${s.fill||'#eee'}" stroke="${s.stroke||'#888'}" stroke-width="2.4"/>
      <text x="140" y="${top+30}" font-family="'Outfit',sans-serif" font-size="15.5" font-weight="800" fill="${s.titleColor||'#333'}">${wfEsc('LAYER '+(s.order||i+1)+' — '+(s.name||'').toUpperCase()+(s.standard?(' ('+s.standard+')'):''))}</text>
      ${tspans}
    </g>`;
    // left spine node
    nodes += `<circle cx="70" cy="${cy}" r="9" fill="#fff" stroke="#444" stroke-width="2"/><circle cx="70" cy="${cy}" r="3.4" fill="#444"/>`;
    // right tag
    if(s.tag) tags += `<text x="800" y="${cy+5}" font-family="'Outfit',sans-serif" font-size="16" font-weight="800" fill="${s.titleColor||'#333'}">${wfEsc('"'+s.tag+'"')}</text>`;
    // arrow + transition label to next
    if(i<subs.length-1){
      const ax=440, y1=top+boxH, y2=top+stepY;
      arrows += `<line x1="${ax}" y1="${y1+4}" x2="${ax}" y2="${y2-4}" stroke="#374151" stroke-width="2.4" marker-end="url(#maltg-arrow)"/>`;
      const tr=(d.transitions||[])[i];
      if(tr){
        const parts=tr.split('→');
        const ty=y1+gap/2;
        trans += `<text x="800" y="${ty-2}" font-family="'Outfit',sans-serif" font-size="12.5" fill="#64748b">${wfEsc((parts[0]||'').trim())}</text>`+
                 `<text x="800" y="${ty+14}" font-family="'Outfit',sans-serif" font-size="12.5" fill="#64748b">→ ${wfEsc((parts[1]||'').trim())}</text>`;
      }
    }
  });

  maltgPaint(vbW, vbH, defs+subtitle+spine+nodes+arrows+bodies+tags+trans);
}

// ═══════════════════════════════════════════════════════════════════
//  SDT_CJ — Modelo Digital Estructural (SDT) del Consejo de la Judicatura
//  Carga /api/sdt-cj, botón "scraping CJ" → /api/sdt-cj/scrape
// ═══════════════════════════════════════════════════════════════════


/* ── Overview (tab 02): tarjetas "Power Chart" — capas y elementos de cada capa ── */
function _injectPowerCardCSS(){
  if(document.getElementById('pcard-css')) return;
  const st = document.createElement('style'); st.id = 'pcard-css';
  const EB='cubic-bezier(0.4,0.0,0.2,1)';
  st.textContent = `
  .sk-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1.3rem; }
  .skcard{ --c:#E91E63; --c2:#FF9800; position:relative; width:100%; overflow:hidden;
    background:var(--card-bg); border-radius:10px; box-shadow:0 3px 6px rgba(0,0,0,.16),0 3px 6px rgba(0,0,0,.23); }
  .skcard .sk-toggle{ display:none; }
  /* —— cabecera (altura fija) —— */
  .skcard .header{ position:relative; width:100%; height:230px; background:var(--c); overflow:hidden; }
  /* FAB naranja (expandir) — solo visible colapsado */
  .skcard .sk-fab{ position:absolute; z-index:5; width:50px; height:50px; top:calc(100% - 64px); right:20px; border-radius:100%;
    background:var(--c2); cursor:pointer; box-shadow:0 3px 8px rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center;
    transition:opacity .25s ${EB} .15s, transform .25s ${EB} .15s; }
  .skcard .sk-fab:hover{ transform:scale(1.08); }
  .skcard .sk-toggle:checked + .header .sk-fab{ opacity:0; pointer-events:none; transition:opacity .2s ${EB} 0s; }
  /* botón "‹" (volver al inicio) — solo visible expandido */
  .skcard .sk-back{ position:absolute; z-index:6; top:13px; left:15px; width:32px; height:32px; cursor:pointer; opacity:0; pointer-events:none;
    display:flex; align-items:center; justify-content:center; border-radius:50%; transition:opacity .3s ${EB} 0s, background-color .2s; }
  .skcard .sk-back:hover{ background:rgba(255,255,255,.18); }
  .skcard .sk-toggle:checked + .header .sk-back{ opacity:1; pointer-events:auto; transition:opacity .4s ${EB} .85s; }
  /* —— content —— */
  .skcard .header .content{ position:relative; width:100%; height:100%; }
  .skcard .header .content > *{ color:#fff; font-weight:500; }
  .skcard .header .content .data{ position:absolute; z-index:2; width:100%; height:100%; opacity:0; background:var(--c2);
    transition:opacity .3s ${EB} 0s; }
  .skcard .sk-toggle:checked + .header .content .data{ opacity:1; transition:opacity .8s ${EB} .45s; }
  .skcard .data .top{ width:100%; height:40%; }
  .skcard .data .top .title{ width:100%; }
  .skcard .data .graph{ position:relative; width:calc(100% - 40px); height:60%; margin:0 20px 20px 20px; }
  .skcard .graph .horizontal{ width:100%; height:100%; }
  .skcard .graph .horizontal > div{ height:20%; }
  .skcard .graph .horizontal hr{ border:1px solid #fff; opacity:.25; }
  .skcard .graph .horizontal p{ margin-top:1px; opacity:.7; font-size:11px; color:#fff; }
  .skcard .graph .vertical{ display:flex; flex-direction:row; position:absolute; width:90%; height:100%; top:0; margin-left:10%; }
  .skcard .graph .vertical .day{ position:relative; flex:1; height:100%; }
  .skcard .graph .vertical .day .line-container{ display:flex; flex-direction:column; justify-content:flex-end; position:absolute;
    width:2px; height:80%; max-height:0; bottom:20%; left:50%; transform:translateX(-50%); transition:max-height .3s ${EB} 0s; }
  .skcard .sk-toggle:checked + .header .data .graph .vertical .day .line-container{ max-height:80%; transition:max-height .6s ${EB} .9s; }
  .skcard .line-container .line{ width:100%; background:#fff; }
  .skcard .vertical .day > p{ position:absolute; height:20%; bottom:0; margin-bottom:-3px; opacity:.7; font-size:10px; left:50%; transform:translateX(-50%); color:#fff; }
  .skcard .vertical .day .hidden{ opacity:0; }
  .skcard .header .content .title{ margin-top:18px; font-size:22px; line-height:28px; text-align:center; font-family:var(--font-accent,'Syne'); }
  .skcard .header .content .date{ width:100%; opacity:.82; text-align:center; font-size:12px; }
  .skcard .header .content .float{ position:absolute; z-index:1; width:50px; height:50px; top:50%; right:calc(50% - 25px); opacity:0;
    border-radius:100%; background:var(--c2); transition:transform .3s ${EB} 0s, opacity 0s ${EB} 0s; }
  .skcard .sk-toggle:checked + .header .content .float{ opacity:1; transform:scale(12); transition:transform .3s ${EB} .3s, opacity 0s ${EB} .3s; }
  /* —— leyenda de colores + slider (parte inferior) —— */
  .skcard .sk-legend{ padding:.6rem .95rem .4rem; max-height:390px; overflow-y:auto; }
  .skcard .sk-legend .lg{ display:block; padding:.3rem 0; }
  .skcard .sk-legend .lg-top{ display:flex; align-items:center; gap:.5rem; font-size:.7rem; }
  .skcard .sk-legend .lg .dot{ width:9px; height:9px; border-radius:50%; flex-shrink:0; }
  .skcard .sk-legend .lg .nm{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:500; }
  .skcard .sk-legend .lg .pc{ margin-left:auto; font-family:var(--font-mono); color:var(--t2); font-size:.64rem; font-weight:600; min-width:34px; text-align:right; }
  .skcard .sk-legend .lg-sl{ -webkit-appearance:none; appearance:none; width:100%; height:3px; margin-top:5px;
    border-radius:3px; background:var(--bdr2); outline:none; cursor:pointer; }
  .skcard .sk-legend .lg-sl::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:13px; height:13px;
    border-radius:50%; background:#fff; border:2px solid var(--c,#888); box-shadow:0 1px 3px rgba(0,0,0,.35); cursor:pointer; }
  .skcard .sk-legend .lg-sl::-moz-range-thumb{ width:13px; height:13px; border-radius:50%; background:#fff;
    border:2px solid var(--c,#888); box-shadow:0 1px 3px rgba(0,0,0,.35); cursor:pointer; }
  /* —— info (madurez) —— */
  .skcard .info{ padding:14px 20px 20px; color:var(--t2); border-top:1px solid var(--bdr); }
  .skcard .info > p{ font-size:.74rem; line-height:1.3; }
  .skcard .info .counter{ margin-top:8px; color:var(--t1); font-size:42px; font-weight:400; line-height:40px; font-family:var(--font-display,'Outfit'); }
  .skcard .info .counter .unit{ font-size:14px; color:var(--t3); }`;
  document.head.appendChild(st);
}

// ── Carga inicial de esta página (equivalente al bloque "Tab 01: MALTG"
//    + KPIs de reloadAll() en dashboard.html) ───────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo MALTG_architecture.json…' },
    { id: 's2', label: 'Leyendo ontología y gemelo digital…' },
    { id: 's3', label: 'Calculando KPIs…' },
    { id: 's4', label: 'Actualizando interfaz…' },
  ], async () => {
    step('s1', 'active');
    const maltg = await (await fetch('/api/maltg?_=' + Date.now())).json();
    step('s1', 'done'); step('s2', 'active');
    const [onto, dt, val] = await Promise.all([
      fetch('/api/ontology?_=' + Date.now()).then(r => r.json()),
      fetch('/api/dt-arch?_=' + Date.now()).then(r => r.json()),
      fetch('/api/validation?_=' + Date.now()).then(r => r.json()),
    ]);
    step('s2', 'done'); step('s3', 'active');

    if (!val.error) {
      const ms = ((val.overall_onto + val.overall_dt) / 2).toFixed(1);
      setTxt('k-maltg', ms); setTxt('k-maltg-d', '↑ Score integrado');
      setTxt('k-onto', val.overall_onto);
      setTxt('k-dt', val.overall_dt);
      setTxt('k-gap', val.overall_gap);
      setTxt('k-gap-d', `↓ ${val.gap_pct}% del onto`);
    }
    if (!onto.error) {
      setTxt('k-nodes', onto.node_count);
      setTxt('k-nodes-d', `↑ ${onto.link_count} relaciones`);
      maltgOnto = onto; // evita que el árbol de configuración lo vuelva a pedir
      if (maltgSelNorm) maltgShowConfig(maltgSelNorm);
    }
    if (!dt.error) {
      setTxt('k-svcs', (dt.services || []).length);
      setTxt('k-svcs-d', `↑ ${(dt.connections || []).length} conexiones`);
    }
    step('s3', 'done'); step('s4', 'active');

    if (maltg && !maltg.error) {
      setTxt('maltg-name', maltg.title || '');
      setTxt('maltg-hash', maltg.hash ? maltg.hash.slice(0, 8) + '…' : '—');
      renderMaltg(maltg);
    } else if (maltg && maltg.error) {
      const me = document.getElementById('maltg-empty');
      if (me) { me.style.display = 'flex'; me.textContent = 'Error: ' + maltg.error; }
    }
    step('s4', 'done');
  });
};
