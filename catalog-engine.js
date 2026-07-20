(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WatiCatalogEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "1.0.0";
  const SCHEMA_VERSION = 1;
  const textDecoder = new TextDecoder("utf-8");
  const textEncoder = new TextEncoder();

  function readU16(view, offset) { return view.getUint16(offset, true); }
  function readU32(view, offset) { return view.getUint32(offset, true); }
  function looksLikeZip(bytes) {
    return bytes && bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
      ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06));
  }
  function normalizePath(path) { return String(path || "").replace(/\\/g, "/").replace(/^\/+/, ""); }
  function basename(path) { const normalized = String(path).replace(/::/g, "/"); const i = normalized.lastIndexOf("/"); return i < 0 ? normalized : normalized.slice(i + 1); }
  function extname(path) { const name = basename(path); const i = name.lastIndexOf("."); return i < 0 ? "" : name.slice(i).toLowerCase(); }
  function stripFormatting(value) {
    return String(value || "")
      .replace(/§./g, "")
      .replace(/[\u200b-\u200d\ufeff\ue000-\uf8ff]/g, "")
      .replace(/\[\s+/g, "[")
      .replace(/\s+\]/g, "]")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  function unique(values) { return [...new Set((values || []).filter(v => v !== undefined && v !== null && v !== ""))]; }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== "function") {
      throw new Error("Este navegador no admite DecompressionStream. Usa una versión reciente de Chromium, Edge, Opera, Firefox o Safari.");
    }
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function readZip(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (!looksLikeZip(bytes)) throw new Error("El archivo no parece ser un ZIP, MCPACK o MCADDON válido.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const min = Math.max(0, bytes.length - 65557);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= min; i--) {
      if (readU32(view, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("No se encontró el directorio central del ZIP.");
    const count = readU16(view, eocd + 10);
    const centralOffset = readU32(view, eocd + 16);
    const entries = [];
    let cursor = centralOffset;
    for (let index = 0; index < count; index++) {
      if (readU32(view, cursor) !== 0x02014b50) throw new Error("Directorio central ZIP dañado.");
      const flags = readU16(view, cursor + 8);
      const method = readU16(view, cursor + 10);
      const crc = readU32(view, cursor + 16);
      const compressedSize = readU32(view, cursor + 20);
      const uncompressedSize = readU32(view, cursor + 24);
      const nameLength = readU16(view, cursor + 28);
      const extraLength = readU16(view, cursor + 30);
      const commentLength = readU16(view, cursor + 32);
      const localOffset = readU32(view, cursor + 42);
      const nameBytes = bytes.slice(cursor + 46, cursor + 46 + nameLength);
      const name = normalizePath(textDecoder.decode(nameBytes));
      cursor += 46 + nameLength + extraLength + commentLength;
      if (!name || name.endsWith("/")) continue;
      if (flags & 0x0001) throw new Error(`El archivo cifrado ${name} no es compatible.`);
      if (readU32(view, localOffset) !== 0x04034b50) throw new Error(`Cabecera local inválida: ${name}`);
      const localNameLength = readU16(view, localOffset + 26);
      const localExtraLength = readU16(view, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      let data;
      if (method === 0) data = compressed;
      else if (method === 8) data = await inflateRaw(compressed);
      else throw new Error(`Método ZIP ${method} no compatible en ${name}.`);
      if (uncompressedSize && data.length !== uncompressedSize) throw new Error(`Tamaño descomprimido inesperado en ${name}.`);
      entries.push({ name, data, crc, method, compressedSize, uncompressedSize: data.length });
    }
    return entries;
  }

  async function flattenArchives(files, options = {}) {
    const maxDepth = options.maxDepth ?? 4;
    const maxEntries = options.maxEntries ?? 50000;
    const maxUncompressedBytes = options.maxUncompressedBytes ?? 512 * 1024 * 1024;
    const result = [];
    let totalBytes = 0;
    async function visit(label, bytes, depth) {
      if (depth > maxDepth) throw new Error(`Demasiados niveles de archivos anidados en ${label}.`);
      const entries = await readZip(bytes);
      for (const entry of entries) {
        if (result.length >= maxEntries) throw new Error(`El paquete supera el límite de ${maxEntries} archivos.`);
        totalBytes += entry.data.length;
        if (totalBytes > maxUncompressedBytes) throw new Error("El contenido descomprimido supera el límite de seguridad de 512 MB.");
        const virtualPath = `${label}::${entry.name}`;
        const extension = extname(entry.name);
        if ([".zip", ".mcpack", ".mcaddon"].includes(extension) && looksLikeZip(entry.data)) await visit(virtualPath, entry.data, depth + 1);
        else result.push({ archive: label, path: entry.name, virtualPath, data: entry.data });
      }
    }
    for (const file of files) {
      const bytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
      await visit(file.name || "package.zip", bytes, 0);
    }
    return result;
  }

  function stripJsonComments(source) {
    let out = "", inString = false, escaped = false, line = false, block = false;
    for (let i = 0; i < source.length; i++) {
      const c = source[i], n = source[i + 1];
      if (line) { if (c === "\n") { line = false; out += c; } continue; }
      if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
      if (inString) {
        out += c;
        if (escaped) escaped = false;
        else if (c === "\\") escaped = true;
        else if (c === '"') inString = false;
        continue;
      }
      if (c === '"') { inString = true; out += c; continue; }
      if (c === "/" && n === "/") { line = true; i++; continue; }
      if (c === "/" && n === "*") { block = true; i++; continue; }
      out += c;
    }
    return out.replace(/,\s*([}\]])/g, "$1");
  }

  function parseJson(bytes, path, issues) {
    const text = textDecoder.decode(bytes).replace(/^\uFEFF/, "");
    if (!text.trim()) {
      const optionalPlaceholder = /(?:^|\/)(?:flipbook_textures|item_texture|terrain_texture|sound_definitions)\.json$/i.test(path);
      issues.push({
        severity: optionalPlaceholder ? "info" : "error",
        code: optionalPlaceholder ? "empty_optional_json_ignored" : "invalid_json",
        path,
        message: optionalPlaceholder ? "Archivo JSON opcional vacío ignorado." : "El archivo JSON está vacío."
      });
      return null;
    }
    try { return JSON.parse(stripJsonComments(text)); }
    catch (error) {
      issues.push({ severity: "error", code: "invalid_json", path, message: error.message });
      return null;
    }
  }

  function titleCaseId(id) {
    const value = String(id || "unknown").split(":").pop().replace(/[_./-]+/g, " ").trim();
    return value.replace(/\b\w/g, c => c.toUpperCase());
  }
  function namespaceOf(id) { return String(id || "").includes(":") ? String(id).split(":", 1)[0] : "minecraft"; }
  function ensureNamespace(id) { return id && !String(id).includes(":") ? `minecraft:${id}` : id; }
  function cleanId(id) { return typeof id === "string" ? ensureNamespace(id.trim()) : null; }

  const LEGACY_COLORS = ["white","orange","magenta","light_blue","yellow","lime","pink","gray","light_gray","cyan","purple","blue","brown","green","red","black"];
  const LEGACY_WOODS = ["oak","spruce","birch","jungle","acacia","dark_oak"];
  function normalizeLegacyDescriptor(desc) {
    if (!desc || typeof desc !== "object") return desc;
    const result = { ...desc };
    let id = cleanId(result.item || result.name);
    const data = Number.isInteger(result.data) ? result.data : Number.isInteger(result.metadata) ? result.metadata : null;
    if (!id) return result;
    const original = id;
    const base = id.replace(/^minecraft:/, "");
    if (data !== null && data >= 0 && data < 16) {
      if (base === "carpet") id = `minecraft:${LEGACY_COLORS[data]}_carpet`;
      else if (base === "wool") id = `minecraft:${LEGACY_COLORS[data]}_wool`;
      else if (base === "concrete") id = `minecraft:${LEGACY_COLORS[data]}_concrete`;
      else if (base === "concrete_powder") id = `minecraft:${LEGACY_COLORS[data]}_concrete_powder`;
      else if (base === "stained_glass") id = `minecraft:${LEGACY_COLORS[data]}_stained_glass`;
      else if (base === "stained_glass_pane") id = `minecraft:${LEGACY_COLORS[data]}_stained_glass_pane`;
    }
    if (data !== null && data >= 0 && data < LEGACY_WOODS.length) {
      if (base === "planks") id = `minecraft:${LEGACY_WOODS[data]}_planks`;
      else if (base === "wooden_slab") id = `minecraft:${LEGACY_WOODS[data]}_slab`;
      else if (base === "log") id = `minecraft:${LEGACY_WOODS[data]}_log`;
    }
    result.item = id;
    delete result.name;
    if (id !== original) result.legacy = { original, data };
    return result;
  }

  function parseLang(text) {
    const map = {};
    for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || line.startsWith("//")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).split("\t#")[0].trim();
      if (key) map[key] = stripFormatting(value);
    }
    return map;
  }

  function localizationCandidates(type, id) {
    const [ns, name] = id.split(":");
    if (type === "block") return [`tile.${ns}:${name}.name`, `tile.${ns}.${name}.name`, `block.${ns}.${name}`];
    if (type === "entity") return [`entity.${ns}:${name}.name`, `entity.${ns}.${name}.name`];
    return [`item.${ns}:${name}.name`, `item.${ns}.${name}.name`, `item.${ns}:${name}`, `item.${ns}.${name}`];
  }

  const SUPPORTED_EXPORT_LOCALES = ["es_MX", "en_US"];

  function resolveLocalized(raw, langByLocale, preferredLocale = "es_MX") {
    if (typeof raw !== "string") return raw || "";
    const order = unique([preferredLocale, ...SUPPORTED_EXPORT_LOCALES, ...Object.keys(langByLocale)]);
    for (const locale of order) {
      if (langByLocale[locale]?.[raw]) return langByLocale[locale][raw];
    }
    return raw;
  }

  function resolveEntryNameForLocale(type, id, translationKey, langByLocale, locale) {
    const candidates = [translationKey, ...localizationCandidates(type, id)].filter(Boolean);
    for (const key of candidates) {
      if (langByLocale[locale]?.[key]) {
        return { name: stripFormatting(langByLocale[locale][key]), key, locale, source: "lang" };
      }
    }
    return { name: titleCaseId(id), key: translationKey || candidates[0] || null, locale: null, source: "generated" };
  }

  function cleanPublicName(value) {
    let name = stripFormatting(value || "");
    name = name.replace(/\[(?:bp|rp)\]/ig, " ").replace(/\((?:bp|rp)\)/ig, " ");
    name = name.replace(/\b(?:behavior|behaviour|resource)\s*pack\b/ig, " ");
    name = name.replace(/\b(?:bp|rp)\b/ig, " ");
    name = name.replace(/\b(?:WE\s*)?(?:v(?:ersion)?\s*)?\d+(?:\.\d+){1,3}\b/ig, " ");
    name = name.replace(/\bWE\b/ig, " ").replace(/[|–—]+/g, " ").replace(/\s{2,}/g, " ").trim();
    name = name.replace(/\badd[- ]?on\b$/i, " ").replace(/\b(?:beta|alpha|release candidate|rc)\b$/i, " ").replace(/\s{2,}/g, " ").trim();
    return name.replace(/[-:]+$/g, "").trim() || stripFormatting(value || "Unknown Add-on");
  }

  function inferVersionCandidate(values) {
    for (const value of values.filter(Boolean)) {
      const clean = stripFormatting(value);
      const explicit = [...clean.matchAll(/(?:^|[^a-z0-9])(?:WE\s*|v(?:ersion)?\s*)(\d+(?:\.\d+){1,3})(?![\d.])/ig)];
      if (explicit.length) return explicit[explicit.length - 1][1];
      const general = [...clean.matchAll(/(?:^|[^0-9])(\d+(?:\.\d+){1,3})(?![\d.])/g)];
      if (general.length) return general[general.length - 1][1];
    }
    return null;
  }

  function slugifySourceId(value) {
    return cleanPublicName(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown_addon";
  }

  function inferAuthor(texts) {
    const patterns = [
      /(?:created|made|developed|ported|maintained)\s+by\s+([^\n\r|.;]+)/i,
      /(?:author|creator)\s*[:\-]\s*([^\n\r|.;]+)/i,
      /(?:^|\n)\s*by\s+([^\n\r|.;]+)/i
    ];
    for (const text of texts.filter(Boolean)) {
      const clean = stripFormatting(text);
      for (const pattern of patterns) {
        const match = clean.match(pattern);
        if (match?.[1]) return match[1].replace(/\s+(?:more|visit|http).*$/i, "").trim();
      }
    }
    return null;
  }

  function inferOfficialUrl(texts) {
    for (const text of texts.filter(Boolean)) {
      const match = String(text).match(/https?:\/\/[^\s)]+|www\.[^\s)]+/i);
      if (match) return match[0].startsWith("www.") ? `https://${match[0]}` : match[0];
    }
    return "";
  }

  function detectLicense(entries) {
    const candidates = entries.filter(file => /(^|\/)(license|licence|copying|notice)(\.[^/]*)?$/i.test(normalizePath(file.path || file.virtualPath)));
    for (const file of candidates) {
      const text = textDecoder.decode(file.data).replace(/^\uFEFF/, "");
      const copyrightHolder = text.match(/Copyright(?: \(c\)| ©)?\s*(?:\d{4}(?:-\d{4})?\s*)?([^\n\r]+)/i)?.[1]?.trim() || null;
      if (/MIT License/i.test(text) && /Permission is hereby granted/i.test(text)) return { value: "MIT", status: "detected", path: file.virtualPath || file.path, copyrightHolder };
      if (/Apache License/i.test(text) && /Version 2\.0/i.test(text)) return { value: "Apache-2.0", status: "detected", path: file.virtualPath || file.path, copyrightHolder };
      if (/GNU GENERAL PUBLIC LICENSE/i.test(text)) {
        const version = text.match(/Version\s+([23])/i)?.[1];
        return { value: version ? `GPL-${version}.0` : "GPL", status: "detected", path: file.virtualPath || file.path, copyrightHolder };
      }
      if (/Creative Commons/i.test(text)) return { value: "Custom", status: "detected", path: file.virtualPath || file.path, copyrightHolder };
    }
    return { value: "Unknown / Not verified", status: "not_verified", path: null, copyrightHolder: null };
  }

  function buildAliases(name, namespaces) {
    const normalized = stripFormatting(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const words = normalized.split(/[^a-z0-9]+/).filter(word => word.length >= 4 && !["addon","bedrock","unofficial","port","pack","beta","alpha"].includes(word));
    return unique([normalized.replace(/[^a-z0-9]+/g, ""), ...words, ...namespaces]);
  }

  function detectCategory(type, def, id, path) {
    const description = def?.description || {};
    const menu = description.menu_category || {};
    const components = def?.components || {};
    if (/(^|[:_/.])(dummy|internal|collision|seat|helper|controller|marker|proxy)([_/.]|$)/i.test(`${id} ${path}`)) return "internal";
    if (menu.category) return menu.category;
    if (components["minecraft:food"] || /food|meal|soup|stew|fruit|vegetable|tomato|onion|rice/.test(id)) return "food";
    if (/ore|ingot|mineral|gem/.test(id)) return "materials";
    if (/sword|dagger|bow|gun|weapon/.test(id)) return "equipment";
    if (/pickaxe|axe|shovel|hoe|tool/.test(id)) return "tools";
    if (type === "block") return "construction";
    return type === "entity" ? "entity" : "items";
  }
  function isInternal(id, path, category) { return category === "internal" || /(^|[:_/.])(dummy|internal|collision|seat|helper|controller|marker|proxy)([_/.]|$)/i.test(`${id} ${path}`); }

  function normalizeIngredient(value) {
    if (typeof value === "string") return { item: cleanId(value), count: 1 };
    if (!value || typeof value !== "object") return { unknown: true };
    if (value.item || value.name) {
      const normalized = normalizeLegacyDescriptor(value);
      return { item: normalized.item, count: value.count || 1, data: value.data, legacy: normalized.legacy || null };
    }
    if (value.tag) return { tag: String(value.tag), count: value.count || 1 };
    return { unknown: true, raw: value };
  }
  function normalizeResult(value) {
    if (typeof value === "string") return { item: cleanId(value), count: 1 };
    if (Array.isArray(value)) return value.map(normalizeResult);
    if (!value || typeof value !== "object") return null;
    const normalized = normalizeLegacyDescriptor(value);
    return { item: normalized.item || cleanId(value.item || value.name), count: value.count || 1, data: value.data, legacy: normalized.legacy || null };
  }

  function parseRecipeDocument(doc, path) {
    const known = [
      ["minecraft:recipe_shaped", "shaped"], ["minecraft:recipe_shapeless", "shapeless"],
      ["minecraft:recipe_furnace", "furnace"], ["minecraft:recipe_brewing_mix", "brewing_mix"],
      ["minecraft:recipe_brewing_container", "brewing_container"],
      ["minecraft:recipe_smithing_transform", "smithing_transform"],
      ["minecraft:recipe_smithing_trim", "smithing_trim"]
    ];
    for (const [key, type] of known) {
      const data = doc?.[key];
      if (!data) continue;
      const id = cleanId(data.description?.identifier || basename(path).replace(/\.json$/i, ""));
      const recipe = { id, type, tags: data.tags || [], sourcePath: path, warnings: [] };
      if (type === "shaped") {
        recipe.pattern = (data.pattern || []).map(row => String(row));
        recipe.key = {};
        for (const [symbol, ingredient] of Object.entries(data.key || {})) recipe.key[symbol] = normalizeIngredient(ingredient);
        const maxWidth = Math.max(0, ...recipe.pattern.map(row => row.length));
        if (recipe.pattern.length > 3 || maxWidth > 3) recipe.warnings.push("pattern_exceeds_3x3");
        if (recipe.pattern.some(row => /\s+$/.test(row))) recipe.warnings.push("trailing_spaces");
        recipe.result = normalizeResult(data.result);
      } else if (type === "shapeless") {
        recipe.ingredients = (data.ingredients || []).map(normalizeIngredient);
        recipe.result = normalizeResult(data.result);
      } else if (type === "furnace") {
        recipe.input = normalizeIngredient(data.input);
        recipe.output = normalizeResult(data.output);
      } else if (type.startsWith("brewing")) {
        recipe.input = normalizeIngredient(data.input);
        recipe.reagent = normalizeIngredient(data.reagent);
        recipe.output = normalizeResult(data.output);
      } else {
        recipe.template = normalizeIngredient(data.template);
        recipe.base = normalizeIngredient(data.base);
        recipe.addition = normalizeIngredient(data.addition);
        recipe.result = normalizeResult(data.result);
      }
      return recipe;
    }
    return null;
  }

  function walk(value, visitor, path = []) {
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, visitor, path.concat(i)));
    else if (value && typeof value === "object") {
      visitor(value, path);
      for (const [k, v] of Object.entries(value)) walk(v, visitor, path.concat(k));
    }
  }
  function lootOutputs(doc) {
    const outputs = [];
    walk(doc, obj => {
      if (typeof obj.name === "string" && (obj.type === "item" || obj.type === "minecraft:item" || obj.weight !== undefined)) {
        const id = cleanId(obj.name);
        if (id && !id.startsWith("minecraft:empty")) outputs.push({ item: id, count: obj.count || null });
      }
    });
    return [...new Map(outputs.map(o => [o.item, o])).values()];
  }

  function analyzeEntries(entries, metadata = {}) {
    const issues = [];
    const parsed = [];
    const manifests = [];
    const langByLocale = {};
    const licenseDetection = detectLicense(entries);

    for (const file of entries) {
      const path = normalizePath(file.virtualPath || file.path);
      const lower = path.toLowerCase();
      if (lower.endsWith(".lang")) {
        const locale = basename(path).replace(/\.lang$/i, "");
        langByLocale[locale] = { ...(langByLocale[locale] || {}), ...parseLang(textDecoder.decode(file.data)) };
      } else if (lower.endsWith(".json")) {
        const doc = parseJson(file.data, path, issues);
        if (doc) {
          parsed.push({ path, doc });
          if (basename(path).toLowerCase() === "manifest.json") manifests.push({ path, doc });
        }
      }
    }

    const requestedExportLocales = unique((metadata.exportLocales?.length ? metadata.exportLocales : SUPPORTED_EXPORT_LOCALES)
      .filter(locale => SUPPORTED_EXPORT_LOCALES.includes(locale)));
    const exportLocales = requestedExportLocales.length ? requestedExportLocales : ["es_MX"];
    const primaryLocale = exportLocales.includes(metadata.primaryLocale) ? metadata.primaryLocale : exportLocales[0];

    const packInfo = manifests.map(({ path, doc }) => {
      const rawName = doc.header?.name || "Unknown pack";
      const rawDescription = doc.header?.description || "";
      const name = stripFormatting(resolveLocalized(rawName, langByLocale, primaryLocale));
      const description = stripFormatting(resolveLocalized(rawDescription, langByLocale, primaryLocale));
      const manifestVersion = Array.isArray(doc.header?.version) ? doc.header.version.join(".") : String(doc.header?.version || "unknown");
      return {
        path, rawName, name, publicNameCandidate: cleanPublicName(name), description,
        uuid: doc.header?.uuid || null, version: doc.header?.version || null, manifestVersion,
        publicVersionCandidate: inferVersionCandidate([name, path]), minEngineVersion: doc.header?.min_engine_version || null,
        moduleTypes: (doc.modules || []).map(m => m.type),
        dependencies: (doc.dependencies || []).map(d => ({ uuid: d.uuid || null, moduleName: d.module_name || null, version: Array.isArray(d.version) ? d.version.join(".") : d.version || null })),
        kind: (doc.modules || []).some(m => m.type === "resources") ? "resource" : "behavior",
        metadata: doc.metadata || {}
      };
    });

    const behaviorPacks = packInfo.filter(p => p.kind === "behavior");
    const resourcePacks = packInfo.filter(p => p.kind === "resource");
    if (behaviorPacks.length && !resourcePacks.length) issues.push({ severity: "warning", code: "resource_pack_missing", path: behaviorPacks[0].path, message: "Solo se detectó el Behavior Pack. Los nombres pueden ser generados desde identifiers; añade el Resource Pack para recuperar traducciones y recursos asociados." });
    if (!behaviorPacks.length && resourcePacks.length) issues.push({ severity: "warning", code: "behavior_pack_missing", path: resourcePacks[0].path, message: "Solo se detectó el Resource Pack. No será posible extraer recetas ni definiciones del Behavior Pack." });

    const loadedUuids = new Set(packInfo.map(p => p.uuid).filter(Boolean));
    for (const pack of packInfo) {
      for (const dependency of pack.dependencies) {
        if (dependency.uuid && !loadedUuids.has(dependency.uuid)) issues.push({ severity: "info", code: "declared_pack_not_loaded", path: pack.path, message: `Dependencia por UUID no incluida en el análisis: ${dependency.uuid}` });
      }
    }

    const content = { items: [], blocks: [], entities: [] };
    const recipes = [];
    const definitions = { block: new Map(), entity: new Map() };
    const lootTables = new Map();
    const seen = new Map();
    let localizedNames = 0;
    let generatedNames = 0;
    const namesByLocale = Object.fromEntries(SUPPORTED_EXPORT_LOCALES.map(locale => [locale, { localized: 0, generated: 0, manual: 0 }]));
    const usedLocalizationKeys = Object.fromEntries(SUPPORTED_EXPORT_LOCALES.map(locale => [locale, new Set()]));

    for (const { path, doc } of parsed) {
      let def, type, id;
      if ((def = doc["minecraft:item"])) { type = "item"; id = def.description?.identifier; }
      else if ((def = doc["minecraft:block"])) { type = "block"; id = def.description?.identifier; }
      else if ((def = doc["minecraft:entity"])) { type = "entity"; id = def.description?.identifier; }
      if (type && id) {
        id = cleanId(id);
        const category = detectCategory(type, def, id, path);
        const displayName = def.components?.["minecraft:display_name"];
        const translationKey = typeof displayName === "string" ? displayName : displayName?.value || null;
        const names = {};
        const nameSources = {};
        const localizationKeys = {};
        for (const locale of SUPPORTED_EXPORT_LOCALES) {
          const resolved = resolveEntryNameForLocale(type, id, translationKey, langByLocale, locale);
          names[locale] = resolved.name;
          nameSources[locale] = resolved.source;
          localizationKeys[locale] = resolved.key;
          if (resolved.source === "lang" && resolved.key) usedLocalizationKeys[locale].add(resolved.key);
        }
        const fallbackName = names[primaryLocale] || titleCaseId(id);
        const nameSource = nameSources[primaryLocale] || "generated";
        const resolvedKey = localizationKeys[primaryLocale] || translationKey;
        const resolvedLocale = nameSource === "lang" ? primaryLocale : null;
        const entry = {
          id, type, fallbackName, names, nameSources, localizationKeys,
          localizationKey: resolvedKey, localizationLocale: resolvedLocale,
          nameSource, category, internal: isInternal(id, path, category), sourcePath: path
        };
        const key = `${type}:${id}`;
        const signature = stableStringify(def);
        if (!seen.has(key)) {
          seen.set(key, { signature, path });
          if (nameSource === "lang") localizedNames++; else generatedNames++;
          for (const locale of SUPPORTED_EXPORT_LOCALES) {
            if (nameSources[locale] === "lang") namesByLocale[locale].localized++;
            else namesByLocale[locale].generated++;
          }
          content[type === "entity" ? "entities" : `${type}s`].push(entry);
        } else {
          const previous = seen.get(key);
          const equivalent = previous.signature === signature;
          issues.push({
            severity: equivalent ? "warning" : "error",
            code: equivalent ? "duplicate_content_equivalent" : "duplicate_content_conflict",
            path,
            message: `${type} duplicado ${equivalent ? "con definición equivalente" : "con definición diferente"}: ${id}. Primera definición: ${previous.path}`
          });
        }
        if (type === "block" || type === "entity") definitions[type].set(id, { def, path });
      }
      const recipe = parseRecipeDocument(doc, path);
      if (recipe) recipes.push(recipe);
      if (/loot_tables\//i.test(path)) lootTables.set(path.split("::").pop().replace(/^.*?(loot_tables\/)/i, "$1"), doc);
    }

    for (const locale of SUPPORTED_EXPORT_LOCALES) {
      const count = namesByLocale[locale]?.generated || 0;
      if (count) issues.push({
        severity: "warning", code: "generated_fallback_names", path: `texts/${locale}.lang`, locale, count,
        message: `${count} entradas no tuvieron traducción detectable en ${locale} y usan un nombre generado desde su identifier. Estos nombres pueden revisarse y editarse antes de exportar.`
      });
    }

    const acquisition = [];
    function resolveLoot(pathValue) {
      if (!pathValue || typeof pathValue !== "string") return null;
      let p = normalizePath(pathValue).replace(/^\/?/, "");
      if (!p.endsWith(".json")) p += ".json";
      return lootTables.get(p) || [...lootTables.entries()].find(([k]) => k.endsWith(p))?.[1] || null;
    }
    for (const [id, { def, path }] of definitions.block) {
      const lootPath = def.components?.["minecraft:loot"];
      const table = resolveLoot(lootPath);
      if (lootPath && !table) issues.push({ severity: "warning", code: "missing_loot_table", path, message: `Loot table no encontrada: ${lootPath}` });
      for (const output of lootOutputs(table)) acquisition.push({ target: output.item, method: "break_block", sourceType: "block", source: id, certainty: "confirmed", details: { lootTable: lootPath, count: output.count } });
    }
    for (const [id, { def, path }] of definitions.entity) {
      const lootPath = def.components?.["minecraft:loot"]?.table || def.components?.["minecraft:loot"];
      const table = resolveLoot(lootPath);
      if (lootPath && !table) issues.push({ severity: "warning", code: "missing_loot_table", path, message: `Loot table no encontrada: ${lootPath}` });
      for (const output of lootOutputs(table)) acquisition.push({ target: output.item, method: "entity_drop", sourceType: "entity", source: id, certainty: "confirmed", details: { lootTable: lootPath, count: output.count } });
    }

    const recipeIds = new Map();
    for (const recipe of recipes) {
      if (recipeIds.has(recipe.id)) issues.push({ severity: "error", code: "duplicate_recipe_id", path: recipe.sourcePath, message: `Receta duplicada: ${recipe.id}. Primera definición: ${recipeIds.get(recipe.id)}` });
      else recipeIds.set(recipe.id, recipe.sourcePath);
      for (const warning of recipe.warnings || []) issues.push({ severity: "warning", code: warning, path: recipe.sourcePath, message: `Advertencia en receta ${recipe.id}: ${warning}` });
    }

    const namespaces = new Set();
    for (const list of Object.values(content)) for (const entry of list) namespaces.add(namespaceOf(entry.id));
    for (const recipe of recipes) namespaces.add(namespaceOf(recipe.id));
    namespaces.delete("minecraft");
    const namespaceList = [...namespaces].sort();

    const behavior = behaviorPacks[0] || packInfo[0];
    const nameCandidate = metadata.name || behavior?.publicNameCandidate || packInfo[0]?.publicNameCandidate || "Unknown Add-on";
    const publicVersion = metadata.version || behavior?.publicVersionCandidate || inferVersionCandidate(entries.map(e => e.archive)) || behavior?.manifestVersion || "unknown";
    const manifestVersion = behavior?.manifestVersion || packInfo[0]?.manifestVersion || "unknown";
    const authorFromMetadata = Array.isArray(behavior?.metadata?.authors) ? behavior.metadata.authors.join(", ") : behavior?.metadata?.authors || behavior?.metadata?.author || null;
    const descriptions = [...packInfo.map(p => p.description), ...Object.values(langByLocale).map(locale => locale["pack.description"])];
    const inferredAuthor = authorFromMetadata || inferAuthor(descriptions) || licenseDetection.copyrightHolder;
    const inferredUrl = inferOfficialUrl(descriptions);
    const sourceId = metadata.id || slugifySourceId(nameCandidate);
    const chosenLicense = metadata.license && metadata.license !== "Unknown / Not verified" ? metadata.license : licenseDetection.value;
    const licenseStatus = metadata.license && metadata.license !== "Unknown / Not verified" ? "user_provided" : licenseDetection.status;
    const aliases = metadata.aliases?.length ? metadata.aliases : buildAliases(nameCandidate, namespaceList);
    const source = {
      id: sourceId,
      name: nameCandidate,
      author: metadata.author || inferredAuthor || "Unknown",
      version: publicVersion,
      manifestVersion,
      analyzedPackVersions: packInfo.map(p => ({ kind: p.kind, name: p.name, uuid: p.uuid, manifestVersion: p.manifestVersion, publicVersionCandidate: p.publicVersionCandidate })),
      namespaces: namespaceList,
      aliases: unique(aliases),
      license: chosenLicense,
      licenseStatus,
      licenseEvidence: licenseDetection.path,
      officialUrl: metadata.officialUrl || inferredUrl,
      primaryLocale,
      exportedLocales: exportLocales,
      generatedBy: `WATI Catalog Builder ${VERSION}`
    };

    if (source.author === "Unknown") issues.push({ severity: "warning", code: "author_not_verified", path: behavior?.path || "manifest.json", message: "No se pudo determinar el autor. Verifica el campo antes de exportar." });
    if (source.license === "Unknown / Not verified") issues.push({ severity: "warning", code: "license_not_verified", path: licenseDetection.path || "LICENSE", message: "La licencia no fue detectada. Verifícala en la página oficial o en los archivos del proyecto." });
    if (!source.officialUrl) issues.push({ severity: "info", code: "official_url_missing", path: behavior?.path || "manifest.json", message: "No se detectó una página oficial. Añádela para facilitar la verificación de la contribución." });

    const report = {
      schemaVersion: SCHEMA_VERSION,
      generatorVersion: VERSION,
      summary: {
        packs: packInfo.length, behaviorPacks: behaviorPacks.length, resourcePacks: resourcePacks.length,
        files: entries.length, items: content.items.length, blocks: content.blocks.length, entities: content.entities.length,
        recipes: recipes.length, acquisition: acquisition.length, localizedNames, generatedNames, manualNames: 0, namesByLocale,
        errors: issues.filter(i => i.severity === "error").length,
        warnings: issues.filter(i => i.severity === "warning").length,
        info: issues.filter(i => i.severity === "info").length
      },
      metadataEvidence: {
        publicName: { value: nameCandidate, source: metadata.name ? "user" : "manifest" },
        author: { value: source.author, source: metadata.author ? "user" : inferredAuthor ? "detected" : "unknown" },
        publicVersion: { value: publicVersion, source: metadata.version ? "user" : behavior?.publicVersionCandidate ? "pack_name" : "manifest" },
        manifestVersion,
        license: { value: source.license, status: source.licenseStatus, path: source.licenseEvidence },
        officialUrl: { value: source.officialUrl, source: metadata.officialUrl ? "user" : inferredUrl ? "detected" : "unknown" }
      },
      packs: packInfo,
      issues
    };

    return {
      source: { schemaVersion: SCHEMA_VERSION, generator: "WATI Catalog Builder", generatorVersion: VERSION, source },
      content: { schemaVersion: SCHEMA_VERSION, sourceId, primaryLocale, exportedLocales: exportLocales, ...content },
      recipes: { schemaVersion: SCHEMA_VERSION, sourceId, recipes },
      acquisition: { schemaVersion: SCHEMA_VERSION, sourceId, coverage: "experimental:block_and_entity_loot", methods: acquisition },
      localization: {
        schemaVersion: SCHEMA_VERSION,
        sourceId,
        primaryLocale,
        includedLocales: exportLocales,
        locales: Object.fromEntries(exportLocales.map(locale => [locale, Object.fromEntries(
          [...usedLocalizationKeys[locale]].filter(key => langByLocale[locale]?.[key]).map(key => [key, langByLocale[locale][key]])
        )]))
      },
      report
    };
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function dosDateTime(date = new Date()) {
    const year = Math.max(1980, date.getFullYear());
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time, day };
  }
  function concatArrays(arrays) {
    const total = arrays.reduce((n, a) => n + a.length, 0), out = new Uint8Array(total);
    let offset = 0; for (const a of arrays) { out.set(a, offset); offset += a.length; } return out;
  }
  function writeZip(files) {
    const locals = [], centrals = [];
    let offset = 0;
    const now = dosDateTime();
    for (const file of files) {
      const name = textEncoder.encode(normalizePath(file.name));
      const data = file.data instanceof Uint8Array ? file.data : textEncoder.encode(String(file.data));
      const crc = crc32(data);
      const local = new Uint8Array(30 + name.length + data.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true); lv.setUint16(10, now.time, true); lv.setUint16(12, now.day, true);
      lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
      lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
      local.set(name, 30); local.set(data, 30 + name.length); locals.push(local);
      const central = new Uint8Array(46 + name.length); const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true); cv.setUint16(12, now.time, true); cv.setUint16(14, now.day, true);
      cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
      cv.setUint16(28, name.length, true); cv.setUint16(30, 0, true); cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true); cv.setUint16(36, 0, true); cv.setUint32(38, 0, true); cv.setUint32(42, offset, true);
      central.set(name, 46); centrals.push(central); offset += local.length;
    }
    const centralBytes = concatArrays(centrals);
    const eocd = new Uint8Array(22); const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralBytes.length, true); ev.setUint32(16, offset, true);
    return concatArrays([...locals, centralBytes, eocd]);
  }

  const CONTRIBUTION_README = `# WATI Catalog Contribution\n\nThis archive was generated locally with WATI Catalog Builder.\n\nFiles:\n- source.json: project identity, provenance and selected locales\n- content.json: normalized items, blocks and entities with per-locale names\n- recipes.json: normalized recipes\n- acquisition.json: confirmed or inferred acquisition methods\n- localization.json: only the name keys used for the selected export locales\n- report.json: warnings, errors and evidence used by the generator\n\nNames may be exported in es_MX, en_US or both. Generated names are marked in content.json and must not be mistaken for official translations. Names corrected in the Builder are marked with nameSource "manual".\n\nReview every warning before submitting this archive. Do not attach third-party add-on files to a public contribution unless you are authorized to distribute them.\n`;

  function contentForExport(content) {
    const locales = content.exportedLocales?.length ? content.exportedLocales : [content.primaryLocale || "es_MX"];
    const primaryLocale = locales.includes(content.primaryLocale) ? content.primaryLocale : locales[0];
    const filterEntry = entry => {
      const copy = { ...entry };
      copy.names = Object.fromEntries(locales.map(locale => [locale, entry.names?.[locale] || titleCaseId(entry.id)]));
      copy.nameSources = Object.fromEntries(locales.map(locale => [locale, entry.nameSources?.[locale] || "generated"]));
      copy.localizationKeys = Object.fromEntries(locales.map(locale => [locale, entry.localizationKeys?.[locale] || null]));
      copy.fallbackName = copy.names[primaryLocale];
      copy.nameSource = copy.nameSources[primaryLocale];
      copy.localizationKey = copy.localizationKeys[primaryLocale];
      copy.localizationLocale = copy.nameSource === "lang" ? primaryLocale : null;
      return copy;
    };
    return {
      ...content,
      primaryLocale,
      exportedLocales: locales,
      items: content.items.map(filterEntry),
      blocks: content.blocks.map(filterEntry),
      entities: content.entities.map(filterEntry)
    };
  }

  function exportContribution(analysis) {
    const pretty = value => JSON.stringify(value, null, 2) + "\n";
    const files = [
      { name: "CONTRIBUTION_README.md", data: CONTRIBUTION_README },
      { name: "source.json", data: pretty(analysis.source) },
      { name: "content.json", data: pretty(contentForExport(analysis.content)) },
      { name: "recipes.json", data: pretty(analysis.recipes) },
      { name: "acquisition.json", data: pretty(analysis.acquisition) },
      { name: "localization.json", data: pretty(analysis.localization) },
      { name: "report.json", data: pretty(analysis.report) }
    ];
    return writeZip(files);
  }

  return {
    VERSION, SCHEMA_VERSION, SUPPORTED_EXPORT_LOCALES, readZip, flattenArchives, analyzeEntries, exportContribution, writeZip,
    normalizeLegacyDescriptor, cleanPublicName, slugifySourceId, inferVersionCandidate, stripFormatting
  };
});
