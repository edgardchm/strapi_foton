'use strict';

/**
 * Data Mapper — mapea columnas del Excel a campos Strapi de Fotón.
 * Patrón idéntico a Soueast con soporte de fuzzy matching (Levenshtein).
 */

const SUCURSAL_MAPPINGS = {
  // Nombre
  nombre: 'nombre', name: 'nombre', sucursal: 'nombre', branch_name: 'nombre',

  // Código
  codigo: 'codigo', code: 'codigo', branch_code: 'codigo', cod: 'codigo',

  // Dirección
  direccion: 'direccion', address: 'direccion', street: 'direccion',
  dir: 'direccion', domicilio: 'direccion',

  // Región
  region: 'region', state: 'region', provincia: 'region',

  // Comuna
  comuna: 'comuna', city: 'comuna', ciudad: 'comuna', localidad: 'comuna',

  // Teléfono
  telefono: 'telefono', phone: 'telefono', tel: 'telefono', fono: 'telefono',

  // Email
  email: 'email', correo: 'email', mail: 'email', contact_email: 'email',

  // Coordenadas
  latitud: 'latitud', latitude: 'latitud', lat: 'latitud',
  longitud: 'longitud', longitude: 'longitud', lon: 'longitud', lng: 'longitud',

  // Estado
  activa: 'activa', activo: 'activa', active: 'activa', enabled: 'activa', habilitada: 'activa',

  // Orden
  orden: 'orden', order: 'orden', display_order: 'orden', posicion: 'orden',
};

const MODELO_VERSION_MAPPINGS = {
  // Nombre de la versión
  nombre: 'nombre', name: 'nombre', version: 'nombre', variante: 'nombre',

  // Modelo padre (por nombre)
  modelo: 'modelo', model: 'modelo', modelo_nombre: 'modelo',

  // Precio
  precio: 'precio', price: 'precio', precio_venta: 'precio', valor: 'precio',
  precio_lista: 'precio', precio_final: 'precio',

  // Specs
  transmision: 'transmision', transmission: 'transmision', caja: 'transmision',
  motor: 'motor', engine: 'motor',
  combustible: 'combustible', fuel: 'combustible', tipo_combustible: 'combustible',
  potencia: 'potencia', power: 'potencia', hp: 'potencia',
  torque: 'torque', torque_nm: 'torque', nm: 'torque',

  // Estado
  activo: 'activo', active: 'activo', enabled: 'activo',

  // Orden
  orden: 'orden', order: 'orden', posicion: 'orden',
};

/**
 * Calcula similitud de strings (Levenshtein normalizado).
 */
function levenshteinSimilarity(s1, s2) {
  const l1 = s1.length;
  const l2 = s2.length;
  const m = Array.from({ length: l2 + 1 }, (_, j) =>
    Array.from({ length: l1 + 1 }, (_, i) => (j === 0 ? i : i === 0 ? j : 0))
  );
  for (let j = 1; j <= l2; j++) {
    for (let i = 1; i <= l1; i++) {
      m[j][i] = s1[i - 1] === s2[j - 1]
        ? m[j - 1][i - 1]
        : Math.min(m[j][i - 1] + 1, m[j - 1][i] + 1, m[j - 1][i - 1] + 1);
    }
  }
  const maxLen = Math.max(l1, l2);
  return maxLen === 0 ? 1 : 1 - m[l2][l1] / maxLen;
}

function getMappings(type) {
  if (type === 'sucursal') return SUCURSAL_MAPPINGS;
  if (type === 'modelo-version') return MODELO_VERSION_MAPPINGS;
  return {};
}

/**
 * Mapea las columnas de una fila a los nombres de campo de Strapi.
 */
function mapRow(row, type) {
  const mappings = getMappings(type);
  const mapped = {};

  for (const [col, value] of Object.entries(row)) {
    if (col === '_rowNumber') {
      mapped._rowNumber = value;
      continue;
    }
    const normalized = String(col).trim().toLowerCase().replace(/\s+/g, '_');
    const field = mappings[normalized] || normalized;
    mapped[field] = value;
  }

  return mapped;
}

/**
 * Mapea múltiples filas, reportando errores individuales.
 */
function mapRows(rows, type) {
  return rows.map((row, idx) => {
    try {
      return { index: idx, mapped: mapRow(row, type), error: null };
    } catch (err) {
      return { index: idx, mapped: null, error: err.message };
    }
  });
}

/**
 * Genera sugerencias de mapeo para un listado de columnas.
 */
function buildMappingReport(headers, type) {
  const mappings = getMappings(type);
  return headers.map((header) => {
    if (!header || header === '_rowNumber') return null;
    const normalized = header.toLowerCase().replace(/\s+/g, '_');
    if (mappings[normalized]) {
      return { column: header, field: mappings[normalized], confidence: 'high' };
    }
    // fuzzy
    let best = null;
    let bestScore = 0;
    for (const [key, field] of Object.entries(mappings)) {
      const score = levenshteinSimilarity(normalized, key);
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        best = field;
      }
    }
    return {
      column: header,
      field: best || normalized,
      confidence: best ? (bestScore > 0.8 ? 'high' : 'medium') : 'low',
    };
  }).filter(Boolean);
}

module.exports = { mapRow, mapRows, buildMappingReport, getMappings };
