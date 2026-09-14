// ═══════════════════════════════════════════════════════════════════
//  tab-simulacion.js — Página Esfera Celeste Ontológica (05): la
//  ontología en 3D con Three.js (carga diferida).
//  Requiere core.js y sdtcj-render.js. Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

const SIM_COLOR = Object.assign({}, (typeof LAYER_COLOR!=='undefined'?LAYER_COLOR:{}), {
  strategic:'#e879f9', operational:'#38bdf8', itil:'#84cc16',
  foundation:'#94a3b8', tech:'#f97316'
});

let simState = {
  ready:false, loading:false, three:null, renderer:null, scene:null, camera:null,
  globe:null, autorotate:true, speed:1.0, showLinks:true, showLabels:true,
  nodes:[], nodeMeshes:[], linkLines:[], labelSprites:[], adj:{},
  raycaster:null, pointer:null, hovered:null, selected:null,
  dragging:false, px:0, py:0, camDist:660, frames:0, fpsT:0, raf:0
};

function simLoadThree(){
  return new Promise((res,rej)=>{
    if(window.THREE) return res();
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload=()=>res(); s.onerror=()=>rej(new Error('No se pudo cargar Three.js'));
    document.head.appendChild(s);
  });
}

async function initSimulacionTab(){
  if(simState.ready){ simResize(); return; }
  if(simState.loading) return;
  simState.loading = true;
  try{
    const [_, r] = await Promise.all([ simLoadThree(), fetch('/api/ontology?_='+Date.now()) ]);
    let data = await r.json();
    if(data.error || !data.nodes){
      const r2 = await fetch('../../env/data/MALTG_ontology.json?_='+Date.now());
      data = await r2.json();
    }
    simBuildScene(data);
    document.getElementById('sim-loading').style.display='none';
    document.getElementById('sim-count').textContent =
      data.nodes.length+' nodos · '+data.links.length+' enlaces';
    simState.ready = true;
  }catch(e){
    document.getElementById('sim-loading').textContent = '⚠ Error: '+e.message;
  }finally{ simState.loading = false; }
}

/* ── Layout: constelaciones por capa sobre la esfera ─────────────── */
function simLayout(nodes){
  const R = 260, GA = Math.PI*(3-Math.sqrt(5));
  const groups = {};
  nodes.forEach(n=>{ if(n.type!=='core'){ (groups[n.type]=groups[n.type]||[]).push(n); } });
  const keys = Object.keys(groups), K = keys.length;
  const pos = {};
  keys.forEach((k,gi)=>{
    // centro de constelación: espiral de fibonacci sobre la esfera
    const y = 1 - (gi+0.5)/K*2, rr = Math.sqrt(1-y*y), th = GA*gi*2.4;
    const c = new THREE.Vector3(Math.cos(th)*rr, y, Math.sin(th)*rr).normalize();
    // base tangente (u,v) en c
    const ref = Math.abs(c.y)<0.9 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
    const u = new THREE.Vector3().crossVectors(c,ref).normalize();
    const v = new THREE.Vector3().crossVectors(c,u).normalize();
    const members = groups[k].slice().sort((a,b)=>(b.r||8)-(a.r||8));
    members.forEach((n,i)=>{
      if(i===0){ pos[n.id]=c.clone().multiplyScalar(R); n._hub=true; return; }
      const cap = 0.42*Math.sqrt(i/members.length)+0.10, az = GA*i;
      const dir = c.clone().multiplyScalar(Math.cos(cap))
        .add(u.clone().multiplyScalar(Math.cos(az)*Math.sin(cap)))
        .add(v.clone().multiplyScalar(Math.sin(az)*Math.sin(cap)))
        .normalize();
      pos[n.id]=dir.multiplyScalar(R);
    });
  });
  nodes.forEach(n=>{ if(n.type==='core') pos[n.id]=new THREE.Vector3(0,0,0); });
  return pos;
}

/* ── Texturas (halo y etiquetas) ─────────────────────────────────── */
function simHaloTexture(color){
  const cv=document.createElement('canvas'); cv.width=cv.height=64;
  const g=cv.getContext('2d'), gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,color); gr.addColorStop(0.35,color+'66'); gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr; g.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(cv);
}
function simLabelSprite(text,color,fs,op){
  fs=fs||26; op=(op==null?1:op);
  const cv=document.createElement('canvas'), g=cv.getContext('2d');
  g.font='700 '+fs+'px monospace';
  cv.width=Math.ceil(g.measureText(text).width)+24; cv.height=fs+18;
  g.font='700 '+fs+'px monospace'; g.textBaseline='middle';
  g.shadowColor='rgba(0,0,0,.9)'; g.shadowBlur=6;
  g.fillStyle=color; g.fillText(text,12,cv.height/2);
  const k = fs>=26 ? 0.30 : 0.22;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({
    map:new THREE.CanvasTexture(cv), transparent:true, depthWrite:false, opacity:op }));
  sp.scale.set(cv.width*k, cv.height*k, 1);
  return sp;
}

/* ── Construcción de la escena ───────────────────────────────────── */
function simBuildScene(data){
  const wrap = document.getElementById('sim-canvas');
  const W = wrap.clientWidth||1200, H = wrap.clientHeight||640;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W/H, 1, 6000);
  camera.position.z = simState.camDist;
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setSize(W,H); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  wrap.appendChild(renderer.domElement);

  const globe = new THREE.Group(); scene.add(globe);
  const R = 260;

  // Fondo estelar
  (function(){
    const n=900, arr=new Float32Array(n*3);
    for(let i=0;i<n;i++){
      const v=new THREE.Vector3().randomDirection?
        new THREE.Vector3().randomDirection():
        new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize();
      v.multiplyScalar(2200+Math.random()*1500);
      arr.set([v.x,v.y,v.z],i*3);
    }
    const ge=new THREE.BufferGeometry();
    ge.setAttribute('position',new THREE.BufferAttribute(arr,3));
    scene.add(new THREE.Points(ge,new THREE.PointsMaterial({color:0x8899cc,size:2.2,sizeAttenuation:true,transparent:true,opacity:.55})));
  })();

  // Retícula (graticule) de la esfera celeste
  (function(){
    const mat=new THREE.LineBasicMaterial({color:0x4455aa,transparent:true,opacity:.10});
    for(let la=-60;la<=60;la+=30){
      const pts=[], rr=R*Math.cos(la*Math.PI/180), yy=R*Math.sin(la*Math.PI/180);
      for(let a=0;a<=64;a++){ const t=a/64*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(t)*rr,yy,Math.sin(t)*rr)); }
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat));
    }
    for(let lo=0;lo<180;lo+=30){
      const pts=[];
      for(let a=0;a<=64;a++){
        const t=a/64*Math.PI*2, x=R*Math.sin(t)*Math.cos(lo*Math.PI/180), z=R*Math.sin(t)*Math.sin(lo*Math.PI/180);
        pts.push(new THREE.Vector3(x,R*Math.cos(t),z));
      }
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat));
    }
  })();

  // Posiciones y nodos
  const pos = simLayout(data.nodes);
  const halos = {};
  simState.grayHalo = simHaloTexture('#8b93a7');   // halo gris para "no encontrados"
  simState.adj = {}; simState.nodeMeshes=[]; simState.labelSprites=[]; simState.meshById={};
  data.nodes.forEach(n=>{
    const color = SIM_COLOR[n.type]||SIM_COLOR.default||'#64748b';
    const p = pos[n.id];
    const size = n.type==='core' ? 14 : (n._hub ? 7.5 : 3.4+(n.r||8)*0.18);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 12, 10),
      new THREE.MeshBasicMaterial({color:color}));
    mesh.position.copy(p); mesh.userData = n; globe.add(mesh);
    // halo aditivo (estrella brillante)
    if(!halos[color]) halos[color]=simHaloTexture(color);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({
      map:halos[color], blending:THREE.AdditiveBlending, transparent:true, depthWrite:false, opacity:n.type==='core'?.95:.75}));
    halo.scale.setScalar(size*(n.type==='core'?7:5)); halo.position.copy(p); globe.add(halo);
    mesh.userData._halo=halo;
    mesh.userData._color=color;
    mesh.userData._haloMap=halo.material.map;
    simState.nodeMeshes.push(mesh);
    simState.meshById[n.id]=mesh;
    // etiqueta con el nombre de TODOS los nodos (hubs/core más grandes)
    const big = (n.type==='core' || n._hub);
    const sp=simLabelSprite(n.label||n.id, color, big?26:17, big?1:0.85);
    if(n.type==='core') sp.position.copy(p.clone().add(new THREE.Vector3(0,size+16,0)));
    else sp.position.copy(p.clone().setLength(p.length()+size+11));
    globe.add(sp); simState.labelSprites.push(sp);
    mesh.userData._label=sp;
    // arranque tenue: la constelación "despierta" cuando el escaneo encuentra evidencia
    const dim0 = n.type==='core' ? {m:.55,h:.35,l:.7} : {m:.3,h:.16,l:.42};
    mesh.material.transparent=true; mesh.material.opacity=dim0.m;
    halo.material.opacity=dim0.h; sp.material.opacity=dim0.l;
    mesh.userData._baseOp=dim0.m; mesh.userData._baseHalo=dim0.h; mesh.userData._baseLabel=dim0.l;
  });

  // Enlaces como arcos
  simState.linkLines=[];
  data.links.forEach(l=>{
    const a=pos[l.s], b=pos[l.t]; if(!a||!b) return;
    (simState.adj[l.s]=simState.adj[l.s]||new Set()).add(l.t);
    (simState.adj[l.t]=simState.adj[l.t]||new Set()).add(l.s);
    const mid=a.clone().add(b).multiplyScalar(0.5);
    const lift = (a.length()<1||b.length()<1) ? 0.55 : 1.12; // core→superficie vs arco exterior
    mid.setLength(Math.max(a.length(),b.length())*lift);
    const curve=new THREE.QuadraticBezierCurve3(a,mid,b);
    const isSub = l.type==='subClassOf';
    const line=new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)),
      new THREE.LineBasicMaterial({color:isSub?0x7f8fc9:0xa855f7,transparent:true,opacity:isSub?.30:.75}));
    line.userData={s:l.s,t:l.t,type:l.type,baseOp:isSub?.30:.75};
    globe.add(line); simState.linkLines.push(line);
  });

  Object.assign(simState,{scene,camera,renderer,globe,
    raycaster:new THREE.Raycaster(), pointer:new THREE.Vector2()});
  simBuildLegend(data.nodes);
  simBindEvents(renderer.domElement);
  simAnimate();
}

function simBuildLegend(nodes){
  const seen={}; nodes.forEach(n=>{ if(!seen[n.type]) seen[n.type]=(SIM_COLOR[n.type]||'#64748b'); });
  document.getElementById('sim-legend').innerHTML =
    Object.entries(seen).map(([t,c])=>
      `<span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:.45rem"></i>${t}</span>`).join('');
}

/* ── Interacción ─────────────────────────────────────────────────── */
function simBindEvents(el){
  el.style.cursor='grab';
  el.addEventListener('pointerdown',e=>{ simState.dragging=true; simState.px=e.clientX; simState.py=e.clientY; el.style.cursor='grabbing'; });
  addEventListener('pointerup',()=>{ simState.dragging=false; el.style.cursor='grab'; });
  el.addEventListener('pointermove',e=>{
    if(simState.dragging){
      const dx=e.clientX-simState.px, dy=e.clientY-simState.py;
      simState.globe.rotation.y += dx*0.005;
      simState.globe.rotation.x = Math.max(-1.2,Math.min(1.2,simState.globe.rotation.x+dy*0.005));
      simState.px=e.clientX; simState.py=e.clientY;
    }
    const rect=el.getBoundingClientRect();
    simState.pointer.set((e.clientX-rect.left)/rect.width*2-1, -((e.clientY-rect.top)/rect.height)*2+1);
    simHover(e.clientX-rect.left, e.clientY-rect.top);
  });
  el.addEventListener('wheel',e=>{
    e.preventDefault();
    simState.camDist=Math.max(320,Math.min(2000,simState.camDist+e.deltaY*0.6));
    simState.camera.position.z=simState.camDist;
  },{passive:false});
  el.addEventListener('click',()=>{
    simSelect(simState.hovered ? simState.hovered.userData.id : null);
  });
  new ResizeObserver(()=>simResize()).observe(document.getElementById('sim-wrap'));
}

function simHover(mx,my){
  const st=simState; if(!st.raycaster) return;
  st.raycaster.setFromCamera(st.pointer, st.camera);
  const hit=st.raycaster.intersectObjects(st.nodeMeshes,false)[0];
  const tip=document.getElementById('sim-tooltip');
  st.hovered = hit ? hit.object : null;
  if(hit){
    const n=hit.object.userData, deg=(st.adj[n.id]?st.adj[n.id].size:0);
    tip.innerHTML=`<b style="color:${SIM_COLOR[n.type]||'#fff'}">${n.label||n.id}</b><br>
      tipo: ${n.type}${n.cluster?' · capa: '+n.cluster:''}<br>
      conexiones: ${deg}${n.score!==''&&n.score!=null?' · score: '+n.score:''}`;
    tip.style.display='block';
    tip.style.left=Math.min(mx+14, (document.getElementById('sim-wrap').clientWidth-290))+'px';
    tip.style.top=(my+10)+'px';
  } else tip.style.display='none';
}

function simSelect(id){
  const st=simState; st.selected=id;
  const nb = id ? (st.adj[id]||new Set()) : null;
  st.nodeMeshes.forEach(m=>{
    const on = !id || m.userData.id===id || nb.has(m.userData.id);
    const baseOp   = (m.userData._scanOp  !=null)? m.userData._scanOp  : (m.userData._baseOp  !=null?m.userData._baseOp  :1);
    const baseHalo = (m.userData._scanHalo!=null)? m.userData._scanHalo : (m.userData._baseHalo!=null?m.userData._baseHalo:.75);
    const baseLbl  = (m.userData._scanOp  !=null)? Math.max(.85,m.userData._scanOp) : (m.userData._baseLabel!=null?m.userData._baseLabel:.85);
    m.material.opacity = on ? (id?Math.max(baseOp,.9):baseOp) : Math.min(.12,baseOp); m.material.transparent = true;
    if(m.userData._halo) m.userData._halo.material.opacity = on ? (id?Math.max(baseHalo,.8):baseHalo) : .05;
    if(m.userData._label) m.userData._label.material.opacity = on ? (id?Math.max(baseLbl,.9):baseLbl) : .1;
  });
  st.linkLines.forEach(l=>{
    const on = !id || l.userData.s===id || l.userData.t===id;
    l.material.opacity = on ? (id? Math.min(1,l.userData.baseOp+.45) : l.userData.baseOp) : .03;
  });
}

/* ── Controles UI ────────────────────────────────────────────────── */
function simToggleRotate(){
  simState.autorotate=!simState.autorotate;
  document.getElementById('sim-rot-btn').textContent = simState.autorotate?'⏸ Rotación':'▶ Rotación';
}
function simSetSpeed(d){
  simState.speed=Math.max(0.2,Math.min(4,+(simState.speed+d*0.4).toFixed(1)));
  document.getElementById('sim-speed').textContent='vel '+simState.speed.toFixed(1)+'×';
}
function simToggleLinks(){
  simState.showLinks=!simState.showLinks;
  simState.linkLines.forEach(l=>l.visible=simState.showLinks);
  document.getElementById('sim-links-btn').textContent='Enlaces: '+(simState.showLinks?'ON':'OFF');
}
function simToggleLabels(){
  simState.showLabels=!simState.showLabels;
  simState.labelSprites.forEach(s=>s.visible=simState.showLabels);
  document.getElementById('sim-labels-btn').textContent='Etiquetas: '+(simState.showLabels?'ON':'OFF');
}
function simResetView(){
  simState.globe.rotation.set(0,0,0);
  simState.camDist=660; simState.camera.position.z=660;
  if(typeof simScanClear==='function' && simScan.applied) simScanClear();
  simSelect(null);
}
function simResize(){
  const st=simState; if(!st.renderer) return;
  const w=document.getElementById('sim-canvas');
  const W=w.clientWidth||1, H=w.clientHeight||1;
  st.camera.aspect=W/H; st.camera.updateProjectionMatrix(); st.renderer.setSize(W,H);
}

/* ── Bucle de animación ──────────────────────────────────────────── */
function simAnimate(){
  simState.raf=requestAnimationFrame(simAnimate);
  const st=simState;
  if(typeof currentTab!=='undefined' && currentTab!=='simulacion') return; // pausa fuera del tab
  if(st.autorotate && !st.dragging) st.globe.rotation.y += 0.0018*st.speed;
  st.renderer.render(st.scene, st.camera);
  st.frames++;
  const now=performance.now();
  if(now-st.fpsT>1000){
    document.getElementById('sim-fps').textContent=st.frames+' fps';
    st.frames=0; st.fpsT=now;
  }
}

/* ═══ SCRAPING CJ SOBRE LA CONSTELACIÓN ═══════════════════════════
   Reusa POST /api/sdt-cj/scrape (tab 10 SDT_CJ). Cada término (nodo)
   de la ontología se escanea: pulso blanco → si el gemelo digital del
   sitio tiene evidencia para ese concepto la estrella queda encendida;
   si no, queda opaca. El log inferior muestra los datos en vivo.     */
let simScan = { running:false, applied:false };
const simSleep = ms => new Promise(r=>setTimeout(r,ms));

function simLog(html,color){
  const log=document.getElementById('sim-scan-log');
  const el=document.createElement('div');
  if(color) el.style.color=color;
  el.innerHTML=html;
  log.appendChild(el); log.scrollTop=log.scrollHeight;
  simHud(html,color);
  return el;
}
/* HUD lateral: espejo compacto del log dentro de la gráfica */
function simHud(html,color){
  const hud=document.getElementById('sim-hud'), body=document.getElementById('sim-hud-body');
  if(!hud||!body) return;
  hud.style.display='flex';
  const el=document.createElement('div');
  if(color) el.style.color=color;
  el.innerHTML=html;
  body.appendChild(el);
  while(body.children.length>18) body.removeChild(body.firstChild);
}

async function runSimScrape(){
  if(simScan.running) return;
  if(!simState.ready){ await initSimulacionTab(); if(!simState.ready) return; }
  simScan.running=true;
  const btn=document.getElementById('sim-scrape-btn'), stat=document.getElementById('sim-scan-status');
  btn.disabled=true; btn.style.opacity=.5;
  const url=(document.getElementById('sim-url').value||'').trim();
  const log=document.getElementById('sim-scan-log'); log.innerHTML='';
  const hudBody=document.getElementById('sim-hud-body'); if(hudBody) hudBody.innerHTML='';
  const hudTitle=document.getElementById('sim-hud-title'); if(hudTitle) hudTitle.textContent='▶ INSPECCIÓN EN VIVO';
  simScanClear();
  simLog('▶ Inspección iniciada · <b style="color:#00e5ff">'+url+'</b>','var(--t1)');
  simLog('&nbsp;&nbsp;protocolo: web scraping + análisis contra MALTG_ontology.owl (gemelo SDT_CJ)','var(--t3)');
  stat.textContent='⟳ inspeccionando el sitio…'; stat.style.color='#00e5ff';
  try{
    // la URL se envía como parámetro `base` (uso futuro en el backend)
    const r=await fetch('/api/sdt-cj/scrape?base='+encodeURIComponent(url),{method:'POST'});
    const doc=await r.json();
    if(doc.error){ simLog('⚠ '+doc.error,'#ff4d6d'); }
    await simScanAnimate(doc, stat);
  }catch(e){
    simLog('⚠ Error de red: '+e.message,'#ff4d6d');
    stat.textContent='error en la inspección'; stat.style.color='#ff4d6d';
  }finally{
    simScan.running=false; btn.disabled=false; btn.style.opacity=1;
  }
}

function simScanClear(){
  simScan.applied=false;
  simState.nodeMeshes.forEach(m=>{
    delete m.userData._scanOp; delete m.userData._scanHalo;
    if(m.userData._color) m.material.color.set(m.userData._color);
    if(m.userData._halo && m.userData._haloMap) m.userData._halo.material.map=m.userData._haloMap;
    m.material.opacity=(m.userData._baseOp!=null?m.userData._baseOp:1); m.material.transparent=true;
    if(m.userData._halo)  m.userData._halo.material.opacity=(m.userData._baseHalo!=null?m.userData._baseHalo:.75);
    if(m.userData._label) m.userData._label.material.opacity=(m.userData._baseLabel!=null?m.userData._baseLabel:.85);
  });
  document.getElementById('sim-scan-count').textContent='— nodos con evidencia';
}

/* Mapa: id de nodo ontológico → evidencias del SDT_CJ */
function simBuildRefMap(doc){
  const map={};
  const add=(id,ok,txt)=>{ const e=map[id]=map[id]||{ok:false,ev:[]}; if(ok)e.ok=true; if(txt)e.ev.push(txt); };
  (doc.services||[]).forEach(s=>{
    const ids=Array.isArray(s.maltg_ref)?s.maltg_ref:(s.maltg_ref?[s.maltg_ref]:[]);
    ids.forEach(id=> s.status==='absent'
      ? add(id,false,'AUSENTE: '+s.label)
      : add(id,true, s.label+(s.evidence?' ['+s.evidence+']':'')+' · '+s.status));
  });
  (doc.dimensions||[]).forEach(d=>(d.maltg_refs||[]).forEach(id=>
    add(id,true,(d.id||'')+' '+(d.label||'')+' · score '+d.score)));
  return map;
}

async function simScanAnimate(doc, stat){
  // Fase 1 — objetivos HTTP inspeccionados
  const targets=(doc.scrape_report&&doc.scrape_report.targets)||{};
  simLog('— Fase 1 · objetivos HTTP —','var(--t3)');
  for(const [k,t] of Object.entries(targets)){
    await simSleep(260);
    simLog(t.ok
      ? '✓ '+k+' <span style="color:var(--t3)">'+t.url+'</span> · HTTP '+t.status+' · '+((t.bytes||0)/1024).toFixed(0)+' KB · '+(t.ms||'—')+' ms'
      : '✗ '+k+' <span style="color:var(--t3)">'+(t.url||'')+'</span> · '+(t.error||'sin respuesta'),
      t.ok?'#10e98c':'#ff4d6d');
  }
  // Señales del portal
  const sr=doc.scrape_report||{};
  const señales=[['WordPress/Elementor',sr.wordpress_elementor_confirmado],['SATJE SPA moderna',sr.satje_spa_confirmado],
    ['datos abiertos',sr.referencia_datos_abiertos],['ISO 37001',sr.referencia_iso37001],
    ['JSON-LD/Web semántica',sr.web_semantica_jsonld_detectada],['API pública',sr.api_publica_detectada]];
  simLog('— señales: '+señales.map(([n,v])=>(v?'●':'○')+' '+n).join(' · ')+' —','var(--t3)');

  // Fase 2 — escaneo término a término, constelación por constelación
  simLog('— Fase 2 · escaneo de la ontología (constelación por constelación) —','var(--t3)');
  stat.textContent='⟳ escaneando términos de la ontología…';
  const refMap=simBuildRefMap(doc);
  const byType={};
  simState.nodeMeshes.forEach(m=>{ (byType[m.userData.type]=byType[m.userData.type]||[]).push(m); });
  let lit=0, off=0, gaps=0;
  for(const [type,meshes] of Object.entries(byType)){
    simLog('◆ Constelación <b style="color:'+(SIM_COLOR[type]||'#fff')+'">'+type+'</b> ('+meshes.length+' términos)','var(--t1)');
    for(const m of meshes){
      const n=m.userData, halo=n._halo, label=n._label;
      // pulso de escaneo
      m.scale.setScalar(1.9); if(halo){halo.material.opacity=1; halo.scale.multiplyScalar(1.6);}
      await simSleep(55);
      m.scale.setScalar(1);  if(halo) halo.scale.multiplyScalar(1/1.6);
      const ref=refMap[n.id];
      const hasInfo = !!(ref&&ref.ok) || n.type==='core';
      if(hasInfo){
        lit++;
        n._scanOp=1; n._scanHalo=.95;
        m.material.opacity=1; if(halo)halo.material.opacity=.95; if(label)label.material.opacity=1;
        simLog('&nbsp;&nbsp;✓ '+(n.label||n.id)+(ref&&ref.ev.length?' <span style="color:var(--t3)">— '+ref.ev.slice(0,3).join(' | ')+'</span>':''),'#10e98c');
      }else if(ref){ // referenciado pero AUSENTE en el sitio → gris claro
        gaps++;
        n._scanOp=.3; n._scanHalo=.12;
        m.material.color.set('#8b93a7');
        m.material.opacity=.3;
        if(halo){ halo.material.map=simState.grayHalo; halo.material.opacity=.12; }
        if(label)label.material.opacity=.2;
        simLog('&nbsp;&nbsp;✗ '+(n.label||n.id)+' <span style="color:var(--t3)">— '+ref.ev.slice(0,2).join(' | ')+'</span>','#ff4d6d');
      }else{ // sin información → gris claro translúcido
        off++;
        n._scanOp=.26; n._scanHalo=.10;
        m.material.color.set('#8b93a7');
        m.material.opacity=.26;
        if(halo){ halo.material.map=simState.grayHalo; halo.material.opacity=.10; }
        if(label)label.material.opacity=.16;
        simLog('&nbsp;&nbsp;○ '+(n.label||n.id)+' — sin evidencia en el sitio','var(--t3)');
      }
      document.getElementById('sim-scan-count').textContent=lit+' con evidencia · '+gaps+' ausentes · '+off+' sin datos';
    }
  }
  simScan.applied=true;
  // Resumen
  const mat=doc.maturity||{};
  simLog('■ Escaneo completo · <b style="color:#10e98c">'+lit+' encendidos</b> · <b style="color:#ff4d6d">'+gaps+' brechas (ausentes)</b> · '+off+' apagados','var(--t1)');
  if(mat.overall_score!=null)
    simLog('■ Madurez LegalTech del sitio: <b style="color:#ffc947">'+mat.overall_score+'/100 — '+(mat.overall_level||'')+'</b>','var(--t1)');
  (mat.dimensions_summary||[]).forEach(d=>simLog('&nbsp;&nbsp;· '+d.id+' '+d.label+' → '+d.score+'/100 ('+d.level+')','var(--t2)'));
  if(doc._saved_sdt){
    simLog('💾 SDT JSON-LD guardado en <b style="color:#ffc947">'+doc._saved_sdt+'</b>','var(--t1)');
    const fb=document.getElementById('sim-sdt-file'); if(fb) fb.textContent=doc._saved_sdt;
  }else if(doc._sdt_save_error){
    simLog('⚠ No se pudo guardar el SDT: '+doc._sdt_save_error,'#ff4d6d');
  }
  try{
    const ex=document.getElementById('sim-extra'); if(ex) ex.style.display='';
    renderSdtCjGraph(doc,'sim-sdtcj-graph');
    renderSdtCjRadar(doc,'sim-sdtcj-radar');
    renderSdtCjDims(doc,'sim-dims');
    renderSdtCjDetail(doc,'sim-detail');
  }catch(e){ console.warn('sim extra', e); }
  stat.textContent='✓ inspección completa — Reset restaura el estado tenue'; stat.style.color='#10e98c';
  const hudT=document.getElementById('sim-hud-title'); if(hudT) hudT.textContent='✓ INSPECCIÓN COMPLETA';
}

// ── Carga inicial de esta página ────────────────────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Cargando motor 3D (Three.js) y ontología…' },
  ], async () => {
    step('s1', 'active');
    await initSimulacionTab();
    step('s1', 'done');
  });
};
