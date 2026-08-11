# WATI Catalog Schema v1

WATI Catalog Builder exporta una contribución normalizada sin incluir archivos, código, texturas, modelos ni recursos originales del add-on analizado.

## Archivos

- `source.json`: identidad, versiones, namespaces, alias, licencia, procedencia e idiomas seleccionados.
- `content.json`: objetos, bloques y entidades detectados, con nombres normalizados por idioma.
- `recipes.json`: recetas normalizadas y sus advertencias.
- `acquisition.json`: métodos de obtención detectados.
- `localization.json`: únicamente las claves utilizadas para nombrar el contenido en los idiomas exportados.
- `report.json`: resumen, manifests, evidencia de metadatos y problemas.

## Extensiones compatibles de Builder 1.0.0

El esquema continúa siendo versión 1. Las siguientes propiedades son opcionales para consumidores anteriores:

- `source.primaryLocale`
- `source.exportedLocales`
- `content.primaryLocale`
- `content.exportedLocales`
- `content.*[].names`
- `content.*[].nameSources`
- `content.*[].localizationKeys`
- `localization.primaryLocale`
- `localization.includedLocales`
- `report.summary.namesByLocale`

Los consumidores que solo conocen la primera revisión pueden continuar utilizando `fallbackName`, `localizationKey`, `localizationLocale` y `nameSource`.

## Nombres multilingües

Ejemplo:

```json
{
  "id": "f:microphone",
  "type": "item",
  "fallbackName": "Micrófono",
  "names": {
    "es_MX": "Micrófono",
    "en_US": "Microphone"
  },
  "nameSources": {
    "es_MX": "lang",
    "en_US": "lang"
  }
}
```

`fallbackName` siempre corresponde a `primaryLocale`. Si un idioma no contiene una traducción reconocible, el Builder genera un nombre desde el identifier y registra `generated` en `nameSources`.

El usuario puede exportar:

- solo `es_MX`;
- solo `en_US`;
- ambos idiomas, seleccionando uno como principal.

Cuando se exporta un solo idioma, los objetos `names`, `nameSources`, `localizationKeys` y `localization.locales` se filtran para guardar únicamente ese idioma.

## Limpieza de nombres

Los nombres de contenido se normalizan para retirar:

- códigos de formato `§`;
- glifos privados utilizados como iconos;
- caracteres invisibles;
- espacios artificiales alrededor de corchetes.

No se corrigen automáticamente errores ortográficos o de capitalización presentes en la traducción oficial del add-on.

## Identidad y versiones

`source.version` representa la versión pública mostrada por el proyecto, cuando puede detectarse o verificarse.

`source.manifestVersion` conserva la versión interna del `manifest.json`. Ambas pueden ser diferentes.

## Licencias

`source.licenseStatus` puede ser:

- `not_verified`: no se encontró evidencia suficiente.
- `detected`: se reconoció una licencia en LICENSE/COPYING.
- `user_provided`: el usuario la seleccionó manualmente.

El Builder no garantiza la situación legal de un proyecto; la contribución debe revisarse antes de publicarse.

## Fuentes de nombres

`nameSource` y cada valor de `nameSources` pueden ser:

- `lang`: recuperado de un archivo `.lang`.
- `generated`: creado automáticamente desde el identifier porque no se encontró una traducción.
- `manual`: corregido por una persona dentro de WATI Catalog Builder.

Los nombres `generated` y `manual` no deben presentarse como traducciones oficiales del add-on.
