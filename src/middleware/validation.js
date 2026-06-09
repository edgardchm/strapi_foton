'use strict';

const { sanitizeInput } = require('../utils/helpers');

/**
 * Validation Middleware — sanitiza y valida inputs globales.
 * Constitution: TODA validación debe ocurrir en el servidor.
 */
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Sanitizar string fields del body para prevenir XSS
    if (ctx.request.body && typeof ctx.request.body === 'object') {
      ctx.request.body = deepSanitize(ctx.request.body);
    }

    // Validar Content-Type en requests POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(ctx.method)) {
      const contentType = ctx.request.headers['content-type'] || '';
      const isMultipart = contentType.includes('multipart/form-data');
      const isJson = contentType.includes('application/json');

      if (!isMultipart && !isJson && ctx.request.rawBody) {
        strapi.log.warn('Request without proper Content-Type', {
          method: ctx.method,
          path: ctx.path,
          contentType,
        });
      }
    }

    await next();
  };
};

/**
 * Sanitiza recursivamente los valores string de un objeto.
 * @param {object} obj
 * @returns {object}
 */
function deepSanitize(obj) {
  if (typeof obj === 'string') return sanitizeInput(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepSanitize(value);
    }
    return result;
  }
  return obj;
}
