import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const engine = require('../catalog-engine.js');
const enc = new TextEncoder();
const json = value => enc.encode(JSON.stringify(value));
const text = value => enc.encode(value);
const entries = [
  { path: 'BP/manifest.json', virtualPath: 'Test.mcaddon::BP/manifest.json', data: json({
    format_version: 2,
    header: { name: 'Test Kitchen BP', description: 'Created by WATI Test', uuid: '11111111-1111-4111-8111-111111111111', version: [1, 2, 3], min_engine_version: [1, 21, 0] },
    modules: [{ type: 'data', uuid: '22222222-2222-4222-8222-222222222222', version: [1, 2, 3] }]
  }) },
  { path: 'RP/manifest.json', virtualPath: 'Test.mcaddon::RP/manifest.json', data: json({
    format_version: 2,
    header: { name: 'Test Kitchen RP', description: 'Created by WATI Test', uuid: '33333333-3333-4333-8333-333333333333', version: [1, 2, 3], min_engine_version: [1, 21, 0] },
    modules: [{ type: 'resources', uuid: '44444444-4444-4444-8444-444444444444', version: [1, 2, 3] }]
  }) },
  { path: 'BP/items/rice.json', virtualPath: 'Test.mcaddon::BP/items/rice.json', data: json({
    format_version: '1.21.0',
    'minecraft:item': { description: { identifier: 'test:rice' }, components: { 'minecraft:display_name': { value: 'item.test:rice.name' }, 'minecraft:icon': 'test_rice' } }
  }) },
  { path: 'BP/blocks/cooking_pot.json', virtualPath: 'Test.mcaddon::BP/blocks/cooking_pot.json', data: json({
    format_version: '1.21.0',
    'minecraft:block': { description: { identifier: 'test:cooking_pot' }, components: { 'minecraft:display_name': 'tile.test:cooking_pot.name', 'minecraft:material_instances': { '*': { texture: 'test_cooking_pot' } } } }
  }) },
  { path: 'BP/blocks/empty_drop.json', virtualPath: 'Test.mcaddon::BP/blocks/empty_drop.json', data: json({
    format_version: '1.21.0',
    'minecraft:block': { description: { identifier: 'test:empty_drop_block' }, components: { 'minecraft:loot': 'loot_tables/empty.json' } }
  }) },
  { path: 'BP/entities/helper_part.json', virtualPath: 'Test.mcaddon::BP/entities/helper_part.json', data: json({
    format_version: '1.21.0',
    'minecraft:entity': { description: { identifier: 'test:boss_part1', is_spawnable: false, is_summonable: false }, components: {} }
  }) },
  { path: 'BP/loot_tables/empty.json', virtualPath: 'Test.mcaddon::BP/loot_tables/empty.json', data: json({ pools: [{ entries: [{ type: 'item', name: 'minecraft:air' }] }] }) },
  { path: 'BP/recipes/rice.json', virtualPath: 'Test.mcaddon::BP/recipes/rice.json', data: json({
    format_version: '1.21.0',
    'minecraft:recipe_shapeless': { description: { identifier: 'test:rice_recipe' }, tags: ['cooking_pot'], unlock: [{ item: 'test:rice' }], ingredients: [{ item: 'minecraft:water_bucket' }], result: { item: 'test:rice', count: 1 } }
  }) },
  { path: 'RP/texts/es_MX.lang', virtualPath: 'Test.mcaddon::RP/texts/es_MX.lang', data: text('item.test:rice.name=Arroz\ntile.test:cooking_pot.name=Olla de cocina\n') },
  { path: 'RP/texts/en_US.lang', virtualPath: 'Test.mcaddon::RP/texts/en_US.lang', data: text('item.test:rice.name=Rice\ntile.test:cooking_pot.name=Cooking Pot\n') },
  { path: 'RP/textures/item_texture.json', virtualPath: 'Test.mcaddon::RP/textures/item_texture.json', data: json({ texture_data: { test_rice: { textures: 'textures/items/rice' } } }) },
  { path: 'RP/textures/terrain_texture.json', virtualPath: 'Test.mcaddon::RP/textures/terrain_texture.json', data: json({ texture_data: { test_cooking_pot: { textures: 'textures/blocks/cooking_pot' } } }) }
];
const analysis = engine.analyzeEntries(entries, { id: 'test_kitchen', name: 'Test Kitchen', exportLocales: ['es_MX', 'en_US'], primaryLocale: 'es_MX' });
assert.equal(engine.SCHEMA_VERSION, 3);
assert.equal(analysis.source.schemaVersion, 3);
assert.equal(analysis.recipes.schemaVersion, 3);
assert.equal(analysis.acquisition.schemaVersion, 2);
assert.equal(analysis.knowledge.schemaVersion, 2);
assert.equal(analysis.content.items[0].catalogKey, 'wati.content.item.test.rice');
assert.equal(analysis.content.items[0].icon.texturePath, 'textures/items/rice');
assert.equal(analysis.content.blocks[0].icon.texturePath, 'textures/blocks/cooking_pot');
assert.equal(analysis.content.entities.find(entry => entry.id === 'test:boss_part1').codexVisible, false);
assert(!analysis.acquisition.methods.some(row => row.target === 'minecraft:air'));
assert.equal(analysis.recipes.recipes[0].unlock[0].value, 'test:rice');
assert.equal(analysis.recipes.recipes[0].station.id, 'test:cooking_pot');
assert.equal(analysis.stations.stations[0].names.es_MX, 'Olla de cocina');
assert.equal(analysis.stations.stations[0].runtimeLocalizationKey, 'tile.test:cooking_pot.name');
assert.equal(analysis.source.source.detection.mode, 'content');
assert(analysis.source.source.detection.probes.some(row => row.id === 'test:rice'));
const exported = await engine.readZip(engine.exportContribution(analysis));
assert(exported.some(entry => entry.name === 'stations.json'));
assert(exported.some(entry => entry.name === 'knowledge.json'));
const stationDoc = JSON.parse(new TextDecoder().decode(exported.find(entry => entry.name === 'stations.json').data));
assert.equal(stationDoc.schemaVersion, 3);
assert.equal(stationDoc.stations[0].fallbackName, 'Olla de cocina');
const lensStarter = await engine.readZip(engine.exportLensProviderStarter(analysis));
assert(lensStarter.some(entry => entry.name === 'scripts/wati_lens_provider.js'));
assert(lensStarter.some(entry => entry.name === 'scripts/wati_lens_catalog.js'));
assert(lensStarter.some(entry => entry.name === 'LICENSE_AND_PERMISSION_NOTICE.md'));
const lensEntries = JSON.parse(new TextDecoder().decode(lensStarter.find(entry => entry.name === 'lens_provider_entries.json').data));
assert(!lensEntries.entries.some(entry => entry.id === 'test:boss_part1'));
console.log('WATI Catalog Schema 3: estaciones, desbloqueos, iconos y detección aprobados.');
