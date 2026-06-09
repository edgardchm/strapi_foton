'use strict';

/**
 * Sanitiza entrada de texto: recorta, escapa caracteres peligrosos.
 * @param {string} value
 * @param {number} maxLength
 * @returns {string}
 */
function sanitizeInput(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML
    .replace(/[<>"'&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c]))
    .slice(0, maxLength);
}

/**
 * Genera un slug URL-friendly desde un string.
 * @param {string} str
 * @returns {string}
 */
function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Pagina un array en memoria.
 * @param {any[]} items
 * @param {number} page
 * @param {number} pageSize
 */
function paginate(items, page = 1, pageSize = 25) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return {
    data,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total,
      },
    },
  };
}

/**
 * Formatea error para respuesta consistente.
 */
function formatError(error, defaultMessage = 'Error interno') {
  return {
    error: {
      status: error.status || 500,
      name: error.name || 'ApplicationError',
      message: error.message || defaultMessage,
    },
  };
}

module.exports = { sanitizeInput, toSlug, paginate, formatError };
