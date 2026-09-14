// ═══════════════════════════════════════════════════════════════════
//  tab-workflow.js — Página Workflow (06): flujo procesal BPMN + chat
//  COGEP flotante. Requiere core.js. Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

const WF_PALETTE = ['#00e5ff','#a855f7','#10e98c','#ffc947','#ff4d6d','#6366f1','#2dd4bf','#f472b6'];
let wfState = { scale:1, tx:0, ty:0, data:null, drag:null, salud:null, ledger:null,
                show:{ lanes:true, labels:true, notes:true },
                highlight:null,     // Set of node ids traversed by the selected causa
                causa:null };       // { juicio, label, seqByNode, actsByNode, totalPasos }



// word-wrap a label into <=maxLines lines of ~maxChars
function wfWrap(text, maxChars, maxLines){
  const words = String(text||'').split(/\s+/).filter(Boolean);
  const lines=[]; let cur='';
  for(const w of words){
    if((cur+' '+w).trim().length<=maxChars){ cur=(cur+' '+w).trim(); }
    else { if(cur) lines.push(cur); cur=w; }
    if(lines.length>=maxLines) break;
  }
  if(cur && lines.length<maxLines) lines.push(cur);
  if(lines.length===maxLines && (words.join(' ').length> lines.join(' ').length))
    lines[maxLines-1]= lines[maxLines-1].replace(/.{0,1}$/,'…');
  return lines.length?lines:[''];
}

// point on box boundary toward an external point (cx2,cy2)
function wfBorder(n, x2, y2){
  const cx=n.x+n.w/2, cy=n.y+n.h/2;
  const dx=x2-cx, dy=y2-cy;
  if(dx===0 && dy===0) return {x:cx,y:cy};
  const hw=n.w/2, hh=n.h/2;
  const sx = dx!==0 ? hw/Math.abs(dx) : Infinity;
  const sy = dy!==0 ? hh/Math.abs(dy) : Infinity;
  const t = Math.min(sx,sy);
  return { x:cx+dx*t, y:cy+dy*t };
}

function renderWorkflow(wf){
  if(!wf || wf.error) return;
  wfState.data = wf;
  const svg = document.getElementById('wf-svg');
  const empty = document.getElementById('wf-empty');
  if(empty) empty.style.display='none';

  // resolved colours / fonts (CSS vars are not valid inside SVG attributes)
  const FUI="'Space Grotesk','Outfit',sans-serif", FMONO="'DM Mono',monospace";
  const C = isDark
    ? { node:'#0d1525', box:'#0a1124', t1:'#e8f0ff', t2:'#7a8db0', edge:'#5a6b8c', pill:'#0a1020' }
    : { node:'#ffffff', box:'#ffffff', t1:'#1a2438', t2:'#5a6b88', edge:'#9aa8c0', pill:'#ffffff' };
  const GOLD='#ffc947', GREEN='#10e98c', ROSE='#ff4d6d', CYAN='#00e5ff';

  const nodeById = {};
  wf.nodes.forEach(n=>nodeById[n.id]=n);
  const stageColor = {};
  (wf.stages||[]).forEach((g,i)=> stageColor[g.id]=WF_PALETTE[i%WF_PALETTE.length]);

  let lanes='', edges='', nodes='', notes='';

  // ── Stage lanes (Etapas) ──
  // Each lane is the BPMN group's own defined box (position + size), so it
  // covers exactly its area and the group of activities inside it — matching
  // the dashed "Etapa" boxes of the source diagram.
  if(wfState.show.lanes){
    (wf.stages||[]).forEach((g,i)=>{
      const col=stageColor[g.id];
      lanes += `<g>
        <rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}"
              fill="${col}" fill-opacity="0.05" stroke="${col}" stroke-opacity="0.55" stroke-width="3" stroke-dasharray="10 8" rx="18"/>
        <rect x="${g.x+g.w/2-Math.min(g.w*0.42,210)}" y="${g.y-34}" width="${Math.min(g.w*0.84,420)}" height="28" rx="5"
              fill="${C.pill}" stroke="${col}" stroke-opacity="0.5"/>
        <text x="${g.x+g.w/2}" y="${g.y-14}" text-anchor="middle"
              font-family="${FUI}" font-size="18" font-weight="700"
              fill="${col}">${wfEsc(g.label)}</text>
      </g>`;
    });
  }

  // ── Causa overlay: which nodes were traversed ──
  const HL = wfState.highlight;   // Set of node ids, or null
  const hlActive = HL && HL.size>0;

  // ── Flows (edges) ──
  wf.flows.forEach(f=>{
    const s=nodeById[f.source], t=nodeById[f.target];
    if(!s||!t) return;
    const verts = f.vertices||[];
    const firstTarget = verts.length? verts[0] : {x:t.x+t.w/2, y:t.y+t.h/2};
    const lastSource  = verts.length? verts[verts.length-1] : {x:s.x+s.w/2, y:s.y+s.h/2};
    const p0 = wfBorder(s, firstTarget.x, firstTarget.y);
    const pN = wfBorder(t, lastSource.x, lastSource.y);
    const pts=[p0, ...verts, pN];
    const d = 'M '+pts.map(p=>`${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ');
    const onPath = hlActive && HL.has(f.source) && HL.has(f.target);
    const eStroke = onPath ? '#000' : C.edge;
    const eW = onPath ? 3.4 : 2.2;
    const eOp = (hlActive && !onPath) ? 0.25 : 1;
    edges += `<path d="${d}" fill="none" stroke="${eStroke}" stroke-width="${eW}" opacity="${eOp}" marker-end="url(#wf-arrow${onPath?'-hl':''})"/>`;
    if(onPath){
      // flujo direccional animado, coloreado por el estado COGEP del nodo destino
      const al = (wfState.salud && wfState.salud.node_alerts) ? wfState.salud.node_alerts[f.target] : null;
      const aCol = al ? (SALUD_COL[al.estado]||CYAN) : CYAN;
      edges += `<path class="wf-anim-edge" d="${d}" fill="none" stroke="${aCol}" stroke-width="2.6" stroke-linecap="round" opacity="0.95"/>`;
    }
    if(wfState.show.labels && f.label){
      const mid = pts[Math.floor(pts.length/2)];
      const lbl = f.label.trim();
      const w = 18 + lbl.length*8;
      edges += `<g>
        <rect x="${(mid.x-w/2).toFixed(1)}" y="${(mid.y-13).toFixed(1)}" width="${w}" height="22" rx="11"
              fill="${C.pill}" stroke="${GOLD}" stroke-opacity="0.55"/>
        <text x="${mid.x.toFixed(1)}" y="${(mid.y+3).toFixed(1)}" text-anchor="middle"
              font-family="${FMONO}" font-size="13" fill="${GOLD}">${wfEsc(lbl)} d</text>
      </g>`;
    }
  });

  // ── Nodes ──
  const seqByNode = (wfState.causa&&wfState.causa.seqByNode) || {};
  const seqBadge = (n)=>{
    if(!hlActive || !HL.has(n.id)) return '';
    const arr=seqByNode[n.id]||[];
    if(!arr.length) return '';
    const txt = arr.length<=3 ? arr.join('·') : (arr[0]+'…'+arr[arr.length-1]);
    const w = 18 + txt.length*8.5;
    return `<g>
      <rect x="${(n.x-8).toFixed(1)}" y="${(n.y-12).toFixed(1)}" width="${w.toFixed(1)}" height="24" rx="12" fill="#000"/>
      <text x="${(n.x-8+w/2).toFixed(1)}" y="${(n.y+4).toFixed(1)}" text-anchor="middle" font-family="${FMONO}" font-size="13" font-weight="700" fill="#fff">${wfEsc(txt)}</text>
    </g>`;
  };
  // ── Alertas COGEP por nodo (razonador): anillo pulsante + etiqueta ──
  const nodeAlerts = (wfState.salud && wfState.salud.node_alerts) || {};
  const alertBadge = (n)=>{
    const al = nodeAlerts[n.id];
    if(!al) return '';
    const c = SALUD_COL[al.estado]||'#64748b';
    const cx = n.x + n.w, cy = n.y;
    const txt = al.estado==='CUMPLE' ? '✓' : (al.estado==='ALERTA'?'!':'+'+al.exceso+'d');
    const w = Math.max(26, 12 + txt.length*9);
    const pulse = al.estado!=='CUMPLE' ? `<circle class="wf-pulse-ring" cx="${cx}" cy="${cy}" r="15" fill="none" stroke="${c}" stroke-width="4"/>` : '';
    return `<g>
      ${pulse}
      <circle cx="${cx}" cy="${cy}" r="14" fill="${c}" stroke="${isDark?'#0d1525':'#fff'}" stroke-width="2.5"/>
      <text x="${cx}" y="${cy+4.5}" text-anchor="middle" font-family="${FMONO}" font-size="${txt.length>2?10:13}" font-weight="700" fill="#0a0f1d">${txt}</text>
      <title>${al.estado} — ${al.articulo} (regla ${al.regla})${al.exceso?` · exceso ${al.exceso} días hábiles`:''}</title>
    </g>`;
  };

  wf.nodes.forEach(n=>{
    const hit = hlActive && HL.has(n.id);
    const dim = hlActive && !hit ? 0.30 : 1;   // fade non-traversed nodes
    const clickable = hit ? ' wf-hit' : '';
    if(n.kind==='event'){
      const isStart = (n.eventType||'').toLowerCase()==='start';
      const col = isStart? GREEN:ROSE;
      const cx=n.x+n.w/2, cy=n.y+n.h/2, r=Math.min(n.w,n.h)/2;
      nodes += `<g class="wf-node${clickable}" data-id="${n.id}" opacity="${dim}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${hit?'#000':col}" fill-opacity="${hit?0.10:0.16}"
                stroke="${hit?'#000':col}" stroke-width="${hit?6:(isStart?3:4)}"/>
        <text x="${cx}" y="${cy+5}" text-anchor="middle" font-family="${FUI}"
              font-size="15" font-weight="700" fill="${hit?'#000':col}">${isStart?'INICIO':'FIN'}</text>
        ${seqBadge(n)}
        ${alertBadge(n)}
      </g>`;
    } else {
      const col = stageColor[n.stage] || CYAN;
      const lines = wfWrap(n.label, 20, 4);
      const lh=17;
      const startY = n.y + n.h/2 - ((lines.length-1)*lh)/2;
      const txtFill = hit ? '#000' : C.t1;
      const tspans = lines.map((ln,i)=>
        `<text x="${n.x+n.w/2}" y="${(startY+i*lh+5).toFixed(1)}" text-anchor="middle"
               font-family="${FUI}" font-size="15" font-weight="${hit?700:400}" fill="${txtFill}">${wfEsc(ln)}</text>`).join('');
      nodes += `<g class="wf-node${clickable}" data-id="${n.id}" opacity="${dim}" style="cursor:pointer">
        <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12"
              fill="${hit?'#111':C.node}" fill-opacity="${hit?0.08:1}" stroke="${hit?'#000':col}" stroke-width="${hit?5:2.5}"/>
        <rect x="${n.x}" y="${n.y}" width="6" height="${n.h}" rx="3" fill="${hit?'#000':col}"/>
        ${tspans}
        ${seqBadge(n)}
        ${alertBadge(n)}
      </g>`;
    }
  });

  // ── Annotations (notes) ──
  if(wfState.show.notes){
    (wf.annotations||[]).forEach(a=>{
      const lines=wfWrap(a.content, 26, 4);
      const tspans=lines.map((ln,i)=>
        `<text x="${a.x+10}" y="${a.y+18+i*15}" font-family="${FUI}" font-size="12.5"
               fill="${C.t2}">${wfEsc(ln)}</text>`).join('');
      notes += `<g>
        <rect x="${a.x}" y="${a.y}" width="${Math.max(a.w,150)}" height="${Math.max(a.h, lines.length*15+16)}"
              rx="6" fill="${GOLD}" fill-opacity="0.06" stroke="${GOLD}" stroke-opacity="0.4" stroke-dasharray="4 4"/>
        ${tspans}
      </g>`;
    });
  }

  svg.innerHTML = `
    <defs>
      <marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill="${C.edge}"/>
      </marker>
      <marker id="wf-arrow-hl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill="#000"/>
      </marker>
    </defs>
    <g id="wf-root">
      <g id="wf-lanes">${lanes}</g>
      <g id="wf-notes">${notes}</g>
      <g id="wf-edges">${edges}</g>
      <g id="wf-nodes">${nodes}</g>
    </g>`;

  // legend
  const leg=document.getElementById('wf-legend');
  if(leg){
    let h = '<span style="display:inline-flex;align-items:center;gap:.35rem"><svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="none" stroke="#10e98c" stroke-width="2"/></svg>Evento inicio</span>'
          + '<span style="display:inline-flex;align-items:center;gap:.35rem"><svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="none" stroke="#ff4d6d" stroke-width="3"/></svg>Evento fin</span>'
          + '<span style="display:inline-flex;align-items:center;gap:.35rem"><span style="color:var(--gold)">⏱</span>días estimados</span>';
    (wf.stages||[]).forEach((g,i)=>{
      const c=stageColor[g.id];
      h+=`<span style="display:inline-flex;align-items:center;gap:.35rem"><span style="width:11px;height:11px;border-radius:3px;background:${c}"></span>${wfEsc(g.numero||'')} ${wfEsc((g.label||'').replace(/^[\d.]+\s*/,''))}</span>`;
    });
    leg.innerHTML=h;
  }

  wfBindNodeTips();
  wfApplyTransform();
}

function wfApplyTransform(){
  const root=document.getElementById('wf-root');
  if(root) root.setAttribute('transform', `translate(${wfState.tx},${wfState.ty}) scale(${wfState.scale})`);
}

// apply a parsed workflow payload to the UI (header, stats strip, diagram)
function wfApplyData(wf){
  if(!wf || wf.error){
    const empty=document.getElementById('wf-empty');
    if(empty){ empty.style.display='flex'; empty.textContent = (wf&&wf.error)?('Error: '+wf.error):'Sin datos'; }
    return;
  }
  pendingWf = wf;
  // changing the diagram invalidates any causa overlay
  wfState.highlight=null;
  const csel=document.getElementById('wf-causa'); if(csel) csel.value='';
  setTxt('wf-causa-info','');
  setTxt('wf-proc-name', wf.codigo ? `${wf.codigo} · ${wf.nombre}` : (wf.nombre||''));
  setTxt('wf-badge',     wf.nombre || 'WORKFLOW');
  setTxt('wf-hash',      wf.hash ? wf.hash.slice(0,8)+'…' : '—');
  setTxt('wf-srcfile',   '/data/workflow/'+(wf.file||''));
  const sel=document.getElementById('wf-file'); if(sel && wf.file) sel.value=wf.file;
  // second selector — processes contained in the selected file
  const psel=document.getElementById('wf-proc'), plbl=document.getElementById('wf-proc-lbl');
  const procs=wf.processes||[];
  if(psel){
    if(procs.length>1){
      psel.innerHTML=procs.map(p=>`<option value="${p.idx}">${wfEsc((p.codigo?p.codigo+' · ':'')+(p.nombre||('Proceso '+(p.idx+1))))}</option>`).join('');
      psel.value=String(wf.row||0);
      psel.style.display=''; if(plbl) plbl.style.display='';
    } else {
      psel.style.display='none'; if(plbl) plbl.style.display='none';
    }
  }
  const st = wf.stats||{};
  setTxt('wf-k-act',   st.activities ?? '—');
  setTxt('wf-k-flow',  st.flows ?? '—');
  setTxt('wf-k-stage', st.stages ?? '—');
  setTxt('wf-k-ev',    st.events ?? '—');
  renderWorkflow(wf);
  setTimeout(()=>{ renderWorkflow(wf); wfFit(); }, 50);
}

// fill the <select> with the BPMN files available in /data
function wfPopulateFiles(list, current){
  const sel=document.getElementById('wf-file'); if(!sel) return;
  const files=(list&&list.files)||[];
  sel.innerHTML = files.length
    ? files.map(f=>`<option value="${f.file}">${f.file}</option>`).join('')
    : '<option value="">(sin archivos BPMN)</option>';
  const cur = current || (list&&list.default) || (files[0]&&files[0].file);
  if(cur) sel.value=cur;
}

// load + diagram a specific file (file combo onchange) — resets to first process
async function wfLoadFile(file){
  if(!file) return;
  await wfFetch(file, 0, file);
}

// load + diagram a specific process within the current file (process combo onchange)
async function wfLoadProcess(row){
  const file=(document.getElementById('wf-file')||{}).value || (pendingWf&&pendingWf.file);
  if(!file) return;
  await wfFetch(file, row, file);
}

async function wfFetch(file, row, label){
  const empty=document.getElementById('wf-empty');
  if(empty){ empty.style.display='flex'; empty.textContent='Cargando '+label+'…'; }
  try{
    const r=await fetch('/api/workflow?file='+encodeURIComponent(file)+'&row='+encodeURIComponent(row)+'&_='+Date.now());
    wfApplyData(await r.json());
  }catch(e){ console.error('wfFetch', e); if(empty) empty.textContent='Error cargando '+label; }
}

function wfFit(){
  const wf=wfState.data; const wrap=document.getElementById('wf-canvas-wrap');
  if(!wf||!wrap) return;
  const cw=wrap.clientWidth, ch=wrap.clientHeight;
  const pad=80;
  const wW=(wf.bbox.maxX-wf.bbox.minX)+pad*2;
  const wH=(wf.bbox.maxY-wf.bbox.minY)+pad*2;
  const sc=Math.min(cw/wW, ch/wH);
  wfState.scale=sc;
  wfState.tx = (cw - wW*sc)/2 - (wf.bbox.minX-pad)*sc;
  wfState.ty = (ch - wH*sc)/2 - (wf.bbox.minY-pad)*sc;
  wfApplyTransform();
}

function wfZoom(factor){
  const wrap=document.getElementById('wf-canvas-wrap'); if(!wrap) return;
  const cx=wrap.clientWidth/2, cy=wrap.clientHeight/2;
  wfZoomAt(factor, cx, cy);
}
function wfZoomAt(factor, px, py){
  const ns=Math.max(0.05, Math.min(4, wfState.scale*factor));
  const k=ns/wfState.scale;
  wfState.tx = px - (px - wfState.tx)*k;
  wfState.ty = py - (py - wfState.ty)*k;
  wfState.scale=ns;
  wfApplyTransform();
}

function wfToggle(key){
  wfState.show[key]=!wfState.show[key];
  const btn=document.getElementById('wf-'+(key==='labels'?'labels':key==='notes'?'notes':'lanes')+'-btn');
  if(btn) btn.classList.toggle('active', wfState.show[key]);
  if(wfState.data){ const s={...wfState}; renderWorkflow(wfState.data); wfState.scale=s.scale; wfState.tx=s.tx; wfState.ty=s.ty; wfApplyTransform(); }
}

function wfBindNodeTips(){
  const tip=document.getElementById('wf-tip');
  const wrap=document.getElementById('wf-canvas-wrap');
  if(!tip||!wrap) return;
  const acts=(wfState.causa&&wfState.causa.actsByNode)||{};
  wrap.querySelectorAll('.wf-node').forEach(g=>{
    const id=g.getAttribute('data-id');
    const n=(wfState.data.nodes||[]).find(x=>x.id===id);
    if(!n) return;
    const hasActs=Array.isArray(acts[id]) && acts[id].length>0;
    g.addEventListener('mousemove',ev=>{
      const r=wrap.getBoundingClientRect();
      tip.style.display='block';
      tip.style.left=Math.min(r.width-290, ev.clientX-r.left+14)+'px';
      tip.style.top=(ev.clientY-r.top+14)+'px';
      const st=(wfState.data.stages||[]).find(s=>s.id===n.stage);
      let html=`<div style="font-weight:600;color:var(--cyan);margin-bottom:.25rem">${wfEsc(n.label)}</div>`+
        `<div style="color:var(--t2)">${n.kind==='event'?'Evento':'Actividad'}${st?' · '+wfEsc(st.label):''}</div>`;
      if(hasActs){
        const ps=acts[id];
        html+=`<div style="margin-top:.35rem;color:#000;background:#ffe04d;border-radius:4px;padding:.15rem .4rem;display:inline-block;font-weight:700">Recorrido: paso ${ps.map(p=>p.seq).join(', ')}</div>`+
              `<div style="color:var(--cyan);margin-top:.3rem">▸ Clic para ver detalle</div>`;
      }
      tip.innerHTML=html;
    });
    g.addEventListener('mouseleave',()=>{ tip.style.display='none'; });
    if(hasActs){
      g.style.cursor='pointer';
      g.addEventListener('click',(ev)=>{ ev.stopPropagation(); tip.style.display='none'; wfOpenActivity(id); });
    }
  });
}

// ── Activity detail window (modal) ──
function wfOpenActivity(nodeId){
  const causa=wfState.causa; if(!causa) return;
  const ps=(causa.actsByNode||{})[nodeId]||[];
  if(!ps.length) return;
  const node=(wfState.data.nodes||[]).find(x=>x.id===nodeId)||{};
  const modal=document.getElementById('wf-modal'), body=document.getElementById('wf-modal-body'),
        title=document.getElementById('wf-modal-title'), sub=document.getElementById('wf-modal-sub');
  if(!modal) return;
  // fields to show, in order, with friendly labels
  // (Fecha y Hora unificadas en un solo campo; se omiten Judicatura y Grafo flujo)
  const FIELDS=[
    ['seq','Secuencia (orden temporal)'],['FechaProvidencia','Fecha y hora'],
    ['TipoProvidencia','Tipo de providencia'],['NombreProvidencia','Nombre'],['Estado','Estado'],
    ['Login','Login'],['loginT','Login (tramitador)'],['IdProvidencia','Id providencia'],
    ['IdTipoActividad','Tipo actividad'],
    ['FechaSistema','Fecha sistema'],['UltimaModificacion','Última modificación'],['Visible','Visible']
  ];
  title.textContent = node.label || (ps[0].NombreProvidencia||'Actividad');
  sub.textContent = `${causa.label||('Causa '+(causa.juicio||''))} — ${ps.length} ocurrencia${ps.length>1?'s':''} en esta actividad`;

  // ── Dictamen del razonador COGEP para esta actividad ──
  let dictHtml='';
  const dictas=((wfState.salud&&wfState.salud.resultados)||[]).filter(r=>r.nodeId===nodeId);
  if(dictas.length){
    dictHtml = dictas.map(r=>{
      const c=SALUD_COL[r.estado]||'#64748b';
      return `<div style="margin-bottom:.8rem;padding:.6rem .75rem;border:1px solid ${c};border-radius:8px;background:${c}11">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
          <span class="salud-dot" style="background:${c};box-shadow:0 0 8px ${c}"></span>
          <b style="color:${c};font-size:.7rem">⚖ DICTAMEN IA — ${wfEsc(r.estado)}</b>
          <span style="color:var(--t3);font-size:.6rem">${wfEsc(r.articulo)} COGEP${r.dias!=null?` · ${r.dias}/${r.termino_dias} días hábiles`:''}</span>
        </div>
        <div style="font-size:.64rem;color:var(--t1);line-height:1.55">${wfEsc(r.dictamen||'')}</div>
      </div>`;
    }).join('');
  } else if(wfState.salud){
    dictHtml = `<div style="margin-bottom:.8rem;padding:.5rem .7rem;border:1px dashed var(--bdr);border-radius:8px;font-size:.62rem;color:var(--t3)">
      ⚖ El razonador COGEP no tiene un término legal parametrizado para esta actividad (informativa).</div>`;
  }
  body.innerHTML = ps.map((p,i)=>{
    const rows=FIELDS.filter(([k])=>p[k]!=null && p[k]!=='').map(([k,lbl])=>
      `<div style="display:flex;gap:.6rem;padding:.18rem 0;border-bottom:1px solid var(--bdr)">
         <div style="min-width:170px;color:var(--t2);font-size:.62rem">${wfEsc(lbl)}</div>
         <div style="color:var(--t1);font-size:.66rem;font-family:var(--font-mono);word-break:break-all">${wfEsc(p[k])}</div>
       </div>`).join('');
    const uid = `${p.seq}-${i}`;
    // Análisis IA de una actuación (mismo flujo que la parte inferior)
    const analisis = `
      <div style="margin-top:.8rem;padding:.7rem .75rem;border:1px solid var(--bdr2);border-radius:8px;background:var(--card-bg)">
        <div style="font-size:.62rem;color:var(--t2);margin-bottom:.45rem;text-transform:uppercase;letter-spacing:.08em">⚖ Análisis IA de una actuación — suba el documento del juzgador (PDF/TXT)</div>
        <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
          <input type="file" id="wf-mod-file-${uid}" accept=".pdf,.txt" style="font-size:.62rem;color:var(--t2)">
          <button class="vis-ctrl-btn" onclick="wfModalAnalizar('${uid}')">⚖ Analizar con IA COGEP</button>
          <span id="wf-mod-status-${uid}" style="font-size:.62rem;color:var(--t3)"></span>
        </div>
        <div id="wf-mod-result-${uid}" style="display:none;margin-top:.6rem;font-size:.68rem;line-height:1.55;padding:.6rem .8rem;border-radius:8px;border:1px solid var(--bdr)"></div>
        <div id="wf-mod-hallazgos-${uid}" style="display:none;margin-top:.6rem;flex-direction:column;gap:.45rem"></div>
      </div>`;
    return `<div style="margin-bottom:1.3rem">
        <div style="display:inline-flex;align-items:center;gap:.5rem;margin-bottom:.4rem">
          <span style="background:#000;color:#fff;font-weight:700;border-radius:12px;padding:.12rem .6rem;font-family:var(--font-mono);font-size:.66rem">Paso ${p.seq}</span>
          <span style="color:var(--cyan);font-weight:600;font-size:.7rem">${wfEsc(p.NombreProvidencia||'')}</span>
        </div>
        ${rows}
        ${dictHtml}
        ${analisis}
      </div>`;
  }).join('');
  modal.style.display='flex';
}
function wfCloseActivity(){ const m=document.getElementById('wf-modal'); if(m) m.style.display='none'; }

// pan + wheel zoom (bound once)
(function wfInitPan(){
  function bind(){
    const wrap=document.getElementById('wf-canvas-wrap');
    if(!wrap){ return setTimeout(bind,300); }
    wrap.addEventListener('mousedown',e=>{
      if(e.target.closest('.wf-node')) return;
      wfState.drag={x:e.clientX,y:e.clientY,tx:wfState.tx,ty:wfState.ty};
      wrap.style.cursor='grabbing';
    });
    window.addEventListener('mousemove',e=>{
      if(!wfState.drag) return;
      wfState.tx=wfState.drag.tx+(e.clientX-wfState.drag.x);
      wfState.ty=wfState.drag.ty+(e.clientY-wfState.drag.y);
      wfApplyTransform();
    });
    window.addEventListener('mouseup',()=>{ if(wfState.drag){ wfState.drag=null; wrap.style.cursor='grab'; } });
    wrap.addEventListener('wheel',e=>{
      e.preventDefault();
      const r=wrap.getBoundingClientRect();
      wfZoomAt(e.deltaY<0?1.12:0.89, e.clientX-r.left, e.clientY-r.top);
    },{passive:false});
  }
  bind();
})();

// ── Causa / Expediente overlay (highlight a case path over the flow) ──
function wfPopulateCausas(list){
  const sel=document.getElementById('wf-causa'); if(!sel) return;
  const files=(list&&list.files)||[];
  sel.innerHTML='<option value="">— Resaltar recorrido de una causa —</option>'+
    files.map(f=>`<option value="${f.file}">${wfEsc(f.label||f.file)}</option>`).join('');
}

function wfRerenderKeepView(){
  if(!wfState.data) return;
  const s={scale:wfState.scale,tx:wfState.tx,ty:wfState.ty};
  renderWorkflow(wfState.data);
  wfState.scale=s.scale; wfState.tx=s.tx; wfState.ty=s.ty; wfApplyTransform();
}

async function wfLoadCausa(file){
  const info=document.getElementById('wf-causa-info');
  if(!file){
    wfState.highlight=null; wfState.causa=null; wfState.salud=null; wfState.ledger=null;
    const sp=document.getElementById('wf-salud-panel'); if(sp) sp.style.display='none';
    const ts=document.getElementById('wf-tech-strip'); if(ts) ts.style.display='none';
    if(info) info.textContent=''; wfRerenderKeepView(); return;
  }
  try{
    const r=await fetch('/api/expediente?file='+encodeURIComponent(file)+'&_='+Date.now());
    const d=await r.json();
    if(d.error){ if(info) info.textContent='Error: '+d.error; return; }
    const pasos=d.pasos||[];
    const ids=new Set((wfState.data&&wfState.data.nodes||[]).map(n=>n.id));
    const seqByNode={}, actsByNode={}, pasosSeq=[];
    pasos.forEach(p=>{
      if(p.nodeId && ids.has(p.nodeId)){
        (seqByNode[p.nodeId]=seqByNode[p.nodeId]||[]).push(p.seq);
        (actsByNode[p.nodeId]=actsByNode[p.nodeId]||[]).push(p);
        pasosSeq.push({seq:p.seq, nodeId:p.nodeId, nombre:p.NombreProvidencia||'', fecha:p.FechaProvidencia||''});
      }
    });
    wfState.highlight=new Set(Object.keys(seqByNode));
    wfState.causa={ juicio:d.juicio, file, label:d.label||'', seqByNode, actsByNode, pasosSeq, totalPasos:pasos.length };
    if(info) info.textContent = `● ${d.label||('Causa '+(d.juicio||''))} — ${wfState.highlight.size} actividades en el flujo · ${pasos.length} pasos (clic en un nodo para detalle)`;
    if(typeof wfChat!=='undefined' && wfChat.open) wfChatSync();

    // ── Razonador COGEP + Ledger + Open Data (en paralelo) ──
    wfState.salud=null; wfState.ledger=null;
    try{
      const [rj, rl, ro] = await Promise.all([
        fetch('/api/cogep/juicio?file='+encodeURIComponent(file)+'&_='+Date.now()),
        fetch('/api/ledger?file='+encodeURIComponent(file)+'&_='+Date.now()),
        fetch('/api/opendata?file='+encodeURIComponent(file)+'&_='+Date.now()),
      ]);
      const j=await rj.json(), l=await rl.json(), o=await ro.json();
      if(!j.error) wfState.salud=j;
      if(!l.error) wfState.ledger=l;
      renderSaludPanel(j.error?null:j);
      renderTechStrip(j.error?null:j, l.error?null:l, o.error?null:o, file);
    }catch(e){ console.warn('razonador COGEP no disponible', e); }

    wfRerenderKeepView();
  }catch(e){ console.error('wfLoadCausa', e); if(info) info.textContent='Error cargando causa'; }
}

// ════════════════════════════════════════════════════════════════════
//  SALUD DEL JUICIO + MATERIALIZACIÓN AI/BLOCKCHAIN/OPEN DATA (Tab 06)
// ════════════════════════════════════════════════════════════════════


function renderSaludPanel(j){
  const panel=document.getElementById('wf-salud-panel');
  if(!panel) return;
  if(!j){ panel.style.display='none'; return; }
  panel.style.display='block';
  wfPopulateActos();
  const badge=document.getElementById('wf-salud-badge');
  const s=j.salud;
  const col = s==null ? '#64748b' : s>=90?'#10e98c': s>=60?'#ffc947':'#ff4d6d';
  if(badge){ badge.textContent = s==null?'SIN DATOS':('SALUD '+s+'/100'); badge.style.color=col; }

  // anillo
  const ring=document.getElementById('wf-salud-ring');
  if(ring){
    const pct=(s==null?0:s)/100, R=52, C=2*Math.PI*R;
    ring.innerHTML=`
      <circle cx="65" cy="65" r="${R}" fill="none" stroke="${col}22" stroke-width="11"/>
      <circle cx="65" cy="65" r="${R}" fill="none" stroke="${col}" stroke-width="11" stroke-linecap="round"
              stroke-dasharray="${(C*pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 65 65)">
        <animate attributeName="stroke-dasharray" from="0 ${C.toFixed(1)}" to="${(C*pct).toFixed(1)} ${C.toFixed(1)}" dur="0.9s" fill="freeze"/>
      </circle>
      <text x="65" y="60" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="26" font-weight="700" fill="${col}">${s==null?'—':s}</text>
      <text x="65" y="80" text-anchor="middle" font-size="10" fill="#888">de 100</text>`;
  }
  const proc=document.getElementById('wf-salud-proc');
  if(proc) proc.textContent = (j.procedimiento? j.procedimiento.nombre+' · '+j.procedimiento.articulos : '');
  const res=document.getElementById('wf-salud-resumen');
  if(res) res.innerHTML = `<b style="color:${col}">⚖ ${wfEsc(j.resumen||'')}</b><br>
    <span style="color:var(--t3);font-size:.6rem">${wfEsc(j.motor||'')} · Art. 73 COGEP: términos en días hábiles (no excluye feriados — limitación declarada)</span>`;

  const wrap=document.getElementById('wf-salud-reglas');
  if(wrap){
    wrap.innerHTML=(j.resultados||[]).map((r,i)=>{
      const c=SALUD_COL[r.estado]||'#64748b';
      const dias = r.dias==null?'—':`${r.dias}/${r.termino_dias} días`;
      return `<div class="salud-chip" onclick="const d=document.getElementById('salud-dict-${i}');d.style.display=d.style.display==='none'?'block':'none'">
        <span class="salud-dot" style="background:${c};box-shadow:0 0 8px ${c}"></span>
        <span style="font-size:.66rem;color:var(--t1);flex:1"><b>${wfEsc(r.nombre)}</b> <span style="color:var(--t3)">(${wfEsc(r.articulo)})</span></span>
        <span style="font-family:var(--font-mono);font-size:.62rem;color:${c};font-weight:700">${r.estado}${r.exceso?` +${r.exceso}d`:''} · ${dias}</span>
      </div>
      <div id="salud-dict-${i}" style="display:none;font-size:.63rem;color:var(--t2);line-height:1.55;padding:.45rem .7rem .45rem 1.5rem;border-left:2px solid ${c}">${wfEsc(r.dictamen||'')}</div>`;
    }).join('');
  }
}

function renderTechStrip(j, l, o, file){
  const strip=document.getElementById('wf-tech-strip');
  if(!strip) return;
  strip.style.display='grid';
  // AI
  const ai=document.getElementById('wf-tech-ai');
  if(ai){
    const n=(j&&j.resultados||[]).filter(r=>r.estado!=='NO_EVALUABLE').length;
    ai.innerHTML = j? `El razonador simbólico mapeó las providencias del expediente a la <b>ontología COGEP</b> y evaluó <b>${n} término(s) legal(es)</b>:
      <span style="color:#10e98c">${j.cumple} cumple(n)</span> · <span style="color:#ffc947">${j.alertas} alerta(s)</span> · <span style="color:#ff4d6d">${j.incumplimientos} incumplimiento(s)</span>.
      <br><br>Cada dictamen cita el artículo aplicable (razonamiento explicable, sin caja negra). Ver detalle en el panel Salud del Juicio ↑`
      : 'Razonador no disponible para esta causa.';
  }
  // Blockchain
  const bc=document.getElementById('wf-tech-bc');
  if(bc && l){
    const blocks=(l.bloques||[]);
    bc.innerHTML = `<div style="margin-bottom:.4rem">Cada actuación es un bloque: <code style="font-size:.55rem">hash = SHA-256(idx | fecha | data | hash_prev)</code> — alterar una rompe todas las siguientes.</div>
      <div id="wf-bc-chain" style="display:flex;flex-wrap:wrap;gap:3px;align-items:center">`+
      blocks.map((b,i)=>`<span class="bc-block" data-i="${i}" title="${wfEsc(b.actividad)} · ${wfEsc(b.fecha)}"
        style="font-family:var(--font-mono);font-size:.52rem;padding:.18rem .3rem;border-radius:4px;border:1px solid #10e98c66;color:#10e98c;background:#10e98c11">${b.block_hash.slice(0,6)}</span>${i<blocks.length-1?'<span style="color:#475569">─</span>':''}`).join('')+
      `</div><div style="margin-top:.4rem;color:var(--t3)">root: <code style="font-size:.55rem">${(l.root||'').slice(0,24)}…</code> · ${l.longitud} bloques</div>`;
  } else if(bc){ bc.textContent='Ledger no disponible.'; }
  // Open Data
  const od=document.getElementById('wf-tech-od');
  if(od){
    od.innerHTML = o? `Expediente publicado como <b>dato abierto enlazado</b> (JSON-LD, vocabularios schema.org + DCAT + MALTG), interoperable con
      <a href="https://procesosjudiciales.funcionjudicial.gob.ec/" target="_blank" style="color:#ff9a3c">e-SATJE (consulta pública)</a>. Licencia CC-BY 4.0.` : 'No disponible.';
    const pre=document.getElementById('wf-od-preview');
    if(pre && o) pre.textContent=JSON.stringify({'@id':o['@id'],'@type':o['@type'],'dct:title':o['dct:title'],'estadoProcesal':o['estadoProcesal'],'actuaciones':`[${(o.actuaciones||[]).length} schema:Action]`},null,1);
  }
  strip.dataset.file=file||'';
}

async function sha256hex(s){
  const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function bcVerify(){
  const st=document.getElementById('wf-bc-status'); const l=wfState.ledger;
  if(!l){ if(st) st.textContent='Cargue una causa primero.'; return; }
  let prev='0'.repeat(64), ok=true;
  for(const [i,b] of (l.bloques||[]).entries()){
    const h=await sha256hex(`${b.idx}|${b.fecha}|${b.data_hash}|${prev}`);
    const el=document.querySelector(`.bc-block[data-i="${i}"]`);
    const good=(h===b.block_hash && b.prev_hash===prev);
    if(el){ el.style.borderColor=good?'#10e98c':'#ff4d6d'; el.style.color=good?'#10e98c':'#ff4d6d'; el.style.background=good?'#10e98c11':'#ff4d6d22'; }
    if(!good) ok=false;
    prev=b.block_hash;
  }
  if(st) st.innerHTML = ok? '<span style="color:#10e98c">✔ Cadena íntegra: ningún registro del expediente fue alterado (verificación SHA-256 en el navegador).</span>'
                          : '<span style="color:#ff4d6d">✘ Integridad rota: existen bloques alterados.</span>';
}

async function bcTamper(){
  const st=document.getElementById('wf-bc-status'); const l=wfState.ledger;
  if(!l || !(l.bloques||[]).length){ if(st) st.textContent='Cargue una causa primero.'; return; }
  const k=Math.floor(l.bloques.length/2);
  l.bloques[k].data_hash = 'f'.repeat(8)+l.bloques[k].data_hash.slice(8);   // simula edición maliciosa de la actuación k
  let prev='0'.repeat(64);
  for(const [i,b] of l.bloques.entries()){
    const h=await sha256hex(`${b.idx}|${b.fecha}|${b.data_hash}|${prev}`);
    const el=document.querySelector(`.bc-block[data-i="${i}"]`);
    const good=(h===b.block_hash && b.prev_hash===prev);
    if(el){ el.style.borderColor=good?'#10e98c':'#ff4d6d'; el.style.color=good?'#10e98c':'#ff4d6d'; el.style.background=good?'#10e98c11':'#ff4d6d22'; }
    prev=b.block_hash;
  }
  if(st) st.innerHTML=`<span style="color:#ff4d6d">⚠ Se simuló la alteración de la actuación #${k+1}: la cadena se rompe desde ese bloque — el expediente ya no es confiable. (Recargue la causa para restaurar.)</span>`;
}

function odOpen(fmt){
  const file=(wfState.causa&&wfState.causa.file)||document.getElementById('wf-tech-strip').dataset.file;
  if(!file) return;
  window.open('/api/opendata?file='+encodeURIComponent(file)+'&format='+fmt,'_blank');
}

// ── Análisis IA de actuación (tab 06): errores jurídicos del documento ──
async function wfPopulateActos(){
  const sel=document.getElementById('wf-acto-sel');
  if(!sel || sel.options.length>1) return;
  try{
    const kb=await (await fetch('/api/cogep/kb?_='+Date.now())).json();
    (kb.actos||[]).forEach(a=>{
      if(!(a.requisitos&&a.requisitos.length) && !a.keywords) return;
      const o=document.createElement('option');
      o.value=a.id; o.textContent=`${a.nombre} (${a.articulo})`;
      sel.appendChild(o);
    });
  }catch(e){ console.warn('wfPopulateActos', e); }
}

async function wfAnalizarActuacion(){
  const inp=document.getElementById('wf-pdf-input'), st=document.getElementById('wf-pdf-status');
  const res=document.getElementById('wf-pdf-result'), box=document.getElementById('wf-hallazgos');
  const acto=(document.getElementById('wf-acto-sel')||{}).value||'';
  if(!inp||!inp.files||!inp.files.length){ if(st) st.textContent='Seleccione primero el PDF/TXT de la actuación.'; return; }
  if(st) st.textContent='⏳ El agente está leyendo el documento y verificando los requisitos del COGEP…';
  if(res){ res.style.display='none'; }
  if(box){ box.style.display='none'; box.innerHTML=''; }
  try{
    const fd=new FormData();
    fd.append('file', inp.files[0]);
    fd.append('acto', acto);
    fd.append('expediente', (wfState.causa&&wfState.causa.file)||'');
    const r=await fetch('/api/cogep/analisis',{method:'POST',body:fd});
    const j=await r.json();
    if(st) st.textContent='';
    wfRenderAnalisis(j, res, box);
  }catch(e){
    if(st) st.textContent='';
    res.style.display='block'; res.style.borderColor='#ff4d6d';
    res.innerHTML='<span style="color:#ff4d6d">Error de red durante el análisis.</span>';
  }
}

// Render compartido del resultado de /api/cogep/analisis (banner + hallazgos)
function wfRenderAnalisis(j, res, box){
  if(!res) return;
  if(j.error){ res.style.display='block'; res.style.borderColor='#ff4d6d'; res.innerHTML=`<span style="color:#ff4d6d">${wfEsc(j.error)}</span>`; if(box){box.style.display='none';box.innerHTML='';} return; }
  const col = j.errores>0 ? '#ff4d6d' : (j.advertencias>0 ? '#ffc947' : '#10e98c');
  res.style.display='block'; res.style.borderColor=col;
  res.innerHTML=`
    <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;margin-bottom:.35rem">
      <span class="salud-dot" style="background:${col};box-shadow:0 0 8px ${col}"></span>
      <b style="color:${col};font-size:.74rem">CONFORMIDAD ${j.conformidad}%</b>
      <span style="color:#ff4d6d;font-weight:700">${j.errores} error(es)</span>
      <span style="color:#ffc947;font-weight:700">${j.advertencias} advertencia(s)</span>
      <span style="color:#10e98c;font-weight:700">${j.cumplidos} cumplido(s)</span>
      <span style="color:var(--t3)">· ${wfEsc(j.acto?j.acto.nombre:'')} (${wfEsc(j.acto?j.acto.articulo:'')})</span>
    </div>
    <div style="color:var(--t1)">${wfEsc(j.dictamen||'')}</div>
    <div style="margin-top:.35rem;color:var(--t3);font-size:.58rem">
      ${j.juez?`Juzgador: <b style="color:var(--t2)">${wfEsc(j.juez)}</b> · `:''}
      ${j.causa_documento?`Causa en el documento: ${wfEsc(j.causa_documento)} · `:''}
      Fechas: ${(j.fechas||[]).join(' · ')||'—'} · ${wfEsc(j.motor||'')}
    </div>`;
  if(!box) return;
  const ICO={ERROR:'✖',ADVERTENCIA:'⚠',CUMPLE:'✔'};
  box.style.display='flex';
  box.innerHTML=(j.hallazgos||[]).map(h=>{
    const c=SALUD_COL[h.tipo==='ERROR'?'INCUMPLE':h.tipo==='ADVERTENCIA'?'ALERTA':'CUMPLE'];
    return `<div style="display:flex;gap:.55rem;align-items:flex-start;padding:.45rem .6rem;border:1px solid var(--bdr);border-left:3px solid ${c};border-radius:0 8px 8px 0;background:var(--card-bg)">
      <span style="color:${c};font-weight:700;flex-shrink:0">${ICO[h.tipo]||'•'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:.66rem"><b style="color:${c}">${wfEsc(h.tipo)}</b>
          <b style="color:var(--t1)"> · ${wfEsc(h.requisito||'')}</b>
          <span style="color:var(--t3)"> — ${wfEsc(h.articulo||'')} COGEP</span></div>
        <div style="font-size:.63rem;color:var(--t2);line-height:1.5;margin-top:.15rem">${wfEsc(h.detalle||'')}</div>
        ${h.evidencia?`<div style="font-size:.6rem;color:var(--t3);font-style:italic;margin-top:.15rem">Evidencia: ${wfEsc(h.evidencia)}</div>`:''}
        ${h.recomendacion?`<div style="font-size:.6rem;color:${c};margin-top:.15rem">→ ${wfEsc(h.recomendacion)}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

// Análisis IA dentro del modal de actividad (misma funcionalidad que la parte inferior)
async function wfModalAnalizar(uid){
  const inp=document.getElementById('wf-mod-file-'+uid), st=document.getElementById('wf-mod-status-'+uid);
  const res=document.getElementById('wf-mod-result-'+uid), box=document.getElementById('wf-mod-hallazgos-'+uid);
  if(!inp||!inp.files||!inp.files.length){ if(st) st.textContent='Seleccione el PDF/TXT de la actuación.'; return; }
  if(st) st.textContent='⏳ El agente está leyendo el documento y verificando los requisitos del COGEP…';
  if(res) res.style.display='none';
  if(box){ box.style.display='none'; box.innerHTML=''; }
  try{
    const fd=new FormData();
    fd.append('file', inp.files[0]);
    fd.append('acto', '');
    fd.append('expediente', (wfState.causa&&wfState.causa.file)||'');
    const r=await fetch('/api/cogep/analisis',{method:'POST',body:fd});
    const j=await r.json();
    if(st) st.textContent='';
    wfRenderAnalisis(j, res, box);
  }catch(e){
    if(st) st.textContent='';
    if(res){ res.style.display='block'; res.style.borderColor='#ff4d6d'; res.innerHTML='<span style="color:#ff4d6d">Error de red durante el análisis.</span>'; }
  }
}

// ── Dictamen IA simple sobre PDF (tab 09) ──

let wfPlayTimer=null;
function wfPlay(){
  const c=wfState.causa, data=wfState.data;
  if(!c || !c.pasosSeq || !c.pasosSeq.length || !data){ return; }
  if(wfPlayTimer){ clearTimeout(wfPlayTimer); wfPlayTimer=null; }
  const svg=document.getElementById('wf-svg'); const root=document.getElementById('wf-root');
  if(!root) return;
  const old=document.getElementById('wf-token'); if(old) old.remove();
  const byId={}; data.nodes.forEach(n=>byId[n.id]=n);
  const seq=c.pasosSeq.filter(p=>byId[p.nodeId]);
  if(!seq.length) return;
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');
  g.id='wf-token'; g.setAttribute('class','wf-token');
  g.innerHTML=`<circle r="16" fill="#00e5ff" fill-opacity="0.25" stroke="#00e5ff" stroke-width="3"/>
               <text id="wf-token-n" text-anchor="middle" dy="5" font-family="'DM Mono',monospace" font-size="13" font-weight="700" fill="#00e5ff">1</text>`;
  root.appendChild(g);
  const info=document.getElementById('wf-causa-info');
  let i=0;
  const step=()=>{
    if(i>=seq.length){ wfPlayTimer=setTimeout(()=>{const t=document.getElementById('wf-token'); if(t)t.remove();},1500); return; }
    const p=seq[i], n=byId[p.nodeId];
    const cx=n.x+n.w/2, cy=n.y+n.h/2;
    g.style.transition= i===0?'none':'transform 0.55s ease-in-out';
    g.style.transform=`translate(${cx}px,${cy}px)`;
    const t=g.querySelector('#wf-token-n'); if(t) t.textContent=p.seq;
    if(info) info.textContent=`▶ Paso ${p.seq}/${c.totalPasos} — ${p.nombre||''} · ${(p.fecha||'').slice(0,10)}`;
    i++; wfPlayTimer=setTimeout(step, 850);
  };
  step();
}

// ════════════════════════════════════════════════════════════════════
//  CHAT FLOTANTE COGEP — Q&A sobre la causa seleccionada
// ════════════════════════════════════════════════════════════════════
const wfChat = { open:false, min:false, greeted:false, lastFile:'' };

function wfChatEl(id){ return document.getElementById(id); }

function wfChatToggle(){
  const w=wfChatEl('wf-chat'); if(!w) return;
  wfChat.open=!wfChat.open;
  w.style.display = wfChat.open ? 'flex' : 'none';
  if(wfChat.open){
    if(wfChat.min) wfChatMin();           // restaurar si estaba minimizado
    wfChatSync();
    if(!wfChat.greeted){ wfChat.greeted=true; wfChatAsk('', true); }
    const inp=wfChatEl('wf-chat-input'); if(inp) setTimeout(()=>inp.focus(),80);
  }
}
function wfChatHide(){ wfChat.open=false; const w=wfChatEl('wf-chat'); if(w) w.style.display='none'; }
function wfChatMin(){
  const w=wfChatEl('wf-chat'); if(!w) return;
  wfChat.min=!wfChat.min;
  w.classList.toggle('minimized', wfChat.min);
  const b=wfChatEl('wf-chat-minbtn'); if(b) b.textContent=wfChat.min?'▢':'—';
}

function wfChatSync(){
  const sel=document.getElementById('wf-causa');
  const lbl=wfChatEl('wf-chat-causa');
  const file=sel?sel.value:'';
  if(lbl) lbl.textContent = file ? (sel.options[sel.selectedIndex].text||file) : '— sin causa seleccionada: elígela en el diagrama —';
  if(file && wfChat.lastFile && file!==wfChat.lastFile){
    wfChatPush('bot', '📁 Causa cambiada. Ahora respondo sobre: '+(sel.options[sel.selectedIndex].text||file));
  }
  wfChat.lastFile=file;
  return file;
}

function wfChatPush(who, text){
  const box=wfChatEl('wf-chat-msgs'); if(!box) return;
  const d=document.createElement('div');
  d.className='wf-chat-bub '+who;
  d.textContent=text;
  box.appendChild(d);
  box.scrollTop=box.scrollHeight;
}

function wfChatChips(list){
  const c=wfChatEl('wf-chat-chips'); if(!c) return;
  c.innerHTML=(list||[]).map(s=>`<span class="wf-chat-chip" onclick="wfChatAskChip(this)">${wfEsc(s)}</span>`).join('');
}
function wfChatAskChip(el){ const inp=wfChatEl('wf-chat-input'); if(inp) inp.value=el.textContent; wfChatSend(); }

function wfChatSend(){
  const inp=wfChatEl('wf-chat-input'); if(!inp) return;
  const q=inp.value.trim(); if(!q) return;
  inp.value='';
  wfChatPush('user', q);
  wfChatAsk(q, false);
}

async function wfChatAsk(question, silentUser){
  const file=wfChatSync();
  const box=wfChatEl('wf-chat-msgs');
  const typing=document.createElement('div');
  typing.className='wf-chat-bub bot'; typing.textContent='⏳ razonando sobre la ontología COGEP…';
  if(box){ box.appendChild(typing); box.scrollTop=box.scrollHeight; }
  try{
    const r=await fetch('/api/cogep/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({file, question})});
    const j=await r.json();
    typing.remove();
    wfChatPush('bot', j.answer||'Sin respuesta.');
    wfChatChips(j.sugerencias||[]);
  }catch(e){
    typing.remove();
    wfChatPush('bot','Error de conexión con el razonador. ¿Está corriendo el backend?');
  }
}

// ════════════════════════════════════════════════════════════════════
//  TAB 09 — ONTOLOGÍA COGEP (vis-network) + RAZONADOR
// ════════════════════════════════════════════════════════════════════

// ── Carga inicial de esta página (equivalente al bloque "Tab 06:
//    Workflow" de reloadAll() en dashboard.html) ────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo flujo procesal BPMN…' },
    { id: 's2', label: 'Leyendo expedientes y procesos…' },
    { id: 's3', label: 'Actualizando interfaz…' },
  ], async () => {
    step('s1', 'active');
    const [wf, wfList, exp] = await Promise.all([
      fetch('/api/workflow?_=' + Date.now()).then(r => r.json()),
      fetch('/api/workflow-files?_=' + Date.now()).then(r => r.json()),
      fetch('/api/expedientes?_=' + Date.now()).then(r => r.json()),
    ]);
    step('s1', 'done'); step('s2', 'active');
    wfPopulateFiles(wfList, wf && wf.file);
    wfPopulateCausas(exp);
    step('s2', 'done'); step('s3', 'active');
    if (wf && !wf.error) wfApplyData(wf);
    step('s3', 'done');
  });
};
