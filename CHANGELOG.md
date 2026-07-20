# WATI Catalog Builder — Changelog

Versions below v1.0.0 were test betas. Major versions are official public releases.

## v1.0.0 — Official release

- Promotes the tested Beta v0.4.0 code to the first official Catalog Builder release.
- Analyzes local `.mcaddon`, `.mcpack`, and `.zip` files without uploading them to a server.
- Opens nested packs and identifies Behavior Packs and Resource Packs through their manifests.
- Detects project identity, author evidence, public and manifest versions, namespaces, aliases, common license files, and official URLs.
- Extracts items, blocks, entities, Mexican Spanish / US English names, recipes, and direct block/entity loot relationships.
- Supports shaped, shapeless, furnace, brewing, and smithing recipes plus common legacy vanilla item normalization.
- Detects invalid JSON, duplicate definitions, missing loot references, oversized recipes, trailing spaces, and missing Resource Packs.
- Exports Spanish, English, or bilingual WATI Catalog Schema v1 contributions.
- Marks each name as translated, generated, or manually reviewed.
- Warns about missing translations, filters entries by name origin, and allows generated names to be edited before export.
- Exports `source.json`, `content.json`, `recipes.json`, `acquisition.json`, `localization.json`, `report.json`, schemas, and a contribution README.

## Beta v0.4.0

- Added warnings for missing localized names.
- Added translated/generated/manual name filters.
- Added direct editing for generated names and preserved edits as `manual` metadata.

## Beta v0.3.0

- Added bilingual ES-MX / EN-US interface and configurable language export.
- Added primary-language and preview-language selection.
- Added per-language names, sources, and localization keys.
- Cleaned Minecraft formatting codes, private-use icon glyphs, and invisible characters from displayed names.

## Beta v0.2.0

- Improved project-name, author, public-version, manifest-version, source-ID, license, URL, and BP/RP detection.
- Added metadata evidence and warnings for incomplete pack pairs.
- Distinguished equivalent duplicate definitions from conflicting duplicates.
- Added safer decompression limits and expanded automated tests.

## Beta v0.1.0

- First functional local web prototype.
- Added drag-and-drop analysis, nested ZIP handling, manifest detection, content extraction, recipe extraction, direct loot extraction, issue reporting, and WATI Catalog Schema v1 ZIP export.
