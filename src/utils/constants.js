'use strict';

module.exports = {
  IMPORT_TYPES: ['sucursal', 'modelo-version'],
  MAX_IMPORT_FILE_SIZE: 10485760, // 10MB
  ALLOWED_IMPORT_EXTENSIONS: ['xlsx', 'xls', 'csv'],

  ESTADOS_COTIZACION: ['nuevo', 'contactado', 'cerrado', 'descartado'],
  ESTADOS_CONTACTO: ['nuevo', 'leido', 'respondido'],
  ESTADOS_AGENDAMIENTO: ['solicitado', 'confirmado', 'cancelado', 'realizado'],

  CATEGORIAS_MODELO: ['livianos', 'medianos', 'pesados', 'electricos'],
  CATEGORIAS_SOLUCION: ['urbano', 'distribucion', 'industrial', 'construccion', 'electromovilidad', 'flotas'],

  DEFAULT_LOCALE: 'es',
  LOCALES: ['es', 'en', 'fr'],

  IMPORT_BATCH_SIZE: 20,
  TOKEN_TTL_MINUTES: 15,
};
