'use strict';

module.exports = ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'dl.airtable.com'],
          'media-src': ["'self'", 'data:', 'blob:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: env.array('CORS_ORIGIN', ['http://localhost:4200', 'http://localhost:1337']),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      multipart: true,
      formidable: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
