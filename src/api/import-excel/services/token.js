'use strict';

/**
 * Token Service — Seguridad para importación Excel
 * Genera y valida tokens de confirmación con expiración.
 * Previene confirmaciones duplicadas o fuera de contexto.
 */

const crypto = require('crypto');

// In-memory store (en producción usar Redis/BD)
const tokenStore = new Map();
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Genera un token seguro para confirmar la importación.
 * @param {string} type - Tipo de importación
 * @param {object[]} validRows - Filas validadas a importar
 * @param {object} stats - Estadísticas del preview
 * @returns {{ token: string, expiresAt: string }}
 */
function generateToken(type, validRows, stats) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Guardar contexto del token
  tokenStore.set(token, {
    type,
    validRows,
    stats,
    expiresAt,
    used: false,
  });

  // Auto-limpiar token expirado
  setTimeout(() => {
    tokenStore.delete(token);
  }, TOKEN_TTL_MS + 1000);

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    validCount: validRows.length,
  };
}

/**
 * Valida y consume el token de importación.
 * @param {string} token
 * @returns {{ type: string, validRows: object[], stats: object }}
 */
function validateAndConsumeToken(token) {
  if (!token) {
    const err = new Error('Token de confirmación requerido');
    err.status = 400;
    throw err;
  }

  const entry = tokenStore.get(token);

  if (!entry) {
    const err = new Error('Token inválido o expirado. Realice el preview nuevamente');
    err.status = 400;
    throw err;
  }

  if (entry.used) {
    const err = new Error('Token ya fue utilizado. Cada token es de un solo uso');
    err.status = 400;
    throw err;
  }

  if (new Date() > entry.expiresAt) {
    tokenStore.delete(token);
    const err = new Error('Token expirado (15 min). Realice el preview nuevamente');
    err.status = 400;
    throw err;
  }

  // Marcar como usado (single-use)
  entry.used = true;

  return {
    type: entry.type,
    validRows: entry.validRows,
    stats: entry.stats,
  };
}

/** Limpia todos los tokens (para tests) */
function clearTokens() {
  tokenStore.clear();
}

module.exports = { generateToken, validateAndConsumeToken, clearTokens };
