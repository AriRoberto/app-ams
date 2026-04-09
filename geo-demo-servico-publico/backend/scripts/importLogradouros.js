import { initDatabase, closeDatabase } from '../services/db.js';
import { findDefaultLogradouroFilePath, importLogradourosFromFile, inspectLogradouroFileStructure } from '../services/logradouroImportService.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inspectOnly = args.includes('--inspect');
const fileArg = args.find((arg) => !arg.startsWith('--'));
const filePath = fileArg || findDefaultLogradouroFilePath() || 'Logradouros_Zonas Valendo.xls';

try {
  if (inspectOnly) {
    const report = inspectLogradouroFileStructure({ filePath });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(report, null, 2));
  } else {
    await initDatabase();
    const report = await importLogradourosFromFile({ filePath, dryRun });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(report, null, 2));
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('[import-logradouros] erro:', error.message);
  process.exitCode = 1;
} finally {
  if (!inspectOnly) {
    await closeDatabase();
  }
}
