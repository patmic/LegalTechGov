// ═══════════════════════════════════════════════════════════════════
//  tab-methodology.js — Página Metodología (01). Requiere core.js.
//  Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

function renderMethodology(meth, val){
  const phaseColors = meth.phases.map(p=>p.color);
  const isDarkNow   = isDark;

  // ── Formal model component cards ─────────────────────────────
  const fmDiv = document.getElementById('formal-model-cards');
  fmDiv.innerHTML = '';
  meth.formal_model.components.forEach(c=>{
    const card = document.createElement('div');
    card.style.cssText = `background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;
      padding:.8rem;position:relative;overflow:hidden;transition:background .35s`;
    card.innerHTML = `
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.5rem;font-weight:800;
                  color:var(--cyan);line-height:1;margin-bottom:.4rem">${c.symbol}</div>
      <div style="font-size:.65rem;font-weight:700;color:var(--t1);margin-bottom:.3rem;
                  font-family:'Plus Jakarta Sans',sans-serif;text-transform:uppercase;letter-spacing:.08em">${c.name}</div>
      <div style="font-size:.58rem;color:var(--t2);line-height:1.5;margin-bottom:.4rem">${c.definition}</div>
      <div style="font-size:.54rem;color:var(--t3);font-family:'IBM Plex Mono',monospace;
                  background:var(--bg3);border:1px solid var(--bdr);border-radius:3px;
                  padding:.2rem .4rem;word-break:break-all">${c.formal}</div>`;
    fmDiv.appendChild(card);
  });

  // Ψ and δ formulas
  const ffDiv = document.getElementById('formal-formulas');
  ffDiv.innerHTML = `
    <div style="background:var(--bg3);border:1px solid rgba(0,229,255,.2);border-radius:5px;padding:.6rem .8rem">
      <div style="font-size:.56rem;color:var(--t3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.3rem">Cobertura Ψ</div>
      <div style="font-size:.7rem;color:var(--cyan);font-family:'IBM Plex Mono',monospace">
        Ψ(d) = 0.4·𝟙[root ∈ R] + 0.6·(|sub_d ∩ R| / |sub_d|)
      </div>
    </div>
    <div style="background:var(--bg3);border:1px solid rgba(255,77,109,.2);border-radius:5px;padding:.6rem .8rem">
      <div style="font-size:.56rem;color:var(--t3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.3rem">Brecha δ</div>
      <div style="font-size:.7rem;color:var(--rose);font-family:'IBM Plex Mono',monospace">
        δ(d) = score_Ω(d) · (1 − Ψ(d))
      </div>
    </div>`;

  // ── Pipeline SVG ─────────────────────────────────────────────
  const svgEl = document.getElementById('pipeline-svg');
  const W = svgEl.parentElement.clientWidth || 920;
  const phases = meth.phases;
  const boxW = 140, boxH = 80, gap = 18;
  const totalW = phases.length * boxW + (phases.length-1)*gap;
  const startX = (W - totalW)/2;
  const Y = 30;
  const bgRect  = isDarkNow ? '#080d1a' : '#e8eef8';
  const txtMain = isDarkNow ? '#e8f0ff' : '#0a1428';
  const txtSub  = isDarkNow ? '#7a8db0' : '#3a4d70';

  let svg = `<rect width="${W}" height="200" fill="transparent" rx="6"/>`;
  phases.forEach((p,i)=>{
    const x = startX + i*(boxW+gap);
    const cx= x + boxW/2;
    const isLT = p.id==='P4';
    const strokeW = isLT ? 2.5 : 1.5;
    const glow = isLT ? `filter: drop-shadow(0 0 8px ${p.color}66)` : '';

    svg += `
      <g style="cursor:pointer;${glow}">
        <rect x="${x}" y="${Y}" width="${boxW}" height="${boxH}" rx="8"
          fill="${isDarkNow?'#0d1525':'#ffffff'}" stroke="${p.color}" stroke-width="${strokeW}"/>
        <rect x="${x}" y="${Y}" width="${boxW}" height="3" rx="8" fill="${p.color}" opacity=".8"/>
        <text x="${cx}" y="${Y+20}" text-anchor="middle"
          fill="${p.color}" font-size="11" font-family="'Plus Jakarta Sans',sans-serif" font-weight="700">${p.id}</text>
        <text x="${cx}" y="${Y+34}" text-anchor="middle"
          fill="${txtMain}" font-size="8.5" font-family="'IBM Plex Mono',monospace" font-weight="600">${p.abbrev}</text>
        <text x="${cx}" y="${Y+47}" text-anchor="middle"
          fill="${txtSub}" font-size="7.5" font-family="'IBM Plex Mono',monospace">${p.name.split(' ').slice(0,2).join(' ')}</text>
        <text x="${cx}" y="${Y+58}" text-anchor="middle"
          fill="${txtSub}" font-size="7.5" font-family="'IBM Plex Mono',monospace">${p.name.split(' ').slice(2).join(' ')}</text>
      </g>`;

    // Arrow to next
    if(i < phases.length-1){
      const ax = x + boxW + 2;
      const ay = Y + boxH/2;
      const ax2= ax + gap - 4;
      svg += `<line x1="${ax}" y1="${ay}" x2="${ax2}" y2="${ay}"
        stroke="${isDarkNow?'#1a2744':'#bfc9e0'}" stroke-width="1.5"
        marker-end="url(#pipe-arr)"/>`;
    }
  });

  // API endpoints below pipeline
  phases.forEach((p,i)=>{
    const x = startX + i*(boxW+gap);
    const cx= x + boxW/2;
    svg += `<text x="${cx}" y="${Y+boxH+22}" text-anchor="middle"
      fill="${txtSub}" font-size="7" font-family="'IBM Plex Mono',monospace">${p.api}</text>`;
  });

  svgEl.setAttribute('viewBox', `0 0 ${W} 200`);
  svgEl.innerHTML = `<defs>
    <marker id="pipe-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="${isDarkNow?'#1a2744':'#bfc9e0'}"/>
    </marker>
  </defs>${svg}`;

  // ── Phase detail cards ─────────────────────────────────────────
  const pdDiv = document.getElementById('phase-detail-cards');
  pdDiv.innerHTML = '';
  phases.forEach(p=>{
    const isLT = p.id==='P4';
    const card = document.createElement('div');
    card.style.cssText = `background:var(--bg3);border:1px solid ${p.color}${isLT?'':'55'};border-radius:7px;
      padding:.75rem;transition:background .35s;${isLT?`box-shadow: 0 0 12px ${p.color}33`:''}`;
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.4rem">
        <div style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0"></div>
        <span style="font-size:.62rem;font-weight:700;color:${p.color};font-family:'Plus Jakarta Sans',sans-serif;
                     text-transform:uppercase;letter-spacing:.08em">${p.abbrev}</span>
      </div>
      <div style="font-size:.6rem;color:var(--t2);line-height:1.5;margin-bottom:.4rem">${p.description.slice(0,120)}…</div>
      <div style="font-size:.55rem;color:var(--t3);margin-bottom:.2rem">
        <span style="color:var(--green)">IN:</span> ${p.inputs.join(' · ')}
      </div>
      <div style="font-size:.55rem;color:var(--t3)">
        <span style="color:${p.color}">OUT:</span> ${p.outputs.slice(0,2).join(' · ')}
      </div>`;
    pdDiv.appendChild(card);
  });

  // ── Validation properties ─────────────────────────────────────
  const vpDiv = document.getElementById('val-properties');
  vpDiv.innerHTML = '';
  meth.validation_properties.forEach(vp=>{
    const d = document.createElement('div');
    d.style.cssText = 'background:var(--bg3);border:1px solid var(--bdr);border-radius:6px;padding:.7rem;transition:background .35s';
    d.innerHTML = `
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
        <span style="font-size:.62rem;color:var(--green)">✓</span>
        <span style="font-size:.64rem;font-weight:700;color:var(--t1);font-family:'Plus Jakarta Sans',sans-serif">${vp.property}</span>
      </div>
      <div style="font-size:.6rem;color:var(--t2);line-height:1.5;margin-bottom:.3rem">${vp.guarantee}</div>
      <div style="font-size:.56rem;color:var(--t3);font-family:'IBM Plex Mono',monospace">${vp.test}</div>`;
    vpDiv.appendChild(d);
  });

  // ── LegalTech highlight ────────────────────────────────────────
  const ltDiv = document.getElementById('legaltech-highlight');
  const ltDim = val?.legaltech_dim;
  const ltPhase = phases.find(p=>p.id==='P4');

  ltDiv.innerHTML = `
    <div style="margin-bottom:.8rem">
      <div style="font-size:.58rem;color:var(--t3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.3rem">
        Justificación del Título
      </div>
      <div style="font-size:.62rem;color:var(--t2);line-height:1.6">
        La fase LDCC valida el grado en que la implementación (DT_arch) cubre los 12 conceptos 
        LegalTech formalizados en MALTG_onto.owl: GDPR, eIDAS, NIS2, Attorney-Client Privilege, 
        Smart Legal Contracts, eDiscovery, DLT Notarization y Court Integration.
      </div>
    </div>
    ${ltDim ? `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.6rem;margin-bottom:.8rem">
      <div style="background:var(--bg3);border:1px solid rgba(96,165,250,.2);border-radius:5px;padding:.6rem;text-align:center">
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.4rem;font-weight:800;color:#60a5fa">${ltDim.onto_score}</div>
        <div style="font-size:.55rem;color:var(--t3);text-transform:uppercase">Score OWL</div>
      </div>
      <div style="background:var(--bg3);border:1px solid rgba(255,201,71,.2);border-radius:5px;padding:.6rem;text-align:center">
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.4rem;font-weight:800;color:var(--gold)">${ltDim.dt_score}</div>
        <div style="font-size:.55rem;color:var(--t3);text-transform:uppercase">Score DT</div>
      </div>
      <div style="background:var(--bg3);border:1px solid rgba(255,77,109,.2);border-radius:5px;padding:.6rem;text-align:center">
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.4rem;font-weight:800;color:var(--rose)">${ltDim.gap}</div>
        <div style="font-size:.55rem;color:var(--t3);text-transform:uppercase">GAP</div>
      </div>
    </div>
    <div style="margin-bottom:.6rem">
      <div style="font-size:.58rem;color:var(--t3);margin-bottom:.4rem;text-transform:uppercase;letter-spacing:.1em">
        Cobertura: ${ltDim.coverage_pct}%
      </div>
      <div style="height:6px;background:var(--bg3);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${ltDim.coverage_pct}%;background:linear-gradient(90deg,#60a5fa,#3b82f6);
                    border-radius:3px;transition:width 1.5s cubic-bezier(.16,1,.3,1)"></div>
      </div>
    </div>
    ${ltDim.missing_subs.length ? `
    <div style="font-size:.57rem;color:var(--t3);margin-bottom:.3rem;text-transform:uppercase;letter-spacing:.1em">
      Conceptos faltantes en DT (${ltDim.missing_subs.length})
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:.3rem">
      ${ltDim.missing_subs.map(r=>`<span style="font-size:.54rem;padding:.12rem .4rem;
        background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);border-radius:3px;
        color:var(--rose);font-family:'IBM Plex Mono',monospace">${r}</span>`).join('')}
    </div>` : `<div style="font-size:.62rem;color:var(--green)">✓ Todos los conceptos LegalTech cubiertos</div>`}
    ` : '<div style="font-size:.62rem;color:var(--t3)">Recarga para ver datos LegalTech…</div>'}
    <div style="margin-top:.8rem;padding:.6rem;background:var(--bg3);border:1px solid rgba(96,165,250,.15);border-radius:5px">
      <div style="font-size:.57rem;color:var(--t3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.3rem">
        Regulaciones mapeadas en Ω
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:.3rem">
        ${['GDPR (EU) 2016/679','eIDAS 910/2014','NIS2 2022/2555','EDRM','ABA Model Rule 1.6','ECLI','LegalDocML / Akoma Ntoso','eIDAS 2.0 2024/1183'].map(r=>`
        <span style="font-size:.54rem;padding:.12rem .4rem;background:rgba(96,165,250,.08);
          border:1px solid rgba(96,165,250,.15);border-radius:3px;color:#60a5fa;
          font-family:'IBM Plex Mono',monospace">${r}</span>`).join('')}
      </div>
    </div>`;
}

// ── Carga inicial de esta página ────────────────────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo metodología…' },
    { id: 's2', label: 'Leyendo validación…' },
    { id: 's3', label: 'Actualizando interfaz…' },
  ], async () => {
    step('s1', 'active');
    const meth = await (await fetch('/api/methodology?_=' + Date.now())).json();
    step('s1', 'done'); step('s2', 'active');
    const val = await (await fetch('/api/validation?_=' + Date.now())).json();
    step('s2', 'done'); step('s3', 'active');
    setTxt('meth-ts', new Date().toLocaleTimeString('es-EC', { hour12: false }));
    if (!meth.error && meth.phases) renderMethodology(meth, val);
    step('s3', 'done');
  });
};
