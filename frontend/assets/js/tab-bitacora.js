// ═══════════════════════════════════════════════════════════════════
//  tab-bitacora.js — Página Bitácora · Evidencia (08). Requiere core.js.
//  Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

let bitacoraLoaded = false;
const bitEsc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function initBitacoraTab(){
  loadEvidenceRuns();
  loadBitacora();
  if(!bitacoraLoaded){
    bitacoraLoaded = true;
    try{
      const p = await (await fetch('/api/evidence/protocolo?_='+Date.now())).json();
      if(p.text){
        const resumen = p.text.split('\n').filter(l=>l.startsWith('## ')).map(l=>l.replace('## ','')).join(' · ');
        document.getElementById('ev-protocolo').innerHTML =
          '<b style="color:var(--t2)">Fases y secciones:</b> '+bitEsc(resumen)+
          ' — documento completo en <span class="src-file">/data/evidence/PROTOCOLO.md</span>';
      }
    }catch(e){ /* protocolo opcional */ }
  }
}

async function loadEvidenceRuns(selectLast=true){
  try{
    const d = await (await fetch('/api/evidence/runs?_='+Date.now())).json();
    const sel = document.getElementById('ev-run-sel');
    document.getElementById('ev-runs-badge').textContent = d.count+' corridas';
    sel.innerHTML = d.count
      ? d.runs.map(r=>`<option value="${bitEsc(r.run_id)}">${bitEsc(r.run_id)} · ${r.n_ok??'?'}/${r.n_total??'?'} OK</option>`).join('')
      : '<option value="">— sin corridas aún —</option>';
    if(d.count){ sel.value = d.runs[d.runs.length-1].run_id; if(selectLast) loadEvidenceManifest(sel.value); }
    else document.getElementById('ev-manifest').innerHTML =
      '<div style="color:var(--t3);font-size:.7rem;padding:.6rem">Aún no hay evidencia capturada. Pulsa <b>📸 Capturar evidencia</b> (o ejecuta <span class="src-file">tools/scraper_cj.py</span>).</div>';
  }catch(e){
    document.getElementById('ev-status').innerHTML = '<span style="color:#ff4d6d">✗ '+bitEsc(e.message)+'</span>';
  }
}

async function loadEvidenceManifest(run){
  if(!run) return;
  try{
    const m = await (await fetch('/api/evidence/manifest?run='+encodeURIComponent(run)+'&_='+Date.now())).json();
    if(m.error) throw new Error(m.error);
    document.getElementById('ev-mf-badge').textContent = m.run_id+' · '+m.n_ok+'/'+m.n_total+' OK';
    const rows = (m.entries||[]).map(e=>{
      const st = e.excluida ? '<span style="color:var(--t3)">EXCLUIDA</span>'
               : e.ok ? '<span style="color:#10e98c">✓ '+(e.status||'')+'</span>'
               : '<span style="color:#ff4d6d">✗ '+bitEsc(e.error||'error')+'</span>';
      const sha = e.sha256 ? `<span title="${bitEsc(e.sha256)}" style="cursor:help">${bitEsc(e.sha256.slice(0,16))}…</span>` : '—';
      const ver = e.verificacion==='INTEGRO' ? ' <span style="color:#10e98c">INTEGRO</span>'
                : e.verificacion==='ALTERADO' ? ' <span style="color:#ff4d6d">ALTERADO</span>'
                : e.verificacion==='FALTANTE' ? ' <span style="color:#ff4d6d">FALTANTE</span>' : '';
      const view = e.ok ? `<span onclick="viewSnapshot('${bitEsc(m.run_id)}','${bitEsc(e.slug)}')" style="cursor:pointer;color:var(--cyan)">ver</span>` : '';
      return `<tr>
        <td class="dt-primary">
          <span class="dt-primary-title" style="color:var(--gold)">${bitEsc(e.slug)}</span>
          <a class="dt-primary-meta" href="${bitEsc(e.url)}" target="_blank" rel="noopener" style="display:block;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${bitEsc(e.label||e.url)}</a>
        </td>
        <td>${st}${ver}</td>
        <td class="dt-num">${e.bytes?(e.bytes/1024).toFixed(1)+' KB':'—'}</td>
        <td style="font-size:.62rem;color:var(--t3)">${sha}</td>
        <td>${(e.dimensiones||[]).join(' ')}</td>
        <td>${view}</td></tr>`;
    }).join('');
    document.getElementById('ev-manifest').innerHTML =
      `<div style="font-size:.62rem;color:var(--t3);margin-bottom:.4rem">capturada: ${bitEsc(m.captured_at||'—')} · UA: ${bitEsc(m.user_agent||'—')}</div>
      <table class="dtable" style="font-family:var(--font-mono)">
        <thead><tr>
          <th>slug · fuente</th>
          <th>estado</th><th class="dt-num">tamaño</th>
          <th>sha-256</th><th>dim</th>
          <th></th></tr></thead><tbody>${rows}</tbody></table>`;
  }catch(e){
    document.getElementById('ev-manifest').innerHTML = '<div style="color:#ff4d6d;font-size:.7rem;padding:.6rem">✗ '+bitEsc(e.message)+'</div>';
  }
}

async function viewSnapshot(run, slug){
  try{
    const d = await (await fetch('/api/evidence/snapshot?run='+encodeURIComponent(run)+'&slug='+encodeURIComponent(slug)+'&_='+Date.now())).json();
    if(d.error) throw new Error(d.error);
    document.getElementById('ev-snap-title').textContent = run+'/'+slug+'.html · '+(d.bytes/1024).toFixed(1)+' KB · sha256 '+d.sha256.slice(0,24)+'…';
    document.getElementById('ev-snap-body').textContent = d.preview;
    document.getElementById('ev-snap-preview').style.display = 'block';
  }catch(e){ alert('Snapshot: '+e.message); }
}

async function runEvidenceCapture(){
  const btn = document.getElementById('ev-capture-btn'), st = document.getElementById('ev-status');
  btn.disabled = true; btn.style.opacity = .6;
  st.innerHTML = '<span style="color:#ffc947">⟳ Capturando snapshots de las fuentes semilla…</span>';
  try{
    const m = await (await fetch('/api/evidence/capture', {method:'POST'})).json();
    if(m.error) throw new Error(m.error);
    st.innerHTML = '<span style="color:#10e98c">✓ Corrida '+bitEsc(m.run_id)+': '+m.n_ok+'/'+m.n_total+' fuentes con snapshot + SHA-256.</span>';
    await loadEvidenceRuns(); loadBitacora();
  }catch(e){
    st.innerHTML = '<span style="color:#ff4d6d">✗ '+bitEsc(e.message)+'</span>';
  }finally{ btn.disabled = false; btn.style.opacity = 1; }
}

async function runEvidenceVerify(){
  const st = document.getElementById('ev-status');
  const run = document.getElementById('ev-run-sel').value;
  if(!run){ st.innerHTML = '<span style="color:#ffc947">△ No hay corrida que verificar.</span>'; return; }
  st.innerHTML = '<span style="color:#00e5ff">⟳ Re-calculando SHA-256 de los snapshots…</span>';
  try{
    const v = await (await fetch('/api/evidence/verify?run='+encodeURIComponent(run)+'&_='+Date.now())).json();
    if(v.error) throw new Error(v.error);
    // Inyectar el resultado por slug en la tabla actual
    const m = await (await fetch('/api/evidence/manifest?run='+encodeURIComponent(run)+'&_='+Date.now())).json();
    const byslug = {}; (v.resultados||[]).forEach(r=>byslug[r.slug]=r.estado);
    (m.entries||[]).forEach(e=>{ if(byslug[e.slug] && byslug[e.slug]!=='SIN_SNAPSHOT') e.verificacion = byslug[e.slug]; });
    document.getElementById('ev-mf-badge').textContent = m.run_id+' · '+m.n_ok+'/'+m.n_total+' OK';
    st.innerHTML = v.integra
      ? '<span style="color:#10e98c">✓ Evidencia ÍNTEGRA: todos los snapshots coinciden con el manifest.</span>'
      : '<span style="color:#ff4d6d">✗ Evidencia COMPROMETIDA: hay snapshots alterados o faltantes.</span>';
    // re-render con columna de verificación
    const cache = m; // reutiliza el render normal
    document.getElementById('ev-run-sel').value = run;
    renderManifestWithVerification(cache);
    loadBitacora();
  }catch(e){ st.innerHTML = '<span style="color:#ff4d6d">✗ '+bitEsc(e.message)+'</span>'; }
}

function renderManifestWithVerification(m){
  // reusa loadEvidenceManifest pintando desde el objeto ya anotado
  const evm = document.getElementById('ev-manifest');
  const tmp = loadEvidenceManifest; // no-op guard
  // render inline (mismo formato que loadEvidenceManifest)
  const rows = (m.entries||[]).map(e=>{
    const st = e.excluida ? '<span style="color:var(--t3)">EXCLUIDA</span>'
             : e.ok ? '<span style="color:#10e98c">✓ '+(e.status||'')+'</span>'
             : '<span style="color:#ff4d6d">✗ '+bitEsc(e.error||'error')+'</span>';
    const ver = e.verificacion==='INTEGRO' ? ' <span style="color:#10e98c">INTEGRO</span>'
              : e.verificacion==='ALTERADO' ? ' <span style="color:#ff4d6d">ALTERADO</span>'
              : e.verificacion==='FALTANTE' ? ' <span style="color:#ff4d6d">FALTANTE</span>' : '';
    const sha = e.sha256 ? bitEsc(e.sha256.slice(0,16))+'…' : '—';
    const view = e.ok ? `<span onclick="viewSnapshot('${bitEsc(m.run_id)}','${bitEsc(e.slug)}')" style="cursor:pointer;color:var(--cyan)">ver</span>` : '';
    return `<tr>
      <td class="dt-primary">
        <span class="dt-primary-title" style="color:var(--gold)">${bitEsc(e.slug)}</span>
        <a class="dt-primary-meta" href="${bitEsc(e.url)}" target="_blank" rel="noopener" style="display:block;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${bitEsc(e.label||e.url)}</a>
      </td>
      <td>${st}${ver}</td>
      <td class="dt-num">${e.bytes?(e.bytes/1024).toFixed(1)+' KB':'—'}</td>
      <td style="font-size:.62rem;color:var(--t3)">${sha}</td>
      <td>${(e.dimensiones||[]).join(' ')}</td>
      <td>${view}</td></tr>`;
  }).join('');
  evm.innerHTML =
    `<div style="font-size:.62rem;color:var(--t3);margin-bottom:.4rem">capturada: ${bitEsc(m.captured_at||'—')} · UA: ${bitEsc(m.user_agent||'—')}</div>
    <table class="dtable" style="font-family:var(--font-mono)">
      <thead><tr>
        <th>slug · fuente</th>
        <th>estado · verificación</th><th class="dt-num">tamaño</th>
        <th>sha-256</th><th>dim</th>
        <th></th></tr></thead><tbody>${rows}</tbody></table>`;
}

async function loadBitacora(){
  try{
    const d = await (await fetch('/api/bitacora?_='+Date.now())).json();
    document.getElementById('bit-count').textContent = d.count+' entradas';
    const chain = document.getElementById('bit-chain');
    chain.textContent = 'cadena: '+(d.cadena_integra?'íntegra ✓':'ROTA en #'+d.primer_registro_roto);
    chain.style.color = d.cadena_integra ? '#10e98c' : '#ff4d6d';
    const colors = {sistema:'#00e5ff', manual:'#ffc947'};
    document.getElementById('bit-log').innerHTML = d.count
      ? d.entries.slice().reverse().map(e=>`
        <div style="border-left:2px solid ${colors[e.tipo]||'#b060ff'};padding:.45rem .7rem;margin-bottom:.55rem;
                    background:rgba(255,255,255,.025);border-radius:0 8px 8px 0">
          <div style="display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap">
            <span style="font-family:var(--font-mono);font-size:.66rem;color:${colors[e.tipo]||'#b060ff'}">
              #${e.id} · ${bitEsc(e.accion)}</span>
            <span style="font-family:var(--font-mono);font-size:.6rem;color:var(--t3)">${bitEsc(e.ts)} UTC</span>
          </div>
          <div style="font-size:.7rem;color:var(--t2);margin:.2rem 0">${bitEsc(e.detalle)}</div>
          <div style="font-family:var(--font-mono);font-size:.56rem;color:var(--t3)">
            ${bitEsc(e.actor)} · hash ${bitEsc(e.hash)} ← ${bitEsc(e.prev_hash)}
            ${(e.refs&&e.refs.length)?' · refs: '+e.refs.map(bitEsc).join(', '):''}</div>
        </div>`).join('')
      : '<div style="color:var(--t3);font-size:.7rem;padding:.6rem">Bitácora vacía. Se asentará automáticamente la primera captura de evidencia.</div>';
  }catch(e){
    document.getElementById('bit-log').innerHTML = '<div style="color:#ff4d6d;font-size:.7rem;padding:.6rem">✗ '+bitEsc(e.message)+'</div>';
  }
}

async function addBitacoraEntry(){
  const st = document.getElementById('bit-status');
  const payload = {
    actor:   document.getElementById('bit-actor').value.trim(),
    accion:  document.getElementById('bit-accion').value.trim(),
    detalle: document.getElementById('bit-detalle').value.trim(),
  };
  if(!payload.accion && !payload.detalle){
    st.innerHTML = '<span style="color:#ffc947">△ Escribe al menos la acción o el detalle.</span>'; return;
  }
  try{
    const r = await (await fetch('/api/bitacora', {method:'POST',
      headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})).json();
    if(r.error) throw new Error(r.error);
    st.innerHTML = '<span style="color:#10e98c">✓ Asentada #'+r.entry.id+' (hash '+r.entry.hash+').</span>';
    document.getElementById('bit-accion').value=''; document.getElementById('bit-detalle').value='';
    loadBitacora();
  }catch(e){ st.innerHTML = '<span style="color:#ff4d6d">✗ '+bitEsc(e.message)+'</span>'; }
}


// ── Carga inicial de esta página ────────────────────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo bitácora y evidencia…' },
  ], async () => {
    step('s1', 'active');
    await initBitacoraTab();
    step('s1', 'done');
  });
};
