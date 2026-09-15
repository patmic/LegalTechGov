# Protocolo de Recolección Documental — Evidencia Digital Shadow (v2)
**Proyecto:** MALTG LegalTech Validator · **Fecha de vigencia:** 2026-09-14
**Instrumento:** análisis documental sistemático de fuentes oficiales mediante web scraping con snapshots verificables.

## 1. Objetivo
Recolectar de forma **reproducible y verificable** la evidencia pública que sustenta el
Digital Shadow del dominio auditado (`/digitalShadow/DS_<dominio>_<fecha>.json`) y los
scores de sus dimensiones de madurez (D1–D4), evaluados contra la ontología MALTG
(`MALTG_ontology.owl` / `MALTG_ontology.json`, configurada en el módulo "02 Architecture").
Este protocolo es **agnóstico del sitio auditado**: aplica a cualquier dominio/entorno que
se registre como fuente semilla, y no está atado a una institución en particular.

## 2. Criterios de inclusión
1. Fuentes **oficiales** del dominio auditado: el dominio principal declarado como semilla
   y los subdominios directos que ese dominio publica o reconoce.
2. Contenido **público**, accesible sin autenticación.
3. Pertinencia directa a una dimensión de madurez (D1 datos/semántica, D2 arquitectura/integración,
   D3 estrategia, D4 compliance).
4. Documentos institucionales con valor probatorio: planes aprobados, resoluciones, comunicados
   oficiales, portales de servicio en producción.

## 3. Criterios de exclusión
1. Prensa, blogs, redes sociales y fuentes de terceros no oficiales del dominio auditado.
2. Contenido tras autenticación o datos personales (solo metadatos/estructura pública).
3. Páginas duplicadas o espejos no canónicos.

## 4. Fuentes semilla
Registradas en `digitalShadow/scraping/sources_semilla.json` (slug, etiqueta, URL, dimensiones
que sustenta, bandera `incluida`, criterio). **Toda alta/baja de fuente se registra en la
bitácora.** Las semillas pueden apuntar a cualquier dominio auditable — no están limitadas a
un único entorno.

## 5. Procedimiento de captura (fases)
1. **Identificación:** revisión de las fuentes semilla vigentes para el dominio a auditar.
2. **Captura:** descarga de cada fuente con user-agent declarado
   (`MALTG-SDT-Auditor/1.0 (+legaltech-governance-scraper; protocolo v1)`),
   límite 400 KB por página, timeout 10–12 s. Snapshot HTML guardado en
   `digitalShadow/scraping/<run_id>/<slug>.html`; `run_id = DS_<dominio>_<YYYYMMDD>_<HHMMSS>` UTC.
   La corrida y el gemelo digital comparten prefijo, de modo que
   `scraping/DS_funcionjudicial_20260915_004501/` ↔ `DS_funcionjudicial_20260915.json`.
3. **Verificación de integridad:** `manifest.json` por corrida con URL, timestamp UTC,
   bytes y **SHA-256** de cada snapshot. La verificación re-hashea los archivos y
   compara contra el manifest (`/api/evidence/verify`).
4. **Codificación:** los hallazgos se mapean, contra la ontología MALTG, a los componentes y
   dimensiones del Digital Shadow generado (`DS_<dominio>_<fecha>.json`); cada fuente lleva
   un `slug` que enlaza el snapshot (trazabilidad campo→fuente).

## 6. Ejecución
- **En la app:** módulo *04 · Get Digital Shadow* → botón «Get» (ejecuta el scraping del dominio
  ingresado, captura evidencia y regenera su Digital Shadow), o tab *Bitácora · Evidencia* →
  «Capturar evidencia» para una corrida de snapshots independiente sobre las fuentes semilla vigentes.
- **Fuera de la app (reproducción independiente):** `python env/tools/scraper_cj.py --fecha-corte YYYY-MM-DD`.

## 7. Registro (bitácora)
Toda corrida, verificación y decisión metodológica queda en `/data/bitacora.json`:
registro **append-only encadenado por hash** (mismo principio que el ledger del expediente),
consultable en el tab *Bitácora · Evidencia*. Las entradas manuales identifican al investigador.

## 8. Reproducibilidad
Un tercero con este repositorio puede: (a) repetir la captura de un dominio en una nueva
fecha de corte y comparar cambios; (b) verificar que los snapshots citados no fueron alterados
desde su captura (SHA-256); (c) auditar la cronología completa de decisiones en la bitácora.

## 9. Limitaciones declaradas
- El snapshot captura el HTML servido (400 KB máx.); no ejecuta JavaScript, por lo que las
  aplicaciones de una sola página (SPA) se documentan por su shell + señales técnicas, no por
  su contenido dinámico renderizado en el cliente.
- La web es mutable: los hashes prueban integridad del snapshot, no permanencia de la fuente.
- La verificación TLS está relajada (certificados estatales/institucionales inconsistentes entre
  entornos); se registra el riesgo.
