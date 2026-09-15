// ═══════════════════════════════════════════════════════════════════
//  core.js — Runtime compartido por las 13 páginas del dashboard MALTG
//  (frontend/pages/*.html). Se carga ANTES del script propio de cada
//  página (misma orden que en el <head>: core.js primero, tab-X.js
//  después, ambos con `defer`, así que core.js ya definió todo esto
//  cuando el script de la página se ejecuta).
//
//  Contiene: helpers usados por varias pestañas (escapado HTML, mapas
//  de color), el cambio de tema (persistido para que sobreviva a la
//  navegación entre páginas), el inyector del header compartido, y el
//  runner de la animación de arranque (el overlay "Sincronizando
//  ecosistema MALTG…") que cada página usa para cargar sus propios
//  datos apenas termina de cargar el documento.
//
//  NAVEGACIÓN: las páginas ya no llevan barra de pestañas ni botones
//  sueltos en el header — el único control es el botón de rayas (☰),
//  que despliega un panel con: Home (vuelve al carrusel de Inicio),
//  el conmutador de tema, el punto de estado, y un atajo a los 13
//  módulos. Ver initNavMenu().
//
//  TEMA: el aspecto de cada tema vive en CSS, no aquí —
//  assets/css/nocturne.css (oscuro) y assets/css/aurora.css (claro).
//  Este archivo conmuta html[data-theme], lo persiste en localStorage
//  (compartido con la carátula del carrusel, que usa la misma clave) y
//  sincroniza las librerías que pintan en <canvas> y no leen CSS
//  (Chart.js, vis-network) cuando el conmutador del menú se usa en
//  caliente, sin recargar la página.
// ═══════════════════════════════════════════════════════════════════

// Version de assets: se lee del ?v= con que el HTML carga este mismo
// archivo, para que el fetch del header no quede servido de cache viejo.
const APP_VERSION_Q = (() => {
  try {
    const m = (document.currentScript && document.currentScript.src || '').match(/[?&]v=([^&]+)/);
    return m ? '?v=' + m[1] : '';
  } catch (e) { return ''; }
})();

// ── Helpers genéricos (antes duplicados/dispersos en dashboard.html) ──
const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
const delay  = ms => new Promise(r => setTimeout(r, ms));

// Escapado HTML — usado por prácticamente todas las pestañas al inyectar
// texto dinámico vía innerHTML (nombre histórico "wfEsc", se conserva
// para no tener que renombrar los ~90 sitios que ya lo llaman así).
function wfEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Word-wrap para etiquetas de SVG: <text> no salta de línea solo, así que hay
// que partir el texto y emitir un <tspan> por línea. Devuelve SIEMPRE un array
// (nunca vacío) para que el `.map(...)` del llamador no falle.
//   wfWrap(texto, maxChars, maxLines) -> ["linea 1", "linea 2", …]
// Lo usan tab-workflow.js (nodos y anotaciones BPMN) y tab-maltg.js (Foundation
// Layer). Si el texto no cabe en maxLines se recorta con elipsis; las palabras
// más largas que maxChars se parten con guion en vez de desbordar la caja.
function wfWrap(text, maxChars, maxLines) {
  const max = Math.max(1, parseInt(maxChars, 10) || 24);
  const lim = Math.max(1, parseInt(maxLines, 10) || 3);
  const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!t) return [''];

  const palabras = [];
  t.split(' ').forEach(w => {
    while (w.length > max) { palabras.push(w.slice(0, max - 1) + '-'); w = w.slice(max - 1); }
    if (w) palabras.push(w);
  });

  const lineas = [];
  let linea = '';
  palabras.forEach(w => {
    if (!linea) linea = w;
    else if (linea.length + 1 + w.length <= max) linea += ' ' + w;
    else { lineas.push(linea); linea = w; }
  });
  if (linea) lineas.push(linea);
  if (!lineas.length) return [''];
  if (lineas.length <= lim) return lineas;

  const cortadas = lineas.slice(0, lim);
  const ultima = cortadas[lim - 1];
  cortadas[lim - 1] = (ultima.length > max - 1 ? ultima.slice(0, max - 1) : ultima) + '…';
  return cortadas;
}

// Colores por capa de gobernanza (ontología MALTG) — usados por Ontología y Simulación 3D.
const LAYER_COLOR = {
  core: '#00e5ff', togaf: '#00e5ff', cobit: '#ffc947',
  nist: '#ff4d6d', ai: '#a855f7', blockchain: '#10e98c',
  opendata: '#ff9a3c', security: '#f472b6',
  legaltech: '#60a5fa', default: '#64748b',
};
function nodeColor(type) { return LAYER_COLOR[type] || LAYER_COLOR.default; }

// Colores de estado procesal (COGEP) — usados por Workflow y COGEP·IA.
const SALUD_COL = { CUMPLE: '#10e98c', ALERTA: '#ffc947', INCUMPLE: '#ff4d6d', NO_EVALUABLE: '#64748b', INFORMATIVO: '#60a5fa' };

// ── Tema (claro / oscuro) ────────────────────────────────────────
// Antes vivía solo en memoria (una SPA = un documento). Ahora cada
// módulo es una página distinta, así que el tema se persiste en
// localStorage para que no "salte" al navegar entre páginas — y lo
// comparte con la pantalla de Inicio, que usa la misma clave.
const THEME_KEY = 'maltg-theme';

let isDark = true;
try { isDark = localStorage.getItem(THEME_KEY) !== 'light'; } catch (e) {}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// Aplica el tema guardado antes de que el usuario vea nada (evita el
// parpadeo del tema equivocado en la primera pintura de la página).
applyTheme();

function toggleTheme() {
  isDark = !isDark;
  try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch (e) {}
  applyTheme();
  syncThemeIcon();

  // Sync vis-network (solo existe en la página Ontología)
  if (typeof updateVisTheme === 'function') updateVisTheme();

  // Sync Chart.js (radar/gap solo existen en la página Gemelo Digital)
  if (typeof Chart !== 'undefined') {
    const gridC = isDark ? '#1a2744' : '#d0d6e4';
    const textC = isDark ? '#7a8db0' : '#3a4d70';
    Chart.defaults.color = textC;
    if (typeof radarChart !== 'undefined' && radarChart) {
      radarChart.options.scales.r.grid.color = gridC;
      radarChart.options.scales.r.angleLines.color = gridC;
      radarChart.options.scales.r.pointLabels.color = textC;
      radarChart.update();
    }
    if (typeof gapChart !== 'undefined' && gapChart) {
      gapChart.options.scales.x.grid.color = gridC;
      gapChart.options.scales.y.grid.color = gridC;
      gapChart.options.scales.x.ticks.color = textC;
      gapChart.options.scales.y.ticks.color = textC;
      gapChart.update();
    }
  }
}

// ── Header compartido ─────────────────────────────────────────────
// Las 13 páginas son documentos independientes: en vez de repetir a
// mano el markup del header en cada una (13 copias que divergirían con
// el tiempo), cada página trae un <div id="app-header"> vacío y este
// script inyecta el partial compartido y conecta sus controles.
//
// Mismas 13 entradas que el carrusel de Inicio (frontend/index.html →
// assets/js/inicio.js), en el mismo orden — si se agrega o renombra un
// módulo ahí, actualizar también aquí.
const NAV_PAGES = {
  methodology:      { num: '01', label: 'Methodology' },
  maltg:            { num: '02', label: 'Architecture' },
  ontology:         { num: '03', label: 'Ontology' },
  digitalShadowGet: { num: '04', label: 'Get Digital Shadow' },
  digitalShadow:    { num: '05', label: 'Digital Shadow Maturity' },
  workflow:         { num: '06', label: 'Workflow' },
  cogep:            { num: '07', label: 'Ontología COGEP · IA' },
  bitacora:         { num: '08', label: 'Bitácora · Evidencia' },
  adaptativo:       { num: '09', label: 'Adaptativo · MAPE-K' },
  experto:          { num: '10', label: 'Validación Experta' },
  guia:             { num: '11', label: 'Guía del Experimento' },
  tesis:            { num: '12', label: 'Tesis Doctoral' },
  styles:           { num: '13', label: 'UI Styles' },
};

// Íconos de línea (24×24, trazo — mismo idioma visual que la imagen de
// referencia del menú: un ícono simple a la izquierda de cada opción).
// Cada valor es el contenido INTERNO del <svg> (paths/shapes); svgIcon()
// arma el envoltorio con los atributos comunes.
const NAV_ICON_PATHS = {
  home:        '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  themeMoon:   '<circle cx="12" cy="12" r="9" stroke-dasharray="2 3.2"/><path d="M15 8.2a4.6 4.6 0 1 0 0 7.6 5.6 5.6 0 1 1 0-7.6Z" fill="currentColor" stroke="none"/>',
  themeSun:    '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  methodology: '<path d="M4 6h11M4 12h7M4 18h11"/><circle cx="19.3" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.3" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19.3" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
  maltg:       '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  ontology:    '<circle cx="18" cy="5" r="2.3"/><circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="19" r="2.3"/><line x1="8.1" y1="10.7" x2="15.9" y2="6.3"/><line x1="8.1" y1="13.3" x2="15.9" y2="17.7"/>',
  digitalShadow: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  digitalShadowGet: '<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>',
  workflow:    '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="2.3"/><circle cx="6" cy="18" r="2.3"/><path d="M18 8.3A9 9 0 0 1 9 17.3"/>',
  cogep:       '<path d="M12 3v18M5 8h14"/><path d="M5 8 2 15a3 3 0 0 0 6 0Z"/><path d="M19 8l-3 7a3 3 0 0 0 6 0Z"/>',
  bitacora:    '<path d="M6 3h9l5 5v13H6z"/><line x1="9" y1="12" x2="16" y2="12"/><line x1="9" y1="16" x2="16" y2="16"/>',
  adaptativo:  '<path d="M21 12a9 9 0 0 1-15.5 6.3L2 15"/><path d="M3 12a9 9 0 0 1 15.5-6.3L22 9"/><polyline points="21 3 21 9 15 9"/><polyline points="3 21 3 15 9 15"/>',
  experto:     '<path d="M12 2 4 5v6c0 5 3.4 8.4 8 9.9C16.6 19.4 20 16 20 11V5Z"/><path d="M9 12l2 2 4-4"/>',
  guia:        '<path d="M2 5.5C4 4 7 3.5 12 5.5c5-2 8-1.5 10 0v14c-2-1.5-5-2-10 0-5-2-8-1.5-10 0Z"/><line x1="12" y1="5.5" x2="12" y2="19.5"/>',
  tesis:       '<path d="M6 2h9l5 5v15H6z"/><polyline points="15 2 15 7 20 7"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>',
  styles:      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
};
function svgIcon(key) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_ICON_PATHS[key] || ''}</svg>`;
}

async function initHeader() {
  const mount = document.getElementById('app-header');
  if (!mount) return;
  try {
    // Hereda ?v= del propio <script src="core.js?v=…">: una sola fuente de
    // verdad para la version de assets, definida en el HTML.
    const r = await fetch('../assets/partials/header.html' + APP_VERSION_Q);
    mount.outerHTML = await r.text();
  } catch (e) {
    console.error('No se pudo cargar el header compartido', e);
    return;
  }

  // ── Título del módulo en el header ────────────────────────────
  // El título de sección (.stitle) ya no vive dentro de <main>: se
  // MUEVE al header, que es donde el usuario espera leer en qué está.
  // Se mueve el nodo (no se copia el texto) para no duplicar cadenas y
  // para que sigan funcionando los trozos que actualiza el JS de cada
  // página — #maltg-name, #wf-proc-name, #cogep-validez-chip,
  // #ts-live-badge — sin tocar una línea de esos archivos.
  // Las páginas sin .stitle (Ontología, Simulación) caen al rótulo de
  // NAV_PAGES.
  const page = NAV_PAGES[document.body.dataset.page || ''];
  if (page) setTxt('hdr-page-num', page.num);

  // Sólo sube el título de APERTURA: el .stitle que encabeza la sección
  // (primer elemento). En digitalShadow.html hay otro .stitle a media
  // página ("Validación — Contraste…") que separa dos bloques dentro del
  // mismo módulo; ése no es el título de la página y se queda donde está.
  const first  = document.querySelector('main .stitle');
  const stitle = (first && first.previousElementSibling === null) ? first : null;
  const titleEl = document.getElementById('hdr-page-title');
  if (titleEl && stitle) {
    stitle.title = stitle.textContent.trim();   // el texto completo, al pasar el ratón
    titleEl.replaceWith(stitle);
  } else if (titleEl && page) {
    titleEl.textContent = page.label;
  }

  initNavMenu(document.body.dataset.page || '');
}

// ── Menú (botón de rayas ☰) ────────────────────────────────────────
// Todo lo que antes eran controles sueltos del header vive ahora en
// este panel: Home (vuelve al carrusel de Inicio), el conmutador de
// tema, el punto de estado, y el atajo a los 13 módulos — cada uno con
// su ícono de línea (NAV_ICON_PATHS), en el mismo idioma visual.
function renderNavMenuItems(activeId) {
  return Object.entries(NAV_PAGES).map(([id, p]) => `
    <a class="nav-menu-item${id === activeId ? ' active' : ''}" href="${id}.html" role="menuitem">
      <span class="nav-menu-item-ico">${svgIcon(id)}</span>
      <span class="nav-menu-txt">${p.label}</span>
      <span class="nav-menu-num">${p.num}</span>
    </a>`).join('');
}

// Refleja el tema activo en el botón del menú (ícono + accesibilidad).
function syncThemeIcon() {
  const btn = document.getElementById('nav-theme-btn');
  if (!btn) return;
  btn.innerHTML = svgIcon(isDark ? 'themeMoon' : 'themeSun');
  btn.title = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
  btn.setAttribute('aria-label', btn.title);
}

function initNavMenu(activeId) {
  const btn = document.getElementById('menu-btn');
  const panel = document.getElementById('nav-menu');
  if (!btn || !panel) return;
  panel.innerHTML = `
    <div class="nav-menu-brand">MALTG <span class="nav-menu-live" title="Estado: Activo"><span class="live-dot"></span></span></div>
    <div class="nav-menu-top">
      <a class="nav-menu-icon-btn" href="../index.html" title="Home (carrusel de Inicio)" aria-label="Home">${svgIcon('home')}</a>
      <button type="button" class="nav-menu-icon-btn" id="nav-theme-btn"></button>
    </div>
    <div class="nav-menu-divider"></div>
    <div class="nav-menu-list" role="menu">${renderNavMenuItems(activeId)}</div>`;

  syncThemeIcon();
  const themeBtn = document.getElementById('nav-theme-btn');
  if (themeBtn) themeBtn.onclick = e => { e.stopPropagation(); toggleTheme(); };

  const closeMenu = () => {
    panel.classList.remove('show');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
  };
  const toggleMenu = () => {
    const open = panel.classList.toggle('show');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
  };
  btn.onclick = e => { e.stopPropagation(); toggleMenu(); };
  document.addEventListener('click', e => {
    if (panel.classList.contains('show') && !panel.contains(e.target) && e.target !== btn) closeMenu();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}

// ── Animación de arranque (overlay "Sincronizando ecosistema MALTG…") ──
// Reemplaza los 4 pasos fijos que tenía dashboard.html (pensados para
// UNA carga que traía las 6 fuentes de datos a la vez) por una lista
// de pasos que cada página define según lo que realmente necesita.
// steps: [{ id, label }]   tasks: [{ id, run: async () => {...} }]
function step(id, st) { const e = document.getElementById(id); if (e) e.className = 'ov-step' + (st ? ' ' + st : ''); }
const overlayShow = () => { const e = document.getElementById('overlay'); if (e) e.classList.add('show'); };
const overlayHide = () => { const e = document.getElementById('overlay'); if (e) e.classList.remove('show'); };

async function runBoot(steps, run) {
  const stepsEl = document.getElementById('ov-steps');
  if (stepsEl) {
    stepsEl.innerHTML = steps.map(s => `<div class="ov-step" id="${s.id}"><div class="ov-step-dot"></div>${s.label}</div>`).join('');
  }
  overlayShow();
  try {
    await run(steps);
  } catch (e) {
    console.error('Error cargando la página:', e);
    steps.forEach(s => { const el = document.getElementById(s.id); if (el && !el.classList.contains('done')) el.style.color = 'var(--rose)'; });
    await delay(1200);
  } finally {
    overlayHide();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initHeader().then(() => {
    if (typeof window.pageBoot === 'function') window.pageBoot();
  });
});
