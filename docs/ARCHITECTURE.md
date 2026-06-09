# Arquitectura — Foton CMS

## Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| CMS | Strapi | 4.25.9 |
| Runtime | Node.js | 18+ |
| Base de datos | SQL Server | 2019+ |
| ORM/Query Builder | Knex (via Strapi) | interno |
| Admin UI | React | 18.2.0 |
| Styling Admin | styled-components | 6.x |
| Internacionalización | Strapi i18n plugin | 4.25.9 |
| Autenticación | JWT (Users & Permissions) | built-in |
| Excel Processing | xlsx | 0.18.5 |
| Testing | Jest | 29.x |
| Contenedor | Docker | 20+ |

## Principios de Diseño

1. **Separación de responsabilidades** — Controllers solo manejan request/response. Servicios contienen toda la lógica de negocio.
2. **Validación en backend** — Nunca confiar en el frontend. Toda validación ocurre en servicios.
3. **Respuestas consistentes** — Siempre `{ data: {...}, meta: {...} }`.
4. **Sin secretos hardcodeados** — Todo desde variables de entorno.
5. **Logging estructurado** — `strapi.log.info/warn/error` con contexto.

## Diagrama de Componentes

```
Angular Frontend (port 4200)
        │
        │ HTTP/REST
        ▼
┌─────────────────────────────────┐
│         Strapi CMS (1337)       │
│                                 │
│  ┌────────────┐  ┌────────────┐ │
│  │ REST API   │  │ Admin Panel│ │
│  │ /api/...   │  │ /admin     │ │
│  └─────┬──────┘  └─────┬──────┘ │
│        │               │        │
│  ┌─────▼───────────────▼──────┐ │
│  │      Controllers Layer      │ │
│  └─────────────┬──────────────┘ │
│                │                │
│  ┌─────────────▼──────────────┐ │
│  │       Services Layer        │ │
│  │  (lógica de negocio aquí)  │ │
│  └─────────────┬──────────────┘ │
│                │                │
│  ┌─────────────▼──────────────┐ │
│  │     Entity Service (Knex)   │ │
│  └─────────────┬──────────────┘ │
└────────────────┼────────────────┘
                 │
        ┌────────▼────────┐
        │  SQL Server 2019 │
        │  (foton_strapi)  │
        └─────────────────┘
```

## Content-Types y Relaciones

```
modelo (1) ──────────────── (N) modelo-version
  │
  └──(N) cotizacion
  └──(N) agendamiento

sucursal (1) ──────────────(N) cotizacion
  └──────────────────────(N) agendamiento
```

## Flujo de Importación Excel

```
Usuario sube .xlsx
      │
      ▼
parser.js ──── valida tipo/tamaño ──── extrae filas
      │
      ▼
validator.js ── valida reglas de negocio ── detecta duplicados
      │
      ├── validRows ──── generateToken() ──── retorna preview + token
      └── errorRows ──── retorna errores detallados
                              │
                              ▼
                    Usuario confirma con token
                              │
                              ▼
                    importer.js ── lotes de 20 ── upsert en BD
                              │
                              ▼
                    Resultado: creados/actualizados/fallidos
```

## Roles y Permisos

| Rol | Lectura | Escritura | Importar Excel |
|-----|---------|-----------|----------------|
| Public | ✅ modelos,noticias,sucursales,banners,faqs | ✅ cotizaciones,contactos,agendamientos | ❌ |
| Authenticated | ✅ todo | ✅ todo | ✅ |
| Editor | ✅ todo | ✅ contenido | ✅ |
| Admin | ✅ todo | ✅ todo | ✅ |
| Super Admin | ✅ todo | ✅ todo + config | ✅ |

## Decisiones Técnicas (ADRs)

- [ADR 0001](./ADR/0001-strapi-schema-format.md) — schema.json en lugar de schema.graphql.js
