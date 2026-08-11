# Prueba rápida — WATI Catalog Builder v1.2.1

1. Abre `index.html`.
2. Carga BP y RP juntos.
3. Confirma que se muestran objetos, bloques, entidades, biomas o estructuras disponibles.
4. Revisa que las recetas y estaciones sigan apareciendo.
5. Abre **Obtención, loot y recompensas**:
   - debe mostrar drops de bloques y entidades;
   - loot de cofres si existen tablas `loot_tables/chests`;
   - trades si existen archivos `trading/` o `trades/`;
   - cantidades y condiciones cuando estén declaradas.
6. Abre **Información futura para Codex**:
   - spawn rules deben producir hábitats;
   - feature rules deben producir registros de generación;
   - jigsaw structures deben producir estructuras.
7. Exporta la contribución.
8. Comprueba que el ZIP incluya `knowledge.json` y `acquisition.json`.
9. Ejecuta:

```bash
node tests/verify-schema-v3.mjs
node tests/verify-knowledge-v1.mjs
node tests/verify-ui.mjs
```

No deben aparecer errores.
