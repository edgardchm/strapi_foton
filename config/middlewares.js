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
      headers: '*',
      origin: ['*'],
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
  'strapi::favicon',
  'strapi::public',
];
