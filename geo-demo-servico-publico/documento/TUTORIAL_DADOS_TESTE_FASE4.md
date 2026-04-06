# Tutorial de Dados de Teste — Fase 4

## Login e token
```bash
curl -X POST http://localhost:3340/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cidadao@demo.local","password":"Cidadao@123"}'
```

## Criar ocorrência de teste
```bash
curl -X POST http://localhost:3340/api/ocorrencias \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCidadao":"Teste",
    "tipoOcorrencia":"BURACO_NA_RUA",
    "descricao":"Teste SLA",
    "pontoReferencia":"Praça central",
    "bairro":"Centro",
    "priority":"normal",
    "destinatario":"PREFEITURA",
    "emailDestino":"destino@orgao.gov.br",
    "latitude":-21.703333,
    "longitude":-44.443889,
    "cidade":"São Vicente de Minas",
    "uf":"MG",
    "ibge_id":3165305
  }'
```

## Consultar existentes (admin/ouvidoria)
```bash
curl "http://localhost:3340/api/admin/dashboard/tickets?page=1&pageSize=20" \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

## Alterar destinatário de e-mail
Atualize o campo `emailDestino` no payload ao criar ocorrência.
