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

export async function importLogradourosFromXls({ filePath, dryRun = false }) {
  const absolutePath = resolveFilePath(filePath);
  const workbook = XLSX.readFile(absolutePath, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('Planilha sem abas para importação.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawRows.length) {
    throw new Error('Planilha sem linhas de dados.');
  }

  const headerRowIndex = findHeaderRowIndex(rawRows);
  if (headerRowIndex < 0) {
    const preview = (rawRows[0] || []).map((item) => String(item || '')).join(', ');
    throw new Error(`Mapeamento inválido. Cabeçalho com colunas de logradouro/bairro não encontrado. Primeira linha lida: ${preview}`);
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', range: headerRowIndex });
  if (!rows.length) {
    throw new Error('Planilha sem linhas de dados após cabeçalho.');
  }

  const headers = Object.keys(rows[0]);
  const mapping = detectColumnMapping(headers);

  if (!mapping.logradouro || !mapping.bairro) {
    throw new Error(`Mapeamento inválido. Necessário mapear logradouro e bairro. Headers recebidos: ${headers.join(', ')}`);
  }

  const report = {
    filePath: absolutePath,
    sheetName: firstSheetName,
    mapping,
    headerRowIndex,
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
      const rowNumber = headerRowIndex + index + 2;
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
