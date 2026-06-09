'use strict';

const XLSX = require('xlsx');
const { parseExcel } = require('../../../src/api/import-excel/services/parser');

/**
 * Tests para el parser de Excel.
 * Cubre: parseo correcto, tipo inválido, tamaño excedido, archivo vacío.
 */

function createExcelBuffer(rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

describe('Excel Parser', () => {
  describe('parseExcel - modelos', () => {
    it('debería parsear filas válidas correctamente', () => {
      const buffer = createExcelBuffer([
        ['nombre', 'slug', 'categoria', 'precioDesde'],
        ['Foton 1827', 'foton-1827', 'medianos', 41990000],
        ['Foton e614', 'foton-e614', 'electricos', 44990000],
      ]);

      const result = parseExcel(buffer, 'modelos', buffer.length);

      expect(result.totalRows).toBe(2);
      expect(result.rows[0].nombre).toBe('Foton 1827');
      expect(result.rows[0].slug).toBe('foton-1827');
      expect(result.rows[0].categoria).toBe('medianos');
      expect(result.rows[0]._rowNumber).toBe(2);
    });

    it('debería retornar columnas requeridas del tipo', () => {
      const buffer = createExcelBuffer([
        ['nombre', 'slug', 'categoria'],
        ['Test', 'test', 'livianos'],
      ]);

      const result = parseExcel(buffer, 'modelos', buffer.length);
      expect(result.columns.required).toContain('nombre');
      expect(result.columns.required).toContain('slug');
      expect(result.columns.required).toContain('categoria');
    });

    it('debería lanzar error si tipo es inválido', () => {
      const buffer = createExcelBuffer([['col1'], ['val1']]);
      expect(() => parseExcel(buffer, 'invalido', buffer.length)).toThrow(
        'Tipo de importación inválido'
      );
    });

    it('debería lanzar error si tamaño excede máximo', () => {
      const buffer = createExcelBuffer([['col1'], ['val1']]);
      expect(() => parseExcel(buffer, 'modelos', 10 * 1024 * 1024)).toThrow(
        'Archivo demasiado grande'
      );
    });

    it('debería lanzar error si no hay datos', () => {
      const buffer = createExcelBuffer([['nombre', 'slug', 'categoria']]);
      expect(() => parseExcel(buffer, 'modelos', buffer.length)).toThrow(
        'no contiene datos'
      );
    });

    it('debería ignorar filas completamente vacías', () => {
      const buffer = createExcelBuffer([
        ['nombre', 'slug', 'categoria'],
        ['Foton 1827', 'foton-1827', 'medianos'],
        [null, null, null], // fila vacía
        ['Foton e614', 'foton-e614', 'electricos'],
      ]);

      const result = parseExcel(buffer, 'modelos', buffer.length);
      expect(result.totalRows).toBe(2);
    });
  });

  describe('parseExcel - sucursales', () => {
    it('debería parsear sucursales correctamente', () => {
      const buffer = createExcelBuffer([
        ['nombre', 'codigo', 'region'],
        ['Sucursal Santiago', 'SCL-001', 'RM'],
      ]);

      const result = parseExcel(buffer, 'sucursales', buffer.length);
      expect(result.totalRows).toBe(1);
      expect(result.rows[0].codigo).toBe('SCL-001');
    });
  });
});
