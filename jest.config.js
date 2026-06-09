'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/', '/.cache/', '/build/', '/dist/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/', '/config/'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/api/**/services/**/*.js',
    'src/api/**/controllers/**/*.js',
    '!src/admin/**',
    '!src/utils/seed.js',
  ],
  setupFiles: ['./tests/setup.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
  globals: {
    strapi: {},
  },
};
