// ═══════════════════════════════════════════════════════════════════
//  sdtcj-render.js — Render compartido del SDT_CJ (gemelo digital del
//  Consejo de la Judicatura) usado por dos páginas: Gemelo Digital (dt.html,
//  panel 'Dimensiones de Gobernanza' embebido) y Esfera Celeste 3D
//  (simulacion.html, al inspeccionar un nodo escaneado).
//  Requiere core.js cargado antes (usa wfEsc/isDark).
//  Extraído verbatim de frontend/dashboard.html.
// ═══════════════════════════════════════════════════════════════════

const SDTCJ_STATUS = {active:'#10e98c', partial:'#ffc947', planned:'#60a5fa', legacy:'#ff4d6d', absent:'#ff4d6d'};
const SDTCJ_STLBL  = {active:'Operativo', partial:'Parcial', planned:'Planificado', legacy:'Heredado', absent:'Ausente'};

function sdtcjLevelColor(score){
  if(score>=81) return '#10e98c'; if(score>=61) return '#22d3ee';
  if(score>=41) return '#ffc947'; if(score>=21) return '#ff9a3c'; return '#ff4d6d';
}

function renderSdtCjGraph(d, target){
  const wrap = document.getElementById(target||'sdtcj-graph');
  if(!wrap) return;
  const W = d.canvas?.width||1136, H = d.canvas?.height||706;
  const colors = d.colorTypes||{};
  const dark = (typeof isDark!=='undefined') ? isDark : true;
  // coerce numeric geometry defensively (evita NaN → solapamiento en x=0)
  (d.services||[]).forEach(s=>{ s.x=+s.x||0; s.y=+s.y||0; s.width=+s.width||140; s.height=+s.height||46; });
  const svcMap = {}; (d.services||[]).forEach(s=>svcMap[s.id]=s);
  const bg = dark?'#080d1a':'#fff', lyrTxt = dark?'#2a3d5c':'#9aa8c0', boxFill = dark?'#0d1525':'#fff';

  let h = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;max-width:${W}px;display:block">
    <defs><marker id="sca" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,.5 L6,3.5 L0,6.5 Z" fill="${dark?'#1a2744':'#b0bcd4'}"/></marker>
      <marker id="scad" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,.5 L6,3.5 L0,6.5 Z" fill="${dark?'#1a2744':'#b0bcd4'}" opacity=".5"/></marker></defs>
    <rect width="${W}" height="${H}" fill="${bg}" rx="6"/>`;
  (d.layers||[]).forEach(l=>{
    h += `<rect x="${l.x}" y="${l.y}" width="${l.width}" height="${l.height}" fill="${dark?(l.fill||'#0a1020'):'#f2f4f8'}" rx="4" stroke="${dark?'#1a2744':'#d0d6e4'}" stroke-width=".5"/>
      <text x="${l.x+l.width/2}" y="${l.y+16}" text-anchor="middle" fill="${lyrTxt}" font-size="7" font-family="monospace" letter-spacing="1">${l.label}</text>`;
  });
  (d.connections||[]).forEach(c=>{
    const f=svcMap[c.from], t=svcMap[c.to]; if(!f||!t) return;
    const x1=f.x+f.width, y1=f.y+f.height/2, x2=t.x, y2=t.y+t.height/2, cx=(x1+x2)/2;
    const col=colors[f.colorType]||'#64748b', dash=c.style==='dashed';
    h += `<path d="M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}" fill="none" stroke="${col}${dash?'2a':'40'}" stroke-width="${dash?1:1.3}" stroke-dasharray="${dash?'5,3':''}" marker-end="url(#${dash?'scad':'sca'})"/>`;
  });
  (d.services||[]).forEach(s=>{
    const c=colors[s.colorType]||'#64748b';
    const sc=SDTCJ_STATUS[s.status]||'#64748b';
    const refStr=(Array.isArray(s.maltg_ref)?s.maltg_ref.join(', '):(s.maltg_ref||'')).replace(/"/g,"'").replace(/</g,'&lt;');
    const desc=(s.description||'').replace(/"/g,"'").replace(/</g,'&lt;');
    const ev=(s.evidence||'').replace(/"/g,"'").replace(/</g,'&lt;');
    const dim=s.dimension||'';
    const absent=(s.status==='absent');
    h += `<g class="scb" style="cursor:pointer" data-desc="${desc}" data-maltg="${refStr}" data-col="${c}" data-lbl="${s.label}" data-st="${SDTCJ_STLBL[s.status]||s.status}" data-ev="${ev}" data-dim="${dim}">
      <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="5" fill="${boxFill}" stroke="${c}" stroke-width="1.2" stroke-dasharray="${absent?'4,3':''}" opacity="${absent?.7:1}"/>
      <rect x="${s.x}" y="${s.y}" width="${s.width}" height="3" rx="5" fill="${c}" opacity=".8"/>
      <text x="${s.x+s.width/2}" y="${s.y+18}" text-anchor="middle" fill="${c}" font-size="8.5" font-family="monospace" font-weight="700">${s.label}</text>
      <text x="${s.x+s.width/2}" y="${s.y+29}" text-anchor="middle" fill="${dark?'#5a6e8e':'#7a8db0'}" font-size="7" font-family="monospace">${s.subtitle||''}</text>
      <circle cx="${s.x+s.width-9}" cy="${s.y+11}" r="3" fill="${sc}"/></g>`;
  });
  h += `<text x="8" y="${H-7}" fill="${lyrTxt}" font-size="7.5" font-family="monospace">SDT_CJ · ${(d.meta?.title||'').slice(0,70)} · ${d.meta?.maltg_compliance||''}</text></svg>`;
  wrap.innerHTML = h;

  // tooltip reuse (#dtt)
  const tt = document.getElementById('dtt');
  wrap.querySelectorAll('.scb').forEach(el=>{
    el.addEventListener('mouseover',()=>{
      const x=el.dataset; if(!tt) return; tt.style.display='block';
      tt.innerHTML = `<div style="color:${x.col};font-weight:700;font-size:.74rem;margin-bottom:3px">${x.lbl} <span style="font-size:.55rem;color:var(--t3)">· ${x.st}${x.dim?' · '+x.dim:''}</span></div>
        <div style="color:var(--t2);font-size:.62rem;line-height:1.5;margin-bottom:3px">${x.desc}</div>
        ${x.ev?`<div style="font-size:.58rem;color:#10e98c;margin-bottom:2px">📎 ${x.ev}</div>`:''}
        ${x.maltg?`<div style="font-size:.58rem;color:var(--t3)">MALTG: <span style="color:${x.col}">${x.maltg}</span></div>`:''}`;
    });
    el.addEventListener('mousemove',e=>{ if(!tt) return; tt.style.left=(e.clientX+14)+'px'; tt.style.top=(e.clientY-10)+'px'; });
    el.addEventListener('mouseout',()=>{ if(tt) tt.style.display='none'; });
  });
}

const _sdtcjRadars = {};
function renderSdtCjRadar(d, target){
  const id = target||'sdtcj-radar';
  const cv = document.getElementById(id); if(!cv || typeof Chart==='undefined') return;
  const dims = d.dimensions||[];
  const labels = dims.map(x=>x.id+' · '+x.label.split('(')[0].trim());
  const scores = dims.map(x=>x.score);
  if(_sdtcjRadars[id]){ _sdtcjRadars[id].destroy(); _sdtcjRadars[id]=null; }
  _sdtcjRadars[id] = new Chart(cv.getContext('2d'), {
    type:'radar',
    data:{ labels, datasets:[{
      label:'Madurez LegalTech (0–100)', data:scores,
      backgroundColor:'rgba(0,229,255,.18)', borderColor:'#00e5ff', borderWidth:2,
      pointBackgroundColor:scores.map(s=>sdtcjLevelColor(s)), pointRadius:4 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{ r:{ min:0, max:100, ticks:{ stepSize:20, color:'#5a6e8e', backdropColor:'transparent', font:{size:9} },
        grid:{ color:'rgba(120,140,180,.18)' }, angleLines:{ color:'rgba(120,140,180,.18)' },
        pointLabels:{ color:'#9fb2d4', font:{size:9.5} } } },
      plugins:{ legend:{ labels:{ color:'#9fb2d4', font:{size:10} } } } }
  });
}

function renderSdtCjDims(d, target){
  let h='';
  (d.dimensions||[]).forEach(dim=>{
    const c = sdtcjLevelColor(dim.score);
    const find = (dim.findings||[]).map(f=>`<li style="margin-bottom:3px">${f}</li>`).join('');
    const gaps = (dim.gaps||[]).map(g=>`<li style="margin-bottom:3px">${g}</li>`).join('');
    const refs = (dim.maltg_refs||[]).map(r=>`<span style="display:inline-block;background:${c}1a;color:${c};border:1px solid ${c}44;border-radius:4px;padding:1px 6px;margin:2px;font-size:.55rem;font-family:var(--font-mono)">${r}</span>`).join('');
    h += `<div style="border:1px solid var(--bdr);border-left:3px solid ${c};border-radius:8px;padding:.85rem 1rem;margin:.55rem .3rem;background:var(--card,rgba(255,255,255,.02))">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">
        <div style="font-weight:700;color:var(--t1);font-size:.82rem">${dim.id} · ${dim.label}</div>
        <div style="font-family:var(--font-mono);font-weight:800;color:${c};font-size:1.05rem">${dim.score}<span style="font-size:.7rem;color:var(--t3)">/100 · ${dim.level||''}</span></div>
      </div>
      <div style="font-size:.6rem;color:var(--t3);font-family:var(--font-mono);margin:.25rem 0 .4rem">MALTG: ${dim.maltg_layer||''}</div>
      <div style="height:7px;border-radius:5px;background:rgba(120,140,180,.15);overflow:hidden;margin-bottom:.6rem">
        <div style="height:100%;width:${dim.score}%;background:linear-gradient(90deg,${c}99,${c})"></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div><div style="font-size:.62rem;color:#10e98c;font-weight:700;margin-bottom:3px">✓ Hallazgos</div>
          <ul style="margin:0;padding-left:1.1rem;font-size:.66rem;color:var(--t2);line-height:1.45">${find}</ul></div>
        <div><div style="font-size:.62rem;color:#ff9a3c;font-weight:700;margin-bottom:3px">△ Brechas</div>
          <ul style="margin:0;padding-left:1.1rem;font-size:.66rem;color:var(--t2);line-height:1.45">${gaps}</ul></div>
      </div>
      <div style="margin-top:.5rem">${refs}</div>
    </div>`;
  });
  document.getElementById(target||'sdtcj-dims').innerHTML = h ||
    '<div style="padding:.7rem;font-size:.62rem;color:var(--t3)">Este gemelo no define dimensiones de gobernanza (no es un SDT auditado por scraping).</div>';
}

function renderSdtCjDetail(d, target){
  const colors = d.colorTypes||{};
  // group by layer
  const byLayer = {}; (d.layers||[]).forEach(l=>byLayer[l.id]=[]);
  const layerOf = s => {
    let best=null; (d.layers||[]).forEach(l=>{ if(s.x>=l.x-2 && s.x < l.x+l.width) best=l; }); return best?best.id:'_';
  };
  (d.services||[]).forEach(s=>{ const k=layerOf(s); (byLayer[k]=byLayer[k]||[]).push(s); });

  let h = `<div style="overflow-x:auto"><table class="dtable">
    <thead><tr>
      <th>Componente</th>
      <th>Estado</th>
      <th>Dim</th>
      <th>Descripción / Evidencia</th>
      <th>MALTG refs</th>
    </tr></thead><tbody>`;
  (d.layers||[]).forEach(l=>{
    const rows = byLayer[l.id]||[]; if(!rows.length) return;
    h += `<tr><td colspan="5" style="padding:.45rem .65rem;color:var(--cyan);font-family:var(--font-mono);font-size:.62rem;letter-spacing:1px;background:color-mix(in srgb, var(--cyan) 8%, transparent)">▌ ${l.label}</td></tr>`;
    rows.forEach(s=>{
      const c=colors[s.colorType]||'#64748b';
      const sc=SDTCJ_STATUS[s.status]||'#64748b';
      const refs=(Array.isArray(s.maltg_ref)?s.maltg_ref.join(', '):(s.maltg_ref||''));
      h += `<tr>
        <td class="dt-primary">
          <span class="dt-primary-title" style="color:${c}">${s.label}</span>
          ${s.subtitle?`<span class="dt-primary-meta">${s.subtitle}</span>`:''}
        </td>
        <td><span style="color:${sc};font-family:var(--font-mono);font-size:.6rem">● ${SDTCJ_STLBL[s.status]||s.status}</span></td>
        <td style="color:var(--t3);font-family:var(--font-mono)">${s.dimension||'—'}</td>
        <td style="color:var(--t2)">${s.description||''}${s.evidence?`<div style="color:#10e98c;font-size:.58rem;margin-top:2px">📎 ${s.evidence}</div>`:''}</td>
        <td style="color:var(--t3);font-family:var(--font-mono);font-size:.58rem">${refs}</td>
      </tr>`;
    });
  });
  h += `</tbody></table></div>`;

  // sources
  if(d.sources?.length){
    h += `<div style="margin-top:.9rem;padding:.6rem .8rem;border-top:1px solid var(--bdr)">
      <div style="font-size:.62rem;color:var(--t3);font-family:var(--font-mono);margin-bottom:.4rem">FUENTES (${d.sources.length})</div>`;
    d.sources.forEach(s=>{ h += `<div style="font-size:.62rem;margin-bottom:2px"><a href="${s.url}" target="_blank" rel="noopener" style="color:#60a5fa;text-decoration:none">↗ ${s.label}</a></div>`; });
    h += `</div>`;
  }
  // scrape report
  const sr = d.scrape_report;
  if(sr && Object.keys(sr).length){
    const chip=(k,v)=>`<span style="display:inline-block;background:rgba(0,229,255,.08);border:1px solid var(--bdr);border-radius:4px;padding:1px 7px;margin:2px;font-size:.56rem;font-family:var(--font-mono);color:var(--t2)">${k}: <b style="color:${v===true?'#10e98c':(v===false?'#ff9a3c':'#00e5ff')}">${v}</b></span>`;
    h += `<div style="margin-top:.4rem;padding:.6rem .8rem;border-top:1px solid var(--bdr)">
      <div style="font-size:.62rem;color:var(--t3);font-family:var(--font-mono);margin-bottom:.4rem">VERIFICACIÓN DE SCRAPING EN VIVO · ${sr.scanned_at||''}</div>
      ${chip('online', sr.online)}
      ${'wordpress_elementor_confirmado' in sr ? chip('WordPress/Elementor', sr.wordpress_elementor_confirmado):''}
      ${'enlaces_legacy_jsf' in sr ? chip('enlaces .jsf', sr.enlaces_legacy_jsf):''}
      ${'enlaces_legacy_php' in sr ? chip('enlaces .php', sr.enlaces_legacy_php):''}
      ${'satje_spa_confirmado' in sr ? chip('SATJE SPA', sr.satje_spa_confirmado):''}
      ${'referencia_datos_abiertos' in sr ? chip('datos abiertos', sr.referencia_datos_abiertos):''}
      ${'referencia_iso37001' in sr ? chip('ISO 37001', sr.referencia_iso37001):''}
      ${'web_semantica_jsonld_detectada' in sr ? chip('JSON-LD/semántica', sr.web_semantica_jsonld_detectada):''}
      ${'api_publica_detectada' in sr ? chip('API pública', sr.api_publica_detectada):''}
    </div>`;
  }
  document.getElementById(target||'sdtcj-detail').innerHTML = h;
}

