# Tutorial de Demonstração — Fase 4

## Pré-requisitos
- Docker + Docker Compose

## Passos
```bash
cd geo-demo-servico-publico
docker compose up --build -d
```

Acesse:
- Web cidadão: `http://localhost:3340`
- Painel admin: `http://localhost:3340/admin.html`

## Fluxo visual (captura mental)
1. Login com `admin@demo.local / Admin@123`.
2. Aplicar filtro de bairro/período.
3. Ver cards com métricas atualizadas.
4. Identificar linhas em `sla-atencao` e `sla-violado`.
5. Atualizar status e ver métricas recalculadas.

## Erros comuns
- **401**: token expirado → faça login novamente.
- **500**: banco indisponível → verifique `docker compose ps`.
