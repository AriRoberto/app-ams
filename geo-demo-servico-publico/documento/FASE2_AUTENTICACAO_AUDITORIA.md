# Fase 2 — Autenticação JWT + Trilha de Auditoria

## 1) Variáveis de ambiente
Defina no backend:

```bash
JWT_SECRET=troque-por-uma-chave-forte
JWT_REFRESH_SECRET=troque-por-outra-chave-forte
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=geo
DB_PASSWORD=geo
DB_NAME=geo_demo
```

## 2) Migrations/Seeds
O backend executa o schema automaticamente no bootstrap (`initDatabase`) e faz seed inicial de usuários de teste:
- `admin@demo.local / Admin@123`
- `ouvidoria@demo.local / Ouvidoria@123`
- `cidadao@demo.local / Cidadao@123`

## 3) Teste do fluxo completo (curl)

### Login
```bash
curl -X POST http://localhost:3340/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"Admin@123"}'
```

### Acesso à rota protegida (admin)
```bash
curl http://localhost:3340/api/admin/audit \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Refresh de token
```bash
curl -X POST http://localhost:3340/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

### Logout (revoga refresh token)
```bash
curl -X POST http://localhost:3340/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

## 4) Trilha de auditoria
Toda mutação de status em `PATCH /api/ocorrencias/:id/status` grava log em `audit_logs` com:
- `manifestacao_id`
- `usuario_id`
- `role`
- `acao`
- `status_anterior`
- `status_novo`
- `timestamp`
- `ip_origem`

Consulta via endpoint protegido:
- `GET /api/admin/audit` (apenas `admin`)

## 5) Boas práticas aplicadas
- Access token curto e refresh token longo
- Refresh token armazenado no banco em hash SHA-256
- Revogação explícita no logout
- Rotação de refresh token no endpoint de refresh
- RBAC por middleware `authorize`
- Registro de auditoria de alterações sensíveis
