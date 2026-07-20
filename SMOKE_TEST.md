# Quick test — WATI Catalog Builder v1.0.0

1. Open `index.html` in a supported browser.
2. Load a Behavior Pack and its matching Resource Pack.
3. Confirm the detected project identity and pack versions.
4. Switch the interface between ES-MX and EN-US.
5. Export ES-MX only, EN-US only, and both languages.
6. Filter `Solo generados` / `Generated only` and edit one generated name.
7. Confirm the entry changes to manual/edited and remains after filtering or switching preview language.
8. Export the contribution and inspect `content.json`, `localization.json`, and `report.json`.
9. Confirm the edited name uses `manual`, translated names use `lang`, and untouched fallbacks use `generated`.
10. Run the included Node tests when a development environment is available.
