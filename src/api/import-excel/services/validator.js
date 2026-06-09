'use strict';

/**
 * Excel Validator — Fase 2: PREVIEW
 * Valida filas contra reglas de negocio.
 * Detecta duplicados, campos inválidos y relaciones rotas.
 */

const VALID_CATEGORIAS_MODELO = ['livianos', 'medianos', 'pesados', 'electricos'];
const VALID_CATEGORIAS_NOTICIA = ['empresa', 'productos', 'electromovilidad', 'postventa', 'internacional', 'eventos'];

/**
 * Valida todas las filas y retorna resultado con errores por fila.
 * @param {object[]} rows - Filas del parser
 * @param {string} type - Tipo de importación
 * @param {object[]} existingRecords - Registros existentes para detección de duplicados
 * @returns {{ validRows: object[], errorRows: object[], stats: object }}
 */
function validateRows(rows, type, existingRecords = []) {
  const validRows = [];
  const errorRows = [];

  const existingSlugs = new Set(existingRecords.map((r) => r.slug).filter(Boolean));
  const existingCodigos = new Set(existingRecords.map((r) => r.codigo).filter(Boolean));
  const seenInFile = new Set();

  for (const row of rows) {
    const errors = [];

    if (type === 'modelos') {
      errors.push(...validateModelo(row, existingSlugs, seenInFile));
    } else if (type === 'sucursales') {
      errors.push(...validateSucursal(row, existingCodigos, seenInFile));
    } else if (type === 'noticias') {
      errors.push(...validateNoticia(row, existingSlugs, seenInFile));
    }

    if (errors.length === 0) {
      validRows.push({ ...row, _valid: true });
      // Marcar como visto para detección de duplicados dentro del mismo archivo
      if (row.slug) seenInFile.add(`slug:${row.slug}`);
      if (row.codigo) seenInFile.add(`codigo:${row.codigo}`);
    } else {
      errorRows.push({ ...row, _valid: false, _errors: errors });
    }
  }

  return {
    validRows,
    errorRows,
    stats: {
      total: rows.length,
      valid: validRows.length,
      invalid: errorRows.length,
      duplicates: errorRows.filter((r) => r._errors.some((e) => e.includes('duplicado'))).length,
    },
  };
}

function validateModelo(row, existingSlugs, seenInFile) {
  const errors = [];

  // Campos requeridos
  if (!row.nombre || String(row.nombre).trim().length < 2) {
    errors.push(`Fila ${row._rowNumber}: "nombre" es requerido (mín. 2 caracteres)`);
  }
  if (!row.slug || String(row.slug).trim().length < 2) {
    errors.push(`Fila ${row._rowNumber}: "slug" es requerido`);
  }
  if (!row.categoria) {
    errors.push(`Fila ${row._rowNumber}: "categoria" es requerida`);
  } else if (!VALID_CATEGORIAS_MODELO.includes(String(row.categoria).toLowerCase())) {
    errors.push(`Fila ${row._rowNumber}: "categoria" inválida. Permitidas: ${VALID_CATEGORIAS_MODELO.join(', ')}`);
  }

  // Duplicados
  if (row.slug) {
    const slugKey = `slug:${row.slug}`;
    if (existingSlugs.has(row.slug)) {
      errors.push(`Fila ${row._rowNumber}: slug "${row.slug}" ya existe en BD (duplicado)`);
    } else if (seenInFile.has(slugKey)) {
      errors.push(`Fila ${row._rowNumber}: slug "${row.slug}" duplicado dentro del archivo`);
    }
  }

  // Validaciones de tipo
  if (row.precioDesde !== null && row.precioDesde !== undefined) {
    const precio = parseFloat(row.precioDesde);
    if (isNaN(precio) || precio < 0) {
      errors.push(`Fila ${row._rowNumber}: "precioDesde" debe ser un número positivo`);
    }
  }

  return errors;
}

function validateSucursal(row, existingCodigos, seenInFile) {
  const errors = [];

  if (!row.nombre || String(row.nombre).trim().length < 2) {
    errors.push(`Fila ${row._rowNumber}: "nombre" es requerido`);
  }
  if (!row.codigo || String(row.codigo).trim().length === 0) {
    errors.push(`Fila ${row._rowNumber}: "codigo" es requerido`);
  }

  if (row.codigo) {
    const codigoKey = `codigo:${row.codigo}`;
    if (existingCodigos.has(row.codigo)) {
      errors.push(`Fila ${row._rowNumber}: código "${row.codigo}" ya existe en BD (duplicado)`);
    } else if (seenInFile.has(codigoKey)) {
      errors.push(`Fila ${row._rowNumber}: código "${row.codigo}" duplicado dentro del archivo`);
    }
  }

  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email))) {
    errors.push(`Fila ${row._rowNumber}: "email" tiene formato inválido`);
  }

  if (row.latitud !== null && row.latitud !== undefined) {
    const lat = parseFloat(row.latitud);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push(`Fila ${row._rowNumber}: "latitud" fuera de rango (-90 a 90)`);
    }
  }

  if (row.longitud !== null && row.longitud !== undefined) {
    const lng = parseFloat(row.longitud);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push(`Fila ${row._rowNumber}: "longitud" fuera de rango (-180 a 180)`);
    }
  }

  return errors;
}

function validateNoticia(row, existingSlugs, seenInFile) {
  const errors = [];

  if (!row.titulo || String(row.titulo).trim().length < 5) {
    errors.push(`Fila ${row._rowNumber}: "titulo" es requerido (mín. 5 caracteres)`);
  }
  if (!row.slug || String(row.slug).trim().length < 2) {
    errors.push(`Fila ${row._rowNumber}: "slug" es requerido`);
  }

  if (row.slug) {
    const slugKey = `slug:${row.slug}`;
    if (existingSlugs.has(row.slug)) {
      errors.push(`Fila ${row._rowNumber}: slug "${row.slug}" ya existe en BD (duplicado)`);
    } else if (seenInFile.has(slugKey)) {
      errors.push(`Fila ${row._rowNumber}: slug "${row.slug}" duplicado dentro del archivo`);
    }
  }

  if (row.categoria && !VALID_CATEGORIAS_NOTICIA.includes(String(row.categoria).toLowerCase())) {
    errors.push(`Fila ${row._rowNumber}: "categoria" inválida. Permitidas: ${VALID_CATEGORIAS_NOTICIA.join(', ')}`);
  }

  return errors;
}

module.exports = { validateRows };
