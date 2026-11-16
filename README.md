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
LegalTechGov/
├── docker-compose.yml               # Servicio "maltg" (puerto 8080) y volúmenes montados
├── ARCHITECTURE_PROPOSAL.md         # Análisis C4 y propuesta de capas (monolito modular)
├── backend/
│   ├── main.py                      # API FastAPI (3 886 líneas, 70 endpoints)
│   ├── requirements.txt             # fastapi 0.111, uvicorn 0.29, python-multipart, pypdf
│   └── Dockerfile                   # python:3.12-slim + Node 20 (uipro-cli) + dependencias
├── frontend/
│   ├── index.html                   # Inicio (landing "/"): carrusel, único mapa de navegación
│   ├── flujo_procesal_alertas.html  # Vista autocontenida de alertas de plazo (fuera del menú)
│   ├── pages/                       # 12 páginas del dashboard, una por módulo (multi-página)
│   │   ├── methodology.html         #   01 · Metodología
│   │   ├── maltg.html               #   02 · Arquitectura MALTG (KPIs)
│   │   ├── ontology.html            #   03 · Ontología (grafo vis-network)
│   │   ├── digitalShadowGet.html    #   04 · Get Digital Shadow (captura documental)
│   │   ├── digitalShadow.html       #   05 · Digital Shadow Maturity
│   │   ├── workflow.html            #   06 · Workflow · Flujo procesal (BPMN)
│   │   ├── cogep.html               #   07 · Ontología COGEP · IA
│   │   ├── bitacora.html            #   08 · Bitácora · Evidencia
│   │   ├── adaptativo.html          #   09 · Adaptativo · MAPE-K
│   │   ├── experto.html             #   10 · Validación Experta
│   │   ├── guia.html                #   11 · Guía del Experimento
│   │   └── tesis.html               #   12 · Tesis Doctoral
│   └── assets/
│       ├── css/                     # nocturne.css (oscuro) · aurora.css (claro) · dashboard.css · inicio.css · controls.css
│       ├── js/                      # core.js (runtime compartido) · inicio.js · sdtcj-render.js · tab-*.js (lógica por módulo)
│       └── partials/header.html     # Encabezado compartido
├── storage/                         # Estado persistente (sin base de datos), montado en el contenedor
│   ├── data/                        # → /data
│   │   ├── MALTG_ontology.owl / .json, MALTG_ontologyInfo.json   # Ontología MALTG
│   │   ├── MALTG_architecture.json  # Arquitectura MALTG (JSON-LD)
│   │   ├── COGEP_ontology.owl       # Ontología COGEP generada desde la KB
│   │   ├── cogep_kb.json            # Base de conocimiento COGEP (16 actos, 11 reglas, umbrales)
│   │   ├── competency_questions.json, rubrica_dimensiones.json, pesos_ahp.json
│   │   ├── adaptativo_config.json, feriados_judiciales.json, salud_global_cache.json
│   │   ├── bitacora.json            # Bitácora append-only hash-encadenada
│   │   ├── LegalCase/               # 47 causas en JSON (797 actuaciones) + 2 archivos PDF/XLSX
│   │   ├── gold/                    # gold_standard.json (55 anotaciones), eval_report.json, GUIA_ANOTACION.md
│   │   └── law/                     # COGEP consolidado (PDF)
│   ├── workflow/                    # → /workflow: COGEP.json (82 procedimientos BPMN) y PDF del SUMARIO
│   ├── digitalShadow/               # → /digitalShadow: captura documental y madurez
│   │   ├── PROTOCOLO.md, SDT_CJ.json, DS_Synthetic.json, DS_<dominio>_<fecha>.json
│   │   ├── tools/scraper_cj.py      # Captura reproducible con manifest SHA-256
│   │   └── scraping/<run_id>/       # Snapshots + manifest.json por corrida
│   └── architecture/                # Diagramas PNG (no usados por la app)
├── papers/                          # 8 PDFs de publicaciones (sin versionar en git)
└── .gitignore                       # Excluye pat_paper/, .claude/, __pycache__ y copias *.bak
```

> `pat_paper/` (producción académica en LaTeX) está excluida por `.gitignore` y no forma parte de la aplicación desplegable.

## Puesta en marcha

Requiere Docker y Docker Compose.

```bash
docker compose up --build
```

- Inicio (landing, carrusel de módulos): `http://localhost:8080/` — todo el dashboard arranca desde aquí
- Dashboard (12 páginas independientes, una por módulo): p. ej. `http://localhost:8080/pages/methodology.html` — se abren desde el carrusel de Inicio y se vuelve a él con el botón **MENÚ** del header
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
punto de estado, y el atajo a los 12 módulos, cada uno con su ícono de línea
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
archivos. Sólo sube el `.stitle` que **encabeza** la sección: las páginas que no tienen `.stitle` de apertura (p. ej. Ontología) muestran el rótulo de `NAV_PAGES`.

La primera tarjeta del carrusel (**00**) es la carátula de la aplicación:
presenta MALTG y aloja los dos controles globales — **cambiar de tema** y
**recargar la aplicación**.

**Dos temas, dos hojas de estilo.** El aspecto de cada tema es CSS puro (nada
de estilos inyectados desde JavaScript); el único trabajo de JS es conmutar
`data-theme` en `<html>` y persistirlo en `localStorage['maltg-theme']`, que
Inicio y las 12 páginas comparten:

| Hoja | Rol |
|------|-----|
| `assets/css/nocturne.css` | **Modo oscuro** (por defecto). Tokens de color de toda la app + la piel Nocturne del dashboard. |
| `assets/css/aurora.css`   | **Modo claro**. Redefine los mismos tokens en claro (estética *Corporate Clean*) y los ajustes de componente que sólo aplican en claro. |
| `assets/css/dashboard.css`| Estructura de las 12 páginas — layout, componentes, animaciones. Sin colores propios. |
| `assets/css/inicio.css`   | Estructura de la pantalla de Inicio — carrusel, carátula y modal de detalle. |
| `assets/css/controls.css` | **Controles de interfaz** — botones (`.ctl-btn`), `.vis-ctrl-btn`, selects, campos de texto, `.searchfield`, `.segmented`, range, file y casillas. Sin literales de color: todo sale de los tokens `--ctl-*`. |

El orden de carga importa: (`dashboard.css` o `inicio.css`) → `nocturne.css` →
`aurora.css` → `controls.css`. Primero la estructura, después las dos pieles y
al final los controles, para que cada capa gane por cascada sin `!important`
extra. Al añadir un componente, usar siempre `var(--token)`; si hace falta un
color nuevo, declararlo en **ambos** temas.

Los controles siguen la geometría de la hoja de especímenes *Careers Explorer*
(píldora de radio completo, campo de búsqueda compuesto, control segmentado,
anillo de foco de 2px, transiciones de .18s) con la paleta de la casa: la
referencia aportó la forma, no el color. Sus tokens son los `--ctl-*` del
bloque **E** de `nocturne.css` / `aurora.css`. En vez de escribir
`<button style="…">` en cada página, usar `.ctl-btn` (+ `--solid`, `--sm`,
`--block` y el tono: `--cyan`, `--green`, `--gold`, `--rose`, `--violet`,
`--indigo`) y `.ctl-input` para los campos. Un `.segmented` con el atributo
`data-segmented` queda cableado solo: `initSegmented()` en `core.js` mueve
`aria-selected` al pulsar.

El modo oscuro es el mismo en toda la aplicación: la pantalla de Inicio y las
12 páginas comparten fondo índigo (`#161826`), superficies planas con filete de
un píxel — el tratamiento de las tarjetas del carrusel — y acento violeta
(`#9184d9`). En esa piel, `--cyan` designa el *rol* de acento de interfaz, no
el tono: lo usan ~50 sitios entre CSS y `tab-*.js`, así que se remapea en vez
de renombrarse. Los colores que codifican significado (estado procesal, capas
de la ontología, series de gráficos) conservan su tono en ambos temas.

**Tipografía.** Toda la aplicación usa una sola familia de texto,
**Plus Jakarta Sans**, y una monoespaciada, **IBM Plex Mono**, para los datos
duros (hashes, IDs de causa, cifras en columna, código). Los cuatro roles de
`dashboard.css` —`--font-display`, `--font-ui`, `--font-accent`, `--font-mono`—
y los dos de `nocturne.css` —`--font-heading`, `--font-body`— se conservan
porque los nombran ~200 sitios entre CSS y `tab-*.js`, pero ya no distinguen
familia sino intención: la jerarquía la llevan el peso y el tracking. Nunca
escribir el nombre de la fuente a mano; usar `var(--font-…)`. Las dos
excepciones son inevitables: el SVG que generan los `tab-*.js` (un atributo de
presentación no resuelve `var()`) y las etiquetas de vis-network (se pintan en
`<canvas>`, que no lee CSS) — ahí va el nombre literal.

`flujo_procesal_alertas.html` es autocontenida (no carga estas hojas) y replica
la paleta Nocturne en su propio `:root`; también carga las dos familias por su
cuenta.

**Tablas y grillas** comparten un solo componente, `.dtable` (definido en
`dashboard.css`, tema-aware): fila compacta con separador punteado, columna
primaria en dos líneas (`.dt-primary` — nombre + subtítulo/meta), columnas
numéricas a la derecha (`.dt-num`) y, cuando la tabla tiene un indicador
principal (score, riesgo, índice…), una columna de énfasis (`.dt-emphasis`)
con una franja de fondo continua entre cabecera y cuerpo. Antes cada
`tab-*.js` escribía su propia tabla con estilos inline; las tablas de la app (ranking de riesgo, evidencia, supuestos, alineación LKIF-Core, tablas de
la tesis…) usan ahora este mismo idioma visual.

## API — áreas principales

El backend expone 70 endpoints REST, agrupados por etiqueta en Swagger:

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

## Módulo Workflow · Flujo procesal COGEP (módulo 06)

Muestra el procedimiento como diagrama BPMN, superpone la trayectoria de una causa real sobre él y la contrasta con las reglas de plazos del COGEP.

### Componentes

| Capa | Elemento | Responsabilidad |
|------|----------|-----------------|
| Datos: diagramas | `storage/workflow/COGEP.json` (16,8 MB) | 82 procedimientos en TSV: `código \t nombre \t diagrama BPMN (JointJS) \t metadatos` |
| Datos: causas | `storage/data/LegalCase/*.json` | 47 causas, 797 actuaciones. Cada actuación apunta a un nodo con `IdGrafoFlujoEstructura = <nº flujo>-<UUID nodo>` |
| Datos: reglas | `storage/data/cogep_kb.json` | 16 actos procesales, 11 reglas de término, umbrales y 7 procedimientos |
| Backend: parser | `parse_workflow`, `_wf_rows`, `_stage_of` | Extrae nodos (actividades y eventos), flujos, etapas (grupos) y anotaciones; calcula estadísticas y bounding box |
| Backend: causa | `get_expediente`, `_causa_flujo`, `_grafo_node` | Ordena las actuaciones por fecha y las ubica en el diagrama |
| Backend: motor de reglas | `razonar_expediente` | Evaluación determinista y explicable de cada término; produce `resultados` y `node_alerts` |
| Backend: integridad | `get_ledger`, `get_opendata` | Cadena SHA-256 de actuaciones y exportación JSON-LD / CSV + DCAT |
| Backend: IA | `/api/cogep/analisis`, `/api/cogep/juicio-pdf`, `/api/cogep/chat` | Análisis de una actuación subida, juicio sobre un PDF y chat sobre la causa |
| Frontend: página | `frontend/pages/workflow.html` | Lienzo SVG, barra de herramientas, paneles de salud, análisis de PDF, tira tecnológica, modal de actividad y chat |
| Frontend: lógica | `frontend/assets/js/tab-workflow.js` (916 líneas) | Render del diagrama, zoom, selección de procedimiento y causa, animación de la traza y paneles |
| Standalone | `frontend/flujo_procesal_alertas.html` | Alertas de plazo en vivo; autocontenida y fuera del menú |

### Endpoints

- `GET /api/workflow-files`: lista los JSON que contienen un diagrama BPMN.
- `GET /api/workflow?file=&row=`: grafo normalizado de un procedimiento. `row` selecciona uno de los 82.
- `GET /api/expedientes` y `GET /api/expediente?file=`: lista las causas y devuelve sus actuaciones ordenadas (`pasos`, `nodeRefs`, `flujo`).
- `GET /api/cogep/juicio?file=`: resultado del motor de reglas (`salud`, `resultados`, `node_alerts`).
- `GET /api/ledger?file=` y `GET /api/opendata?file=`: cadena de integridad y exportación abierta.

### Flujo de datos

1. Al abrir la página, `pageBoot` pide en paralelo `/api/workflow`, `/api/workflow-files` y `/api/expedientes`.
2. `renderWorkflow` dibuja nodos y flujos sobre SVG. `_stage_of` asigna cada actividad a una etapa si su centro cae dentro del rectángulo del grupo.
3. Al elegir una causa, `wfLoadCausa` lanza cuatro peticiones en paralelo: expediente, juicio, ledger y opendata.
4. Con `nodeRefs` se resalta la trayectoria, `seqByNode` numera los nodos recorridos y `node_alerts` marca los nodos con incumplimiento.
5. Los paneles de salud, la tira tecnológica y el modal de actividad usan esas mismas respuestas. `wfPlay` reproduce la traza paso a paso.

### Observaciones de diseño

- **Cobertura desigual.** El archivo tiene 82 procedimientos, pero la KB sólo modela 7 (SUMARIO, ORDINARIO, MONITORIO, EJECUTIVO, APELACIÓN, EJECUCIÓN y VOLUNTARIO). El juicio de plazos sólo puede evaluar esos 7.
- **Sin caché en la ruta de parseo.** `parse_workflow` lee y parsea el JSON de 16,8 MB en cada petición y calcula `file_hash` en cada respuesta. `list_workflow_files` revisa los primeros 200 KB de cada archivo al listar. Una caché en memoria o un índice preprocesado reduciría la latencia.
- **Enlace por convención.** La relación causa → nodo depende de que el prefijo numérico de `IdGrafoFlujoEstructura` coincida con el código del procedimiento. No hay validación explícita de esa correspondencia.
- **Indicador de calidad incorporado.** `stats.dangling` cuenta los flujos cuyo origen o destino no corresponde a ningún nodo. Conviene vigilarlo como medida de calidad del diagrama.
- **Etapas por geometría.** Una actividad fuera de todos los grupos queda sin etapa. Depende de la posición visual en el diagrama.
- **Duplicación.** `flujo_procesal_alertas.html` replica parte de la lógica de alertas fuera del módulo. Conviene decidir si se integra en `workflow.html` o se retira.

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

## Estado del proyecto (noviembre 2026)

- **Versión commiteada:** `df02605` (17 sep 2026), rama `main`.
- **Cambios sin commit:** datos regenerados (`MALTG_ontology.json`, `MALTG_ontologyInfo.json`, `bitacora.json`, `salud_global_cache.json`, `SDT_CJ.json`) y 6 corridas de captura Digital Shadow nuevas (oct–nov 2026).
- **Validación contra gold standard:** 55 anotaciones, exactitud de mapeo 0.855, F1 macro 0.621. Varias clases tienen pocas muestras, así que sus métricas son inestables.
- **Pendiente:** separar `backend/main.py` en módulos internos, según `ARCHITECTURE_PROPOSAL.md`.
- **Inconsistencia de versión:** la etiqueta de `docker-compose.yml` dice `2.5.0` y `/api/health` responde `3.0.0`.

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

