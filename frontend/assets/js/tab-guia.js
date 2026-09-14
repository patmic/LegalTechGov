// ═══════════════════════════════════════════════════════════════════
//  tab-guia.js — Página Guía del Experimento (11). Requiere core.js.
//  Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

const GUIA = [
 {cat:"🔄 El ciclo adaptativo", items:[
  ["MAPE-K","Patrón de sistemas autonómicos (Kephart & Chess, 2003): Monitor (observar expedientes reales) → Analyze (razonador + detectores) → Plan (índice empírico y alertas) → Execute (recalibrar el radar), todo sobre una base de Knowledge — aquí, las ontologías MALTG y COGEP. Es lo que hace 'Adaptativa' a la gobernanza: los scores se recalculan desde la realidad procesal, no se declaran."],
  ["Gobernanza adaptativa","El modelo MALTG no es una foto fija: cuando cambian los datos (nuevas causas), el calendario judicial, la norma (reformas) o los supuestos del experto, los indicadores se recalculan y el cambio queda trazado en la bitácora."],
  ["Índice empírico global","Porcentaje de actos procesales realizados dentro del término legal sobre el total de actos evaluables, medido en lote sobre todos los expedientes de /data/LegalCase. Alimenta la dimensión LegalTech del radar según el 'peso empírico' configurado."],
  ["Guardrails ontológicos","Restricciones de frontera: la IA solo puede clasificar dentro del vocabulario cerrado de la ontología (16 actos, 11 términos). Lo que no encaja se marca 'fuera de frontera' y se deriva a criterio humano — nunca se inventa una respuesta. Es el mecanismo anti-alucinación del sistema."],
  ["Trazabilidad de la adaptación (M5)","Cada salida lleva metadatos de contexto: hash de la KB, del calendario de feriados, de la configuración y versión del razonador. Cada cambio queda en la bitácora hash-encadenada. Permite reproducir cualquier resultado histórico."]]},
 {cat:"🧬 Gemelos digitales (taxonomía)", items:[
  ["Modelo digital","Representación digital SIN flujo automático de datos con el sistema real (Kritzinger et al., 2018). El SDT del Consejo de la Judicatura es un modelo digital estructural: snapshot documental verificable."],
  ["Sombra digital","Flujo automático real→digital, sin retroalimentación. El razonador COGEP sobre expedientes SATJE reales es una sombra digital cognitiva."],
  ["Gemelo digital (pleno)","Exigiría retroalimentación bidireccional (p.ej. alertas de plazo notificadas a e-SATJE). Declarado como trabajo futuro — la taxonomía se usa con rigor en vez de sobre-reclamar."],
  ["SDT","Structural Digital Twin/Model — la representación JSON-LD del ecosistema tecnológico del CJ (capas, servicios, conexiones, dimensiones), construida desde fuentes oficiales con snapshots SHA-256."]]},
 {cat:"📐 Métricas del experimento", items:[
  ["Salud procesal (0–100)","Por causa: promedio de puntos por término evaluado (CUMPLE=100, ALERTA=60, INCUMPLE=0). Calculada por el razonador simbólico con el calendario judicial vigente."],
  ["IVF — Índice de Variabilidad Fáctica (0–100)","M1. Mide cuánto se aparta el contexto fáctico (las actividades reales del juez) del flujo canónico COGEP: actos faltantes + actuaciones no clasificables, sobre el total esperado. IVF alto = tramitación atípica."],
  ["IDP — Índice de Deriva Procesal (0–100)","M2 (process drift). Suma puntos configurables por patrón detectado: loops (misma providencia repetida ≥k veces), ping-pong (A→B→A→B), estancamiento (término COGEP vencido — criterio legal primario — o gap referencial sin fundamento normativo) y retroceso de etapa. Detecta patrones de dilación; no atribuye conducta."],
  ["Score de riesgo (ranking)","riesgo = w₁·(100−salud) + w₂·IVF + w₃·IDP, con pesos fijados por el usuario-experto. Ordena los juicios de cada proceso de peor a mejor tramitación."],
  ["Ψ (Psi) — cobertura de dimensión","Ψ(d) = w_root·[raíz cubierta] + w_subs·(subconceptos cubiertos / total). Mide qué fracción de cada dimensión de gobernanza está implementada en el SDT. Sus pesos se justifican vía AHP o panel de supuestos."]]},
 {cat:"🎯 Validez del razonador (IA)", items:[
  ["Gold standard","Conjunto de actuaciones anotadas por un abogado (acto correcto + veredicto correcto) contra el cual se mide el sistema. Es la referencia de verdad; sin él, el dictamen IA sería una demostración sin validez conocida."],
  ["Precisión / Recall / F1","Precisión: de lo que el sistema etiquetó como X, cuánto era realmente X. Recall: de todo lo que era X, cuánto encontró. F1: media armónica de ambas (0–1). Se reporta macro (promedio por clase) para no premiar solo las clases frecuentes."],
  ["Matriz de confusión","Tabla gold×predicción: la diagonal son aciertos; cada celda fuera de la diagonal muestra qué confunde el sistema con qué (insumo del análisis de errores)."],
  ["Kappa de Cohen (κ)","Acuerdo entre dos anotadores humanos corrigiendo el azar. κ alto valida que la tarea misma es objetiva; se calcula automáticamente si dos abogados anotan ítems comunes."],
  ["Chip de validez","Junto a los resultados se muestra 'F1 x.xx · N=n' o 'sin validez medida': transparencia sobre el desempeño conocido del sistema en cada momento."]]},
 {cat:"⚖ Derecho procesal (COGEP)", items:[
  ["Término legal","Plazo en días hábiles que el COGEP fija para un acto procesal (p.ej. Art. 333.3: contestación en el sumario). El razonador computa días hábiles entre el acto que abre y el que cierra cada término."],
  ["Días hábiles (Arts. 73 y 77)","Se excluyen sábados, domingos, feriados y suspensiones de término del Consejo de la Judicatura. El calendario es configurable en el panel Calendario — mayor fuente histórica de falsos INCUMPLE."],
  ["CUMPLE / ALERTA / INCUMPLE","días ≤ término ⇒ CUMPLE · término < días ≤ término×factor ⇒ ALERTA · mayor ⇒ INCUMPLE. El factor (default 1.25) es un supuesto configurable. Art. 93 COGEP: el incumplimiento de términos es sancionable."],
  ["Procedimientos","SUMARIO (Arts. 332–333), ORDINARIO, MONITORIO, EJECUTIVO, EJECUCIÓN, APELACIÓN, VOLUNTARIO — cada uno con etapas y actos canónicos en la ontología, mapeados a los flujos BPMN del e-SATJE (141, 143, 135…)."],
  ["Aplicación temporal de la norma","Si se registra una reforma (panel Cambio Normativo), el razonador aplica a cada acto la versión de la regla vigente a la fecha de ese acto, no la actual — como corresponde jurídicamente."]]},
 {cat:"🧪 Ontologías y verificación", items:[
  ["Ontología","Especificación formal de conceptos y relaciones de un dominio. MALTG (gobernanza: capas, dimensiones) y COGEP (procesal: Procedimiento→Etapa→Acto→Término→Sujeto) son las dos del proyecto."],
  ["OWL","Web Ontology Language (W3C). La KB COGEP se exporta a COGEP_ontology.owl para verificarla con herramientas estándar (Protégé + razonador HermiT, detector de pitfalls OOPS!)."],
  ["Competency Questions (CQ)","Prueba estándar de adecuación: preguntas que la ontología debe poder responder ('¿qué actos del sumario tienen término y qué artículo los fija?'). Si las responde, la ontología sirve para lo que se diseñó."],
  ["SPARQL","Lenguaje de consulta sobre ontologías/RDF. Cada CQ muestra su consulta SPARQL equivalente para el anexo de la tesis; en la app se resuelven sobre la KB."],
  ["Verificación estructural","Chequeos C1–C7 automatizados: referencias íntegras (actos, sujetos, procedimientos), términos positivos con artículo, keywords de matching, actos huérfanos. Complementa (no sustituye) al razonador DL externo."]]},
 {cat:"📊 Metodología y evidencia", items:[
  ["Muestreo intencional estratificado","Las ~47 causas no son una muestra aleatoria: se seleccionaron por procedimiento y provincia desde el portal público SATJE. Permite generalización analítica (el método funciona) — NO inferencia estadística poblacional."],
  ["AHP (Analytic Hierarchy Process)","Método de Saaty para derivar pesos desde comparaciones por pares de expertos (escala 1–9), con verificación de consistencia (CR<0.10). Justifica los pesos de Ψ en lugar de asumirlos."],
  ["Análisis de sensibilidad","Perturba cada peso ±10/20% y verifica si el resultado global y el top del ranking se mantienen. Resultado estable = las conclusiones no dependen del valor exacto asumido."],
  ["Evidencia SHA-256","Cada fuente documental se captura como snapshot con hash SHA-256 y manifest (tab Bitácora). Congela la evidencia: cualquier revisor puede verificar la integridad."],
  ["Bitácora hash-encadenada","Registro append-only donde cada entrada incluye el hash de la anterior (mismo principio que un ledger). Toda decisión metodológica, cambio de supuestos y recálculo queda asentado e inalterable."],
  ["Rúbrica de dimensiones","Escala 0–100 en 5 niveles con criterios observables por dimensión de gobernanza. Un score sin evidencia asociada queda rotulado 'declarado' — la rúbrica convierte opinión en medición."]]}
];
let guInit=false;
function initGuiaTab(){
  if(!guInit){ guRender(); guInit=true; }
  guRenderSupuestos();
}
function guRender(){
  const cont = document.getElementById('gu-contenido');
  cont.innerHTML = GUIA.map(g=>`<div class="panel gu-cat" style="margin-bottom:1rem">
    <div class="ph"><div class="ptitle">${g.cat}</div><span class="pbadge d">${g.items.length} términos</span></div>
    <div style="padding:.5rem 1rem .8rem">`+
    g.items.map(it=>`<details class="gu-item" style="border-bottom:1px dashed rgba(255,255,255,.07);padding:.3rem 0">
      <summary style="cursor:pointer;font-size:.74rem;color:var(--t1)"><b>${it[0]}</b></summary>
      <div style="font-size:.68rem;color:var(--t2);line-height:1.65;padding:.35rem 0 .2rem .8rem">${it[1]}</div>
    </details>`).join('')+'</div></div>').join('');
  document.getElementById('gu-n').textContent = GUIA.reduce((a,g)=>a+g.items.length,0)+' términos';
}
function guFiltrar(){
  const q = document.getElementById('gu-buscar').value.toLowerCase().trim();
  let visibles=0;
  document.querySelectorAll('.gu-item').forEach(el=>{
    const hit = !q || el.textContent.toLowerCase().includes(q);
    el.style.display = hit?'':'none'; if(hit) visibles++;
    if(q && hit) el.open = true; else if(!q) el.open = false;
  });
  document.querySelectorAll('.gu-cat').forEach(c=>{
    c.style.display = [...c.querySelectorAll('.gu-item')].some(i=>i.style.display!=='none') ? '' : 'none';
  });
  document.getElementById('gu-n').textContent = visibles+' términos';
}
async function guRenderSupuestos(){
  const el = document.getElementById('gu-supuestos'); if(!el) return;
  try{
    const d = (typeof adState!=='undefined' && adState.sup) ? adState.sup
            : await (await fetch('/api/adaptativo/supuestos?_='+Date.now())).json();
    el.innerHTML = `<table class="dtable">
      <thead><tr>
      <th>Grupo</th><th>Supuesto</th>
      <th style="text-align:center">Valor vigente</th><th>Rango permitido</th>
      <th>Procedencia</th></tr></thead><tbody>`+
      (d.supuestos||[]).map(s=>`<tr>
        <td style="font-family:var(--font-mono);font-size:.58rem;color:var(--t3)">${s.grupo}</td>
        <td style="color:var(--t2)">${s.nombre}</td>
        <td style="text-align:center;font-family:var(--font-mono);color:var(--cyan)">${s.valor??'—'}</td>
        <td style="font-family:var(--font-mono);color:var(--gold)">[${s.min} – ${s.max}]</td>
        <td style="font-family:var(--font-mono);font-size:.56rem;color:var(--t3)">${s.procedencia||''}</td></tr>`).join('')+'</tbody></table>';
  }catch(e){ el.innerHTML = '<span style="font-size:.64rem;color:var(--t3)">Inicie el tab Adaptativo para cargar los supuestos.</span>'; }
}

// ── Carga inicial de esta página ────────────────────────────────────
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Leyendo glosario y supuestos vigentes…' },
  ], async () => {
    step('s1', 'active');
    initGuiaTab();
    step('s1', 'done');
  });
};
