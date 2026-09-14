// ═══════════════════════════════════════════════════════════════════
//  tab-tesis.js — Página Tesis Doctoral (12): rellena los data-ts en
//  vivo. Requiere core.js. Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

let tsLoaded=false;
async function initTesisTab(){
  const set = (key,val)=>document.querySelectorAll(`[data-ts="${key}"]`).forEach(e=>e.textContent=val);
  try{
    const sg = await (await fetch('/api/cogep/salud-global?_='+Date.now())).json();
    set('causas', sg.n_causas); set('causas2', sg.n_causas);
    set('indice', sg.indice_global); set('indice2', sg.indice_global);
    set('evaluables', sg.actos_evaluables); set('evaluables2', sg.actos_evaluables); set('evaluables3', sg.actos_evaluables);
    set('enplazo', sg.actos_en_plazo); set('salud', sg.salud_media);
    const tb = document.getElementById('ts-t-proc');
    if(tb) tb.innerHTML = (sg.por_procedimiento||[]).map(p=>
      `<tr><td>${wfEsc(p.procedimiento)}</td><td class="dt-num">${p.n_causas}</td><td class="dt-num">${p.evaluadas}</td><td class="dt-num">${p.cumple}</td><td class="dt-num">${p.incumplimientos}</td><td class="dt-num dt-emphasis">${p.indice}</td><td class="dt-num">${p.salud_media??'—'}</td></tr>`).join('');
  }catch(e){}
  try{
    const kb = await (await fetch('/api/adaptativo/kb-changelog?_='+Date.now())).json();
    set('kbv', kb.version||'1.0');
  }catch(e){}
  try{
    const rep = await (await fetch('/api/eval/report?_='+Date.now())).json();
    set('f1chip', rep.disponible ? (rep.chip+(rep.apto?' (apto)':' (no apto)')) : 'sin validez medida — instrumento listo, sesión real pendiente');
  }catch(e){}
  if(!tsLoaded){   // alertas es costoso: solo la primera vez
    tsLoaded=true;
    try{
      const al = await (await fetch('/api/adaptativo/alertas?_='+Date.now())).json();
      const pn = al.por_nivel||{};
      set('alertas', al.n); set('criticas', pn.critica??0); set('altas', pn.alta??0); set('medias', pn.media??0);
    }catch(e){}
  }
}

// ── Carga inicial de esta página ────────────────────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo métricas en vivo de la app…' },
  ], async () => {
    step('s1', 'active');
    await initTesisTab();
    step('s1', 'done');
  });
};
