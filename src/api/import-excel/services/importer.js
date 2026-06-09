'use strict';

/**
 * Importer — Fase 3: CONFIRMACIÓN
 * Procesa en lotes y crea/actualiza registros en BD.
 * Genera logs de auditoría. Manejo de errores por fila.
 */

const BATCH_SIZE = 20;

/**
 * Importa registros validados en lotes.
 * @param {string} type - Tipo de importación
 * @param {object[]} validRows - Filas validadas
 * @param {object} strapi - Instancia de Strapi
 * @returns {{ created: number, updated: number, failed: number, errors: object[] }}
 */
async function importRecords(type, validRows, strapi) {
  const result = { created: 0, updated: 0, failed: 0, errors: [] };
  const auditLog = [];

  const batches = chunkArray(validRows, BATCH_SIZE);

  for (const batch of batches) {
    await Promise.allSettled(
      batch.map(async (row) => {
        try {
          const normalized = normalizeRow(row, type);
          const outcome = await upsertRecord(type, normalized, strapi);

          if (outcome === 'created') result.created++;
          else if (outcome === 'updated') result.updated++;

          auditLog.push({
            row: row._rowNumber,
            type,
            action: outcome,
            identifier: normalized.slug || normalized.codigo || normalized.titulo,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          result.failed++;
          result.errors.push({
            row: row._rowNumber,
            identifier: row.slug || row.codigo || row.titulo || `fila ${row._rowNumber}`,
            error: err.message,
          });
          strapi.log.warn(`Importación fila ${row._rowNumber} falló: ${err.message}`);
        }
      })
    );
  }

  strapi.log.info('Importación Excel completada', {
    type,
    created: result.created,
    updated: result.updated,
    failed: result.failed,
    auditEntries: auditLog.length,
  });

  return result;
}

/**
 * Crea o actualiza un registro (upsert por slug o codigo).
 */
async function upsertRecord(type, data, strapi) {
  const apiMap = {
    modelos: 'api::modelo.modelo',
    sucursales: 'api::sucursal.sucursal',
    noticias: 'api::noticia.noticia',
  };
  const apiUid = apiMap[type];
  if (!apiUid) throw new Error(`Tipo ${type} no tiene API definida`);

  // Buscar registro existente
  const uniqueField = type === 'sucursales' ? 'codigo' : 'slug';
  const uniqueValue = data[uniqueField];

  const existing = await strapi.entityService.findMany(apiUid, {
    filters: { [uniqueField]: uniqueValue },
    limit: 1,
  });

  if (existing && existing.length > 0) {
    await strapi.entityService.update(apiUid, existing[0].id, { data });
    return 'updated';
  } else {
    await strapi.entityService.create(apiUid, { data });
    return 'created';
  }
}

/**
 * Normaliza y transforma una fila según el tipo.
 */
function normalizeRow(row, type) {
  const { _rowNumber: _r, _valid: _v, ...data } = row;

  if (type === 'modelos') {
    return {
      ...data,
      nombre: String(data.nombre || '').trim(),
      slug: String(data.slug || '').trim().toLowerCase(),
      categoria: String(data.categoria || '').toLowerCase(),
      precioDesde: data.precioDesde ? parseFloat(data.precioDesde) : null,
      destacado: toBool(data.destacado),
      activo: data.activo !== undefined ? toBool(data.activo) : true,
      orden: data.orden ? parseInt(data.orden) : 0,
    };
  }

  if (type === 'sucursales') {
    return {
      ...data,
      nombre: String(data.nombre || '').trim(),
      codigo: String(data.codigo || '').trim().toUpperCase(),
      latitud: data.latitud ? parseFloat(data.latitud) : null,
      longitud: data.longitud ? parseFloat(data.longitud) : null,
      activa: data.activa !== undefined ? toBool(data.activa) : true,
      orden: data.orden ? parseInt(data.orden) : 0,
    };
  }

  if (type === 'noticias') {
    return {
      ...data,
      titulo: String(data.titulo || '').trim(),
      slug: String(data.slug || '').trim().toLowerCase(),
      categoria: data.categoria ? String(data.categoria).toLowerCase() : null,
      destacada: toBool(data.destacada),
      activa: data.activa !== undefined ? toBool(data.activa) : true,
    };
  }

  return data;
}

function toBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return ['true', '1', 'si', 'yes', 'sí'].includes(value.toLowerCase());
  return false;
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

module.exports = { importRecords };
