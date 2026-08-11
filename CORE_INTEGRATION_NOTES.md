# WATI Core integration notes — Builder v1.2.1

## Compatibilidad inmediata

- `source.json`, `content.json`, `recipes.json`, `stations.json`, `acquisition.json` y `localization.json` continúan siendo compatibles con Schema 3.
- `acquisition.json` conserva schema 2 y únicamente añade campos opcionales.
- `knowledge.json` es nuevo y opcional.

## Compilador incluido

`tools/compile-core-catalog.mjs` ahora:

- usa `method.target` como clave de adquisición;
- conserva cantidad, chance, condiciones, certeza y evidencia;
- carga `knowledge.json` cuando existe;
- genera `scripts/knowledge_data.js` sin modificar imports de Core;
- sigue aceptando contribuciones antiguas que no contienen knowledge.

## Integración futura de Codex

Codex podrá construir textos breves desde datos estructurados:

- `entity_drop`: “Suelta X; también posee drops poco comunes o condicionales”.
- `container_loot`: “Puede encontrarse en cofres o contenedores relacionados con Y”.
- `break_block`: “Se obtiene al romper o minar Z, sujeto a herramienta o fortuna”.
- `trade`: “Puede comprarse o intercambiarse mediante la tabla indicada”.
- `habitats`: “Aparece en etiquetas de bioma, dimensiones o bloques concretos”.
- `worldGeneration`: “El bloque se genera mediante una feature en determinadas condiciones”.

Core/Codex deben distinguir siempre `confirmed`, `probable` y `manual`, y no convertir pesos relativos en porcentajes absolutos sin un cálculo completo.

## Índice futuro de cofres y contenedores

Cada `lootProfile` puede incluir `resolvedItems`, una lista compacta de identifiers obtenidos al seguir tablas anidadas. Core puede invertirla para responder “puede encontrarse en…” y conservar la evidencia completa en el perfil, sin convertir cada referencia indirecta en miles de métodos de adquisición repetidos.
