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
- `GET /api/bairros`
- `GET /api/ocorrencias` (protegido)
- `GET /api/ocorrencias/:id` (protegido)
- `POST /api/ocorrencias` (protegido)
- `PATCH /api/ocorrencias/:id/status` (admin/ouvidoria)
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/admin/audit` (admin)
- `GET /api/admin/dashboard/metrics` (admin/ouvidoria)
- `GET /api/admin/dashboard/tickets` (admin/ouvidoria)
- `PATCH /api/admin/tickets/:id/status` (admin/ouvidoria)
- `POST /api/admin/demo-data/seed` (admin/ouvidoria)
- `DELETE /api/admin/demo-data` (admin/ouvidoria)
- `POST /api/admin/logradouros/import` (admin)
- `GET /api/admin/logradouros` (admin/ouvidoria)

## Estrutura
```bash
geo-demo-servico-publico/
  backend/
  frontend/
  mobile/
  documentos/
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

## Fluxo recomendado de demonstração
1. Abrir `http://localhost:3340`.
2. Entrar com o usuário demo ou cadastrar um cidadão.
3. Clicar em **Carregar geolocalização oficial**.
4. Confirmar o mapa com marcador e contexto territorial de São Vicente de Minas/MG.
5. Preencher o formulário e clicar em **Registrar ocorrência**.
6. Copiar o protocolo gerado e acompanhar a linha do tempo em **Minhas ocorrências**.
7. Abrir `http://localhost:3340/admin.html` para visualizar métricas, dashboard analítico, chamados e quadro executivo.

## Payload de exemplo
```json
{
  "nomeCidadao": "Maria Aparecida",
  "tipoOcorrencia": "BURACO_NA_RUA",
  "bairro": "Centro",
  "descricao": "Buraco grande na via principal causando risco de acidente.",
  "pontoReferencia": "Próximo à Escola Municipal",
  "destinatario": "PREFEITURA",
  "emailDestino": "protocolo@prefeitura.mg.gov.br",
  "latitude": -21.703333,
  "longitude": -44.443889,
  "cidade": "São Vicente de Minas",
  "uf": "MG",
  "ibge_id": 3165305
}
```


## Fase 1 executada (Persistência PostgreSQL + PostGIS)
- Tabelas criadas: `occurrences`, `users`, `audit_logs`, `attachments`.
- Geometria armazenada em `GEOGRAPHY(POINT, 4326)`.
- Backend deixou de usar armazenamento em memória para ocorrências.
- Compose atualizado com serviço `postgis/postgis`.


## Fase 4 executada (Painel Administrativo + SLA)
- Endpoint de métricas: `GET /api/admin/dashboard/metrics`
- Endpoint de chamados: `GET /api/admin/dashboard/tickets`
- Atualização admin de status: `PATCH /api/admin/tickets/:id/status`
- Painel web: `http://localhost:3340/admin.html`
- Motor de SLA com níveis `ok`, `atencao`, `violado`
- Massa de dados demo para SLA com limpeza e notificação por e-mail

## Fase 3 executada (Envio real de e-mail)
- Integração SMTP com Nodemailer
- Fila `email-queue` via BullMQ + Redis
- Worker dedicado para envio de e-mails
- Retentativas automáticas e backoff exponencial
- Persistência de status de entrega/falha no banco

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

## Fase 5 executada (Importação de Logradouros)
- Tabela `logradouros` para armazenar endereços públicos da prefeitura
- Script de importação: `npm run import:logradouros -- "../Logradouros_Zonas Valendo.xls"`
- Endpoint admin para importação: `POST /api/admin/logradouros/import`
- Endpoint para listagem: `GET /api/admin/logradouros`
- Suporte a XLS/CSV com mapeamento automático de colunas
- Deduplicação baseada em logradouro + bairro + zona

## Cadastro unificado (app + site)
- Cadastro com `nome`, `email`, `cpf`, `password` e `role`.
- Confirmação de e-mail obrigatória antes do primeiro login.
- CPF validado no backend (dígitos verificadores).

## Melhorias futuras
- Persistência em PostgreSQL + PostGIS
- Autenticação e perfis (cidadão/admin) com trilha de auditoria
- Envio real de e-mail (SMTP/serviço transacional) com integração institucional
- Painel administrativo com filtros por bairro/período e dashboards por período/região
- SLA e trilha completa de atendimento institucional

## Onboarding e documentação recomendada
- Setup local completo: `documentos/GUIA_CONFIG_LOCAL_DEMO.md`
- Dashboard e perfis de acesso: `documentos/GUIA_DASHBOARD_E_ACESSOS.md`
- Auditoria de documentação (2026-04-06): `documentos/AUDITORIA_DOCUMENTACAO_2026-04-06.md`


## Bairros iniciais (São Vicente de Minas/MG)
- Centro
- Cidade Nova
- Vila Nova

Registros antigos sem valor continuam exibidos como `Não informado`.

## Importação segura de logradouros
- Script sob demanda: `npm run import:logradouros -- "../Logradouros_Zonas Valendo.xls"`
- Endpoint admin isolado: `POST /api/admin/logradouros/import`
- Relatório com total importado, duplicatas e falhas por linha

### Importação no container Docker
```bash
docker cp "Logradouros_Zonas Valendo.xls" geo-demo-api:/tmp/Logradouros_Zonas\ Valendo.xls
docker compose exec geo-demo-api npm run import:logradouros -- "/tmp/Logradouros_Zonas Valendo.xls"
```

> Se aparecer `MODULE_NOT_FOUND /app/scripts/importLogradouros.js`, reconstrua a imagem:
```bash
docker compose build --no-cache geo-demo-api email-worker
docker compose up -d --force-recreate geo-demo-api email-worker
```

> Se ocorrer erro de mapeamento com primeira linha de título da planilha, atualize/rebuild para versão com detecção automática de linha de cabeçalho (`findHeaderRowIndex`).
