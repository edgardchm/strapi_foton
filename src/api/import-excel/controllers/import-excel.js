'use strict';

/**
 * Import Excel Controller
 * Maneja los endpoints de importación Excel.
 * Toda lógica de negocio está en los servicios.
 */

const { parseExcel, getTemplateData } = require('../services/parser');
const { validateRows } = require('../services/validator');
const { generateToken, validateAndConsumeToken } = require('../services/token');
const { importRecords } = require('../services/importer');
const XLSX = require('xlsx');
const { IMPORT_TYPES } = require('../../../utils/constants');

module.exports = {
  /**
   * POST /api/import-excel/preview
   * Fase 1+2: Carga el archivo, parsea y valida.
   * Retorna preview con filas válidas, errores y token.
   */
  async preview(ctx) {
    try {
      // ── Verificar autenticación ─────────────────────────────────────
      if (!ctx.state.user) {
        ctx.throw(401, 'Autenticación requerida para importar');
      }

      const { type } = ctx.request.body;
      if (!type || !IMPORT_TYPES.includes(type)) {
        ctx.throw(400, `Tipo inválido. Permitidos: ${IMPORT_TYPES.join(', ')}`);
      }

      // ── Obtener archivo subido ──────────────────────────────────────
      const file = ctx.request.files?.file;
      if (!file) {
        ctx.throw(400, 'No se encontró archivo en el request (campo: "file")');
      }

      const allowedTypes = (process.env.ALLOWED_IMPORT_TYPES || 'xlsx,xls').split(',');
      const ext = file.name?.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(ext)) {
        ctx.throw(400, `Formato no permitido. Permitidos: ${allowedTypes.join(', ')}`);
      }

      // ── Parsear Excel ───────────────────────────────────────────────
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(file.path);
      const { rows, columns, totalRows, headers } = parseExcel(fileBuffer, type, file.size);

      // ── Obtener existentes para detección de duplicados ─────────────
      const existingRecords = await getExistingRecords(type);

      // ── Validar filas ───────────────────────────────────────────────
      const { validRows, errorRows, stats } = validateRows(rows, type, existingRecords);

      // ── Generar token de seguridad ──────────────────────────────────
      const tokenData = generateToken(type, validRows, stats);

      strapi.log.info('Preview importación Excel', {
        userId: ctx.state.user.id,
        type,
        totalRows,
        valid: stats.valid,
        invalid: stats.invalid,
      });

      ctx.body = {
        data: {
          preview: {
            validRows: validRows.slice(0, 5), // Muestra primeras 5 para UI
            errorRows: errorRows.slice(0, 20), // Muestra primeros 20 errores
            totalValid: stats.valid,
            totalInvalid: stats.invalid,
            totalDuplicates: stats.duplicates,
          },
          columns,
          headers,
          stats,
          token: tokenData.token,
          tokenExpiresAt: tokenData.expiresAt,
          validCount: tokenData.validCount,
        },
        meta: {
          message: `Preview listo. ${stats.valid} filas válidas, ${stats.invalid} con errores.`,
        },
      };
    } catch (error) {
      strapi.log.error('Error en preview importación', { error: error.message });
      ctx.throw(error.status || 500, error.message);
    }
  },

  /**
   * POST /api/import-excel/confirm
   * Fase 3: Confirma y ejecuta la importación.
   * Requiere token válido del preview.
   */
  async confirm(ctx) {
    try {
      if (!ctx.state.user) {
        ctx.throw(401, 'Autenticación requerida');
      }

      const { token } = ctx.request.body;

      // ── Validar y consumir token ────────────────────────────────────
      const { type, validRows, stats } = validateAndConsumeToken(token);

      strapi.log.info('Iniciando importación confirmada', {
        userId: ctx.state.user.id,
        type,
        validCount: validRows.length,
      });

      // ── Importar en lotes ───────────────────────────────────────────
      const result = await importRecords(type, validRows, strapi);

      ctx.body = {
        data: {
          created: result.created,
          updated: result.updated,
          failed: result.failed,
          errors: result.errors,
          type,
        },
        meta: {
          message: `Importación completada. Creados: ${result.created}, Actualizados: ${result.updated}, Fallidos: ${result.failed}`,
        },
      };
    } catch (error) {
      strapi.log.error('Error en confirmación importación', { error: error.message });
      ctx.throw(error.status || 500, error.message);
    }
  },

  /**
   * GET /api/import-excel/template/:type
   * Descarga plantilla Excel para el tipo especificado.
   */
  async template(ctx) {
    try {
      const { type } = ctx.params;

      const templateData = getTemplateData(type);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      ctx.set('Content-Disposition', `attachment; filename="plantilla-${type}.xlsx"`);
      ctx.body = buffer;
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },
};

/**
 * Obtiene registros existentes para detección de duplicados.
 */
async function getExistingRecords(type) {
  const apiMap = {
    modelos: 'api::modelo.modelo',
    sucursales: 'api::sucursal.sucursal',
    noticias: 'api::noticia.noticia',
  };
  const apiUid = apiMap[type];
  if (!apiUid) return [];

  try {
    return await strapi.entityService.findMany(apiUid, {
      fields: ['slug', 'codigo'],
      limit: 10000,
    });
  } catch {
    return [];
  }
}
