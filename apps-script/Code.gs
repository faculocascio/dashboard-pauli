/**
 * Dashboard Pauli — lector público de Google Sheets.
 * SOLO LECTURA: este proyecto nunca escribe ni modifica celdas.
 *
 * Despliegue: Aplicación web / Ejecutar como yo / Acceso: Cualquier usuario.
 * El dashboard consume este endpoint mediante JSONP para evitar problemas CORS.
 */
const SPREADSHEET_ID = '1G97uQX0DxDt2k-7unOhVmStkOBULWuaMJ8E9FUTpbvc';
const SHEET_NAMES = {
  potential: 'Marcas Potenciales',
  collaborated: 'Marcas Colaboradas',
  groups: 'Grupos empresariales',
  strategy: 'Notas y Estrategia'
};

function doGet(e) {
  try {
    const payload = readDashboardData_();
    const callback = e && e.parameter ? String(e.parameter.callback || '') : '';

    if (callback) {
      // Solo se permite un identificador JS simple; evita inyección en JSONP.
      if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
        return ContentService.createTextOutput('/* callback no válido */')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const errorPayload = {
      ok: false,
      error: String(err && err.message ? err.message : err),
      generatedAt: new Date().toISOString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorPayload))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readDashboardData_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const potential = readTable_(ss, SHEET_NAMES.potential, 8, 0);
  const collaborated = readTable_(ss, SHEET_NAMES.collaborated, 8, 0);
  const groups = readTable_(ss, SHEET_NAMES.groups, 4, 0);
  const strategy = readStrategy_(ss, SHEET_NAMES.strategy);

  return {
    ok: true,
    schemaVersion: 1,
    spreadsheet: ss.getName(),
    generatedAt: new Date().toISOString(),
    timeZone: ss.getSpreadsheetTimeZone(),
    potential: potential,
    collaborated: collaborated,
    groups: groups,
    strategy: strategy,
    counts: {
      potential: potential.length,
      collaborated: collaborated.length,
      groups: groups.length,
      strategyLines: strategy.length
    }
  };
}

/**
 * Lee filas con encabezados, preservando el orden original.
 * Excluye filas vacías y evita mostrar el error #REF! de la columna
 * Grupo empresarial si la fórmula de esa celda no tiene resultado válido.
 */
function readTable_(ss, sheetName, expectedColumns, unused) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('No existe la pestaña: ' + sheetName);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const width = Math.max(expectedColumns, sheet.getLastColumn());
  const range = sheet.getRange(1, 1, lastRow, width);
  const values = range.getValues();
  const display = range.getDisplayValues();
  const headers = display[0].slice(0, expectedColumns).map(function(h) {
    return String(h || '').trim();
  });

  const rows = [];
  for (let r = 1; r < values.length; r++) {
    const brand = String(display[r][0] || '').trim();
    if (!brand) continue;

    const record = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c] || ('column' + (c + 1));
      let value = values[r][c];
      if (value instanceof Date) {
        value = Utilities.formatDate(value, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
      } else if (value === null || value === undefined) {
        value = '';
      } else {
        value = String(display[r][c] || '').trim();
      }

      // La fórmula matricial de H2 puede devolver #REF! en el Excel exportado.
      // No alteramos la hoja: simplemente no trasladamos ese error al dashboard.
      if (key === 'Grupo empresarial' && value === '#REF!') value = '';
      record[key] = value;
    }
    rows.push(record);
  }
  return rows;
}

function readStrategy_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('No existe la pestaña: ' + sheetName);
  const lastRow = sheet.getLastRow();
  if (!lastRow) return [];

  return sheet.getRange(1, 1, lastRow, 2).getDisplayValues()
    .map(function(row, index) {
      return {
        row: index + 1,
        section: String(row[0] || '').trim(),
        detail: String(row[1] || '').trim()
      };
    })
    .filter(function(item) {
      return item.section || item.detail;
    });
}
