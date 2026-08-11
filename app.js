(() => {
  "use strict";
  const engine = window.WatiCatalogEngine;
  const $ = id => document.getElementById(id);

  const TEXT = {
    es_MX: {
      "page.title": "WATI Catalog Builder v1.2.1", "release.label": "v1.2.1 · ESQUEMA 3 + CONOCIMIENTO 1", "language.switch": "Idioma de la interfaz", "language.es": "Español (México)", "language.en": "Inglés (EE. UU.)",
      "hero.description": "Analiza add-ons de Minecraft Bedrock y genera contribuciones normalizadas para WATI Core.",
      "privacy.title": "Privacidad:", "privacy.body": "los paquetes se leen y procesan localmente. Esta página no los sube a ningún servidor.",
      "load.title": "1. Cargar paquete", "load.drop": "Arrastra aquí .mcaddon, .mcpack o .zip", "load.hint": "Puedes cargar juntos el BP y el RP para obtener resultados más completos.",
      "actions.analyze": "Analizar paquete", "actions.reset": "Limpiar", "actions.export": "Exportar contribución ZIP",
      "identity.title": "2. Identificación del proyecto", "identity.helper": "El Builder propone estos datos a partir del manifest, las traducciones y archivos de licencia. Revísalos antes de exportar.",
      "identity.publicName": "Nombre público", "identity.sourceId": "ID de fuente", "identity.author": "Autor", "identity.publicVersion": "Versión pública analizada", "identity.manifestVersion": "Versión interna del manifest", "identity.license": "Licencia", "identity.aliases": "Alias separados por comas", "identity.namespaces": "Namespaces detectados", "identity.officialPage": "Página oficial",
      "placeholders.publicName": "Modern Furniture", "placeholders.sourceId": "modern_furniture", "placeholders.author": "Autor o equipo", "placeholders.aliases": "modern, modernfurniture, furniture", "placeholders.search": "Identifier, nombre, tipo o categoría",
      "license.unknown": "Desconocida / No verificada", "license.arr": "Todos los derechos reservados", "license.custom": "Personalizada",
      "languages.title": "Idiomas de nombres", "languages.helper": "Elige qué nombres se guardarán en la contribución. Los valores faltantes se generan desde el identifier y se marcan como tales.", "languages.export": "Guardar al exportar", "languages.both": "Español (México) e inglés (EE. UU.)", "languages.primary": "Idioma principal", "languages.preview": "Idioma de vista previa",
      "results.title": "3. Resultados", "results.packs": "Paquetes detectados", "results.preview": "Vista previa del contenido", "results.filter": "Filtrar vista previa", "results.nameSourceFilter": "Origen del nombre", "results.stations": "Estaciones de fabricación", "results.acquisition": "Obtención, botín y recompensas", "results.knowledge": "Información futura para Codex", "results.issues": "Problemas y advertencias",
      "filter.all": "Todos", "filter.translated": "Solo traducciones", "filter.generated": "Solo generados", "filter.manual": "Solo editados",
      "table.type": "Tipo", "table.name": "Nombre", "table.manifest": "Manifest", "table.identifier": "Identificador", "table.publicVersion": "Versión pública", "table.nameOrigin": "Origen del nombre", "table.category": "Categoría", "table.internal": "Interno", "table.level": "Nivel", "table.code": "Código", "table.description": "Descripción", "table.file": "Archivo", "table.tag": "Etiqueta", "table.resolution": "Resolución", "table.recipes": "Recetas", "table.target": "Resultado", "table.method": "Método", "table.source": "Fuente", "table.quantity": "Cantidad", "table.chance": "Azar/condición", "table.certainty": "Certeza", "table.subject": "Entrada",
      "empty.start": "Analiza un paquete para comenzar.", "empty.noAnalysis": "Sin análisis.", "empty.noIssues": "No se detectaron problemas estructurales.", "empty.noFilter": "No se encontró contenido con ese filtro.",
      "scope.title": "Alcance actual", "scope.body": "Detecta contenido, traducciones, recetas, botín directo y anidado, cofres, pesca, trueques, comercios, aparición de entidades, generación del mundo, minerales y estructuras jigsaw. Exporta knowledge.json para las futuras fichas detalladas de Codex. La lógica exclusiva de scripts todavía requiere revisión manual.",
      "status.ready": "WATI Catalog Builder v{version}. Todo el análisis se realiza en este navegador.",
      "status.select": "Selecciona al menos un .mcaddon, .mcpack o .zip.", "status.filesReady": "Archivos listos. Para obtener mejores nombres, carga juntos el paquete de comportamiento (BP) y el paquete de recursos (RP).", "status.analyzing": "Descomprimiendo y analizando localmente…", "status.done": "Análisis terminado: {count} archivos procesados. Ningún archivo salió de tu dispositivo.", "status.exported": "Contribución exportada con WATI Schema 3 y Knowledge 1. Revisa report.json, acquisition.json y knowledge.json antes de enviarla.",
      "confirm.errors": "El análisis contiene {count} error(es). La contribución incluirá el reporte. ¿Deseas exportarla de todos modos?",
      "metrics.packs": "Paquetes", "metrics.items": "Objetos", "metrics.blocks": "Bloques", "metrics.entities": "Entidades", "metrics.biomes": "Biomas", "metrics.structures": "Estructuras", "metrics.recipes": "Recetas", "metrics.stations": "Estaciones", "metrics.acquisition": "Obtenciones", "metrics.loot": "Tablas de botín", "metrics.habitats": "Hábitats", "metrics.worldgen": "Generación", "metrics.officialNames": "Nombres oficiales", "metrics.generatedNames": "Nombres generados", "metrics.manualNames": "Nombres editados", "metrics.errors": "Errores", "metrics.warnings": "Advertencias", "metrics.info": "Información",
      "pack.behavior": "Comportamiento", "pack.resource": "Recursos", "origin.lang": "Traducción", "origin.generated": "Generado automáticamente", "origin.manual": "Editado", "boolean.yes": "Sí", "boolean.no": "No",
      "generated.warning": "Se encontraron {count} nombres sin traducción oficial detectable en {locale}. El Builder creó traducciones aproximadas desde sus identifiers; siguen marcadas como generadas y puedes editarlas antes de exportar.", "generated.editAria": "Editar nombre generado de {id}",
      "type.item": "objeto", "type.block": "bloque", "type.entity": "entidad", "type.biome": "bioma", "type.structure": "estructura", "type.ecosystem": "ecosistema", "type.virtual": "virtual",
      "evidence.name": "Nombre", "evidence.author": "Autor", "evidence.version": "Versión pública", "evidence.license": "Licencia", "evidence.manifest": "detectado del manifest", "evidence.manual": "editado manualmente", "evidence.authorDetected": "detectado de la descripción", "evidence.authorUnknown": "no detectado", "evidence.packName": "detectada del nombre del paquete", "evidence.manifestVersion": "tomada del manifest", "evidence.licenseDetected": "Detectada en {path}", "evidence.licenseManual": "Indicada manualmente", "evidence.licenseUnknown": "No verificada",
      "lang.status": "Se exportará: {locales}. Idioma principal: {primary}. Vista previa: {preview}.",
      "issue.invalid_json": "JSON inválido: {message}", "issue.empty_optional_json_ignored": "Archivo JSON opcional vacío ignorado.", "issue.resource_pack_missing": "Solo se detectó el paquete de comportamiento (BP). Añade el paquete de recursos (RP) para recuperar traducciones oficiales.", "issue.behavior_pack_missing": "Solo se detectó el paquete de recursos (RP). No se pueden extraer recetas ni definiciones del paquete de comportamiento (BP).", "issue.duplicate_content_equivalent": "Definición de contenido duplicada y equivalente.", "issue.duplicate_content_conflict": "Definición de contenido duplicada con diferencias.", "issue.generated_fallback_names": "{count} entradas no tienen traducción detectable en {locale}; se generaron nombres desde sus identifiers y pueden editarse antes de exportar.", "issue.missing_loot_table": "No se encontró una tabla de botín referenciada.", "issue.duplicate_recipe_id": "Se detectó un identifier de receta duplicado.", "issue.pattern_exceeds_3x3": "La receta supera el tamaño 3×3.", "issue.trailing_spaces": "La receta contiene espacios finales invisibles.", "issue.author_not_verified": "No se pudo verificar el autor.", "issue.license_not_verified": "No se pudo verificar la licencia.", "issue.official_url_missing": "No se detectó una página oficial.", "issue.declared_pack_not_loaded": "Una dependencia declarada no fue incluida en el análisis.", "issue.unresolved_station_tag": "No se pudo asociar una etiqueta de estación con un bloque u objeto del catálogo.", "issue.loot_table_cycle": "Se encontró una referencia circular entre tablas de botín.", "issue.script_logic_not_interpreted": "Se detectaron scripts; las recompensas o mecánicas definidas solo por JavaScript requieren revisión manual.", "issue.multiple_behavior_packs": "Se detectaron varios paquetes de comportamiento. Analiza por separado los addons independientes para evitar contenido o autorías mezcladas.",
      "files.one": "1 archivo", "files.many": "{count} archivos",
      "severity.error": "Error", "severity.warning": "Advertencia", "severity.info": "Información",
      "certainty.confirmed": "Confirmada", "certainty.probable": "Probable", "certainty.inferred": "Inferida", "certainty.declared": "Declarada", "certainty.unknown": "Desconocida",
      "availability.direct": "Directa", "availability.random_or_conditional": "Aleatoria o condicional",
      "chance.perRoll": "{value}% por tirada", "chance.rolls.one": "1 tirada", "chance.rolls.many": "{count} tiradas", "chance.conditions.one": "1 condición", "chance.conditions.many": "{count} condiciones",
      "knowledge.loot": "Botín", "knowledge.habitat": "Hábitat", "knowledge.worldgen": "Generación del mundo", "knowledge.structure": "Estructura",
      "knowledge.directOutputs.one": "1 resultado directo", "knowledge.directOutputs.many": "{count} resultados directos", "knowledge.linkedTables.one": "1 tabla enlazada", "knowledge.linkedTables.many": "{count} tablas enlazadas", "knowledge.spawnRule": "Regla de aparición", "knowledge.tags": "etiquetas", "knowledge.blocks": "bloques", "knowledge.places": "coloca", "knowledge.placements.one": "1 colocación", "knowledge.placements.many": "{count} colocaciones",
      "context.loot": "Botín", "context.block": "Bloque", "context.entity": "Entidad", "context.chest": "Cofre", "context.container": "Contenedor", "context.structure_container": "Contenedor de estructura", "context.fishing": "Pesca", "context.bartering": "Trueque", "context.hero_of_the_village": "Héroe de la aldea", "context.cat_morning_gift": "Regalo matutino de gato", "context.digging": "Excavación", "context.unknown": "Contexto desconocido",
      "resolution.source_namespace": "Namespace del addon", "resolution.vanilla_tag": "Etiqueta Vanilla", "resolution.unregistered_tag": "Etiqueta sin registrar", "resolution.explicit_identifier": "Identifier explícito", "resolution.unique_catalog_suffix": "Coincidencia única", "resolution.ambiguous_catalog_suffix": "Coincidencia ambigua",
      "category.equipment": "Equipo", "category.items": "Objetos", "category.nature": "Naturaleza", "category.none": "Sin categoría", "category.construction": "Construcción", "category.entity": "Entidades", "category.tools": "Herramientas", "category.materials": "Materiales", "category.biome": "Bioma", "category.structure": "Estructura", "category.combat": "Combate", "category.food": "Comida", "category.decoration": "Decoración", "category.unknown": "Sin categoría",
      "pass.final_pass": "paso final", "pass.after_surface_pass": "después de la superficie", "pass.surface_pass": "superficie", "pass.before_surface_pass": "antes de la superficie", "pass.first_pass": "primer paso", "pass.underground_pass": "subsuelo", "pass.before_sky_pass": "antes del cielo", "pass.sky_pass": "cielo", "pass.after_sky_pass": "después del cielo", "pass.after_underground_pass": "después del subsuelo",
      "step.surface_structures": "estructuras de superficie", "step.top_layer_modification": "modificación de la capa superior"
    },
    en_US: {
      "page.title": "WATI Catalog Builder v1.2.1", "release.label": "v1.2.1 · SCHEMA 3 + KNOWLEDGE 1", "language.switch": "Interface language", "language.es": "Spanish (Mexico)", "language.en": "English (US)",
      "hero.description": "Analyze Minecraft Bedrock add-ons and generate normalized contributions for WATI Core.",
      "privacy.title": "Privacy:", "privacy.body": "packs are read and processed locally. This page does not upload them to any server.",
      "load.title": "1. Load package", "load.drop": "Drop .mcaddon, .mcpack or .zip files here", "load.hint": "Load the BP and RP together whenever possible for more complete results.",
      "actions.analyze": "Analyze package", "actions.reset": "Reset", "actions.export": "Export contribution ZIP",
      "identity.title": "2. Project identification", "identity.helper": "The Builder suggests these details from manifests, translations and license files. Review them before exporting.",
      "identity.publicName": "Public name", "identity.sourceId": "Source ID", "identity.author": "Author", "identity.publicVersion": "Analyzed public version", "identity.manifestVersion": "Internal manifest version", "identity.license": "License", "identity.aliases": "Comma-separated aliases", "identity.namespaces": "Detected namespaces", "identity.officialPage": "Official page",
      "placeholders.publicName": "Modern Furniture", "placeholders.sourceId": "modern_furniture", "placeholders.author": "Author or team", "placeholders.aliases": "modern, modernfurniture, furniture", "placeholders.search": "Identifier, name, type or category",
      "license.unknown": "Unknown / Not verified", "license.arr": "All Rights Reserved", "license.custom": "Custom",
      "languages.title": "Name languages", "languages.helper": "Choose which names will be saved in the contribution. Missing values are generated from the identifier and marked accordingly.", "languages.export": "Save on export", "languages.both": "Spanish (Mexico) and English (US)", "languages.primary": "Primary language", "languages.preview": "Preview language",
      "results.title": "3. Results", "results.packs": "Detected packs", "results.preview": "Content preview", "results.filter": "Filter preview", "results.nameSourceFilter": "Name source", "results.stations": "Crafting stations", "results.acquisition": "Acquisition, loot and rewards", "results.knowledge": "Future Codex knowledge", "results.issues": "Problems and warnings",
      "filter.all": "All", "filter.translated": "Translations only", "filter.generated": "Generated only", "filter.manual": "Edited only",
      "table.type": "Type", "table.name": "Name", "table.manifest": "Manifest", "table.identifier": "Identifier", "table.publicVersion": "Public version", "table.nameOrigin": "Name source", "table.category": "Category", "table.internal": "Internal", "table.level": "Level", "table.code": "Code", "table.description": "Description", "table.file": "File", "table.tag": "Tag", "table.resolution": "Resolution", "table.recipes": "Recipes", "table.target": "Result", "table.method": "Method", "table.source": "Source", "table.quantity": "Quantity", "table.chance": "Chance/condition", "table.certainty": "Certainty", "table.subject": "Entry",
      "empty.start": "Analyze a package to begin.", "empty.noAnalysis": "No analysis yet.", "empty.noIssues": "No structural problems were detected.", "empty.noFilter": "No content matched this filter.",
      "scope.title": "Current scope", "scope.body": "Detects content, translations, recipes, direct and nested loot, chests, fishing, bartering, trades, spawn rules, features, ores and jigsaw structures. Exports knowledge.json for future detailed Codex entries. Script-only logic still requires manual review.",
      "status.ready": "WATI Catalog Builder v{version}. All analysis runs in this browser.",
      "status.select": "Select at least one .mcaddon, .mcpack or .zip file.", "status.filesReady": "Files are ready. Load the Behavior Pack and Resource Pack together for the best names.", "status.analyzing": "Extracting and analyzing locally…", "status.done": "Analysis complete: {count} files processed. No file left your device.", "status.exported": "Contribution exported with WATI Schema 3 and Knowledge 1. Review report.json, acquisition.json and knowledge.json before submitting it.",
      "confirm.errors": "The analysis contains {count} error(s). The contribution will include the report. Export anyway?",
      "metrics.packs": "Packs", "metrics.items": "Items", "metrics.blocks": "Blocks", "metrics.entities": "Entities", "metrics.biomes": "Biomes", "metrics.structures": "Structures", "metrics.recipes": "Recipes", "metrics.stations": "Stations", "metrics.acquisition": "Acquisition", "metrics.loot": "Loot tables", "metrics.habitats": "Habitats", "metrics.worldgen": "Worldgen", "metrics.officialNames": "Official names", "metrics.generatedNames": "Generated names", "metrics.manualNames": "Edited names", "metrics.errors": "Errors", "metrics.warnings": "Warnings", "metrics.info": "Information",
      "pack.behavior": "Behavior", "pack.resource": "Resources", "origin.lang": "Translation", "origin.generated": "Generated", "origin.manual": "Edited", "boolean.yes": "Yes", "boolean.no": "No",
      "generated.warning": "{count} names have no detectable translation in {locale}. The Builder created readable names from their identifiers. Use the ‘Generated only’ filter and edit them directly before exporting.", "generated.editAria": "Edit generated name for {id}",
      "type.item": "item", "type.block": "block", "type.entity": "entity", "type.biome": "biome", "type.structure": "structure", "type.ecosystem": "ecosystem", "type.virtual": "virtual",
      "evidence.name": "Name", "evidence.author": "Author", "evidence.version": "Public version", "evidence.license": "License", "evidence.manifest": "detected from manifest", "evidence.manual": "manually edited", "evidence.authorDetected": "detected from description", "evidence.authorUnknown": "not detected", "evidence.packName": "detected from pack name", "evidence.manifestVersion": "taken from manifest", "evidence.licenseDetected": "Detected in {path}", "evidence.licenseManual": "Entered manually", "evidence.licenseUnknown": "Not verified",
      "lang.status": "Exporting: {locales}. Primary language: {primary}. Preview: {preview}.",
      "issue.invalid_json": "Invalid JSON: {message}", "issue.empty_optional_json_ignored": "Empty optional JSON file ignored.", "issue.resource_pack_missing": "Only the Behavior Pack was detected. Add the Resource Pack to recover official translations.", "issue.behavior_pack_missing": "Only the Resource Pack was detected. Behavior Pack definitions and recipes cannot be extracted.", "issue.duplicate_content_equivalent": "Equivalent duplicate content definition.", "issue.duplicate_content_conflict": "Conflicting duplicate content definition.", "issue.generated_fallback_names": "{count} entries have no detectable translation in {locale}; their names were generated from identifiers and can be edited before export.", "issue.missing_loot_table": "A referenced loot table was not found.", "issue.duplicate_recipe_id": "A duplicate recipe identifier was detected.", "issue.pattern_exceeds_3x3": "The recipe exceeds the 3×3 size.", "issue.trailing_spaces": "The recipe contains invisible trailing spaces.", "issue.author_not_verified": "The author could not be verified.", "issue.license_not_verified": "The license could not be verified.", "issue.official_url_missing": "No official page was detected.", "issue.declared_pack_not_loaded": "A declared dependency was not included in the analysis.", "issue.unresolved_station_tag": "A station tag could not be associated with a catalog block or item.", "issue.loot_table_cycle": "A circular loot-table reference was found.", "issue.script_logic_not_interpreted": "Scripts were detected; rewards or mechanics defined only in JavaScript require manual review.", "issue.multiple_behavior_packs": "Multiple behavior packs were detected. Analyze independent add-ons separately to avoid mixed content or attribution.", "issue.runtime_provider_detected": "A WATI Runtime Provider was detected. Use the Provider as the authoritative source for its namespace and do not publish a duplicate static contribution.",
      "files.one": "1 file", "files.many": "{count} files",
      "severity.error": "Error", "severity.warning": "Warning", "severity.info": "Information",
      "certainty.confirmed": "Confirmed", "certainty.probable": "Probable", "certainty.inferred": "Inferred", "certainty.declared": "Declared", "certainty.unknown": "Unknown",
      "availability.direct": "Direct", "availability.random_or_conditional": "Random or conditional",
      "chance.perRoll": "{value}% per roll", "chance.rolls.one": "1 roll", "chance.rolls.many": "{count} rolls", "chance.conditions.one": "1 condition", "chance.conditions.many": "{count} conditions",
      "knowledge.loot": "Loot", "knowledge.habitat": "Habitat", "knowledge.worldgen": "World generation", "knowledge.structure": "Structure",
      "knowledge.directOutputs.one": "1 direct output", "knowledge.directOutputs.many": "{count} direct outputs", "knowledge.linkedTables.one": "1 linked table", "knowledge.linkedTables.many": "{count} linked tables", "knowledge.spawnRule": "Spawn rule", "knowledge.tags": "tags", "knowledge.blocks": "blocks", "knowledge.places": "places", "knowledge.placements.one": "1 placement", "knowledge.placements.many": "{count} placements",
      "context.loot": "Loot", "context.block": "Block", "context.entity": "Entity", "context.chest": "Chest", "context.container": "Container", "context.structure_container": "Structure container", "context.fishing": "Fishing", "context.bartering": "Bartering", "context.hero_of_the_village": "Hero of the Village", "context.cat_morning_gift": "Cat morning gift", "context.digging": "Digging", "context.unknown": "Unknown context",
      "resolution.source_namespace": "Add-on namespace", "resolution.vanilla_tag": "Vanilla tag", "resolution.unregistered_tag": "Unregistered tag", "resolution.explicit_identifier": "Explicit identifier", "resolution.unique_catalog_suffix": "Unique match", "resolution.ambiguous_catalog_suffix": "Ambiguous match",
      "category.equipment": "Equipment", "category.items": "Items", "category.nature": "Nature", "category.none": "Uncategorized", "category.construction": "Construction", "category.entity": "Entities", "category.tools": "Tools", "category.materials": "Materials", "category.biome": "Biome", "category.structure": "Structure", "category.combat": "Combat", "category.food": "Food", "category.decoration": "Decoration", "category.unknown": "Uncategorized",
      "pass.final_pass": "final pass", "pass.after_surface_pass": "after surface", "pass.surface_pass": "surface", "pass.before_surface_pass": "before surface", "pass.first_pass": "first pass", "pass.underground_pass": "underground", "pass.before_sky_pass": "before sky", "pass.sky_pass": "sky", "pass.after_sky_pass": "after sky", "pass.after_underground_pass": "after underground",
      "step.surface_structures": "surface structures", "step.top_layer_modification": "top-layer modification"
    }
  };

  const localeLabel = locale => locale === "es_MX" ? t("language.es") : t("language.en");
  const interpolate = (text, params = {}) => String(text).replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
  const t = (key, params) => interpolate(TEXT[state.uiLocale]?.[key] ?? TEXT.es_MX[key] ?? key, params);
  const state = {
    files: [], entries: [], analysis: null, metadataFilled: false,
    uiLocale: localStorage.getItem("watiBuilderUiLocale") || (navigator.language?.toLowerCase().startsWith("en") ? "en_US" : "es_MX"),
    status: { key: "status.ready", params: { version: engine.VERSION }, tone: "info" },
    nameOverrides: new Map()
  };

  const el = {
    drop: $("drop-zone"), picker: $("file-picker"), analyze: $("analyze-btn"), export: $("export-btn"),
    status: $("status"), summary: $("summary"), issues: $("issues"), content: $("content-preview"), stations: $("station-preview"), acquisition: $("acquisition-preview"), knowledge: $("knowledge-preview"), packs: $("pack-preview"),
    nameSourceFilter: $("name-source-filter"), generatedWarning: $("generated-name-warning"),
    sourceName: $("source-name"), sourceId: $("source-id"), author: $("author"), version: $("version"),
    manifestVersion: $("manifest-version"), license: $("license"), aliases: $("aliases"), officialUrl: $("official-url"),
    namespaces: $("namespaces"), metadataEvidence: $("metadata-evidence"), reset: $("reset-btn"), contentSearch: $("content-search"),
    exportLanguages: $("export-languages"), primaryLocale: $("primary-locale"), previewLocale: $("preview-locale"), languageStatus: $("language-status")
  };

  function setStatus(key, params = {}, tone = "info") {
    state.status = { key, params, tone };
    el.status.textContent = t(key, params);
    el.status.dataset.tone = tone;
  }
  function setRawStatus(message, tone = "error") {
    state.status = { raw: message, tone };
    el.status.textContent = message;
    el.status.dataset.tone = tone;
  }
  function formatBytes(value) { return value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1048576).toFixed(1)} MB`; }
  function escapeHtml(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
  function badge(label, value, detail = "") { return `<div class="metric"><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</div>`; }

  function applyUiLanguage() {
    document.documentElement.lang = state.uiLocale === "es_MX" ? "es-MX" : "en-US";
    document.title = t("page.title");
    document.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(node => { node.placeholder = t(node.dataset.i18nPlaceholder); });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(node => { node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel)); });
    document.querySelectorAll("[data-ui-lang]").forEach(btn => btn.classList.toggle("active", btn.dataset.uiLang === state.uiLocale));
    if (state.files.length) updateDropDisplay();
    if (state.status.raw) el.status.textContent = state.status.raw;
    else el.status.textContent = t(state.status.key, state.status.params);
    if (state.analysis) render(); else renderLanguageStatus();
  }

  document.querySelectorAll("[data-ui-lang]").forEach(btn => btn.addEventListener("click", () => {
    state.uiLocale = btn.dataset.uiLang;
    localStorage.setItem("watiBuilderUiLocale", state.uiLocale);
    applyUiLanguage();
  }));

  function updateDropDisplay() {
    el.drop.querySelector("strong").textContent = state.files.map(f => f.name).join(", ");
    const fileCount = state.files.length;
    el.drop.querySelector("span").textContent = `${t(fileCount === 1 ? "files.one" : "files.many", { count: fileCount })}, ${formatBytes(state.files.reduce((n, f) => n + f.size, 0))}`;
  }

  function receive(files) {
    state.files = [...files].filter(f => /\.(zip|mcpack|mcaddon)$/i.test(f.name));
    if (!state.files.length) { setStatus("status.select", {}, "warning"); return; }
    updateDropDisplay();
    el.analyze.disabled = false;
    setStatus("status.filesReady");
  }

  el.picker.addEventListener("change", () => receive(el.picker.files));
  el.drop.addEventListener("click", () => el.picker.click());
  el.drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") el.picker.click(); });
  el.drop.addEventListener("dragover", e => { e.preventDefault(); el.drop.classList.add("dragging"); });
  el.drop.addEventListener("dragleave", () => el.drop.classList.remove("dragging"));
  el.drop.addEventListener("drop", e => { e.preventDefault(); el.drop.classList.remove("dragging"); receive(e.dataTransfer.files); });

  function exportLanguageConfig() {
    const mode = el.exportLanguages.value;
    const exportLocales = mode === "both" ? ["es_MX", "en_US"] : [mode];
    if (!exportLocales.includes(el.primaryLocale.value)) el.primaryLocale.value = exportLocales[0];
    el.primaryLocale.disabled = mode !== "both";
    return { exportLocales, primaryLocale: mode === "both" ? el.primaryLocale.value : exportLocales[0] };
  }

  function metadata() {
    const lang = exportLanguageConfig();
    return {
      name: el.sourceName.value.trim() || undefined,
      id: el.sourceId.value.trim() || undefined,
      author: el.author.value.trim() || undefined,
      version: el.version.value.trim() || undefined,
      license: el.license.value,
      aliases: el.aliases.value.split(",").map(v => v.trim()).filter(Boolean),
      officialUrl: el.officialUrl.value.trim(),
      primaryLocale: lang.primaryLocale,
      exportLocales: lang.exportLocales
    };
  }

  function fillMetadata(source, force = false) {
    const set = (input, value) => { if (force || !input.value.trim()) input.value = value || ""; };
    set(el.sourceName, source.name);
    set(el.sourceId, source.id);
    set(el.author, source.author === "Unknown" ? "" : source.author);
    set(el.version, source.version === "unknown" ? "" : source.version);
    el.manifestVersion.value = source.manifestVersion === "unknown" ? "" : source.manifestVersion || "";
    set(el.aliases, (source.aliases || []).join(", "));
    set(el.officialUrl, source.officialUrl);
    el.namespaces.value = (source.namespaces || []).join(", ");
    if ((force || el.license.value === "Unknown / Not verified") && source.license) el.license.value = source.license;
  }

  function renderEvidence() {
    const evidence = state.analysis.report.metadataEvidence;
    const source = state.analysis.source.source;
    const licenseText = source.licenseStatus === "detected"
      ? t("evidence.licenseDetected", { path: source.licenseEvidence || "LICENSE" })
      : source.licenseStatus === "user_provided" ? t("evidence.licenseManual") : t("evidence.licenseUnknown");
    el.metadataEvidence.innerHTML = [
      `<b>${t("evidence.name")}:</b> ${escapeHtml(evidence.publicName.source === "manifest" ? t("evidence.manifest") : t("evidence.manual"))}`,
      `<b>${t("evidence.author")}:</b> ${escapeHtml(evidence.author.source === "detected" ? t("evidence.authorDetected") : evidence.author.source === "user" ? t("evidence.manual") : t("evidence.authorUnknown"))}`,
      `<b>${t("evidence.version")}:</b> ${escapeHtml(evidence.publicVersion.source === "pack_name" ? t("evidence.packName") : evidence.publicVersion.source === "manifest" ? t("evidence.manifestVersion") : t("evidence.manual"))}`,
      `<b>${t("evidence.license")}:</b> ${escapeHtml(licenseText)}`
    ].join("<span class=dot>•</span>");
  }

  function allContentEntries(analysis = state.analysis) {
    if (!analysis) return [];
    return [...analysis.content.items, ...analysis.content.blocks, ...analysis.content.entities, ...(analysis.content.biomes || []), ...(analysis.content.structures || []), ...(analysis.content.ecosystems || [])];
  }

  function overrideKey(locale, type, id) { return `${locale}|${type}|${id}`; }

  function applyNameOverrides(analysis) {
    if (!analysis) return analysis;
    for (const entry of allContentEntries(analysis)) {
      for (const locale of engine.SUPPORTED_EXPORT_LOCALES) {
        const value = state.nameOverrides.get(overrideKey(locale, entry.type, entry.id));
        if (value) {
          entry.names[locale] = value;
          entry.nameSources[locale] = "manual";
          entry.localizationKeys[locale] = null;
        }
      }
      const primary = analysis.content.primaryLocale || "es_MX";
      entry.fallbackName = entry.names[primary] || entry.fallbackName;
      entry.nameSource = entry.nameSources[primary] || entry.nameSource;
      entry.localizationKey = entry.localizationKeys[primary] || null;
      entry.localizationLocale = entry.nameSource === "lang" ? primary : null;
    }
    const byContentId = new Map(allContentEntries(analysis).map(entry => [entry.id, entry]));
    for (const station of analysis.stations?.stations || []) {
      const entry = station.contentRef?.id ? byContentId.get(station.contentRef.id) : null;
      if (!entry) continue;
      station.names = { ...entry.names };
      station.nameSources = { ...entry.nameSources };
      station.localizationKeys = { ...entry.localizationKeys };
      station.fallbackName = entry.fallbackName;
      station.runtimeLocalizationKey = entry.runtimeLocalizationKey || entry.localizationKey || null;
    }
    syncNameStats(analysis);
    return analysis;
  }

  function syncNameStats(analysis) {
    const report = analysis.report;
    const summary = report.summary;
    const entries = allContentEntries(analysis);
    const namesByLocale = {};
    for (const locale of engine.SUPPORTED_EXPORT_LOCALES) {
      const counts = { localized: 0, generated: 0, manual: 0 };
      for (const entry of entries) {
        const source = entry.nameSources?.[locale] || "generated";
        if (source === "lang") counts.localized++;
        else if (source === "manual") counts.manual++;
        else counts.generated++;
      }
      namesByLocale[locale] = counts;
    }
    summary.namesByLocale = namesByLocale;
    const primary = analysis.content.primaryLocale || "es_MX";
    summary.localizedNames = namesByLocale[primary]?.localized || 0;
    summary.generatedNames = namesByLocale[primary]?.generated || 0;
    summary.manualNames = namesByLocale[primary]?.manual || 0;

    const retained = report.issues.filter(issue => issue.code !== "generated_fallback_names");
    for (const locale of analysis.content.exportedLocales || engine.SUPPORTED_EXPORT_LOCALES) {
      const count = namesByLocale[locale]?.generated || 0;
      if (count) retained.push({ severity: "warning", code: "generated_fallback_names", path: `texts/${locale}.lang`, locale, count, message: locale === "es_MX" ? `${count} nombres generados desde identifiers para ${locale}.` : `${count} names generated from identifiers for ${locale}.` });
    }
    report.issues = retained;
    summary.errors = retained.filter(issue => issue.severity === "error").length;
    summary.warnings = retained.filter(issue => issue.severity === "warning").length;
    summary.info = retained.filter(issue => issue.severity === "info").length;
    report.nameOverrides = [...state.nameOverrides.entries()].map(([key, value]) => {
      const [locale, type, ...idParts] = key.split("|");
      return { locale, type, id: idParts.join("|"), value };
    });
  }

  function contentRows() {
    const all = allContentEntries();
    const locale = el.previewLocale.value;
    const query = el.contentSearch.value.trim().toLowerCase();
    const sourceFilter = el.nameSourceFilter.value;
    const filtered = all.filter(x => {
      const source = x.nameSources?.[locale] || x.nameSource || "generated";
      if (sourceFilter !== "all" && source !== sourceFilter) return false;
      return !query || `${x.type} ${x.id} ${x.names?.[locale] || x.fallbackName} ${x.category} ${source}`.toLowerCase().includes(query);
    });
    return filtered.slice(0, 250);
  }

  function issueMessage(issue) {
    const key = `issue.${issue.code}`;
    if (TEXT[state.uiLocale]?.[key] || TEXT.es_MX[key]) return t(key, { message: issue.message, count: issue.count ?? "", locale: issue.locale ? localeLabel(issue.locale) : "" });
    return issue.message;
  }

  function renderLanguageStatus() {
    const config = exportLanguageConfig();
    const locales = config.exportLocales.map(localeLabel).join(" + ");
    el.languageStatus.innerHTML = t("lang.status", {
      locales: `<strong>${escapeHtml(locales)}</strong>`,
      primary: `<strong>${escapeHtml(localeLabel(config.primaryLocale))}</strong>`,
      preview: `<strong>${escapeHtml(localeLabel(el.previewLocale.value))}</strong>`
    });
  }

  function enumLabel(prefix, value, fallback = value) {
    if (value === undefined || value === null || value === "") return fallback ?? "—";
    const normalized = String(value).trim().toLowerCase();
    const key = `${prefix}.${normalized}`;
    return (TEXT[state.uiLocale]?.[key] || TEXT.es_MX[key]) ? t(key) : fallback;
  }

  function categoryLabel(value) { return enumLabel("category", String(value || "unknown").toLowerCase(), value || t("category.unknown")); }
  function severityLabel(value) { return enumLabel("severity", value, value); }
  function certaintyLabel(value) { return enumLabel("certainty", value || "unknown", value || "—"); }
  function availabilityLabel(value) { return enumLabel("availability", value, value || "—"); }
  function contextLabel(value) { return enumLabel("context", value || "loot", value || t("context.loot")); }
  function resolutionLabel(value) { return enumLabel("resolution", value, value || "—"); }
  function passLabel(value) { return enumLabel("pass", value, String(value || "").replace(/_/g, " ") || "—"); }
  function stepLabel(value) { return enumLabel("step", value, String(value || "").replace(/_/g, " ") || "—"); }
  function countLabel(oneKey, manyKey, count) { return t(count === 1 ? oneKey : manyKey, { count }); }

  function formatQuantity(quantity) {
    if (!quantity) return "—";
    const min = Number.isFinite(quantity.min) ? quantity.min : 1;
    const max = Number.isFinite(quantity.max) ? quantity.max : min;
    return min === max ? String(min) : `${min}–${max}`;
  }

  function formatChance(method) {
    const chance = method.chance || {};
    const conditions = method.conditions || [];
    const parts = [];
    if (Number.isFinite(chance.perRoll) && chance.perRoll < 1) {
      const value = (chance.perRoll * 100).toFixed(chance.perRoll < 0.1 ? 1 : 0);
      parts.push(t("chance.perRoll", { value }));
    }
    if (chance.rolls && (chance.rolls.min !== 1 || chance.rolls.max !== 1)) {
      const count = formatQuantity(chance.rolls);
      parts.push(chance.rolls.min === 1 && chance.rolls.max === 1 ? t("chance.rolls.one") : t("chance.rolls.many", { count }));
    }
    if (conditions.length) parts.push(countLabel("chance.conditions.one", "chance.conditions.many", conditions.length));
    return parts.join(" · ") || availabilityLabel(method.availability);
  }

  function methodLabel(method) {
    const labels = state.uiLocale === "es_MX" ? {
      craft: "fabricación", smelt: "fundición", brew: "poción", smith: "herrería", break_block: "minar/romper", entity_drop: "botín de entidad", container_loot: "cofre/contenedor", fishing: "pesca", barter: "trueque", trade: "comercio", gift: "regalo", digging: "excavación", random_loot: "botín aleatorio"
    } : {
      craft: "crafting", smelt: "smelting", brew: "brewing", smith: "smithing", break_block: "mine/break", entity_drop: "entity drop", container_loot: "chest/container", fishing: "fishing", barter: "bartering", trade: "trade", gift: "gift", digging: "digging", random_loot: "random loot"
    };
    return labels[method] || method;
  }

  function renderKnowledgeRows(knowledge) {
    const rows = [];
    for (const profile of knowledge?.lootProfiles || []) {
      const details = [
        contextLabel(profile.context || "loot"),
        profile.directOutputs?.length ? countLabel("knowledge.directOutputs.one", "knowledge.directOutputs.many", profile.directOutputs.length) : "",
        profile.references?.length ? countLabel("knowledge.linkedTables.one", "knowledge.linkedTables.many", profile.references.length) : ""
      ].filter(Boolean).join(" · ");
      rows.push([t("knowledge.loot"), profile.id, details, profile.evidence?.path]);
    }
    for (const habitat of knowledge?.habitats || []) {
      const details = [
        habitat.biomes?.length ? habitat.biomes.join(", ") : "",
        habitat.biomeTags?.length ? `${t("knowledge.tags")}: ${habitat.biomeTags.join(", ")}` : "",
        habitat.blocks?.length ? `${t("knowledge.blocks")}: ${habitat.blocks.join(", ")}` : "",
        habitat.dimensions?.length ? habitat.dimensions.join(", ") : ""
      ].filter(Boolean).join(" · ");
      rows.push([t("knowledge.habitat"), habitat.entity, details || t("knowledge.spawnRule"), habitat.evidence?.path]);
    }
    for (const worldgen of knowledge?.worldGeneration || []) {
      const details = [
        worldgen.blocks?.length ? `${t("knowledge.places")}: ${worldgen.blocks.join(", ")}` : "",
        worldgen.biomeTags?.length ? `${t("knowledge.tags")}: ${worldgen.biomeTags.join(", ")}` : "",
        worldgen.placementPass ? passLabel(worldgen.placementPass) : ""
      ].filter(Boolean).join(" · ");
      rows.push([t("knowledge.worldgen"), worldgen.id || worldgen.feature, details || worldgen.feature, worldgen.evidence?.path]);
    }
    for (const structure of knowledge?.structures || []) {
      const details = [
        structure.step ? stepLabel(structure.step) : "",
        structure.startPool || "",
        structure.dimensions?.join(", ") || "",
        structure.placements?.length ? countLabel("knowledge.placements.one", "knowledge.placements.many", structure.placements.length) : ""
      ].filter(Boolean).join(" · ");
      rows.push([t("knowledge.structure"), structure.id, details, structure.evidence?.path]);
    }
    return rows.slice(0, 300);
  }

  function render() {
    const a = state.analysis, s = a.report.summary;
    const previewLocale = el.previewLocale.value;
    syncNameStats(a);
    const nameStats = s.namesByLocale?.[previewLocale] || { localized: s.localizedNames, generated: s.generatedNames, manual: s.manualNames || 0 };
    el.summary.innerHTML = [
      badge(t("metrics.packs"), s.packs, `${s.behaviorPacks} BP · ${s.resourcePacks} RP`),
      badge(t("metrics.items"), s.items), badge(t("metrics.blocks"), s.blocks), badge(t("metrics.entities"), s.entities),
      badge(t("metrics.biomes"), s.biomes || 0), badge(t("metrics.structures"), s.structures || 0),
      badge(t("metrics.recipes"), s.recipes), badge(t("metrics.stations"), s.stations || 0), badge(t("metrics.acquisition"), s.acquisition),
      badge(t("metrics.loot"), s.lootTables || 0), badge(t("metrics.habitats"), s.habitats || 0), badge(t("metrics.worldgen"), s.worldGeneration || 0),
      badge(t("metrics.officialNames"), nameStats.localized, localeLabel(previewLocale)),
      badge(t("metrics.generatedNames"), nameStats.generated, localeLabel(previewLocale)),
      badge(t("metrics.manualNames"), nameStats.manual || 0, localeLabel(previewLocale)),
      badge(t("metrics.errors"), s.errors), badge(t("metrics.warnings"), s.warnings), badge(t("metrics.info"), s.info)
    ].join("");

    el.issues.innerHTML = a.report.issues.length
      ? a.report.issues.slice(0, 500).map(i => `<tr><td><span class="severity ${i.severity}">${escapeHtml(severityLabel(i.severity))}</span></td><td>${escapeHtml(i.code)}</td><td>${escapeHtml(issueMessage(i))}</td><td><code>${escapeHtml(i.path)}</code></td></tr>`).join("")
      : `<tr><td colspan="4" class="empty">${t("empty.noIssues")}</td></tr>`;

    const generatedCount = nameStats.generated || 0;
    if (generatedCount) {
      el.generatedWarning.hidden = false;
      el.generatedWarning.innerHTML = t("generated.warning", { count: `<strong>${generatedCount}</strong>`, locale: `<strong>${escapeHtml(localeLabel(previewLocale))}</strong>` });
    } else {
      el.generatedWarning.hidden = true;
      el.generatedWarning.textContent = "";
    }

    const samples = contentRows();
    el.content.innerHTML = samples.map(x => {
      const name = x.names?.[previewLocale] || x.fallbackName;
      const source = x.nameSources?.[previewLocale] || x.nameSource || "generated";
      const sourceLabel = source === "lang" ? t("origin.lang") : source === "manual" ? t("origin.manual") : t("origin.generated");
      const editable = source !== "lang";
      const nameCell = editable
        ? `<input class="name-editor ${source === "manual" ? "manual-name" : ""}" data-name-locale="${escapeHtml(previewLocale)}" data-name-type="${escapeHtml(x.type)}" data-name-id="${escapeHtml(x.id)}" value="${escapeHtml(name)}" aria-label="${escapeHtml(t("generated.editAria", { id: x.id }))}">`
        : escapeHtml(name);
      return `<tr><td>${escapeHtml(t(`type.${x.type}`))}</td><td><code>${escapeHtml(x.id)}</code></td><td>${nameCell}</td><td class="name-origin-${escapeHtml(source)}">${escapeHtml(sourceLabel)}</td><td>${escapeHtml(categoryLabel(x.category))}</td><td>${x.internal ? t("boolean.yes") : t("boolean.no")}</td></tr>`;
    }).join("") || `<tr><td colspan="6" class="empty">${t("empty.noFilter")}</td></tr>`;

    el.stations.innerHTML = (a.stations?.stations || []).map(station => {
      const name = station.names?.[previewLocale] || station.fallbackName || station.tag;
      const resolution = station.resolved ? `${resolutionLabel(station.resolvedBy)} · ${station.confidence}/3` : resolutionLabel(station.resolvedBy);
      return `<tr><td>${escapeHtml(name)}</td><td><code>${escapeHtml(station.tag)}</code></td><td><code>${escapeHtml(station.id)}</code></td><td>${escapeHtml(t(`type.${station.kind}`))}</td><td>${escapeHtml(resolution)}</td><td>${escapeHtml(station.recipeIds?.length || 0)}</td></tr>`;
    }).join("") || `<tr><td colspan="6" class="empty">${t("empty.noFilter")}</td></tr>`;

    el.acquisition.innerHTML = (a.acquisition?.methods || []).slice(0, 400).map(method => `<tr><td><code>${escapeHtml(method.target)}</code></td><td>${escapeHtml(methodLabel(method.method))}</td><td><code>${escapeHtml(method.source)}</code></td><td>${escapeHtml(formatQuantity(method.quantity))}</td><td>${escapeHtml(formatChance(method))}</td><td>${escapeHtml(certaintyLabel(method.certainty))}</td></tr>`).join("") || `<tr><td colspan="6" class="empty">${t("empty.noFilter")}</td></tr>`;

    el.knowledge.innerHTML = renderKnowledgeRows(a.knowledge).map(row => `<tr><td>${escapeHtml(row[0])}</td><td><code>${escapeHtml(row[1])}</code></td><td>${escapeHtml(row[2] || "—")}</td><td><code>${escapeHtml(row[3] || "—")}</code></td></tr>`).join("") || `<tr><td colspan="4" class="empty">${t("empty.noFilter")}</td></tr>`;

    el.packs.innerHTML = a.report.packs.map(p => `<tr><td>${escapeHtml(p.kind === "behavior" ? t("pack.behavior") : t("pack.resource"))}</td><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.publicVersionCandidate || "—")}</td><td>${escapeHtml(p.manifestVersion)}</td><td><code>${escapeHtml(p.uuid || "—")}</code></td></tr>`).join("") || `<tr><td colspan="5" class="empty">${t("empty.start")}</td></tr>`;
    renderEvidence();
    renderLanguageStatus();
    el.export.disabled = false;
  }

  async function analyze({ refill = false } = {}) {
    el.analyze.disabled = true;
    el.export.disabled = true;
    setStatus("status.analyzing");
    try {
      if (!state.entries.length) {
        const inputs = [];
        for (const file of state.files) inputs.push({ name: file.name, data: new Uint8Array(await file.arrayBuffer()) });
        state.entries = await engine.flattenArchives(inputs);
      }
      state.analysis = applyNameOverrides(engine.analyzeEntries(state.entries, metadata()));
      fillMetadata(state.analysis.source.source, refill);
      if (!state.metadataFilled) {
        state.metadataFilled = true;
        state.analysis = applyNameOverrides(engine.analyzeEntries(state.entries, metadata()));
        fillMetadata(state.analysis.source.source);
      }
      render();
      setStatus("status.done", { count: state.entries.length }, "success");
    } catch (error) {
      console.error(error);
      setRawStatus(error.message || String(error), "error");
    } finally {
      el.analyze.disabled = false;
    }
  }

  el.analyze.addEventListener("click", () => analyze());
  [el.sourceName, el.sourceId, el.author, el.version, el.license, el.aliases, el.officialUrl].forEach(input => input.addEventListener("change", () => {
    if (!state.entries.length) return;
    state.analysis = applyNameOverrides(engine.analyzeEntries(state.entries, metadata()));
    fillMetadata(state.analysis.source.source);
    render();
  }));

  [el.exportLanguages, el.primaryLocale].forEach(input => input.addEventListener("change", () => {
    exportLanguageConfig();
    if (state.entries.length) {
      state.analysis = applyNameOverrides(engine.analyzeEntries(state.entries, metadata()));
      render();
    } else renderLanguageStatus();
  }));
  el.previewLocale.addEventListener("change", () => { if (state.analysis) render(); else renderLanguageStatus(); });
  el.contentSearch.addEventListener("input", () => { if (state.analysis) render(); });
  el.nameSourceFilter.addEventListener("change", () => { if (state.analysis) render(); });
  el.content.addEventListener("change", event => {
    const input = event.target.closest(".name-editor");
    if (!input || !state.analysis) return;
    const locale = input.dataset.nameLocale;
    const type = input.dataset.nameType;
    const id = input.dataset.nameId;
    const value = input.value.trim();
    const key = overrideKey(locale, type, id);
    if (value) state.nameOverrides.set(key, value);
    else state.nameOverrides.delete(key);
    applyNameOverrides(state.analysis);
    render();
  });
  el.content.addEventListener("keydown", event => {
    if (event.key === "Enter" && event.target.matches(".name-editor")) event.target.blur();
  });

  el.export.addEventListener("click", () => {
    if (!state.analysis) return;
    state.analysis = applyNameOverrides(engine.analyzeEntries(state.entries, metadata()));
    fillMetadata(state.analysis.source.source);
    render();
    const errors = state.analysis.report.summary.errors;
    if (errors && !window.confirm(t("confirm.errors", { count: errors }))) return;
    syncNameStats(state.analysis);
    const bytes = engine.exportContribution(state.analysis);
    const sourceId = state.analysis.source.source.id || "addon";
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `WATI_Contribution_${sourceId}.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setStatus("status.exported", {}, "success");
  });

  el.reset.addEventListener("click", () => location.reload());
  exportLanguageConfig();
  applyUiLanguage();
  setStatus("status.ready", { version: engine.VERSION });
  renderLanguageStatus();
})();
