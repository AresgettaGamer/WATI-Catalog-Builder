(() => {
  "use strict";
  const engine = window.WatiCatalogEngine;
  const $ = id => document.getElementById(id);

  const TEXT = {
    es_MX: {
      "page.title": "WATI Catalog Builder v1.0.0",
      "hero.description": "Analiza add-ons de Minecraft Bedrock y genera contribuciones normalizadas para WATI Core.",
      "privacy.title": "Privacidad:", "privacy.body": "los paquetes se leen y procesan localmente. Esta página no los sube a ningún servidor.",
      "load.title": "1. Cargar paquete", "load.drop": "Arrastra aquí .mcaddon, .mcpack o .zip", "load.hint": "Puedes cargar juntos el BP y el RP para obtener resultados más completos.",
      "actions.analyze": "Analizar paquete", "actions.reset": "Limpiar", "actions.export": "Exportar contribución ZIP",
      "identity.title": "2. Identificación del proyecto", "identity.helper": "El Builder propone estos datos a partir del manifest, las traducciones y archivos de licencia. Revísalos antes de exportar.",
      "identity.publicName": "Nombre público", "identity.sourceId": "ID de fuente", "identity.author": "Autor", "identity.publicVersion": "Versión pública analizada", "identity.manifestVersion": "Versión interna del manifest", "identity.license": "Licencia", "identity.aliases": "Alias separados por comas", "identity.namespaces": "Namespaces detectados", "identity.officialPage": "Página oficial",
      "placeholders.publicName": "Modern Furniture", "placeholders.sourceId": "modern_furniture", "placeholders.author": "Autor o equipo", "placeholders.aliases": "modern, modernfurniture, furniture", "placeholders.search": "Identifier, nombre, tipo o categoría",
      "license.unknown": "Desconocida / No verificada", "license.arr": "Todos los derechos reservados", "license.custom": "Personalizada",
      "languages.title": "Idiomas de nombres", "languages.helper": "Elige qué nombres se guardarán en la contribución. Los valores faltantes se generan desde el identifier y se marcan como tales.", "languages.export": "Guardar al exportar", "languages.both": "Español (México) e English (US)", "languages.primary": "Idioma principal", "languages.preview": "Idioma de vista previa",
      "results.title": "3. Resultados", "results.packs": "Paquetes detectados", "results.preview": "Vista previa del contenido", "results.filter": "Filtrar vista previa", "results.nameSourceFilter": "Origen del nombre", "results.issues": "Problemas y advertencias",
      "filter.all": "Todos", "filter.translated": "Solo traducciones", "filter.generated": "Solo generados", "filter.manual": "Solo editados",
      "table.type": "Tipo", "table.name": "Nombre", "table.publicVersion": "Versión pública", "table.nameOrigin": "Origen del nombre", "table.category": "Categoría", "table.internal": "Interno", "table.level": "Nivel", "table.code": "Código", "table.description": "Descripción", "table.file": "Archivo",
      "empty.start": "Analiza un paquete para comenzar.", "empty.noAnalysis": "Sin análisis.", "empty.noIssues": "No se detectaron problemas estructurales.", "empty.noFilter": "No se encontró contenido con ese filtro.",
      "scope.title": "Alcance actual", "scope.body": "Detecta manifests, identidad básica del proyecto, objetos, bloques, entidades, traducciones en español mexicano e inglés, recetas JSON y obtención directa mediante loot tables de bloques y entidades. También distingue la versión pública de la versión interna del manifest, detecta licencias comunes y avisa cuando falta el Resource Pack. Trades, feature rules, cultivos avanzados y sistemas controlados por scripts todavía requieren revisión manual.",
      "status.ready": "WATI Catalog Builder v{version}. Todo el análisis se realiza en este navegador.",
      "status.select": "Selecciona al menos un .mcaddon, .mcpack o .zip.", "status.filesReady": "Archivos listos. Para mejores nombres, carga juntos el Behavior Pack y el Resource Pack.", "status.analyzing": "Descomprimiendo y analizando localmente…", "status.done": "Análisis terminado: {count} archivos procesados. Ningún archivo salió de tu dispositivo.", "status.exported": "Contribución exportada con WATI Catalog Schema v1. Revisa report.json antes de enviarla.",
      "confirm.errors": "El análisis contiene {count} error(es). La contribución incluirá el reporte. ¿Deseas exportarla de todos modos?",
      "metrics.packs": "Packs", "metrics.items": "Objetos", "metrics.blocks": "Bloques", "metrics.entities": "Entidades", "metrics.recipes": "Recetas", "metrics.acquisition": "Obtenciones", "metrics.officialNames": "Nombres oficiales", "metrics.generatedNames": "Nombres generados", "metrics.manualNames": "Nombres editados", "metrics.errors": "Errores", "metrics.warnings": "Advertencias", "metrics.info": "Información",
      "pack.behavior": "Behavior", "pack.resource": "Resource", "origin.lang": "Traducción", "origin.generated": "Generado", "origin.manual": "Editado", "boolean.yes": "Sí", "boolean.no": "No",
      "generated.warning": "Se encontraron {count} nombres sin traducción detectable en {locale}. El Builder creó nombres legibles desde sus identifiers. Usa el filtro ‘Solo generados’ y edítalos directamente antes de exportar.", "generated.editAria": "Editar nombre generado de {id}",
      "type.item": "objeto", "type.block": "bloque", "type.entity": "entidad",
      "evidence.name": "Nombre", "evidence.author": "Autor", "evidence.version": "Versión pública", "evidence.license": "Licencia", "evidence.manifest": "detectado del manifest", "evidence.manual": "editado manualmente", "evidence.authorDetected": "detectado de la descripción", "evidence.authorUnknown": "no detectado", "evidence.packName": "detectada del nombre del paquete", "evidence.manifestVersion": "tomada del manifest", "evidence.licenseDetected": "Detectada en {path}", "evidence.licenseManual": "Indicada manualmente", "evidence.licenseUnknown": "No verificada",
      "lang.status": "Se exportará: {locales}. Idioma principal: {primary}. Vista previa: {preview}.",
      "issue.invalid_json": "JSON inválido: {message}", "issue.empty_optional_json_ignored": "Archivo JSON opcional vacío ignorado.", "issue.resource_pack_missing": "Solo se detectó el Behavior Pack. Añade el Resource Pack para recuperar traducciones oficiales.", "issue.behavior_pack_missing": "Solo se detectó el Resource Pack. No se pueden extraer recetas ni definiciones del Behavior Pack.", "issue.duplicate_content_equivalent": "Definición de contenido duplicada y equivalente.", "issue.duplicate_content_conflict": "Definición de contenido duplicada con diferencias.", "issue.generated_fallback_names": "{count} entradas no tienen traducción detectable en {locale}; se generaron nombres desde sus identifiers y pueden editarse antes de exportar.", "issue.missing_loot_table": "No se encontró una loot table referenciada.", "issue.duplicate_recipe_id": "Se detectó un identifier de receta duplicado.", "issue.pattern_exceeds_3x3": "La receta supera el tamaño 3×3.", "issue.trailing_spaces": "La receta contiene espacios finales invisibles.", "issue.author_not_verified": "No se pudo verificar el autor.", "issue.license_not_verified": "No se pudo verificar la licencia.", "issue.official_url_missing": "No se detectó una página oficial.", "issue.declared_pack_not_loaded": "Una dependencia declarada no fue incluida en el análisis."
    },
    en_US: {
      "page.title": "WATI Catalog Builder v1.0.0",
      "hero.description": "Analyze Minecraft Bedrock add-ons and generate normalized contributions for WATI Core.",
      "privacy.title": "Privacy:", "privacy.body": "packs are read and processed locally. This page does not upload them to any server.",
      "load.title": "1. Load package", "load.drop": "Drop .mcaddon, .mcpack or .zip files here", "load.hint": "Load the BP and RP together whenever possible for more complete results.",
      "actions.analyze": "Analyze package", "actions.reset": "Reset", "actions.export": "Export contribution ZIP",
      "identity.title": "2. Project identification", "identity.helper": "The Builder suggests these details from manifests, translations and license files. Review them before exporting.",
      "identity.publicName": "Public name", "identity.sourceId": "Source ID", "identity.author": "Author", "identity.publicVersion": "Analyzed public version", "identity.manifestVersion": "Internal manifest version", "identity.license": "License", "identity.aliases": "Comma-separated aliases", "identity.namespaces": "Detected namespaces", "identity.officialPage": "Official page",
      "placeholders.publicName": "Modern Furniture", "placeholders.sourceId": "modern_furniture", "placeholders.author": "Author or team", "placeholders.aliases": "modern, modernfurniture, furniture", "placeholders.search": "Identifier, name, type or category",
      "license.unknown": "Unknown / Not verified", "license.arr": "All Rights Reserved", "license.custom": "Custom",
      "languages.title": "Name languages", "languages.helper": "Choose which names will be saved in the contribution. Missing values are generated from the identifier and marked accordingly.", "languages.export": "Save on export", "languages.both": "Español (México) and English (US)", "languages.primary": "Primary language", "languages.preview": "Preview language",
      "results.title": "3. Results", "results.packs": "Detected packs", "results.preview": "Content preview", "results.filter": "Filter preview", "results.nameSourceFilter": "Name source", "results.issues": "Problems and warnings",
      "filter.all": "All", "filter.translated": "Translations only", "filter.generated": "Generated only", "filter.manual": "Edited only",
      "table.type": "Type", "table.name": "Name", "table.publicVersion": "Public version", "table.nameOrigin": "Name source", "table.category": "Category", "table.internal": "Internal", "table.level": "Level", "table.code": "Code", "table.description": "Description", "table.file": "File",
      "empty.start": "Analyze a package to begin.", "empty.noAnalysis": "No analysis yet.", "empty.noIssues": "No structural problems were detected.", "empty.noFilter": "No content matched this filter.",
      "scope.title": "Current scope", "scope.body": "Detects manifests, basic project identity, items, blocks, entities, Mexican Spanish and US English translations, JSON recipes and direct acquisition through block and entity loot tables. It also separates the public version from the internal manifest version, detects common licenses and warns when the Resource Pack is missing. Trades, feature rules, advanced crops and script-controlled systems still require manual review.",
      "status.ready": "WATI Catalog Builder v{version}. All analysis runs in this browser.",
      "status.select": "Select at least one .mcaddon, .mcpack or .zip file.", "status.filesReady": "Files are ready. Load the Behavior Pack and Resource Pack together for the best names.", "status.analyzing": "Extracting and analyzing locally…", "status.done": "Analysis complete: {count} files processed. No file left your device.", "status.exported": "Contribution exported with WATI Catalog Schema v1. Review report.json before submitting it.",
      "confirm.errors": "The analysis contains {count} error(s). The contribution will include the report. Export anyway?",
      "metrics.packs": "Packs", "metrics.items": "Items", "metrics.blocks": "Blocks", "metrics.entities": "Entities", "metrics.recipes": "Recipes", "metrics.acquisition": "Acquisition", "metrics.officialNames": "Official names", "metrics.generatedNames": "Generated names", "metrics.manualNames": "Edited names", "metrics.errors": "Errors", "metrics.warnings": "Warnings", "metrics.info": "Information",
      "pack.behavior": "Behavior", "pack.resource": "Resource", "origin.lang": "Translation", "origin.generated": "Generated", "origin.manual": "Edited", "boolean.yes": "Yes", "boolean.no": "No",
      "generated.warning": "{count} names have no detectable translation in {locale}. The Builder created readable names from their identifiers. Use the ‘Generated only’ filter and edit them directly before exporting.", "generated.editAria": "Edit generated name for {id}",
      "type.item": "item", "type.block": "block", "type.entity": "entity",
      "evidence.name": "Name", "evidence.author": "Author", "evidence.version": "Public version", "evidence.license": "License", "evidence.manifest": "detected from manifest", "evidence.manual": "manually edited", "evidence.authorDetected": "detected from description", "evidence.authorUnknown": "not detected", "evidence.packName": "detected from pack name", "evidence.manifestVersion": "taken from manifest", "evidence.licenseDetected": "Detected in {path}", "evidence.licenseManual": "Entered manually", "evidence.licenseUnknown": "Not verified",
      "lang.status": "Exporting: {locales}. Primary language: {primary}. Preview: {preview}.",
      "issue.invalid_json": "Invalid JSON: {message}", "issue.empty_optional_json_ignored": "Empty optional JSON file ignored.", "issue.resource_pack_missing": "Only the Behavior Pack was detected. Add the Resource Pack to recover official translations.", "issue.behavior_pack_missing": "Only the Resource Pack was detected. Behavior Pack definitions and recipes cannot be extracted.", "issue.duplicate_content_equivalent": "Equivalent duplicate content definition.", "issue.duplicate_content_conflict": "Conflicting duplicate content definition.", "issue.generated_fallback_names": "{count} entries have no detectable translation in {locale}; their names were generated from identifiers and can be edited before export.", "issue.missing_loot_table": "A referenced loot table was not found.", "issue.duplicate_recipe_id": "A duplicate recipe identifier was detected.", "issue.pattern_exceeds_3x3": "The recipe exceeds the 3×3 size.", "issue.trailing_spaces": "The recipe contains invisible trailing spaces.", "issue.author_not_verified": "The author could not be verified.", "issue.license_not_verified": "The license could not be verified.", "issue.official_url_missing": "No official page was detected.", "issue.declared_pack_not_loaded": "A declared dependency was not included in the analysis."
    }
  };

  const localeLabel = locale => locale === "es_MX" ? "Español (México)" : "English (US)";
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
    status: $("status"), summary: $("summary"), issues: $("issues"), content: $("content-preview"), packs: $("pack-preview"),
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
    el.drop.querySelector("span").textContent = `${state.files.length} ${state.uiLocale === "es_MX" ? "archivo(s)" : "file(s)"}, ${formatBytes(state.files.reduce((n, f) => n + f.size, 0))}`;
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
    return [...analysis.content.items, ...analysis.content.blocks, ...analysis.content.entities];
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
      if (count) retained.push({ severity: "warning", code: "generated_fallback_names", path: `texts/${locale}.lang`, locale, count, message: `${count} names generated from identifiers for ${locale}.` });
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

  function render() {
    const a = state.analysis, s = a.report.summary;
    const previewLocale = el.previewLocale.value;
    syncNameStats(a);
    const nameStats = s.namesByLocale?.[previewLocale] || { localized: s.localizedNames, generated: s.generatedNames, manual: s.manualNames || 0 };
    el.summary.innerHTML = [
      badge(t("metrics.packs"), s.packs, `${s.behaviorPacks} BP · ${s.resourcePacks} RP`),
      badge(t("metrics.items"), s.items), badge(t("metrics.blocks"), s.blocks), badge(t("metrics.entities"), s.entities),
      badge(t("metrics.recipes"), s.recipes), badge(t("metrics.acquisition"), s.acquisition),
      badge(t("metrics.officialNames"), nameStats.localized, localeLabel(previewLocale)),
      badge(t("metrics.generatedNames"), nameStats.generated, localeLabel(previewLocale)),
      badge(t("metrics.manualNames"), nameStats.manual || 0, localeLabel(previewLocale)),
      badge(t("metrics.errors"), s.errors), badge(t("metrics.warnings"), s.warnings), badge(t("metrics.info"), s.info)
    ].join("");

    el.issues.innerHTML = a.report.issues.length
      ? a.report.issues.slice(0, 500).map(i => `<tr><td><span class="severity ${i.severity}">${escapeHtml(i.severity)}</span></td><td>${escapeHtml(i.code)}</td><td>${escapeHtml(issueMessage(i))}</td><td><code>${escapeHtml(i.path)}</code></td></tr>`).join("")
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
      return `<tr><td>${escapeHtml(t(`type.${x.type}`))}</td><td><code>${escapeHtml(x.id)}</code></td><td>${nameCell}</td><td class="name-origin-${escapeHtml(source)}">${escapeHtml(sourceLabel)}</td><td>${escapeHtml(x.category)}</td><td>${x.internal ? t("boolean.yes") : t("boolean.no")}</td></tr>`;
    }).join("") || `<tr><td colspan="6" class="empty">${t("empty.noFilter")}</td></tr>`;

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
