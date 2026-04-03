import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import geoRoutes from './routes/geoRoutes.js';
import occurrenceRoutes from './routes/occurrenceRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3340);

app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.resolve(__dirname, '../frontend')));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'geo-demo-servico-publico',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.use('/api/geo', geoRoutes);
app.use('/api/ocorrencias', occurrenceRoutes);

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

function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Recebido ${signal}. Encerrando servidor...`);
  if (!server) process.exit(0);

  server.close((error) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao encerrar servidor:', error);
      process.exit(1);
    }
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Geo demo running on http://localhost:${PORT}`);
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;
