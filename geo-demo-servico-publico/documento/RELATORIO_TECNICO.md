# Relatório Técnico

## Arquitetura
- Backend Node.js + Express com separação em controllers/services/routes/utils.
- Frontend web em HTML/CSS/JS puro com Leaflet + OpenStreetMap.
- Mobile demo em Expo/React Native para experiência cidadã em campo.

## Backend
- `GET /api/geo/sao-vicente-de-minas`: consolida dados IBGE + Nominatim e fallback.
- `POST /api/ocorrencias`: valida payload, registra ocorrência, retorna e-mail institucional.

## Frontend
- Interface executiva em cards.
- Mapa territorial com marcador e bounding box.
- Painel de resultados JSON + e-mail.

## Mobile
- Carga de geolocalização via API.
- Registro de ocorrência com dados territoriais.
