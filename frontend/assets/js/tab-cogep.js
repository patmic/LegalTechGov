// ═══════════════════════════════════════════════════════════════════
//  tab-cogep.js — Página Ontología COGEP · IA (07). Requiere core.js.
//  Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

async function cogepJuicioPdf(){ return _juicioPdf('cogep-pdf-input',null,'cogep-pdf-out'); }

async function _juicioPdf(inputId, statusId, outId){
  const inp=document.getElementById(inputId), out=document.getElementById(outId);
  const st=statusId?document.getElementById(statusId):null;
  if(!inp||!inp.files||!inp.files.length){ if(st) st.textContent='Seleccione un PDF o TXT primero.'; else if(out){out.style.display='block';out.textContent='Seleccione un PDF o TXT primero.';} return; }
  if(st) st.textContent='Analizando documento con el razonador COGEP…';
  if(out){ out.style.display='block'; out.innerHTML='<span style="color:var(--t3)">⏳ Analizando…</span>'; }
  try{
    const fd=new FormData(); fd.append('file', inp.files[0]);
    const r=await fetch('/api/cogep/juicio-pdf',{method:'POST',body:fd});
    const j=await r.json();
    if(st) st.textContent='';
    if(j.error){ out.innerHTML=`<span style="color:#ff4d6d">${wfEsc(j.error)}</span>`; return; }
    const c=SALUD_COL[j.estado]||'#60a5fa';
    out.style.borderColor=c;
    out.innerHTML=`<div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.35rem">
        <span class="salud-dot" style="background:${c};box-shadow:0 0 8px ${c}"></span>
        <b style="color:${c}">${wfEsc(j.estado)}</b>
        ${j.acto_detectado?`<span style="color:var(--t3)">· acto: <b style="color:var(--t1)">${wfEsc(j.acto_detectado)}</b></span>`:''}
        ${j.dias!=null?`<span style="color:var(--t3)">· ${j.dias}/${j.termino_dias} días hábiles</span>`:''}
      </div>
      <div style="color:var(--t1)">${wfEsc(j.dictamen||'')}</div>
      <div style="margin-top:.35rem;color:var(--t3);font-size:.58rem">
        Fechas detectadas: ${(j.fechas_detectadas||[]).join(' · ')||'—'}${j.juez_detectado?` · Juzgador: ${wfEsc(j.juez_detectado)}`:''}
      </div>`;
  }catch(e){ if(out) out.innerHTML='<span style="color:#ff4d6d">Error de red al dictaminar.</span>'; }
}

// ── Reproducción animada del recorrido de la causa ──

let cogepNet=null, cogepLoaded=false;
const COGEP_COLORS={core:'#60a5fa',procedimiento:'#00e5ff',etapa:'#a855f7',acto:'#10e98c',termino:'#ffc947',sujeto:'#ff4d6d',principio:'#94a3b8'};
const COGEP_LBL={core:'COGEP (raíz)',procedimiento:'Procedimiento',etapa:'Etapa procesal',acto:'Acto procesal',termino:'Término legal (días)',sujeto:'Sujeto procesal',principio:'Principio rector'};

async function initCogepTab(){
  // Poblar combo de expedientes. En dashboard.html se clonaban las
  // <option> ya cargadas por el tab Workflow (mismo documento); como
  // páginas separadas ya no comparten DOM, se piden aquí directamente.
  const dst=document.getElementById('cogep-causa');
  if(dst && dst.options.length<=1){
    try{
      const exp = await (await fetch('/api/expedientes?_='+Date.now())).json();
      ((exp&&exp.files)||[]).forEach(f=>{
        const o=document.createElement('option');
        o.value=f.file; o.textContent=f.label||f.file;
        dst.appendChild(o);
      });
    }catch(e){ console.warn('expedientes (cogep)', e); }
  }
  if(cogepLoaded && cogepNet){ cogepNet.redraw(); return; }
  try{
    const r=await fetch('/api/cogep/ontology?_='+Date.now());
    const g=await r.json();
    if(g.error){ document.getElementById('cogep-net').innerHTML='<div style="padding:1rem;color:#ff4d6d;font-size:.7rem">'+wfEsc(g.error)+'</div>'; return; }
    document.getElementById('cogep-hash').textContent=(g.hash||'').slice(0,10);
    const nodes=new vis.DataSet(g.nodes.map(n=>({
      id:n.id, label:n.label.length>26? n.label.slice(0,24)+'…' : n.label,
      title:(n.description||'')+(n.description?'':n.label),
      shape: n.type==='core'?'hexagon': n.type==='termino'?'diamond': n.type==='sujeto'?'star':'dot',
      size: n.r? n.r*1.5 : 14,
      color:{background:(COGEP_COLORS[n.type]||'#888')+'33', border:COGEP_COLORS[n.type]||'#888',
             highlight:{background:(COGEP_COLORS[n.type]||'#888')+'66', border:'#fff'}},
      font:{color:isDark?'#e8f0ff':'#1a2438', size:11, face:'Space Grotesk'},
      _meta:n
    })));
    const edges=new vis.DataSet(g.links.map((l,i)=>({
      id:'e'+i, from:l.s, to:l.t, arrows:'to',
      dashes:!!l.dash, width:l.w||1,
      color:{color:isDark?'#3a4a6a':'#b8c4d8', highlight:'#60a5fa'},
      label:l.type==='subClassOf'?'':l.type, font:{size:8,color:isDark?'#5a6b8c':'#8a98b0',strokeWidth:0}
    })));
    cogepNet=new vis.Network(document.getElementById('cogep-net'), {nodes,edges}, {
      physics:{solver:'forceAtlas2Based', forceAtlas2Based:{gravitationalConstant:-60,springLength:110,avoidOverlap:0.6}, stabilization:{iterations:160}},
      interaction:{hover:true, tooltipDelay:120}
    });
    cogepNet.on('click', p=>{
      const t=document.getElementById('cogep-node-title'), d=document.getElementById('cogep-node-desc');
      if(!p.nodes.length){ if(t)t.textContent='— clic en un nodo —'; if(d)d.textContent=''; return; }
      const n=nodes.get(p.nodes[0]); const m=n._meta||{};
      if(t){ t.textContent=m.label||n.id; t.style.color=COGEP_COLORS[m.type]||'var(--t1)'; }
      if(d) d.innerHTML=`<span style="color:${COGEP_COLORS[m.type]}">[${COGEP_LBL[m.type]||m.type}]</span> ${wfEsc(m.description||'Sin descripción.')}`;
    });
    const leg=document.getElementById('cogep-legend');
    if(leg) leg.innerHTML=Object.keys(COGEP_COLORS).map(k=>
      `<span style="display:inline-flex;align-items:center;gap:.35rem"><span style="width:10px;height:10px;border-radius:50%;background:${COGEP_COLORS[k]}"></span>${COGEP_LBL[k]}</span>`).join('');
    cogepLoaded=true;
  }catch(e){ console.error('initCogepTab',e); }
}

async function cogepRunJuicio(){
  const sel=document.getElementById('cogep-causa'), out=document.getElementById('cogep-juicio-out');
  if(!sel||!sel.value){ if(out) out.innerHTML='<span style="font-size:.62rem;color:var(--t3)">Seleccione un expediente.</span>'; return; }
  out.innerHTML='<span style="font-size:.62rem;color:var(--t3)">⏳ Razonando sobre la ontología COGEP…</span>';
  try{
    const r=await fetch('/api/cogep/juicio?file='+encodeURIComponent(sel.value)+'&_='+Date.now());
    const j=await r.json();
    if(j.error){ out.innerHTML='<span style="color:#ff4d6d;font-size:.62rem">'+wfEsc(j.error)+'</span>'; return; }
    const col=j.salud==null?'#64748b': j.salud>=90?'#10e98c': j.salud>=60?'#ffc947':'#ff4d6d';
    out.innerHTML=`<div style="font-size:.68rem;color:var(--t1);line-height:1.5;padding:.5rem .6rem;border:1px solid ${col};border-radius:8px">
        <b style="color:${col}">Salud ${j.salud==null?'—':j.salud}/100</b> · ${wfEsc(j.procedimiento?j.procedimiento.nombre:'')}<br>
        <span style="font-size:.62rem;color:var(--t2)">${wfEsc(j.resumen||'')}</span></div>`+
      (j.resultados||[]).map(r2=>{
        const c=SALUD_COL[r2.estado]||'#64748b';
        return `<div style="font-size:.6rem;line-height:1.45;padding:.4rem .55rem;border-left:3px solid ${c};background:var(--card-bg);border-radius:0 6px 6px 0">
          <b style="color:${c}">${r2.estado}</b> · <b style="color:var(--t1)">${wfEsc(r2.nombre)}</b> (${wfEsc(r2.articulo)})
          ${r2.dias!=null?` — ${r2.dias}/${r2.termino_dias} días hábiles${r2.exceso?` (+${r2.exceso})`:''}`:''}
          <div style="color:var(--t2);margin-top:.2rem">${wfEsc(r2.dictamen||'')}</div></div>`;
      }).join('');
  }catch(e){ out.innerHTML='<span style="color:#ff4d6d;font-size:.62rem">Error de red.</span>'; }
}

// Chip "razonador: …" de validez medida. En dashboard.html lo escribía
// ovLoad() (página Validación Experta) tras leer /api/eval/report;
// como ahora es otra página, esta la lee por su cuenta.
async function cogepLoadValidezChip(){
  const chip = document.getElementById('cogep-validez-chip');
  if(!chip) return;
  try{
    const rep = await (await fetch('/api/eval/report?_='+Date.now())).json();
    chip.textContent = rep.disponible ? ('razonador: '+rep.chip+(rep.apto?' ✓ apto':' ⚠ no apto')) : 'razonador: sin validez medida';
    chip.style.color = rep.disponible ? (rep.apto?'#10e98c':'#ff9a3c') : '#ffc947';
  }catch(e){}
}

// ── Verificación Ontológica COGEP (botones: Generar / Verificar /
//    Competency Questions / Alineación LKIF-Core) ───────────────────
// Movidas aquí desde tab-experto.js: sus botones y su markup
// (ov-owl-hash, ov-checks, ov-cq-n, ov-cqs) viven en esta página, que
// nunca cargaba ese archivo — cada clic tiraba "ovVerificar/ovCq is
// not defined" en consola sin pintar nada. vzEsc() se reemplaza por
// wfEsc() (ya disponible vía core.js, mismo escapado salvo comillas,
// que aquí nunca se interpolan dentro de un atributo).
async function ovAlineacion(){
  const d = await (await fetch('/api/cogep/alineacion?_='+Date.now())).json();
  document.getElementById('ov-cqs').innerHTML =
    `<div style="font-family:var(--font-mono);font-size:.6rem;color:var(--t3);margin-bottom:.3rem">ALINEACIÓN COGEP ↔ LKIF-CORE / LEGALRULEML (anexo de tesis)</div>`+
    `<table class="dtable">
      <thead><tr>
        <th>COGEP</th><th>LKIF / LegalRuleML</th><th>Relación</th></tr></thead><tbody>`+
    (d.alineacion||[]).map(a=>`<tr>
      <td class="dt-primary">
        <span class="dt-primary-title" style="font-family:var(--font-mono);color:var(--cyan)">${wfEsc(a.cogep)}</span>
        ${a.nota?`<span class="dt-primary-meta">${wfEsc(a.nota)}</span>`:''}
      </td>
      <td style="color:var(--t1);font-family:var(--font-mono)">${wfEsc(a.lkif)}</td>
      <td style="color:var(--gold)">${wfEsc(a.relacion)}</td></tr>`).join('')+
    `</tbody></table><div style="font-size:.56rem;color:var(--t3);margin-top:.4rem">${wfEsc(d.nota||'')}</div>`;
}
async function ovGenerar(){
  const d = await (await fetch('/api/cogep/owl/generar',{method:'POST'})).json();
  const el = document.getElementById('ov-owl-hash');
  el.textContent = d.ok ? ('OWL: '+String(d.hash||'').slice(0,10)) : 'OWL: error';
  document.getElementById('ov-checks').innerHTML = d.ok ?
    `<span style="color:#10e98c">✓ COGEP_ontology.owl generado</span> — ${d.individuos.actos} actos, ${d.individuos.reglas} términos, ${d.individuos.procedimientos} procedimientos, ${d.individuos.sujetos} sujetos. Descárguelo de /data para verificarlo en Protégé (HermiT) y OOPS!.` : wfEsc(JSON.stringify(d));
}
async function ovVerificar(silent){
  const d = await (await fetch('/api/cogep/owl/verificacion?_='+Date.now())).json();
  if(d.owl_hash) document.getElementById('ov-owl-hash').textContent = 'OWL: '+String(d.owl_hash).slice(0,10);
  document.getElementById('ov-checks').innerHTML =
    `<div style="margin-bottom:.3rem">Consistencia estructural: <b style="color:${d.consistente?'#10e98c':'#ff4d6d'}">${d.consistente?'✓ CONSISTENTE':'✖ INCONSISTENTE'}</b></div>`+
    (d.checks||[]).map(c=>`<div style="margin-bottom:.2rem"><span style="color:${c.ok?'#10e98c':(c.id==='C7'?'#ff9a3c':'#ff4d6d')}">${c.ok?'✓':(c.id==='C7'?'⚠':'✖')}</span> <b>${c.id}</b> ${wfEsc(c.descripcion)}`+
      (c.detalles&&c.detalles.length?`<br><span style="font-family:var(--font-mono);font-size:.56rem;color:var(--t3)">${c.detalles.slice(0,5).map(wfEsc).join(' · ')}</span>`:'')+'</div>').join('')+
    `<div style="font-size:.56rem;color:var(--t3);margin-top:.3rem">${wfEsc(d.nota||'')}</div>`;
  if(!silent) ovCq();
}
async function ovCq(){
  const d = await (await fetch('/api/cogep/cq?_='+Date.now())).json();
  document.getElementById('ov-cq-n').textContent = `CQ: ${d.responden}/${d.n} responden`;
  document.getElementById('ov-cqs').innerHTML = (d.cqs||[]).map(c=>
    `<details style="margin-bottom:.3rem;border:1px solid var(--bdr);border-radius:8px;padding:.35rem .55rem">
      <summary style="cursor:pointer;font-size:.64rem"><span style="color:${c.responde?'#10e98c':'#ff4d6d'}">${c.responde?'✓':'✖'}</span> <b>${c.id}</b> ${wfEsc(c.pregunta)}</summary>
      <div style="font-family:var(--font-mono);font-size:.56rem;color:var(--t3);margin:.3rem 0">SPARQL: ${wfEsc(c.sparql||'—')}</div>
      <pre style="font-size:.56rem;color:var(--t2);white-space:pre-wrap;margin:0">${wfEsc(JSON.stringify(c.respuesta,null,1))}</pre>
    </details>`).join('');
}

// ── Carga inicial de esta página ────────────────────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo ontología COGEP…' },
    { id: 's2', label: 'Construyendo grafo de conocimiento…' },
    { id: 's3', label: 'Actualizando interfaz…' },
  ], async () => {
    step('s1', 'active');
    await Promise.resolve();
    step('s1', 'done'); step('s2', 'active');
    await initCogepTab();
    step('s2', 'done'); step('s3', 'active');
    cogepLoadValidezChip();
    step('s3', 'done');
  });
};
