'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::cotizacion.cotizacion', ({ strapi }) => ({
  /**
   * POST /api/cotizaciones
   * Crea una nueva solicitud de cotización desde el formulario web.
   * Valida, sanitiza y persiste. Lógica de negocio en service.
   */
  async create(ctx) {
    try {
      const { body } = ctx.request;

      // Capturar IP para auditoría (nunca exponer al cliente)
      const ip =
        ctx.request.ip ||
        ctx.request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        'unknown';

      const result = await strapi
        .service('api::cotizacion.cotizacion')
        .createCotizacion({ ...body, ip });

      ctx.body = {
        data: result,
        meta: { message: 'Cotización recibida correctamente. Te contactaremos pronto.' },
      };
      ctx.status = 201;
    } catch (error) {
      strapi.log.error('Error creando cotización', { error: error.message });
      ctx.throw(error.status || 400, error.message);
    }
  },
}));
