import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import XLSX from 'xlsx';
import { getClient, query } from './db.js';
import { detectColumnMapping, findHeaderRowIndex } from '../utils/logradouroImportMapping.js';

function sanitizeText(value, max = 180) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function normalizeRow(row, mapping) {
  return {
    logradouro: sanitizeText(row[mapping.logradouro], 180),
    bairro: sanitizeText(row[mapping.bairro], 120),
    zona: sanitizeText(row[mapping.zona], 80) || null,
    tipo: sanitizeText(row[mapping.tipo], 80) || null,
    cep: sanitizeText(row[mapping.cep], 16) || null
  };
}

function resolveFilePath(filePath) {
  if (!filePath) {
    throw new Error('filePath é obrigatório para importação de logradouros.');
  }

  const direct = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(direct)) return direct;

  const backendRelative = path.resolve(process.cwd(), 'geo-demo-servico-publico/backend', filePath);
  if (fs.existsSync(backendRelative)) return backendRelative;

  throw new Error(`Arquivo não encontrado: ${filePath}`);
}

function rowHasUsefulData(row = []) {
  return row.filter((cell) => sanitizeText(cell, 300).length > 0).length >= 2;
}

function streetScore(value) {
  return /(rua|avenida|av\.?|travessa|pra[çc]a|alameda|rodovia|estrada)/i.test(value) ? 1 : 0;
}

function zoneScore(value) {
  return /(urbana|rural|zona|distrito|sede)/i.test(value) ? 1 : 0;
}

export function inferMappingFromDataRows(dataRows = []) {
  if (!dataRows.length) return null;

  const maxCols = Math.max(...dataRows.map((row) => row.length), 0);
  const stats = Array.from({ length: maxCols }, (_, idx) => ({
    idx,
    nonEmpty: 0,
    streetHits: 0,
    zoneHits: 0,
    values: []
  }));

  for (const row of dataRows) {
    for (let idx = 0; idx < maxCols; idx += 1) {
      const value = sanitizeText(row[idx], 220);
      if (!value) continue;
      const stat = stats[idx];
      stat.nonEmpty += 1;
      stat.streetHits += streetScore(value);
      stat.zoneHits += zoneScore(value);
      stat.values.push(value.toLowerCase());
    }
  }

  const populated = stats.filter((item) => item.nonEmpty > 0);
  if (populated.length < 2) return null;

  const logradouroCol = [...populated].sort((a, b) => {
    if (b.streetHits !== a.streetHits) return b.streetHits - a.streetHits;
    return b.nonEmpty - a.nonEmpty;
  })[0];

  const remaining = populated.filter((item) => item.idx !== logradouroCol.idx);

  const bairroCol = [...remaining].sort((a, b) => {
    const uniqA = new Set(a.values).size / a.values.length;
    const uniqB = new Set(b.values).size / b.values.length;
    if (uniqA !== uniqB) return uniqA - uniqB;
    return b.nonEmpty - a.nonEmpty;
  })[0];

  const remainingAfterBairro = remaining.filter((item) => item.idx !== bairroCol.idx);
  const zonaCol = remainingAfterBairro.sort((a, b) => {
    if (b.zoneHits !== a.zoneHits) return b.zoneHits - a.zoneHits;
    return b.nonEmpty - a.nonEmpty;
  })[0];

  return {
    logradouro: `COL_${logradouroCol.idx}`,
    bairro: `COL_${bairroCol.idx}`,
    zona: zonaCol ? `COL_${zonaCol.idx}` : undefined
  };
}

function buildSyntheticRows(rawRows = [], startAt = 1) {
  const usefulRows = rawRows.slice(startAt).filter((row) => rowHasUsefulData(row));
  return usefulRows.map((row) => {
    const obj = {};
    row.forEach((value, idx) => {
      obj[`COL_${idx}`] = value;
    });
    return obj;
  });
}

function splitDelimitedLine(line, delimiter) {
  const columns = [];
  let current = '';
  let inQuotes = false;

  for (let idx = 0; idx < line.length; idx += 1) {
    const char = line[idx];
    const nextChar = line[idx + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        idx += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      columns.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  columns.push(current.trim());
  return columns;
}

function detectDelimiter(sampleLine = '') {
  const delimiters = [
    { value: ';', score: (sampleLine.match(/;/g) || []).length },
    { value: ',', score: (sampleLine.match(/,/g) || []).length },
    { value: '\t', score: (sampleLine.match(/\t/g) || []).length }
  ];

  const best = delimiters.sort((a, b) => b.score - a.score)[0];
  return best?.score > 0 ? best.value : ';';
}

export function parseDelimitedText(content = '') {
  const normalized = content.replace(/^\uFEFF/, '');
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) return [];

  const delimiter = detectDelimiter(lines[0]);
  return lines.map((line) => splitDelimitedLine(line, delimiter));
}

function loadRawRowsFromFile(absolutePath) {
  const extension = path.extname(absolutePath).toLowerCase();

  if (extension === '.csv' || extension === '.txt') {
    const content = fs.readFileSync(absolutePath, 'utf8');
    return {
      sheetName: path.basename(absolutePath),
      rawRows: parseDelimitedText(content),
      sourceType: extension.slice(1)
    };
  }

  const workbook = XLSX.readFile(absolutePath, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('Planilha sem abas para importação.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  return {
    sheetName: firstSheetName,
    rawRows: XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }),
    sourceType: 'spreadsheet'
  };
}

function buildRowsFromHeader(rawRows, headerRowIndex) {
  const headerCells = rawRows[headerRowIndex] || [];
  const headers = headerCells.map((value, idx) => sanitizeText(value, 120) || `COL_${idx}`);

  const dataRows = rawRows
    .slice(headerRowIndex + 1)
    .filter((row) => rowHasUsefulData(row));

  const rows = dataRows.map((row) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx];
    });
    return obj;
  });

  return { headers, rows };
}

export async function listLogradouros({ bairro } = {}) {
  if (bairro) {
    const result = await query(
      `SELECT id, logradouro, bairro, zona, tipo, cep, source_file, created_at AS "createdAt"
       FROM logradouros
       WHERE bairro = $1
       ORDER BY bairro, logradouro`,
      [bairro]
    );
    return result.rows;
  }

  const result = await query(
    `SELECT id, logradouro, bairro, zona, tipo, cep, source_file, created_at AS "createdAt"
     FROM logradouros
     ORDER BY bairro, logradouro`
  );
  return result.rows;
}

export async function importLogradourosFromFile({ filePath, dryRun = false }) {
  const absolutePath = resolveFilePath(filePath);
  const { sheetName, rawRows, sourceType } = loadRawRowsFromFile(absolutePath);

  if (!rawRows.length) {
    throw new Error('Arquivo sem linhas de dados.');
  }

  let rows;
  let mapping;
  let headerRowIndex = findHeaderRowIndex(rawRows);
  let inferredMapping = false;

  if (headerRowIndex >= 0) {
    const { headers, rows: mappedRows } = buildRowsFromHeader(rawRows, headerRowIndex);
    rows = mappedRows;
    mapping = detectColumnMapping(headers);
  } else {
    rows = buildSyntheticRows(rawRows, 1);
    mapping = inferMappingFromDataRows(rawRows.slice(1));
    inferredMapping = true;
  }

  if (!rows.length) {
    throw new Error('Arquivo sem linhas úteis para importação.');
  }

  if (!mapping?.logradouro || !mapping?.bairro) {
    const previewRows = rawRows.slice(0, 8).map((row, idx) => ({ linha: idx + 1, valores: row }));
    throw new Error(`Mapeamento inválido. Cabeçalho com colunas de logradouro/bairro não encontrado. Prévia das primeiras linhas: ${JSON.stringify(previewRows)}`);
  }

  const report = {
    filePath: absolutePath,
    sourceType,
    sheetName,
    mapping,
    headerRowIndex,
    inferredMapping,
    totalRows: rows.length,
    imported: 0,
    skippedDuplicates: 0,
    failed: 0,
    failures: []
  };

  const seenInFile = new Set();
  const client = await getClient();

  try {
    await client.query('BEGIN');

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = headerRowIndex >= 0 ? headerRowIndex + index + 2 : index + 2;
      const savepoint = `sp_logradouro_${index}`;
      await client.query(`SAVEPOINT ${savepoint}`);

      try {
        const normalized = normalizeRow(rows[index], mapping);

        if (!normalized.logradouro || !normalized.bairro) {
          throw new Error('logradouro e bairro são obrigatórios.');
        }

        const key = `${normalized.logradouro.toLowerCase()}|${normalized.bairro.toLowerCase()}|${(normalized.zona || '').toLowerCase()}`;
        if (seenInFile.has(key)) {
          report.skippedDuplicates += 1;
          await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
          continue;
        }
        seenInFile.add(key);

        const exists = await client.query(
          `SELECT 1 FROM logradouros
           WHERE LOWER(logradouro) = LOWER($1)
             AND LOWER(bairro) = LOWER($2)
             AND COALESCE(LOWER(zona), '') = COALESCE(LOWER($3), '')
           LIMIT 1`,
          [normalized.logradouro, normalized.bairro, normalized.zona]
        );

        if (exists.rowCount) {
          report.skippedDuplicates += 1;
          await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
          continue;
        }

        if (!dryRun) {
          await client.query(
            `INSERT INTO logradouros (
              id, logradouro, bairro, zona, tipo, cep, source_file
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [randomUUID(), normalized.logradouro, normalized.bairro, normalized.zona, normalized.tipo, normalized.cep, path.basename(absolutePath)]
          );
        }

        report.imported += 1;
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      } catch (error) {
        report.failed += 1;
        report.failures.push({ row: rowNumber, error: error.message, raw: rows[index] });
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      }
    }

    if (dryRun) {
      await client.query('ROLLBACK');
    } else {
      await client.query('COMMIT');
    }

    return report;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function importLogradourosFromXls(params) {
  return importLogradourosFromFile(params);
}
