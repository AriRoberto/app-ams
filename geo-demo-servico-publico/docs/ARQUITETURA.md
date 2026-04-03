# Arquitetura

## Camadas
- `routes`: definição de rotas HTTP
- `controllers`: orquestra requisição/resposta
- `services`: regras de integração e negócio
- `utils`: validações, constantes e composição de e-mail

## Diagrama lógico simplificado
1. Frontend/Mobile -> `GET /api/geo/sao-vicente-de-minas`
2. Backend consulta IBGE/Nominatim e retorna geodados (ou fallback)
3. Frontend/Mobile -> `POST /api/ocorrencias`
4. Backend valida, registra e retorna prévia de e-mail institucional
