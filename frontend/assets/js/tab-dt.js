// ═══════════════════════════════════════════════════════════════════
//  tab-dt.js — Página Digital Shadow Maturity (05): render del
//  Digital·Shadow + radar de madurez y análisis de brechas.
//  Requiere core.js y sdtcj-render.js.  
// ═══════════════════════════════════════════════════════════════════

let pendingVal = null;
let radarChart = null;
let gapChart = null;

// El panel "Radar de Madurez" ya no tiene selector propio: evalúa siempre el
// gemelo elegido en "❰❰SD❱❱ Digital·Shadow". Esto solo refleja cuál es.
function setValSdtLabel(file){
  setTxt('val-sdt-label', (file || '—').replace(/\.json$/i, ''));
}

// ── Selector del diagrama DT: solo los gemelos de /digitalShadow, es decir los
//    generados por "04 Get Digital Shadow" (dir=digitalShadow). La etiqueta es
//    únicamente el nombre del archivo sin extensión; el value sí conserva el
//    .json porque es lo que espera la API. El título del gemelo va en el
//    tooltip para no alargar la opción. ──
let dtCurrentFile = '';
async function loadDtFiles(){
  const sel = document.getElementById('dt-file-select');
  if(!sel) return;
  try{
    const d = await (await fetch('/api/sdt-files?dir=digitalShadow&_='+Date.now())).json();
    const cur = sel.value || dtCurrentFile || d.default;
    sel.innerHTML = (d.files||[]).map(f=>{
      const name = f.stem || f.file.replace(/\.json$/i,'');
      return `<option value="${f.file}" ${f.file===cur?'selected':''} title="${(f.title||'').replace(/"/g,'&quot;')}">${name}</option>`;
    }).join('') || '<option value="">— sin gemelos en /digitalShadow —</option>';
    // Si el gemelo que se dibujó al arrancar no está en esta lista (p.ej. el
    // sintético de /data/sdt), el navegador selecciona la primera opción SIN
    // disparar 'change', y el lienzo se queda con otro gemelo — o vacío.
    // Forzamos la carga del que realmente quedó seleccionado.
    if(sel.value && sel.value !== dtCurrentFile) await onDtFileChange();
  }catch(e){
    sel.innerHTML = '<option value="">error al listar SDT</option>';
  }
}

// Pinta las secciones estilo SDT_CJ (Dimensiones + Detalle) con los datos del gemelo cargado
function renderDtSdtCjSections(dt){
  try{
    renderSdtCjDims(dt, 'dt-sdtcj-dims');
    renderSdtCjDetail(dt, 'dt-sdtcj-detail');
    setTxt('dt-sdtcj-dims-badge',   `${(dt.dimensions||[]).length} dimensiones`);
    setTxt('dt-sdtcj-detail-badge', `${(dt.services||[]).length} componentes`);
  }catch(e){ console.warn('dt SDT_CJ sections', e); }
}

async function onDtFileChange(){
  const sel = document.getElementById('dt-file-select');
  if(!sel) return;
  const file = sel.value;
  dtCurrentFile = file;
  // 1) Graficar el gemelo seleccionado
  try{
    const dt = await (await fetch('/api/dt-arch?file='+encodeURIComponent(file)+'&_='+Date.now())).json();
    if(dt.error) throw new Error(dt.error);
    setTxt('dt-hash',      dt.hash ? dt.hash.slice(0,8)+'…' : '—');
    setTxt('dt-ts',        new Date().toLocaleTimeString('es-EC',{hour12:false}));
    setTxt('dt-svc-badge', `${(dt.services||[]).length} Servicios`);
    setTxt('dt-ver-badge', `v${dt.meta?.version||'—'}`);
    renderDT(dt);
    renderDtSdtCjSections(dt);   // Dimensiones + Detalle del gemelo seleccionado
  }catch(e){
    const wrap=document.getElementById('dt-wrap');
    if(wrap) wrap.innerHTML=`<div class="err-msg">No se pudo graficar ${file}: ${e.message}</div>`;
  }
  // 2) Evaluar (Radar de Madurez + Análisis GAP) el mismo gemelo
  try{
    const val = await (await fetch('/api/validation?file='+encodeURIComponent(file)+'&_='+Date.now())).json();
    if(!val.error){
      pendingVal = val;
      renderValidationCharts(val);
      setTxt('val-ts', new Date().toLocaleTimeString('es-EC',{hour12:false}));
      setValSdtLabel(file);      // el panel de Validación refleja el mismo gemelo
    }
  }catch(e){ console.warn('validation:', e); }
}

function maltgRefStr(ref){
  if(Array.isArray(ref)) return ref.join(', ');
  return ref || '';
}

function renderDT(data){
  const wrap=document.getElementById('dt-wrap');
  if(!data || data.error){ wrap.innerHTML=`<div class="err-msg">${data?.error||'Sin datos'}</div>`; return; }

  // ensanchar: cajas +10% y separación horizontal +12% (ocupa el espacio vacío)
  const KX=1.12, KW=1.10;
  data=JSON.parse(JSON.stringify(data));
  (data.layers||[]).forEach(l=>{ l.x=Math.round(l.x*KX); l.width=Math.round(l.width*KX); });
  (data.services||[]).forEach(sv=>{ sv.x=Math.round(sv.x*KX); sv.width=Math.round(sv.width*KW); });
  if(data.canvas&&data.canvas.width) data.canvas.width=Math.round(data.canvas.width*KX);

  const W=data.canvas?.width||980;
  const H=data.canvas?.height||520;
  const colors=data.colorTypes||{};
  const svcMap={};
  (data.services||[]).forEach(s=>svcMap[s.id]=s);

  const bgFill = isDark ? '#080d1a' : '#ffffff';
  const lyrFill= isDark ? '#0a1020' : '#f2f4f8';
  const lyrTxt = isDark ? '#1e2d44' : '#9aa8c0';
  const boxFill= isDark ? '#0d1525' : '#ffffff';

  let h=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="max-width:100%;display:block">
  <defs>
    <marker id="da" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,.5 L6,3.5 L0,6.5 Z" fill="${isDark?'#1a2744':'#b0bcd4'}"/></marker>
    <marker id="dad" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,.5 L6,3.5 L0,6.5 Z" fill="${isDark?'#1a2744':'#b0bcd4'}" opacity=".55"/></marker>
    <filter id="dtg" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${bgFill}" rx="6"/>`;

  // Layers
  (data.layers||[]).forEach(l=>{
    h+=`<rect x="${l.x}" y="${l.y}" width="${l.width}" height="${l.height}"
      fill="${isDark?(l.fill||lyrFill):lyrFill}" rx="4"
      stroke="${isDark?'#1a2744':'#d0d6e4'}" stroke-width=".5"/>
    <text x="${l.x+l.width/2}" y="${l.y+17}" text-anchor="middle"
      fill="${lyrTxt}" font-size="7" font-family="'IBM Plex Mono',monospace" letter-spacing="1.5">${l.label}</text>`;
  });

  // Connections
  (data.connections||[]).forEach(c=>{
    const f=svcMap[c.from],t=svcMap[c.to];
    if(!f||!t) return;
    const x1=f.x+f.width, y1=f.y+f.height/2;
    const x2=t.x, y2=t.y+t.height/2;
    const cx=(x1+x2)/2;
    const col=colors[f.colorType]||'#64748b';
    const dash=c.style==='dashed';
    h+=`<path d="M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}"
      fill="none" stroke="${col}${dash?'2a':'3a'}" stroke-width="${dash?1:1.2}"
      stroke-dasharray="${dash?'5,3':''}" marker-end="url(#${dash?'dad':'da'})"/>`;
  });

  // Boxes
  // dominioMALTG === 0 → el componente no ancla en ningún concepto de la
  // ontología MALTG: se dibuja en gris y atenuado, para distinguir de un
  // vistazo lo que el modelo cubre de lo que queda fuera de su dominio.
  // Si el gemelo es anterior a esta bandera, el backend la calcula al leerlo;
  // aun así, si faltara, se asume dentro del dominio (no se penaliza).
  const GRIS = isDark ? '#5b6780' : '#9aa5b8';
  (data.services||[]).forEach(s=>{
    const fuera = s.dominioMALTG === 0 || s.dominioMALTG === '0';
    const c = fuera ? GRIS : (colors[s.colorType]||'#64748b');
    const sc=s.status==='active'?'#10e98c':'#ff4d6d';
    // ★ FIX: safely convert maltg_ref (may be array) to display string
    const refStr = maltgRefStr(s.maltg_ref).replace(/"/g,"'").replace(/</g,'&lt;');
    const desc   = (s.description||'').replace(/"/g,"'").replace(/</g,'&lt;');
    const subtxt = fuera ? GRIS : (isDark ? '#3d4f6e' : '#7a8db0');
    h+=`<g class="dtb${fuera?' fuera-dominio':''}" style="cursor:pointer"${fuera?' opacity=".45"':' filter="url(#dtg)"'}
      data-desc="${desc}" data-maltg="${refStr}" data-col="${c}" data-lbl="${s.label}" data-fuera="${fuera?1:0}">
      <rect x="${s.x+2}" y="${s.y+3}" width="${s.width}" height="${s.height}" rx="5" fill="${c}" opacity=".055"/>
      <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}"
        rx="5" fill="${boxFill}" stroke="${c}" stroke-width="1.2"${fuera?' stroke-dasharray="4,2"':''}/>
      <rect x="${s.x}" y="${s.y}" width="${s.width}" height="3" rx="5" fill="${c}" opacity=".75"/>
      <text x="${s.x+s.width/2}" y="${s.y+17}" text-anchor="middle"
        fill="${c}" font-size="8.5" font-family="'IBM Plex Mono',monospace" font-weight="600">${s.label}</text>
      <text x="${s.x+s.width/2}" y="${s.y+28}" text-anchor="middle"
        fill="${subtxt}" font-size="7" font-family="'IBM Plex Mono',monospace">${s.subtitle}</text>
      <circle cx="${s.x+s.width-8}" cy="${s.y+10}" r="3" fill="${fuera?GRIS:sc}" opacity=".8"/>
    </g>`;
  });

  h+=`<text x="8" y="${H-6}" fill="${lyrTxt}" font-size="7.5" font-family="'IBM Plex Mono',monospace">
    DT_arch · ${data.meta?.title||''} · v${data.meta?.version||''} · ${data.meta?.maltg_compliance||''}
  </text></svg>`;

  wrap.innerHTML=h;

  // Tooltips — el contenedor puede no existir en todas las páginas
  const tt=document.getElementById('dtt');
  if(!tt) return;
  wrap.querySelectorAll('.dtb').forEach(el=>{
    el.addEventListener('mouseover',()=>{
      const d=el.dataset;
      tt.style.display='block';
      tt.innerHTML=`<div style="color:${d.col};font-weight:600;font-size:.73rem;margin-bottom:4px;font-family:'Plus Jakarta Sans',sans-serif">${d.lbl}</div>
        <div style="color:var(--t2);font-size:.62rem;line-height:1.5;margin-bottom:4px">${d.desc}</div>
        ${d.maltg?`<div style="font-size:.59rem;color:var(--t3)">MALTG refs: <span style="color:${d.col}">${d.maltg}</span></div>`:''}`;
    });
    el.addEventListener('mousemove',e=>{tt.style.left=(e.clientX+14)+'px';tt.style.top=(e.clientY-10)+'px';});
    el.addEventListener('mouseout',()=>tt.style.display='none');
  });
}

// ══════════════════════════════════════════════════════════════════
//  VALIDATION  —  split into META (always) + CHARTS (visible only)
//  ★ FIX 2: charts only rendered when canvas has real dimensions
// ══════════════════════════════════════════════════════════════════


function renderValidationMeta(val){
  const dims=val.dimensions||[];

  // ── Score cards ───────────────────────────────────────────────
  setTxt('sc-onto',   val.overall_onto);
  setTxt('sc-dt',     val.overall_dt);
  setTxt('sc-gap',    val.overall_gap);
  setTxt('sc-gap-sub',`↓ ${val.gap_pct}% brecha`);
  setTxt('radar-badge',`${dims.length} Dimensiones`);
  setTxt('gap-badge', `GAP: ${val.overall_gap} pts (${val.gap_pct}%)`);

  // ── Metric bars ───────────────────────────────────────────────
  const mc=document.getElementById('metric-rows');
  mc.innerHTML='';
  dims.forEach(d=>{
    const pO=Math.min(100,d.onto_score);
    const pD=Math.min(100,d.dt_score);
    const row=document.createElement('div');
    row.style.marginBottom='.65rem';
    row.innerHTML=`
      <div class="mrow-label">
        <span style="font-size:.62rem;color:var(--t2)">${d.label}</span>
        <span style="font-size:.62rem;color:var(--t3)">
          <span style="color:var(--cyan)">${d.onto_score}</span>
          <span style="opacity:.4"> / </span>
          <span st          <span style="color:var(--gold)">${d.dt_score}</span>
        </span>
      </div>
      <div class="mbar-wrap" style="margin-bottom:3px">
        <div class="mbar" style="background:${d.bar_color}" data-w="${pO}"></div>
      </div>
      <div class="mbar-wrap">
        <div class="mbar" style="background:linear-gradient(90deg,#ffc947,#ff9a3c)" data-w="${pD}"></div>
      </div>`;
    mc.appendChild(row);
  });
  // Animate after DOM paint
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    document.querySelectorAll('#metric-rows .mbar')
      .forEach(b=>b.style.width=(b.dataset.w||0)+'%');
  }));

  // ── GAP table ─────────────────────────────────────────────────
  const tbl=document.getElementById('gap-table');
  while(tbl.children.length>1) tbl.removeChild(tbl.lastChild);
  dims.forEach(d=>{
    const row=document.createElement('div');
    row.className='gap-row';
    const gC=d.gap>10?'var(--rose)':d.gap>5?'var(--gold)':'var(--green)';
    row.innerHTML=`
      <div class="gap-label">${d.label}</div>
      <div class="gap-val gap-onto">${d.onto_score}</div>
      <div class="gap-val gap-dt">${d.dt_score}</div>
      <div class="gap-val" style="color:${gC};text-align:right">${d.gap}</div>
      <div class="gap-val gap-cov">${d.coverage_pct}%</div>`;
    tbl.appendChild(row);
  });

  // ── Top gaps ──────────────────────────────────────────────────
  const topEl=document.getElementById('top-gaps');
  topEl.innerHTML='';
  (val.top_gaps||[]).forEach((g,i)=>{
    const div=document.createElement('div');
    div.className='top-gap-item';
    div.innerHTML=`<span style="color:var(--t2)">${i+1}. ${g.label}</span>
      <span style="color:var(--rose);font-weight:600">−${g.gap} pts</span>`;
    topEl.appendChild(div);
  });
}

function renderValidationCharts(val){
  const dims   = val.dimensions||[];
  const ontoV  = dims.map(d=>d.onto_score);
  const dtV    = dims.map(d=>d.dt_score);
  const gapV   = dims.map(d=>d.gap);
  const keys   = dims.map(d=>d.key);
  const labels = dims.map(d=>d.label);

  const gridC = isDark ? '#1a2744' : '#d0d6e4';
  const textC = isDark ? '#7a8db0' : '#3a4d70';
  Chart.defaults.color = textC;
  Chart.defaults.font.family = "'IBM Plex Mono',monospace";

  // ── Radar ─────────────────────────────────────────────────────
  // Safe destroy
  if(radarChart){ try{ radarChart.destroy(); }catch(e){} radarChart=null; }
  const rCtx=document.getElementById('radarChart');
  // Reset canvas by replacing it (clears any corrupted state)
  const rNew=document.createElement('canvas');
  rNew.id='radarChart'; rNew.style.position='absolute'; rNew.style.inset='0';
  rCtx.parentNode.replaceChild(rNew,rCtx);

  radarChart=new Chart(rNew.getContext('2d'),{
    type:'radar',
    data:{
      labels: labels.map(l=>l.replace(' ','\n')),
      datasets:[
        {label:'MALTG_onto',data:ontoV,
          backgroundColor:'rgba(0,229,255,.09)',borderColor:'#00e5ff',
          pointBackgroundColor:'#00e5ff',pointRadius:4,borderWidth:2},
        {label:'DT_arch',data:dtV,
          backgroundColor:'rgba(255,201,71,.07)',borderColor:'#ffc947',
          pointBackgroundColor:'#ffc947',pointRadius:4,borderWidth:2,
          borderDash:[4,3]},
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      scales:{r:{min:0,max:100,
        grid:{color:gridC},angleLines:{color:gridC},
        ticks:{display:false,stepSize:25},
        pointLabels:{font:{size:8},color:textC}}},
      plugins:{legend:{position:'bottom',
        labels:{font:{size:9},padding:12,boxWidth:11,color:textC}}}
    }
  });

  // ── Gap bar chart ─────────────────────────────────────────────
  if(gapChart){ try{ gapChart.destroy(); }catch(e){} gapChart=null; }
  const gCtx=document.getElementById('gapChart');
  const gNew=document.createElement('canvas');
  gNew.id='gapChart'; gNew.style.position='absolute'; gNew.style.inset='0';
  gCtx.parentNode.replaceChild(gNew,gCtx);

  gapChart=new Chart(gNew.getContext('2d'),{
    type:'bar',
    data:{
      labels: keys,
      datasets:[
        {label:'MALTG_onto',data:ontoV,
          backgroundColor:'#00e5ff28',borderColor:'#00e5ff',borderWidth:1.5,borderRadius:3},
        {label:'DT_arch',data:dtV,
          backgroundColor:'#ffc94728',borderColor:'#ffc947',borderWidth:1.5,borderRadius:3},
        {label:'GAP',data:gapV,
          backgroundColor:'#ff4d6d28',borderColor:'#ff4d6d',borderWidth:1.5,borderRadius:3},
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'top',
        labels:{font:{size:8},padding:9,boxWidth:9,color:textC}}},
      scales:{
        x:{grid:{color:gridC},ticks:{font:{size:8},color:textC}},
        y:{grid:{color:gridC},min:0,max:100,ticks:{font:{size:8},color:textC,stepSize:20}}
      }
    }
  });
}

// ══════════════════════════════════════════════════════════════════
//  METHODOLOGY — formal model + 5-phase pipeline
// ══════════════════════════════════════════════════════════════════

// ── Carga inicial de esta página (equivalente a los bloques "Tab 03:
//    Digital Shadow" y "Tab 04: Validation" de reloadAll() en dashboard.html) ──
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo Digital Shadow (SDT)…' },
    { id: 's2', label: 'Calculando validación…' },
    { id: 's3', label: 'Actualizando interfaz…' },
  ], async () => {
    step('s1', 'active');
    const [dt, val] = await Promise.all([
      fetch('/api/dt-arch?_=' + Date.now()).then(r => r.json()),
      fetch('/api/validation?_=' + Date.now()).then(r => r.json()),
    ]);
    const ts = new Date().toLocaleTimeString('es-EC', { hour12: false });
    step('s1', 'done'); step('s2', 'active');

    if (!dt.error) {
      dtCurrentFile = dt._file || dtCurrentFile;
      setTxt('dt-hash', dt.hash ? dt.hash.slice(0, 8) + '…' : '—');
      setTxt('dt-ts', ts);
      setTxt('dt-svc-badge', `${(dt.services || []).length} Servicios`);
      setTxt('dt-ver-badge', `v${dt.meta?.version || '—'}`);
      renderDT(dt);
      renderDtSdtCjSections(dt);
    }
    step('s2', 'done'); step('s3', 'active');

    if (!val.error) {
      setTxt('val-ts', ts);
      setValSdtLabel(dtCurrentFile);
      pendingVal = val;
      renderValidationMeta(val);
      renderValidationCharts(val);
    }
    await loadDtFiles();
    step('s3', 'done');
  });
};
