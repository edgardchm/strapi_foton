'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
const { sanitizeInput } = require('../../../utils/helpers');

module.exports = createCoreService('api::cotizacion.cotizacion', ({ strapi }) => ({
  /**
   * Crea una cotización con validación robusta de negocio.
   * @param {object} data - Datos del formulario + ip
   * @returns {object} cotización creada (sin campos privados)
   */
  async createCotizacion(data) {
    const { nombre, email, telefono, ip, ...rest } = data;

    // ── Validación de campos requeridos ─────────────────────────────
    const errors = [];
    if (!nombre || nombre.trim().length < 2) errors.push('El nombre es requerido (mín. 2 caracteres)');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido');
    if (!telefono || telefono.trim().length < 8) errors.push('Teléfono requerido (mín. 8 dígitos)');

    if (errors.length > 0) {
      const err = new Error(errors.join('; '));
      err.status = 422;
      throw err;
    }

    // ── Sanitización ─────────────────────────────────────────────────
    const sanitized = {
      nombre: sanitizeInput(nombre),
      email: email.toLowerCase().trim(),
      telefono: sanitizeInput(telefono),
      apellido: rest.apellido ? sanitizeInput(rest.apellido) : undefined,
      region: rest.region ? sanitizeInput(rest.region) : undefined,
      mensaje: rest.mensaje ? sanitizeInput(rest.mensaje, 1000) : undefined,
      origen: rest.origen || 'web',
      estado: 'nuevo',
      metadata: {
        userAgent: rest.userAgent || null,
        timestamp: new Date().toISOString(),
      },
      ip,
    };

    // ── Relaciones opcionales ────────────────────────────────────────
    if (rest.modeloInteres) {
      const modelo = await strapi.entityService.findOne('api::modelo.modelo', rest.modeloInteres);
      if (!modelo) {
        const err = new Error(`Modelo con ID ${rest.modeloInteres} no existe`);
        err.status = 422;
        throw err;
      }
      sanitized.modeloInteres = rest.modeloInteres;
    }

    if (rest.sucursal) {
      const sucursal = await strapi.entityService.findOne('api::sucursal.sucursal', rest.sucursal);
      if (!sucursal) {
        const err = new Error(`Sucursal con ID ${rest.sucursal} no existe`);
        err.status = 422;
        throw err;
      }
      sanitized.sucursal = rest.sucursal;
    }

    strapi.log.info('Nueva cotización recibida', { email: sanitized.email, origen: sanitized.origen });

    const cotizacion = await strapi.entityService.create('api::cotizacion.cotizacion', {
      data: sanitized,
    });

    // Retornar sin campos privados
    const { metadata: _m, ip: _ip, ...publicData } = cotizacion;
    return publicData;
  },
}));
