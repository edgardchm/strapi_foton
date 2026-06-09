'use strict';

/**
 * Global test setup — corre ANTES de que Jest cargue el framework.
 * Solo define globales; no usa beforeEach ni describe.
 */

// Mock global de strapi para tests de servicios
global.strapi = {
  entityService: {
    findOne: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
};
