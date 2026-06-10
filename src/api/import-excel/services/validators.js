'use strict';

/**
 * Validadores Zod para los tipos de importación de Fotón.
 * Patrón idéntico a Soueast — schemas estrictos por tipo de colección.
 *
 * Tipos soportados:
 *   - sucursal   → api::sucursal.sucursal
 *   - modelo-version → api::modelo-version.modelo-version
 */
const { z } = require('zod');

// ─── Helpers de transformación ─────────────────────────────────────────────

const toNullableString = (v) => (v ? String(v).trim() : null);
const toInt = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseInt(String(v).replace(/\D/g, ''), 10);
  return isNaN(n) ? null : n;
};
const toFloat = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
};
const toBool = (v, defaultVal = true) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    return ['true', 'yes', '1', 'sí', 'si', 's'].includes(v.toLowerCase());
  }
  return defaultVal;
};

// ─── Schema: Sucursal ──────────────────────────────────────────────────────
// Campos de api::sucursal.sucursal en Fotón:
//   nombre (req), codigo (req, unique), direccion, region, comuna,
//   telefono, email, latitud, longitud, horario(json), servicios(json),
//   activa, orden

const sucursalSchema = z.object({
  nombre: z
    .string({ required_error: 'nombre es obligatorio' })
    .min(2, 'nombre debe tener al menos 2 caracteres')
    .max(200)
    .transform((v) => v.trim()),

  codigo: z
    .string({ required_error: 'codigo es obligatorio' })
    .min(1)
    .max(20)
    .transform((v) => v.trim().toUpperCase()),

  direccion: z.string().optional().nullable().transform(toNullableString),
  region: z.string().optional().nullable().transform(toNullableString),
  comuna: z.string().optional().nullable().transform(toNullableString),
  telefono: z.string().optional().nullable().transform(toNullableString),

  email: z
    .string()
    .email('email inválido')
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim().toLowerCase() : null)),

  latitud: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform(toFloat),

  longitud: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform(toFloat),

  activa: z
    .union([z.boolean(), z.string()])
    .optional()
    .default(true)
    .transform((v) => toBool(v, true)),

  orden: z
    .union([z.number(), z.string()])
    .optional()
    .default(0)
    .transform((v) => {
      const n = parseInt(String(v), 10);
      return isNaN(n) ? 0 : n;
    }),
});

// ─── Schema: Versión de Modelo ─────────────────────────────────────────────
// Campos de api::modelo-version.modelo-version en Fotón:
//   nombre (req), slug (auto-uid), modelo (relation por nombre, req),
//   precio, especificaciones(json), activo, orden

const modeloVersionSchema = z.object({
  nombre: z
    .string({ required_error: 'nombre es obligatorio' })
    .min(2, 'nombre debe tener al menos 2 caracteres')
    .max(150)
    .transform((v) => v.trim()),

  modelo: z
    .string({ required_error: 'modelo es obligatorio (nombre del modelo padre)' })
    .min(1)
    .transform((v) => v.trim()),

  precio: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = parseFloat(String(v).replace(/[^\d.]/g, ''));
      return isNaN(n) ? null : n;
    }),

  transmision: z.string().optional().nullable().transform(toNullableString),
  motor: z.string().optional().nullable().transform(toNullableString),

  combustible: z
    .string()
    .optional()
    .nullable()
    .transform(toNullableString),

  potencia: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform(toInt),

  torque: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform(toInt),

  activo: z
    .union([z.boolean(), z.string()])
    .optional()
    .default(true)
    .transform((v) => toBool(v, true)),

  orden: z
    .union([z.number(), z.string()])
    .optional()
    .default(0)
    .transform((v) => {
      const n = parseInt(String(v), 10);
      return isNaN(n) ? 0 : n;
    }),
});

// ─── Helpers de validación por fila ───────────────────────────────────────

/**
 * Valida una fila contra un schema Zod.
 * @param {Object} row
 * @param {z.ZodSchema} schema
 * @returns {{ valid: boolean, data: Object|null, errors: Object|null }}
 */
function validateRow(row, schema) {
  try {
    // Eliminar _rowNumber del objeto antes de validar
    const { _rowNumber, ...data } = row;
    const result = schema.parse(data);
    return { valid: true, data: { ...result, _rowNumber }, errors: null };
  } catch (error) {
    if (error.errors) {
      const errors = {};
      error.errors.forEach((e) => {
        errors[e.path.join('.') || '_general'] = e.message;
      });
      return { valid: false, data: null, errors };
    }
    return { valid: false, data: null, errors: { _general: error.message } };
  }
}

/**
 * Valida múltiples filas en lote.
 * @param {Object[]} rows
 * @param {z.ZodSchema} schema
 * @returns {{ validRows: Object[], invalidRows: Object[] }}
 */
function validateRows(rows, schema) {
  const validRows = [];
  const invalidRows = [];

  rows.forEach((row, idx) => {
    const result = validateRow(row, schema);
    if (result.valid) {
      validRows.push({ index: idx, data: result.data });
    } else {
      invalidRows.push({ index: idx, row, errors: result.errors });
    }
  });

  return { validRows, invalidRows, totalValid: validRows.length, totalInvalid: invalidRows.length };
}

/**
 * Devuelve el schema Zod para el tipo de importación dado.
 * @param {'sucursal'|'modelo-version'} type
 */
function getSchema(type) {
  if (type === 'sucursal') return sucursalSchema;
  if (type === 'modelo-version') return modeloVersionSchema;
  throw new Error(`Tipo de importación desconocido: ${type}. Tipos válidos: sucursal, modelo-version`);
}

module.exports = { sucursalSchema, modeloVersionSchema, validateRow, validateRows, getSchema };
