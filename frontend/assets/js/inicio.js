// ═══════════════════════════════════════════════════════════════════
//  Inicio — pantalla principal del dashboard MALTG Architecture Validator
//  Adaptado del diseño Nocturne (Claude Design canvas) a HTML/CSS/JS plano.
//
//  El carrusel es el ÚNICO mapa de navegación de la aplicación (las
//  páginas ya no llevan barra de pestañas: vuelven aquí con su botón
//  "MENÚ"). Contiene:
//    · la tarjeta 00 — carátula de la aplicación, con los dos controles
//      globales: cambiar de tema y recargar la aplicación;
//    · una tarjeta por cada una de las 13 páginas del dashboard
//      (frontend/pages/*.html), con su endpoint representativo.
//
//  Ningún color se escribe aquí: las tarjetas se pintan con las clases
//  de assets/css/inicio.css sobre los tokens del tema activo
//  (nocturne.css oscuro / aurora.css claro).
// ═══════════════════════════════════════════════════════════════════

const delay = ms => new Promise(r => setTimeout(r, ms));

// Un módulo por cada página real del dashboard (frontend/pages/*.html).
// El carrusel es el mapa de navegación completo del dashboard.
const ITEMS = [
  {
    // Tarjeta 00 — carátula: no navega a ninguna página, presenta el
    // producto y aloja los controles globales (tema y recarga).
    num: "00", key: "cover", cover: true, title: "MALTG",
    subtitle: "Architecture Validator · LegalTech",
    desc: "Valida la conformidad de una arquitectura LegalTech contra la ontología de gobernanza MALTG (TOGAF + COBIT + ITIL + NIST + dominio jurídico), sobre el proceso judicial ecuatoriano COGEP.",
    meta: "13 MÓDULOS · 70 ENDPOINTS", endpoint: "carátula", href: "pages/methodology.html"
  },
  {
    num: "01", key: "methodology", title: "Methodology",
    desc: "Metodología de validación en cinco fases y su modelo formal asociado.",
    meta: "MÉTODO FORMAL", endpoint: "/api/methodology", href: "pages/methodology.html",
    detail: "Las cinco fases del procedimiento de validación MALTG = ⟨Ω, Δ, Γ, Ψ, δ⟩ (ORE → DTSM → HCS → LDCC → MDGA) y el modelo formal que las respalda, incluida la relación entre evidencias, criterios y veredicto.",
    stats: [["FASES", "5"], ["MODELO", "formal"], ["ALCANCE", "método + evidencia"]]
  },
  {
    num: "02", key: "maltg", title: "Architecture",
    desc: "Panorama general: madurez MALTG, score de ontología vs. gemelo digital y brecha global.",
    meta: "PANEL PRINCIPAL", endpoint: "/api/maltg", href: "pages/maltg.html",
    detail: "Arquitectura multidimensional de gobernanza LegalTech (JSON-LD) con los KPIs centrales del validador: madurez MALTG, nodos de la ontología, score de la ontología OWL, score del gemelo digital y la brecha (GAP) entre ambos.",
    stats: [["FORMATO", "JSON-LD"], ["KPIs", "6 indicadores"], ["FUENTE", "MALTG_architecture.json"]]
  },
  {
    num: "03", key: "ontology", title: "Ontology",
    desc: "Grafo de la ontología MALTG_ontology.owl servido como estructura D3 (vis-network).",
    meta: "GRAFO SEMÁNTICO", endpoint: "/api/ontology", href: "pages/ontology.html",
    detail: "La ontología se sirve transformada a grafo dirigido: clases, propiedades y relaciones de gobernanza (TOGAF + COBIT + ITIL + NIST + dominio LegalTech), agrupables por clústeres de capa.",
    stats: [["FORMATO", "OWL → grafo"], ["VISTA", "nodos y aristas"], ["FUENTE", "MALTG_ontology.owl"]]
  },
  {
    num: "04", key: "digitalShadowGet", title: "Get Digital Shadow",
    desc: "La ontología en 3D con Three.js: nodos como estrellas, capas como constelaciones.",
    meta: "VISUALIZACIÓN 3D", endpoint: "/api/ontology", href: "pages/digitalShadowGet.html",
    detail: "Vista exploratoria en 3D de la misma ontología MALTG: cada nodo es una estrella y cada capa de gobernanza una constelación, con rotación, enlaces y etiquetas configurables.",
    stats: [["MOTOR", "Three.js"], ["UNIDAD", "nodo = estrella"], ["CONTROL", "rotación / velocidad"]]
  },
  {
    num: "05", key: "digitalShadow", title: "Digital Shadow Maturity",
    desc: "Arquitectura del Digital Shadow por servicios, con radar de madurez y brechas en 10 dimensiones.",
    meta: "DIGITAL SHADOW", endpoint: "/api/dt-arch", href: "pages/digitalShadow.html",
    detail: "Representación estructural del sistema implementado (Structural Digital Shadow) junto al contraste MALTG_onto vs. DT_arch: radar de madurez arquitectural y tabla de brechas por dimensión, con hash de integridad.",
    stats: [["DIMENSIONES", "10"], ["INTEGRIDAD", "hash SHA-256"], ["FUENTE", "sdt/*.json"]]
  },
  {
    num: "06", key: "workflow", title: "Workflow",
    desc: "Diagrama BPMN del flujo procesal COGEP (Sumario, Ordinario, Ejecución…) por expediente.",
    meta: "PROCESO BPMN", endpoint: "/api/workflow", href: "pages/workflow.html",
    detail: "Parsea los JSON de workflow BPMN (storage/workflow) y los representa como grafo de flujo procesal: etapas, actos y transiciones del procedimiento COGEP seleccionado.",
    stats: [["FORMATO", "BPMN → grafo"], ["PROCESOS", "Sumario, Ordinario…"], ["FUENTE", "storage/workflow/*.json"]]
  },
  {
    num: "07", key: "cogep", title: "Ontología COGEP · IA",
    desc: "Conocimiento procesal (Procedimiento → Etapa → Acto → Término → Sujeto) para el razonador jurídico.",
    meta: "RAZONADOR IA", endpoint: "/api/cogep/kb", href: "pages/cogep.html",
    detail: "Base de conocimiento COGEP que alimenta al asistente IA: juicios de valor sobre actuaciones, chat razonador sobre una causa y análisis de errores jurídicos en PDFs de expedientes.",
    stats: [["NORMA", "COGEP (R.O. 506)"], ["GRAFO", "Proc.→Etapa→Acto→Término"], ["FUENTE", "cogep_kb.json"]]
  },
  {
    num: "08", key: "bitacora", title: "Bitácora · Evidencia",
    desc: "Recolección documental reproducible: snapshots verificados y bitácora hash-encadenada.",
    meta: "TRAZABILIDAD", endpoint: "/api/bitacora", href: "pages/bitacora.html",
    detail: "Protocolo de recolección documental (v1) sobre fuentes del Consejo de la Judicatura: cada corrida produce snapshots con hash SHA-256 y un manifest, registrados en una bitácora append-only encadenada por hash.",
    stats: [["HASH", "SHA-256"], ["BITÁCORA", "append-only"], ["FUENTE", "data/bitacora.json"]]
  },
  {
    num: "09", key: "adaptativo", title: "Adaptativo · MAPE-K",
    desc: "Ciclo Monitor-Analyze-Plan-Execute sobre las ontologías: índice empírico, deriva y alertas.",
    meta: "GOBERNANZA ADAPTATIVA", endpoint: "/api/cogep/salud-global", href: "pages/adaptativo.html",
    detail: "Ciclo adaptativo MAPE-K que recalibra la gobernanza desde la realidad procesal: índice empírico de cumplimiento, deriva procesal (loops, ping-pong, estancamiento), cambio normativo con aplicación temporal y alertas de seguridad cognitiva.",
    stats: [["CICLO", "MAPE-K"], ["MÉTRICAS", "IVF, deriva, alertas"], ["FUENTE", "LegalCase/*.json"]]
  },
  {
    num: "10", key: "experto", title: "Validación Experta",
    desc: "Gold standard del abogado (F1/kappa) y pesos AHP de expertos para el ranking de dimensiones.",
    meta: "VALIDEZ IA", endpoint: "/api/eval/gold", href: "pages/experto.html",
    detail: "Dos frentes de validación: anotaciones gold standard de un abogado evaluadas contra el razonador (F1, precisión, recall, matriz de confusión, kappa), y pesos Ψ por comparación por pares AHP de expertos, con análisis de sensibilidad ±10/20%.",
    stats: [["MÉTRICAS", "F1 · kappa"], ["PESOS", "AHP (Saaty)"], ["GUÍA", "data/gold/GUIA_ANOTACION.md"]]
  },
  {
    num: "11", key: "guia", title: "Guía del Experimento",
    desc: "Glosario buscable de términos técnicos y metodológicos, y los supuestos vigentes del experimento.",
    meta: "REFERENCIA", endpoint: "búsqueda local", href: "pages/guia.html",
    detail: "Diccionario de términos (F1, MAPE-K, drift, AHP, términos legales…) con búsqueda en vivo, más una tabla de los supuestos vigentes del experimento y su procedencia.",
    stats: [["TIPO", "glosario buscable"], ["SUPUESTOS", "en vivo"], ["ALCANCE", "técnico + metodológico"]]
  },
  {
    num: "12", key: "tesis", title: "Tesis Doctoral",
    desc: "Modelo de Gobernanza LegalTech Adaptativa basada en IA — texto completo con métricas en vivo.",
    meta: "DOCUMENTO", endpoint: "múltiples endpoints", href: "pages/tesis.html",
    detail: "Resumen, 5 capítulos (Introducción, Estado del Arte, Metodología DSR, Propuesta y Resultados, Conclusiones) y bibliografía, con cifras que se leen en vivo desde la propia aplicación (causas analizadas, índice empírico…).",
    stats: [["CAPÍTULOS", "5 + resumen"], ["MÉTRICAS", "en vivo desde la app"], ["METODOLOGÍA", "Design Science Research"]]
  },];

// ── Tema (claro / oscuro) ──────────────────────────────────────────
// Misma clave y mismo contrato que core.js en las 13 páginas, para que
// el tema elegido aquí siga vigente al abrir un módulo y al volver.
// El aspecto lo resuelve el CSS: nocturne.css (oscuro) / aurora.css (claro).
const THEME_KEY = "maltg-theme";
let isDark = true;
try { isDark = localStorage.getItem(THEME_KEY) !== "light"; } catch (e) {}

function applyTheme(){
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}
function toggleTheme(){
  isDark = !isDark;
  try { localStorage.setItem(THEME_KEY, isDark ? "dark" : "light"); } catch (e) {}
  applyTheme();
  renderCards();   // repinta las etiquetas del botón de la carátula
}
applyTheme();

const state = { booting: true, active: 0, open: false, api: "probing" };
let tickTimer;

const $ = sel => document.querySelector(sel);
const cardStageEl = $("#cardStage");
const dotsEl = $("#dots");
const bootEl = $("#boot");

function fmtClock(){
  return new Date().toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
}

function move(d){
  state.active = (state.active + d + ITEMS.length) % ITEMS.length;
  renderCards();
}

function openDetail(){
  if (ITEMS[state.active].cover) return;   // la carátula no abre ficha
  state.open = true; renderDetail();
}
function closeDetail(){ state.open = false; renderDetail(); }

function coverCardHTML(it){
  return `
    <div class="cover-brand">
      <svg class="cover-mark" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".75"/>
        <polygon points="18,8 28,13 28,23 18,28 8,23 8,13" fill="none" stroke="currentColor" stroke-width="1" opacity=".35"/>
        <circle cx="18" cy="18" r="4" fill="currentColor"/>
      </svg>
      <div>
        <div class="cover-title">${it.title}</div>
        <div class="cover-sub">${it.subtitle}</div>
      </div>
    </div>
    <span class="cover-desc">${it.desc}</span>
    <div class="mod-card-rule"></div>
    <div class="cover-controls">
      <button class="cover-btn" id="coverTheme" type="button"
              title="Alternar entre el tema oscuro (nocturne) y el claro (aurora)">
        <span class="cover-btn-icon">${isDark ? "🌙" : "☀️"}</span>
        ${isDark ? "Tema oscuro" : "Tema claro"}
      </button>
      <button class="cover-btn" id="coverReload" type="button"
              title="Recargar la aplicación">
        <span class="cover-btn-icon">↺</span> Recargar
      </button>
    </div>
    <div class="mod-card-bottom">
      <span class="mod-card-meta">${it.meta}</span>
    </div>`;
}

function moduleCardHTML(it, on){
  return `
    <div class="mod-card-top">
      <span class="mod-card-num">${it.num}</span>
      <span class="mod-card-endpoint">${it.endpoint}</span>
    </div>
    <div class="mod-card-body">
      <span class="mod-card-title">${it.title}</span>
      <span class="mod-card-desc">${it.desc}</span>
    </div>
    <div class="mod-card-rule"></div>
    <div class="mod-card-bottom">
      <span class="mod-card-meta">${it.meta}</span>
      <span class="mod-card-action">${on ? "ABRIR ⏎" : ""}</span>
    </div>`;
}

function renderCards(){
  const n = ITEMS.length, active = state.active;
  cardStageEl.innerHTML = "";
  ITEMS.forEach((it, i) => {
    let o = i - active;
    if (o > n / 2) o -= n;
    if (o < -n / 2) o += n;
    const a = Math.abs(o), far = a > 2, on = o === 0;

    // La carátula lleva botones dentro, así que no puede ser un <button>
    // (anidar controles es HTML inválido y rompe el foco por teclado).
    const card = document.createElement(it.cover ? "div" : "button");
    card.className = "mod-card" + (on ? " is-active" : "") + (it.cover ? " cover-card" : "");
    card.style.transform = `translateX(${o*232}px) translateZ(${-a*190}px) rotateY(${-o*30}deg) scale(${1-a*0.05})`;
    card.style.opacity = far ? 0 : 1-a*0.42;
    card.style.filter = a >= 2 ? "blur(1.4px)" : "none";
    card.style.zIndex = 10 - a;
    card.style.pointerEvents = far ? "none" : "auto";
    card.innerHTML = it.cover ? coverCardHTML(it) : moduleCardHTML(it, on);

    if (it.cover) {
      // Traer la carátula al frente si se pulsa estando de lado.
      if (!on) card.onclick = () => { state.active = i; renderCards(); };
    } else {
      // Clic en la carta YA centrada:
      //  · sobre "ABRIR ⏎" (.mod-card-action) → abre la ficha de detalle
      //    (también con Enter, ver el atajo de teclado más abajo).
      //  · en cualquier otro punto de la carta → avanza a la siguiente,
      //    con el efecto de "pop" de .mod-card al recentrarse (inicio.css).
      card.onclick = (e) => {
        if (!on) { state.active = i; renderCards(); return; }
        if (e.target.closest(".mod-card-action")) openDetail();
        else move(1);
      };
    }
    cardStageEl.appendChild(card);
  });

  // Controles globales de la carátula (se recrean en cada render).
  const themeBtn = document.getElementById("coverTheme");
  if (themeBtn) themeBtn.onclick = e => { e.stopPropagation(); toggleTheme(); };
  const reloadBtn = document.getElementById("coverReload");
  if (reloadBtn) reloadBtn.onclick = e => {
    e.stopPropagation();
    reloadBtn.setAttribute("data-spin", "");
    location.reload();
  };

  dotsEl.innerHTML = "";
  ITEMS.forEach((it, i) => {
    const d = document.createElement("button");
    d.className = "dot" + (i === active ? " is-active" : "");
    d.title = it.cover ? "Carátula" : `${it.num} · ${it.title}`;
    d.onclick = () => { state.active = i; renderCards(); };
    dotsEl.appendChild(d);
  });
}

function renderDetail(){
  const backdrop = $("#detailBackdrop");
  if(!state.open){ backdrop.style.display = "none"; return; }
  const sel = ITEMS[state.active];
  $("#detailKicker").textContent = `${sel.num} · ${sel.endpoint}`;
  $("#detailTitle").textContent = sel.title;
  $("#detailDesc").textContent = sel.detail;
  $("#detailStats").innerHTML = sel.stats.map(([k,v]) =>
    `<div class="detail-stat"><span class="detail-stat-k">${k}</span><span class="detail-stat-v">${v}</span></div>`).join("");
  $("#detailOpen").href = sel.href;
  $("#detailApi").href = "/docs";
  $("#detailApiState").textContent = state.api === "online" ? "CANAL ACTIVO" : "API SIN CONFIRMAR · SE ABRIRÁ IGUAL";
  backdrop.style.display = "flex";
}

async function probeHealth(){
  const dot = $("#apiDot"), label = $("#apiLabel");
  dot.style.background = "var(--color-neutral-500)";
  label.style.color = "var(--color-neutral-500)";
  try {
    const c = new AbortController();
    const to = setTimeout(() => c.abort(), 2500);
    const r = await fetch("/api/health", { signal: c.signal });
    clearTimeout(to);
    state.api = r.ok ? "online" : "error";
  } catch (e) { state.api = "offline"; }
  const map = {
    probing: ["SONDEANDO API", "var(--color-neutral-500)"],
    online:  ["VALIDADOR EN LÍNEA", "var(--color-accent)"],
    offline: ["API SIN RESPUESTA", "var(--color-neutral-600)"],
    error:   ["API CON ERROR", "var(--color-accent-400)"]
  }[state.api];
  label.textContent = map[0]; label.style.color = map[1]; dot.style.background = map[1];
}

// El círculo se muestra mientras se sondea la API de verdad (no una
// cuenta de pasos decorativa) — con un mínimo visible para que no
// parpadee si la respuesta llega de inmediato.
async function boot(){
  await Promise.all([probeHealth(), delay(450)]);
  state.booting = false;
  bootEl.style.display = "none";
}

function tick(){
  $("#clock").textContent = fmtClock();
  tickTimer = setInterval(() => { $("#clock").textContent = fmtClock(); }, 1000);
}

document.addEventListener("keydown", e => {
  if (state.booting) return;
  if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
  else if (e.key === "Enter") { e.preventDefault(); openDetail(); }
  else if (e.key === "Escape") closeDetail();
});
$("#prevBtn").onclick = () => move(-1);
$("#nextBtn").onclick = () => move(1);
$("#detailClose").onclick = closeDetail;
$("#detailBackdrop").addEventListener("click", e => { if (e.target === e.currentTarget) closeDetail(); });

renderCards();
renderDetail();
tick();
boot();   // ya incluye el sondeo de la API (probeHealth)
