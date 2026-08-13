# WATI Catalog Builder — Historial de cambios

## Release v1.3.1 — Higiene para Core y Codex

- Filtra `minecraft:air` y entradas vacías de `acquisition.json` y `lootProfiles`.
- Marca helpers, decoys, partes técnicas y entidades no visibles con `visibility: "hidden"` y `codexVisible: false`.
- Mantiene esas entradas en la contribución para evidencia, pero da a Core/Codex una señal clara para no mostrarlas como fichas públicas.
- Convierte duplicados de contenido en advertencias de revisión; los overrides Vanilla usan `duplicate_content_override`.
- Añade resumen de entradas públicas/ocultas al reporte.

## Release v1.3.0 — WATI Lens SDK y Knowledge 2

- Actualiza la interfaz a Knowledge Schema 2 para alinearse con WATI Core 3.2.0.
- Añade una sección WATI Ecosystem que diferencia contribuciones para Core y starters de Provider para Lens.
- Añade exportación de starter WATI Lens Provider SDK con catálogo estático generado desde bloques, objetos y entidades detectadas.
- Incluye aviso de licencia y permisos: el Builder procesa localmente y no reempaqueta ni redistribuye el add-on analizado.
- Mantiene Schema 3 y Acquisition Schema 2 para compatibilidad con el compilador actual de Core.

## Release v1.2.1 — Primera publicación estable

- Retira las etiquetas Beta de la interfaz, documentación y canal de salida.
- Mantiene Schema 3, Acquisition Schema 2 y Knowledge Schema 1.
- Conserva detección de loot, cofres, pesca, trueques, comercios, hábitats, worldgen, minerales y estructuras jigsaw.
- Corrige las etiquetas inglesas residuales de métricas y tipos de paquete.
- Detecta proyectos que ya incluyen WATI Runtime Provider y advierte que no deben publicar además una contribución estática duplicada para el mismo namespace.
- Mantiene todo el análisis local en el navegador.

## Beta v1.2.1 — Localización y nombres generados

- Traduce toda la vista previa al idioma de interfaz: severidad, categorías, certeza, disponibilidad, contexto, generación y estructuras.
- Los nombres generados para `es_MX` ahora traducen términos comunes del identifier y siguen marcados como generados/editables.
- Corrige nombres Vanilla de estaciones como Mesa de trabajo, Horno y Soporte para pociones.
- No cambia los esquemas 3/Knowledge 1 ni incorpora la contribución de prueba a WATI.


## Beta v1.2.0 — Loot, mundo y conocimiento futuro

- Añade `knowledge.json` con WATI Knowledge Schema 1.
- Detecta biomas personalizados y estructuras `minecraft:jigsaw`.
- Relaciona estructuras con `minecraft:structure_set`.
- Analiza loot tables directas y anidadas.
- Conserva cantidades, funciones, condiciones, pesos relativos, rolls y bonus rolls.
- Clasifica cofres, pesca, trueques, regalos y otras tablas conocidas.
- Extrae comercios de `trading/` y `trades/`.
- Registra fabricación, fundición, pociones y herrería como métodos de obtención.
- Extrae hábitats desde spawn rules.
- Extrae bloques y filtros de generación desde features y feature rules.
- Añade vistas previas de obtención y conocimiento en la interfaz.
- Corrige el compilador para indexar acquisition por `target` y conservar datos enriquecidos.
- El compilador genera `knowledge_data.js` sin exigir que Core lo importe todavía.
- Señala scripts detectados como revisión manual, sin marcarlos como error.

## Beta v1.1.1 — Compilador de WATI Core

- Exportación WATI Schema 3, estaciones, nombres bilingües, edición manual y compilador de contribuciones.


## Beta v1.1.0 — Corrección de errores

- Corrección de errores


## v1.0.0 — Release

- Promotes the tested Beta v0.4.0 code to the first official Catalog Builder release.
- Analyzes local `.mcaddon`, `.mcpack`, and `.zip` files without uploading them to a server.
- Opens nested packs and identifies Behavior Packs and Resource Packs through their manifests.
- Detects project identity, author evidence, public and manifest versions, namespaces, aliases, common license files, and official URLs.
- Extracts items, blocks, entities, Mexican Spanish / US English names, recipes, and direct block/entity loot relationships.
- Supports shaped, shapeless, furnace, brewing, and smithing recipes plus common legacy vanilla item normalization.
- Detects invalid JSON, duplicate definitions, missing loot references, oversized recipes, trailing spaces, and missing Resource Packs.
- Exports Spanish, English, or bilingual WATI Catalog Schema v1 contributions.
- Marks each name as translated, generated, or manually reviewed.
- Warns about missing translations, filters entries by name origin, and allows generated names to be edited before export.
- Exports `source.json`, `content.json`, `recipes.json`, `acquisition.json`, `localization.json`, `report.json`, schemas, and a contribution README.

## Beta v0.4.0

- Added warnings for missing localized names.
- Added translated/generated/manual name filters.
- Added direct editing for generated names and preserved edits as `manual` metadata.

## Beta v0.3.0

- Added bilingual ES-MX / EN-US interface and configurable language export.
- Added primary-language and preview-language selection.
- Added per-language names, sources, and localization keys.
- Cleaned Minecraft formatting codes, private-use icon glyphs, and invisible characters from displayed names.

## Beta v0.2.0

- Improved project-name, author, public-version, manifest-version, source-ID, license, URL, and BP/RP detection.
- Added metadata evidence and warnings for incomplete pack pairs.
- Distinguished equivalent duplicate definitions from conflicting duplicates.
- Added safer decompression limits and expanded automated tests.

## Beta v0.1.0

- First functional local web prototype.
- Added drag-and-drop analysis, nested ZIP handling, manifest detection, content extraction, recipe extraction, direct loot extraction, issue reporting, and WATI Catalog Schema v1 ZIP export.
