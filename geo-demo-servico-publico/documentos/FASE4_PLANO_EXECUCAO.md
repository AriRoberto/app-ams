# Fase 4 — Plano de Execução

## Escopo técnico
- Backend: endpoints administrativos de métricas e chamados com filtros.
- Serviço de SLA: cálculo de deadline, classificação e tempo restante.
- Frontend admin: painel com filtros, cards de métricas, lista de chamados e ação de status.

## Fórmula de SLA
- SLA padrão: `SLA_HOURS` (default 72h)
- Status SLA:
  - `ok`: fora da zona crítica
  - `atencao`: tempo restante <= 20% da janela
  - `violado`: prazo expirado

## Endpoints da fase
- `GET /api/admin/dashboard/metrics`
- `GET /api/admin/dashboard/tickets`
- `PATCH /api/admin/tickets/:id/status`
