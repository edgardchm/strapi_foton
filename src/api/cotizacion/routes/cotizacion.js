'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/cotizaciones',
      handler: 'cotizacion.create',
      config: {
        auth: false,
        policies: [],
        description: 'Crear solicitud de cotización desde formulario web',
        tag: { plugin: '', name: 'Cotización' },
      },
    },
    // Rutas de admin protegidas por JWT
    {
      method: 'GET',
      path: '/cotizaciones',
      handler: 'cotizacion.find',
      config: {
        policies: [],
        description: 'Listar cotizaciones (requiere autenticación)',
      },
    },
    {
      method: 'GET',
      path: '/cotizaciones/:id',
      handler: 'cotizacion.findOne',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/cotizaciones/:id',
      handler: 'cotizacion.update',
      config: {
        policies: [],
        description: 'Actualizar estado de cotización',
      },
    },
  ],
};
