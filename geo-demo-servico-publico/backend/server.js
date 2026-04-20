import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import geoRoutes from './routes/geoRoutes.js';
import occurrenceRoutes from './routes/occurrenceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { closeDatabase, initDatabase } from './services/db.js';
import { importLogradourosFromFile, listBairrosFromLogradouros } from './services/logradouroImportService.js';
import { BAIRROS_SAO_VICENTE } from './utils/bairros.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3340);

function envFlag(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'sim', 'on'].includes(String(value).toLowerCase());
}

app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.resolve(__dirname, '../frontend')));

app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'ok',
    app: 'geo-demo-servico-publico',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});


app.get('/api/bairros', async (_req, res, next) => {
  try {
    const importedBairros = await listBairrosFromLogradouros();
    res.json({
      success: true,
      source: importedBairros.length ? 'logradouros' : 'fallback',
      data: importedBairros.length ? importedBairros : BAIRROS_SAO_VICENTE
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/ocorrencias', occurrenceRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint não encontrado.'
    });
  }

  return next();
});

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/index.html'));
});

app.use((error, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Erro interno no servidor.'
  });
});

let server;

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Recebido ${signal}. Encerrando servidor...`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  await closeDatabase();
  process.exit(0);
}

async function bootstrap() {
  await initDatabase();

  if (process.env.NODE_ENV !== 'test') {
    if (envFlag('AUTO_IMPORT_LOGRADOUROS_ON_START')) {
      const filePath = process.env.LOGRADOUROS_IMPORT_FILE || '/tmp/logradouros.csv';
      const replaceExisting = envFlag('LOGRADOUROS_IMPORT_REPLACE', true);
      const report = await importLogradourosFromFile({ filePath, replaceExisting });
      // eslint-disable-next-line no-console
      console.log('[logradouros-import]', JSON.stringify({
        filePath: report.filePath,
        totalRows: report.totalRows,
        imported: report.imported,
        updated: report.updated,
        replacedRows: report.replacedRows,
        skippedDuplicates: report.skippedDuplicates,
        failed: report.failed
      }));
    }

    server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Geo demo running on http://localhost:${PORT}`);
    });

    process.on('SIGINT', () => shutdown('SIGINT').catch(() => process.exit(1)));
    process.on('SIGTERM', () => shutdown('SIGTERM').catch(() => process.exit(1)));
  }
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Falha ao iniciar aplicação:', error);
  process.exit(1);
});

export default app;
