'use strict';

module.exports = ({ env }) => ({
  // ── i18n ──────────────────────────────────────────────────────────
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'es',
      locales: ['es', 'en', 'fr'],
    },
  },

  // ── Users & Permissions ───────────────────────────────────────────
  'users-permissions': {
    enabled: true,
    config: {
      jwt: {
        expiresIn: env('JWT_EXPIRES_IN', '30d'),
      },
      jwtSecret: env('JWT_SECRET'),
    },
  },

  // ── Documentation (OpenAPI/Swagger) ───────────────────────────────
  documentation: {
    enabled: true,
    config: {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Foton Chile CMS API',
        description: 'API REST para el CMS Foton Chile — Kaufmann',
        contact: {
          name: 'Equipo Foton Chile',
          email: 'dev@fotonchile.cl',
        },
        license: {
          name: 'UNLICENSED',
        },
      },
      'x-strapi-config': {
        mutateDocumentation: (generatedDocumentationDraft) => generatedDocumentationDraft,
      },
      servers: [
        { url: 'http://localhost:1337', description: 'Development' },
        { url: 'https://api.fotonchile.cl', description: 'Production' },
      ],
    },
  },

  // ── Upload ────────────────────────────────────────────────────────
  upload: {
    config: {
      sizeLimit: env.int('MAX_IMPORT_FILE_SIZE', 5242880), // 5MB default
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64,
      },
    },
  },
});
