'use strict';

/**
 * Excel Parser — basado en ExcelJS (igual a Soueast)
 * Responsabilidad: leer archivos .xlsx/.xls desde disco y retornar
 * un array de sheets con headers normalizados y filas como objetos.
 */
const ExcelJS = require('exceljs');

module.exports = {
  /**
   * Parsea un archivo Excel y retorna todas las hojas con datos.
   *
   * @param {string} filePath - Ruta absoluta al archivo temporal
   * @param {Object} [options]
   * @param {number}  [options.headerRowIndex=0]   - Índice de fila de encabezados (0-based)
   * @param {boolean} [options.detectHeaders=true] - Auto-detectar fila de encabezados
   * @param {boolean} [options.skipEmpty=true]     - Omitir filas completamente vacías
   * @param {number}  [options.maxRows=5000]       - Máximo de filas a procesar
   * @returns {Promise<Array<SheetResult>>}
   */
  async parseFile(filePath, options = {}) {
    const {
      headerRowIndex = 0,
      detectHeaders = true,
      skipEmpty = true,
      maxRows = 5000,
    } = options;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheets = [];
      let totalParsed = 0;

      for (const worksheet of workbook.worksheets) {
        if (!worksheet.rowCount || worksheet.rowCount === 0) continue;

        let actualHeaderIdx = headerRowIndex;
        if (detectHeaders) {
          actualHeaderIdx = this._detectHeaderRow(worksheet, headerRowIndex);
        }

        const headers = this._extractHeaders(worksheet, actualHeaderIdx);
        if (headers.length === 0) {
          strapi?.log?.warn?.(`[ExcelParser] Sheet "${worksheet.name}" sin encabezados válidos`);
          continue;
        }

        const result = this._extractRows(
          worksheet,
          actualHeaderIdx,
          headers,
          skipEmpty,
          maxRows - totalParsed
        );

        totalParsed += result.rows.length;

        sheets.push({
          name: worksheet.name,
          headerRowIndex: actualHeaderIdx,
          headers,
          rows: result.rows,
          totalRows: result.rows.length,
          emptyRowsSkipped: result.emptyRowsSkipped,
        });

        if (totalParsed >= maxRows) break;
      }

      if (sheets.length === 0) {
        throw new Error('El archivo Excel no contiene hojas con datos válidos');
      }

      return sheets;
    } catch (error) {
      throw new Error(`Error al parsear Excel: ${error.message}`);
    }
  },

  /** Detecta la fila de encabezados buscando la primera con mayoría de strings */
  _detectHeaderRow(worksheet, startFrom = 0) {
    for (let ri = startFrom; ri < Math.min(startFrom + 10, worksheet.rowCount); ri++) {
      const row = worksheet.getRow(ri + 1);
      if (!row?.values) continue;

      let stringCells = 0;
      let totalCells = 0;

      for (let ci = 1; ci <= row.values.length; ci++) {
        const val = row.getCell(ci).value;
        if (val !== null && val !== undefined && val !== '') {
          totalCells++;
          if (typeof val === 'string' || typeof val === 'number') stringCells++;
        }
      }

      if (totalCells > 0 && stringCells / totalCells > 0.5) return ri;
    }
    return startFrom;
  },

  /** Extrae y normaliza los encabezados de la fila indicada */
  _extractHeaders(worksheet, headerRowIndex) {
    const row = worksheet.getRow(headerRowIndex + 1);
    if (!row?.values) return [];

    const headers = [];
    for (let ci = 1; ci <= row.values.length; ci++) {
      const cell = row.getCell(ci);
      if (cell?.value) {
        const normalized = String(cell.value)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-záéíóúüñ0-9_]/gi, '');
        headers.push(normalized || null);
      } else {
        headers.push(null);
      }
    }

    // Eliminar nulls finales
    while (headers.length && headers[headers.length - 1] === null) headers.pop();
    return headers;
  },

  /** Extrae filas de datos a partir de la fila después del header */
  _extractRows(worksheet, headerRowIndex, headers, skipEmpty, maxRows) {
    const rows = [];
    let emptyRowsSkipped = 0;
    const dataStart = headerRowIndex + 2; // +1 base-1, +1 skip header
    const dataEnd = Math.min(dataStart + maxRows, worksheet.rowCount);

    for (let ri = dataStart; ri <= dataEnd; ri++) {
      const row = worksheet.getRow(ri);
      if (!row) continue;

      const values = [];
      let hasData = false;

      for (let ci = 0; ci < headers.length; ci++) {
        const cell = row.getCell(ci + 1);
        let value = null;
        if (cell?.value !== null && cell?.value !== undefined) {
          value = this._normalizeValue(cell.value);
          if (value !== null && value !== '') hasData = true;
        }
        values.push(value);
      }

      if (!hasData && skipEmpty) {
        emptyRowsSkipped++;
        continue;
      }

      const rowObj = { _rowNumber: ri };
      headers.forEach((header, idx) => {
        if (header !== null) rowObj[header] = values[idx];
      });
      rows.push(rowObj);

      if (rows.length >= maxRows) break;
    }

    return { rows, emptyRowsSkipped };
  },

  /** Normaliza un valor de celda a string/number/null */
  _normalizeValue(value) {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];

    const str = String(value).trim();
    if (!str || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') return null;
    return str;
  },
};
