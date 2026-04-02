# Geo Demo Serviço Público — São Vicente de Minas/MG

## Visão geral
Projeto demo completo para registro de ocorrências urbanas com **geolocalização central** e dados territoriais oficiais para apoiar encaminhamento institucional.

## Objetivo da demo
Mostrar, para gestores e investidores, como transformar uma reclamação genérica em uma ocorrência pública estruturada com:
- latitude e longitude;
- cidade e UF;
- código IBGE;
- contexto territorial em mapa (marcador + bounding box);
- prévia formal de e-mail para órgãos públicos.

## Importância da geolocalização
Sem geolocalização, a demanda é genérica. Com geolocalização, ela ganha rastreabilidade territorial, priorização operacional e maior qualidade para tomada de decisão institucional.

## APIs usadas
1. **IBGE**
   - `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/3165305`
   - Retorna código IBGE, nome oficial, UF e região.
2. **Nominatim (OpenStreetMap)**
   - `https://nominatim.openstreetmap.org/search?q=São%20Vicente%20de%20Minas,%20Minas%20Gerais,%20Brasil&format=jsonv2&limit=1`
   - Retorna latitude, longitude, `display_name` e bounding box.

## Fallback de contingência
Se a chamada ao Nominatim falhar, o backend usa automaticamente este fallback hardcoded:

```json
{
  "ibge_id": 3165305,
  "nome": "São Vicente de Minas",
  "uf": "MG",
  "lat": -21.7033330,
  "lon": -44.4438890,
  "bounding_box": [-21.8000000, -21.5176014, -44.5851375, -44.3424830],
  "display_name": "São Vicente de Minas, Minas Gerais, Brasil"
}
```

No payload de resposta, o campo `source` indica `api` ou `fallback`.

## Endpoints
- `GET /api/health`
- `GET /api/geo/sao-vicente-de-minas`
- `GET /api/ocorrencias`
- `POST /api/ocorrencias`

## Estrutura

```text
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
  README.md
```

## Como instalar
```bash
cd geo-demo-servico-publico/backend
npm install
```

## Como rodar
```bash
npm run dev
```

Aplicação disponível em: `http://localhost:3340`

## Como testar (fluxo recomendado)
1. Abrir `http://localhost:3340`.
2. Clicar em **Carregar geolocalização oficial**.
3. Confirmar card com dados da cidade + mapa com marcador e bounding box.
4. Preencher formulário e clicar em **Registrar ocorrência**.
5. Validar JSON de ocorrência e prévia de e-mail institucional.

## Payload de exemplo para `POST /api/ocorrencias`

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

## Resposta esperada de sucesso
- `success: true`
- `occurrence` com metadados e `dataHoraRegistro`
- `emailPreview` com `assunto`, `destinatario` e `corpo` formal

## Melhorias futuras
- Persistência em PostgreSQL + PostGIS
- Autenticação e perfis (cidadão/admin)
- Envio real de e-mail (SMTP/serviço transacional)
- Painel administrativo com filtros por bairro/período
- SLA e trilha completa de atendimento institucional
