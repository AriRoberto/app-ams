# Geo Demo Serviço Público — São Vicente de Minas/MG

## Visão geral
Demo oficial do repositório para registro de ocorrências urbanas georreferenciadas, com backend, frontend web e camada mobile.

## Objetivo da demo
Demonstrar como transformar uma reclamação genérica em ocorrência pública estruturada com contexto territorial e pronta para encaminhamento institucional.

## Importância da geolocalização
A geolocalização é o núcleo operacional da solução: adiciona coordenadas, contexto de mapa, referência municipal e rastreabilidade para priorização e resposta pública.

## APIs usadas
- **IBGE**: `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/3165305`
- **Nominatim**: `https://nominatim.openstreetmap.org/search?q=São%20Vicente%20de%20Minas,%20Minas%20Gerais,%20Brasil&format=jsonv2&limit=1`

## Endpoints
- `GET /api/health`
- `GET /api/geo/sao-vicente-de-minas`
- `GET /api/ocorrencias`
- `POST /api/ocorrencias`

## Estrutura oficial
```bash
geo-demo-servico-publico/
  backend/
    package.json
    server.js
    routes/
    controllers/
    services/
    utils/
  frontend/
    index.html
    style.css
    script.js
  mobile/
    package.json
    App.js
    app/
    src/
    assets/
    README.md
  docs/
    ANALISE_PROJETO.md
    RELATORIO_TECNICO.md
    EXECUCAO_NPM.md
    EXECUCAO_DOCKER.md
    EXECUCAO_MOBILE.md
    ARQUITETURA.md
  Dockerfile
  docker-compose.yml
  .dockerignore
  README.md
```

## Fallback obrigatório
Se Nominatim falhar, o backend utiliza fallback hardcoded com `source: "fallback"`.

## Execução rápida
```bash
cd geo-demo-servico-publico/backend
npm install
npm run dev
```
Acesse: `http://localhost:3340`

## Docker
```bash
cd geo-demo-servico-publico
docker compose up --build
```

## Mobile
Ver instruções em `mobile/README.md` e `docs/EXECUCAO_MOBILE.md`.

## Payload de exemplo
```json
{
  "nomeCidadao": "Maria Aparecida",
  "tipoOcorrencia": "BURACO_NA_RUA",
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

## Melhorias futuras
- Persistência PostgreSQL + PostGIS
- Autenticação e trilha de auditoria
- Painel admin com dashboards por período e região
- Integração de envio real de e-mail
