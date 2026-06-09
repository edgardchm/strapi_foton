'use strict';

/**
 * Error Handler Middleware
 * Captura errores no manejados y retorna respuestas consistentes.
 * Constitution: manejo de errores obligatorio con formato { data, error, meta }
 */
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';

      strapi.log.error('Unhandled error', {
        status,
        message,
        path: ctx.path,
        method: ctx.method,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });

      ctx.status = status;
      ctx.body = {
        data: null,
        error: {
          status,
          name: err.name || 'Error',
          message,
          details: process.env.NODE_ENV === 'development' ? err.details : undefined,
        },
        meta: {},
      };
    }
  };
};
