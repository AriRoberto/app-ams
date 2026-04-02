import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { customAlphabet } from 'nanoid';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS = ['RECEBIDO', 'EM_ANALISE', 'EM_EXECUCAO', 'CONCLUIDO'];
const CATEGORIES = [
  'ILUMINACAO_PUBLICA',
  'BURACO_EM_VIA',
  'LIMPEZA_URBANA',
  'MANUTENCAO_ESPACO_PUBLICO'
];

const app = express();
const port = Number(process.env.PORT || 3334);
const host = process.env.HOST || '0.0.0.0';
const dataPath = process.env.DB_FILE || path.resolve(__dirname, '../data/db.json');
const frontendPath = path.resolve(__dirname, '../../front-end');

const id = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);
const protocol = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '128kb' }));
app.use('/app', express.static(frontendPath));

app.get('/', (_req, res) => {
  res.redirect('/app');
});

app.get('/api', (_req, res) => {
  res.json({
    name: 'CidadeAtende API',
    version: '1.1.1',
    health: '/api/health',
    meta: '/api/meta',
    endpoints: {
      register: 'POST /api/auth/register',
      createRequest: 'POST /api/requests',
      listRequests: 'GET /api/requests?userId=<id>',
      updateStatus: 'PATCH /api/admin/requests/:id/status'
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/meta', (_req, res) => {
  res.json({
    statuses: STATUS,
    categories: CATEGORIES,
    app: 'CidadeAtende',
    version: '1.1.1'
  });
});

function sanitizeText(value, max = 500) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function normalizeCpf(value) {
  return String(value || '').replace(/\D/g, '');
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').toLowerCase());
}

async function ensureDbFile() {
  try {
    await fs.access(dataPath);
  } catch {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, '{\n  "users": [],\n  "requests": []\n}\n', 'utf-8');
  }
}

async function readDb() {
  await ensureDbFile();
  const raw = await fs.readFile(dataPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    requests: Array.isArray(parsed.requests) ? parsed.requests : []
  };
}

let writeQueue = Promise.resolve();
async function writeDb(data) {
  writeQueue = writeQueue.then(() => fs.writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8'));
  return writeQueue;
}

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const nome = sanitizeText(req.body?.nome, 120);
    const cpf = normalizeCpf(req.body?.cpf);
    const email = sanitizeText(req.body?.email, 180).toLowerCase();

    if (nome.length < 2) {
      return res.status(400).json({ message: 'Nome inválido.' });
    }
    if (cpf.length !== 11) {
      return res.status(400).json({ message: 'CPF inválido.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'E-mail inválido.' });
    }

    const db = await readDb();
    const existing = db.users.find((u) => u.cpf === cpf || u.email === email);
    if (existing) {
      return res.status(409).json({ message: 'Usuário já cadastrado.', user: existing });
    }

    const user = {
      id: id(),
      nome,
      cpf,
      email,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    await writeDb(db);

    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/requests', async (req, res, next) => {
  try {
    const userId = sanitizeText(req.body?.userId, 24);
    const category = sanitizeText(req.body?.category, 64);
    const descricao = sanitizeText(req.body?.descricao, 600);
    const endereco = sanitizeText(req.body?.endereco, 200);
    const latitude = Number(req.body?.latitude);
    const longitude = Number(req.body?.longitude);
    const fotoUrl = sanitizeText(req.body?.fotoUrl, 240);

    if (!userId) return res.status(400).json({ message: 'userId é obrigatório.' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Categoria inválida.' });
    if (descricao.length < 5) return res.status(400).json({ message: 'Descrição deve ter pelo menos 5 caracteres.' });
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: 'Latitude e longitude são obrigatórias.' });
    }

    const db = await readDb();
    const userExists = db.users.some((u) => u.id === userId);
    if (!userExists) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const now = new Date().toISOString();
    const newRequest = {
      id: id(),
      protocol: `AMS-${protocol()}`,
      userId,
      category,
      descricao,
      endereco,
      latitude,
      longitude,
      fotoUrl,
      status: 'RECEBIDO',
      history: [{ at: now, status: 'RECEBIDO', observacao: 'Solicitação registrada.' }],
      createdAt: now,
      updatedAt: now
    };

    db.requests.push(newRequest);
    await writeDb(db);
    return res.status(201).json(newRequest);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/requests', async (req, res, next) => {
  try {
    const userId = sanitizeText(req.query.userId, 24);
    const db = await readDb();
    const data = userId
      ? db.requests.filter((requestItem) => requestItem.userId === userId)
      : db.requests;

    const sorted = data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return res.json(sorted);
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/requests/:id/status', async (req, res, next) => {
  try {
    const requestId = sanitizeText(req.params.id, 24);
    const status = sanitizeText(req.body?.status, 32);
    const observacao = sanitizeText(req.body?.observacao, 200);

    if (!STATUS.includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    const db = await readDb();
    const target = db.requests.find((requestItem) => requestItem.id === requestId);
    if (!target) {
      return res.status(404).json({ message: 'Solicitação não encontrada.' });
    }

    target.status = status;
    target.updatedAt = new Date().toISOString();
    target.history.push({ at: target.updatedAt, status, observacao: observacao || 'Sem observações.' });

    await writeDb(db);
    return res.json(target);
  } catch (error) {
    return next(error);
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({
    message: 'Endpoint não encontrado.',
    tip: 'Consulte GET /api para ver rotas disponíveis.'
  });
});

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

let server;

function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\nRecebido ${signal}. Encerrando CidadeAtende...`);
  if (!server) {
    process.exit(0);
  }

  server.close((error) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro no shutdown graceful:', error);
      process.exit(1);
    }

    process.exit(0);
  });

  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('Timeout no shutdown. Forçando encerramento.');
    process.exit(1);
  }, 10000).unref();
}

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`AMS backend online on http://${host}:${port}`);
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;
