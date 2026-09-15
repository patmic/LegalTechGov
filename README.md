# MALTG Architecture Validator — LegalTech Edition

Aplicación web (FastAPI + dashboard HTML/JS) que valida la conformidad de una
arquitectura empresarial LegalTech (un **gemelo digital estructural**, SDT)
contra **MALTG**, una ontología de gobernanza multicapa que integra **TOGAF +
COBIT + ITIL + NIST + un dominio LegalTech** propio. El proyecto es la
implementación de soporte de una tesis doctoral sobre gobernanza y validación
adaptativa de arquitecturas LegalTech, centrada en el proceso judicial
ecuatoriano **COGEP** (Código Orgánico General de Procesos).

Además de validar arquitectura, el sistema:

- Analiza expedientes judiciales (causas COGEP) y genera **juicios de valor
  asistidos por IA** sobre actuaciones procesales.
- Calcula **10 dimensiones de conformidad** (8 EA/gobernanza + Interoperabilidad
  + Compliance LegalTech) comparando lo declarado en la ontología contra lo
  medido en el gemelo digital.
- Implementa un **ciclo adaptativo MAPE-K** (Monitor-Analyze-Plan-Execute over
  a Knowledge base) con métricas propias: variabilidad de flujo (IVF), deriva
  procesal, alertas de plazos y seguridad cognitiva.
- Registra una **bitácora hash-encadenada** (append-only) y un **ledger tipo
  blockchain** de las actuaciones, para trazabilidad y evidencia reproducible.
- Expone la validación experta del modelo: anotaciones *gold standard*, F1 /
  kappa contra el razonador, AHP de pesos, rúbrica 0-100 por dimensión,
  verificación ontológica externa (HermiT/Pellet/OOPS!) y alineación con
  LKIF-Core / LegalRuleML.
- Publica los expedientes como **datos abiertos** (JSON-LD / CSV + DCAT).

## Stack técnico

| Capa       | Tecnología                                                        |
|------------|---------------------------------------------------------------------|
| Backend    | Python 3.12 · FastAPI 0.111 · Uvicorn (hot-reload)                |
| Frontend   | HTML5 + CSS + JavaScript vanilla, visualizaciones D3.js (multi-página, sin build step). Tema claro/oscuro por `data-theme`, sin dependencias |
| Datos      | Archivos JSON / JSON-LD y OWL (RDF/XML) versionados en disco. |
| Contenedor | Docker / Docker Compose (`maltg-v2-validator`, red `maltg-net`)   |

No hay base de datos: todo el estado (ontología, gemelos digitales, expedientes,
bitácora, evidencia, configuración adaptativa) se persiste como archivos JSON/OWL
bajo `storage/data/`, montados como volumen dentro del contenedor.

## Estructura del proyecto

```
appLegaltechTesis/
├── docker-compose.yml          # Orquesta el servicio "maltg" (puerto 8080)
├── backend/
│   ├── main.py                 # API FastAPI (~3500 líneas, 70+ endpoints)
│   ├── requirements.txt        # fastapi, uvicorn, python-multipart, pypdf
│   └── Dockerfile              # python:3.12-slim + Node.js (uipro-cli) + deps
├── frontend/
│   ├── index.html              # Pantalla de Inicio (landing, "/"): carrusel-menú, único mapa de navegación
│   ├── pages/                  # Las 12 páginas del dashboard, una por módulo (multi-page, no SPA)
│   │   ├── methodology.html    #   01 · Metodología
│   │   ├── maltg.html          #   02 · MALTG · Arquitectura (KPIs)
│   │   ├── ontology.html       #   03 · Ontología (grafo vis-network)
│   │   ├── dt.html             #   04 · Gemelo Digital & Validación (radar + brechas)
│   │   ├── simulacion.html     #   05 · Esfera Celeste Ontológica (Three.js 3D)
│   │   ├── workflow.html       #   06 · Workflow · Flujo Procesal (BPMN + chat COGEP)
│   │   ├── cogep.html          #   07 · Ontología COGEP · IA
│   │   ├── bitacora.html       #   08 · Bitácora · Evidencia
│   │   ├── adaptativo.html     #   09 · Adaptativo · MAPE-K
│   │   ├── experto.html        #   10 · Validación Experta
│   │   ├── guia.html           #   11 · Guía del Experimento
│   │   └── tesis.html          #   12 · Tesis Doctoral
│   ├── assets/                 # Todo el CSS/JS compartido vive aquí (nada suelto en frontend/)
│   │   ├── css/                # 2 hojas de TEMA (color) + 2 hojas de ESTRUCTURA (forma)
│   │   │   ├── nocturne.css    # TEMA OSCURO — todos los tokens de color de la app (por defecto)
│   │   │   ├── aurora.css      # TEMA CLARO  — mismos tokens en claro; carga siempre al final
│   │   │   ├── dashboard.css   # Estructura de las 12 páginas de pages/ (sin colores propios)
│   │   │   └── inicio.css      # Estructura de index.html: carrusel, carátula y modal
│   │   ├── js/
│   │   │   ├── core.js         # Runtime compartido: header inyectado, tema, animación de arranque
│   │   │   ├── sdtcj-render.js # Render SDT_CJ compartido por dt.html y simulacion.html
│   │   │   ├── inicio.js       # Carrusel de index.html: carátula 00 + las 12 tarjetas de módulo
│   │   │   └── tab-*.js        # Lógica propia de cada una de las 12 páginas (una por módulo)
│   │   └── partials/
│   │       └── header.html     # Header (logo · módulo actual · ☰ Home/módulos), sin tabs ni botones sueltos
│   └── flujo_procesal_alertas.html  # Vista independiente de flujo procesal COGEP con alertas de plazo
│                                #   (autocontenida: no depende de assets/, no está en el menú)
├── storage/
│   ├── tools/
│   │   └── scraper_cj.py       # Instrumento de recolección documental reproducible
│   │                            #   (snapshots + manifest SHA-256 en storage/digitalShadow/scraping)
│   └── data/                   # Todo el estado persistente de la app
│       ├── MALTG_ontology.owl          # Ontología MALTG (OWL/RDF)
│       ├── MALTG_ontology.json         # Ontología → grafo D3 (estructura)
│       ├── MALTG_ontologyInfo.json     # Detalle informativo por nodo de la ontología
│       ├── MALTG_architecture.json     # Arquitectura MALTG (JSON-LD multidimensional)
│       ├── cogep_kb.json               # Base de conocimiento COGEP (reglas/plazos)
│       ├── competency_questions.json   # Competency questions de la ontología COGEP
│       ├── rubrica_dimensiones.json    # Rúbrica 0-100 por dimensión de validez
│       ├── adaptativo_config.json      # Config del ciclo MAPE-K (pesos/umbrales del usuario)
│       ├── feriados_judiciales.json    # Feriados/suspensiones de término
│       ├── bitacora.json               # Bitácora append-only hash-encadenada
│       ├── salud_global_cache.json     # Caché del índice empírico procesal
│       ├── sdt/                        # Gemelos digitales estructurales (7 .json), incl. SDT_CJ.json
│       ├── LegalCase/                  # Expedientes/causas judiciales analizados (47 JSON + PDFs + 2 XLSX)
│       ├── gold/                       # Anotaciones gold standard + guía de anotación
│       ├── law/                        # Normativa fuente (COGEP en PDF)
│       └── architecture/               # Diagramas de arquitectura (PNG, no usado por la app)
│   ├── workflow/                # Flujos BPMN de procedimientos COGEP (JSON/TXT/PDF) — volumen propio
│   └── digitalShadow/           # Resultados de "04 Get Digital Shadow" / "05 Digital Shadow Maturity"
│       ├── PROTOCOLO.md                # Protocolo de recolección documental (domain-agnostic)
│       ├── SDT_CJ.json                 # Último SDT generado por el botón "Get" (regenerado cada corrida)
│       ├── DS_<dominio>_<fecha>.json   # Copias históricas por dominio auditado (una por corrida)
│       └── scraping/                   # Corridas de captura: sources_semilla.json + <run_id>/<slug>.html
│                                        #   + manifest.json (snapshots SHA-256)
├── .claude/                    # Config local de Claude Code (agents/) — ignorado en git
├── desktop.ini
└── .gitignore                  # Ignora pat_paper/ y .claude/
```

> Nota: el repositorio contiene además, sólo en local y fuera del control de
> versiones (`.gitignore`), la carpeta `pat_paper/` con la producción académica
> asociada: los papers (`Paper/`, `PaperImplement/`, `PaperWF/`,
> `PaperLegalShadow/`, `PaperLegalShadow_ICI2ST/`), la tesis en LaTeX
> (`tesisLatex_MALTG/`) y los planes de trabajo (`PLAN_*.md`). No forma parte de
> la aplicación desplegable.

## Puesta en marcha

Requiere Docker y Docker Compose.

```bash
docker compose up --build
```

- Inicio (landing, carrusel de módulos): `http://localhost:8080/` — todo el dashboard arranca desde aquí
- Dashboard (13 páginas independientes, una por módulo): p. ej. `http://localhost:8080/pages/methodology.html` — se abren desde el carrusel de Inicio y se vuelve a él con el botón **MENÚ** del header
- API (Swagger/OpenAPI): `http://localhost:8080/docs`
- Health check: `http://localhost:8080/api/health`

El backend corre con `uvicorn --reload`, y tanto `backend/main.py` como todo
`frontend/` y `storage/data/` están montados como volúmenes: los cambios se
reflejan sin reconstruir la imagen (ontología y gemelos digitales se
recargan en ~5s).

## Navegación y temas

**El carrusel de Inicio es el mapa de navegación completo.** Las páginas del
dashboard no llevan barra de pestañas ni botones sueltos en el header — sólo
el ícono (ya no enlaza a ningún lado: "Home" vive en el menú), el módulo
actual (número + nombre) y, a la derecha, el botón de rayas (☰).

**El botón ☰ despliega un panel con todo lo que antes eran controles
sueltos**: Home (vuelve al carrusel), el conmutador de tema — en caliente,
sin recargar, sincronizando vis-network/Chart.js si la página los usa —, el
punto de estado, y el atajo a los 13 módulos, cada uno con su ícono de línea
(24×24, trazo — `NAV_ICON_PATHS` en `core.js`). Lo arma `initNavMenu()` a
partir de la misma tabla `NAV_PAGES` que rotula el título, resaltando el
módulo activo. El panel es semitransparente (`rgba` + `backdrop-filter:
blur`) en un degradado violeta de colores fijos (no tokens de tema): una
superficie de marca autocontenida, como la carátula del carrusel, pensada
para verse igual — y con el contraste del texto garantizado — en claro y en
oscuro.

El título de la página vive en el header, no en el cuerpo: `core.js` **mueve**
(no copia) el `.stitle` de apertura de `<main>` al header, junto al número de
módulo. Al mover el nodo en vez de duplicar el texto, siguen funcionando los
trozos que cada `tab-*.js` actualiza en vivo dentro del título — `#maltg-name`,
`#wf-proc-name`, `#cogep-validez-chip`, `#ts-live-badge` — sin tocar esos
archivos. Sólo sube el `.stitle` que **encabeza** la sección: el de `dt.html`
está a media página separando dos bloques del mismo módulo, así que se queda
donde está; esa página y las que no tienen `.stitle` (Ontología, Simulación)
muestran el rótulo de `NAV_PAGES`.

La primera tarjeta del carrusel (**00**) es la carátula de la aplicación:
presenta MALTG y aloja los dos controles globales — **cambiar de tema** y
**recargar la aplicación**.

**Dos temas, dos hojas de estilo.** El aspecto de cada tema es CSS puro (nada
de estilos inyectados desde JavaScript); el único trabajo de JS es conmutar
`data-theme` en `<html>` y persistirlo en `localStorage['maltg-theme']`, que
Inicio y las 13 páginas comparten:

| Hoja | Rol |
|------|-----|
| `assets/css/nocturne.css` | **Modo oscuro** (por defecto). Tokens de color de toda la app + la piel Nocturne del dashboard. |
| `assets/css/aurora.css`   | **Modo claro**. Redefine los mismos tokens en claro (estética *Corporate Clean*) y los ajustes de componente que sólo aplican en claro. |
| `assets/css/dashboard.css`| Estructura de las 12 páginas — layout, componentes, animaciones. Sin colores propios. |
| `assets/css/inicio.css`   | Estructura de la pantalla de Inicio — carrusel, carátula y modal de detalle. |

El orden de carga importa: (`dashboard.css` o `inicio.css`) → `nocturne.css` →
`aurora.css`. Primero la estructura y después las dos pieles, para que cada
tema gane por cascada sin `!important` extra. Al añadir un componente, usar
siempre `var(--token)`; si hace falta un color nuevo, declararlo en **ambos**
temas.

El modo oscuro es el mismo en toda la aplicación: la pantalla de Inicio y las
13 páginas comparten fondo índigo (`#161826`), superficies planas con filete de
un píxel — el tratamiento de las tarjetas del carrusel — y acento violeta
(`#9184d9`). En esa piel, `--cyan` designa el *rol* de acento de interfaz, no
el tono: lo usan ~50 sitios entre CSS y `tab-*.js`, así que se remapea en vez
de renombrarse. Los colores que codifican significado (estado procesal, capas
de la ontología, series de gráficos) conservan su tono en ambos temas.

`flujo_procesal_alertas.html` es autocontenida (no carga estas hojas) y replica
la paleta Nocturne en su propio `:root`.

**Tablas y grillas** comparten un solo componente, `.dtable` (definido en
`dashboard.css`, tema-aware): fila compacta con separador punteado, columna
primaria en dos líneas (`.dt-primary` — nombre + subtítulo/meta), columnas
numéricas a la derecha (`.dt-num`) y, cuando la tabla tiene un indicador
principal (score, riesgo, índice…), una columna de énfasis (`.dt-emphasis`)
con una franja de fondo continua entre cabecera y cuerpo. Antes cada
`tab-*.js` escribía su propia tabla con estilos inline; las 13 tablas de la
app (ranking de riesgo, evidencia, supuestos, alineación LKIF-Core, tablas de
la tesis…) usan ahora este mismo idioma visual.

## API — áreas principales

El backend expone más de 70 endpoints REST, agrupados por tags en Swagger:

| Tag                     | Endpoints | Qué cubre |
|--------------------------|:---------:|-----------|
| `MALTG Data`             | 12 | Ontología, gemelo digital, validación de 10 dimensiones, expedientes, workflows BPMN |
| `Validez IA`             | 23 | Evaluación gold standard (F1/kappa), rúbrica, AHP, sensibilidad, verificación OWL, alineación LKIF-Core/LegalRuleML |
| `Adaptativo (MAPE-K)`    | 15 | Config adaptativa, feriados, variabilidad de flujo, deriva procesal, ranking, alertas, supuestos del experimento |
| `Evidencia & Bitácora`   | 9  | Corridas de captura, verificación SHA-256, bitácora hash-encadenada |
| `COGEP IA`                | 6  | Base de conocimiento COGEP, juicio de valor IA, chat razonador, análisis de actuaciones |
| `Tecnologías`            | 2  | Ledger tipo blockchain, expediente como dato abierto (JSON-LD/CSV + DCAT) |
| `SDT_CJ`                  | 2  | Scraping del portal del Consejo de la Judicatura → gemelo digital estructural |
| `System`                  | 1  | Health check |

Ver el detalle completo en `/docs` (Swagger UI) una vez levantado el servicio.

## Dimensiones de validación

`TOGAF`, `COBIT`, `ITIL`, `NIST`, `AI` (Integración IA), `BC` (Blockchain
Adoption), `OD` (Open Data Comply), `SEC` (Security Posture), `INTEROP`
(Interoperabilidad) y `LEGALTECH` (LegalTech Compliance).

## Herramientas de recolección de datos

`storage/digitalShadow/tools/scraper_cj.py` captura snapshots verificables de las fuentes
oficiales del Consejo de la Judicatura del Ecuador, con hash SHA-256 por
fuente y registro en la bitácora, para permitir que la captura sea
reproducible por un tercero:

```bash
python storage/digitalShadow/tools/scraper_cj.py                          # corrida con fecha de hoy
python storage/digitalShadow/tools/scraper_cj.py --fecha-corte 2026-07-02  # etiqueta la corrida
python storage/digitalShadow/tools/scraper_cj.py --verificar <run_id>      # re-hash de una corrida
```

Este proyecto está subido a:
https://github.com/patmic/LegalTechGov.git

## CMD 

Inicializar el proyecto:

docker compose down
docker compose up --build
docker compose up -d
docker compose down

### Eso te lista todas las rutas que comparten el mismo contenido físico. Si aparece más de una ruta, ahí está la causa raíz.

fsutil hardlink list "C:\pat_mic\pat_GDrive\LegalTechGov\frontend\pages\maltg.html"


## USO:

Inicio / dashboard: http://localhost:8080/
Páginas individuales: http://localhost:8080/pages/methodology.html (y análogas para las otras 12)
API docs (Swagger): http://localhost:8080/docs
Health check: http://localhost:8080/api/health

