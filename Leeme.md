# Foton Chile CMS — Strapi v4.25.9

Backend CMS para el sitio Foton Chile. Stack: Strapi v4 + SQL Server 2019 + Node.js 18.

---

## Requisitos

- Node.js 18+
- SQL Server 2019+ (local o Azure SQL)
- npm 8+
- Docker (opcional)

---

## Instalación

```bash
# 1. Ir a la carpeta
cd "/Users/edgard/Desktop/Repos/sitio foton/strapi"

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.example .env

# 4. Editar .env con credenciales reales de SQL Server
nano .env

# 5. Levantar en desarrollo
npm run develop
```

El servidor levanta en `http://localhost:1337`.  
La primera vez crea las tablas automáticamente en SQL Server.

---

## Variables de Entorno Críticas

```env
DATABASE_HOST=localhost
DATABASE_PORT=1433
DATABASE_NAME=foton_strapi
DATABASE_USERNAME=sa
DATABASE_PASSWORD=<contraseña_real>
APP_KEYS=key1,key2,key3,key4
ADMIN_JWT_SECRET=<secreto_32_chars>
JWT_SECRET=<secreto_32_chars>
API_TOKEN_SALT=<secreto_32_chars>
```

Generar secretos seguros:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

---

## Scripts

```bash
npm run develop      # Desarrollo con hot-reload
npm run start        # Producción
npm run build        # Build del admin panel
npm run test         # Ejecutar tests Jest
npm run test:watch   # Tests en modo watch
npm run test:coverage # Coverage report
npm run lint         # ESLint
npm run format:check # Prettier check
npm run format       # Prettier fix
```

---

## Docker

```bash
# Desde la carpeta strapi/
cd docker

# Levantar todo (Strapi + SQL Server)
docker-compose up -d

# Ver logs
docker-compose logs -f strapi

# Detener
docker-compose down
```

---

## Estructura del Proyecto

```
strapi/
├── src/
│   ├── admin/              # Panel admin personalizado
│   │   ├── app.js          # Entry point admin
│   │   └── extensions/
│   │       └── import-excel/  # UI de importación Excel
│   ├── api/
│   │   ├── modelo/         # Vehículos Foton
│   │   ├── modelo-version/ # Variantes de modelos
│   │   ├── noticia/        # Blog/noticias
│   │   ├── solucion/       # Soluciones de transporte
│   │   ├── sucursal/       # Puntos de atención
│   │   ├── banner/         # Hero/sliders
│   │   ├── pagina/         # Páginas estáticas
│   │   ├── faq/            # Preguntas frecuentes
│   │   ├── cotizacion/     # Formulario cotización
│   │   ├── contacto/       # Formulario contacto
│   │   ├── agendamiento/   # Agenda servicio técnico
│   │   └── import-excel/   # Importación masiva Excel
│   ├── middleware/         # Middlewares globales
│   └── utils/              # Utilidades compartidas
├── config/                 # Configuración Strapi
├── tests/                  # Tests Jest
├── docs/                   # Documentación
├── docker/                 # Dockerfile + docker-compose
├── .env.example
└── package.json
```

---

## URLs Importantes

| URL | Descripción |
|-----|-------------|
| `http://localhost:1337/admin` | Panel de administración |
| `http://localhost:1337/api/modelos` | API modelos |
| `http://localhost:1337/api/noticias` | API noticias |
| `http://localhost:1337/api/sucursales` | API sucursales |
| `http://localhost:1337/documentation` | Swagger/OpenAPI |

---

## APIs disponibles

Ver [`docs/API_FRONTEND.md`](./docs/API_FRONTEND.md) para ejemplos completos.

**Públicas (sin auth):**
- `GET /api/banners`
- `GET /api/modelos`
- `GET /api/noticias`
- `GET /api/soluciones`
- `GET /api/sucursales`
- `GET /api/faqs`
- `GET /api/paginas`
- `POST /api/cotizaciones`
- `POST /api/contactos`
- `POST /api/agendamientos`

**Con autenticación:**
- `POST /api/import-excel/preview`
- `POST /api/import-excel/confirm`

---

## Importación Excel

Ver [`docs/IMPORT_EXCEL.md`](./docs/IMPORT_EXCEL.md) para guía completa.

Tipos soportados: `modelos`, `sucursales`, `noticias`

```bash
# Descargar plantilla
curl http://localhost:1337/api/import-excel/template/modelos -o plantilla-modelos.xlsx
```

---

## Tests

```bash
npm test
# ✅ parser.test.js  (8 tests)
# ✅ validator.test.js (10 tests)
# ✅ importer.test.js (5 tests)
# ✅ cotizacion.test.js (7 tests)
# ✅ agendamiento.test.js (6 tests)
# ✅ token.test.js (7 tests)
```

---

## Decisiones Técnicas

Ver [`docs/ADR/`](./docs/ADR/) para Architecture Decision Records.

- [ADR-0001](./docs/ADR/0001-strapi-schema-format.md): `schema.json` en lugar de `schema.graphql.js`

---

## Arquitectura

Ver [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

**Constitution:** v1.1.5 | **Strapi:** 4.25.9 | **Node:** 18+ | **DB:** SQL Server 2019+
