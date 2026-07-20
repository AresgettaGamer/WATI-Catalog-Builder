# WATI Catalog Builder v1.0.0

Local web application for analyzing Minecraft Bedrock add-ons and generating contributions compatible with **WATI Catalog Schema v1**.

## Privacy

All selected packs are read and processed locally in the browser. The Builder does not upload add-ons to a server.

## Use

1. Extract the Builder ZIP.
2. Open `index.html` in a modern browser.
3. Choose **ES-MX** or **EN-US** for the interface.
4. Drag one or more `.mcaddon`, `.mcpack`, or `.zip` files into the page.
5. Load the Behavior Pack and Resource Pack together whenever possible.
6. Review detected project identity, versions, author, namespaces, aliases, license, and official page.
7. Choose whether to export Mexican Spanish names, US English names, or both.
8. Filter translated, generated, and manually edited names; correct generated names when needed.
9. Review errors and warnings.
10. Export the contribution ZIP.

## Output

A contribution contains:

```text
WATI_Contribution_<source>/
├── source.json
├── content.json
├── recipes.json
├── acquisition.json
├── localization.json
├── report.json
├── README.md
├── WATI_CATALOG_SCHEMA_v1.md
└── schema/
```

## Detection coverage

- Behavior Pack and Resource Pack manifests
- Public and internal manifest versions
- Basic author, URL, namespace, alias, and common license evidence
- Items, blocks, entities, and internal-content hints
- `es_MX.lang` and `en_US.lang` names
- Shaped, shapeless, furnace, brewing, and smithing recipes
- Common legacy vanilla identifiers and numeric variants
- Direct block and entity loot references
- Invalid JSON, duplicate definitions, missing loot, oversized patterns, trailing spaces, and incomplete BP/RP pairs

## Name review

When the selected language has no usable translation, the Builder creates a readable name from the identifier and marks it as `generated`. Generated names can be filtered and edited. Reviewed values are exported as `manual`; they are not misrepresented as official translations from the original add-on.

## Current limits

Trade tables, feature rules, advanced crop inference, structure contents, script-controlled machines, quests, interactions, and other dynamic systems may still require manual review or provider metadata.

## Browser compatibility

Requires a modern browser with `DecompressionStream("deflate-raw")`. Tested primarily with Chromium-based browsers and the included Node.js validation scripts.

See `CHANGELOG.md`, `WATI_CATALOG_SCHEMA_v1.md`, and `SMOKE_TEST.md` for additional details.
