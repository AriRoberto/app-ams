import { initDatabase, closeDatabase } from '../services/db.js';
import { importLogradourosFromXls } from '../services/logradouroImportService.js';

const filePath = process.argv[2] || 'Logradouros_Zonas Valendo.xls';
const dryRun = process.argv.includes('--dry-run');

try {
  await initDatabase();
  const report = await importLogradourosFromXls({ filePath, dryRun });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('[import-logradouros] erro:', error.message);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
