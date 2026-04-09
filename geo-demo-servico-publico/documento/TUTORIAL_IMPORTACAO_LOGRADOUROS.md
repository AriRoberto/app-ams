# Tutorial — Importação de Logradouros (Prefeitura)

Este fluxo importa dados da planilha `Logradouros_Zonas Valendo.xls` para a tabela `logradouros` sem afetar ocorrências já existentes.

## Estrutura esperada no Excel
A importação detecta e mapeia cabeçalhos por aliases. Ela também ignora linhas de título no topo da planilha (ex.: texto institucional) e procura automaticamente a linha real de cabeçalho. Campos principais:
- **logradouro** (obrigatório)
- **bairro** (obrigatório)
- **zona** (opcional)
- **tipo** (opcional)
- **cep** (opcional)

## Mapeamento de colunas (aliases aceitos)
- `logradouro`: `logradouro`, `nome_logradouro`, `rua`, `endereco`
- `bairro`: `bairro`, `bairro_nome`, `bairro/zona`
- `zona`: `zona`, `setor`, `regiao`
- `tipo`: `tipo`, `tipo_logradouro`
- `cep`: `cep`, `codigo_cep`

## Execução via script (sob demanda)
```bash
cd geo-demo-servico-publico/backend
npm run import:logradouros -- "../Logradouros_Zonas Valendo.xls"
```

Simulação sem gravar dados:
```bash
npm run import:logradouros -- "../Logradouros_Zonas Valendo.xls" --dry-run
```

Analisar a estrutura do arquivo (sem conexão com banco):
```bash
npm run import:logradouros -- "../Logradouros_Zonas Valendo.xls" --inspect
```

> Se você não informar caminho, o script tenta localizar automaticamente arquivo de logradouro na raiz do projeto (prioriza `.csv`).

## Execução via API (isolada)
Endpoint (admin):
- `POST /api/admin/logradouros/import`

Exemplo payload:
```json
{
  "filePath": "Logradouros_Zonas Valendo.xls",
  "dryRun": false
}
```

Consulta dos importados:
- `GET /api/admin/logradouros`
- `GET /api/admin/logradouros?bairro=Centro`

## Segurança e integridade
- Importação isolada em tabela `logradouros`
- `SAVEPOINT` por linha para permitir importação parcial
- Duplicatas detectadas por `(logradouro, bairro, zona)`
- Relatório final com `imported`, `skippedDuplicates`, `failed` e lista de falhas por linha




## Alternativa robusta quando o XLS falhar
Se o arquivo `.xls` vier com formatação antiga/corrompida, converta para **CSV UTF-8 (separado por ponto e vírgula)** e importe o CSV no mesmo script.

### Opção A — Converter no LibreOffice/Excel
1. Abra o arquivo `.xls`.
2. Salve como: `CSV UTF-8 (delimitado por vírgula)` ou `CSV (separado por ;)` (preferência por `;`).
3. Garanta que a primeira linha tenha cabeçalhos como `LOGRADOURO`, `BAIRRO`, `ZONA` (ou aliases).

Importar CSV:
```bash
cd geo-demo-servico-publico/backend
npm run import:logradouros -- "../logradouros.csv"
```

Simulação (sem gravar):
```bash
npm run import:logradouros -- "../logradouros.csv" --dry-run
```

Inspeção da estrutura CSV antes de importar:
```bash
npm run import:logradouros -- "../logradouros.csv" --inspect
```

### Opção B — Carga direta no PostgreSQL (COPY)
Quando quiser máxima performance e o CSV já estiver limpo:
```sql
COPY logradouros (logradouro, bairro, zona, tipo, cep)
FROM '/tmp/logradouros.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ';', ENCODING 'UTF8');
```

> Dica: se usar `COPY`, normalize espaços e remova duplicatas antes para evitar conflitos na constraint única `(logradouro, bairro, zona)`.

## Execução no Docker (recomendado para imagem publicada)

### 1) Confirmar serviço da API
```bash
docker compose ps
```

### 2) Copiar XLS do host para o container da API
```bash
docker cp "Logradouros_Zonas Valendo.xls" geo-demo-api:/tmp/Logradouros_Zonas\ Valendo.xls
```

### 3) Rodar importação dentro do container
```bash
docker compose exec geo-demo-api npm run import:logradouros -- "/tmp/Logradouros_Zonas Valendo.xls"
```

### 4) Validar resultado no backend
```bash
docker compose exec geo-demo-api sh -lc 'node -e "import(\'./services/db.js\').then(async ({query,closeDatabase})=>{const r=await query(\'SELECT COUNT(*)::int AS total FROM logradouros\'); console.log(r.rows[0]); await closeDatabase(); process.exit(0);})"'
```

### 5) Verificar via API
```bash
curl -H "Authorization: Bearer <TOKEN_ADMIN>" http://localhost:3340/api/admin/logradouros
```


## Troubleshooting (erro MODULE_NOT_FOUND /app/scripts/importLogradouros.js)
Esse erro indica imagem/container antigo com `WORKDIR` antigo (`/app`).

1. Rebuild da imagem da API e worker:
```bash
docker compose build --no-cache geo-demo-api email-worker
```
2. Recriar containers:
```bash
docker compose up -d --force-recreate geo-demo-api email-worker
```
3. Testar novamente importação:
```bash
docker compose exec geo-demo-api npm run import:logradouros -- "/tmp/Logradouros_Zonas Valendo.xls"
```


### Se ainda falhar mapeamento
Execute em modo simulação para obter relatório sem gravar no banco:
```bash
docker compose exec geo-demo-api npm run import:logradouros -- "/tmp/Logradouros_Zonas Valendo.xls" --dry-run
```
A mensagem de erro agora traz prévia das primeiras linhas lidas para facilitar ajuste de aliases.
