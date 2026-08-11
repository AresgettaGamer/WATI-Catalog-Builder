import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const engine = require('../catalog-engine.js');

const root = path.resolve(import.meta.dirname, '..');
const seedRoot = process.env.WATI_CORE_TEST_ROOT;
if (!seedRoot) {
  console.log('SKIP verify-core-compiler: define WATI_CORE_TEST_ROOT with a Core work directory.');
  process.exit(0);
}
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wati-compiler-'));
const core = path.join(tmp, 'core');
await fs.cp(seedRoot, core, { recursive: true });
const contribution = path.join(tmp, 'test_contribution');
await fs.mkdir(contribution, { recursive: true });
const write = (name, value) => fs.writeFile(path.join(contribution, name), JSON.stringify(value, null, 2));
await write('source.json', {
  schemaVersion: 3, format: 'wati.catalog.source', generator: 'WATI Catalog Builder', generatorVersion: '1.1.1',
  source: { id: 'test_kitchen', name: 'Test Kitchen', version: '1.0.0', manifestVersion: '1.0.0', namespaces: ['test'], aliases: ['kitchen'], primaryLocale: 'es_MX', exportedLocales: ['es_MX','en_US'], capabilities: {}, detection: { mode: 'content', namespaces: ['test'], probes: [{kind:'item',id:'test:rice'}], hiddenByDefault: false }, generatedWith: {} }
});
await write('content.json', {
  schemaVersion: 3, format: 'wati.catalog.content', sourceId: 'test_kitchen', entryKinds: ['item','block','entity','biome','structure','ecosystem'],
  items: [{ id:'test:rice', type:'item', sourceId:'test_kitchen', namespace:'test', fallbackName:'Arroz', catalogKey:'wati.content.item.test.rice', runtimeLocalizationKey:'item.test:rice.name', internal:false, category:'food', icon:{textureKey:'test_rice',texturePath:'textures/items/rice'}, discoveryHints:{suggestedTriggers:['obtain','craft']} }],
  blocks: [{ id:'test:cooking_pot', type:'block', sourceId:'test_kitchen', namespace:'test', fallbackName:'Olla de cocina', catalogKey:'wati.content.block.test.cooking_pot', runtimeLocalizationKey:'tile.test:cooking_pot.name', internal:false, category:'items' }], entities:[], biomes:[], structures:[], ecosystems:[]
});
await write('recipes.json', { schemaVersion:3, format:'wati.catalog.recipes', sourceId:'test_kitchen', recipes:[{ id:'test:rice_recipe', type:'shapeless', sourceId:'test_kitchen', tags:['cooking_pot'], ingredients:[{item:'minecraft:water_bucket',count:1}], result:{item:'test:rice',count:1}, unlock:[{type:'item',value:'test:rice',count:1}], station:{id:'test:cooking_pot',tag:'cooking_pot',kind:'block',resolved:true,resolvedBy:'source_namespace',confidence:3} }] });
await write('stations.json', { schemaVersion:3, format:'wati.catalog.stations', sourceId:'test_kitchen', stations:[{ id:'test:cooking_pot',tag:'cooking_pot',kind:'block',sourceId:'test_kitchen',resolved:true,resolvedBy:'source_namespace',confidence:3,runtimeLocalizationKey:'tile.test:cooking_pot.name',catalogTranslationKey:'wati.content.block.test.cooking_pot',fallbackName:'Olla de cocina',names:{es_MX:'Olla de cocina',en_US:'Cooking Pot'},contentRef:{type:'block',id:'test:cooking_pot'},recipeTypes:['shapeless'],recipeIds:['test:rice_recipe'] }] });
await write('localization.json', { schemaVersion:3, format:'wati.catalog.localization', sourceId:'test_kitchen', locales:{ es_MX:{'wati.content.item.test.rice':'Arroz','wati.content.block.test.cooking_pot':'Olla de cocina'}, en_US:{'wati.content.item.test.rice':'Rice','wati.content.block.test.cooking_pot':'Cooking Pot'} } });
await write('acquisition.json', { schemaVersion:2, format:'wati.catalog.acquisition', sourceId:'test_kitchen', methods:[] });

const contributionFiles = [];
for (const name of await fs.readdir(contribution)) contributionFiles.push({ name, data: new Uint8Array(await fs.readFile(path.join(contribution, name))) });
const contributionZip = path.join(tmp, 'test_contribution.zip');
await fs.writeFile(contributionZip, engine.writeZip(contributionFiles));
const run = spawnSync(process.execPath, [path.join(root,'tools/compile-core-catalog.mjs'),'--core-bp',path.join(core,'BP'),'--core-rp',path.join(core,'RP'),'--contribution',contributionZip,'--version','2.2.1'], { encoding:'utf8' });
assert.equal(run.status, 0, run.stderr || run.stdout);
const catalog = (await import(`${pathToFileURL(path.join(core,'BP/scripts/catalog_data.js')).href}?x=${Date.now()}`)).CATALOG;
const recipes = (await import(`${pathToFileURL(path.join(core,'BP/scripts/recipe_data.js')).href}?x=${Date.now()}`)).RECIPE_CATALOG;
const stations = (await import(`${pathToFileURL(path.join(core,'BP/scripts/stations_data.js')).href}?x=${Date.now()}`)).STATION_CATALOG;
assert.equal(catalog.schema, 3);
assert.equal(catalog.content.item['test:rice'][7], 'test_rice');
assert.equal(catalog.content.item['test:rice'][8], 'textures/items/rice');
assert.deepEqual(catalog.content.item['test:rice'][9].split('|'), ['obtain','craft']);
assert.equal(recipes.sources.test_kitchen[0][4].ul[0][0], 'i');
assert.equal(stations.sources.test_kitchen.cooking_pot[5], 'tile.test:cooking_pot.name');
const es = await fs.readFile(path.join(core,'RP/texts/es_MX.lang'),'utf8');
assert(es.includes('wati.content.block.test.cooking_pot=Olla de cocina'));
console.log('WATI Core Compiler: contribución Schema 3, estación, icono, desbloqueo y traducción aprobados.');
