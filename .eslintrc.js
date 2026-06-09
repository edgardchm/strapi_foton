'use strict';

module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    eqeqeq: ['error', 'always'],
    'no-throw-literal': 'error',
    'handle-callback-err': 'error',
  },
  overrides: [
    {
      files: ['src/admin/**/*.jsx', 'src/admin/**/*.js'],
      env: {
        browser: true,
        es2020: true,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      rules: {
        'no-undef': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'build/', 'dist/', '.cache/', 'public/'],
};
