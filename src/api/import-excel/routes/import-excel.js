'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/import-excel/preview',
      handler: 'import-excel.preview',
      config: {
        auth: { scope: ['plugin::users-permissions.user'] },
        policies: [],
        middlewares: ['api::import-excel.import-auth'],
        description: 'Preview importación Excel — requiere admin autenticado',
      },
    },
    {
      method: 'POST',
      path: '/import-excel/confirm',
      handler: 'import-excel.confirm',
      config: {
        auth: { scope: ['plugin::users-permissions.user'] },
        policies: [],
        middlewares: ['api::import-excel.import-auth'],
        description: 'Confirmar e importar Excel — requiere admin autenticado',
      },
    },
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
