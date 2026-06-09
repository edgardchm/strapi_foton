'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
const { sanitizeInput } = require('../../../utils/helpers');

module.exports = createCoreService('api::contacto.contacto', ({ strapi }) => ({
  async createContacto(data) {
    const { nombre, email, mensaje, ip, ...rest } = data;

    const errors = [];
    if (!nombre || nombre.trim().length < 2) errors.push('Nombre requerido (mín. 2 caracteres)');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido');
    if (!mensaje || mensaje.trim().length < 10) errors.push('Mensaje requerido (mín. 10 caracteres)');

    if (errors.length > 0) {
      const err = new Error(errors.join('; '));
      err.status = 422;
      throw err;
    }

    const sanitized = {
      nombre: sanitizeInput(nombre),
      email: email.toLowerCase().trim(),
      mensaje: sanitizeInput(mensaje, 2000),
      telefono: rest.telefono ? sanitizeInput(rest.telefono) : undefined,
      asunto: rest.asunto ? sanitizeInput(rest.asunto) : undefined,
      estado: 'nuevo',
      metadata: { timestamp: new Date().toISOString() },
      ip,
    };

    strapi.log.info('Nuevo contacto recibido', { email: sanitized.email });

    const contacto = await strapi.entityService.create('api::contacto.contacto', {
      data: sanitized,
    });

    const { metadata: _m, ip: _ip, ...publicData } = contacto;
    return publicData;
  },
}));
