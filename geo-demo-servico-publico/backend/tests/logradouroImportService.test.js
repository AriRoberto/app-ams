import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { detectColumnMapping, findHeaderRowIndex } from '../utils/logradouroImportMapping.js';
import { findDefaultLogradouroFilePath, inferMappingFromDataRows, inspectLogradouroFileStructure, parseDelimitedText } from '../services/logradouroImportService.js';

test('detectColumnMapping identifica colunas equivalentes da planilha', () => {
  const headers = ['Nome Logradouro', 'Bairro', 'Zona', 'Tipo Logradouro', 'CEP'];
  const mapping = detectColumnMapping(headers);

  assert.equal(mapping.logradouro, 'Nome Logradouro');
  assert.equal(mapping.bairro, 'Bairro');
  assert.equal(mapping.zona, 'Zona');
  assert.equal(mapping.tipo, 'Tipo Logradouro');
  assert.equal(mapping.cep, 'CEP');
});

test('findHeaderRowIndex ignora linha de título e encontra cabeçalho real', () => {
  const rows = [
    ['LOGRADOUROS PÚBLICOS NOMINADOS DO MUNICÍPIO DE SÃO VICENTE DE MINAS', '', '', ''],
    ['LOGRADOURO', 'BAIRRO', 'ZONA', 'CEP'],
    ['Rua A', 'Centro', 'Urbana', '36370000']
  ];

  const index = findHeaderRowIndex(rows);
  assert.equal(index, 1);
});

test('detectColumnMapping suporta cabeçalho BAIRRO/ZONA e LOGRADOUROS', () => {
  const headers = ['LOGRADOUROS', 'BAIRRO/ZONA', 'CEP'];
  const mapping = detectColumnMapping(headers);

  assert.equal(mapping.logradouro, 'LOGRADOUROS');
  assert.equal(mapping.bairro, 'BAIRRO/ZONA');
});

test('inferMappingFromDataRows infere colunas sem cabeçalho formal', () => {
  const rows = [
    ['Rua Antônio de Pádua', 'Centro', 'Urbana'],
    ['Avenida Brasil', 'São José', 'Urbana'],
    ['Travessa B', 'Rosário', 'Rural']
  ];

  const mapping = inferMappingFromDataRows(rows);
  assert.equal(mapping.logradouro, 'COL_0');
  assert.ok(['COL_1', 'COL_2'].includes(mapping.bairro));
  assert.ok(!mapping.zona || ['COL_1', 'COL_2'].includes(mapping.zona));
  assert.notEqual(mapping.bairro, mapping.logradouro);
});

test('parseDelimitedText detecta delimitador ; e preserva valores entre aspas', () => {
  const csv = 'LOGRADOURO;BAIRRO;ZONA\n"Rua A";"Centro";"Urbana"';
  const rows = parseDelimitedText(csv);

  assert.deepEqual(rows[0], ['LOGRADOURO', 'BAIRRO', 'ZONA']);
  assert.deepEqual(rows[1], ['Rua A', 'Centro', 'Urbana']);
});

test('inspectLogradouroFileStructure detecta delimitador e mapeamento em CSV', () => {
  const tempPath = path.join(os.tmpdir(), `logradouros-${Date.now()}.csv`);
  fs.writeFileSync(tempPath, 'LOGRADOURO;BAIRRO;ZONA\nRua A;Centro;Urbana\n');

  const inspection = inspectLogradouroFileStructure({ filePath: tempPath });

  assert.equal(inspection.sourceType, 'csv');
  assert.equal(inspection.delimiter, ';');
  assert.equal(inspection.mapping.logradouro, 'LOGRADOURO');
  assert.equal(inspection.mapping.bairro, 'BAIRRO');

  fs.unlinkSync(tempPath);
});

test('findDefaultLogradouroFilePath prioriza CSV na raiz quando existir', () => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logradouro-default-'));
  const csvPath = path.join(baseDir, 'Logradouross_Zonas.csv');
  const xlsPath = path.join(baseDir, 'Logradouros_Zonas Valendo.xls');

  fs.writeFileSync(csvPath, 'LOGRADOURO;BAIRRO\nRua A;Centro\n');
  fs.writeFileSync(xlsPath, 'placeholder');

  const detected = findDefaultLogradouroFilePath(baseDir);
  assert.equal(detected, csvPath);

  fs.unlinkSync(csvPath);
  fs.unlinkSync(xlsPath);
  fs.rmdirSync(baseDir);
});
