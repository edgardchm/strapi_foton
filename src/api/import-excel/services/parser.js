'use strict';

/**
 * Excel Parser — Fase 1: CARGA
 * Responsabilidad única: extraer datos crudos del archivo Excel.
 * No valida reglas de negocio, solo estructura.
 */

const XLSX = require('xlsx');
const { IMPORT_TYPES, MAX_IMPORT_FILE_SIZE } = require('../../../utils/constants');

/**
 * Columnas esperadas por tipo de importación.
 * El frontend recibirá esto para guiar al usuario.
 */
const COLUMN_MAPS = {
  modelos: {
    required: ['nombre', 'slug', 'categoria'],
    optional: ['descripcion', 'resumen', 'precioDesde', 'potencia', 'torque', 'carga', 'motor', 'transmision', 'combustible', 'destacado', 'orden', 'activo'],
  },
  sucursales: {
    required: ['nombre', 'codigo'],
    optional: ['direccion', 'region', 'comuna', 'telefono', 'email', 'latitud', 'longitud', 'activa', 'orden'],
  },
  noticias: {
    required: ['titulo', 'slug'],
    optional: ['bajada', 'contenido', 'categoria', 'fechaPublicacion', 'autor', 'destacada', 'activa', 'seoTitle', 'seoDescription'],
  },
};

/**
 * Parsea un archivo Excel y retorna filas como array de objetos.
 * @param {Buffer} fileBuffer - Buffer del archivo subido
 * @param {string} type - Tipo de importación ('modelos' | 'sucursales' | 'noticias')
 * @param {number} fileSize - Tamaño del archivo en bytes
 * @returns {{ rows: object[], columns: object, totalRows: number }}
 */
function parseExcel(fileBuffer, type, fileSize) {
  // ── Validar tipo ───────────────────────────────────────────────────
  if (!IMPORT_TYPES.includes(type)) {
    throw new Error(`Tipo de importación inválido. Permitidos: ${IMPORT_TYPES.join(', ')}`);
  }

  // ── Validar tamaño ─────────────────────────────────────────────────
  const maxSize = parseInt(process.env.MAX_IMPORT_FILE_SIZE || MAX_IMPORT_FILE_SIZE);
  if (fileSize > maxSize) {
    throw new Error(`Archivo demasiado grande. Máximo permitido: ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // ── Parsear con xlsx ───────────────────────────────────────────────
  let workbook;
  try {
    workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false,
    });
  } catch (err) {
    throw new Error(`No se pudo leer el archivo Excel: ${err.message}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo Excel no contiene hojas de cálculo');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  if (rawRows.length < 2) {
    throw new Error('El archivo no contiene datos. Se requiere al menos 1 fila de encabezado y 1 de datos');
  }

  // ── Extraer encabezados y filas ────────────────────────────────────
  const headers = rawRows[0].map((h) => (h ? String(h).trim().toLowerCase() : ''));
  const dataRows = rawRows.slice(1);

  const rows = dataRows
    .filter((row) => row.some((cell) => cell !== null && cell !== ''))
    .map((row, rowIndex) => {
      const obj = { _rowNumber: rowIndex + 2 }; // +2 porque row 1 es header
      headers.forEach((header, colIndex) => {
        if (header) {
          let value = row[colIndex];
          // Normalizar fechas de Excel
          if (value instanceof Date) {
            value = value.toISOString();
          }
          obj[header] = value !== undefined ? value : null;
        }
      });
      return obj;
    });

  return {
    rows,
    columns: COLUMN_MAPS[type] || { required: [], optional: [] },
    totalRows: rows.length,
    headers,
  };
}

/**
 * Genera headers template CSV/Excel para descarga.
 * @param {string} type
 * @returns {string[][]} Array de filas para generar Excel
 */
function getTemplateData(type) {
  const columns = COLUMN_MAPS[type];
  if (!columns) throw new Error(`Tipo ${type} no tiene plantilla definida`);

  const allColumns = [...columns.required, ...columns.optional];
  const exampleRow = {
    modelos: {
      nombre: 'Foton 1827 Chasis',
      slug: 'foton-1827-chasis',
      categoria: 'medianos',
      descripcion: 'Descripción del vehículo',
      precioDesde: 41990000,
      potencia: '215 HP',
      torque: '850 Nm',
      combustible: 'Diésel',
      activo: true,
      orden: 1,
    },
    sucursales: {
      nombre: 'Sucursal Santiago Centro',
      codigo: 'SCL-001',
      direccion: 'Av. Américo Vespucio 760',
      region: 'Región Metropolitana',
      comuna: 'Pudahuel',
      telefono: '+56227202221',
      email: 'santiago@fotonchile.cl',
      latitud: -33.4569,
      longitud: -70.6483,
      activa: true,
      orden: 1,
    },
    noticias: {
      titulo: 'Foton lanza nuevo modelo 2025',
      slug: 'foton-lanza-nuevo-modelo-2025',
      bajada: 'Bajada de la noticia',
      categoria: 'productos',
      autor: 'Equipo Foton',
      destacada: true,
      activa: true,
    },
  };

  return [allColumns, allColumns.map((col) => exampleRow[type]?.[col] ?? '')];
}

module.exports = { parseExcel, getTemplateData, COLUMN_MAPS };
