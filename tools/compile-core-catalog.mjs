#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const engine = require('../catalog-engine.js');
const textDecoder = new TextDecoder('utf-8');

const TYPE_TO_COLLECTION = Object.freeze({
  item: 'item', block: 'block', entity: 'entity', biome: 'biome', structure: 'structure', ecosystem: 'ecosystem'
});
const COLLECTION_TO_DOCUMENT = Object.freeze({
  item: 'items', block: 'blocks', entity: 'entities', biome: 'biomes', structure: 'structures', ecosystem: 'ecosystems'
});
const RECIPE_CODES = Object.freeze({
  shaped: 's', shapeless: 'l', furnace: 'f', brewing_mix: 'b', brewing_container: 'c', smithing_transform: 't', smithing_trim: 'r'
});
const KIND_CODES = Object.freeze({ block: 'b', item: 'i', virtual: 'v' });

const VANILLA_STATIONS = Object.freeze({
  crafting_table: ['minecraft:crafting_table', 'b', 'tile.crafting_table.name', 'Crafting Table'],
  workbench: ['minecraft:crafting_table', 'b', 'tile.crafting_table.name', 'Crafting Table'],
  furnace: ['minecraft:furnace', 'b', 'tile.furnace.name', 'Furnace'],
  smoker: ['minecraft:smoker', 'b', 'tile.smoker.name', 'Smoker'],
  blast_furnace: ['minecraft:blast_furnace', 'b', 'tile.blast_furnace.name', 'Blast Furnace'],
  stonecutter: ['minecraft:stonecutter', 'b', 'tile.stonecutter.name', 'Stonecutter'],
  smithing_table: ['minecraft:smithing_table', 'b', 'tile.smithing_table.name', 'Smithing Table'],
  brewing_stand: ['minecraft:brewing_stand', 'b', 'tile.brewing_stand.name', 'Brewing Stand'],
  campfire: ['minecraft:campfire', 'b', 'tile.campfire.name', 'Campfire'],
  soul_campfire: ['minecraft:soul_campfire', 'b', 'tile.soul_campfire.name', 'Soul Campfire']
});

function usage() {
  console.log(`WATI Core Catalog Compiler v1.0.0\n\n` +
`Uso:\n` +
`  node tools/compile-core-catalog.mjs --core-bp <carpeta BP> --core-rp <carpeta RP> [opciones]\n\n` +
`Opciones:\n` +
`  --contribution <ruta>    ZIP de contribución o carpeta que contenga source.json (repetible)\n` +
`  --contributions <ruta>   Carpeta con múltiples contribuciones\n` +
`  --version <x.y.z>        Versión de Core que se escribirá en metadatos\n` +
`  --output <ruta>          Carpeta de salida; por defecto modifica las copias indicadas\n` +
`  --dry-run                Valida y genera reporte sin escribir archivos\n` +
`  --help                   Mostrar esta ayuda\n`);
}

function parseArgs(argv) {
  const args = { contribution: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--help' || token === '-h') args.help = true;
    else if (token === '--dry-run') args.dryRun = true;
    else if (token === '--contribution') args.contribution.push(argv[++i]);
    else if (token === '--contributions') args.contributions = argv[++i];
    else if (token === '--core-bp') args.coreBp = argv[++i];
    else if (token === '--core-rp') args.coreRp = argv[++i];
    else if (token === '--version') args.version = argv[++i];
    else if (token === '--output') args.output = argv[++i];
    else throw new Error(`Argumento desconocido: ${token}`);
  }
  return args;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

function jsModule(comment, exportName, value) {
  return `${comment}\nexport const ${exportName} = Object.freeze(${JSON.stringify(stable(value))});\n`;
}

function titleCase(value) {
  return String(value ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_.\/+\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, c => c.toUpperCase());
}

function splitId(typeId) {
  const i = String(typeId).indexOf(':');
  return i > 0 ? [typeId.slice(0, i), typeId.slice(i + 1)] : ['minecraft', typeId];
}

function compactEntry(entry) {
  const aliases = Array.isArray(entry.aliases) ? entry.aliases.join('|') : (typeof entry.aliases === 'string' ? entry.aliases : undefined);
  const triggers = Array.isArray(entry.discoveryHints?.suggestedTriggers)
    ? entry.discoveryHints.suggestedTriggers.join('|')
    : undefined;
  const row = [
    entry.catalogKey || (entry.type && entry.id ? `wati.content.${entry.type}.${entry.id.replace(':', '.')}` : null),
    entry.fallbackName || titleCase(splitId(entry.id)[1]),
    entry.internal === true,
    aliases || null,
    entry.category || null,
    entry.group || null,
    entry.runtimeLocalizationKey || entry.localizationKey || null,
    entry.icon?.textureKey || null,
    entry.icon?.texturePath || null,
    triggers || null
  ];
  while (row.length && (row.at(-1) === null || row.at(-1) === undefined || row.at(-1) === false)) row.pop();
  return row;
}

function encodeIngredient(value) {
  if (!value || typeof value !== 'object') return [2, value ?? null];
  if (value.item) {
    const row = [0, value.item, Number.isFinite(value.count) ? value.count : 1];
    if (Number.isInteger(value.data)) row.push(value.data);
    return row;
  }
  if (value.tag) return [1, value.tag, Number.isFinite(value.count) ? value.count : 1];
  return [2, value.raw ?? null];
}

function encodeResult(value) {
  if (!value || typeof value !== 'object' || !value.item) return null;
  const row = [value.item, Number.isFinite(value.count) ? value.count : 1];
  if (Number.isInteger(value.data)) row.push(value.data);
  return row;
}

function resultRows(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.map(encodeResult).filter(Boolean);
}

function encodeUnlockRow(row) {
  if (!row || typeof row !== 'object') return ['r', row ?? null];
  if (row.type === 'item') return ['i', row.value, Number.isFinite(row.count) ? row.count : 1];
  if (row.type === 'tag') return ['t', row.value, Number.isFinite(row.count) ? row.count : 1];
  if (row.type === 'context') return ['c', row.value];
  return ['r', row.raw ?? row.value ?? null];
}

function legacyUnlock(unlock) {
  if (!Array.isArray(unlock) || !unlock.length) return undefined;
  if (unlock.length === 1 && unlock[0]?.type === 'context') return ['c', unlock[0].value];
  const ingredients = unlock.filter(row => row?.type === 'item' || row?.type === 'tag').map(row =>
    row.type === 'item' ? [0, row.value, row.count || 1] : [1, row.value, row.count || 1]
  );
  return ingredients.length ? ['i', ingredients] : undefined;
}

function compactRecipe(recipe) {
  const code = RECIPE_CODES[recipe.type];
  if (!code) throw new Error(`Tipo de receta no compatible: ${recipe.type} (${recipe.id})`);
  let payload;
  if (recipe.type === 'shaped') {
    payload = [recipe.pattern || [], Object.entries(recipe.key || {}).map(([symbol, value]) => [symbol, encodeIngredient(value)]), resultRows(recipe.result)];
    if (recipe.assumeSymmetry !== undefined) payload.push(recipe.assumeSymmetry === true);
  } else if (recipe.type === 'shapeless') {
    payload = [(recipe.ingredients || []).map(encodeIngredient), resultRows(recipe.result)];
  } else if (recipe.type === 'furnace') {
    payload = [encodeIngredient(recipe.input), resultRows(recipe.output)];
  } else if (recipe.type === 'brewing_mix' || recipe.type === 'brewing_container') {
    payload = [encodeIngredient(recipe.input), encodeIngredient(recipe.reagent), resultRows(recipe.output)];
  } else if (recipe.type === 'smithing_transform') {
    payload = [encodeIngredient(recipe.template), encodeIngredient(recipe.base), encodeIngredient(recipe.addition), resultRows(recipe.result)];
  } else {
    payload = [encodeIngredient(recipe.template), encodeIngredient(recipe.base), encodeIngredient(recipe.addition)];
  }
  const metadata = {};
  if (recipe.group) metadata.g = recipe.group;
  if (Number.isFinite(recipe.priority)) metadata.p = recipe.priority;
  const oldUnlock = legacyUnlock(recipe.unlock);
  if (oldUnlock) metadata.u = oldUnlock;
  if (Array.isArray(recipe.unlock) && recipe.unlock.length) metadata.ul = recipe.unlock.map(encodeUnlockRow);
  if (recipe.station?.tag) metadata.st = recipe.station.tag;
  const row = [recipe.id, code, Array.isArray(recipe.tags) ? recipe.tags : [], payload];
  if (Object.keys(metadata).length) row.push(metadata);
  return row;
}

function compactStation(station) {
  return [
    station.id,
    KIND_CODES[station.kind] || 'v',
    station.resolved === true,
    station.resolvedBy || 'unknown',
    Number.isInteger(station.confidence) ? station.confidence : 0,
    station.runtimeLocalizationKey || null,
    station.catalogTranslationKey || null,
    station.fallbackName || titleCase(station.tag),
    station.contentRef?.type || null,
    station.contentRef?.id || null
  ];
}

async function importNamed(filePath, name) {
  const module = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}-${Math.random()}`);
  if (!(name in module)) throw new Error(`${filePath} no exporta ${name}.`);
  return module[name];
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function contributionFromMap(files, label) {
  const find = name => files.get(name) ?? files.get(`./${name}`);
  const required = ['source.json', 'content.json', 'recipes.json'];
  for (const name of required) if (!find(name)) throw new Error(`${label}: falta ${name}.`);
  const parse = name => find(name) ? JSON.parse(textDecoder.decode(find(name))) : undefined;
  return {
    label,
    source: parse('source.json'), content: parse('content.json'), recipes: parse('recipes.json'),
    stations: parse('stations.json'), acquisition: parse('acquisition.json'), knowledge: parse('knowledge.json'), localization: parse('localization.json'), report: parse('report.json')
  };
}

async function loadContributionFile(filePath) {
  const bytes = new Uint8Array(await fs.readFile(filePath));
  const entries = await engine.flattenArchives([{ name: path.basename(filePath), data: bytes }]);
  const maps = new Map();
  for (const entry of entries) {
    const normalized = entry.path.replace(/\\/g, '/');
    const base = path.posix.basename(normalized);
    if (!['source.json', 'content.json', 'recipes.json', 'stations.json', 'acquisition.json', 'knowledge.json', 'localization.json', 'report.json'].includes(base)) continue;
    const dir = path.posix.dirname(normalized);
    const map = maps.get(dir) ?? new Map();
    map.set(base, entry.data);
    maps.set(dir, map);
  }
  const complete = [...maps.entries()].filter(([, map]) => map.has('source.json'));
  if (!complete.length) throw new Error(`${filePath}: no contiene una contribución WATI.`);
  return complete.map(([dir, map]) => contributionFromMap(map, `${filePath}${dir === '.' ? '' : `::${dir}`}`));
}

async function loadContributionDirectory(dir) {
  const names = await fs.readdir(dir, { withFileTypes: true });
  const files = new Map();
  for (const name of ['source.json', 'content.json', 'recipes.json', 'stations.json', 'acquisition.json', 'knowledge.json', 'localization.json', 'report.json']) {
    try { files.set(name, new Uint8Array(await fs.readFile(path.join(dir, name)))); } catch {}
  }
  if (files.has('source.json')) return [contributionFromMap(files, dir)];
  const nested = [];
  for (const entry of names) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) nested.push(...await loadContributionDirectory(full));
    else if (/\.(zip|mcpack|mcaddon)$/i.test(entry.name)) nested.push(...await loadContributionFile(full));
  }
  return nested;
}

async function loadContributions(paths) {
  const all = [];
  for (const target of paths.filter(Boolean)) {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) all.push(...await loadContributionDirectory(target));
    else all.push(...await loadContributionFile(target));
  }
  return all;
}

function validateContribution(contribution) {
  const issues = [];
  const { source, content, recipes, stations, knowledge, localization } = contribution;
  if (![1, 2, 3].includes(source?.schemaVersion)) issues.push('source_schema_unsupported');
  if (source?.schemaVersion === 3 && source.format !== 'wati.catalog.source') issues.push('source_format_invalid');
  if (source?.schemaVersion === 3 && content?.schemaVersion !== 3) issues.push('content_schema_mismatch');
  if (source?.schemaVersion === 3 && recipes?.schemaVersion !== 3) issues.push('recipe_schema_mismatch');
  const sourceId = source?.source?.id || source?.id || content?.sourceId;
  if (!sourceId) issues.push('source_id_missing');
  if (content?.sourceId && sourceId && content.sourceId !== sourceId) issues.push('content_source_mismatch');
  if (recipes?.sourceId && sourceId && recipes.sourceId !== sourceId) issues.push('recipe_source_mismatch');
  if (stations?.sourceId && sourceId && stations.sourceId !== sourceId) issues.push('station_source_mismatch');
  if (knowledge?.sourceId && sourceId && knowledge.sourceId !== sourceId) issues.push('knowledge_source_mismatch');
  if (localization?.sourceId && sourceId && localization.sourceId !== sourceId) issues.push('localization_source_mismatch');
  if (issues.length) throw new Error(`${contribution.label}: ${issues.join(', ')}`);
  return sourceId;
}

function mutableClone(value) { return structuredClone(value); }

function ensureContentKinds(catalog) {
  catalog.content ||= {};
  for (const kind of Object.values(TYPE_TO_COLLECTION)) catalog.content[kind] ||= {};
}


function entryCatalogKey(row) { return Array.isArray(row) && typeof row[0] === 'string' ? row[0] : null; }
function entryFallback(row, id) { return Array.isArray(row) && typeof row[1] === 'string' ? row[1] : titleCase(splitId(id)[1]); }
function entryRuntimeKey(row) { return Array.isArray(row) && typeof row[6] === 'string' ? row[6] : null; }

function bootstrapLegacyStations(catalog, recipeCatalog, stationCatalog) {
  const suffix = new Map();
  for (const kind of ['block', 'item']) {
    for (const [id, row] of Object.entries(catalog.content?.[kind] || {})) {
      const key = splitId(id)[1];
      const rows = suffix.get(key) || [];
      rows.push({ id, kind, row });
      suffix.set(key, rows);
    }
  }
  for (const [sourceId, recipes] of Object.entries(recipeCatalog.sources || {})) {
    stationCatalog.sources[sourceId] ||= {};
    const source = catalog.sources[sourceId] || {};
    for (const recipe of recipes) {
      const code = recipe[1];
      const tags = Array.isArray(recipe[2]) ? recipe[2] : [];
      const metaTag = recipe[4]?.st;
      const tag = metaTag || tags.find(value => typeof value === 'string' && value !== 'nothing') ||
        (code === 'f' ? 'furnace' : (code === 'b' || code === 'c') ? 'brewing_stand' : (code === 't' || code === 'r') ? 'smithing_table' : null);
      if (!tag || stationCatalog.sources[sourceId][tag]) continue;
      const vanilla = VANILLA_STATIONS[tag];
      if (vanilla) {
        const [id, kindCode, runtimeKey, fallback] = vanilla;
        stationCatalog.sources[sourceId][tag] = [id, kindCode, true, 'vanilla_tag', 3, runtimeKey, `wati.station.minecraft.${tag}`, fallback, 'block', id];
        continue;
      }
      let match;
      if (String(tag).includes(':')) {
        for (const kind of ['block', 'item']) {
          if (catalog.content?.[kind]?.[tag]) { match = { id: tag, kind, row: catalog.content[kind][tag], resolvedBy: 'explicit_identifier' }; break; }
        }
      }
      if (!match) {
        for (const namespace of source.namespaces || []) {
          const id = `${namespace}:${tag}`;
          for (const kind of ['block', 'item']) {
            if (catalog.content?.[kind]?.[id]) { match = { id, kind, row: catalog.content[kind][id], resolvedBy: 'source_namespace' }; break; }
          }
          if (match) break;
        }
      }
      if (!match) {
        const matches = suffix.get(tag) || [];
        if (matches.length === 1) match = { ...matches[0], resolvedBy: 'unique_catalog_suffix', confidence: 2 };
      }
      if (match) {
        stationCatalog.sources[sourceId][tag] = [
          match.id, KIND_CODES[match.kind], true, match.resolvedBy, match.confidence || 3,
          entryRuntimeKey(match.row), entryCatalogKey(match.row) || `wati.content.${match.kind}.${match.id.replace(':', '.')}`,
          entryFallback(match.row, match.id), match.kind, match.id
        ];
      } else {
        stationCatalog.sources[sourceId][tag] = [
          `wati:station/${sourceId}/${String(tag).replace(/[^a-z0-9_.-]+/gi, '_').toLowerCase()}`,
          'v', false, (suffix.get(tag) || []).length > 1 ? 'ambiguous_catalog_suffix' : 'unregistered_tag', 0,
          null, `wati.station.${sourceId}.${String(tag).replace(/[^a-z0-9_]+/gi, '_').toLowerCase()}`, titleCase(tag), null, null
        ];
      }
    }
  }
}

function normalizeExistingSources(catalog, version) {
  for (const [sourceId, source] of Object.entries(catalog.sources || {})) {
    const namespaces = Array.isArray(source.namespaces) ? source.namespaces : [];
    source.primaryLocale ||= 'es_MX';
    source.exportedLocales ||= ['es_MX', 'en_US'];
    source.capabilities ||= {};
    source.detection ||= {
      mode: sourceId === 'wati' ? 'core' : (Object.values(source.contentCounts || {}).some(Boolean) ? 'content' : (namespaces.length ? 'namespace' : 'manual')),
      namespaces,
      probes: [],
      hiddenByDefault: sourceId === 'alexs_mobs'
    };
    source.compiledWith = { compiler: 'WATI Core Catalog Compiler', compilerVersion: '1.0.0', coreVersion: version };
  }
}

function mergeSource(catalog, sourceDoc, sourceId, version) {
  const incoming = sourceDoc.source || sourceDoc;
  const previous = catalog.sources[sourceId] || {};
  const namespaces = [...new Set([...(incoming.namespaces || []), ...(previous.namespaces || [])])];
  catalog.sources[sourceId] = {
    ...previous,
    name: incoming.name || previous.name || titleCase(sourceId),
    author: incoming.author || previous.author,
    aliases: [...new Set([...(incoming.aliases || []), ...(previous.aliases || [])])],
    namespaces,
    packUuid: incoming.packUuid || incoming.behaviorPackUuid || previous.packUuid || null,
    version: incoming.version || previous.version || null,
    manifestVersion: incoming.manifestVersion || previous.manifestVersion,
    minEngineVersion: incoming.minEngineVersion || previous.minEngineVersion,
    localizationPolicy: incoming.localizationPolicy || previous.localizationPolicy || 'hybrid',
    primaryLocale: incoming.primaryLocale || previous.primaryLocale || 'es_MX',
    exportedLocales: incoming.exportedLocales || previous.exportedLocales || ['es_MX'],
    capabilities: incoming.capabilities || previous.capabilities || {},
    detection: incoming.detection || previous.detection || {
      mode: sourceId === 'wati' ? 'core' : 'content', namespaces, probes: [], hiddenByDefault: false
    },
    generatedWith: incoming.generatedWith || previous.generatedWith,
    compiledWith: { compiler: 'WATI Core Catalog Compiler', compilerVersion: '1.0.0', coreVersion: version }
  };
  for (const namespace of namespaces) {
    catalog.namespaceSources[namespace] = sourceId;
    catalog.addons[namespace] = catalog.sources[sourceId].name;
  }
}

function mergeContent(catalog, contentDoc, sourceId) {
  ensureContentKinds(catalog);
  for (const [type, collection] of Object.entries(COLLECTION_TO_DOCUMENT)) {
    for (const entry of contentDoc?.[collection] || []) {
      const id = entry.id;
      if (!id) continue;
      catalog.content[type][id] = compactEntry({ ...entry, sourceId });
      const [namespace] = splitId(id);
      if (!catalog.namespaceSources[namespace]) catalog.namespaceSources[namespace] = sourceId;
      if (!catalog.addons[namespace]) catalog.addons[namespace] = catalog.sources[sourceId]?.name || titleCase(sourceId);
    }
  }
}

function mergeRecipes(recipeCatalog, recipeDoc, sourceId) {
  const previous = new Map((recipeCatalog.sources[sourceId] || []).map(row => [row[0], row]));
  for (const recipe of recipeDoc?.recipes || []) previous.set(recipe.id, compactRecipe({ ...recipe, sourceId }));
  recipeCatalog.sources[sourceId] = [...previous.values()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
}

function mergeStations(stationCatalog, stationDoc, sourceId) {
  stationCatalog.sources[sourceId] ||= {};
  for (const station of stationDoc?.stations || []) {
    if (!station.tag) continue;
    stationCatalog.sources[sourceId][station.tag] = compactStation({ ...station, sourceId });
  }
}

function mergeAcquisition(acquisition, acquisitionDoc) {
  for (const method of acquisitionDoc?.methods || []) {
    const output = method.target || method.output?.id || method.result?.id || method.item || method.id;
    if (!output) continue;
    const rows = acquisition[output] ||= [];
    const normalized = {
      id: method.id || null,
      type: method.type || method.method || 'unknown',
      sourceId: acquisitionDoc.sourceId,
      sourceType: method.sourceType || null,
      input: method.input || method.source || null,
      certainty: method.certainty || null,
      availability: method.availability || null,
      quantity: method.quantity || null,
      chance: method.chance || null,
      conditions: method.conditions || [],
      details: method.details || null,
      evidence: method.evidence || null
    };
    if (!rows.some(row => JSON.stringify(row) === JSON.stringify(normalized))) rows.push(normalized);
  }
}

function mergeKnowledge(knowledgeCatalog, knowledgeDoc, sourceId) {
  if (!knowledgeDoc) return;
  knowledgeCatalog.schema = 1;
  knowledgeCatalog.sources ||= {};
  knowledgeCatalog.entryProfiles ||= {};
  knowledgeCatalog.lootProfiles ||= [];
  knowledgeCatalog.habitats ||= [];
  knowledgeCatalog.worldGeneration ||= [];
  knowledgeCatalog.structures ||= [];
  knowledgeCatalog.sources[sourceId] = {
    coverage: knowledgeDoc.coverage || {},
    notes: knowledgeDoc.notes || []
  };
  for (const [entryId, profile] of Object.entries(knowledgeDoc.entryProfiles || {})) {
    const current = knowledgeCatalog.entryProfiles[entryId] ||= { sources: {} };
    current.sources ||= {};
    current.sources[sourceId] = profile;
  }
  const mergeRows = (target, rows) => {
    for (const row of rows || []) {
      const normalized = { ...row, sourceId };
      if (!target.some(existing => JSON.stringify(existing) === JSON.stringify(normalized))) target.push(normalized);
    }
  };
  mergeRows(knowledgeCatalog.lootProfiles, knowledgeDoc.lootProfiles);
  mergeRows(knowledgeCatalog.habitats, knowledgeDoc.habitats);
  mergeRows(knowledgeCatalog.worldGeneration, knowledgeDoc.worldGeneration);
  mergeRows(knowledgeCatalog.structures, knowledgeDoc.structures);
}

function sourceCounts(catalog, recipeCatalog, sourceId) {
  const contentCounts = {};
  for (const kind of ['item', 'block', 'entity', 'biome', 'structure', 'ecosystem']) {
    contentCounts[kind] = Object.keys(catalog.content[kind] || {}).filter(id => {
      const [namespace] = splitId(id);
      return catalog.namespaceSources[namespace] === sourceId;
    }).length;
  }
  catalog.sources[sourceId].contentCounts = contentCounts;
  catalog.sources[sourceId].recipeCount = recipeCatalog.sources[sourceId]?.length || 0;
}

function parseLang(text) {
  const map = new Map();
  for (const raw of String(text).replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    const i = raw.indexOf('=');
    if (i > 0) map.set(raw.slice(0, i).trim(), raw.slice(i + 1));
  }
  return map;
}

function serializeLang(map) {
  return [...map.entries()].map(([key, value]) => `${key}=${value}`).join('\n') + '\n';
}

async function mergeLocalization(coreRp, contributions, dryRun) {
  const changes = {};
  for (const locale of ['es_MX', 'en_US']) {
    const file = path.join(coreRp, 'texts', `${locale}.lang`);
    let current = '';
    try { current = await fs.readFile(file, 'utf8'); } catch {}
    const map = parseLang(current);
    let added = 0, updated = 0;
    for (const contribution of contributions) {
      const rows = contribution.localization?.locales?.[locale] || {};
      for (const [key, value] of Object.entries(rows)) {
        if (!map.has(key)) added++;
        else if (map.get(key) !== value) updated++;
        map.set(key, value);
      }
      for (const station of contribution.stations?.stations || []) {
        const key = station.catalogTranslationKey;
        const value = station.names?.[locale];
        if (!key || !value) continue;
        if (!map.has(key)) added++;
        else if (map.get(key) !== value) updated++;
        map.set(key, value);
      }
    }
    changes[locale] = { added, updated, total: map.size };
    if (!dryRun) await fs.writeFile(file, serializeLang(map), 'utf8');
  }
  return changes;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return; }
  if (!args.coreBp || !args.coreRp) throw new Error('--core-bp y --core-rp son obligatorios.');
  const version = args.version || 'development';
  const outputRoot = args.output ? path.resolve(args.output) : null;
  let coreBp = path.resolve(args.coreBp);
  let coreRp = path.resolve(args.coreRp);
  if (outputRoot) {
    await fs.rm(outputRoot, { recursive: true, force: true });
    await fs.mkdir(outputRoot, { recursive: true });
    const outputBp = path.join(outputRoot, 'BP');
    const outputRp = path.join(outputRoot, 'RP');
    await fs.cp(coreBp, outputBp, { recursive: true });
    await fs.cp(coreRp, outputRp, { recursive: true });
    coreBp = outputBp; coreRp = outputRp;
  }

  const contributionPaths = [...args.contribution];
  if (args.contributions) contributionPaths.push(args.contributions);
  const contributions = await loadContributions(contributionPaths);
  const validated = contributions.map(contribution => ({ contribution, sourceId: validateContribution(contribution) }));

  const catalog = mutableClone(await importNamed(path.join(coreBp, 'scripts', 'catalog_data.js'), 'CATALOG'));
  const recipes = mutableClone(await importNamed(path.join(coreBp, 'scripts', 'recipe_data.js'), 'RECIPE_CATALOG'));
  const acquisition = mutableClone(await importNamed(path.join(coreBp, 'scripts', 'acquisition_data.js'), 'ACQUISITION_DATA'));
  let knowledge;
  try { knowledge = mutableClone(await importNamed(path.join(coreBp, 'scripts', 'knowledge_data.js'), 'KNOWLEDGE_DATA')); }
  catch { knowledge = { schema: 1, sources: {}, entryProfiles: {}, lootProfiles: [], habitats: [], worldGeneration: [], structures: [] }; }
  let stations;
  try { stations = mutableClone(await importNamed(path.join(coreBp, 'scripts', 'stations_data.js'), 'STATION_CATALOG')); }
  catch { stations = { schema: 3, sources: {} }; }

  catalog.schema = 3;
  catalog.compiler = { name: 'WATI Core Catalog Compiler', version: '1.0.0', coreVersion: version, contributionSchema: 3 };
  catalog.entryKinds = ['item', 'block', 'entity', 'biome', 'structure', 'ecosystem'];
  catalog.namespaceSources ||= {};
  catalog.addons ||= {};
  catalog.sources ||= {};
  ensureContentKinds(catalog);
  recipes.schema = 3;
  recipes.compiler = { name: 'WATI Core Catalog Compiler', version: '1.0.0', coreVersion: version };
  recipes.sources ||= {};
  stations.schema = 3;
  stations.compiler = { name: 'WATI Core Catalog Compiler', version: '1.0.0', coreVersion: version };
  stations.sources ||= {};
  normalizeExistingSources(catalog, version);
  bootstrapLegacyStations(catalog, recipes, stations);

  for (const { contribution, sourceId } of validated) {
    mergeSource(catalog, contribution.source, sourceId, version);
    mergeContent(catalog, contribution.content, sourceId);
    mergeRecipes(recipes, contribution.recipes, sourceId);
    mergeStations(stations, contribution.stations, sourceId);
    mergeAcquisition(acquisition, contribution.acquisition);
    mergeKnowledge(knowledge, contribution.knowledge, sourceId);
  }
  for (const sourceId of Object.keys(catalog.sources)) sourceCounts(catalog, recipes, sourceId);

  const localizationChanges = await mergeLocalization(coreRp, contributions, args.dryRun);
  const report = {
    compiler: 'WATI Core Catalog Compiler', compilerVersion: '1.0.0', coreVersion: version,
    dryRun: Boolean(args.dryRun), contributionCount: contributions.length,
    sources: validated.map(({ contribution, sourceId }) => ({ sourceId, label: contribution.label, schemaVersion: contribution.source.schemaVersion })),
    counts: {
      sources: Object.keys(catalog.sources).length,
      content: Object.fromEntries(Object.entries(catalog.content).map(([kind, rows]) => [kind, Object.keys(rows).length])),
      recipes: Object.values(recipes.sources).reduce((sum, rows) => sum + rows.length, 0),
      stations: Object.values(stations.sources).reduce((sum, rows) => sum + Object.keys(rows).length, 0),
      acquisitionEntries: Object.keys(acquisition).length,
      knowledgeProfiles: Object.keys(knowledge.entryProfiles || {}).length,
      lootProfiles: (knowledge.lootProfiles || []).length,
      habitats: (knowledge.habitats || []).length,
      worldGeneration: (knowledge.worldGeneration || []).length,
      knowledgeStructures: (knowledge.structures || []).length
    },
    localizationChanges
  };

  if (!args.dryRun) {
    const scripts = path.join(coreBp, 'scripts');
    await fs.writeFile(path.join(scripts, 'catalog_data.js'), jsModule(`// Generated for WATI Core v${version}. Edit contributions or rebuild; do not hand-edit this file.`, 'CATALOG', catalog));
    await fs.writeFile(path.join(scripts, 'recipe_data.js'), jsModule(`// Generated for WATI Core v${version}. Edit contributions or rebuild; do not hand-edit this file.`, 'RECIPE_CATALOG', recipes));
    await fs.writeFile(path.join(scripts, 'stations_data.js'), jsModule(`// Generated for WATI Core v${version}. Edit contributions or rebuild; do not hand-edit this file.`, 'STATION_CATALOG', stations));
    await fs.writeFile(path.join(scripts, 'acquisition_data.js'), jsModule(`// Generated for WATI Core v${version}. Edit contributions or rebuild; do not hand-edit this file.`, 'ACQUISITION_DATA', acquisition));
    await fs.writeFile(path.join(scripts, 'knowledge_data.js'), jsModule(`// Generated for WATI Core v${version}. Future Codex knowledge; safe to ignore until imported by Core.`, 'KNOWLEDGE_DATA', knowledge));
    await fs.writeFile(path.join(coreBp, 'CATALOG_BUILD_REPORT.json'), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  console.error(`[WATI Compiler] ${error.stack || error.message || error}`);
  process.exitCode = 1;
});
