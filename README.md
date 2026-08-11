# WATI Catalog Builder v1.2.1

Herramienta web local para analizar add-ons de Minecraft Bedrock y generar contribuciones normalizadas para WATI Core.

## Uso

1. Abre `index.html` en un navegador moderno.
2. Carga juntos el BP y el RP, ya sea como `.mcpack`, `.mcaddon` o `.zip`.
3. Revisa la identidad, versión, autor, licencia e idiomas.
4. Corrige los nombres generados cuando sea necesario.
5. Revisa las vistas de contenido, estaciones, obtención y conocimiento futuro.
6. Exporta la contribución ZIP.

Todo se procesa localmente. El Builder no sube los paquetes a un servidor y no copia texturas de terceros dentro de la contribución.

## Archivos exportados

- `source.json`: identidad, procedencia, capacidades y detección.
- `content.json`: objetos, bloques, entidades, biomas y estructuras.
- `recipes.json`: recetas, desbloqueos y estación asociada.
- `stations.json`: estaciones resueltas o pendientes.
- `acquisition.json`: métodos de obtención y loot con evidencia.
- `knowledge.json`: hábitats, generación del mundo, estructuras y perfiles futuros para Codex.
- `localization.json`: claves de idioma utilizadas.
- `report.json`: conteos, problemas y evidencia del análisis.

## Cobertura de v1.2.1

### Contenido

- Manifests BP/RP e identidad pública.
- Objetos, bloques, entidades y biomas personalizados.
- Estructuras jigsaw y sus `structure_sets`.
- Traducciones `es_MX` y `en_US`.
- Referencias de iconos y texturas, sin copiar imágenes.
- Nombres generados editables cuando no existe traducción; en `es_MX` se crea una traducción aproximada desde términos comunes del identifier.

### Fabricación

- Recetas shaped, shapeless, furnace, brewing y smithing.
- Condiciones de desbloqueo.
- Estaciones Vanilla y personalizadas.

### Obtención y loot

- Drops de bloques y entidades, incluso desde component groups o permutations.
- Loot tables anidadas.
- Cantidades por `set_count`.
- Pesos relativos por tirada, rolls y bonus rolls.
- Condiciones como azar, Looting, herramienta, muerte por jugador y propiedades.
- Cofres y contenedores identificados por la ruta de la loot table.
- Pesca, trueques de piglins, regalos y fuentes de gameplay reconocibles.
- Comercios de archivos `trading/` o `trades/`.
- Resultados de recetas como método directo de obtención.

### Información futura para Codex

- Hábitats desde `minecraft:spawn_rules`.
- Biomas, etiquetas, bloques de aparición, altura y luz cuando estén declarados.
- Features y feature rules, incluyendo bloques colocados, bloques reemplazados y placement pass.
- Estructuras jigsaw, filtros de bioma, pools y distribución.
- `entryProfiles` que enlaza cada entrada con sus métodos de obtención.
- `lootProfiles` que conserva salidas directas, referencias anidadas y `resolvedItems`; Core podrá invertir esta lista para responder en qué cofres, contenedores o tablas puede aparecer cada objeto sin duplicar miles de métodos completos.

## Límites conocidos

- Un peso de loot es relativo por tirada; no siempre equivale a la probabilidad final.
- Los archivos `.mcstructure` no se decodifican, así que no se puede relacionar automáticamente cada cofre con una estructura binaria concreta.
- Las recompensas, máquinas, quests o interacciones implementadas exclusivamente con JavaScript requieren revisión manual o metadatos del WATI SDK.
- Las estructuras y features indican dónde puede generarse contenido, no una ubicación concreta del mundo.
- El Builder no inventa descripciones narrativas. Exporta hechos y evidencia para que Core/Codex los presenten después.

## Compatibilidad

La contribución conserva WATI Catalog Schema 3 y Acquisition Schema 2 para no romper el compilador actual. Los campos enriquecidos son adicionales. `knowledge.json` utiliza WATI Knowledge Schema 1 y puede ignorarse de forma segura hasta que Core/Codex lo consuman.

## Runtime Provider detection

If the analyzed add-on already ships `wati_provider.js` or the Provider Protocol documentation, Builder marks it as a Runtime Provider project. In that case the provider should remain authoritative and a duplicate static contribution should not be published for the same namespace.
