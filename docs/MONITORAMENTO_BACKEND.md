# Monitoramento e consulta de dados — Backend CidadeAtende

Este documento explica como consultar usuários e solicitações para acompanhamento operacional e evolução do produto.

## 1) Endpoints para consulta

### 1.1 Saúde e metadados
```bash
curl http://localhost:3334/api/health
curl http://localhost:3334/api/meta
```

### 1.2 Listar solicitações por morador
```bash
curl "http://localhost:3334/api/requests?userId=<USER_ID>"
```

### 1.3 Listar todas as solicitações (visão geral)
```bash
curl "http://localhost:3334/api/requests"
```

---

## 2) Consulta direta no banco (arquivo JSON)

Banco atual: `aplicativo municipal/backend/data/db.json`.

### 2.1 Ver total de usuários e solicitações
```bash
jq '{total_usuarios: (.users|length), total_solicitacoes: (.requests|length)}' "aplicativo municipal/backend/data/db.json"
```

### 2.2 Solicitações por categoria
```bash
jq '.requests | group_by(.category) | map({categoria: .[0].category, total: length})' "aplicativo municipal/backend/data/db.json"
```

### 2.3 Solicitações por status
```bash
jq '.requests | group_by(.status) | map({status: .[0].status, total: length})' "aplicativo municipal/backend/data/db.json"
```

### 2.4 Quantidade de solicitações por morador
```bash
jq '.requests | group_by(.userId) | map({userId: .[0].userId, total: length})' "aplicativo municipal/backend/data/db.json"
```

---

## 3) Indicadores de crescimento por período

## 3.1 Cadastros por mês
```bash
jq '.users
| group_by(.createdAt[0:7])
| map({mes: .[0].createdAt[0:7], novos_cadastros: length})' "aplicativo municipal/backend/data/db.json"
```

### 3.2 Solicitações por mês
```bash
jq '.requests
| group_by(.createdAt[0:7])
| map({mes: .[0].createdAt[0:7], novas_solicitacoes: length})' "aplicativo municipal/backend/data/db.json"
```

### 3.3 Taxa média de solicitações por usuário
```bash
jq '(.requests|length) / ((.users|length) | if . == 0 then 1 else . end)' "aplicativo municipal/backend/data/db.json"
```

---

## 4) Estratégia de monitoramento para evolução do produto

1. **Volume diário/semanal de solicitações**
   - acompanhar picos por categoria para priorizar equipes de campo;
2. **Crescimento de base de moradores**
   - avaliar campanhas de adoção do aplicativo;
3. **Tempo de atualização por protocolo**
   - derivar SLA entre `createdAt` e mudanças no `history`;
4. **Taxa de conclusão**
   - proporção de `CONCLUIDO` sobre total de solicitações do período;
5. **Concentração geográfica**
   - usar `latitude/longitude` para mapear áreas críticas.

---

## 5) Próximo passo recomendado (nível produção)

Migrar de `db.json` para PostgreSQL (com PostGIS), permitindo consultas SQL robustas por período, bairro e raio geográfico, além de dashboards em tempo real (ex.: Metabase/Grafana).
