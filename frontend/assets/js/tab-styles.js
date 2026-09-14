// ═══════════════════════════════════════════════════════════════════
//  tab-styles.js — Página UI Styles (13): catálogo de referencia de
//  diseño (contenido 100% local, sin llamadas al backend).
//  Extraído/adaptado de dashboard.html.
// ═══════════════════════════════════════════════════════════════════

const UI_STYLES = [
  /* ── Morphism Family ── */
  { id:'glassmorphism', name:'Glassmorphism', cat:'Morphism',
    desc:'Superficies traslúcidas con backdrop-filter blur. Profundidad a través de capas de vidrio.',
    colors:['#0d1117','#161b22','rgba(255,255,255,0.1)','rgba(255,255,255,0.05)','#58a6ff'],
    colorNames:['Background','Surface','Glass 1','Glass 2','Accent'],
    fonts:[{h:'Space Grotesk 700',b:'Inter 400'},{h:'Outfit 800',b:'DM Sans 400'}],
    uxRules:['blur-purpose','elevation-consistent','color-dark-mode','backdrop-filter performance'],
    antiPatterns:['No usar blur como pura decoración','Evitar demasiadas capas superpuestas','No ignorar performance del blur en móvil'],
    preview: 'glass', tags:['dark','blur','transparent','modern','dashboard'],
    cssVars:{'--panel-bg':'rgba(255,255,255,0.07)','--card-bg':'rgba(255,255,255,0.05)','--bdr':'rgba(255,255,255,0.12)'}
  },
  { id:'neumorphism', name:'Neumorphism', cat:'Morphism',
    desc:'Superficies extruidas del fondo con sombras gemelas (luz + oscura). Aspecto 3D suave.',
    colors:['#e0e5ec','#e0e5ec','#a3b1c6','#ffffff','#4a90d9'],
    colorNames:['Base','Surface','Shadow Dark','Shadow Light','Accent'],
    fonts:[{h:'Nunito 700',b:'Nunito 400'},{h:'Poppins 600',b:'Poppins 300'}],
    uxRules:['color-contrast (crítico - contraste bajo)','touch-target-size','state-clarity'],
    antiPatterns:['Muy bajo contraste - WCAG fail','No apto para dark mode','Evitar en elementos interactivos pequeños'],
    preview:'neu', tags:['light','soft','3d','skeuo','minimal'],
    cssVars:{'--panel-bg':'#e0e5ec','--card-bg':'#e0e5ec','--bdr':'transparent'}
  },
  { id:'claymorphism', name:'Claymorphism', cat:'Morphism',
    desc:'Elementos con apariencia de arcilla: bordes redondeados extremos, sombras coloridas, profundidad inflada.',
    colors:['#f8f0ff','#fff0f9','#7c3aed','#db2777','#f59e0b'],
    colorNames:['BG Purple','BG Pink','Violet','Pink','Amber'],
    fonts:[{h:'Nunito 900',b:'Nunito 500'},{h:'Fredoka One',b:'Quicksand 500'}],
    uxRules:['border-radius extremo (32-48px)','shadow colorida','inner shadow'],
    antiPatterns:['No mezclar con estilos flat','Evitar en enterprise/fintech','No usar en tablas de datos'],
    preview:'clay', tags:['playful','colorful','3d','rounded','fun'],
    cssVars:{'--panel-bg':'#fff0f9','--card-bg':'#f8f0ff','--bdr':'transparent'}
  },
  /* ── Flat / Minimal Family ── */
  { id:'minimalism', name:'Minimalism', cat:'Minimal',
    desc:'Espacio en blanco generoso, tipografía fuerte, cero ornamentación. Solo lo esencial.',
    colors:['#ffffff','#f9fafb','#111827','#6b7280','#000000'],
    colorNames:['White','Surface','Text','Muted','Black'],
    fonts:[{h:'Inter 700',b:'Inter 400'},{h:'Plus Jakarta Sans 600',b:'Plus Jakarta Sans 400'}],
    uxRules:['whitespace-balance','visual-hierarchy','line-length-control','weight-hierarchy'],
    antiPatterns:['No decorar por decorar','Evitar múltiples fuentes','No usar colores saturados en exceso'],
    preview:'min', tags:['clean','white','simple','corporate','saas'],
    cssVars:{'--panel-bg':'#ffffff','--card-bg':'#f9fafb','--bdr':'#e5e7eb'}
  },
  { id:'flat-design', name:'Flat Design', cat:'Minimal',
    desc:'Colores planos vibrantes sin gradientes ni sombras. Iconografía simple y bold.',
    colors:['#ffffff','#f0f4ff','#3b82f6','#8b5cf6','#ec4899'],
    colorNames:['White','Surface','Blue','Purple','Pink'],
    fonts:[{h:'Roboto 700',b:'Roboto 400'},{h:'DM Sans 600',b:'DM Sans 400'}],
    uxRules:['no-emoji-icons','consistency','color-semantic','icon-style-consistent'],
    antiPatterns:['No mezclar con sombras skeuomórficas','Evitar degradados en elementos UI principales'],
    preview:'flat', tags:['colorful','simple','bold','material','mobile'],
    cssVars:{'--panel-bg':'#f0f4ff','--card-bg':'#ffffff','--bdr':'#e0e7ff'}
  },
  { id:'brutalism', name:'Brutalism', cat:'Minimal',
    desc:'Bordes negros gruesos, colores primarios puros, diseño intencional «sin pulir». Impacto visual máximo.',
    colors:['#ffffff','#ffff00','#000000','#ff0000','#0000ff'],
    colorNames:['White','Yellow','Black','Red','Blue'],
    fonts:[{h:'Space Grotesk 900',b:'Space Mono 400'},{h:'Syne 800',b:'JetBrains Mono 400'}],
    uxRules:['primary-action','contrast-readability','no-emoji-icons'],
    antiPatterns:['No apto para todos los productos','Difícil de mantener accesibilidad','Evitar en healthcare/finance'],
    preview:'brut', tags:['bold','raw','editorial','creative','agency'],
    cssVars:{'--panel-bg':'#ffff00','--card-bg':'#ffffff','--bdr':'#000000'}
  },
  /* ── Dark / Futurist Family ── */
  { id:'dark-mode', name:'Dark Mode', cat:'Dark',
    desc:'Fondos oscuros profundos con texto claro. Reduce fatiga visual y destaca el contenido.',
    colors:['#0f172a','#1e293b','#334155','#94a3b8','#38bdf8'],
    colorNames:['bg0','bg1','surface','muted','accent'],
    fonts:[{h:'Inter 700',b:'Inter 400'},{h:'Outfit 600',b:'Outfit 400'}],
    uxRules:['color-dark-mode','color-accessible-pairs','color-semantic','surface readability'],
    antiPatterns:['No invertir colores del light mode','Evitar negro puro #000','No usar el mismo contraste que light'],
    preview:'dark', tags:['dark','dashboard','developer','modern','tech'],
    cssVars:{'--panel-bg':'#1e293b','--card-bg':'#0f172a','--bdr':'#334155'}
  },
  { id:'ai-native', name:'AI-Native UI', cat:'Dark',
    desc:'Diseño para productos de IA: datos en tiempo real, visualizaciones de modelos, interfaz de inteligencia.',
    colors:['#030711','#0d1525','#00e5ff','#a855f7','#10e98c'],
    colorNames:['Deep bg','Surface','Cyan','Violet','Green'],
    fonts:[{h:'Outfit 700',b:'Space Grotesk 400'},{h:'Syne 800',b:'DM Mono 400'}],
    uxRules:['loading-states','data-density','chart-type','progressive-loading','animation-optional'],
    antiPatterns:['No sobrecargar de datos','Evitar animaciones sin significado','No ocultar el estado del modelo'],
    preview:'ai', tags:['ai','ml','data','futuristic','dashboard','dark'],
    cssVars:{'--panel-bg':'rgba(13,21,37,0.55)','--card-bg':'rgba(17,28,48,0.5)','--bdr':'rgba(255,255,255,0.07)'}
  },
  { id:'cyberpunk', name:'Cyberpunk', cat:'Dark',
    desc:'Neon brillante sobre negro profundo. Estética retrofuturista con glows y grids.',
    colors:['#0a0014','#120022','#ff00ff','#00ffff','#ffff00'],
    colorNames:['bg0','bg1','Magenta','Cyan','Yellow'],
    fonts:[{h:'Orbitron 700',b:'Rajdhani 400'},{h:'Share Tech Mono',b:'Exo 2 300'}],
    uxRules:['color-accessible-pairs (crítico)','reduced-motion','glows moderados'],
    antiPatterns:['Contraste difícil de mantener','Demasiados glows cansan la vista','No apto para enterprise'],
    preview:'cyber', tags:['neon','dark','gaming','futuristic','retro'],
    cssVars:{'--panel-bg':'rgba(18,0,34,0.9)','--card-bg':'rgba(10,0,20,0.9)','--bdr':'rgba(255,0,255,0.3)'}
  },
  { id:'quantum-morphism', name:'Quantum Morphism', cat:'Dark',
    desc:'Evolución del glassmorphism: partículas flotantes, gradientes de profundidad, efectos de energía.',
    colors:['#030711','#0d1525','#00f5ff','#b060ff','#00ff9d'],
    colorNames:['Void','Deep','Quantum Cyan','Neural Violet','Signal Green'],
    fonts:[{h:'Outfit 800',b:'Space Grotesk 500'},{h:'Syne 900',b:'DM Mono 400'}],
    uxRules:['blur-purpose','animation §7 spring-physics','elevation-consistent','motion-meaning'],
    antiPatterns:['Performance del blur en móvil','No overuse de partículas','Siempre reducir con reduced-motion'],
    preview:'quantum', tags:['futuristic','dark','ai','particles','glow','premium'],
    cssVars:{'--panel-bg':'rgba(10,17,36,0.55)','--card-bg':'rgba(14,22,44,0.50)','--bdr':'rgba(255,255,255,0.08)'}
  },
  /* ── Gradient / Color Family ── */
  { id:'aurora', name:'Aurora / Gradient', cat:'Gradient',
    desc:'Gradientes de aurora boreal: transiciones suaves entre colores fríos. Fondo atmosférico.',
    colors:['#0f0f23','#1a1a3e','#7c3aed','#06b6d4','#10b981'],
    colorNames:['Dark','Surface','Purple','Cyan','Emerald'],
    fonts:[{h:'Clash Display 600',b:'General Sans 400'},{h:'Cabinet Grotesk 700',b:'Satoshi 400'}],
    uxRules:['color-accessible-pairs','gradient performance','reduced-motion'],
    antiPatterns:['Gradientes animados afectan performance','No usar como fondo de texto largo'],
    preview:'aurora', tags:['gradient','colorful','dark','premium','landing'],
    cssVars:{'--panel-bg':'rgba(26,26,62,0.7)','--card-bg':'rgba(15,15,35,0.6)','--bdr':'rgba(124,58,237,0.3)'}
  },
  { id:'neon-glow', name:'Neon Glow', cat:'Gradient',
    desc:'Elementos con box-shadow y text-shadow de colores neón sobre fondos oscuros.',
    colors:['#000000','#0a0a0a','#ff6b6b','#feca57','#48dbfb'],
    colorNames:['Black','Dark','Neon Red','Neon Yellow','Neon Blue'],
    fonts:[{h:'Orbitron 600',b:'Rajdhani 300'},{h:'Audiowide',b:'Exo 2 300'}],
    uxRules:['reduced-motion','color-accessible-pairs','glows solo en accent'],
    antiPatterns:['Glows en todo = ruido visual','Difícil contraste','Evitar en apps de lectura'],
    preview:'neon', tags:['neon','dark','gaming','club','party'],
    cssVars:{'--panel-bg':'rgba(10,10,10,0.9)','--card-bg':'#000000','--bdr':'rgba(255,107,107,0.4)'}
  },
  { id:'sunset-gradient', name:'Sunset Gradient', cat:'Gradient',
    desc:'Paleta cálida: naranja, rosa, púrpura. Ideal para apps de bienestar y lifestyle.',
    colors:['#1a1a2e','#16213e','#e94560','#f5a623','#0f3460'],
    colorNames:['Dark Navy','Surface','Coral','Gold','Deep Blue'],
    fonts:[{h:'Playfair Display 700',b:'Lato 400'},{h:'Cormorant Garamond 700',b:'Source Sans 3 400'}],
    uxRules:['color-accessible-pairs','gradient-subtle','whitespace-balance'],
    antiPatterns:['No abusar del gradiente','Cuidado contraste texto sobre gradiente'],
    preview:'sunset', tags:['warm','lifestyle','wellness','beauty','gradient'],
    cssVars:{'--panel-bg':'rgba(22,33,62,0.7)','--card-bg':'rgba(26,26,46,0.6)','--bdr':'rgba(233,69,96,0.3)'}
  },
  /* ── Enterprise / Professional Family ── */
  { id:'corporate-clean', name:'Corporate Clean', cat:'Enterprise',
    desc:'Profesional, confiable, minimalista. Paleta azul-gris, tipografía neutral, espaciado generoso.',
    colors:['#ffffff','#f8fafc','#1e40af','#64748b','#0f172a'],
    colorNames:['White','Surface','Blue','Slate','Dark'],
    fonts:[{h:'Inter 700',b:'Inter 400'},{h:'Plus Jakarta Sans 600',b:'Plus Jakarta Sans 400'}],
    uxRules:['accessibility §1 CRITICAL','touch-target-size','form-labels','keyboard-nav'],
    antiPatterns:['No usar colores saturados','Evitar animaciones exageradas','No descuidar a11y'],
    preview:'corp', tags:['enterprise','blue','professional','saas','fintech'],
    cssVars:{'--panel-bg':'#ffffff','--card-bg':'#f8fafc','--bdr':'#e2e8f0'}
  },
  { id:'fintech-dark', name:'Fintech Dark', cat:'Enterprise',
    desc:'Dashboard financiero oscuro con verde y azul. Datos densos, tablas, gráficas.',
    colors:['#0a0e1a','#111827','#00d47e','#3b82f6','#f59e0b'],
    colorNames:['bg0','bg1','Green','Blue','Gold'],
    fonts:[{h:'IBM Plex Sans 600',b:'IBM Plex Sans 400'},{h:'Inter 700',b:'DM Mono 400'}],
    uxRules:['number-tabular','chart-type','data-density','color-guidance (colorblind)'],
    antiPatterns:['No solo rojo/verde para P&L','Siempre tooltips en gráficas','No truncar números'],
    preview:'fintech', tags:['finance','dark','dashboard','trading','data'],
    cssVars:{'--panel-bg':'#111827','--card-bg':'#0a0e1a','--bdr':'rgba(0,212,126,0.2)'}
  },
  { id:'healthcare', name:'Healthcare Clean', cat:'Enterprise',
    desc:'Blanco, verde menta y azul claro. Transmite confianza, higiene y precisión médica.',
    colors:['#ffffff','#f0fdf4','#10b981','#0ea5e9','#6366f1'],
    colorNames:['White','Mint','Green','Sky','Indigo'],
    fonts:[{h:'Nunito 700',b:'Nunito 400'},{h:'Source Serif 4 600',b:'Source Sans 3 400'}],
    uxRules:['accessibility §1 CRITICAL','dynamic-type','color-not-only','progressive-disclosure'],
    antiPatterns:['No solo color para indicadores médicos','Siempre alt text','No truncar información crítica'],
    preview:'health', tags:['medical','clean','white','healthcare','trust'],
    cssVars:{'--panel-bg':'#f0fdf4','--card-bg':'#ffffff','--bdr':'#d1fae5'}
  },
  /* ── Editorial / Creative Family ── */
  { id:'editorial', name:'Editorial', cat:'Creative',
    desc:'Tipografía en gran escala como elemento visual. Layout asimétrico, contraste de peso.',
    colors:['#fafafa','#f5f5f5','#111111','#ef4444','#000000'],
    colorNames:['Off-white','Surface','Dark','Red','Black'],
    fonts:[{h:'Playfair Display 900',b:'Source Serif 4 400'},{h:'DM Serif Display',b:'DM Sans 300'}],
    uxRules:['whitespace-balance','visual-hierarchy','line-length-control','heading-hierarchy'],
    antiPatterns:['No descuidar legibilidad','Evitar múltiples pesos conflictivos'],
    preview:'edit', tags:['magazine','editorial','typography','serif','bold'],
    cssVars:{'--panel-bg':'#f5f5f5','--card-bg':'#fafafa','--bdr':'#e5e5e5'}
  },
  { id:'bento-grid', name:'Bento Grid', cat:'Creative',
    desc:'Layout de cuadrícula de cajas de distintos tamaños. Visual moderno popularizado por Apple.',
    colors:['#f5f5f7','#ffffff','#1d1d1f','#0071e3','#ff375f'],
    colorNames:['Apple Gray','White','Dark','Blue','Red'],
    fonts:[{h:'SF Pro Display / Inter 700',b:'Inter 400'},{h:'Outfit 700',b:'Outfit 400'}],
    uxRules:['grid-consistency','visual-hierarchy','breakpoint-consistency','container-width'],
    antiPatterns:['No mezclar tamaños sin ritmo','Evitar demasiados colores de fondo','Cuidar responsive'],
    preview:'bento', tags:['grid','apple','modern','marketing','landing'],
    cssVars:{'--panel-bg':'#ffffff','--card-bg':'#f5f5f7','--bdr':'rgba(0,0,0,0.06)'}
  },
  { id:'retro-pixel', name:'Retro Pixel / 8-bit', cat:'Creative',
    desc:'Estética de videojuegos clásicos: píxeles, paleta limitada, fuentes monoespaciadas.',
    colors:['#0f380f','#306230','#8bac0f','#9bbc0f','#ffffff'],
    colorNames:['Black','Dark Green','Green','Light Green','White'],
    fonts:[{h:'Press Start 2P',b:'VT323 400'},{h:'Pixelify Sans',b:'Silkscreen 400'}],
    uxRules:['touch-target-size (crítico con píxeles pequeños)','no-emoji-icons'],
    antiPatterns:['Muy difícil de leer body text','No apto para apps de productividad','Evitar textos largos'],
    preview:'pixel', tags:['gaming','retro','8bit','pixel','fun'],
    cssVars:{'--panel-bg':'#306230','--card-bg':'#0f380f','--bdr':'#8bac0f'}
  },
  /* ── Motion / Interactive Family ── */
  { id:'micro-interactions', name:'Micro-interactions', cat:'Motion',
    desc:'Sistema de feedback visual detallado: hover, press, load, success. Cada acción tiene respuesta.',
    colors:['#ffffff','#f8fafc','#6366f1','#10b981','#ef4444'],
    colorNames:['White','Surface','Indigo','Green','Red'],
    fonts:[{h:'Inter 600',b:'Inter 400'},{h:'Geist 600',b:'Geist 400'}],
    uxRules:['duration-timing 150-300ms','spring-physics','scale-feedback 0.95-1.05','state-transition'],
    antiPatterns:['No animar todo','Respetar reduced-motion','No bloquear input con animación'],
    preview:'micro', tags:['animation','interactive','modern','feedback','polish'],
    cssVars:{'--panel-bg':'#ffffff','--card-bg':'#f8fafc','--bdr':'#e2e8f0'}
  },
  { id:'skeleton-loading', name:'Skeleton Loading', cat:'Motion',
    desc:'Estados de carga con placeholders animados que muestran la estructura antes del contenido.',
    colors:['#1a1a2e','#16213e','#e2e8f0','#cbd5e1','#94a3b8'],
    colorNames:['bg0','bg1','Skeleton Base','Shimmer','Text'],
    fonts:[{h:'Inter 500',b:'Inter 400'}],
    uxRules:['progressive-loading','loading-states >300ms','content-jumping avoid','skeleton vs spinner'],
    antiPatterns:['No mostrar skeleton cuando carga <300ms','No usar skeleton en todos los elementos'],
    preview:'skel', tags:['loading','ux','progressive','feedback','pattern'],
    cssVars:{}
  },
  /* ── Luxury / Premium Family ── */
  { id:'luxury-dark', name:'Luxury Dark', cat:'Luxury',
    desc:'Negro profundo con detalles en oro. Serif elegante. Para marcas premium y exclusivas.',
    colors:['#0a0a0a','#111111','#d4af37','#8b7355','#ffffff'],
    colorNames:['Black','Surface','Gold','Bronze','White'],
    fonts:[{h:'Cormorant Garamond 700',b:'Montserrat 300'},{h:'Playfair Display 700',b:'Raleway 300'}],
    uxRules:['whitespace-balance','font-pairing (serif+sans)','elevation-consistent'],
    antiPatterns:['No saturar de elementos','Evitar colores brillantes','No usar fuentes playful'],
    preview:'lux', tags:['luxury','gold','premium','fashion','exclusive'],
    cssVars:{'--panel-bg':'#111111','--card-bg':'#0a0a0a','--bdr':'rgba(212,175,55,0.3)'}
  },
  { id:'soft-pastel', name:'Soft Pastel', cat:'Luxury',
    desc:'Colores pastel suaves con tonos terrosos. Sensación cálida, amigable y acogedora.',
    colors:['#fdf6ec','#fef3c7','#fca5a5','#86efac','#c4b5fd'],
    colorNames:['Cream','Pale Yellow','Pale Rose','Pale Green','Pale Purple'],
    fonts:[{h:'Nunito 700',b:'Nunito 400'},{h:'Quicksand 600',b:'Quicksand 400'}],
    uxRules:['color-accessible-pairs (verificar contraste)','whitespace-balance'],
    antiPatterns:['Contraste bajo con texto claro','No usar en dashboards de datos'],
    preview:'pastel', tags:['soft','pastel','warm','wellness','gentle'],
    cssVars:{'--panel-bg':'#fef3c7','--card-bg':'#fdf6ec','--bdr':'rgba(252,165,165,0.4)'}
  },
  /* ── Data / Dashboard Family ── */
  { id:'data-dense', name:'Data Dense', cat:'Dashboard',
    desc:'Máxima densidad de información. Tablas compactas, múltiples paneles, tipografía pequeña.',
    colors:['#0d1117','#161b22','#21262d','#388bfd','#3fb950'],
    colorNames:['bg0','bg1','surface','blue','green'],
    fonts:[{h:'JetBrains Mono 500',b:'JetBrains Mono 400'},{h:'DM Mono 500',b:'DM Mono 400'}],
    uxRules:['virtualize-lists 50+ items','number-tabular','data-table a11y','tooltip-on-interact'],
    antiPatterns:['No sobresaturar paneles','Siempre legends en gráficas','No solo color para datos'],
    preview:'data', tags:['dashboard','data','dark','developer','analytics'],
    cssVars:{'--panel-bg':'#161b22','--card-bg':'#0d1117','--bdr':'#30363d'}
  },
  { id:'material-design', name:'Material Design 3', cat:'Dashboard',
    desc:'Sistema de diseño de Google: elevation, ripple, color roles dinámicos, tipografía M3.',
    colors:['#fef7ff','#f3edf7','#6750a4','#625b71','#7d5260'],
    colorNames:['Surface','Surface Var','Primary','Secondary','Tertiary'],
    fonts:[{h:'Google Sans 600',b:'Roboto 400'},{h:'Roboto Flex 600',b:'Roboto 400'}],
    uxRules:['touch-target-size 48dp','press-feedback ripple','bottom-nav-limit 5','tab-bar-ios vs top-app-bar-android'],
    antiPatterns:['No mezclar MD2 y MD3','Evitar elevation inconsistente'],
    preview:'md3', tags:['google','material','android','accessible','system'],
    cssVars:{'--panel-bg':'#f3edf7','--card-bg':'#fef7ff','--bdr':'rgba(103,80,164,0.2)'}
  },
  /* ── Nature / Organic Family ── */
  { id:'biophilic', name:'Biophilic / Nature', cat:'Organic',
    desc:'Inspirado en la naturaleza: verdes terrosos, texturas orgánicas, formas irregulares.',
    colors:['#1a2e1a','#2d4a2d','#4a7c59','#8fbc8f','#f5f0e8'],
    colorNames:['Forest','Dark Green','Moss','Sage','Cream'],
    fonts:[{h:'Fraunces 700',b:'Source Serif 4 400'},{h:'Lora 600',b:'Lato 400'}],
    uxRules:['color-accessible-pairs','whitespace-balance','visual-hierarchy'],
    antiPatterns:['Difícil escalar a dark mode','Evitar paleta fría','No en tech/fintech'],
    preview:'bio', tags:['nature','green','eco','organic','wellness'],
    cssVars:{'--panel-bg':'#2d4a2d','--card-bg':'#1a2e1a','--bdr':'rgba(143,188,143,0.3)'}
  },
  /* ── Skeuomorphic Family ── */
  { id:'skeuomorphism', name:'Skeuomorphism', cat:'Skeuo',
    desc:'Objetos digitales que imitan sus equivalentes físicos: madera, metal, cuero, papel.',
    colors:['#8b6914','#a0774d','#2c1810','#f5deb3','#ffffff'],
    colorNames:['Wood','Brown','Dark Wood','Wheat','White'],
    fonts:[{h:'Georgia 700',b:'Georgia 400'},{h:'Palatino',b:'Times New Roman 400'}],
    uxRules:['effects-match-style','system-controls','platform-adaptive'],
    antiPatterns:['Muy costoso de mantener','No escala bien','Evitar en multi-plataforma'],
    preview:'skeuo', tags:['realistic','texture','ios6','classic','nostalgia'],
    cssVars:{'--panel-bg':'#a0774d','--card-bg':'#8b6914','--bdr':'#2c1810'}
  },
];

/* ── UX Rules categories data ── */
const UX_CATEGORIES = [
  { p:1, name:'Accesibilidad', impact:'CRITICAL', color:'var(--q-rose)', icon:'♿',
    keys:['Contraste 4.5:1','Alt text','Keyboard nav','Aria-labels','Focus rings'] },
  { p:2, name:'Touch & Interacción', impact:'CRITICAL', color:'var(--q-rose)', icon:'👆',
    keys:['Min 44×44pt','8px spacing','Loading feedback','Press feedback'] },
  { p:3, name:'Performance', impact:'HIGH', color:'var(--q-amber)', icon:'⚡',
    keys:['WebP/AVIF','Lazy loading','CLS < 0.1','Virtualize 50+ items'] },
  { p:4, name:'Selección de Estilo', impact:'HIGH', color:'var(--q-amber)', icon:'🎨',
    keys:['Match product type','SVG icons','Consistency','Dark mode pairing'] },
  { p:5, name:'Layout & Responsive', impact:'HIGH', color:'var(--q-amber)', icon:'📐',
    keys:['Mobile-first','No horizontal scroll','4pt spacing system'] },
  { p:6, name:'Tipografía & Color', impact:'MEDIUM', color:'var(--q-cyan)', icon:'🔤',
    keys:['16px body min','Line-height 1.5','Semantic color tokens'] },
  { p:7, name:'Animación', impact:'MEDIUM', color:'var(--q-cyan)', icon:'🎬',
    keys:['150-300ms','Spring physics','reduced-motion','Exit < Enter'] },
  { p:8, name:'Formularios & Feedback', impact:'MEDIUM', color:'var(--q-cyan)', icon:'📝',
    keys:['Visible labels','Error near field','Auto-dismiss 3-5s'] },
  { p:9, name:'Navegación', impact:'HIGH', color:'var(--q-amber)', icon:'🧭',
    keys:['Bottom nav ≤5','Predictable back','Deep linking'] },
  { p:10, name:'Charts & Datos', impact:'LOW', color:'var(--t2)', icon:'📊',
    keys:['Match chart type','Tooltips','Accessible colors','Legends'] },
];

/* ── Font Pairings ── */
const FONT_PAIRS = [
  { display:'Outfit + Space Grotesk', use:'Dashboard AI-Native', style:'Modern Tech', load:'Outfit:wght@700&family=Space+Grotesk' },
  { display:'Syne + DM Mono', use:'Futurista / Terminal', style:'Quantum', load:'Syne:wght@800&family=DM+Mono' },
  { display:'Playfair Display + Lato', use:'Editorial / Luxury', style:'Elegant', load:'Playfair+Display:wght@700&family=Lato' },
  { display:'Inter + Inter', use:'SaaS / Corporate', style:'Clean', load:'Inter:wght@400;700' },
  { display:'Nunito + Nunito', use:'Friendly / Wellness', style:'Rounded', load:'Nunito:wght@400;700;900' },
  { display:'JetBrains Mono + JetBrains Mono', use:'Developer / Data', style:'Monospace', load:'JetBrains+Mono:wght@400;600' },
  { display:'Cormorant Garamond + Montserrat', use:'Premium / Fashion', style:'Luxury', load:'Cormorant+Garamond:wght@700&family=Montserrat:wght@300' },
  { display:'Space Grotesk + DM Sans', use:'Startup / Product', style:'Tech', load:'Space+Grotesk:wght@600&family=DM+Sans' },
];

/* ── Filter state ── */
let activeStyleCat = 'all';
let searchQuery    = '';
let stylesInited   = false;

/* ── Init ─────────────────────────────────────────────────────── */
function initStylesTab(){
  if(stylesInited) return;
  stylesInited = true;
  renderCategoryFilters();
  renderStyleGrid(UI_STYLES);
  renderUXRules();
  renderFontPairs();
  renderApplyBtns();
}

/* ── Category filters ── */
function renderCategoryFilters(){
  const cats = ['all', ...new Set(UI_STYLES.map(s=>s.cat))];
  const el = document.getElementById('style-cats');
  if(!el) return;
  el.innerHTML = cats.map(c => `
    <button onclick="setCatFilter('${c}')"
      id="cat-btn-${c}"
      style="padding:.28rem .65rem;font-size:.6rem;font-family:var(--font-ui);
        font-weight:500;letter-spacing:.07em;text-transform:uppercase;
        border-radius:100px;cursor:pointer;transition:all .2s;
        background:${c==='all'?'rgba(0,245,255,0.12)':'var(--qglass-2)'};
        border:1px solid ${c==='all'?'var(--q-cyan)':'var(--qglass-bdr)'};
        color:${c==='all'?'var(--q-cyan)':'var(--t2)'}"
      class="cat-btn"
    >${c==='all'?'Todos':c}</button>`).join('');
}

function setCatFilter(cat){
  activeStyleCat = cat;
  document.querySelectorAll('.cat-btn').forEach((b,i)=>{
    const id = b.id.replace('cat-btn-','');
    b.style.background = id===cat ? 'rgba(0,245,255,0.12)' : 'var(--qglass-2)';
    b.style.borderColor = id===cat ? 'var(--q-cyan)' : 'var(--qglass-bdr)';
    b.style.color = id===cat ? 'var(--q-cyan)' : 'var(--t2)';
  });
  const filtered = filterBySearch(UI_STYLES);
  renderStyleGrid(filtered);
}

function filterStyles(){
  searchQuery = document.getElementById('style-search')?.value.toLowerCase() || '';
  renderStyleGrid(filterBySearch(UI_STYLES));
}

function filterBySearch(styles){
  return styles.filter(s => {
    const matchCat = activeStyleCat==='all' || s.cat===activeStyleCat;
    const q = searchQuery;
    const matchSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.tags.some(t=>t.includes(q)) ||
      s.cat.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
}

/* ── Style card grid ── */
function renderStyleGrid(styles){
  const grid = document.getElementById('style-grid');
  if(!grid) return;
  if(!styles.length){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--t3);font-family:var(--font-ui)">
      Sin resultados para "${searchQuery}"</div>`;
    return;
  }
  grid.innerHTML = styles.map((s,i) => `
    <div onclick="showStyleDetail('${s.id}')"
      style="background:var(--qglass-2);backdrop-filter:blur(16px);
        border:1px solid var(--qglass-bdr);border-radius:14px;overflow:hidden;
        cursor:pointer;transition:all .25s;animation:kpi-enter .4s cubic-bezier(.16,1,.3,1) ${i*.04}s both"
      onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='rgba(0,245,255,0.2)';this.style.boxShadow='var(--elev-3)'"
      onmouseout="this.style.transform='';this.style.borderColor='var(--qglass-bdr)';this.style.boxShadow=''">
      <!-- Mini preview -->
      <div style="height:72px;overflow:hidden;position:relative">
        ${buildMiniPreview(s)}
      </div>
      <!-- Info -->
      <div style="padding:.8rem 1rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.35rem">
          <div style="font-family:var(--font-accent);font-size:.75rem;font-weight:700;color:var(--t1)">${s.name}</div>
          <span style="font-size:.52rem;padding:.12rem .4rem;border-radius:100px;
            background:rgba(176,96,255,0.1);color:var(--q-violet);border:1px solid rgba(176,96,255,0.2);
            font-family:var(--font-mono)">${s.cat}</span>
        </div>
        <div style="font-size:.62rem;color:var(--t2);line-height:1.5;margin-bottom:.6rem;font-family:var(--font-ui)">${s.desc.slice(0,85)}…</div>
        <!-- Color dots -->
        <div style="display:flex;gap:.3rem;align-items:center;flex-wrap:wrap">
          ${s.colors.map(c=>`<div style="width:14px;height:14px;border-radius:50%;background:${c};border:1px solid rgba(255,255,255,0.1);box-shadow:0 0 6px ${c}44;flex-shrink:0" title="${c}"></div>`).join('')}
          <span style="font-size:.55rem;color:var(--t3);font-family:var(--font-ui);margin-left:.2rem">${s.fonts[0]?.h?.split(' ')[0]||''}</span>
        </div>
        <!-- Tags -->
        <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.45rem">
          ${s.tags.slice(0,4).map(t=>`<span style="font-size:.5rem;padding:.1rem .35rem;border-radius:100px;background:var(--qglass-1);border:1px solid var(--qglass-bdr);color:var(--t3);font-family:var(--font-ui)">${t}</span>`).join('')}
        </div>
      </div>
    </div>`).join('');
}

/* ── Mini preview builder ── */
function buildMiniPreview(s){
  const [c0,c1,,, c4] = s.colors;
  const previewMap = {
    glass:`<div style="background:linear-gradient(135deg,${c0},${c1});height:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px">
      <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:6px 10px;flex:1;height:48px"></div>
      <div style="background:rgba(255,255,255,0.07);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);border-radius:8px;flex:.6;height:48px"></div>
    </div>`,
    neu:`<div style="background:#e0e5ec;height:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px">
      <div style="background:#e0e5ec;border-radius:10px;box-shadow:5px 5px 10px #a3b1c6,-5px -5px 10px #fff;flex:1;height:48px"></div>
      <div style="background:#e0e5ec;border-radius:10px;box-shadow:5px 5px 10px #a3b1c6,-5px -5px 10px #fff;flex:.6;height:48px"></div>
    </div>`,
    clay:`<div style="background:linear-gradient(135deg,#f8f0ff,#fff0f9);height:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px">
      <div style="background:#c084fc;border-radius:20px;box-shadow:0 8px 20px #c084fc88,inset 0 -4px 8px rgba(0,0,0,0.2);flex:1;height:44px"></div>
      <div style="background:#f472b6;border-radius:20px;box-shadow:0 8px 20px #f472b688,inset 0 -4px 8px rgba(0,0,0,0.2);flex:.7;height:44px"></div>
    </div>`,
    brut:`<div style="background:#fff;height:100%;display:flex;align-items:center;gap:0;overflow:hidden">
      <div style="background:#ffff00;border:3px solid #000;flex:1;height:100%;display:flex;align-items:center;justify-content:center;font-family:monospace;font-weight:900;font-size:18px;color:#000">BOLD</div>
      <div style="background:#ff0000;border:3px solid #000;border-left:0;flex:.6;height:100%"></div>
    </div>`,
    dark:`<div style="background:linear-gradient(135deg,#0f172a,#1e293b);height:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px">
      <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;flex:1;height:48px;display:flex;align-items:center;justify-content:center">
        <div style="width:60%;height:6px;background:#38bdf8;border-radius:3px;box-shadow:0 0 8px #38bdf8"></div>
      </div>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;flex:.6;height:48px"></div>
    </div>`,
    ai:`<div style="background:#030711;height:100%;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px;position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,rgba(0,245,255,0.15),transparent 60%),radial-gradient(ellipse at 70% 50%,rgba(176,96,255,0.1),transparent 60%)"></div>
      <div style="background:rgba(13,21,37,0.7);border:1px solid rgba(0,245,255,0.2);border-radius:8px;flex:1;height:48px;position:relative;z-index:1;display:flex;align-items:center;justify-content:center">
        <div style="width:50%;height:4px;background:linear-gradient(90deg,#00f5ff,#b060ff);border-radius:2px;box-shadow:0 0 8px rgba(0,245,255,0.4)"></div>
      </div>
      <div style="background:rgba(13,21,37,0.5);border:1px solid rgba(176,96,255,0.2);border-radius:8px;flex:.6;height:48px;position:relative;z-index:1"></div>
    </div>`,
    cyber:`<div style="background:#0a0014;height:100%;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px">
      <div style="background:transparent;border:2px solid #ff00ff;border-radius:4px;flex:1;height:48px;box-shadow:0 0 10px #ff00ff,inset 0 0 10px rgba(255,0,255,0.05)"></div>
      <div style="background:transparent;border:2px solid #00ffff;border-radius:4px;flex:.6;height:48px;box-shadow:0 0 10px #00ffff"></div>
    </div>`,
    quantum:`<div style="background:#030711;height:100%;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 20% 50%,rgba(0,245,255,0.08),transparent 50%),radial-gradient(circle at 80% 50%,rgba(176,96,255,0.08),transparent 50%)"></div>
      <div style="background:rgba(10,17,36,0.7);backdrop-filter:blur(8px);border:1px solid rgba(0,245,255,0.15);border-radius:10px;flex:1;height:48px;z-index:1;box-shadow:0 0 20px rgba(0,245,255,0.05)"></div>
      <div style="background:rgba(14,22,44,0.5);backdrop-filter:blur(8px);border:1px solid rgba(176,96,255,0.15);border-radius:10px;flex:.6;height:48px;z-index:1"></div>
    </div>`,
    corp:`<div style="background:#f8fafc;height:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px">
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;flex:1;height:48px;display:flex;align-items:center;justify-content:center">
        <div style="width:60%;height:6px;background:#1e40af;border-radius:3px"></div>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;flex:.6;height:48px"></div>
    </div>`,
    fintech:`<div style="background:#0a0e1a;height:100%;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px">
      <div style="background:#111827;border:1px solid rgba(0,212,126,0.25);border-radius:8px;flex:1;height:48px;display:flex;align-items:center;justify-content:center">
        <div style="width:55%;height:4px;background:#00d47e;border-radius:2px;box-shadow:0 0 6px #00d47e"></div>
      </div>
      <div style="background:#111827;border:1px solid rgba(59,130,246,0.25);border-radius:8px;flex:.6;height:48px"></div>
    </div>`,
    bento:`<div style="background:#f5f5f7;height:100%;display:grid;grid-template-columns:1.5fr 1fr;grid-template-rows:1fr 1fr;gap:4px;padding:6px">
      <div style="background:#fff;border-radius:8px;grid-row:1/3;box-shadow:0 2px 8px rgba(0,0,0,.08)"></div>
      <div style="background:#0071e3;border-radius:8px;box-shadow:0 2px 8px rgba(0,113,227,.3)"></div>
      <div style="background:#ff375f;border-radius:8px;box-shadow:0 2px 8px rgba(255,55,95,.3)"></div>
    </div>`,
  };
  return previewMap[s.preview] || `<div style="background:linear-gradient(135deg,${c0},${c1});height:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px">
    <div style="background:${c4}22;border:1px solid ${c4}44;border-radius:8px;flex:1;height:48px"></div>
    <div style="background:${c4}11;border:1px solid ${c4}33;border-radius:8px;flex:.6;height:48px"></div>
  </div>`;
}

/* ── Style detail panel ── */
function showStyleDetail(id){
  const s = UI_STYLES.find(x=>x.id===id);
  if(!s) return;
  const detail = document.getElementById('style-detail');
  if(!detail) return;
  detail.style.display='block';
  detail.scrollIntoView({behavior:'smooth',block:'nearest'});

  document.getElementById('sd-name').textContent = s.name;
  document.getElementById('sd-cat').textContent = s.cat;

  // Preview
  const prev = document.getElementById('sd-preview');
  if(prev) prev.innerHTML = `<div style="height:100%">${buildMiniPreview(s)}</div>`;

  // Palette
  const pal = document.getElementById('sd-palette');
  if(pal) pal.innerHTML = s.colors.map((c,i)=>`
    <div style="display:flex;align-items:center;gap:.6rem">
      <div style="width:28px;height:28px;border-radius:6px;background:${c};border:1px solid rgba(255,255,255,0.1);box-shadow:0 0 10px ${c}55;flex-shrink:0"></div>
      <div>
        <div style="font-size:.65rem;color:var(--t1);font-family:var(--font-mono)">${c}</div>
        <div style="font-size:.56rem;color:var(--t3);font-family:var(--font-ui)">${s.colorNames[i]||''}</div>
      </div>
    </div>`).join('');

  // Fonts
  const fonts = document.getElementById('sd-fonts');
  if(fonts) fonts.innerHTML = s.fonts.map(f=>`
    <div style="background:var(--qglass-1);border:1px solid var(--qglass-bdr);border-radius:6px;padding:.4rem .6rem">
      <div style="font-size:.65rem;color:var(--q-cyan);font-family:var(--font-mono)">${f.h}</div>
      <div style="font-size:.6rem;color:var(--t3);font-family:var(--font-ui)">Body: ${f.b}</div>
    </div>`).join('');

  // Rules
  const rules = document.getElementById('sd-rules');
  if(rules) rules.innerHTML = s.uxRules.map(r=>`
    <div style="font-size:.61rem;color:var(--t2);padding:.25rem .5rem;
      background:rgba(0,245,255,0.04);border-left:2px solid var(--q-cyan);
      border-radius:0 4px 4px 0;font-family:var(--font-ui)">✓ ${r}</div>`).join('');

  // Anti-patterns
  const anti = document.getElementById('sd-antipatterns');
  if(anti) anti.innerHTML = s.antiPatterns.map(a=>`
    <div style="font-size:.6rem;color:var(--t3);padding:.22rem .5rem;
      background:rgba(255,56,112,0.04);border-left:2px solid var(--q-rose);
      border-radius:0 4px 4px 0;font-family:var(--font-ui)">✗ ${a}</div>`).join('');
}

/* ── UX Rules panel ── */
function renderUXRules(){
  const el = document.getElementById('ux-rules-grid');
  if(!el) return;
  el.innerHTML = UX_CATEGORIES.map(c=>`
    <div style="display:flex;align-items:flex-start;gap:.6rem;padding:.5rem .6rem;
      background:var(--qglass-1);border:1px solid var(--qglass-bdr);border-radius:8px;
      transition:background .2s"
      onmouseover="this.style.background='var(--qglass-2)'"
      onmouseout="this.style.background='var(--qglass-1)'">
      <div style="font-size:.9rem;flex-shrink:0;margin-top:.1rem">${c.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.2rem">
          <span style="font-size:.6rem;font-weight:700;font-family:var(--font-ui);color:var(--t1)">
            P${c.p} · ${c.name}
          </span>
          <span style="font-size:.5rem;padding:.1rem .35rem;border-radius:100px;
            background:${c.impact==='CRITICAL'?'rgba(255,56,112,0.12)':c.impact==='HIGH'?'rgba(255,184,0,0.1)':'rgba(0,245,255,0.08)'};
            color:${c.color};border:1px solid ${c.color}44;font-family:var(--font-mono)">${c.impact}</span>
        </div>
        <div style="font-size:.58rem;color:var(--t3);font-family:var(--font-ui)">${c.keys.join(' · ')}</div>
      </div>
    </div>`).join('');
}

/* ── Font Pairs panel ── */
function renderFontPairs(){
  const el = document.getElementById('font-pairs-grid');
  if(!el) return;
  el.innerHTML = FONT_PAIRS.map(f=>`
    <div style="display:flex;align-items:center;justify-content:space-between;
      padding:.5rem .7rem;background:var(--qglass-1);border:1px solid var(--qglass-bdr);
      border-radius:8px;transition:all .2s;cursor:default"
      onmouseover="this.style.background='var(--qglass-2)';this.style.borderColor='rgba(0,245,255,0.15)'"
      onmouseout="this.style.background='var(--qglass-1)';this.style.borderColor='var(--qglass-bdr)'">
      <div>
        <div style="font-size:.65rem;color:var(--t1);font-family:var(--font-ui);font-weight:500">${f.display}</div>
        <div style="font-size:.57rem;color:var(--t3);font-family:var(--font-ui)">${f.use}</div>
      </div>
      <span style="font-size:.52rem;padding:.12rem .4rem;border-radius:100px;
        background:rgba(0,245,255,0.07);color:var(--q-cyan);border:1px solid rgba(0,245,255,0.15);
        font-family:var(--font-mono);flex-shrink:0">${f.style}</span>
    </div>`).join('');
}

/* ── Apply style buttons ── */
function renderApplyBtns(){
  const quickStyles = [
    { id:'ai-native',      label:'AI-Native',    emoji:'🤖' },
    { id:'glassmorphism',  label:'Glassmorphism', emoji:'🪟' },
    { id:'dark-mode',      label:'Dark Clean',    emoji:'🌑' },
    { id:'corporate-clean',label:'Corporate',     emoji:'🏢' },
    { id:'cyberpunk',      label:'Cyberpunk',     emoji:'⚡' },
    { id:'fintech-dark',   label:'Fintech',       emoji:'💹' },
    { id:'quantum-morphism',label:'Quantum',      emoji:'🔮' },
    { id:'bento-grid',     label:'Bento Grid',    emoji:'🧩' },
  ];
  const cols = [
    document.getElementById('apply-btns'),
    document.getElementById('apply-btns2'),
    document.getElementById('apply-btns3'),
    document.getElementById('apply-btns4'),
  ];
  if(!cols[0]) return;
  quickStyles.forEach((s,i) => {
    const btn = document.createElement('button');
    btn.onclick = () => applyStyleToApp(s.id);
    btn.style.cssText = `width:100%;padding:.55rem .8rem;margin-bottom:.4rem;
      background:var(--qglass-2);border:1px solid var(--qglass-bdr);border-radius:8px;
      color:var(--t2);font-size:.65rem;font-family:var(--font-ui);font-weight:500;
      cursor:pointer;transition:all .2s;text-align:left;display:flex;align-items:center;gap:.5rem`;
    btn.innerHTML = `<span>${s.emoji}</span><span>${s.label}</span>`;
    btn.id = `apply-btn-${s.id}`;
    btn.onmouseover = ()=>{ btn.style.background='rgba(0,245,255,0.1)'; btn.style.borderColor='rgba(0,245,255,0.3)'; btn.style.color='var(--q-cyan)'; };
    btn.onmouseout  = ()=>{ btn.style.background='var(--qglass-2)'; btn.style.borderColor='var(--qglass-bdr)'; btn.style.color='var(--t2)'; };
    cols[i % 4].appendChild(btn);
  });
  // Reset btn
  const reset = document.createElement('button');
  reset.onclick = resetAppStyle;
  reset.style.cssText = `width:100%;padding:.45rem .8rem;background:rgba(255,56,112,0.06);
    border:1px solid rgba(255,56,112,0.2);border-radius:8px;color:var(--q-rose);
    font-size:.6rem;font-family:var(--font-ui);cursor:pointer;transition:all .2s;margin-top:.3rem`;
  reset.innerHTML = '↩ Restaurar original';
  reset.onmouseover=()=>reset.style.background='rgba(255,56,112,0.12)';
  reset.onmouseout =()=>reset.style.background='rgba(255,56,112,0.06)';
  cols[3].appendChild(reset);
}

/* ── Live style application ── */
let originalStyleVars = null;
function applyStyleToApp(styleId){
  const s = UI_STYLES.find(x=>x.id===styleId);
  if(!s) return;
  if(!originalStyleVars){
    const computed = getComputedStyle(document.documentElement);
    originalStyleVars = {
      '--panel-bg': computed.getPropertyValue('--panel-bg').trim(),
      '--card-bg':  computed.getPropertyValue('--card-bg').trim(),
      '--bdr':      computed.getPropertyValue('--bdr').trim(),
    };
  }
  const root = document.documentElement;
  Object.entries(s.cssVars).forEach(([k,v]) => root.style.setProperty(k,v));

  // Visual feedback on button
  document.querySelectorAll('[id^="apply-btn-"]').forEach(b=>{
    b.style.background='var(--qglass-2)'; b.style.borderColor='var(--qglass-bdr)'; b.style.color='var(--t2)';
  });
  const activeBtn = document.getElementById(`apply-btn-${styleId}`);
  if(activeBtn){
    activeBtn.style.background='rgba(0,245,255,0.15)';
    activeBtn.style.borderColor='var(--q-cyan)';
    activeBtn.style.color='var(--q-cyan)';
  }
  // Flash effect
  document.body.style.transition='all .4s';
}
function resetAppStyle(){
  if(!originalStyleVars) return;
  const root = document.documentElement;
  Object.entries(originalStyleVars).forEach(([k,v]) => root.style.setProperty(k,v));
  document.querySelectorAll('[id^="apply-btn-"]').forEach(b=>{
    b.style.background='var(--qglass-2)'; b.style.borderColor='var(--qglass-bdr)'; b.style.color='var(--t2)';
  });
}

// ── Carga inicial de esta página (catálogo 100% local, sin fetch) ──
window.pageBoot = function () {
  runBoot([
    { id: 's1', label: 'Cargando catálogo de estilos…' },
  ], async () => {
    step('s1', 'active');
    initStylesTab();
    step('s1', 'done');
  });
};
