# geo-demo-servico-publico

Demo full stack de utilidade pública para registro de ocorrências urbanas com geolocalização em **São Vicente de Minas/MG**.

## O que o projeto entrega
- **Backend Node.js + Express** para geolocalização e registro de ocorrências.
- **Frontend Web (HTML/CSS/JS puro)** com mapa Leaflet + OpenStreetMap.
- **Mobile (Expo/React Native)** para simular a jornada real do cidadão.
- **Fallback geográfico** quando APIs externas estiverem indisponíveis.

## Endpoints principais
- `GET /api/health`
- `GET /api/geo/sao-vicente-de-minas`
- `GET /api/ocorrencias` (protegido)
- `POST /api/ocorrencias` (protegido)
- `PATCH /api/ocorrencias/:id/status` (admin/ouvidoria)
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/admin/audit` (admin)

## Estrutura
```bash
geo-demo-servico-publico/
  backend/
  frontend/
  mobile/
  documento/
  docs/
  Dockerfile
  docker-compose.yml
```

## Execução rápida
### NPM (local)
```bash
cd geo-demo-servico-publico/backend
npm install
npm run dev
```
Abra: `http://localhost:3340`

### Docker
```bash
cd geo-demo-servico-publico
docker compose up --build
```

## Teste rápido
```bash
curl http://localhost:3340/api/health
curl http://localhost:3340/api/geo/sao-vicente-de-minas
```


## Fase 1 executada (Persistência PostgreSQL + PostGIS)
- Tabelas criadas: `occurrences`, `users`, `audit_logs`, `attachments`.
- Geometria armazenada em `GEOGRAPHY(POINT, 4326)`.
- Backend deixou de usar armazenamento em memória para ocorrências.
- Compose atualizado com serviço `postgis/postgis`.


## Fase 2 executada (Autenticação + Auditoria)
- JWT com `accessToken` e `refreshToken`
- Roles: `cidadao`, `admin`, `ouvidoria`
- Middleware `authorize(...roles)` aplicado nas rotas protegidas
- Trilha de auditoria para alteração de status
- Endpoint admin para consulta: `GET /api/admin/audit`

## Resposta esperada de sucesso
- `success: true`
- `occurrence` com metadados e `dataHoraRegistro`
- `emailPreview` com `assunto`, `destinatario` e `corpo` formal

## Melhorias futuras
- Persistência em PostgreSQL + PostGIS
- Autenticação e perfis (cidadão/admin) com trilha de auditoria
- Envio real de e-mail (SMTP/serviço transacional) com integração institucional
- Painel administrativo com filtros por bairro/período e dashboards por período/região
- SLA e trilha completa de atendimento institucional
