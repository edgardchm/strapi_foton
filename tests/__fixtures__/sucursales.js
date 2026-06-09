'use strict';

module.exports = {
  valid: {
    nombre: 'Casa Matriz Pudahuel',
    codigo: 'RM-001',
    direccion: 'Av. Vespucio 760',
    region: 'Región Metropolitana',
    email: 'test@fotonchile.cl',
    latitud: -33.4467,
    longitud: -70.7583,
    activa: true,
  },
  invalid: {
    nombre: 'X', // muy corto
    email: 'not-an-email',
  },
  excelRows: [
    { _rowNumber: 2, nombre: 'Sucursal 1', codigo: 'SC-001', email: 'ok@test.cl', latitud: -33.4, longitud: -70.6 },
    { _rowNumber: 3, nombre: 'S', codigo: 'SC-002' }, // nombre muy corto
    { _rowNumber: 4, nombre: 'Sin código', codigo: '' }, // código vacío
    { _rowNumber: 5, nombre: 'Email malo', codigo: 'SC-004', email: 'not-email' },
    { _rowNumber: 6, nombre: 'Lat mala', codigo: 'SC-005', latitud: 999, longitud: -70 },
  ],
};
