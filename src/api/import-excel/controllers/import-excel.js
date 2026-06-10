'use strict';

const { v4: uuidv4 } = require('uuid');
const path = require('path');

const VALID_TYPES = ['sucursal', 'modelo-version'];

module.exports = {
  /**
   * POST /api/import-excel/preview
   * Parsea y valida el archivo; retorna preview sin guardar nada.
   *
   * Body (multipart):
   *   file  — archivo .xlsx, .xls o .csv
   *   type  — 'sucursal' | 'modelo-version'
   *   sheet — (opcional) índice de hoja Excel, default 0
   */
  async preview(ctx) {
    let tempFile = null;

    try {
      const { type = 'modelo-version', sheet = 0 } = ctx.request.body;
      const file = ctx.request.files?.file;

      if (!file) {
        return ctx.throw(400, 'Se requiere un archivo (campo: "file")');
      }

      if (!VALID_TYPES.includes(type)) {
        return ctx.throw(400, `Tipo inválido. Permitidos: ${VALID_TYPES.join(', ')}`);
      }

      const importId = uuidv4();

      strapi.log.info(
        `[IMPORT] Preview iniciado (${type}) por ${ctx.state.importUser.email}`
      );

      // Guardar temp
      const importer = strapi.service('api::import-excel.data-importer');
      const fileBuffer = require('fs').readFileSync(file.filepath || file.path);
      tempFile = importer.saveTempFile(fileBuffer, file.name || file.originalFilename, importId);

      // Obtener servicios
      const excelParser = strapi.service('api::import-excel.excel-parser');
      const csvParser = strapi.service('api::import-excel.csv-parser');
      const validators = strapi.service('api::import-excel.validators');
      const mapper = strapi.service('api::import-excel.data-mapper');

      // Parsear según extensión
      const ext = path.extname(file.name || file.originalFilename || '').toLowerCase();
      let rawRows = [];
      let fileType = null;

      if (ext === '.xlsx' || ext === '.xls') {
        fileType = 'excel';
        const sheets = await excelParser.parseFile(tempFile);
        const sheetIdx = typeof sheet === 'number' ? sheet : parseInt(sheet, 10) || 0;
        const sheetData = sheets[sheetIdx];
        if (!sheetData) {
          return ctx.throw(400, `Hoja ${sheetIdx} no encontrada en el archivo`);
        }
        rawRows = sheetData.rows;
      } else if (ext === '.csv') {
        fileType = 'csv';
        const result = await csvParser.parseFile(tempFile);
        rawRows = result.rows;
      } else {
        return ctx.throw(400, 'Formato no soportado. Use .xlsx, .xls o .csv');
      }

      // Seleccionar schema
      const schema =
        type === 'modelo-version' ? validators.modeloVersionSchema : validators.sucursalSchema;

      // Mapear + validar
      const prepared = importer.prepareImportData(rawRows, validators, mapper, type, schema);

      ctx.status = 200;
      ctx.body = {
        importId,
        status: 'preview',
        type,
        fileType,
        filename: file.name || file.originalFilename,
        fileSize: file.size,
        summary: {
          totalRows: prepared.summary.total,
          mappedRows: prepared.summary.mapped,
          validRows: prepared.summary.valid,
          invalidRows: prepared.summary.invalid,
          readyToImport: prepared.summary.readyToImport,
        },
        preview: {
          validRows: prepared.validRows.slice(0, 5),
          invalidRows: prepared.invalidRows.slice(0, 5),
        },
        statistics: {
          validPercentage:
            prepared.summary.total > 0
              ? Math.round((prepared.summary.valid / prepared.summary.total) * 100)
              : 0,
        },
        user: ctx.state.importUser.email,
        timestamp: new Date().toISOString(),
      };

      strapi.log.info(
        `[IMPORT] Preview completado: ${prepared.summary.valid}/${prepared.summary.total} filas válidas`
      );
    } catch (error) {
      strapi.log.error(`[IMPORT] Error en preview: ${error.message}`);
      ctx.throw(error.status || 400, error.message);
    } finally {
      if (tempFile) {
        const importer = strapi.service('api::import-excel.data-importer');
        importer.cleanTempFile(tempFile);
      }
    }
  },

  /**
   * POST /api/import-excel/confirm
   * Re-sube el mismo archivo y ejecuta la importación real.
   *
   * Body (multipart):
   *   file  — mismo archivo del preview
   *   type  — 'sucursal' | 'modelo-version'
   *   mode  — 'create' | 'update' | 'upsert' (default: upsert)
   *   sheet — (opcional) índice de hoja Excel
   */
  async confirm(ctx) {
    let tempFile = null;

    try {
      const { type = 'modelo-version', mode = 'upsert', sheet = 0 } = ctx.request.body;
      const file = ctx.request.files?.file;

      if (!file) {
        return ctx.throw(400, 'Se requiere un archivo (campo: "file")');
      }

      if (!VALID_TYPES.includes(type)) {
        return ctx.throw(400, `Tipo inválido. Permitidos: ${VALID_TYPES.join(', ')}`);
      }

      if (!['create', 'update', 'upsert'].includes(mode)) {
        return ctx.throw(400, 'Modo inválido. Permitidos: create, update, upsert');
      }

      const importId = uuidv4();
      const fileName = file.name || file.originalFilename;

      strapi.log.info(
        `[IMPORT] Confirm iniciado (${type}, mode=${mode}) por ${ctx.state.importUser.email}`
      );

      const importer = strapi.service('api::import-excel.data-importer');
      const fileBuffer = require('fs').readFileSync(file.filepath || file.path);
      tempFile = importer.saveTempFile(fileBuffer, fileName, importId);

      const excelParser = strapi.service('api::import-excel.excel-parser');
      const csvParser = strapi.service('api::import-excel.csv-parser');
      const validators = strapi.service('api::import-excel.validators');
      const mapper = strapi.service('api::import-excel.data-mapper');

      const ext = path.extname(fileName).toLowerCase();
      let rawRows = [];

      if (ext === '.xlsx' || ext === '.xls') {
        const sheets = await excelParser.parseFile(tempFile);
        const sheetIdx = typeof sheet === 'number' ? sheet : parseInt(sheet, 10) || 0;
        rawRows = sheets[sheetIdx]?.rows || [];
      } else if (ext === '.csv') {
        const result = await csvParser.parseFile(tempFile);
        rawRows = result.rows;
      } else {
        return ctx.throw(400, 'Formato no soportado. Use .xlsx, .xls o .csv');
      }

      const schema =
        type === 'modelo-version' ? validators.modeloVersionSchema : validators.sucursalSchema;

      const prepared = importer.prepareImportData(rawRows, validators, mapper, type, schema);

      if (prepared.validRows.length === 0) {
        return ctx.throw(400, 'No hay filas válidas para importar');
      }

      // Ejecutar importación
      let result;
      const importOptions = {
        mode,
        importId,
        userId: ctx.state.importUser.id,
        userEmail: ctx.state.importUser.email,
        nombreArchivo: fileName,
      };

      if (type === 'modelo-version') {
        result = await importer.importModeloVersions(prepared.validRows, importOptions);
      } else {
        result = await importer.importSucursales(prepared.validRows, importOptions);
      }

      ctx.status = result.errorCount === 0 ? 200 : 207;
      ctx.body = {
        importId: result.importId,
        status: result.status,
        type,
        mode,
        summary: {
          created: result.createdCount,
          updated: result.updatedCount,
          errors: result.errorCount,
          total: result.createdCount + result.updatedCount + result.errorCount,
        },
        errors: result.errors.slice(0, 10),
        totalErrors: result.errors.length,
        user: ctx.state.importUser.email,
        duration: `${((result.completedAt - result.startedAt) / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString(),
      };

      strapi.log.info(
        `[IMPORT] Confirm completado: ${result.createdCount} creados, ${result.updatedCount} actualizados, ${result.errorCount} errores`
      );
    } catch (error) {
      strapi.log.error(`[IMPORT] Error en confirm: ${error.message}`);
      ctx.throw(error.status || 400, error.message);
    } finally {
      if (tempFile) {
        const importer = strapi.service('api::import-excel.data-importer');
        importer.cleanTempFile(tempFile);
      }
    }
  },

  /**
   * GET /api/import-excel/status/:importId
   * Consulta el estado de una importación por su ID.
   */
  async status(ctx) {
    try {
      const { importId } = ctx.params;
      if (!importId) return ctx.throw(400, 'importId requerido');

      const importer = strapi.service('api::import-excel.data-importer');
      const importStatus = await importer.getImportStatus(importId);

      if (!importStatus) return ctx.throw(404, 'Importación no encontrada');

      ctx.status = 200;
      ctx.body = { ...importStatus, timestamp: new Date().toISOString() };
    } catch (error) {
      ctx.throw(error.status || 400, error.message);
    }
  },

  /**
   * GET /api/import-excel/logs
   * Lista logs de importación (paginado).
   */
  async logs(ctx) {
    try {
      const { limit = 50, offset = 0, type } = ctx.query;

      const importer = strapi.service('api::import-excel.data-importer');
      const logsResult = await importer.getImportLogs({
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        type,
      });

      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: logsResult.data,
        pagination: { limit: logsResult.limit, offset: logsResult.offset, count: logsResult.count },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  /**
   * GET /api/import-excel/template/:type
   * Descarga plantilla Excel para el tipo dado.
   */
  async template(ctx) {
    try {
      const { type } = ctx.params;

      if (!VALID_TYPES.includes(type)) {
        return ctx.throw(400, `Tipo inválido. Permitidos: ${VALID_TYPES.join(', ')}`);
      }

      const TEMPLATES = {
        sucursal: [
          ['nombre', 'codigo', 'direccion', 'region', 'comuna', 'telefono', 'email', 'latitud', 'longitud', 'activa', 'orden'],
          ['Casa Matriz', 'CM-001', 'Av. Providencia 1234', 'Metropolitana', 'Providencia', '+56 2 2345 6789', 'contacto@foton.cl', '-33.4372', '-70.6506', 'true', '1'],
        ],
        'modelo-version': [
          ['nombre', 'modelo', 'precio', 'transmision', 'motor', 'combustible', 'potencia', 'torque', 'activo', 'orden'],
          ['Cargo Pro 4x4', 'Tunland', '18990000', 'Manual 6 vel.', '2.8L TDI', 'Diesel', '163', '400', 'true', '1'],
        ],
      };

      const rows = TEMPLATES[type];
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Plantilla');

      rows.forEach((row) => worksheet.addRow(row));

      // Estilo encabezados
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      });
      worksheet.columns.forEach((col) => { col.width = 20; });

      const buffer = await workbook.xlsx.writeBuffer();

      ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      ctx.set('Content-Disposition', `attachment; filename="plantilla-${type}.xlsx"`);
      ctx.body = buffer;
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },
};
