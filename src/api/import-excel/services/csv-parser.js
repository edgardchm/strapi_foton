'use strict';

/**
 * CSV Parser — usa PapaParse (igual a Soueast)
 */
const Papa = require('papaparse');
const fs = require('fs');

module.exports = {
  /**
   * Parsea un archivo CSV y retorna filas como objetos.
   *
   * @param {string} filePath - Ruta al archivo CSV temporal
   * @param {Object} [options]
   * @param {string} [options.delimiter='auto'] - Delimitador de columnas
   * @param {number} [options.maxRows=5000]
   * @returns {Promise<{ rows: Object[], headers: string[], totalRows: number }>}
   */
  async parseFile(filePath, options = {}) {
    const { delimiter = '', maxRows = 5000 } = options;

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      const result = Papa.parse(content, {
        header: true,
        delimiter,
        skipEmptyLines: true,
        dynamicTyping: false, // Mantener todo como string; normalizar después
        transformHeader: (header) =>
          String(header)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-záéíóúüñ0-9_]/gi, ''),
        transform: (value) => {
          const str = String(value ?? '').trim();
          return str === '' || str.toLowerCase() === 'n/a' ? null : str;
        },
      });

      if (result.errors?.length) {
        const fatalErrors = result.errors.filter((e) => e.type === 'Delimiter' || e.type === 'Quotes');
        if (fatalErrors.length > 0) {
          throw new Error(`Error al parsear CSV: ${fatalErrors[0].message}`);
        }
      }

      const rows = result.data.slice(0, maxRows).map((row, idx) => ({
        _rowNumber: idx + 2,
        ...row,
      }));

      return {
        rows,
        headers: result.meta.fields || [],
        totalRows: rows.length,
      };
    } catch (error) {
      throw new Error(`Error al parsear CSV: ${error.message}`);
    }
  },
};
