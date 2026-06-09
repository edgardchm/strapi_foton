'use strict';

const { generateToken, validateAndConsumeToken, clearTokens } = require('../../src/api/import-excel/services/token');

describe('Import Token Service', () => {
  beforeEach(() => clearTokens());

  it('debería generar token con formato hexadecimal de 64 chars', () => {
    const { token } = generateToken('modelos', [], {});
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('debería retornar fecha de expiración en el futuro', () => {
    const { expiresAt } = generateToken('modelos', [], {});
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('debería validar y consumir token correctamente', () => {
    const validRows = [{ id: 1 }, { id: 2 }];
    const { token } = generateToken('sucursales', validRows, { valid: 2 });

    const result = validateAndConsumeToken(token);
    expect(result.type).toBe('sucursales');
    expect(result.validRows).toHaveLength(2);
  });

  it('debería ser single-use: error en segundo uso', () => {
    const { token } = generateToken('modelos', [], {});
    validateAndConsumeToken(token); // primer uso OK

    expect(() => validateAndConsumeToken(token)).toThrow('ya fue utilizado');
  });

  it('debería lanzar error con token inválido', () => {
    expect(() => validateAndConsumeToken('token-falso')).toThrow('Token inválido');
  });

  it('debería lanzar error sin token', () => {
    expect(() => validateAndConsumeToken(null)).toThrow('requerido');
  });

  it('debería retornar validCount correcto', () => {
    const rows = [{}, {}, {}];
    const result = generateToken('noticias', rows, { valid: 3 });
    expect(result.validCount).toBe(3);
  });
});
