import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const engine = require('../catalog-engine.js');
const enc = new TextEncoder();
const entries = [
  { path: 'Test BP/manifest.json', data: enc.encode(JSON.stringify({format_version:2,header:{name:'Test BP',description:'Test',uuid:'11111111-1111-4111-8111-111111111111',version:[1,0,0],min_engine_version:[1,21,0]},modules:[{type:'data',uuid:'22222222-2222-4222-8222-222222222222',version:[1,0,0]}]})) },
  { path: 'Test BP/items/allay_bottle.json', data: enc.encode(JSON.stringify({format_version:'1.21.0','minecraft:item':{description:{identifier:'test:allay_bottle'},components:{}}})) },
  { path: 'Test BP/items/magic_axe.json', data: enc.encode(JSON.stringify({format_version:'1.21.0','minecraft:item':{description:{identifier:'test:magic_axe'},components:{}}})) },
  { path: 'Test BP/items/crab_chestplate_stage1.json', data: enc.encode(JSON.stringify({format_version:'1.21.0','minecraft:item':{description:{identifier:'test:crab_chestplate_stage1'},components:{}}})) },
  { path: 'Test BP/recipes/example.json', data: enc.encode(JSON.stringify({format_version:'1.20.0','minecraft:recipe_shapeless':{description:{identifier:'test:example'},tags:['crafting_table'],ingredients:[{item:'minecraft:stick'}],result:{item:'test:allay_bottle'}}})) }
];
const a=engine.analyzeEntries(entries,{exportLocales:['es_MX','en_US'],primaryLocale:'es_MX'});
const byId=new Map(a.content.items.map(e=>[e.id,e]));
assert.equal(byId.get('test:allay_bottle').names.es_MX,'Botella de Allay');
assert.equal(byId.get('test:magic_axe').names.es_MX,'Hacha mágica');
assert.equal(byId.get('test:crab_chestplate_stage1').names.es_MX,'Peto de cangrejo, etapa 1');
const station=a.stations.stations.find(s=>s.tag==='crafting_table');
assert.equal(station.names.es_MX,'Mesa de trabajo');
assert.equal(station.names.en_US,'Crafting Table');
console.log('Localización 1.2.1: nombres generados y estaciones aprobados.');
