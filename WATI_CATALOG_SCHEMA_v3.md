# WATI Catalog Schema 3 + Knowledge 1

v1.2.1 conserva los documentos Schema 3 existentes y añade información compatible hacia adelante.

## Documentos base

- `source.json` — `wati.catalog.source`, schema 3.
- `content.json` — `wati.catalog.content`, schema 3.
- `recipes.json` — `wati.catalog.recipes`, schema 3.
- `stations.json` — `wati.catalog.stations`, schema 3.
- `localization.json` — `wati.catalog.localization`, schema 3.
- `report.json` — `wati.catalog.report`, schema 3.

## Acquisition Schema 2 enriquecido

`acquisition.json` conserva `schemaVersion: 2` y agrega campos opcionales:

```json
{
  "id": "acq_entity_drop_minecraft_rotten_flesh_test_zombie",
  "target": "minecraft:rotten_flesh",
  "method": "entity_drop",
  "sourceType": "entity",
  "source": "test:zombie",
  "certainty": "confirmed",
  "availability": "random_or_conditional",
  "quantity": { "min": 0, "max": 2 },
  "chance": {
    "model": "relative_weight_per_roll",
    "weight": 8,
    "totalWeight": 9,
    "perRoll": 0.8888888889,
    "rolls": { "min": 1, "max": 1 }
  },
  "conditions": [],
  "details": { "lootTable": "loot_tables/entities/zombie.json" },
  "evidence": {
    "path": "Addon.mcpack::loot_tables/entities/zombie.json",
    "jsonPath": "pools[0].entries[0]"
  }
}
```

La probabilidad final no debe presentarse como exacta cuando existan condiciones, bonus rolls, funciones o tablas anidadas.

## Knowledge Schema 1

`knowledge.json` contiene:

- `entryProfiles`: referencias desde entradas a sus métodos de obtención.
- `habitats`: reglas de aparición de entidades.
- `worldGeneration`: features, bloques colocados, reemplazos y filtros de bioma.
- `structures`: jigsaw, pools, dimensiones sugeridas y placements.
- `coverage.limitations`: límites que Codex debe comunicar sin tratarlos como errores.

El documento es opcional para Core actual. El compilador puede transformarlo en `knowledge_data.js` para una versión futura.

Los `lootProfiles` conservan `directOutputs`, referencias a tablas anidadas y `resolvedItems`. Este último campo permite construir en Core un índice inverso de objetos que pueden aparecer en cofres o contenedores sin duplicar toda la evidencia en `acquisition.json`.
