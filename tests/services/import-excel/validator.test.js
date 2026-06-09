'use strict';

const { validateRows } = require('../../../src/api/import-excel/services/validator');
const modeloFixtures = require('../../__fixtures__/modelos');
const sucursalFixtures = require('../../__fixtures__/sucursales');

describe('Excel Validator', () => {
  describe('validateRows - modelos', () => {
    it('debería validar filas correctas', () => {
      const rows = [
        { _rowNumber: 2, nombre: 'Foton 1827', slug: 'foton-1827', categoria: 'medianos' },
        { _rowNumber: 3, nombre: 'Foton e614', slug: 'foton-e614', categoria: 'electricos' },
      ];

      const result = validateRows(rows, 'modelos');
      expect(result.validRows).toHaveLength(2);
      expect(result.errorRows).toHaveLength(0);
      expect(result.stats.valid).toBe(2);
    });

    it('debería rechazar nombre muy corto', () => {
      const rows = [{ _rowNumber: 2, nombre: 'X', slug: 'x-slug', categoria: 'livianos' }];
      const result = validateRows(rows, 'modelos');
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0]._errors[0]).toContain('nombre');
    });

    it('debería rechazar categoría inválida', () => {
      const rows = [{ _rowNumber: 2, nombre: 'Válido', slug: 'valido', categoria: 'invalida' }];
      const result = validateRows(rows, 'modelos');
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0]._errors[0]).toContain('categoria');
    });

    it('debería detectar duplicados con registros existentes', () => {
      const rows = [{ _rowNumber: 2, nombre: 'Foton 1827', slug: 'foton-existente', categoria: 'medianos' }];
      const existing = [{ slug: 'foton-existente' }];

      const result = validateRows(rows, 'modelos', existing);
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0]._errors[0]).toContain('duplicado');
    });

    it('debería detectar duplicados dentro del mismo archivo', () => {
      const rows = [
        { _rowNumber: 2, nombre: 'Modelo A', slug: 'slug-igual', categoria: 'livianos' },
        { _rowNumber: 3, nombre: 'Modelo B', slug: 'slug-igual', categoria: 'medianos' }, // slug duplicado
      ];

      const result = validateRows(rows, 'modelos');
      expect(result.validRows).toHaveLength(1);
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0]._errors[0]).toContain('duplicado');
    });

    it('debería rechazar precio negativo', () => {
      const rows = [{ _rowNumber: 2, nombre: 'Modelo', slug: 'modelo', categoria: 'livianos', precioDesde: -1000 }];
      const result = validateRows(rows, 'modelos');
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0]._errors[0]).toContain('precioDesde');
    });

    it('debería retornar estadísticas correctas', () => {
      const { excelRows } = modeloFixtures;
      const result = validateRows(excelRows, 'modelos');

      expect(result.stats.total).toBe(excelRows.length);
      expect(result.stats.valid + result.stats.invalid).toBe(excelRows.length);
    });
  });

  describe('validateRows - sucursales', () => {
    it('debería validar sucursal correcta', () => {
      const rows = [{ _rowNumber: 2, nombre: 'Casa Matriz', codigo: 'RM-001' }];
      const result = validateRows(rows, 'sucursales');
      expect(result.validRows).toHaveLength(1);
    });

    it('debería rechazar email inválido', () => {
      const rows = [{ _rowNumber: 2, nombre: 'Sucursal', codigo: 'SC-001', email: 'not-an-email' }];
      const result = validateRows(rows, 'sucursales');
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0]._errors[0]).toContain('email');
    });

    it('debería rechazar latitud fuera de rango', () => {
      const rows = [{ _rowNumber: 2, nombre: 'Sucursal', codigo: 'SC-001', latitud: 999 }];
      const result = validateRows(rows, 'sucursales');
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0]._errors[0]).toContain('latitud');
    });
  });
});
