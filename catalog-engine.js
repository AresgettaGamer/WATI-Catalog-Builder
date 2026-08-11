(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WatiCatalogEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "1.2.1";
  const RELEASE_CHANNEL = "stable";
  const SCHEMA_VERSION = 3;
  const RECIPE_SCHEMA_VERSION = 3;
  const ACQUISITION_SCHEMA_VERSION = 2;
  const KNOWLEDGE_SCHEMA_VERSION = 1;
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


  const ES_GENERATED_HEADS = Object.freeze({
    bottle:["Botella","f"], boots:["Botas","fp"], chestplate:["Peto","m"], helmet:["Casco","m"], leggings:["Pantalones","mp"],
    heart:["Corazón","m"], axe:["Hacha","f"], hoe:["Azada","f"], pickaxe:["Pico","m"], shovel:["Pala","f"], spear:["Lanza","f"], sword:["Espada","f"], blade:["Hoja","f"],
    star:["Estrella","f"], orb:["Orbe","m"], socks:["Calcetines","mp"], cloak:["Capa","f"], quiver:["Carcaj","m"], pendant:["Colgante","m"], ring:["Anillo","m"],
    firework:["Fuego artificial","m"], crystal:["Cristal","m"], shield:["Escudo","m"], vial:["Vial","m"], rod:["Vara","f"], totem:["Tótem","m"], magnet:["Imán","m"], portal:["Portal","m"],
    scroll:["Pergamino","m"], arrow:["Flecha","f"], door:["Puerta","f"], scarecrow:["Espantapájaros","m"], torch:["Antorcha","f"], plant:["Planta","f"], vines:["Enredaderas","fp"],
    hammer:["Martillo","m"], loot:["Botín","m"], bush:["Arbusto","m"], blossom:["Flor","f"], grass:["Hierba","f"], potion:["Poción","f"], runestone:["Piedra rúnica","f"],
    sign:["Letrero","m"], button:["Botón","m"], egg:["Huevo","m"], eggs:["Huevos","mp"], brick:["Ladrillo","m"], bricks:["Ladrillos","mp"], pillar:["Pilar","m"], wall:["Muro","m"],
    slab:["Losa","f"], stairs:["Escaleras","fp"], fence:["Valla","f"], gate:["Puerta de valla","f"], table:["Mesa","f"], block:["Bloque","m"], ore:["Mena","f"], ingot:["Lingote","m"],
    nugget:["Pepita","f"], dust:["Polvo","m"], book:["Libro","m"], catalyst:["Catalizador","m"], chest:["Cofre","m"], sapling:["Retoño","m"], seed:["Semilla","f"], seeds:["Semillas","fp"],
    mushroom:["Hongo","m"], leaf:["Hoja","f"], leaves:["Hojas","fp"], juice:["Jugo","m"], armor:["Armadura","f"], tool:["Herramienta","f"], head:["Cabeza","f"],
    skull:["Cráneo","m"], shell:["Caparazón","m"], fragment:["Fragmento","m"], essence:["Esencia","f"], cloth:["Tela","f"], key:["Llave","f"], compass:["Brújula","f"], gravel:["Grava","f"], sand:["Arena","f"], dirt:["Tierra","f"], soil:["Tierra","f"], stone:["Piedra","f"], cobblestone:["Adoquín","m"],
    planks:["Tablones","mp"], log:["Tronco","m"], wood:["Madera","f"], trapdoor:["Trampilla","f"], plate:["Placa","f"], carpet:["Alfombra","f"], wool:["Lana","f"],
    concrete:["Concreto","m"], terracotta:["Terracota","f"], lantern:["Linterna","f"], lamp:["Lámpara","f"], flower:["Flor","f"], stem:["Tallo","m"], fungus:["Hongo","m"], vine:["Enredadera","f"],
    glass:["Vidrio","m"], pane:["Panel","m"], bed:["Cama","f"], barrel:["Barril","m"], bookshelf:["Estantería","f"], bowl:["Tazón","m"], table:["Mesa","f"],
    bladrillos:["Ladrillos","mp"], torchflower:["Flor antorcha","f"]
  });
  const ES_GENERATED_WORDS = Object.freeze({
    allay:"Allay", void:"el vacío", light:"luz", crab:"cangrejo", dragon:"dragón", xp:"XP", battle:"batalla", cry:"grito", chorus:"chorus", purpur:"púrpura", end:"End",
    explorer:"explorador", atlantis:"Atlantis", infinity:"infinito", knowledge:"conocimiento", tool:"herramienta", soul:"alma", fire:"fuego", blaze:"blaze", magma:"magma", cloud:"nube",
    sculk:"sculk", blood:"sangre", bile:"bilis", pulse:"pulso", netherite:"netherita", mushroom:"hongo", soulbound:"alma vinculada", hunger:"hambre", haste:"celeridad",
    levitation:"levitación", teleportation:"teletransportación", blue:"azul", red:"rojo", white:"blanco", black:"negro", gray:"gris", light_blue:"azul claro", purple:"morado", pink:"rosa",
    green:"verde", yellow:"amarillo", orange:"naranja", brown:"marrón", marron:"marrón", cyan:"cian", lime:"verde lima", magenta:"magenta", andesite:"andesita", diorite:"diorita", granite:"granito",
    limestone:"caliza", shale:"lutita", travertine:"travertino", calcite:"calcita", sandstone:"arenisca", snow:"nieve", ice:"hielo", copper:"cobre", iron:"hierro", gold:"oro",
    golden:"oro", diamond:"diamante", nickel:"níquel", platinum:"platino", tin:"estaño", ruby:"rubí", sulfur:"azufre", volcano:"volcán", stone:"piedra", blackstone:"piedra negra",
    nether:"Nether", warped:"distorsionado", crimson:"carmesí", shulk:"shulk", tall:"alto", small:"pequeño", stage:"etapa", no:"sin", ball:"bola", blank:"en blanco", restoration:"restauración",
    deterioration:"deterioro", deprivation:"privación", division:"división", unification:"unificación", restful:"reposo", long:"larga duración", throwing:"arrojadiza", lingering:"persistente",
    incendiary:"incendiaria", artifact:"artefacto", artifacts:"artefactos", boss:"jefe", spawner:"generador", direction:"dirección", direction_sign:"señal de dirección", old:"antiguo", training:"entrenamiento"
  });
  const ES_GENERATED_ADJECTIVES = Object.freeze({
    magic:["mágico","mágica","mágicos","mágicas"], corrupted:["corrupto","corrupta","corruptos","corruptas"], explosive:["explosivo","explosiva","explosivos","explosivas"],
    magnetic:["magnético","magnética","magnéticos","magnéticas"], golden:["dorado","dorada","dorados","doradas"], bloody:["sangriento","sangrienta","sangrientos","sangrientas"],
    pure:["puro","pura","puros","puras"], vampiric:["vampírico","vampírica","vampíricos","vampíricas"], heavy:["pesado","pesada","pesados","pesadas"], double:["doble","doble","dobles","dobles"],
    mixed:["mezclado","mezclada","mezclados","mezcladas"], sharper:["más afilado","más afilada","más afilados","más afiladas"], charged:["cargado","cargada","cargados","cargadas"],
    crushing:["aplastante","aplastante","aplastantes","aplastantes"], supersonic:["supersónico","supersónica","supersónicos","supersónicas"], climbing:["trepador","trepadora","trepadores","trepadoras"],
    frozen:["helado","helada","helados","heladas"], luminescent:["luminiscente","luminiscente","luminiscentes","luminiscentes"], suspicious:["sospechoso","sospechosa","sospechosos","sospechosas"],
    sus:["sospechoso","sospechosa","sospechosos","sospechosas"], chiseled:["cincelado","cincelada","cincelados","cinceladas"], cracked:["agrietado","agrietada","agrietados","agrietadas"],
    polished:["pulido","pulida","pulidos","pulidas"], mossy:["musgoso","musgosa","musgosos","musgosas"], molten:["fundido","fundida","fundidos","fundidas"], smooth:["liso","lisa","lisos","lisas"],
    blue:["azul","azul","azules","azules"], red:["rojo","roja","rojos","rojas"], white:["blanco","blanca","blancos","blancas"], blanco:["blanco","blanca","blancos","blancas"], black:["negro","negra","negros","negras"],
    purple:["morado","morada","morados","moradas"], pink:["rosa","rosa","rosas","rosas"], green:["verde","verde","verdes","verdes"], yellow:["amarillo","amarilla","amarillos","amarillas"], brown:["marrón","marrón","marrones","marrones"], marron:["marrón","marrón","marrones","marrones"], gray:["gris","gris","grises","grises"],
    old:["antiguo","antigua","antiguos","antiguas"], long:["largo","larga","largos","largas"], small:["pequeño","pequeña","pequeños","pequeñas"], tall:["alto","alta","altos","altas"]
  });

  function idWords(id) {
    return String(id || "unknown").split(":").pop().replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase().split(/[_./-]+/).filter(Boolean);
  }
  function esAdjective(word, gender) {
    const forms = ES_GENERATED_ADJECTIVES[word];
    if (!forms) return null;
    return forms[gender === "f" ? 1 : gender === "mp" ? 2 : gender === "fp" ? 3 : 0];
  }
  function spanishDe(value) {
    if (/^el\s+/i.test(value)) return `del ${value.replace(/^el\s+/i, "")}`;
    return `de ${value}`;
  }
  const ES_GENERATED_EXACT = Object.freeze({
    battle_cry_orb: "Orbe de grito de batalla",
    ring_of_infinity: "Anillo del infinito",
    golden_ring_of_atlantis: "Anillo dorado de Atlantis",
    ring_of_atlantis: "Anillo de Atlantis",
    mixed_bottle_heart: "Corazón de botella mezclada"
  });
  function generatedSpanishName(id) {
    const rawId = String(id || "unknown").split(":").pop().toLowerCase();
    if (ES_GENERATED_EXACT[rawId]) return ES_GENERATED_EXACT[rawId];
    const tokens = idWords(id);
    if (!tokens.length) return "Desconocido";
    let headIndex = -1;
    for (let i = tokens.length - 1; i >= 0; i--) if (ES_GENERATED_HEADS[tokens[i]]) { headIndex = i; break; }
    let dynamicHead = null;
    if (headIndex < 0) {
      headIndex = tokens.findIndex(token => !ES_GENERATED_WORDS[token] && !ES_GENERATED_ADJECTIVES[token] && !/^(?:of|the|and|no|stage\d+|\d+)$/.test(token));
      if (headIndex >= 0) {
        const raw = tokens[headIndex].replace(/^([a-z]+)(\d+)$/, "$1 $2");
        dynamicHead = [raw.charAt(0).toUpperCase() + raw.slice(1), "m"];
      }
    }
    if (headIndex < 0) {
      const words = tokens.map(token => ES_GENERATED_WORDS[token] || esAdjective(token, "m") || token.replace(/^stage(\d+)$/, "etapa $1").replace(/^([a-z]+)(\d+)$/, "$1 $2"));
      const value = words.join(" ").replace(/\bbladrillos\b/i, "ladrillos");
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    const [head, gender] = dynamicHead || ES_GENERATED_HEADS[tokens[headIndex]];
    const adjectives = [];
    const complements = [];
    const suffixes = [];
    for (let i = 0; i < tokens.length; i++) {
      if (i === headIndex || tokens[i] === "of" || tokens[i] === "the" || tokens[i] === "and") continue;
      const token = tokens[i];
      const stage = token.match(/^stage(\d+)$/);
      if (stage) { suffixes.push(`etapa ${stage[1]}`); continue; }
      if (/^\d+$/.test(token)) { suffixes.push(token); continue; }
      const adjective = esAdjective(token, gender);
      if (adjective) { adjectives.push(adjective); continue; }
      let value = ES_GENERATED_WORDS[token] || ES_GENERATED_HEADS[token]?.[0]?.toLowerCase() || token.replace(/^([a-z]+)(\d+)$/, "$1 $2");
      if (!ES_GENERATED_WORDS[token]) value = value.charAt(0).toUpperCase() + value.slice(1);
      complements.push(value);
    }
    let result = head;
    if (adjectives.length) result += ` ${adjectives.join(" ")}`;
    for (const value of complements) result += ` ${spanishDe(value)}`;
    if (suffixes.length) result += `, ${suffixes.join(" ")}`;
    return result;
  }
  function generatedNameForLocale(id, locale) { return locale === "es_MX" ? generatedSpanishName(id) : titleCaseId(id); }
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
    if (type === "biome") return [`biome.${ns}:${name}.name`, `biome.${ns}.${name}.name`, `biome.${name}.name`];
    if (type === "structure") return [`structure.${ns}:${name}.name`, `structure.${ns}.${name}.name`, `structure.${name}.name`];
    if (type === "ecosystem") return [`ecosystem.${ns}:${name}.name`, `ecosystem.${ns}.${name}.name`];
    return [`item.${ns}:${name}.name`, `item.${ns}.${name}.name`, `item.${ns}:${name}`, `item.${ns}.${name}`];
  }


  function catalogTranslationKey(type, id) {
    const [ns, name] = String(id || "unknown:unknown").split(":");
    return `wati.content.${type}.${ns}.${name}`;
  }

  function firstTexturePath(value) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = firstTexturePath(item);
        if (found) return found;
      }
    }
    if (value && typeof value === "object") {
      for (const key of ["default", "textures", "texture", "path"]) {
        const found = firstTexturePath(value[key]);
        if (found) return found;
      }
    }
    return null;
  }

  function buildResourceIndexes(parsed) {
    const itemTextures = new Map();
    const terrainTextures = new Map();
    const clientBlocks = new Map();
    for (const { path, doc } of parsed) {
      const name = basename(path).toLowerCase();
      if (name === "item_texture.json") {
        for (const [key, descriptor] of Object.entries(doc.texture_data || {})) {
          const texturePath = firstTexturePath(descriptor);
          if (texturePath) itemTextures.set(key, texturePath);
        }
      } else if (name === "terrain_texture.json") {
        for (const [key, descriptor] of Object.entries(doc.texture_data || {})) {
          const texturePath = firstTexturePath(descriptor);
          if (texturePath) terrainTextures.set(key, texturePath);
        }
      } else if (name === "blocks.json" && doc && typeof doc === "object") {
        for (const [key, descriptor] of Object.entries(doc)) {
          if (key === "format_version" || !descriptor || typeof descriptor !== "object") continue;
          clientBlocks.set(cleanId(key), descriptor);
        }
      }
    }
    return { itemTextures, terrainTextures, clientBlocks };
  }

  function extractEntryIcon(type, id, def, resourceIndexes) {
    let textureKey = null;
    let texturePath = null;
    let resolvedBy = null;
    if (type === "item") {
      const icon = def?.components?.["minecraft:icon"];
      if (typeof icon === "string") textureKey = icon;
      else textureKey = firstTexturePath(icon?.textures) || icon?.texture || icon?.value || null;
      if (textureKey) {
        texturePath = resourceIndexes.itemTextures.get(textureKey) || null;
        resolvedBy = texturePath ? "item_component_and_atlas" : "item_component";
      }
    } else if (type === "block") {
      const client = resourceIndexes.clientBlocks.get(id) || resourceIndexes.clientBlocks.get(id.split(":").pop());
      const clientTexture = client?.textures;
      textureKey = typeof clientTexture === "string" ? clientTexture : firstTexturePath(clientTexture);
      if (!textureKey) {
        const instances = def?.components?.["minecraft:material_instances"];
        if (instances && typeof instances === "object") {
          for (const descriptor of Object.values(instances)) {
            if (descriptor && typeof descriptor === "object" && typeof descriptor.texture === "string") {
              textureKey = descriptor.texture;
              break;
            }
          }
        }
      }
      if (textureKey) {
        texturePath = resourceIndexes.terrainTextures.get(textureKey) || resourceIndexes.itemTextures.get(textureKey) || null;
        resolvedBy = texturePath ? "block_definition_and_atlas" : "block_definition";
      }
    }
    if (!textureKey && !texturePath) return null;
    return {
      textureKey,
      texturePath,
      resolvedBy,
      confidence: texturePath ? 3 : 1,
      duplicatedInContribution: false
    };
  }

  function discoveryHintsFor(type) {
    if (type === "item") return { suggestedTriggers: ["obtain", "craft"], source: "generator_default" };
    if (type === "block") return { suggestedTriggers: ["observe", "interact", "break"], source: "generator_default" };
    if (type === "entity") return { suggestedTriggers: ["observe", "interact"], source: "generator_default" };
    return { suggestedTriggers: ["observe"], source: "generator_default" };
  }

  function normalizeUnlock(raw) {
    if (raw === undefined || raw === null) return [];
    const rows = Array.isArray(raw) ? raw : [raw];
    const result = [];
    for (const row of rows) {
      if (typeof row === "string") {
        result.push({ type: "context", value: row });
        continue;
      }
      if (!row || typeof row !== "object") continue;
      if (row.item || row.name) result.push({ type: "item", value: cleanId(row.item || row.name), count: row.count || 1 });
      else if (row.tag) result.push({ type: "tag", value: String(row.tag), count: row.count || 1 });
      else if (row.context) result.push({ type: "context", value: String(row.context) });
      else result.push({ type: "unknown", raw: row });
    }
    return result;
  }

  const VANILLA_STATIONS = Object.freeze({
    crafting_table: { id: "minecraft:crafting_table", key: "tile.crafting_table.name", names: { es_MX: "Mesa de trabajo", en_US: "Crafting Table" } },
    workbench: { id: "minecraft:crafting_table", key: "tile.crafting_table.name", names: { es_MX: "Mesa de trabajo", en_US: "Crafting Table" } },
    furnace: { id: "minecraft:furnace", key: "tile.furnace.name", names: { es_MX: "Horno", en_US: "Furnace" } },
    smoker: { id: "minecraft:smoker", key: "tile.smoker.name", names: { es_MX: "Ahumador", en_US: "Smoker" } },
    blast_furnace: { id: "minecraft:blast_furnace", key: "tile.blast_furnace.name", names: { es_MX: "Alto horno", en_US: "Blast Furnace" } },
    stonecutter: { id: "minecraft:stonecutter", key: "tile.stonecutter_block.name", names: { es_MX: "Cortapiedras", en_US: "Stonecutter" } },
    smithing_table: { id: "minecraft:smithing_table", key: "tile.smithing_table.name", names: { es_MX: "Mesa de herrería", en_US: "Smithing Table" } },
    brewing_stand: { id: "minecraft:brewing_stand", key: "item.brewing_stand.name", names: { es_MX: "Soporte para pociones", en_US: "Brewing Stand" } },
    campfire: { id: "minecraft:campfire", key: "tile.campfire.name", names: { es_MX: "Fogata", en_US: "Campfire" } },
    soul_campfire: { id: "minecraft:soul_campfire", key: "tile.soul_campfire.name", names: { es_MX: "Fogata de almas", en_US: "Soul Campfire" } }
  });

  function stationTagForRecipe(recipe) {
    const explicit = (recipe.tags || []).find(tag => typeof tag === "string" && tag && tag !== "nothing");
    if (explicit) return explicit;
    if (recipe.type === "furnace") return "furnace";
    if (recipe.type.startsWith("brewing")) return "brewing_stand";
    if (recipe.type.startsWith("smithing")) return "smithing_table";
    return null;
  }

  function buildStations(recipes, content, sourceId, namespaces, issues, primaryLocale) {
    const entries = [...content.items, ...content.blocks, ...content.entities];
    const byId = new Map(entries.map(entry => [entry.id, entry]));
    const bySuffix = new Map();
    for (const entry of entries.filter(entry => entry.type === "item" || entry.type === "block")) {
      const suffix = entry.id.split(":").pop();
      const rows = bySuffix.get(suffix) || [];
      rows.push(entry);
      bySuffix.set(suffix, rows);
    }
    const stationMap = new Map();
    for (const recipe of recipes) {
      const tag = stationTagForRecipe(recipe);
      if (!tag) continue;
      let entry = null;
      let id = null;
      let kind = "virtual";
      let resolvedBy = "unregistered_tag";
      let confidence = 0;
      let runtimeLocalizationKey = null;
      let fallbackName = generatedNameForLocale(tag, primaryLocale);
      let names = Object.fromEntries(SUPPORTED_EXPORT_LOCALES.map(locale => [locale, generatedNameForLocale(tag, locale)]));
      let nameSources = Object.fromEntries(SUPPORTED_EXPORT_LOCALES.map(locale => [locale, "generated"]));
      let localizationKeys = Object.fromEntries(SUPPORTED_EXPORT_LOCALES.map(locale => [locale, null]));
      const vanilla = VANILLA_STATIONS[tag];
      if (vanilla) {
        id = vanilla.id;
        kind = "block";
        resolvedBy = "vanilla_tag";
        confidence = 3;
        runtimeLocalizationKey = vanilla.key;
        names = { ...vanilla.names };
        fallbackName = names[primaryLocale] || names.en_US;
      } else if (tag.includes(":")) {
        entry = byId.get(cleanId(tag)) || null;
        if (entry) resolvedBy = "explicit_identifier";
      } else {
        for (const namespace of namespaces) {
          entry = byId.get(`${namespace}:${tag}`) || null;
          if (entry) { resolvedBy = "source_namespace"; break; }
        }
        if (!entry) {
          const matches = bySuffix.get(tag) || [];
          if (matches.length === 1) { entry = matches[0]; resolvedBy = "unique_catalog_suffix"; confidence = 2; }
          else if (matches.length > 1) resolvedBy = "ambiguous_catalog_suffix";
        }
      }
      if (entry) {
        id = entry.id;
        kind = entry.type;
        confidence = confidence || 3;
        runtimeLocalizationKey = entry.runtimeLocalizationKey || entry.localizationKey || null;
        fallbackName = entry.fallbackName;
        names = { ...entry.names };
        nameSources = { ...entry.nameSources };
        localizationKeys = { ...entry.localizationKeys };
      }
      const stationId = id || `wati:station/${sourceId}/${String(tag).replace(/[^a-z0-9_.-]+/gi, "_").toLowerCase()}`;
      const catalogKey = entry?.catalogKey || `wati.station.${sourceId}.${String(tag).replace(/[^a-z0-9_]+/gi, "_").toLowerCase()}`;
      const key = `${stationId}|${tag}`;
      let station = stationMap.get(key);
      if (!station) {
        station = {
          id: stationId,
          tag,
          kind,
          sourceId,
          resolved: Boolean(id),
          resolvedBy,
          confidence,
          runtimeLocalizationKey,
          catalogTranslationKey: catalogKey,
          fallbackName,
          names,
          nameSources,
          localizationKeys,
          contentRef: entry ? { type: entry.type, id: entry.id } : null,
          recipeTypes: [],
          recipeIds: []
        };
        stationMap.set(key, station);
        if (!station.resolved && !VANILLA_STATIONS[tag]) {
          issues.push({
            severity: "warning",
            code: "unresolved_station_tag",
            path: recipe.sourcePath,
            message: `No se pudo asociar la estación '${tag}' con un bloque u objeto registrado.`
          });
        }
      }
      if (!station.recipeTypes.includes(recipe.type)) station.recipeTypes.push(recipe.type);
      station.recipeIds.push(recipe.id);
      recipe.sourceId = sourceId;
      recipe.station = {
        id: station.id,
        tag: station.tag,
        kind: station.kind,
        resolved: station.resolved,
        resolvedBy: station.resolvedBy,
        confidence: station.confidence,
        runtimeLocalizationKey: station.runtimeLocalizationKey,
        catalogTranslationKey: station.catalogTranslationKey,
        fallbackName: station.names?.[primaryLocale] || station.fallbackName
      };
    }
    return [...stationMap.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  function buildDetectionDescriptor(content, namespaces) {
    const probes = [];
    for (const [kind, list] of [["item", content.items], ["block", content.blocks], ["entity", content.entities]]) {
      for (const entry of list.filter(row => !row.internal).slice(0, 4)) probes.push({ kind, id: entry.id });
    }
    return {
      mode: probes.length ? "content" : namespaces.length ? "namespace" : "manual",
      namespaces: [...namespaces],
      probes,
      hiddenByDefault: false
    };
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
    return { name: generatedNameForLocale(id, locale), key: translationKey || candidates[0] || null, locale: null, source: "generated" };
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
    if (type === "entity") return "entity";
    if (type === "biome") return "biome";
    if (type === "structure") return "structure";
    if (type === "ecosystem") return "ecosystem";
    return "items";
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

  function resultRowsForKnowledge(value) {
    const values = Array.isArray(value) ? value : [value];
    return values.filter(Boolean).map(row => typeof row === "string" ? { item: cleanId(row), count: 1 } : row).filter(row => row?.item);
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
      const recipe = {
        id,
        type,
        tags: data.tags || [],
        sourcePath: path,
        warnings: [],
        group: data.group || null,
        priority: Number.isFinite(data.priority) ? data.priority : null,
        unlock: normalizeUnlock(data.unlock)
      };
      if (type === "shaped") {
        recipe.pattern = (data.pattern || []).map(row => String(row));
        recipe.key = {};
        for (const [symbol, ingredient] of Object.entries(data.key || {})) recipe.key[symbol] = normalizeIngredient(ingredient);
        const maxWidth = Math.max(0, ...recipe.pattern.map(row => row.length));
        if (recipe.pattern.length > 3 || maxWidth > 3) recipe.warnings.push("pattern_exceeds_3x3");
        if (recipe.pattern.some(row => /\s+$/.test(row))) recipe.warnings.push("trailing_spaces");
        recipe.result = normalizeResult(data.result);
        if (data.assume_symmetry !== undefined) recipe.assumeSymmetry = data.assume_symmetry === true;
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
  function numberRange(value, fallback = 1) {
    if (Number.isFinite(value)) return { min: Number(value), max: Number(value) };
    if (value && typeof value === "object") {
      const min = Number.isFinite(value.min) ? Number(value.min) : Number.isFinite(value.max) ? Number(value.max) : fallback;
      const max = Number.isFinite(value.max) ? Number(value.max) : min;
      return { min, max };
    }
    return { min: fallback, max: fallback };
  }

  function compactRaw(value, maxLength = 600) {
    if (value === undefined) return undefined;
    try {
      const text = JSON.stringify(value);
      return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
    } catch {
      return String(value);
    }
  }

  function prune(value) {
    if (Array.isArray(value)) {
      const rows = value.map(prune).filter(row => row !== undefined);
      return rows.length ? rows : undefined;
    }
    if (value && typeof value === "object") {
      const rows = Object.entries(value).map(([key, row]) => [key, prune(row)]).filter(([, row]) => row !== undefined);
      return rows.length ? Object.fromEntries(rows) : undefined;
    }
    if (value === null || value === undefined || value === "") return undefined;
    return value;
  }

  function shortEvidencePath(path) {
    const value = normalizePath(path || "");
    return value.includes("::") ? value.split("::").pop() : value;
  }

  function normalizeLootConditions(conditions) {
    return (Array.isArray(conditions) ? conditions : conditions ? [conditions] : []).map(condition => {
      if (!condition || typeof condition !== "object") return { type: "unknown", raw: compactRaw(condition) };
      const type = String(condition.condition || condition.function || "unknown").replace(/^minecraft:/, "");
      const row = { type };
      for (const key of ["chance", "looting_multiplier", "entity", "operator", "value", "subject", "on_fire"]) {
        if (condition[key] !== undefined) row[key] = condition[key];
      }
      if (condition.properties !== undefined) row.properties = compactRaw(condition.properties);
      if (condition.predicate !== undefined) row.predicate = compactRaw(condition.predicate);
      if (condition.block !== undefined) row.block = condition.block;
      if (condition.item !== undefined) row.item = condition.item;
      if (type === "unknown") row.raw = compactRaw(condition);
      return prune(row) || { type };
    });
  }

  function normalizeLootFunctions(functions) {
    const list = Array.isArray(functions) ? functions : functions ? [functions] : [];
    const normalized = [];
    let quantity = { min: 1, max: 1 };
    for (const fn of list) {
      if (!fn || typeof fn !== "object") continue;
      const type = String(fn.function || "unknown").replace(/^minecraft:/, "");
      const row = { type };
      if (type === "set_count") {
        quantity = numberRange(fn.count, 1);
        row.count = quantity;
      } else if (type === "looting_enchant" || type === "looting_enchant_bonus") {
        row.count = numberRange(fn.count, 0);
      } else if (type === "set_data") row.data = compactRaw(fn.data);
      else if (type === "set_damage") row.damage = compactRaw(fn.damage);
      else if (type === "enchant_with_levels") row.levels = compactRaw(fn.levels);
      else if (type === "enchant_randomly") row.treasure = fn.treasure === true;
      else if (type === "set_name") row.name = compactRaw(fn.name);
      else row.raw = compactRaw(fn);
      normalized.push(row);
    }
    return { quantity, functions: normalized };
  }

  function canonicalLootPath(pathValue) {
    if (!pathValue || typeof pathValue !== "string") return null;
    let value = normalizePath(pathValue).replace(/^.*?(loot_tables\/)/i, "$1");
    if (!value.startsWith("loot_tables/")) value = `loot_tables/${value.replace(/^\/+/, "")}`;
    if (!value.endsWith(".json")) value += ".json";
    return value;
  }

  function classifyLootContext(lootPath) {
    const key = canonicalLootPath(lootPath) || "loot_tables/unknown.json";
    const lower = key.toLowerCase();
    const stem = key.replace(/^loot_tables\//, "").replace(/\.json$/i, "");
    if (/^loot_tables\/chests\//.test(lower)) return { method: "container_loot", sourceType: "container", source: `loot:${stem}`, context: "chest" };
    const structureContainer = stem.match(/(?:^|\/)(?:structures?|dungeons?)\/(.+?)\/(?:chest|barrel|dispenser|container)[^/]*$/i);
    if (structureContainer) return { method: "container_loot", sourceType: "structure", source: `structure_hint:${structureContainer[1].replace(/\//g, ":")}`, context: "structure_container" };
    if (/(?:^|\/)(?:chest|barrel|container)[^/]*$/i.test(stem)) return { method: "container_loot", sourceType: "container", source: `loot:${stem}`, context: "container" };
    if (/fishing/.test(lower)) return { method: "fishing", sourceType: "loot_table", source: `loot:${stem}`, context: "fishing" };
    if (/piglin.*barter|bartering/.test(lower)) return { method: "barter", sourceType: "entity", source: "minecraft:piglin", context: "bartering" };
    if (/hero_of_the_village/.test(lower)) return { method: "gift", sourceType: "loot_table", source: `loot:${stem}`, context: "hero_of_the_village" };
    if (/cat_morning_gift/.test(lower)) return { method: "gift", sourceType: "entity", source: "minecraft:cat", context: "cat_morning_gift" };
    if (/sniffer.*dig/.test(lower)) return { method: "digging", sourceType: "entity", source: "minecraft:sniffer", context: "digging" };
    if (/^loot_tables\/entities\//.test(lower)) return { method: "entity_drop", sourceType: "loot_table", source: `loot:${stem}`, context: "entity" };
    if (/^loot_tables\/blocks\//.test(lower)) return { method: "break_block", sourceType: "loot_table", source: `loot:${stem}`, context: "block" };
    return { method: "random_loot", sourceType: "loot_table", source: `loot:${stem}`, context: "unknown" };
  }

  function lootEntryChildren(entry) {
    if (!entry || typeof entry !== "object") return [];
    if (Array.isArray(entry.children)) return entry.children;
    if (Array.isArray(entry.entries)) return entry.entries;
    return [];
  }

  function extractLootRecords(tableKey, lootTables, issues, options = {}, stack = []) {
    const canonical = canonicalLootPath(tableKey);
    const tableRecord = canonical ? lootTables.get(canonical) : null;
    if (!canonical || !tableRecord) return [];
    if (stack.includes(canonical)) {
      issues.push({ severity: "warning", code: "loot_table_cycle", path: tableRecord.path, message: `Referencia circular de loot table: ${[...stack, canonical].join(" -> ")}` });
      return [];
    }
    const table = tableRecord.doc;
    const rows = [];
    const nextStack = [...stack, canonical];
    const pools = Array.isArray(table?.pools) ? table.pools : [];
    pools.forEach((pool, poolIndex) => {
      const poolEntries = Array.isArray(pool?.entries) ? pool.entries : [];
      const totalWeight = poolEntries.reduce((sum, entry) => sum + (Number.isFinite(entry?.weight) ? Number(entry.weight) : 1), 0);
      const poolConditions = normalizeLootConditions(pool?.conditions);
      const rolls = numberRange(pool?.rolls, 1);
      const bonusRolls = pool?.bonus_rolls !== undefined ? numberRange(pool.bonus_rolls, 0) : null;
      const visit = (entry, entryIndex, branch = []) => {
        if (!entry || typeof entry !== "object") return;
        const type = String(entry.type || (entry.name ? "item" : "unknown")).replace(/^minecraft:/, "");
        const conditions = [...poolConditions, ...normalizeLootConditions(entry.conditions)];
        const normalizedFunctions = normalizeLootFunctions(entry.functions);
        const weight = Number.isFinite(entry.weight) ? Number(entry.weight) : 1;
        const quality = Number.isFinite(entry.quality) ? Number(entry.quality) : 0;
        if (type === "item" && typeof entry.name === "string") {
          const item = cleanId(entry.name);
          if (item && !item.startsWith("minecraft:empty")) {
            rows.push({
              item,
              quantity: normalizedFunctions.quantity,
              functions: normalizedFunctions.functions,
              conditions,
              chance: {
                model: "relative_weight_per_roll",
                weight,
                totalWeight: totalWeight || null,
                perRoll: totalWeight > 0 ? weight / totalWeight : null,
                rolls,
                bonusRolls,
                quality
              },
              lootTable: canonical,
              path: tableRecord.path,
              jsonPath: `pools[${poolIndex}].entries[${entryIndex}]${branch.length ? `.branch[${branch.join(".")}]` : ""}`
            });
          }
          return;
        }
        if ((type === "loot_table" || type === "table") && typeof entry.name === "string") {
          const nested = canonicalLootPath(entry.name);
          if (!lootTables.has(nested)) {
            issues.push({ severity: "warning", code: "missing_loot_table", path: tableRecord.path, message: `Loot table enlazada no encontrada: ${entry.name}` });
            return;
          }
          if (options.expandNested === false) return;
          const nestedRows = extractLootRecords(nested, lootTables, issues, options, nextStack);
          for (const nestedRow of nestedRows) {
            rows.push({
              ...nestedRow,
              conditions: [...conditions, ...(nestedRow.conditions || [])],
              chance: { ...(nestedRow.chance || {}), parentWeight: weight, parentTotalWeight: totalWeight || null, parentRolls: rolls },
              nestedFrom: canonical,
              nestedJsonPath: `pools[${poolIndex}].entries[${entryIndex}]`
            });
          }
          return;
        }
        const children = lootEntryChildren(entry);
        children.forEach((child, childIndex) => visit(child, entryIndex, [...branch, childIndex]));
      };
      poolEntries.forEach((entry, entryIndex) => visit(entry, entryIndex));
    });
    return rows;
  }

  function nestedLootReferences(doc) {
    const refs = [];
    walk(doc, obj => {
      const type = String(obj?.type || "").replace(/^minecraft:/, "");
      if ((type === "loot_table" || type === "table") && typeof obj.name === "string") {
        const path = canonicalLootPath(obj.name);
        if (path) refs.push(path);
      }
    });
    return unique(refs);
  }

  function normalizeTradeItem(value) {
    if (!value || typeof value !== "object") return null;
    const item = cleanId(value.item || value.name);
    if (!item) return null;
    return { item, quantity: numberRange(value.quantity ?? value.count, 1), priceMultiplier: value.price_multiplier ?? null, functions: compactRaw(value.functions) };
  }

  function biomeFilterFacts(value, result = { includeTags: [], excludeTags: [], includeBiomes: [], excludeBiomes: [], raw: [] }) {
    if (Array.isArray(value)) value.forEach(row => biomeFilterFacts(row, result));
    else if (value && typeof value === "object") {
      if (typeof value.test === "string" && value.value !== undefined) {
        const operator = value.operator || "==";
        const values = Array.isArray(value.value) ? value.value : [value.value];
        for (const rawValue of values) {
          const text = String(rawValue);
          if (/biome_tag/i.test(value.test)) (operator === "!=" ? result.excludeTags : result.includeTags).push(text);
          else if (/biome/i.test(value.test)) (operator === "!=" ? result.excludeBiomes : result.includeBiomes).push(cleanId(text));
        }
      }
      for (const key of ["all_of", "any_of", "none_of", "filters", "minecraft:biome_filter"]) if (value[key] !== undefined) biomeFilterFacts(value[key], result);
    }
    result.includeTags = unique(result.includeTags);
    result.excludeTags = unique(result.excludeTags);
    result.includeBiomes = unique(result.includeBiomes);
    result.excludeBiomes = unique(result.excludeBiomes);
    return result;
  }

  function dimensionHintsFromBiomeFacts(facts) {
    const tags = [...(facts?.includeTags || []), ...(facts?.includeBiomes || [])].join(" ").toLowerCase();
    const dimensions = [];
    if (/nether/.test(tags)) dimensions.push("minecraft:nether");
    if (/the_end|\bend\b/.test(tags)) dimensions.push("minecraft:the_end");
    if (/overworld|surface|forest|plains|desert|ocean|mountain|cave|swamp|jungle|savanna|taiga|badlands/.test(tags)) dimensions.push("minecraft:overworld");
    return unique(dimensions);
  }

  function featurePlacedBlocks(doc) {
    const blocks = [];
    walk(doc, obj => {
      for (const key of ["places_block"]) {
        const value = obj?.[key];
        const values = Array.isArray(value) ? value : value !== undefined ? [value] : [];
        for (const row of values) {
          if (typeof row === "string" && row.includes(":")) blocks.push(cleanId(row));
          else if (row && typeof row === "object") {
            const id = cleanId(row.name || row.block || row.item);
            if (id) blocks.push(id);
          }
        }
      }
    });
    return unique(blocks);
  }
  function featureReplaceBlocks(doc) {
    const blocks = [];
    walk(doc, obj => {
      for (const key of ["may_replace", "may_place_on"]) {
        const value = obj?.[key];
        const values = Array.isArray(value) ? value : value !== undefined ? [value] : [];
        for (const row of values) {
          if (typeof row === "string" && row.includes(":")) blocks.push(cleanId(row));
          else if (row && typeof row === "object") {
            const id = cleanId(row.name || row.block || row.item);
            if (id) blocks.push(id);
          }
        }
      }
    });
    return unique(blocks);
  }


  function featureReferences(doc) {
    const refs = [];
    walk(doc, obj => {
      for (const key of ["places_feature", "feature_to_snap", "feature_to_place"]) {
        if (typeof obj?.[key] === "string" && obj[key].includes(":")) refs.push(cleanId(obj[key]));
      }
      for (const key of ["features", "conditional_features", "weighted_features"]) {
        const value = obj?.[key];
        if (!Array.isArray(value)) continue;
        for (const row of value) {
          if (typeof row === "string") refs.push(cleanId(row));
          else if (row && typeof row === "object") {
            const id = cleanId(row.feature || row.places_feature || row.name);
            if (id) refs.push(id);
          }
        }
      }
    });
    return unique(refs.filter(Boolean));
  }

  function resolveFeatureBlocks(featureId, featureDefs, stack = []) {
    const id = cleanId(featureId);
    if (!id || stack.includes(id)) return [];
    const record = featureDefs.get(id);
    if (!record) return [];
    const blocks = [...featurePlacedBlocks(record.doc)];
    for (const ref of featureReferences(record.doc)) blocks.push(...resolveFeatureBlocks(ref, featureDefs, [...stack, id]));
    return unique(blocks);
  }


  function analyzeEntries(entries, metadata = {}) {
    const issues = [];
    const runtimeProviderFiles = entries.filter(file => /(?:^|\/)(?:wati_provider\.(?:js|ts)|WATI_PROVIDER_PROTOCOL_V1\.md)$/i.test(file.path || ""));
    const runtimeProviderDetected = runtimeProviderFiles.length > 0;
    if (runtimeProviderDetected) issues.push({ severity: "info", code: "runtime_provider_detected", path: runtimeProviderFiles[0].virtualPath || runtimeProviderFiles[0].path, message: "WATI Runtime Provider detected. Treat the provider as authoritative for its namespace instead of publishing a duplicate static contribution." });
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

    const resourceIndexes = buildResourceIndexes(parsed);
    const scriptFiles = entries.filter(file => /\.(?:js|ts)$/i.test(normalizePath(file.virtualPath || file.path)));
    if (scriptFiles.length) issues.push({
      severity: "info",
      code: "script_logic_not_interpreted",
      path: scriptFiles[0].virtualPath || scriptFiles[0].path,
      count: scriptFiles.length,
      message: `${scriptFiles.length} archivo(s) de script detectados. La lógica de recompensas, interacciones o generación implementada exclusivamente por JavaScript requiere revisión manual.`
    });

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
    if (behaviorPacks.length > 1) issues.push({ severity: "warning", code: "multiple_behavior_packs", path: behaviorPacks.map(pack => pack.path).join(", "), message: "Se detectaron varios Behavior Packs. El Builder está pensado para exportar una fuente o proyecto por contribución; analiza por separado los addons independientes para evitar identifiers duplicados o atribuciones mezcladas." });
    if (behaviorPacks.length && !resourcePacks.length) issues.push({ severity: "warning", code: "resource_pack_missing", path: behaviorPacks[0].path, message: "Solo se detectó el Behavior Pack. Los nombres pueden ser generados desde identifiers; añade el Resource Pack para recuperar traducciones y recursos asociados." });
    if (!behaviorPacks.length && resourcePacks.length) issues.push({ severity: "warning", code: "behavior_pack_missing", path: resourcePacks[0].path, message: "Solo se detectó el Resource Pack. No será posible extraer recetas ni definiciones del Behavior Pack." });

    const loadedUuids = new Set(packInfo.map(p => p.uuid).filter(Boolean));
    for (const pack of packInfo) {
      for (const dependency of pack.dependencies) {
        if (dependency.uuid && !loadedUuids.has(dependency.uuid)) issues.push({ severity: "info", code: "declared_pack_not_loaded", path: pack.path, message: `Dependencia por UUID no incluida en el análisis: ${dependency.uuid}` });
      }
    }

    const content = { items: [], blocks: [], entities: [], biomes: [], structures: [], ecosystems: [] };
    const recipes = [];
    const definitions = { block: new Map(), entity: new Map(), biome: new Map(), structure: new Map() };
    const lootTables = new Map();
    const tradeTables = [];
    const spawnRules = [];
    const featureDefs = new Map();
    const featureRules = [];
    const structureSets = [];
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
      else if ((def = doc["minecraft:biome"])) { type = "biome"; id = def.description?.identifier; }
      else if ((def = doc["minecraft:jigsaw"])) { type = "structure"; id = def.description?.identifier; }
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
          id,
          type,
          namespace: namespaceOf(id),
          fallbackName,
          names,
          nameSources,
          localizationKeys,
          localizationKey: resolvedKey,
          runtimeLocalizationKey: resolvedKey,
          catalogKey: catalogTranslationKey(type, id),
          localizationLocale: resolvedLocale,
          localization: {
            runtimeKey: resolvedKey,
            catalogKey: catalogTranslationKey(type, id),
            fallbackName,
            names,
            nameSources,
            localizationKeys
          },
          nameSource,
          category,
          internal: isInternal(id, path, category),
          sourcePath: path,
          icon: extractEntryIcon(type, id, def, resourceIndexes),
          discoveryHints: discoveryHintsFor(type)
        };
        if (type === "biome") {
          entry.biomeTags = unique(Object.keys(def.components || {}).filter(key => key.startsWith("minecraft:")).map(key => key.replace(/^minecraft:/, "")));
        } else if (type === "structure") {
          const biomeFacts = biomeFilterFacts(def.biome_filters || def.biome_filter || []);
          entry.worldgen = {
            step: def.step || null,
            startPool: def.start_pool || null,
            maxDepth: Number.isFinite(def.max_depth) ? def.max_depth : null,
            startHeight: compactRaw(def.start_height),
            heightmapProjection: def.heightmap_projection || null,
            terrainAdaptation: def.terrain_adaptation || null,
            biomeFilters: biomeFacts,
            dimensions: dimensionHintsFromBiomeFacts(biomeFacts)
          };
        }
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
        if (definitions[type]) definitions[type].set(id, { def, path });
      }
      const recipe = parseRecipeDocument(doc, path);
      if (recipe) recipes.push(recipe);
      if (/loot_tables\//i.test(path)) {
        const key = canonicalLootPath(path);
        if (key) lootTables.set(key, { doc, path });
      }
      if (/(?:^|\/)(?:trading|trades)\//i.test(path) && Array.isArray(doc?.tiers)) tradeTables.push({ doc, path });
      if (doc?.["minecraft:spawn_rules"]) spawnRules.push({ def: doc["minecraft:spawn_rules"], path });
      if (doc?.["minecraft:feature_rules"]) featureRules.push({ def: doc["minecraft:feature_rules"], path });
      if (doc?.["minecraft:structure_set"]) structureSets.push({ def: doc["minecraft:structure_set"], path });
      for (const [rootKey, rootDef] of Object.entries(doc || {})) {
        if (!/^minecraft:.*_feature$/.test(rootKey) || rootKey === "minecraft:feature_rules") continue;
        const featureId = cleanId(rootDef?.description?.identifier);
        if (featureId) featureDefs.set(featureId, { doc, def: rootDef, type: rootKey.replace(/^minecraft:/, ""), path });
      }
    }

    for (const locale of SUPPORTED_EXPORT_LOCALES) {
      const count = namesByLocale[locale]?.generated || 0;
      if (count) issues.push({
        severity: "warning", code: "generated_fallback_names", path: `texts/${locale}.lang`, locale, count,
        message: `${count} entradas no tuvieron traducción detectable en ${locale} y usan un nombre generado desde su identifier. Estos nombres pueden revisarse y editarse antes de exportar.`
      });
    }

    const acquisition = [];
    const acquisitionKeys = new Set();
    const referencedLootTables = new Set();
    const habitats = [];
    const worldGeneration = [];
    const structureKnowledge = [];
    const lootProfiles = [];

    function methodId(method) {
      const raw = `${method.method}|${method.target}|${method.sourceType}|${method.source}|${method.evidence?.path || ""}|${method.evidence?.jsonPath || ""}`;
      return `acq_${crc32(textEncoder.encode(raw)).toString(16).padStart(8, "0")}`;
    }
    function pushAcquisition(method) {
      if (!method?.target || !method?.method || !method?.source) return;
      const row = prune({ ...method }) || {};
      row.id ||= methodId(row);
      const key = stableStringify([row.target, row.method, row.sourceType, row.source, row.details, row.evidence]);
      if (acquisitionKeys.has(key)) return;
      acquisitionKeys.add(key);
      acquisition.push(row);
    }
    function lootRefsFromDefinition(definition) {
      const refs = [];
      walk(definition, (obj, jsonPath) => {
        const component = obj?.["minecraft:loot"];
        const raw = typeof component === "string" ? component : component?.table;
        if (typeof raw === "string") refs.push({ lootTable: canonicalLootPath(raw), jsonPath: jsonPath.join(".") || "components.minecraft:loot" });
      });
      return [...new Map(refs.filter(row => row.lootTable).map(row => [`${row.lootTable}|${row.jsonPath}`, row])).values()];
    }
    function addLootMethods(lootTable, context, certainty = "confirmed", reference = {}, expandNested = true) {
      if (!lootTable || !lootTables.has(lootTable)) {
        if (lootTable) issues.push({ severity: "warning", code: "missing_loot_table", path: reference.path || lootTable, message: `Loot table no encontrada: ${lootTable}` });
        return;
      }
      referencedLootTables.add(lootTable);
      const records = extractLootRecords(lootTable, lootTables, issues, { expandNested });
      for (const record of records) {
        referencedLootTables.add(record.lootTable);
        if (record.nestedFrom) referencedLootTables.add(record.nestedFrom);
        pushAcquisition({
          target: record.item,
          method: context.method,
          sourceType: context.sourceType,
          source: context.source,
          certainty,
          availability: (record.conditions?.length || record.chance?.perRoll < 1) ? "random_or_conditional" : "direct",
          quantity: record.quantity,
          chance: record.chance,
          conditions: record.conditions,
          details: {
            lootTable: record.lootTable,
            context: context.context || null,
            contextName: context.contextName || null,
            functions: record.functions,
            nestedFrom: record.nestedFrom || null,
            definitionPath: reference.definitionPath || null,
            definitionJsonPath: reference.jsonPath || null
          },
          evidence: { path: shortEvidencePath(record.path), jsonPath: record.jsonPath }
        });
      }
    }

    for (const [id, { def, path }] of definitions.block) {
      for (const ref of lootRefsFromDefinition(def)) addLootMethods(ref.lootTable, { method: "break_block", sourceType: "block", source: id, context: "block_drop" }, "confirmed", { path, definitionPath: path, jsonPath: ref.jsonPath });
    }
    for (const [id, { def, path }] of definitions.entity) {
      for (const ref of lootRefsFromDefinition(def)) addLootMethods(ref.lootTable, { method: "entity_drop", sourceType: "entity", source: id, context: "entity_drop" }, "confirmed", { path, definitionPath: path, jsonPath: ref.jsonPath });
    }

    for (const [lootPath, record] of lootTables) {
      if (referencedLootTables.has(lootPath)) continue;
      const context = classifyLootContext(lootPath);
      if (["unknown", "entity", "block"].includes(context.context)) continue;
      context.contextName = titleCaseId(lootPath.replace(/^loot_tables\//, "").replace(/\.json$/i, ""));
      const certainty = context.sourceType === "loot_table" ? "probable" : "confirmed";
      addLootMethods(lootPath, context, certainty, { path: record.path }, false);
    }

    const contextualLootKinds = new Set(["chest", "structure_container", "container", "fishing", "bartering", "hero_of_the_village", "cat_morning_gift", "digging"]);
    for (const [lootPath, record] of lootTables) {
      const context = classifyLootContext(lootPath);
      const directRecords = extractLootRecords(lootPath, lootTables, issues, { expandNested: false });
      const direct = directRecords.map(row => prune({
        item: row.item,
        quantity: row.quantity,
        chance: row.chance,
        conditions: row.conditions,
        functions: row.functions,
        jsonPath: row.jsonPath
      }));
      const resolvedItems = contextualLootKinds.has(context.context)
        ? unique(extractLootRecords(lootPath, lootTables, issues, { expandNested: true }).map(row => row.item))
        : unique(directRecords.map(row => row.item));
      lootProfiles.push(prune({
        id: lootPath,
        context: context.context,
        sourceType: context.sourceType,
        source: context.source,
        directOutputs: direct,
        references: nestedLootReferences(record.doc),
        resolvedItems,
        evidence: { path: shortEvidencePath(record.path) }
      }));
    }

    for (const recipe of recipes) {
      const outputs = resultRowsForKnowledge(recipe.result ?? recipe.output);
      const method = recipe.type === "furnace" ? "smelt" : recipe.type.startsWith("brewing") ? "brew" : recipe.type.startsWith("smithing") ? "smith" : "craft";
      for (const output of outputs) {
        pushAcquisition({
          target: output.item,
          method,
          sourceType: "recipe",
          source: recipe.id,
          certainty: "confirmed",
          availability: "direct",
          quantity: numberRange(output.count, 1),
          conditions: [],
          details: { recipeType: recipe.type, station: recipe.station?.id || null, tags: recipe.tags || [], unlock: recipe.unlock || [] },
          evidence: { path: shortEvidencePath(recipe.sourcePath), jsonPath: "recipe.result" }
        });
      }
    }

    for (const { doc, path } of tradeTables) {
      (doc.tiers || []).forEach((tier, tierIndex) => {
        (tier.trades || []).forEach((trade, tradeIndex) => {
          const costs = (trade.wants || []).map(normalizeTradeItem).filter(Boolean);
          const outputs = (trade.gives || []).map(normalizeTradeItem).filter(Boolean);
          for (const output of outputs) {
            pushAcquisition({
              target: output.item,
              method: "trade",
              sourceType: "trade_table",
              source: `trade:${normalizePath(path).split("/").pop().replace(/\.json$/i, "")}`,
              certainty: "confirmed",
              availability: "conditional",
              quantity: output.quantity,
              conditions: [],
              details: { tier: tierIndex + 1, tradeIndex: tradeIndex + 1, costs, rewardExperience: trade.reward_exp ?? null, maxUses: trade.max_uses ?? null, traderExperience: trade.trader_exp ?? null },
              evidence: { path: shortEvidencePath(path), jsonPath: `tiers[${tierIndex}].trades[${tradeIndex}].gives` }
            });
          }
        });
      });
    }

    for (const { def, path } of spawnRules) {
      const entityId = cleanId(def.description?.identifier);
      if (!entityId) continue;
      (def.conditions || []).forEach((condition, conditionIndex) => {
        const facts = biomeFilterFacts(condition?.["minecraft:biome_filter"] || []);
        const blocks = unique([
          ...(Array.isArray(condition?.["minecraft:spawns_on_block_filter"]) ? condition["minecraft:spawns_on_block_filter"] : []),
          ...(condition?.["minecraft:spawns_above_block_filter"]?.blocks || [])
        ].map(cleanId).filter(Boolean));
        habitats.push({
          entity: entityId,
          populationControl: def.description?.population_control || null,
          biomeTags: facts.includeTags,
          excludedBiomeTags: facts.excludeTags,
          biomes: facts.includeBiomes,
          excludedBiomes: facts.excludeBiomes,
          dimensions: dimensionHintsFromBiomeFacts(facts),
          blocks,
          surface: condition?.["minecraft:spawns_on_surface"] !== undefined,
          underground: condition?.["minecraft:spawns_underground"] !== undefined,
          underwater: condition?.["minecraft:spawns_underwater"] !== undefined,
          brightness: compactRaw(condition?.["minecraft:brightness_filter"]),
          height: compactRaw(condition?.["minecraft:height_filter"]),
          weight: compactRaw(condition?.["minecraft:weight"]),
          herd: compactRaw(condition?.["minecraft:herd"]),
          certainty: "confirmed",
          evidence: { path: shortEvidencePath(path), jsonPath: `minecraft:spawn_rules.conditions[${conditionIndex}]` }
        });
      });
    }

    for (const { def, path } of featureRules) {
      const ruleId = cleanId(def.description?.identifier);
      const featureId = cleanId(def.description?.places_feature);
      const facts = biomeFilterFacts(def.conditions?.["minecraft:biome_filter"] || []);
      const blocks = resolveFeatureBlocks(featureId, featureDefs);
      worldGeneration.push({
        id: ruleId,
        feature: featureId,
        blocks,
        replaceBlocks: featureId && featureDefs.get(featureId) ? featureReplaceBlocks(featureDefs.get(featureId).doc) : [],
        biomeTags: facts.includeTags,
        excludedBiomeTags: facts.excludeTags,
        biomes: facts.includeBiomes,
        excludedBiomes: facts.excludeBiomes,
        dimensions: dimensionHintsFromBiomeFacts(facts),
        placementPass: def.conditions?.placement_pass || null,
        distribution: compactRaw(def.distribution),
        certainty: blocks.length ? "confirmed" : "probable",
        evidence: { path: shortEvidencePath(path), jsonPath: "minecraft:feature_rules" }
      });
    }

    const structureById = new Map(content.structures.map(entry => [entry.id, entry]));
    for (const { def, path } of structureSets) {
      const setId = cleanId(def.description?.identifier);
      for (const [index, row] of (def.structures || []).entries()) {
        const structureId = cleanId(row.structure);
        const placement = { setId, weight: row.weight ?? 1, placement: compactRaw(def.placement), evidence: { path: shortEvidencePath(path), jsonPath: `minecraft:structure_set.structures[${index}]` } };
        const entry = structureById.get(structureId);
        if (entry) {
          entry.worldgen ||= {};
          entry.worldgen.placements ||= [];
          entry.worldgen.placements.push(placement);
        }
      }
    }
    for (const entry of content.structures) {
      structureKnowledge.push({
        id: entry.id,
        biomeFilters: entry.worldgen?.biomeFilters || null,
        dimensions: entry.worldgen?.dimensions || [],
        step: entry.worldgen?.step || null,
        startPool: entry.worldgen?.startPool || null,
        maxDepth: entry.worldgen?.maxDepth ?? null,
        placements: entry.worldgen?.placements || [],
        evidence: { path: shortEvidencePath(entry.sourcePath) }
      });
    }

    const acquisitionByTarget = {};
    for (const method of acquisition) (acquisitionByTarget[method.target] ||= []).push(method.id);
    const knowledge = {
      schemaVersion: KNOWLEDGE_SCHEMA_VERSION,
      format: "wati.catalog.knowledge",
      sourceId: null,
      coverage: {
        acquisition: ["recipes", "block_loot", "entity_loot", "container_loot", "nested_loot", "fishing", "bartering", "trades"],
        world: ["spawn_rules", "feature_rules", "jigsaw_structures"],
        limitations: ["script_logic_not_interpreted", "mcstructure_contents_not_decoded", "exact_loot_probability_not_guaranteed"]
      },
      entryProfiles: Object.fromEntries(Object.entries(acquisitionByTarget).map(([id, acquisitionMethodIds]) => [id, { acquisitionMethodIds }])),
      lootProfiles,
      habitats,
      worldGeneration,
      structures: structureKnowledge,
      notes: [
        "Probabilities based on weights are relative per roll and may change through conditions, functions or nested tables.",
        "Generated structures and features indicate possible world placement, not a guaranteed nearby location.",
        "JavaScript-controlled rewards and mechanics require manual review or SDK metadata.",
        "Consumers can invert lootProfiles.resolvedItems to build item-to-container indexes without duplicating them in this contribution."
      ]
    };


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
      generatedBy: `WATI Catalog Builder ${VERSION}`,
      generatedWith: {
        builderVersion: VERSION,
        releaseChannel: RELEASE_CHANNEL,
        catalogSchemaVersion: SCHEMA_VERSION,
        recipeSchemaVersion: RECIPE_SCHEMA_VERSION,
        acquisitionSchemaVersion: ACQUISITION_SCHEMA_VERSION,
        knowledgeSchemaVersion: KNOWLEDGE_SCHEMA_VERSION
      },
      capabilities: {
        contentKinds: Object.entries(content).filter(([, list]) => list.length).map(([kind]) => ({ items: "item", blocks: "block", entities: "entity", biomes: "biome", structures: "structure", ecosystems: "ecosystem" })[kind]),
        recipes: recipes.length > 0,
        acquisition: acquisition.length > 0,
        richLoot: lootTables.size > 0,
        trades: tradeTables.length > 0,
        habitats: habitats.length > 0,
        worldGeneration: worldGeneration.length > 0,
        structures: content.structures.length > 0,
        localization: exportLocales.length > 0,
        stations: recipes.length > 0,
        icons: content.items.some(entry => entry.icon) || content.blocks.some(entry => entry.icon),
        discoveryHints: true,
        futureKnowledge: true,
        runtimeProviderDetected
      },
      detection: buildDetectionDescriptor(content, namespaceList)
    };

    for (const list of Object.values(content)) {
      for (const entry of list) entry.sourceId = sourceId;
    }
    knowledge.sourceId = sourceId;
    const stations = buildStations(recipes, content, sourceId, namespaceList, issues, primaryLocale);

    if (source.author === "Unknown") issues.push({ severity: "warning", code: "author_not_verified", path: behavior?.path || "manifest.json", message: "No se pudo determinar el autor. Verifica el campo antes de exportar." });
    if (source.license === "Unknown / Not verified") issues.push({ severity: "warning", code: "license_not_verified", path: licenseDetection.path || "LICENSE", message: "La licencia no fue detectada. Verifícala en la página oficial o en los archivos del proyecto." });
    if (!source.officialUrl) issues.push({ severity: "info", code: "official_url_missing", path: behavior?.path || "manifest.json", message: "No se detectó una página oficial. Añádela para facilitar la verificación de la contribución." });

    const report = {
      schemaVersion: SCHEMA_VERSION,
      format: "wati.catalog.report",
      generatorVersion: VERSION,
      summary: {
        packs: packInfo.length, behaviorPacks: behaviorPacks.length, resourcePacks: resourcePacks.length,
        files: entries.length, items: content.items.length, blocks: content.blocks.length, entities: content.entities.length,
        biomes: content.biomes.length, structures: content.structures.length, ecosystems: content.ecosystems.length,
        recipes: recipes.length, stations: stations.length, acquisition: acquisition.length,
        lootTables: lootTables.size, tradeTables: tradeTables.length, habitats: habitats.length, worldGeneration: worldGeneration.length, scriptFiles: scriptFiles.length,
        localizedNames, generatedNames, manualNames: 0, namesByLocale,
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
      source: { schemaVersion: SCHEMA_VERSION, format: "wati.catalog.source", generator: "WATI Catalog Builder", generatorVersion: VERSION, releaseChannel: RELEASE_CHANNEL, source },
      content: { schemaVersion: SCHEMA_VERSION, format: "wati.catalog.content", sourceId, primaryLocale, exportedLocales: exportLocales, entryKinds: ["item", "block", "entity", "biome", "structure", "ecosystem"], ...content },
      recipes: { schemaVersion: RECIPE_SCHEMA_VERSION, format: "wati.catalog.recipes", sourceId, recipes },
      stations: { schemaVersion: SCHEMA_VERSION, format: "wati.catalog.stations", sourceId, primaryLocale, exportedLocales: exportLocales, stations },
      acquisition: {
        schemaVersion: ACQUISITION_SCHEMA_VERSION,
        format: "wati.catalog.acquisition",
        sourceId,
        coverage: "extended:recipes_loot_tables_trades_and_random_sources",
        probabilityNotice: "Weights are relative per roll. Conditions, nested tables, functions and bonus rolls can change the final probability.",
        methods: acquisition
      },
      knowledge,
      localization: {
        schemaVersion: SCHEMA_VERSION,
        format: "wati.catalog.localization",
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

  const CONTRIBUTION_README = `# WATI Catalog Contribution — Schema 3

This archive was generated locally with WATI Catalog Builder v${VERSION}.

Files:
- source.json: project identity, provenance, detection hints and capabilities
- content.json: normalized entries with localization, icon references and discovery hints
- recipes.json: normalized recipes, unlock conditions and station references
- stations.json: resolved or unresolved crafting-station descriptors
- acquisition.json: confirmed or inferred acquisition methods with quantities, conditions and relative loot weights
- knowledge.json: future Codex knowledge for habitats, world generation, structures and entry relations
- localization.json: only the name keys used for the selected export locales
- report.json: warnings, errors and evidence used by the generator

Schema 3 keeps the familiar fields from earlier contributions while adding enriched descriptors for WATI Core 3. Generated and manually corrected names remain explicitly marked. Texture paths are references to resources already present in the analyzed Resource Pack; no third-party texture is copied into this contribution.

Review every warning before submitting this archive. Do not attach third-party add-on files to a public contribution unless you are authorized to distribute them.
`;

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
      copy.runtimeLocalizationKey = copy.localizationKey;
      copy.localization = {
        ...(copy.localization || {}),
        runtimeKey: copy.runtimeLocalizationKey,
        catalogKey: copy.catalogKey,
        fallbackName: copy.fallbackName,
        names: copy.names,
        nameSources: copy.nameSources,
        localizationKeys: copy.localizationKeys
      };
      return copy;
    };
    return {
      ...content,
      primaryLocale,
      exportedLocales: locales,
      items: content.items.map(filterEntry),
      blocks: content.blocks.map(filterEntry),
      entities: content.entities.map(filterEntry),
      biomes: content.biomes || [],
      structures: content.structures || [],
      ecosystems: content.ecosystems || []
    };
  }

  function stationsForExport(stationDocument) {
    const locales = stationDocument.exportedLocales?.length ? stationDocument.exportedLocales : [stationDocument.primaryLocale || "es_MX"];
    const primaryLocale = locales.includes(stationDocument.primaryLocale) ? stationDocument.primaryLocale : locales[0];
    return {
      ...stationDocument,
      primaryLocale,
      exportedLocales: locales,
      stations: (stationDocument.stations || []).map(station => ({
        ...station,
        names: Object.fromEntries(locales.map(locale => [locale, station.names?.[locale] || station.fallbackName])),
        nameSources: Object.fromEntries(locales.map(locale => [locale, station.nameSources?.[locale] || "generated"])),
        localizationKeys: Object.fromEntries(locales.map(locale => [locale, station.localizationKeys?.[locale] || null])),
        fallbackName: station.names?.[primaryLocale] || station.fallbackName
      }))
    };
  }

  function exportContribution(analysis) {
    const pretty = value => JSON.stringify(value, null, 2) + "\n";
    const files = [
      { name: "CONTRIBUTION_README.md", data: CONTRIBUTION_README },
      { name: "source.json", data: pretty(analysis.source) },
      { name: "content.json", data: pretty(contentForExport(analysis.content)) },
      { name: "recipes.json", data: pretty(analysis.recipes) },
      { name: "stations.json", data: pretty(stationsForExport(analysis.stations)) },
      { name: "acquisition.json", data: pretty(analysis.acquisition) },
      { name: "knowledge.json", data: pretty(analysis.knowledge) },
      { name: "localization.json", data: pretty(analysis.localization) },
      { name: "report.json", data: pretty(analysis.report) }
    ];
    return writeZip(files);
  }

  return {
    VERSION, RELEASE_CHANNEL, SCHEMA_VERSION, RECIPE_SCHEMA_VERSION, ACQUISITION_SCHEMA_VERSION, KNOWLEDGE_SCHEMA_VERSION, SUPPORTED_EXPORT_LOCALES, readZip, flattenArchives, analyzeEntries, exportContribution, writeZip,
    normalizeLegacyDescriptor, cleanPublicName, slugifySourceId, inferVersionCandidate, stripFormatting
  };
});
