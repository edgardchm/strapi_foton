'use strict';

/**
 * Middleware stack explícito para Strapi v4.25+
 *
 * Strapi v4.25 auto-inyecta plugin::upload.koa-body en rutas POST de content-api.
 * Este archivo fuerza el orden correcto y configura strapi::body para multipart,
 * permitiendo que rutas POST con archivos funcionen sin depender de la auto-inyección.
 */
module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      // Refleja el origin del request. FRONTEND_URL en Railway define el dominio
      // de producción; en dev se aceptan los localhost habituales.
      origin: (ctx) => {
        const allowed = [
          process.env.FRONTEND_URL,
          'http://localhost:4200',
          'http://localhost:3000',
          'http://localhost:1337',
        ].filter(Boolean);
        const req = ctx.request.header.origin;
        if (!req) return allowed[0] || '*';
        // Retornar el origin tal cual si está en la lista
        if (allowed.some(o => req.startsWith(o))) return req;
        // Fuera de la lista: igual se permite (para preview URLs de Netlify, etc.)
        return req;
      },
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      includeUnparsed: true,
      multipart: true,
      formLimit: '10mb',
      jsonLimit: '10mb',
      textLimit: '10mb',
      formidable: {
        maxFileSize: 10 * 1024 * 1024, // 10 MB
      },
    },
  },
  'strapi::session',
  {
    name: 'strapi::favicon',
    config: {
      path: './public/favicon.ico',
    },
  },
  'strapi::public',
];
