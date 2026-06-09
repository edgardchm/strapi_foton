'use strict';

const { importRecords } = require('../../../src/api/import-excel/services/importer');

describe('Excel Importer', () => {
  beforeEach(() => {
    // Reset mock implementations
    strapi.entityService.findMany.mockResolvedValue([]);
    strapi.entityService.create.mockResolvedValue({ id: 1, nombre: 'Test' });
    strapi.entityService.update.mockResolvedValue({ id: 1, nombre: 'Updated' });
  });

  describe('importRecords - modelos', () => {
    it('debería crear registros nuevos', async () => {
      const rows = [
        { nombre: 'Foton 1827', slug: 'foton-1827', categoria: 'medianos', _rowNumber: 2 },
        { nombre: 'Foton e614', slug: 'foton-e614', categoria: 'electricos', _rowNumber: 3 },
      ];

      strapi.entityService.findMany.mockResolvedValue([]); // no existen

      const result = await importRecords('modelos', rows, strapi);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      expect(strapi.entityService.create).toHaveBeenCalledTimes(2);
    });

    it('debería actualizar registros existentes', async () => {
      const rows = [
        { nombre: 'Foton 1827 Updated', slug: 'foton-1827', categoria: 'medianos', _rowNumber: 2 },
      ];

      // El registro YA existe
      strapi.entityService.findMany.mockResolvedValue([{ id: 5, slug: 'foton-1827' }]);

      const result = await importRecords('modelos', rows, strapi);

      expect(result.updated).toBe(1);
      expect(result.created).toBe(0);
      expect(strapi.entityService.update).toHaveBeenCalledWith(
        'api::modelo.modelo',
        5,
        expect.any(Object)
      );
    });

    it('debería manejar errores por fila sin detener otros', async () => {
      const rows = [
        { nombre: 'OK', slug: 'ok-slug', categoria: 'medianos', _rowNumber: 2 },
        { nombre: 'Fail', slug: 'fail-slug', categoria: 'livianos', _rowNumber: 3 },
      ];

      strapi.entityService.findMany.mockResolvedValue([]);
      strapi.entityService.create
        .mockResolvedValueOnce({ id: 1 }) // primera fila OK
        .mockRejectedValueOnce(new Error('DB error')); // segunda fila falla

      const result = await importRecords('modelos', rows, strapi);

      expect(result.created).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(3);
    });

    it('debería rechazar tipo desconocido', async () => {
      await expect(importRecords('unknown', [], strapi)).resolves.toEqual(
        expect.objectContaining({ created: 0, failed: 0 })
      );
    });
  });

  describe('importRecords - sucursales', () => {
    it('debería crear sucursales con código normalizado', async () => {
      const rows = [
        { nombre: 'Sucursal Test', codigo: 'sc-001', _rowNumber: 2 },
      ];
      strapi.entityService.findMany.mockResolvedValue([]);

      const result = await importRecords('sucursales', rows, strapi);
      expect(result.created).toBe(1);
      // El código debe normalizarse a mayúsculas
      expect(strapi.entityService.create).toHaveBeenCalledWith(
        'api::sucursal.sucursal',
        expect.objectContaining({
          data: expect.objectContaining({ codigo: 'SC-001' }),
        })
      );
    });
  });
});
