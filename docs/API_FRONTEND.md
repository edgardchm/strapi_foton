# API Frontend — Foton CMS

Endpoints que el frontend Angular consumirá desde `http://localhost:1337`.

## Base URL
```
Development: http://localhost:1337/api
Production:  https://api.fotonchile.cl/api
```

## Autenticación
Los endpoints de lectura pública NO requieren token.
Los endpoints de escritura y admin requieren header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints Públicos (GET)

### Banners / Hero
```http
GET /api/banners?populate=*&filters[activo][$eq]=true&sort=orden:asc
```
**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "titulo": "Innovación en Movimiento",
        "subtitulo": "Tecnología de primer nivel",
        "ctaTexto": "Ver Modelos",
        "ctaUrl": "/modelos",
        "imagenDesktop": { "data": { "attributes": { "url": "/uploads/banner-1.jpg" } } },
        "activo": true,
        "orden": 1
      }
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 25, "total": 1 } }
}
```

### Modelos
```http
GET /api/modelos?populate=*&filters[activo][$eq]=true&sort=orden:asc
GET /api/modelos/:id?populate=*
GET /api/modelos?filters[categoria][$eq]=electricos&populate=*
```

### Versiones de Modelos
```http
GET /api/modelo-versions?filters[modelo][id][$eq]=1&populate=*
```

### Noticias
```http
GET /api/noticias?populate=*&filters[activa][$eq]=true&sort=fechaPublicacion:desc&pagination[pageSize]=9
GET /api/noticias/:id?populate=*
GET /api/noticias?filters[destacada][$eq]=true&populate=*
```

### Soluciones
```http
GET /api/soluciones?populate=*&filters[activa][$eq]=true&sort=orden:asc
```

### Sucursales
```http
GET /api/sucursales?filters[activa][$eq]=true&sort=orden:asc
```

### FAQs
```http
GET /api/faqs?filters[activa][$eq]=true&sort[0]=categoria:asc&sort[1]=orden:asc
```

### Páginas Estáticas
```http
GET /api/paginas?filters[slug][$eq]=nosotros&populate=*
GET /api/paginas?filters[tipo][$eq]=faq&populate=*
```

---

## Endpoints de Formularios (POST — públicos)

### Cotización
```http
POST /api/cotizaciones
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@empresa.cl",
  "telefono": "56912345678",
  "modeloInteres": 3,
  "region": "Región Metropolitana",
  "sucursal": 1,
  "mensaje": "Interesado en financiamiento"
}
```
**Response 201:**
```json
{
  "data": { "id": 15, "nombre": "Juan Pérez", "estado": "nuevo" },
  "meta": { "message": "Cotización recibida correctamente. Te contactaremos pronto." }
}
```

### Contacto
```http
POST /api/contactos
Content-Type: application/json

{
  "nombre": "María González",
  "email": "maria@gmail.com",
  "asunto": "Consulta técnica",
  "mensaje": "Quisiera saber sobre el servicio post-venta..."
}
```

### Agendamiento
```http
POST /api/agendamientos
Content-Type: application/json

{
  "nombre": "Carlos Silva",
  "telefono": "56987654321",
  "patente": "ABCD12",
  "modelo": 2,
  "servicio": "Mantención preventiva",
  "sucursal": 1,
  "fecha": "2025-07-15",
  "hora": "10:00"
}
```

---

## Importación Excel (Requiere JWT)

### Preview
```http
POST /api/import-excel/preview
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data

file: <archivo.xlsx>
type: modelos | sucursales | noticias
```

### Confirmar
```http
POST /api/import-excel/confirm
Authorization: Bearer <TOKEN>
Content-Type: application/json

{ "token": "<token-del-preview>" }
```

### Descargar Plantilla
```http
GET /api/import-excel/template/modelos
GET /api/import-excel/template/sucursales
GET /api/import-excel/template/noticias
```

---

## Paginación
```http
GET /api/modelos?pagination[page]=1&pagination[pageSize]=9
```

## i18n
```http
GET /api/modelos?locale=en
GET /api/noticias?locale=fr
```

## Docs Swagger
```
http://localhost:1337/documentation
```
