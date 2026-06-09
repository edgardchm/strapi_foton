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
        description: 'Preview importación Excel — requiere autenticación',
        middlewares: ['plugin::upload.koa-body'],
      },
    },
    {
      method: 'POST',
      path: '/import-excel/confirm',
      handler: 'import-excel.confirm',
      config: {
        auth: { scope: ['plugin::users-permissions.user'] },
        policies: [],
        description: 'Confirmar e importar Excel — requiere token de preview',
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
