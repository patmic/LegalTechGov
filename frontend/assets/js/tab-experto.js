// ═══════════════════════════════════════════════════════════════════
//  tab-experto.js — Página Validación Experta (10). Requiere core.js.
//  Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

// Escapado HTML — en dashboard.html lo definía la página Adaptativo
// (misma constante); esta página también lo usa, así que se declara aquí.
const adEsc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const evState = {causas:null, filas:null, gold:null};
async function evInit(){
  const [g, rep] = await Promise.all([
    (await fetch('/api/eval/gold?_='+Date.now())).json(),
    (await fetch('/api/eval/report?_='+Date.now())).json()
  ]);
  evState.gold = g;
  document.getElementById('ev-progreso').textContent = g.n+' anotadas · '+Object.keys(g.anotadores||{}).length+' anotador(es)';
  const chip = document.getElementById('ev-chip');
  chip.textContent = rep.chip || 'sin validez medida';
  chip.style.color = rep.disponible ? (rep.apto ? '#10e98c' : '#ff9a3c') : '#ffc947';
  if(rep.disponible) evRenderReport(rep);
  const sel = document.getElementById('ev-causa');
  if(sel && sel.options.length===0){
    const ex = await (await fetch('/api/expedientes')).json();
    sel.innerHTML = '<option value="">— seleccione causa a anotar —</option>'+
      (ex.files||[]).map(f=>`<option value="${adEsc(f.file)}">${adEsc(f.label)}</option>`).join('');
  }
}
async function evLoadCausa(){
  const file = document.getElementById('ev-causa').value;
  if(!file){ document.getElementById('ev-filas').innerHTML=''; return; }
  const d = await (await fetch('/api/eval/causa?file='+encodeURIComponent(file))).json();
  evState.filas = d;
  const actos = (evState.gold?.actos_catalogo)||[];
  document.getElementById('ev-filas').innerHTML = (d.filas||[]).map(f=>{
    const prev = f.anotacion||{};
    const opts = '<option value="">—</option>'+actos.map(a=>
      `<option value="${adEsc(a.id)}" ${prev.acto_correcto===a.id?'selected':''}>${adEsc(a.id)} · ${adEsc(a.nombre)}</option>`).join('')+
      `<option value="ninguno" ${prev.acto_correcto==='ninguno'?'selected':''}>ninguno / fuera de frontera</option>`;
    const vopts = ['','CUMPLE','ALERTA','INCUMPLE','NO_EVALUABLE'].map(v=>
      `<option value="${v}" ${prev.veredicto_correcto===v?'selected':''}>${v||'— veredicto —'}</option>`).join('');
    return `<div style="border-bottom:1px dashed rgba(255,255,255,.08);padding:.35rem 0">
      <div style="display:flex;justify-content:space-between;gap:.5rem;font-size:.64rem">
        <span style="color:var(--t1)"><b>#${f.seq}</b> ${adEsc(f.actividad)}</span>
        <span style="font-family:var(--font-mono);color:var(--t3);white-space:nowrap">${adEsc(f.fecha)}</span></div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.25rem;align-items:center">
        <select data-ev-acto="${f.seq}" class="app-select" style="font-size:.6rem">${opts}</select>
        <select data-ev-ver="${f.seq}" class="app-select" style="font-size:.6rem">${vopts}</select>
        <span style="font-family:var(--font-mono);font-size:.56rem;color:var(--t3)" title="Predicción del sistema (solo referencia)">sistema: ${adEsc(f.acto_predicho)}</span>
        ${prev.anotador?`<span class="pbadge g" style="font-size:.52rem">✓ ${adEsc(prev.anotador)}</span>`:''}
      </div></div>`;
  }).join('');
}
async function evGuardar(){
  const st = document.getElementById('ev-status');
  const anotador = document.getElementById('ev-anotador').value.trim();
  if(!anotador){ st.textContent='Indique el nombre del anotador.'; st.style.color='#ff9a3c'; return; }
  if(!evState.filas){ st.textContent='Seleccione una causa.'; st.style.color='#ff9a3c'; return; }
  const anotaciones = [];
  (evState.filas.filas||[]).forEach(f=>{
    const acto = document.querySelector(`[data-ev-acto="${f.seq}"]`)?.value;
    const ver  = document.querySelector(`[data-ev-ver="${f.seq}"]`)?.value;
    if(acto) anotaciones.push({file:evState.filas.file, seq:f.seq, actividad:f.actividad,
      procedimiento:evState.filas.procedimiento, acto_correcto:acto, veredicto_correcto:ver||null});
  });
  if(!anotaciones.length){ st.textContent='No hay actos seleccionados.'; st.style.color='#ff9a3c'; return; }
  const r = await fetch('/api/eval/gold',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({anotador, anotaciones})});
  const d = await r.json();
  st.textContent = d.ok ? `✓ ${d.guardadas} anotaciones guardadas (gold total: ${d.total}) — en bitácora.` : ('Error: '+JSON.stringify(d));
  st.style.color = d.ok ? '#10e98c' : '#ff4d6d';
  evInit();
}
async function evRun(){
  const out = document.getElementById('ev-result');
  out.innerHTML = 'Evaluando contra el gold standard…';
  const d = await (await fetch('/api/eval/run',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).json();
  if(d.error){ out.innerHTML = '<span style="color:#ff9a3c">'+adEsc(d.error)+'</span>'; return; }
  evRenderReport(d); evInit();
}
function evRenderReport(d){
  const out = document.getElementById('ev-result');
  const col = v => v>=0.85?'#10e98c':(v>=0.6?'#ff9a3c':'#ff4d6d');
  const labels = d.labels||[];
  const conf = d.matriz_confusion||{};
  const mini = labels.length<=9 ? `<div style="overflow-x:auto;margin-top:.4rem"><table style="border-collapse:collapse;font-family:var(--font-mono);font-size:.54rem">
    <tr><td></td>${labels.map(l=>`<td style="padding:.15rem .3rem;color:var(--t3)" title="${adEsc(l)}">${adEsc(l.replace('act_','').slice(0,5))}</td>`).join('')}</tr>
    ${labels.map(g=>`<tr><td style="padding:.15rem .3rem;color:var(--t3)" title="${adEsc(g)}">${adEsc(g.replace('act_','').slice(0,5))}</td>`+
      labels.map(p=>{const v=(conf[g]||{})[p]||0; const bg=v?(g===p?'rgba(16,233,140,.25)':'rgba(255,77,109,.25)'):'transparent';
        return `<td style="padding:.15rem .3rem;text-align:center;background:${bg};color:var(--t1)">${v||'·'}</td>`;}).join('')+'</tr>').join('')}
  </table><span style="font-size:.54rem;color:var(--t3)">filas = gold (abogado) · columnas = predicción del sistema</span></div>` : '';
  out.innerHTML =
    `<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem">
      <span class="pbadge d">N=${d.n_anotaciones}</span>
      <span class="pbadge d" style="color:${col(d.macro.f1)}">F1 ${d.macro.f1}</span>
      <span class="pbadge d">precisión ${d.macro.precision}</span>
      <span class="pbadge d">recall ${d.macro.recall}</span>
      <span class="pbadge d">exactitud ${d.exactitud_mapeo}</span>
      ${d.veredicto&&d.veredicto.n?`<span class="pbadge d">veredicto ${d.veredicto.exactitud} (n=${d.veredicto.n})</span>`:''}
      ${d.kappa?`<span class="pbadge d">κ=${d.kappa.valor} (${d.kappa.n_comunes} comunes)</span>`:''}
    </div>
    <div style="font-family:var(--font-mono);font-size:.62rem;color:${d.apto?'#10e98c':'#ff9a3c'}">
      ${d.apto?'✓ APTO':'⚠ NO APTO'} según umbral F1 ≥ ${d.f1_min_aceptado} (configurable en Supuestos)</div>
    ${mini}
    ${(d.errores||[]).length?`<div style="margin-top:.4rem;font-size:.6rem;color:var(--t3)">Errores (${d.errores.length}): ${d.errores.slice(0,5).map(e=>adEsc(e.actividad||'').slice(0,30)+': '+adEsc(e.gold)+'→'+adEsc(e.prediccion)).join(' · ')}${d.errores.length>5?' …':''}</div>`:''}`;
}

// ═══ Cambio Normativo (A2) + Muestra (A5) ═══
// Se movieron a tab-adaptativo.js: su markup (nm-*, mu-*) vive en
// adaptativo.html, que nunca cargó este archivo — nmLoad()/muLoad()
// eran ReferenceError silenciosos en cada carga de esa página (uno de
// ellos abortaba adRefresh() a mitad de camino). Ver tab-adaptativo.js.

// ═══ AHP / Sensibilidad / Rúbrica (tab Validación) ═══
async function vzLoadAhp(){
  const el = document.getElementById('vz-psi-badge'); if(!el) return;
  const d = await (await fetch('/api/ahp?_='+Date.now())).json();
  el.textContent = `Ψ: root ${d.psi.root} · subs ${d.psi.subs}`;
  const sel = document.getElementById('vz-saaty');
  if(sel && sel.options.length===0){
    const ops = [['9','9 — raíz extremadamente más importante'],['7','7 — muy fuertemente'],['5','5 — fuertemente'],['3','3 — moderadamente'],['1','1 — igual importancia'],
                 ['0.3333','1/3 — subconceptos moderadamente más'],['0.2','1/5 — subconceptos fuertemente más']];
    sel.innerHTML = ops.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('');
    sel.value = '1';
  }
  document.getElementById('vz-ahp-info').innerHTML =
    `Procedencia: <b style="color:var(--cyan)">${d.procedencia}</b><br>`+
    (d.expertos||[]).map(e=>`▪ ${e.experto}: saaty ${e.saaty} → root ${e.root}`).join('<br>');
  vzLoadRubrica();
}
async function vzGuardarAhp(){
  const experto = document.getElementById('vz-experto').value.trim();
  const info = document.getElementById('vz-ahp-info');
  if(!experto){ info.innerHTML='<span style="color:#ff9a3c">Indique el nombre del experto.</span>'; return; }
  const d = await (await fetch('/api/ahp',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({experto, saaty:+document.getElementById('vz-saaty').value})})).json();
  if(d.error){ info.innerHTML='<span style="color:#ff9a3c">'+d.error+'</span>'; return; }
  info.innerHTML = `<span style="color:#10e98c">✓ Juicio registrado.</span> Pesos agregados: root ${d.agregado.root} / subs ${d.agregado.subs} (${d.n_expertos} experto(s)). El radar usa estos pesos al recargar.`;
  vzLoadAhp();
}
async function vzSensibilidad(){
  const out = document.getElementById('vz-sens');
  out.innerHTML = 'Perturbando pesos ±10/20% y recalculando el radar…';
  const d = await (await fetch('/api/sensibilidad?_='+Date.now())).json();
  const maxDt = Math.max(...d.tornado.map(t=>t.overall_dt||0), 1);
  out.innerHTML = `<div style="font-family:var(--font-mono);font-size:.58rem;color:var(--t3);margin-bottom:.3rem">SCORE GLOBAL DT vs peso Ψ_root (base ${d.psi_base_root})</div>`+
    d.tornado.map(t=>`<div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.15rem">
      <span style="font-family:var(--font-mono);font-size:.58rem;color:var(--t3);width:36px">${t.delta_pct>0?'+':''}${t.delta_pct}%</span>
      <div style="flex:1;height:10px;background:rgba(255,255,255,.05);border-radius:5px;overflow:hidden">
        <div style="height:100%;width:${(t.overall_dt/maxDt*100).toFixed(1)}%;background:${t.delta_pct===0?'#00e5ff':'#a855f7'}"></div></div>
      <span style="font-family:var(--font-mono);font-size:.6rem;color:var(--t1);width:34px;text-align:right">${t.overall_dt}</span></div>`).join('')+
    `<div style="margin-top:.35rem;font-size:.62rem">
      Radar estable ±10%: <b style="color:${d.radar_estable_10pct?'#10e98c':'#ff4d6d'}">${d.radar_estable_10pct?'SÍ':'NO'}</b> (desv. máx ${d.max_desviacion_overall})<br>
      Top-1 del ranking estable ±20%: <b style="color:${d.ranking.estable_20pct?'#10e98c':'#ff4d6d'}">${d.ranking.estable_20pct?'SÍ':'NO'}</b> (${d.ranking.top1_base})</div>`;
}
const vzEsc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let vzRub = null;
async function vzLoadRubrica(){
  vzRub = await (await fetch('/api/rubrica?_='+Date.now())).json();
  const sel = document.getElementById('vz-dim');
  const dims = Object.keys(vzRub.rubrica?.dimensiones||{});
  if(sel && sel.options.length===0)
    sel.innerHTML = dims.map(k=>`<option value="${k}">${k} · ${vzEsc(vzRub.rubrica.dimensiones[k].label)}</option>`).join('');
  vzShowRubrica();
}
function vzShowRubrica(){
  if(!vzRub) return;
  const k = document.getElementById('vz-dim').value;
  const dim = (vzRub.rubrica?.dimensiones||{})[k]; if(!dim) return;
  const evs = (vzRub.evidencias||{})[k]||[];
  document.getElementById('vz-ev-n').textContent = evs.length+' evidencias';
  document.getElementById('vz-rubrica').innerHTML =
    dim.niveles.map(n=>`<div style="margin-bottom:.2rem"><b style="color:var(--gold)">${n.nivel}</b> — ${vzEsc(n.criterio)}</div>`).join('')+
    (evs.length? `<div style="margin-top:.3rem;border-top:1px dashed rgba(255,255,255,.1);padding-top:.3rem">`+
      evs.map(e=>`<div style="font-size:.58rem">📎 <a href="${vzEsc(e.url||'#')}" target="_blank" style="color:var(--cyan)">${vzEsc((e.url||e.snapshot_ref||'').slice(0,50))}</a> · ${vzEsc(e.criterio_rubrica||'')}</div>`).join('')+'</div>'
      : '<div style="margin-top:.3rem;font-size:.58rem;color:#ff9a3c">⚠ Sin evidencia registrada → score "declarado"</div>');
}
async function vzAddEvidencia(){
  const st = document.getElementById('vz-ev-status');
  const url = document.getElementById('vz-ev-url').value.trim();
  if(!url){ st.textContent='Ingrese URL o referencia de snapshot.'; return; }
  const d = await (await fetch('/api/rubrica/evidencia',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({dimension:document.getElementById('vz-dim').value, url,
      criterio:document.getElementById('vz-ev-crit').value.trim(), actor:'usuario-experto'})})).json();
  st.textContent = d.ok ? `✓ Evidencia ${d.n} registrada para ${d.dimension} — en bitácora.` : ('Error: '+JSON.stringify(d));
  document.getElementById('vz-ev-url').value='';
  vzLoadRubrica();
}

// ═══ Verificación Ontológica (tab COGEP) ═══
// Se movió a tab-cogep.js: sus botones y su markup (ov-owl-hash,
// ov-checks, ov-cq-n, ov-cqs) viven en cogep.html, que nunca cargó
// este archivo — cada clic tiraba "ovVerificar/ovCq is not defined"
// en consola sin que nada se pintara. ovLoad() no se llevó: no tenía
// ningún llamador (código muerto) y su única parte viva — el chip de
// validez del razonador — ya la reimplementa por su cuenta
// cogepLoadValidezChip() en tab-cogep.js. Ver tab-cogep.js.

// ═══ TAB VALIDACIÓN EXPERTA ═══
function initExpertoTab(){ evInit(); vzLoadAhp(); exEstado(); xdLoad(); xrLoad(); xvLoad(); }

// ── Punto 3 · Delphi de dimensiones ──
let xdKeys = [];
async function xdLoad(){
  const d = await (await fetch('/api/experto/pesos-dimensiones?_='+Date.now())).json();
  xdKeys = d.keys||[];
  document.getElementById('xd-proc').textContent = d.procedencia;
  const box = document.getElementById('xd-sliders');
  if(box && !box.children.length){
    box.innerHTML = xdKeys.map(k=>`<label style="display:flex;justify-content:space-between;gap:.5rem;align-items:center;font-family:var(--font-mono);font-size:.62rem;color:var(--t2)">
      <span title="${vzEsc(k.label)}">${k.key}</span>
      <input type="number" data-xd="${k.key}" min="1" max="9" step="1" value="5"
        style="width:52px;background:rgba(255,255,255,.06);border:1px solid var(--bdr);border-radius:6px;color:var(--cyan);font-family:var(--font-mono);font-size:.66rem;padding:.2rem .3rem;text-align:center"></label>`).join('');
  }
  const pesos = d.dimensiones||{};
  document.getElementById('xd-pesos').innerHTML = Object.keys(pesos).length ?
    `<div style="font-family:var(--font-mono);font-size:.6rem;color:var(--t3);margin-bottom:.3rem">PESOS AGREGADOS (${(d.expertos||[]).length} experto(s)) — el radar global ya los usa:</div>`+
    xdKeys.map(k=>{const w=pesos[k.key]||0; return `<div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.15rem">
      <span style="font-family:var(--font-mono);font-size:.6rem;width:74px;color:var(--t2)">${k.key}</span>
      <div style="flex:1;height:8px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden"><div style="height:100%;width:${(w*100/0.2).toFixed(0)}%;max-width:100%;background:var(--gold)"></div></div>
      <span style="font-family:var(--font-mono);font-size:.6rem;width:44px;text-align:right;color:var(--gold)">${(w*100).toFixed(1)}%</span></div>`;}).join('')+
    `<div style="font-size:.58rem;color:var(--t3);margin-top:.3rem">Expertos: ${(d.expertos||[]).map(e=>vzEsc(e.experto)).join(', ')}</div>`
    : '<span style="font-size:.64rem;color:var(--t3)">Sin ponderaciones aún — el radar usa promedio simple de las 10 dimensiones.</span>';
}
async function xdGuardar(){
  const st = document.getElementById('xd-status');
  const experto = document.getElementById('xd-experto').value.trim();
  if(!experto){ st.textContent='Indique el nombre del experto.'; st.style.color='#ff9a3c'; return; }
  const ratings = {};
  document.querySelectorAll('[data-xd]').forEach(i=>ratings[i.getAttribute('data-xd')] = +i.value);
  const d = await (await fetch('/api/experto/pesos-dimensiones',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({experto, ratings})})).json();
  if(d.error){ st.textContent='⚠ '+d.error; st.style.color='#ff9a3c'; return; }
  st.textContent = `✓ Ponderación registrada (${d.n_expertos} experto(s)) — radar recalculado con pesos Delphi.`;
  st.style.color='#10e98c'; xdLoad();
}

// ── Punto 4 · Doble evaluación con rúbrica ──
async function xrLoad(){
  const d = await (await fetch('/api/experto/rubrica-eval?_='+Date.now())).json();
  document.getElementById('xr-n').textContent = (d.evaluaciones||[]).length+' evaluadores';
  const box = document.getElementById('xr-inputs');
  if(box && !box.children.length){
    box.innerHTML = (d.keys||[]).map(k=>`<label style="display:flex;justify-content:space-between;gap:.5rem;align-items:center;font-family:var(--font-mono);font-size:.62rem;color:var(--t2)">
      <span title="${vzEsc(k.label)}">${k.key}</span>
      <select data-xr="${k.key}" class="app-select" style="font-size:.62rem;width:70px">
        ${[0,25,50,75,100].map(v=>`<option value="${v}" ${v===50?'selected':''}>${v}</option>`).join('')}
      </select></label>`).join('');
  }
  const conc = d.concordancia_pares||[], vsS = d.vs_sistema||[];
  document.getElementById('xr-conc').innerHTML =
    ((d.evaluaciones||[]).length ? `<div style="font-family:var(--font-mono);font-size:.6rem;color:var(--t3);margin-bottom:.3rem">CONCORDANCIA (Spearman ρ — ≥0.7 sustancial):</div>`+
      conc.map(p=>`<div>▪ ${vzEsc(p.a)} ↔ ${vzEsc(p.b)}: <b style="color:${(p.spearman??0)>=0.7?'#10e98c':'#ff9a3c'}">${p.spearman??'n/d'}</b></div>`).join('')+
      (vsS.length?`<div style="margin-top:.3rem;font-family:var(--font-mono);font-size:.6rem;color:var(--t3)">FRENTE AL SISTEMA (scores de la ontología):</div>`+
        vsS.map(p=>`<div>▪ ${vzEsc(p.experto)} ↔ sistema: <b style="color:${(p.spearman??0)>=0.7?'#10e98c':'#ff9a3c'}">${p.spearman??'n/d'}</b></div>`).join(''):'')+
      `<div style="font-size:.58rem;color:var(--t3);margin-top:.3rem">${vzEsc(d.nota||'')}</div>`
    : '<span style="font-size:.64rem;color:var(--t3)">Aún sin evaluaciones. Se necesitan ≥2 evaluadores para la concordancia.</span>');
}
async function xrGuardar(){
  const st = document.getElementById('xr-status');
  const experto = document.getElementById('xr-experto').value.trim();
  if(!experto){ st.textContent='Indique el nombre del evaluador.'; st.style.color='#ff9a3c'; return; }
  const scores = {};
  document.querySelectorAll('[data-xr]').forEach(i=>scores[i.getAttribute('data-xr')] = +i.value);
  const d = await (await fetch('/api/experto/rubrica-eval',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({experto, scores})})).json();
  if(d.error){ st.textContent='⚠ '+d.error; st.style.color='#ff9a3c'; return; }
  st.textContent = `✓ Evaluación registrada (${d.n_evaluadores} evaluador(es)) — en bitácora.`;
  st.style.color='#10e98c'; xrLoad();
}

// ── Punto 5 · Verificación externa ──
async function xvLoad(){
  const d = await (await fetch('/api/experto/verificacion-externa?_='+Date.now())).json();
  const regs = (d.registros||[]).slice().reverse();
  document.getElementById('xv-n').textContent = regs.length+' registros';
  document.getElementById('xv-lista').innerHTML = regs.map(r=>{
    const ok = r.resultado==='consistente';
    const warn = String(r.resultado||'').startsWith('pitfalls_menores');
    return `<div style="border-left:3px solid ${ok?'#10e98c':(warn?'#ff9a3c':'#ff4d6d')};background:rgba(255,255,255,.03);border-radius:0 8px 8px 0;padding:.4rem .6rem;margin-bottom:.35rem;font-size:.62rem">
      <b style="color:var(--t1)">${vzEsc(r.herramienta)} ${vzEsc(r.version||'')}</b> → <b style="color:${ok?'#10e98c':(warn?'#ff9a3c':'#ff4d6d')}">${vzEsc(r.resultado)}</b><br>
      ${r.detalle?vzEsc(r.detalle)+'<br>':''}
      <span style="font-family:var(--font-mono);font-size:.56rem;color:var(--t3)">${vzEsc(String(r.ts||'').slice(0,16).replace('T',' '))} · ${vzEsc(r.actor||'')} · owl:${vzEsc(String(r.owl_hash||'—').slice(0,10))}${r.url_informe?` · <a href="${vzEsc(r.url_informe)}" target="_blank" style="color:var(--cyan)">informe</a>`:''}</span>
    </div>`;}).join('') || '<span style="font-size:.64rem;color:var(--t3)">— sin verificaciones externas asentadas —</span>';
}
async function xvGuardar(){
  const st = document.getElementById('xv-status');
  const d = await (await fetch('/api/experto/verificacion-externa',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({herramienta:document.getElementById('xv-herr').value,
      version:document.getElementById('xv-ver').value.trim(),
      resultado:document.getElementById('xv-res').value,
      detalle:document.getElementById('xv-det').value.trim(),
      url:document.getElementById('xv-url').value.trim(), actor:'usuario-experto'})})).json();
  if(d.error){ st.textContent='⚠ '+d.error; st.style.color='#ff9a3c'; return; }
  st.textContent='✓ Verificación asentada en bitácora con el hash del OWL vigente.'; st.style.color='#10e98c';
  document.getElementById('xv-det').value=''; document.getElementById('xv-url').value='';
  xvLoad();
}
async function exEstado(){
  try{
    const d = await (await fetch('/api/experto/estado?_='+Date.now())).json();
    document.getElementById('ex-estado').textContent =
      `gold: ${d.gold_reales} reales + ${d.gold_simuladas} sim · AHP: ${d.ahp_reales} reales + ${d.ahp_simulados} sim`;
    document.getElementById('ex-sim-banner').style.display = d.hay_simulacion ? 'block' : 'none';
  }catch(e){}
}
async function exSimular(){
  const st = document.getElementById('ex-sim-status');
  st.textContent = 'Generando sesión simulada (anotaciones + AHP + evaluación)…'; st.style.color='var(--t3)';
  try{
    const d = await (await fetch('/api/experto/simulacion',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({accion:'crear'})})).json();
    if(d.error){ st.textContent='Error: '+d.error; st.style.color='#ff4d6d'; return; }
    st.textContent = `✓ ${d.anotaciones} anotaciones + ${d.segundo_anotador} del 2º anotador + ${d.ahp_expertos} juicios AHP · `+
      `F1=${d.eval.f1} sobre N=${d.eval.n}`+(d.eval.kappa?` · κ=${d.eval.kappa.valor}`:'')+` — ${d.aviso}`;
    st.style.color='#ff9a3c';
    initExpertoTab();
  }catch(e){ st.textContent='Error: '+e; st.style.color='#ff4d6d'; }
}
async function exLimpiar(){
  const st = document.getElementById('ex-sim-status');
  st.textContent = 'Eliminando datos simulados…'; st.style.color='var(--t3)';
  try{
    const d = await (await fetch('/api/experto/simulacion',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({accion:'limpiar'})})).json();
    st.textContent = `✓ ${d.anotaciones_eliminadas} anotaciones simuladas eliminadas; juicios AHP simulados y reporte de evaluación descartados. Listo para la sesión real.`;
    st.style.color='#10e98c';
    document.getElementById('ev-result').innerHTML=''; document.getElementById('vz-sens').innerHTML='';
    const chip=document.getElementById('ev-chip'); chip.textContent='sin validez medida'; chip.style.color='#ffc947';
    initExpertoTab();
  }catch(e){ st.textContent='Error: '+e; st.style.color='#ff4d6d'; }
}

// ═══ TAB TESIS · métricas en vivo ═══

// ── Carga inicial de esta página ────────────────────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo validación experta (gold standard, AHP, rúbrica)…' },
  ], async () => {
    step('s1', 'active');
    initExpertoTab();
    step('s1', 'done');
  });
};
