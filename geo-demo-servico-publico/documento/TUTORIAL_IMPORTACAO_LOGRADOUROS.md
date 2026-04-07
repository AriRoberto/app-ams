# Tutorial — Importação de Logradouros (Prefeitura)

Este fluxo importa dados da planilha `Logradouros_Zonas Valendo.xls` para a tabela `logradouros` sem afetar ocorrências já existentes.

## Estrutura esperada no Excel
A importação detecta e mapeia cabeçalhos por aliases. Campos principais:
- **logradouro** (obrigatório)
- **bairro** (obrigatório)
- **zona** (opcional)
- **tipo** (opcional)
- **cep** (opcional)

## Mapeamento de colunas (aliases aceitos)
- `logradouro`: `logradouro`, `nome_logradouro`, `rua`, `endereco`
- `bairro`: `bairro`, `bairro_nome`
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

