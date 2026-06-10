'use strict';

/**
 * import-excel routes
 *
 * NOTE: Las rutas POST (preview/confirm) están deshabilitadas temporalmente
 * porque Strapi v4.25 auto-inyecta plugin::upload.koa-body en rutas POST de
 * content-api, y ese middleware no se registra antes de la resolución de rutas.
 * El flujo de importación se maneja actualmente vía seeder script (scripts/seed.js).
 * Para rehabilitar: mover estas rutas a un plugin admin con type: 'admin'.
 */
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/import-excel/status/:importId',
      handler: 'import-excel.status',
      config: {
        auth: { scope: ['plugin::users-permissions.user'] },
        policies: [],
        middlewares: ['api::import-excel.import-auth'],
        description: 'Consultar estado de una importación',
      },
    },
    {
      method: 'GET',
      path: '/import-excel/logs',
      handler: 'import-excel.logs',
      config: {
        auth: { scope: ['plugin::users-permissions.user'] },
        policies: [],
        middlewares: ['api::import-excel.import-auth'],
        description: 'Listar logs de importaciones',
      },
    },
    {
      method: 'GET',
      path: '/import-excel/template/:type',
      handler: 'import-excel.template',
      config: {
        auth: false,
        description: 'Descargar plantilla Excel para importación',
      },
    },
  ],
};
