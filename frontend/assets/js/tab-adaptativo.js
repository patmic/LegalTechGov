// ═══════════════════════════════════════════════════════════════════
//  tab-adaptativo.js — Página Adaptativo · MAPE-K (09). Requiere core.js.
//  Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

const adState = {cfg:null, fer:null, rk:null, al:null, initialized:false};
const adEsc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function initAdaptativoTab(){ adRefresh(!adState.initialized); adState.initialized = true; }

async function adRefresh(full=true){
  try{
    const [cfg, fer] = await Promise.all([
      (await fetch('/api/adaptativo/config?_='+Date.now())).json(),
      (await fetch('/api/adaptativo/feriados?_='+Date.now())).json()
    ]);
    adState.cfg = cfg; adState.fer = fer;
    adRenderConfig(); adRenderFeriados();
    await adLoadRanking();          // incluye salud-global (KPIs)
    await adLoadAlertas();
    await adLoadTrace();
    adLoadSupuestos(); nmLoad(); muLoad();
  }catch(e){
    const st = document.getElementById('ad-cfg-status');
    if(st){ st.textContent = 'Error al cargar la capa adaptativa: '+e; st.style.color = '#ff4d6d'; }
  }
}

// ── Config de métricas (pesos definidos por el usuario) ────────────
function adRenderConfig(){
  const c = adState.cfg || {}; const w = c.pesos_ranking || {};
  const set = (id,v)=>{ const e=document.getElementById(id); if(e) e.value = v; };
  set('ad-w-salud', Math.round((w.salud??.5)*100));
  set('ad-w-var',   Math.round((w.variabilidad??.25)*100));
  set('ad-w-drift', Math.round((w.drift??.25)*100));
  set('ad-w-emp',   Math.round((c.peso_empirico_radar??.5)*100));
  set('ad-u-loop',  (c.umbrales||{}).loop_k ?? 3);
  set('ad-u-gap',   (c.umbrales||{}).gap_referencial_dias ?? 60);
  const upd = document.getElementById('ad-cfg-upd');
  if(upd) upd.textContent = c.actualizado ? ('guardado '+String(c.actualizado).slice(0,10)) : 'valores por defecto';
  adPesosPreview();
}

function adPesosPreview(){
  const g = id => +document.getElementById(id).value;
  const s=g('ad-w-salud'), v=g('ad-w-var'), d=g('ad-w-drift'), tot=Math.max(1,s+v+d);
  document.getElementById('ad-w-salud-v').textContent = Math.round(100*s/tot)+'%';
  document.getElementById('ad-w-var-v').textContent   = Math.round(100*v/tot)+'%';
  document.getElementById('ad-w-drift-v').textContent = Math.round(100*d/tot)+'%';
  document.getElementById('ad-w-emp-v').textContent   = g('ad-w-emp')+'%';
}

async function adSaveConfig(){
  const g = id => +document.getElementById(id).value;
  const st = document.getElementById('ad-cfg-status');
  st.textContent = 'Guardando y recalculando…'; st.style.color = 'var(--t3)';
  try{
    const r = await fetch('/api/adaptativo/config', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({actor:'usuario-ui',
        pesos_ranking:{salud:g('ad-w-salud'), variabilidad:g('ad-w-var'), drift:g('ad-w-drift')},
        peso_empirico_radar: g('ad-w-emp')/100,
        umbrales:{loop_k:g('ad-u-loop'), gap_referencial_dias:g('ad-u-gap')}})});
    const d = await r.json();
    if(d.ok){ adState.cfg = d.config; adRenderConfig();
      st.textContent = '✓ Métricas guardadas y asentadas en bitácora — ranking recalculado.'; st.style.color = '#10e98c';
      await adLoadRanking(); await adLoadAlertas(); await adLoadTrace();
    } else { st.textContent = 'Error: '+JSON.stringify(d); st.style.color = '#ff4d6d'; }
  }catch(e){ st.textContent = 'Error: '+e; st.style.color = '#ff4d6d'; }
}

// ── Feriados / suspensiones (calendario editable) ───────────────────
function adRenderFeriados(){
  const f = adState.fer || {feriados:[],suspensiones:[]};
  document.getElementById('ad-fer-count').textContent =
    (f.feriados||[]).length+' feriados · '+(f.suspensiones||[]).length+' suspensiones';
  document.getElementById('ad-fer-list').innerHTML = (f.feriados||[]).map((x,i)=>
    `<div style="display:flex;justify-content:space-between;gap:.5rem;font-family:var(--font-mono);font-size:.66rem;padding:.14rem 0;border-bottom:1px dashed rgba(255,255,255,.06)">
      <span style="color:var(--gold)">${adEsc(x.fecha)}</span>
      <span style="flex:1;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${adEsc(x.motivo)}</span>
      <span onclick="adDelFeriado(${i})" style="cursor:pointer;color:#ff4d6d" title="Eliminar">✕</span></div>`).join('')
    || '<span style="font-size:.66rem;color:var(--t3)">— sin feriados —</span>';
  document.getElementById('ad-sus-list').innerHTML = (f.suspensiones||[]).map((x,i)=>
    `<div style="display:flex;justify-content:space-between;gap:.5rem;font-family:var(--font-mono);font-size:.66rem;padding:.14rem 0;border-bottom:1px dashed rgba(255,255,255,.06)">
      <span style="color:var(--cyan)">${adEsc(x.desde)} → ${adEsc(x.hasta)}</span>
      <span style="flex:1;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${adEsc(x.motivo)}</span>
      <span onclick="adDelSuspension(${i})" style="cursor:pointer;color:#ff4d6d" title="Eliminar">✕</span></div>`).join('')
    || '<span style="font-size:.66rem;color:var(--t3)">— sin suspensiones de término —</span>';
}
function adAddFeriado(){
  const fecha = document.getElementById('ad-fer-fecha').value;
  const motivo = document.getElementById('ad-fer-motivo').value.trim() || 'feriado (usuario)';
  if(!fecha) return;
  adState.fer.feriados = adState.fer.feriados || [];
  adState.fer.feriados.push({fecha, motivo, ambito:'nacional', fuente:'usuario-ui'});
  adState.fer.feriados.sort((a,b)=>a.fecha.localeCompare(b.fecha));
  document.getElementById('ad-fer-motivo').value=''; adRenderFeriados();
}
function adDelFeriado(i){ adState.fer.feriados.splice(i,1); adRenderFeriados(); }
function adAddSuspension(){
  const desde = document.getElementById('ad-sus-desde').value, hasta = document.getElementById('ad-sus-hasta').value;
  const motivo = document.getElementById('ad-sus-motivo').value.trim() || 'suspensión de término (usuario)';
  if(!desde || !hasta || hasta < desde) return;
  adState.fer.suspensiones = adState.fer.suspensiones || [];
  adState.fer.suspensiones.push({desde, hasta, motivo});
  document.getElementById('ad-sus-motivo').value=''; adRenderFeriados();
}
function adDelSuspension(i){ adState.fer.suspensiones.splice(i,1); adRenderFeriados(); }

async function adSaveFeriados(){
  const st = document.getElementById('ad-fer-status');
  st.textContent = 'Guardando calendario y recomputando términos…'; st.style.color = 'var(--t3)';
  try{
    const r = await fetch('/api/adaptativo/feriados', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({actor:'usuario-ui', feriados: adState.fer.feriados||[], suspensiones: adState.fer.suspensiones||[]})});
    const d = await r.json();
    if(d.ok){ st.textContent = `✓ ${d.feriados} feriados y ${d.suspensiones} suspensiones activos — dictámenes recalculados con el nuevo calendario.`; st.style.color = '#10e98c';
      await adLoadRanking(); await adLoadAlertas(); await adLoadTrace();
    } else { st.textContent = 'Error: '+JSON.stringify(d); st.style.color = '#ff4d6d'; }
  }catch(e){ st.textContent = 'Error: '+e; st.style.color = '#ff4d6d'; }
}

// ── Ranking por proceso ──────────────────────────────────────────────
async function adLoadRanking(){
  const sel = document.getElementById('ad-rk-proc');
  const proc = sel ? sel.value : '';
  const d = await (await fetch('/api/adaptativo/ranking?proc='+encodeURIComponent(proc)+'&_='+Date.now())).json();
  adState.rk = d;
  // KPIs
  document.getElementById('ad-k-indice').textContent = d.indice_global!=null ? d.indice_global : '—';
  document.getElementById('ad-k-causas').textContent = (d.por_procedimiento||[]).reduce((a,p)=>a+p.n_causas,0);
  document.getElementById('ad-k-peso').textContent = Math.round(100*(adState.cfg?.peso_empirico_radar??.5))+'%';
  document.getElementById('ad-ciclo-ts').textContent = 'ciclo: '+String((d.contexto_adaptacion||{}).timestamp||'—').replace('T',' ').replace('Z','');
  document.getElementById('ad-disclaimer').textContent = d.disclaimer||'';
  // selector de procesos
  if(sel && sel.options.length <= 1){
    sel.innerHTML = '<option value="">Todos los procesos</option>'+
      (d.procedimientos||[]).map(p=>`<option value="${adEsc(p)}" ${p===proc?'selected':''}>${adEsc(p)}</option>`).join('');
  }
  document.getElementById('ad-rk-n').textContent = d.n+' causas';
  const w = d.pesos||{};
  document.getElementById('ad-rk-formula').textContent =
    `riesgo = ${(w.salud??.5).toFixed(2)}·(100−salud) + ${(w.variabilidad??.25).toFixed(2)}·IVF + ${(w.drift??.25).toFixed(2)}·IDP — pesos definidos por el usuario`;
  // tabla
  const rows = (d.ranking||[]).map(r=>{
    const col = r.riesgo>=60?'#ff4d6d':(r.riesgo>=30?'#ff9a3c':'#10e98c');
    return `<tr onclick="adShowDetail('${adEsc(r.file)}','${adEsc(r.juicio)}')" style="cursor:pointer">
      <td style="color:var(--t3)">#${r.rank}</td>
      <td class="dt-primary">
        <span class="dt-primary-title" style="font-family:var(--font-mono);color:var(--cyan)">${adEsc(r.juicio)}</span>
        <span class="dt-primary-meta">${adEsc(r.procedimiento)}</span>
      </td>
      <td class="dt-num">${r.salud??'—'}</td>
      <td class="dt-num">${r.ivf}</td>
      <td class="dt-num">${r.idp}</td>
      <td class="dt-num dt-emphasis" style="color:${col}">${r.riesgo}</td>
      <td style="text-align:center">${r.incumplimientos?('🔴'+r.incumplimientos):''}${r.fuera_de_frontera?(' 🟡'+r.fuera_de_frontera):''}</td>
    </tr>`;}).join('');
  document.getElementById('ad-rk-table').innerHTML = `<table class="dtable">
    <thead><tr>
      <th>#</th><th>Causa</th>
      <th class="dt-num">Salud</th><th class="dt-num">IVF</th>
      <th class="dt-num">IDP</th><th class="dt-num dt-emphasis">Riesgo ▼</th>
      <th>⚑</th></tr></thead><tbody>${rows}</tbody></table>`;
  // KPI salud media desde por_procedimiento
  const pp=(d.por_procedimiento||[]); let sm=null;
  const withS = pp.filter(p=>p.salud_media!=null);
  if(withS.length) sm = Math.round(withS.reduce((a,p)=>a+p.salud_media*p.n_causas,0)/withS.reduce((a,p)=>a+p.n_causas,0)*10)/10;
  document.getElementById('ad-k-salud').textContent = sm??'—';
}

async function adShowDetail(file, juicio){
  const box = document.getElementById('ad-rk-detail'), body = document.getElementById('ad-rk-detail-body');
  document.getElementById('ad-rk-detail-title').textContent = 'Causa '+juicio+' — variabilidad y deriva';
  box.style.display = 'block'; body.innerHTML = 'Cargando…';
  const [v, dr] = await Promise.all([
    (await fetch('/api/adaptativo/variabilidad?file='+encodeURIComponent(file))).json(),
    (await fetch('/api/adaptativo/drift?file='+encodeURIComponent(file))).json()
  ]);
  const sev = s => s==='critica'?'#ff4d6d':(s==='alta'?'#ff9a3c':'#ffc947');
  body.innerHTML =
    `<b style="color:var(--gold)">M1 · IVF ${v.ivf}</b> — ${v.actos_canonicos} actos canónicos (${adEsc(v.procedimiento)}), `+
    `faltan: ${(v.actos_faltantes||[]).map(adEsc).join(', ')||'ninguno'}.<br>`+
    ((v.fuera_de_frontera||[]).length?`<span style="color:#ffc947">Fuera de frontera ontológica (guardrail M4):</span> ${(v.fuera_de_frontera||[]).map(x=>adEsc(x.actividad)+' ('+x.veces+'×)').join(' · ')}<br>`:'')+
    `<b style="color:#ff9a3c">M2 · IDP ${dr.idp}</b> — ${dr.n_findings} hallazgo(s):<br>`+
    ((dr.findings||[]).map(f=>`<span style="color:${sev(f.severidad)}">▪ [${f.tipo}${f.articulo?(' · '+adEsc(f.articulo)):''}]</span> ${adEsc(f.detalle)}`).join('<br>')||'— sin hallazgos de deriva —')+
    `<br><i style="color:var(--t3);font-size:.62rem">${adEsc(dr.disclaimer||'')}</i>`;
}

// ── Alertas (seguridad cognitiva M6) ─────────────────────────────────
async function adLoadAlertas(){
  adState.al = await (await fetch('/api/adaptativo/alertas?_='+Date.now())).json();
  const pn = adState.al.por_nivel||{};
  document.getElementById('ad-k-criticas').textContent = pn.critica??0;
  document.getElementById('ad-k-alertas-d').textContent = (pn.alta??0)+' altas · '+(pn.media??0)+' medias';
  adRenderAlertas();
}
function adRenderAlertas(){
  const nivel = document.getElementById('ad-al-nivel').value;
  const all = (adState.al?.alertas)||[];
  const list = nivel ? all.filter(a=>a.nivel===nivel) : all;
  document.getElementById('ad-al-n').textContent = list.length+' / '+all.length;
  const col = {critica:'#ff4d6d', alta:'#ff9a3c', media:'#ffc947'};
  const ico = {critica:'🔴', alta:'🟠', media:'🟡'};
  document.getElementById('ad-al-list').innerHTML = list.slice(0,150).map(a=>
    `<div style="border-left:3px solid ${col[a.nivel]||'#888'};background:rgba(255,255,255,.03);border-radius:0 8px 8px 0;padding:.5rem .7rem;margin-bottom:.45rem">
      <div style="display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap">
        <b style="font-size:.7rem;color:var(--t1)">${ico[a.nivel]||''} ${adEsc(a.titulo)}</b>
        <span style="font-family:var(--font-mono);font-size:.62rem;color:var(--cyan)">${adEsc(a.juicio)}</span></div>
      <div style="font-size:.66rem;color:var(--t2);margin-top:.15rem">${adEsc(a.hecho)}</div>
      <div style="font-family:var(--font-mono);font-size:.6rem;color:var(--t3);margin-top:.15rem">Fundamento: ${adEsc(a.fundamento)}</div>
    </div>`).join('') || '<span style="font-size:.7rem;color:var(--t3)">— sin alertas para este filtro —</span>';
}

// ── Trazabilidad (M5) ────────────────────────────────────────────────
async function adLoadTrace(){
  const d = await (await fetch('/api/bitacora?_='+Date.now())).json();
  const ad = (d.entries||[]).filter(e=>e.tipo==='adaptacion').reverse();
  document.getElementById('ad-tr-n').textContent = ad.length+' eventos · cadena '+(d.cadena_integra?'✔ íntegra':'✖ rota');
  const ctx = (adState.rk||{}).contexto_adaptacion||{};
  document.getElementById('ad-tr-ctx').innerHTML =
    `contexto vigente → kb:${adEsc(String(ctx.kb_hash||'').slice(0,10))} · feriados:${adEsc(String(ctx.feriados_hash||'').slice(0,10))} · `+
    `config:${adEsc(String(ctx.config_hash||'').slice(0,10))} · razonador:${adEsc(ctx.razonador_version||'—')} · ${adEsc(String(ctx.timestamp||''))}`;
  document.getElementById('ad-tr-log').innerHTML = ad.slice(0,20).map(e=>
    `<div style="display:flex;gap:.6rem;font-size:.66rem;padding:.3rem 0;border-bottom:1px dashed rgba(255,255,255,.06)">
      <span style="font-family:var(--font-mono);color:var(--t3);white-space:nowrap">${adEsc(String(e.ts||'').slice(0,16).replace('T',' '))}</span>
      <span style="color:#10e98c;font-family:var(--font-mono)">${adEsc(e.accion)}</span>
      <span style="flex:1;color:var(--t2)">${adEsc(e.detalle)}</span>
      <span style="font-family:var(--font-mono);color:var(--t3)">#${adEsc(String(e.hash||'').slice(0,8))}</span>
    </div>`).join('') || '<span style="font-size:.7rem;color:var(--t3)">— aún sin eventos de adaptación —</span>';
}

// ═══ Cambio Normativo (A2) ═══
// Movido aquí desde tab-experto.js: su markup (nm-*) vive en esta
// página, que nunca cargaba ese archivo. adRefresh() ya llamaba
// nmLoad() sin await (línea de arriba) esperando que existiera de
// forma global — con ambos archivos separados por página, esa llamada
// tiraba ReferenceError y abortaba el resto del try/catch de
// adRefresh() (incluida la llamada a muLoad() que le seguía).
const nmState = {data:null};
async function nmLoad(){
  const d = await (await fetch('/api/adaptativo/kb-changelog?_='+Date.now())).json();
  nmState.data = d;
  document.getElementById('nm-kbv').textContent = 'KB v'+(d.version||'1.0');
  const sel = document.getElementById('nm-regla');
  sel.innerHTML = (d.reglas||[]).map(r=>`<option value="${adEsc(r.id)}">${adEsc(r.id)} · ${adEsc(r.nombre)}</option>`).join('');
  nmShowRegla(); nmTimeline();
}
function nmShowRegla(){
  const rid = document.getElementById('nm-regla').value;
  const r = (nmState.data?.reglas||[]).find(x=>x.id===rid);
  document.getElementById('nm-regla-info').innerHTML = r ?
    `Vigente: <b style="color:var(--cyan)">${r.termino_dias} días hábiles</b> · ${adEsc(r.articulo)} COGEP · aplica a ${adEsc((r.procedimientos||[]).join(', '))} · ${r.versiones} versión(es)` : '';
}
function nmTimeline(){
  const c = (nmState.data?.cambios||[]).slice().reverse();
  document.getElementById('nm-timeline').innerHTML = c.map(x=>
    `<div style="border-left:3px solid #60a5fa;background:rgba(255,255,255,.03);border-radius:0 8px 8px 0;padding:.4rem .6rem;margin-bottom:.35rem;font-size:.62rem">
      <b style="color:var(--cyan)">${adEsc(x.regla_id)}</b>: término <s style="color:#ff4d6d">${x.antes}</s> → <b style="color:#10e98c">${x.despues}</b> días
      · vigente desde ${adEsc(x.vigencia_desde)}<br>
      <span style="font-family:var(--font-mono);font-size:.56rem;color:var(--t3)">${adEsc(x.fuente?.tipo||'')}: ${adEsc(x.fuente?.ref||'')} · ${adEsc(String(x.ts||'').slice(0,10))} · ${adEsc(x.actor||'')} · KB v${adEsc(x.kb_version||'')}</span>
    </div>`).join('') || '<span style="font-size:.64rem;color:var(--t3)">— sin cambios normativos registrados —</span>';
}
async function nmRegistrar(){
  const st = document.getElementById('nm-status');
  const body = {regla_id: document.getElementById('nm-regla').value,
    termino_dias_nuevo: +document.getElementById('nm-termino').value,
    vigencia_desde: document.getElementById('nm-vigencia').value,
    fuente_tipo: document.getElementById('nm-tipo').value,
    fuente_ref: document.getElementById('nm-ref').value.trim(),
    motivo: document.getElementById('nm-motivo').value.trim(), actor:'usuario-experto'};
  const d = await (await fetch('/api/adaptativo/kb-cambio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();
  if(d.error){ st.textContent='⚠ '+d.error; st.style.color='#ff9a3c'; return; }
  st.textContent = `✓ Cambio registrado (KB v${d.kb_version}) — el razonador aplicará ${body.termino_dias_nuevo} días a actos desde ${body.vigencia_desde}.`;
  st.style.color='#10e98c';
  await nmLoad(); await adLoadRanking(); await adLoadAlertas(); await adLoadTrace();
}
async function nmImpacto(){
  const out = document.getElementById('nm-impacto');
  out.innerHTML = 'Re-evaluando el corpus con la regla anterior vs la nueva…';
  const d = await (await fetch('/api/adaptativo/impacto?_='+Date.now())).json();
  if(d.error){ out.innerHTML='<span style="color:#ff9a3c">'+adEsc(d.error)+'</span>'; return; }
  out.innerHTML = `<b style="color:var(--cyan)">Impacto del último cambio (${adEsc(d.cambio.regla_id)}: ${d.cambio.antes}→${d.cambio.despues} días)</b><br>
    ${d.causas_evaluadas} causas evaluadas · <b style="color:${d.causas_afectadas?'#ff9a3c':'#10e98c'}">${d.causas_afectadas} cambian de dictamen</b><br>`+
    (d.deltas||[]).slice(0,8).map(x=>`▪ ${adEsc(x.juicio)}: ${x.dias} días → <s>${adEsc(x.antes)}</s> <b style="color:#ff9a3c">${adEsc(x.despues)}</b>`).join('<br>')+
    `<div style="font-size:.56rem;color:var(--t3);margin-top:.3rem">${adEsc(d.disclaimer||'')}</div>`;
}

// ═══ Muestra (A5) ═══
// Movido aquí desde tab-experto.js por el mismo motivo: su markup
// (mu-*) vive en esta página.
async function muLoad(){
  const d = await (await fetch('/api/adaptativo/muestra?_='+Date.now())).json();
  document.getElementById('mu-n').textContent = d.n+' causas';
  document.getElementById('mu-decl').textContent = d.declaracion||'';
  const tabla = (titulo, obj) => `<div><div style="font-family:var(--font-mono);font-size:.6rem;color:var(--t3);margin-bottom:.3rem">${titulo}</div>
    <table class="dtable">`+
    Object.entries(obj||{}).slice(0,8).map(([k,v])=>`<tr>
      <td style="color:var(--t2)">${adEsc(k)}</td><td class="dt-num" style="color:var(--cyan);font-family:var(--font-mono)">${v}</td></tr>`).join('')+'</table></div>';
  document.getElementById('mu-tablas').innerHTML =
    tabla('POR PROCEDIMIENTO', d.por_procedimiento) + tabla('POR PROVINCIA', d.por_provincia) +
    tabla('POR AÑO', d.por_anio) + tabla('POR MATERIA', d.por_materia);
}

// ═══ Sub-navegación ═══
function adGoto(id){ const e=document.getElementById(id); if(e){ e.scrollIntoView({behavior:'smooth',block:'start'});
  e.style.outline='2px solid rgba(255,201,71,.6)'; setTimeout(()=>e.style.outline='',1600); } }

// ═══ Panel de Supuestos (min-max) ═══
async function adLoadSupuestos(){
  const d = await (await fetch('/api/adaptativo/supuestos?_='+Date.now())).json();
  adState.sup = d;
  document.getElementById('ad-su-upd').textContent = d.actualizado ? ('actualizado '+String(d.actualizado).slice(0,10)+' por '+(d.actor||'—')) : 'defaults del sistema';
  const rows = (d.supuestos||[]).map(s=>`<tr>
    <td style="font-family:var(--font-mono);font-size:.6rem;color:var(--t3)">${adEsc(s.grupo)}</td>
    <td class="dt-primary">
      <span class="dt-primary-title">${adEsc(s.nombre)}</span>
      <span class="dt-primary-meta">${adEsc(s.descripcion)}</span>
    </td>
    <td style="text-align:center"><input type="number" data-su="${adEsc(s.clave)}" value="${s.valor??''}"
        min="${s.min}" max="${s.max}" step="${s.paso}"
        style="width:76px;background:rgba(255,255,255,.06);border:1px solid var(--bdr);border-radius:6px;color:var(--cyan);font-family:var(--font-mono);font-size:.68rem;padding:.25rem .35rem;text-align:center"></td>
    <td style="font-family:var(--font-mono);font-size:.6rem;color:var(--gold);white-space:nowrap">[${s.min} – ${s.max}]</td>
    <td style="font-family:var(--font-mono);font-size:.58rem;color:var(--t3)">${adEsc(s.procedencia||'')}</td>
  </tr>`).join('');
  document.getElementById('ad-su-table').innerHTML = `<table class="dtable">
    <thead><tr>
    <th>Grupo</th><th>Supuesto</th>
    <th style="text-align:center">Valor</th><th>Rango</th>
    <th>Procedencia</th></tr></thead><tbody>${rows}</tbody></table>`;
  guRenderSupuestos();
}
async function adSaveSupuestos(){
  const st = document.getElementById('ad-su-status');
  const valores = {};
  document.querySelectorAll('[data-su]').forEach(i=>{ if(i.value!=='') valores[i.getAttribute('data-su')] = +i.value; });
  st.textContent = 'Validando y aplicando…'; st.style.color='var(--t3)';
  try{
    const r = await fetch('/api/adaptativo/supuestos',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({actor:'usuario-experto', valores})});
    const d = await r.json();
    const nR = Object.keys(d.rechazados||{}).length;
    st.textContent = `✓ ${Object.keys(d.aplicados||{}).length} aplicados` + (nR?` · ⚠ ${nR} rechazados: ${JSON.stringify(d.rechazados)}`:'') + ' — asentado en bitácora.';
    st.style.color = nR ? '#ff9a3c' : '#10e98c';
    await adLoadSupuestos(); await adLoadRanking(); await adLoadAlertas(); await adLoadTrace();
  }catch(e){ st.textContent='Error: '+e; st.style.color='#ff4d6d'; }
}

// ═══ Validez IA (A1) ═══

// ── Carga inicial de esta página ────────────────────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo configuración adaptativa…' },
    { id: 's2', label: 'Calculando índice empírico y alertas…' },
  ], async () => {
    step('s1', 'active');
    await initAdaptativoTab();
    step('s1', 'done'); step('s2', 'done');
  });
};
