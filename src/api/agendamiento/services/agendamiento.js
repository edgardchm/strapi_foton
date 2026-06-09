'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
const { sanitizeInput } = require('../../../utils/helpers');

module.exports = createCoreService('api::agendamiento.agendamiento', ({ strapi }) => ({
  async createAgendamiento(data) {
    const { nombre, telefono, ip, ...rest } = data;

    const errors = [];
    if (!nombre || nombre.trim().length < 2) errors.push('Nombre requerido (mín. 2 caracteres)');
    if (!telefono || telefono.trim().length < 8) errors.push('Teléfono requerido (mín. 8 dígitos)');
    if (rest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rest.email)) {
      errors.push('Email inválido');
    }
    if (rest.fecha) {
      const d = new Date(rest.fecha);
      if (isNaN(d.getTime())) errors.push('Fecha inválida');
      if (d < new Date()) errors.push('La fecha no puede ser en el pasado');
    }

    if (errors.length > 0) {
      const err = new Error(errors.join('; '));
      err.status = 422;
      throw err;
    }

    const sanitized = {
      nombre: sanitizeInput(nombre),
      telefono: sanitizeInput(telefono),
      email: rest.email ? rest.email.toLowerCase().trim() : undefined,
      patente: rest.patente ? sanitizeInput(rest.patente).toUpperCase() : undefined,
      servicio: rest.servicio ? sanitizeInput(rest.servicio) : undefined,
      observaciones: rest.observaciones ? sanitizeInput(rest.observaciones, 1000) : undefined,
      fecha: rest.fecha || undefined,
      hora: rest.hora || undefined,
      kilometraje: rest.kilometraje ? parseInt(rest.kilometraje) : undefined,
      estado: 'solicitado',
      metadata: { timestamp: new Date().toISOString() },
      ip,
    };

    if (rest.modelo) {
      const modelo = await strapi.entityService.findOne('api::modelo.modelo', rest.modelo);
      if (!modelo) {
        const err = new Error(`Modelo ID ${rest.modelo} no existe`);
        err.status = 422;
        throw err;
      }
      sanitized.modelo = rest.modelo;
    }

    if (rest.sucursal) {
      const sucursal = await strapi.entityService.findOne('api::sucursal.sucursal', rest.sucursal);
      if (!sucursal || !sucursal.activa) {
        const err = new Error(`Sucursal ID ${rest.sucursal} no existe o no está activa`);
        err.status = 422;
        throw err;
      }
      sanitized.sucursal = rest.sucursal;
    }

    strapi.log.info('Nuevo agendamiento solicitado', {
      telefono: sanitized.telefono,
      fecha: sanitized.fecha,
    });

    const agendamiento = await strapi.entityService.create('api::agendamiento.agendamiento', {
      data: sanitized,
    });

    const { metadata: _m, ip: _ip, ...publicData } = agendamiento;
    return publicData;
  },
}));
