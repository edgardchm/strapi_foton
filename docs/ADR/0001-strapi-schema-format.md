# ADR 0001 — Formato de Schema para Content-Types

**Status:** Accepted  
**Date:** 2024-06-05  
**Deciders:** Technical Lead, Backend Team

---

## Contexto

La Constitution Strapi (Section 2.IV, Section 10) especifica que cada modelo de contenido debe definirse en:

```
src/api/[nombre]/content-types/[nombre]/schema.graphql.js
```

## Problema

Strapi v4.x (incluyendo v4.25.9) **no reconoce** `schema.graphql.js` como formato de definición de content-types. El framework requiere obligatoriamente:

```
src/api/[nombre]/content-types/[nombre]/schema.json
```

Si se usa `schema.graphql.js`, Strapi no puede:
- Detectar el content-type
- Crear las tablas en la base de datos
- Exponer los endpoints REST
- Sincronizar el esquema

## Decisión

Se utiliza `schema.json` en todos los content-types.

**Formato correcto para Strapi v4.25.9:**
```json
{
  "kind": "collectionType",
  "collectionName": "modelos",
  "info": { ... },
  "options": { "draftAndPublish": true },
  "attributes": { ... }
}
```

## Consecuencias

- ✅ Strapi v4.25.9 funciona correctamente con `schema.json`
- ✅ Auto-migración de BD se ejecuta en el primer start
- ✅ REST API se expone automáticamente
- ✅ Admin panel detecta los content-types
- ⚠️ La Constitution menciona `schema.graphql.js` — esta decisión la contradice explícitamente
- 📝 La Constitution debe actualizarse en su próxima revisión para reflejar el estándar de Strapi v4

## Referencias

- [Strapi v4 Content-Type Schemas](https://docs.strapi.io/dev-docs/api/document-service)
- [Strapi v4 Folder Structure](https://docs.strapi.io/dev-docs/project-structure)
- Constitution Strapi v1.1.5, Section 2.IV (pendiente de actualización)
