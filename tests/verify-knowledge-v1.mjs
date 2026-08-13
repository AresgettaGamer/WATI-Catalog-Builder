import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const engine = require('../catalog-engine.js');
const enc = new TextEncoder();
const json = value => enc.encode(JSON.stringify(value));
const entries = [
  { path:'BP/manifest.json', virtualPath:'Test.mcaddon::BP/manifest.json', data:json({format_version:2,header:{name:'Knowledge Test BP',description:'Made by WATI Test',uuid:'11111111-1111-4111-8111-111111111111',version:[1,0,0]},modules:[{type:'data',uuid:'22222222-2222-4222-8222-222222222222',version:[1,0,0]}]}) },
  { path:'BP/blocks/ore.json', virtualPath:'Test.mcaddon::BP/blocks/ore.json', data:json({'minecraft:block':{description:{identifier:'test:ore'},components:{'minecraft:loot':'loot_tables/blocks/ore.json'}}}) },
  { path:'BP/entities/mob.json', virtualPath:'Test.mcaddon::BP/entities/mob.json', data:json({'minecraft:entity':{description:{identifier:'test:mob'},components:{'minecraft:loot':{table:'loot_tables/entities/mob.json'}}}}) },
  { path:'BP/loot_tables/blocks/ore.json', virtualPath:'Test.mcaddon::BP/loot_tables/blocks/ore.json', data:json({pools:[{rolls:1,entries:[{type:'item',name:'test:gem',functions:[{function:'set_count',count:{min:1,max:3}}]}]}]}) },
  { path:'BP/loot_tables/entities/mob.json', virtualPath:'Test.mcaddon::BP/loot_tables/entities/mob.json', data:json({pools:[{entries:[{type:'item',name:'minecraft:rotten_flesh',weight:8},{type:'item',name:'test:rare',weight:1,conditions:[{condition:'random_chance',chance:0.1}]}]}]}) },
  { path:'BP/loot_tables/chests/ruin.json', virtualPath:'Test.mcaddon::BP/loot_tables/chests/ruin.json', data:json({pools:[{rolls:2,entries:[{type:'item',name:'test:gem'}]}]}) },
  { path:'BP/trading/vendor.json', virtualPath:'Test.mcaddon::BP/trading/vendor.json', data:json({tiers:[{trades:[{wants:[{item:'minecraft:emerald',quantity:2}],gives:[{item:'test:gem',quantity:{min:1,max:2}}]}]}]}) },
  { path:'BP/spawn_rules/mob.json', virtualPath:'Test.mcaddon::BP/spawn_rules/mob.json', data:json({'minecraft:spawn_rules':{description:{identifier:'test:mob',population_control:'monster'},conditions:[{'minecraft:biome_filter':[{test:'has_biome_tag',operator:'==',value:'overworld'}]}]}}) },
  { path:'BP/features/ore.json', virtualPath:'Test.mcaddon::BP/features/ore.json', data:json({'minecraft:ore_feature':{description:{identifier:'test:ore_feature'},replace_rules:[{places_block:'test:ore',may_replace:['minecraft:stone']}]}}) },
  { path:'BP/feature_rules/ore.json', virtualPath:'Test.mcaddon::BP/feature_rules/ore.json', data:json({'minecraft:feature_rules':{description:{identifier:'test:ore_rule',places_feature:'test:ore_feature'},conditions:{placement_pass:'underground_pass','minecraft:biome_filter':[{test:'has_biome_tag',operator:'==',value:'overworld'}]},distribution:{iterations:4}}}) },
  { path:'BP/worldgen/structures/test/ruin.json', virtualPath:'Test.mcaddon::BP/worldgen/structures/test/ruin.json', data:json({'minecraft:jigsaw':{description:{identifier:'test:ruin'},biome_filters:[{test:'has_biome_tag',operator:'==',value:'overworld'}],step:'surface_structures',start_pool:'test:ruin_pool',max_depth:2}}) },
  { path:'BP/worldgen/structure_sets/test/ruin.json', virtualPath:'Test.mcaddon::BP/worldgen/structure_sets/test/ruin.json', data:json({'minecraft:structure_set':{description:{identifier:'test:ruin_set'},placement:{type:'minecraft:random_spread',spacing:20},structures:[{structure:'test:ruin',weight:1}]}}) }
];
const analysis = engine.analyzeEntries(entries,{id:'knowledge_test',name:'Knowledge Test'});
assert.equal(engine.KNOWLEDGE_SCHEMA_VERSION,2);
assert.equal(analysis.content.structures.length,1);
assert(analysis.acquisition.methods.some(row=>row.method==='break_block'&&row.target==='test:gem'));
assert(analysis.acquisition.methods.some(row=>row.method==='entity_drop'&&row.target==='test:rare'));
assert(analysis.acquisition.methods.some(row=>row.method==='container_loot'&&row.target==='test:gem'));
assert(analysis.acquisition.methods.some(row=>row.method==='trade'&&row.target==='test:gem'));
const rare=analysis.acquisition.methods.find(row=>row.target==='test:rare');
assert.equal(rare.chance.weight,1);
assert.equal(rare.conditions[0].type,'random_chance');
assert(analysis.knowledge.lootProfiles.find(row=>row.id==='loot_tables/chests/ruin.json').resolvedItems.includes('test:gem'));
assert.equal(analysis.knowledge.habitats[0].entity,'test:mob');
assert.deepEqual(analysis.knowledge.worldGeneration[0].blocks,['test:ore']);
assert.deepEqual(analysis.knowledge.worldGeneration[0].replaceBlocks,['minecraft:stone']);
assert.equal(analysis.knowledge.structures[0].placements.length,1);
const exported=await engine.readZip(engine.exportContribution(analysis));
assert(exported.some(row=>row.name==='knowledge.json'));
assert(exported.some(row=>row.name==='acquisition.json'));
console.log('Knowledge v2: loot, trades, habitats, worldgen and structures approved.');
