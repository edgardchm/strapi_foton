'use strict';

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

/**
 * Data Importer Service — Fotón
 * Adaptado de Soueast. Importa sucursales y versiones de modelo.
 */
module.exports = {
  /**
   * Prepara datos crudos del parser: mapea columnas → valida → devuelve summary.
   */
  prepareImportData(rawRows, validators, mapper, collectionType, schema) {
    const mappedRows = mapper.mapRows(rawRows, collectionType);
    const mappingErrors = mappedRows.filter((r) => r.error);

    const validationResult = validators.validateRows(
      mappedRows.filter((r) => !r.error).map((r) => r.mapped),
      schema
    );

    return {
      totalRows: rawRows.length,
      mappedRows: mappedRows.filter((r) => !r.error).length,
      mappingErrors,
      validRows: validationResult.validRows.map((r) => r.data),
      invalidRows: validationResult.invalidRows,
      summary: {
        total: rawRows.length,
        mapped: mappedRows.filter((r) => !r.error).length,
        valid: validationResult.totalValid,
        invalid: validationResult.totalInvalid,
        readyToImport: validationResult.totalValid,
      },
    };
  },

  /**
   * Importa versiones de modelo.
   * Upsert por (nombre + modelo), create si no existe.
   */
  async importModeloVersions(validRows, options = {}) {
    const {
      mode = 'upsert',
      importId = uuidv4(),
      userId = null,
      userEmail = null,
      nombreArchivo = 'desconocido',
    } = options;

    const result = {
      importId,
      status: 'procesando',
      mode,
      createdCount: 0,
      updatedCount: 0,
      errorCount: 0,
      errors: [],
      startedAt: new Date(),
    };

    const service = strapi.entityService;
    const modeloCache = new Map();

    for (let i = 0; i < validRows.length; i++) {
      const rowData = validRows[i];
      const { _rowNumber, modelo: modeloNombre, ...fields } = rowData;

      try {
        // Resolver modelo por nombre (con caché)
        let modeloId = modeloCache.get(modeloNombre);
        if (!modeloId) {
          const modelos = await service.findMany('api::modelo.modelo', {
            filters: { nombre: { $containsi: modeloNombre } },
            limit: 1,
          });
          if (!modelos.length) {
            throw new Error(`Modelo no encontrado: "${modeloNombre}"`);
          }
          modeloId = modelos[0].id;
          modeloCache.set(modeloNombre, modeloId);
        }

        const dataToSave = {
          ...fields,
          modelo: modeloId,
        };

        // Buscar registro existente (por nombre + modelo)
        let existing = null;
        if (mode !== 'create' && fields.nombre) {
          const found = await service.findMany('api::modelo-version.modelo-version', {
            filters: { nombre: fields.nombre, modelo: modeloId },
            limit: 1,
          });
          if (found.length) existing = found[0];
        }

        if (existing && (mode === 'update' || mode === 'upsert')) {
          await service.update('api::modelo-version.modelo-version', existing.id, {
            data: dataToSave,
          });
          result.updatedCount++;
        } else if (!existing && mode !== 'update') {
          await service.create('api::modelo-version.modelo-version', {
            data: { ...dataToSave, publishedAt: new Date() },
          });
          result.createdCount++;
        } else if (mode === 'update' && !existing) {
          throw new Error(`Registro no encontrado para actualizar (nombre: ${fields.nombre})`);
        }
      } catch (err) {
        result.errorCount++;
        result.errors.push({ rowIndex: i, rowNumber: _rowNumber, error: err.message, data: rowData });
      }
    }

    result.status = result.errorCount === 0 ? 'completada' : 'completada_con_errores';
    result.completedAt = new Date();
    result.duration = result.completedAt - result.startedAt;

    await this._logImport('modelo-version', result, { userId, userEmail, nombreArchivo });

    return result;
  },

  /**
   * Importa sucursales. Upsert por `codigo` (campo único).
   */
  async importSucursales(validRows, options = {}) {
    const {
      mode = 'upsert',
      importId = uuidv4(),
      userId = null,
      userEmail = null,
      nombreArchivo = 'desconocido',
    } = options;

    const result = {
      importId,
      status: 'procesando',
      mode,
      createdCount: 0,
      updatedCount: 0,
      errorCount: 0,
      errors: [],
      startedAt: new Date(),
    };

    const service = strapi.entityService;

    for (let i = 0; i < validRows.length; i++) {
      const { _rowNumber, ...dataToSave } = validRows[i];

      try {
        let existing = null;
        if (mode !== 'create' && dataToSave.codigo) {
          const found = await service.findMany('api::sucursal.sucursal', {
            filters: { codigo: dataToSave.codigo },
            limit: 1,
          });
          if (found.length) existing = found[0];
        }

        if (existing && (mode === 'update' || mode === 'upsert')) {
          await service.update('api::sucursal.sucursal', existing.id, { data: dataToSave });
          result.updatedCount++;
        } else if (!existing && mode !== 'update') {
          await service.create('api::sucursal.sucursal', { data: dataToSave });
          result.createdCount++;
        } else if (mode === 'update' && !existing) {
          throw new Error(`Sucursal no encontrada para actualizar (codigo: ${dataToSave.codigo})`);
        }
      } catch (err) {
        result.errorCount++;
        result.errors.push({ rowIndex: i, rowNumber: _rowNumber, error: err.message, data: validRows[i] });
      }
    }

    result.status = result.errorCount === 0 ? 'completada' : 'completada_con_errores';
    result.completedAt = new Date();
    result.duration = result.completedAt - result.startedAt;

    await this._logImport('sucursal', result, { userId, userEmail, nombreArchivo });

    return result;
  },

  /**
   * Guarda registro en import-log (auditoría).
   * @private
   */
  async _logImport(collectionType, result, meta = {}) {
    try {
      await strapi.entityService.create('api::import-log.import-log', {
        data: {
          import_id: result.importId,
          nombre_archivo: meta.nombreArchivo || 'desconocido',
          tipo_importacion: collectionType,
          modo_importacion: result.mode,
          estado: result.status,
          registros_creados: result.createdCount,
          registros_actualizados: result.updatedCount,
          filas_con_error: result.errorCount,
          duracion_ms: result.duration,
          errores: result.errors,
          usuario_email: meta.userEmail || null,
          fecha_confirmacion: new Date(),
          metadata: {
            userId: meta.userId,
            startedAt: result.startedAt,
          },
        },
      });
    } catch (err) {
      strapi.log.warn(`[DataImporter] No se pudo guardar import-log: ${err.message}`);
    }
  },

  /**
   * Consulta un log de importación por su ID.
   */
  async getImportStatus(importId) {
    try {
      const logs = await strapi.entityService.findMany('api::import-log.import-log', {
        filters: { import_id: importId },
        limit: 1,
      });
      if (!logs.length) return null;
      const log = logs[0];
      return {
        importId: log.import_id,
        status: log.estado,
        type: log.tipo_importacion,
        created: log.registros_creados,
        updated: log.registros_actualizados,
        errors: log.filas_con_error,
        mode: log.modo_importacion,
        duration: log.duracion_ms,
        createdAt: log.createdAt,
      };
    } catch (err) {
      strapi.log.error(`[DataImporter] getImportStatus error: ${err.message}`);
      return null;
    }
  },

  /**
   * Lista logs de importación con paginación.
   */
  async getImportLogs(options = {}) {
    try {
      const { limit = 50, offset = 0, type = null } = options;
      const filters = {};
      if (type) filters.tipo_importacion = type;

      const logs = await strapi.entityService.findMany('api::import-log.import-log', {
        filters,
        limit,
        offset,
        sort: { createdAt: 'desc' },
      });

      return {
        data: logs.map((log) => ({
          importId: log.import_id,
          status: log.estado,
          type: log.tipo_importacion,
          nombreArchivo: log.nombre_archivo,
          created: log.registros_creados,
          updated: log.registros_actualizados,
          errors: log.filas_con_error,
          createdAt: log.createdAt,
        })),
        count: logs.length,
        limit,
        offset,
      };
    } catch (err) {
      strapi.log.error(`[DataImporter] getImportLogs error: ${err.message}`);
      return { data: [], count: 0 };
    }
  },

  /**
   * Guarda el archivo temporal en .tmp/imports/ y retorna la ruta.
   */
  saveTempFile(fileBuffer, fileName, importId) {
    const tempDir = path.join(process.cwd(), '.tmp', 'imports');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const tempPath = path.join(tempDir, `${importId}-${safeName}`);
    fs.writeFileSync(tempPath, fileBuffer);
    return tempPath;
  },

  /**
   * Limpia un archivo temporal.
   */
  cleanTempFile(tempPath) {
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (err) {
        strapi.log.warn(`[DataImporter] No se pudo limpiar temp: ${err.message}`);
      }
    }
  },
};
