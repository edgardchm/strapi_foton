'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::agendamiento.agendamiento', ({ strapi }) => ({
  async create(ctx) {
    try {
      const { body } = ctx.request;
      const ip =
        ctx.request.ip ||
        ctx.request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        'unknown';

      const result = await strapi
        .service('api::agendamiento.agendamiento')
        .createAgendamiento({ ...body, ip });

      ctx.body = {
        data: result,
        meta: { message: 'Agendamiento solicitado correctamente. Te confirmaremos pronto.' },
      };
      ctx.status = 201;
    } catch (error) {
      strapi.log.error('Error creando agendamiento', { error: error.message });
      ctx.throw(error.status || 400, error.message);
    }
  },
}));
