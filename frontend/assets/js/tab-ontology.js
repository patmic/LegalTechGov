// ═══════════════════════════════════════════════════════════════════
//  tab-ontology.js — Página Ontología MALTG (03): grafo vis-network.
//  Requiere core.js. Extraído/adaptado de dashboard.html.
//  (nodeColor() vive en core.js — la usan también maltg y simulación.
//   Los sliders de score por nodo — y su persistencia vía
//   /api/ontology/score — viven en tab-maltg.js: esta página no tiene
//   sliders, esa tiene los suyos propios en el árbol de configuración.)
// ═══════════════════════════════════════════════════════════════════

let visNetwork    = null;   // vis.Network instance
let visNodes      = null;   // vis.DataSet nodes
let visEdges      = null;   // vis.DataSet edges
let physicsActive = true;
let clustered     = false;
let _dragOffTimer = null;

/* Colores del grafo leídos del tema activo (nocturne.css / aurora.css),
   para que el lienzo <canvas> — que no entiende de CSS — siga la misma
   paleta que el resto de la aplicación. Los colores de NODO no salen de
   aquí: los fija nodeColor() en core.js porque codifican la capa de
   gobernanza y deben ser los mismos en ambos temas. */
function ontoTheme(){
  const cs = getComputedStyle(document.documentElement);
  const v  = (n, fb) => (cs.getPropertyValue(n) || '').trim() || fb;
  return {
    accent:   v('--color-accent', '#9184d9'),
    surface:  v('--color-surface', '#0d1525'),
    nodeFont: isDark ? v('--color-neutral-300', '#c8d8f0') : '#1a2a48',
    edgeFont: isDark ? v('--color-neutral-700', '#3d5070') : '#8a9bba',
    edgeBg:   isDark ? 'rgba(22,24,38,0.72)' : 'rgba(248,250,255,0.8)',
    edge:     isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,40,120,0.15)',
  };
}

/* Build vis-network options (theme-aware) */
function buildVisOptions(layout){
  const dark = isDark;
  const T    = ontoTheme();
  const bg   = 'transparent';
  const font = T.nodeFont;

  const base = {
    autoResize: true,
    height: '560px',
    width:  '100%',
    nodes: {
      shape: 'dot',
      scaling: { min: 10, max: 38, label: { min: 8, max: 16 } },
      font: {
        face: 'Space Grotesk, sans-serif',
        color: font,
        size: 11,
        bold: { face: 'Outfit, sans-serif', mod: 'bold' },
      },
      borderWidth: 2,
      borderWidthSelected: 3,
      shadow: { enabled: false },   /* sin sombra → interacción fluida con 131 nodos */
    },
    edges: {
      width: 1.4,
      selectionWidth: 2.5,
      /* 'continuous' no crea nodos de soporte ocultos → mucho más rápido que 'dynamic' */
      smooth: { enabled: true, type: 'continuous', roundness: 0.4 },
      shadow: false,
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      font: {
        face: 'DM Mono, monospace',
        color: T.edgeFont,
        size: 9,
        align: 'middle',
        strokeWidth: 0,
        background: T.edgeBg,
      },
      color: {
        color:     T.edge,
        highlight: T.accent,
        hover:     T.accent,
        inherit:   'from',
        opacity:   0.85,
      },
    },
    interaction: {
      hover:              true,
      /* hoverConnectedEdges lo hace ya highlightConnected(); dejarlo en
         true duplicaba el repintado en cada movimiento del ratón. */
      hoverConnectedEdges:false,
      selectConnectedEdges:true,
      tooltipDelay:       200,
      navigationButtons:  false,
      keyboard:           { enabled: true, speed: { x:10, y:10, zoom:.02 } },
      zoomView:           true,
      dragView:           true,
      multiselect:        true,
      /* Oculta las 144 aristas mientras se arrastra o se hace zoom:
         es la palanca estándar de vis-network contra el tirón, y sólo
         afecta al fotograma intermedio (reaparecen al soltar). */
      hideEdgesOnDrag:    true,
      hideEdgesOnZoom:    true,
    },
    /* Configuración alineada con el tab 09 COGEP: ligera y con física viva */
    physics: {
      enabled: physicsActive,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -60,
        centralGravity:        0.01,
        springLength:          110,
        springConstant:        0.08,
        damping:               0.4,
        avoidOverlap:          0.6,
      },
      stabilization: { iterations: 160 },   /* corto → asentamiento animado en pantalla */
      adaptiveTimestep: true,
    },
    /* improvedLayout ejecuta un pre-layout Kamada-Kawai que, por encima
       de ~100 nodos, cuesta segundos y no mejora nada aquí: la física
       de arranque ya coloca el grafo. */
    layout: { randomSeed: 42, improvedLayout: false },
  };

  if(layout === 'hierarchical-UD'){
    base.layout = { hierarchical:{ direction:'UD', sortMethod:'directed', nodeSpacing:90, levelSeparation:130, treeSpacing:160 } };
    base.physics.enabled = false;
  } else if(layout === 'hierarchical-LR'){
    base.layout = { hierarchical:{ direction:'LR', sortMethod:'directed', nodeSpacing:80, levelSeparation:180 } };
    base.physics.enabled = false;
  } else if(layout === 'circular'){
    base.layout = { randomSeed: 1 };
    base.physics.solver = 'repulsion';
    base.physics.repulsion = { nodeDistance:160, centralGravity:0.18, springLength:200, springConstant:0.05, damping:0.09 };
  }

  return base;
}

let ontoRaw = null;    // grafo crudo {nodes, links} (estructura) para el modal de detalle
let ontoInfo = {};     // detalles por nodo (MALTG_ontologyInfo.json): id → {description, regulation, …}
function renderOntologyGraph(nodes, links){
  ontoRaw = { nodes, links };
  const container = document.getElementById('onto-vis');
  if(!container) return;

  /* Destroy previous instance */
  if(visNetwork){ visNetwork.destroy(); visNetwork = null; }
  clustered = false;

  /* ── Jerarquía: core → capas → términos principales (normativas) → aspectos ── */
  const parent = {};
  links.forEach(l => { if(l.type === 'subClassOf') parent[l.t] = l.s; });
  const coreId   = (nodes.find(n => n.type === 'core') || {}).id || 'MALTG_Core';
  const layerIds = new Set(nodes.filter(n => parent[n.id] === coreId).map(n => n.id));
  const chainUp  = id => { const ch=[]; let cur=id,g=0; while(cur && g++<12){ ch.push(cur); cur=parent[cur]; } return ch; };
  const capaOf   = id => chainUp(id).find(x => layerIds.has(x)) || null;             // capa (nodo *_Layer)
  const normaOf  = id => chainUp(id).find(x => layerIds.has(parent[x])) || null;     // término principal (normativa)

  /* Build vis DataSets */
  const vNodes = nodes.map(n => {
    const c = nodeColor(n.type);
    const isCore  = n.type === 'core';
    const isLayer = layerIds.has(n.id);
    /* símbolo distinto por nivel: core = estrella, capa = diamante, resto = punto */
    const shape = isCore ? 'star' : (isLayer ? 'diamond' : 'dot');
    return {
      id:    n.id,
      label: n.label.length > 16 ? n.label.slice(0,15)+'…' : n.label,
      /* sin title nativo: usamos la tarjeta flotante #otip (estilo tab 04) */
      value: n.r || 10,
      shape,
      color: {
        background: isLayer ? c + (isDark?'33':'22') : (isDark ? ontoTheme().surface : '#ffffff'),
        border:     c,
        highlight: { background: c + (isDark?'22':'18'), border: c },
        hover:     { background: c + (isDark?'18':'10'), border: c },
      },
      borderWidth: isLayer ? 3 : 2,
      font:  { color: ontoTheme().nodeFont, size: isLayer ? 14 : 11, bold: isLayer ? { mod:'bold' } : false },
      group: n.type || 'default',
      /* store original data for tooltip / detail panel / cluster */
      _type: n.type, _score: n.score, _desc: n.description,
      _fulllabel: n.label, _cluster: n.cluster, _reg: n.regulation,
      _isLayer: isLayer, _capa: capaOf(n.id), _norma: normaOf(n.id),
    };
  });

  const _T = ontoTheme();
  const vEdges = links.map((l, i) => {
    const src = nodes.find(x => x.id === l.s);
    const base = (src ? nodeColor(src.type) : '#888') + (isDark ? '55' : '77');
    return {
      id:     'e' + i,
      from:   l.s,
      to:     l.t,
      dashes: !!l.dash,
      width:  l.w || 1.4,
      color: { color: base, highlight: _T.accent, hover: _T.accent },
      _basecolor: base, _basewidth: l.w || 1.4, _basedash: !!l.dash,
    };
  });

  visNodes = new vis.DataSet(vNodes);
  visEdges = new vis.DataSet(vEdges);

  /* Update counters */
  document.getElementById('vis-node-count').textContent = `Nodos: ${vNodes.length}`;
  document.getElementById('vis-edge-count').textContent = `Aristas: ${vEdges.length}`;

  const layout = document.getElementById('sel-layout')?.value || 'physics';
  const options = buildVisOptions(layout);

  visNetwork = new vis.Network(container, { nodes: visNodes, edges: visEdges }, options);

  /* Stabilization events */
  const stabEl = document.getElementById('vis-stabilizing');
  visNetwork.on('startStabilizing', ()  => stabEl?.classList.add('show'));
  visNetwork.on('stabilizationIterationsDone', () => {
    stabEl?.classList.remove('show');
    /* Física OFF tras estabilizar → se elimina la simulación continua (CPU/lentitud).
       ontoKick() la re-enciende brevemente cuando hace falta re-acomodar. */
    physicsActive = false;
    visNetwork.setOptions({ physics:{ enabled:false } });
    syncPhysicsBtn();
    visNetwork.fit({ animation:{ duration:700, easingFunction:'easeInOutQuad' } });
  });

  /* Hover — tarjeta flotante (estilo tab 04 Gemelo Digital) + resalta conexiones */
  /* Hover: solo resalta conexiones — la información se muestra únicamente con CLIC (modal) */
  visNetwork.on('hoverNode', params => { if(visNetwork.isCluster(params.node)) return; highlightConnected(params.node); });
  visNetwork.on('blurNode',  ()      => { resetHighlight(); ontoTipHide(); });

  /* Click en un nodo — resalta y ANIMA los enlaces conectados (flujo pulsante) */
  visNetwork.on('click', params => {
    if(params.nodes.length){
      const nid = params.nodes[0];
      if(visNetwork.isCluster(nid)) return;   // clúster: el doble clic lo expande
      highlightConnected(nid);
      showNodeModal(nid);                     // 1 clic → descripción del nodo
    }
    else { resetHighlight(); stopEdgeAnim(true); }
  });
  visNetwork.on('deselectNode', () => stopEdgeAnim(true));

  /* Doble-clic — abre el modal con el detalle completo del nodo */
  visNetwork.on('doubleClick', params => {
    if(params.nodes.length){
      const nid = params.nodes[0];
      if(visNetwork.isCluster(nid)){          // expandir el clúster de capa
        visNetwork.openCluster(nid);
        activeClusters = activeClusters.filter(c => c !== nid);
        if(!activeClusters.length){ clusterMode = 0; clustered = false; }
        ontoKick(100);                       // re-acomoda los nodos liberados
        return;
      }
      showNodeModal(nid);
    }
    else resetHighlight();
  });

  /* ── Arrastre ────────────────────────────────────────────────────
     Antes el arrastre ENCENDÍA la física (forceAtlas2 + avoidOverlap):
     cada fotograma resimulaba los 131 nodos mientras el ratón se movía,
     y el nodo llegaba tarde al cursor. Ahora el arrastre es directo —
     el nodo sigue al puntero 1:1, que es el gesto fluido — y sólo se
     re-acomoda el vecindario al soltar SI el usuario dejó la física
     encendida con el botón "Física".                                 */
  visNetwork.on('dragStart', p => {
    if(!p.nodes.length) return;
    _dragging = true;
    clearTimeout(_dragOffTimer);
    resetHighlight();                       // el resaltado no debe seguir al arrastre
    visNetwork.setOptions({ physics:{ enabled:false } });
  });
  visNetwork.on('dragEnd', p => {
    _dragging = false;
    if(!p.nodes.length) return;
    clearTimeout(_dragOffTimer);
    if(!physicsActive) return;              // física apagada: el nodo se queda donde se soltó
    visNetwork.setOptions({ physics:{ enabled:true } });
    _dragOffTimer = setTimeout(() => {
      if(visNetwork) visNetwork.setOptions({ physics:{ enabled:false } });
    }, 1200);
  });

  /* Sync physics toggle button */
  syncPhysicsBtn();
}

/* ── Modal de detalle del nodo (tab 03) ──────────────────── */
function showNodeModal(nodeId){
  if(!visNodes) return;
  const n = visNodes.get(nodeId); if(!n) return;
  const info = ontoInfo[nodeId] || {};
  const c = nodeColor(n._type);
  const modal=document.getElementById('onto-modal'), card=document.getElementById('onto-modal-card');
  if(!modal) return;
  const full = n._fulllabel || n.label;
  setTxt('onto-m-title', full);
  const dot=document.getElementById('onto-m-dot'); if(dot) dot.style.background=c;
  const reg = info.regulation || n._reg || '';
  const m=document.getElementById('onto-m-meta');
  if(m){
    m.innerHTML =
      `<span style="color:${c};font-weight:700">${wfEsc((n._type||'').toUpperCase())}</span>`
      + (n._cluster ? `<span>· Capa: ${wfEsc(n._cluster)}</span>` : '')
      + (n._score ? `<span>· Score <b style="color:#10e98c">${wfEsc(n._score)}%</b></span>` : '')
      + (reg ? `<span>· ${wfEsc(reg)}</span>` : '');
  }
  setTxt('onto-m-desc', info.description || n._desc || 'Sin descripción.');

  // conexiones del nodo (relaciones entrantes/salientes)
  const conn=document.getElementById('onto-m-conn');
  if(conn && ontoRaw){
    const byId={}; ontoRaw.nodes.forEach(x=>byId[x.id]=x);
    const rels=[];
    ontoRaw.links.forEach(l=>{
      if(l.s===nodeId) rels.push({dir:'→', other:l.t, type:l.type});
      else if(l.t===nodeId) rels.push({dir:'←', other:l.s, type:l.type});
    });
    if(rels.length){
      const items=rels.slice(0,14).map(r=>{
        const o=byId[r.other]||{}; const oc=nodeColor(o.type);
        const rel=(r.type&&r.type!=='subClassOf')?` <span style="color:var(--t3)">(${wfEsc(r.type)})</span>`:'';
        return `<div style="display:flex;align-items:center;gap:.45rem;padding:.2rem 0;border-bottom:1px solid var(--bdr);cursor:pointer" onclick="showNodeModal('${r.other}')">
          <span style="color:var(--t3);width:14px">${r.dir}</span>
          <span style="width:9px;height:9px;border-radius:50%;background:${oc};flex-shrink:0"></span>
          <span style="font-size:.64rem;color:var(--t1)">${wfEsc(o.label||r.other)}</span>${rel}
        </div>`;
      }).join('');
      conn.innerHTML=`<div style="font-size:.58rem;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.35rem">Conexiones (${rels.length})</div>${items}`;
    } else conn.innerHTML='';
  }

  modal.style.display='flex';
  requestAnimationFrame(()=>{ if(card){ card.style.transform='scale(1)'; card.style.opacity='1'; } });
}
function closeNodeModal(){
  const modal=document.getElementById('onto-modal'), card=document.getElementById('onto-modal-card');
  if(card){ card.style.transform='scale(.94)'; card.style.opacity='0'; }
  if(modal) setTimeout(()=>{ modal.style.display='none'; }, 160);
  resetHighlight(); stopEdgeAnim(true);
}

/* ── Tarjeta flotante de la ontología (estilo tab 04 Gemelo Digital) ── */
let _ontoMouse = { x: 0, y: 0 };
document.addEventListener('mousemove', e => {
  _ontoMouse.x = e.clientX; _ontoMouse.y = e.clientY;
  const tip = document.getElementById('otip');
  if(tip && tip.style.display === 'block'){
    tip.style.left = (e.clientX + 14) + 'px';
    tip.style.top  = (e.clientY - 10) + 'px';
  }
});
function ontoTipShow(nodeId){
  const tip = document.getElementById('otip'); if(!tip || !visNodes) return;
  const n = visNodes.get(nodeId); if(!n) return;
  const info = ontoInfo[nodeId] || {};
  const desc = info.description || n._desc || '';
  const c = nodeColor(n._type);
  let refs = '';
  if(ontoRaw){
    const byId = {}; ontoRaw.nodes.forEach(x => byId[x.id] = x);
    const names = [];
    ontoRaw.links.forEach(l => {
      if(l.s === nodeId && byId[l.t]) names.push(byId[l.t].label || l.t);
      else if(l.t === nodeId && byId[l.s]) names.push(byId[l.s].label || l.s);
    });
    if(names.length) refs = names.slice(0,5).join(', ') + (names.length>5 ? ` (+${names.length-5})` : '');
  }
  tip.innerHTML =
    `<div style="color:${c};font-weight:700;font-size:.74rem;margin-bottom:4px;font-family:'Syne',sans-serif">${wfEsc(n._fulllabel || n.label)}</div>`
    + (desc ? `<div style="color:var(--t2);font-size:.62rem;line-height:1.5;margin-bottom:4px">${wfEsc(desc)}</div>` : '')
    + `<div style="font-size:.58rem;color:var(--t3)">${wfEsc((n._type||'').toUpperCase())}${n._score ? ` · Score ${wfEsc(n._score)}%` : ''}${n._cluster ? ` · ${wfEsc(n._cluster)}` : ''}</div>`
    + (refs ? `<div style="font-size:.58rem;color:var(--t3);margin-top:3px">Conexiones: <span style="color:${c}">${wfEsc(refs)}</span></div>` : '');
  tip.style.display = 'block';
  tip.style.left = (_ontoMouse.x + 14) + 'px';
  tip.style.top  = (_ontoMouse.y - 10) + 'px';
}
function ontoTipHide(){ const t = document.getElementById('otip'); if(t) t.style.display = 'none'; }

/* ── Animación de enlaces al seleccionar un nodo (flujo pulsante, estilo dinámico) ── */
let _edgeAnimRAF = null, _edgeAnimEdges = [];
function animateSelectedEdges(nodeId){
  stopEdgeAnim(true);
  if(!visNetwork || !visEdges) return;
  _edgeAnimEdges = (visNetwork.getConnectedEdges(nodeId) || []).filter(id => visEdges.get(id));
  if(!_edgeAnimEdges.length) return;
  const _ac = ontoTheme().accent;
  const start = performance.now();
  const loop = (t) => {
    const dt = (t - start) / 1000;
    if(dt > 3){   // tras 3 s se asienta resaltado estático (no consume CPU)
      visEdges.update(_edgeAnimEdges.map(id => ({ id, width: 3, dashes:[6,5], color:{ color:_ac, highlight:_ac } })));
      _edgeAnimRAF = null; return;
    }
    const w = 2.2 + (Math.sin(dt*7)+1)/2 * 3.4;   // pulso 2.2 ↔ 5.6 px
    visEdges.update(_edgeAnimEdges.map(id => ({ id, width: w, dashes:[8,6], color:{ color:_ac, highlight:_ac } })));
    _edgeAnimRAF = requestAnimationFrame(loop);
  };
  _edgeAnimRAF = requestAnimationFrame(loop);
}
function stopEdgeAnim(restore){
  if(_edgeAnimRAF){ cancelAnimationFrame(_edgeAnimRAF); _edgeAnimRAF = null; }
  const _ac = ontoTheme().accent;
  if(restore && visEdges && _edgeAnimEdges.length){
    visEdges.update(_edgeAnimEdges.map(id => {
      const e = visEdges.get(id) || {};
      return { id, width: e._basewidth || 1.4, dashes: e._basedash || false,
               color:{ color: e._basecolor || '#888', highlight:_ac, hover:_ac } };
    }));
  }
  _edgeAnimEdges = [];
}

/* ── Tooltip HTML ──────────────────────────────────────── */
function buildTooltip(n){
  const c = nodeColor(n.type);
  const el = document.createElement('div');
  el.style.cssText = 'line-height:1.5;min-width:160px';
  el.innerHTML = `
    <div style="color:${c};font-weight:700;font-size:.8rem;margin-bottom:4px;font-family:'Outfit',sans-serif">${n.label}</div>
    ${n.description ? `<div style="color:#7a8db0;font-size:.65rem;margin-bottom:6px;max-width:220px">${n.description}</div>` : ''}
    <div style="display:flex;gap:.9rem;font-size:.62rem">
      <span style="color:#3d5070">Tipo: <span style="color:${c}">${(n.type||'').toUpperCase()}</span></span>
      ${n.score ? `<span style="color:#3d5070">Score: <span style="color:#10e98c;font-weight:700">${n.score}%</span></span>` : ''}
    </div>`;
  return el;
}

/* ── Resaltado del vecindario ──────────────────────────────────────
   RENDIMIENTO: la versión anterior llamaba a DataSet.update() UNA VEZ
   POR NODO y POR ARISTA (131 + 144 = 275 llamadas). Cada update()
   dispara un evento de cambio y un redibujado completo de la red, así
   que un solo hover encolaba 275 repintados — y hoverNode se dispara
   sin parar mientras se arrastra el ratón. De ahí la lentitud.

   Ahora se construye un array y se hace UN update() por DataSet (2 en
   total), más tres guardas: no repetir el mismo nodo, no trabajar si
   no hay nada que limpiar, y no resaltar mientras se arrastra.        */
let _hlNode = null;          // nodo resaltado actualmente (null = ninguno)
let _dragging = false;       // true mientras se arrastra un nodo

function highlightConnected(nodeId){
  if(!visNetwork || !visNodes || !visEdges) return;
  if(_dragging || _hlNode === nodeId) return;
  if(visNetwork.isCluster && visNetwork.isCluster(nodeId)) return;

  const connectedNodes = new Set(visNetwork.getConnectedNodes(nodeId));
  const connectedEdges = new Set(visNetwork.getConnectedEdges(nodeId));

  visNodes.update(visNodes.getIds().map(id => ({
    id, opacity: (id === nodeId || connectedNodes.has(id)) ? 1 : 0.2
  })));
  visEdges.update(visEdges.getIds().map(id => ({
    id, color: { opacity: connectedEdges.has(id) ? 1 : 0.05 }
  })));
  _hlNode = nodeId;
}

function resetHighlight(){
  if(!visNodes || !visEdges) return;
  if(_hlNode === null) return;                 // ya está limpio: nada que repintar
  visNodes.update(visNodes.getIds().map(id => ({ id, opacity: 1 })));
  visEdges.update(visEdges.getIds().map(id => ({ id, color: { opacity: 0.85 } })));
  _hlNode = null;
}

function isolateNode(nodeId){
  if(!visNetwork) return;
  const conn = visNetwork.getConnectedNodes(nodeId);
  const keep = new Set([nodeId, ...conn]);
  /* Un solo update() (mismo motivo que en highlightConnected). */
  visNodes.update(visNodes.getIds().map(id => ({ id, hidden: !keep.has(id) })));
  setTimeout(() => visNetwork.fit({ animation:{ duration:400, easingFunction:'easeOutQuad' } }), 50);
}

/* ── Control functions ─────────────────────────────────── */
function ontoAction(v){
  const sel = document.getElementById('sel-onto-action');
  if(!visNetwork || !v){ if(sel) sel.value=''; return; }
  if(v === 'fit'){                       // centrar y encuadrar la vista
    fitNetwork();
  } else if(v === 'clusters'){           // agrupar por las capas de la arquitectura
    clearOntoClusters();
    clusterMode = 1; clustered = true;
    clusterByField('_capa', 'diamond');
    ontoKick(80);                          // separa los clústeres y luego se apaga
  } else if(v === 'physics'){            // estado por defecto: recargar el grafo completo
    clearOntoClusters();
    clusterMode = 0; clustered = false;
    physicsActive = true;                  // el render arranca con física y se auto-apaga
    if(ontoRaw) renderOntologyGraph(ontoRaw.nodes, ontoRaw.links);
  }
  if(sel) setTimeout(()=>{ sel.value = ''; }, 250);   // permite repetir la misma acción
}

function togglePhysics(){
  physicsActive = !physicsActive;
  if(visNetwork) visNetwork.setOptions({ physics:{ enabled: physicsActive } });
  syncPhysicsBtn();
}
function syncPhysicsBtn(){
  const btn = document.getElementById('btn-physics');
  if(btn) btn.classList.toggle('active', physicsActive);
}

function fitNetwork(){
  if(visNetwork) visNetwork.fit({ animation:{ duration:700, easingFunction:'easeInOutCubic' } });
}

/* Enciende la física solo para N iteraciones; al estabilizar se apaga sola */
function ontoKick(iter = 120){
  if(!visNetwork) return;
  physicsActive = true;
  visNetwork.setOptions({ physics:{ enabled:true } });
  visNetwork.stabilize(iter);
}

function changeLayout(val){
  if(!visNetwork) return;
  const opts = buildVisOptions(val);
  visNetwork.setOptions(opts);
  if(val === 'physics'){
    physicsActive = true;
    visNetwork.stabilize(300);
    document.getElementById('vis-stabilizing')?.classList.add('show');
  } else {
    physicsActive = false;
  }
  syncPhysicsBtn();
  setTimeout(fitNetwork, 800);
}

/* Clustering a DOS NIVELES: 0=ninguno · 1=por Capas · 2=por Términos principales */
let clusterMode = 0;
let activeClusters = [];
function _ontoNodeMap(){ const m={}; (ontoRaw?ontoRaw.nodes:[]).forEach(n=>m[n.id]=n); return m; }
function clearOntoClusters(){
  activeClusters.forEach(id => { try{ if(visNetwork.isCluster(id)) visNetwork.openCluster(id); }catch(e){} });
  activeClusters = [];
}
function clusterByField(field, shape){
  const map = _ontoNodeMap();
  const groups = {};
  visNodes.forEach(n => { const k = n[field]; if(k) (groups[k] = groups[k] || []).push(n.id); });
  Object.keys(groups).forEach(key => {
    if(groups[key].length < 2) return;
    const meta = map[key] || {};
    const c = nodeColor(meta.type || 'default');
    const lbl = (meta.label || key).replace(/\s*\(.*\)$/,'');
    const cid = 'cl_' + field + '_' + key;
    visNetwork.cluster({
      joinCondition: n => n[field] === key,
      clusterNodeProperties: {
        id:    cid,
        label: lbl + `\n(${groups[key].length})`,
        value: groups[key].length * 8 + 26,
        color: { background: isDark ? '#0d1525' : '#fff', border: c, highlight:{ background: c+'22', border: c } },
        font:  { size: 14, color: isDark ? '#e8f0ff' : '#0d1526', face:'Outfit,sans-serif', bold:{mod:'bold'} },
        borderWidth: 3,
        shape: shape,
        shadow: { enabled:true, size:20, color: c+'44', x:0, y:0 },
      },
      processProperties: (cls) => cls,
    });
    activeClusters.push(cid);
  });
}
function setClusterBtnLabel(){
  const lbl = document.getElementById('btn-cluster-lbl');
  const btn = document.getElementById('btn-cluster');
  const txt = clusterMode === 1 ? 'Capas' : clusterMode === 2 ? 'Términos' : 'Clusters';
  if(lbl) lbl.textContent = txt;
  if(btn){
    btn.classList.toggle('active', clusterMode !== 0);
    btn.title = clusterMode === 0 ? 'Agrupar por capas' :
                clusterMode === 1 ? 'Agrupando por capas — clic: por términos principales' :
                'Agrupando por términos — clic: expandir todo';
  }
}
function toggleClusters(){
  if(!visNetwork) return;
  clearOntoClusters();
  clusterMode = (clusterMode + 1) % 3;     // ninguno → capas → términos → ninguno
  if(clusterMode === 1){
    clusterByField('_capa',  'diamond');   // Nivel 1: las 5 capas de la arquitectura
  } else if(clusterMode === 2){
    clusterByField('_norma', 'hexagon');   // Nivel 2: términos principales (normativas)
  }
  clustered = clusterMode !== 0;
  setClusterBtnLabel();
  setTimeout(fitNetwork, 400);
}

/* Update vis theme when dark/light toggled */
function updateVisTheme(){
  if(!visNetwork || !visNodes || !visEdges) return;
  const T = ontoTheme();
  const bg = isDark ? T.surface : '#ffffff';
  /* Un update() por DataSet, no uno por elemento (ver highlightConnected). */
  visNodes.update(visNodes.get().map(n => {
    const c = nodeColor(n._type);
    return {
      id: n.id,
      color: {
        background: n._isLayer ? c + (isDark?'33':'22') : bg,
        border: c,
        highlight:{ background: c+(isDark?'22':'18'), border: c },
        hover:{ background: c+(isDark?'18':'10'), border: c },
      },
      font: { color: T.nodeFont },
    };
  }));
  visEdges.update(visEdges.get().map(e => ({
    id: e.id,
    font: { color: T.edgeFont, background: T.edgeBg },
    color: { color: e._basecolor, highlight: T.accent, hover: T.accent },
  })));
}

// ══════════════════════════════════════════════════════════════════
//  DIGITAL TWIN
//  ★ FIX 1: maltg_ref can be string OR array — handle both
// ══════════════════════════════════════════════════════════════════

// ── Carga inicial de esta página (equivalente al bloque "Tab 02:
//    Ontology" de reloadAll() en dashboard.html) ────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo MALTG_ontology.json…' },
    { id: 's2', label: 'Leyendo detalle de nodos…' },
    { id: 's3', label: 'Construyendo grafo…' },
  ], async () => {
    step('s1', 'active');
    const onto = await (await fetch('/api/ontology?_=' + Date.now())).json();
    step('s1', 'done'); step('s2', 'active');
    try {
      const info = await (await fetch('/api/ontology-info?_=' + Date.now())).json();
      ontoInfo = (info && info.info) || {};
    } catch (e) { console.warn('ontology-info', e); }
    step('s2', 'done'); step('s3', 'active');

    if (!onto.error) {
      setTxt('onto-hash', onto.hash ? onto.hash.slice(0, 8) + '…' : '—');
      setTxt('onto-ts', new Date().toLocaleTimeString('es-EC', { hour12: false }));
      setTxt('onto-badge', `${onto.node_count} nodos · ${onto.link_count} enlaces`);
      renderOntologyGraph(onto.nodes, onto.links);
    }
    step('s3', 'done');
  });
};
