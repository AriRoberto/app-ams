# Guia de Configuração Local (Demo)

Este guia prepara ambiente local para demonstração completa da aplicação, incluindo autenticação JWT, persistência PostgreSQL/PostGIS, fila de e-mail e dashboard administrativo.

---

## 1) Pré-requisitos

- Docker e Docker Compose instalados.
- Porta `3340` livre (API + frontend estático).
- Portas padrão livres para infraestrutura local:
  - `5432` (PostgreSQL/PostGIS)
  - `6379` (Redis)

> Recomendado para demo: usar Docker Compose para evitar configuração manual de banco/redis.

---

## 2) Configurar variáveis de ambiente (modo demonstração)

No backend, crie o arquivo `.env`:

```bash
cd geo-demo-servico-publico/backend
cp .env.example .env 2>/dev/null || true
```

Se `.env.example` não existir no seu clone, crie `.env` manualmente com o conteúdo abaixo:

```env
# Runtime
NODE_ENV=development
PORT=3340

# Banco
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=geo
DB_PASSWORD=geo
DB_NAME=geo_demo

# JWT
JWT_SECRET=demo_jwt_secret_alterar_em_ambiente_real
JWT_REFRESH_SECRET=demo_refresh_secret_alterar_em_ambiente_real
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# SLA
SLA_HOURS=72
SLA_ALERT_THRESHOLD=0.2

# Redis / fila
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
EMAIL_QUEUE_CONCURRENCY=5

# SMTP (demo local)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password
MAIL_FROM=seu-email@gmail.com
```

> Para demonstração sem envio real, mantenha SMTP em provider de teste (Mailtrap) ou configure Gmail App Password.

---

## 3) Subir stack local (recomendado)

```bash
cd geo-demo-servico-publico
docker compose up --build -d
```

Checar serviços:

```bash
docker compose ps
```

Serviços esperados em execução:
- `geo-demo-api`
- `db`
- `redis`
- `email-worker`

---

## 4) Obter token de acesso (JWT)

### 4.1 Login como administrador

```bash
curl -s -X POST http://localhost:3340/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"Admin@123"}'
```

Resposta esperada inclui:
- `accessToken`
- `refreshToken`
- `user.role` (`admin`)

### 4.2 Login como cidadão

```bash
curl -s -X POST http://localhost:3340/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cidadao@demo.local","password":"Cidadao@123"}'
```

### 4.3 Usar token nas chamadas protegidas

```bash
export TOKEN_ADMIN="<cole_access_token_admin>"
export TOKEN_CIDADAO="<cole_access_token_cidadao>"
```

Depois, incluir no header:

```http
Authorization: Bearer <TOKEN>
```

---

## 5) Endpoints de API disponíveis nesta configuração

## Saúde e geolocalização (públicos)
- `GET /api/health`
- `GET /api/geo/sao-vicente-de-minas`

## Autenticação (públicos)
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

## Ocorrências (protegidos)
- `GET /api/ocorrencias` — `cidadao`, `admin`, `ouvidoria`
- `POST /api/ocorrencias` — `cidadao`, `admin`
- `PATCH /api/ocorrencias/:id/status` — `admin`, `ouvidoria`

## Administração (protegidos)
- `GET /api/admin/audit` — `admin`
- `GET /api/admin/dashboard/metrics` — `admin`, `ouvidoria`
- `GET /api/admin/dashboard/tickets` — `admin`, `ouvidoria`
- `PATCH /api/admin/tickets/:id/status` — `admin`, `ouvidoria`

---

## 6) Verificação do ambiente (checklist)

### 6.1 Saúde da API

```bash
curl -s http://localhost:3340/api/health
```

Esperado: JSON com `status: "ok"`.

### 6.2 Geolocalização oficial

```bash
curl -s http://localhost:3340/api/geo/sao-vicente-de-minas
```

Esperado: payload com dados da cidade.

### 6.3 Autenticação JWT

```bash
curl -s -X POST http://localhost:3340/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"Admin@123"}'
```

Esperado: `accessToken` e `refreshToken`.

### 6.4 Acesso a endpoint protegido (admin)

```bash
curl -s http://localhost:3340/api/admin/audit \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

Esperado: resposta de auditoria sem erro de autorização.

### 6.5 Acesso ao dashboard web

- Admin: `http://localhost:3340/admin.html`
- Cidadão (web): `http://localhost:3340`

Esperado:
- admin consegue carregar métricas/chamados;
- cidadão usa formulário de ocorrência.

---

## 7) Troubleshooting rápido

- **401 Unauthorized:** token ausente/expirado → refazer login.
- **403 Forbidden:** role sem permissão na rota.
- **500 no backend:** verificar `docker compose logs -f geo-demo-api`.
- **Fila de e-mail parada:** verificar `docker compose logs -f email-worker` e serviço Redis.

