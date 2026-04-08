# Manutenção e Operação

## Checklist diário
- API saudável (`/api/health`)
- Worker de e-mail ativo
- Redis ativo
- Banco ativo

## Comandos úteis
```bash
docker compose ps
docker compose logs -f geo-demo-api
docker compose logs -f email-worker
docker compose logs -f db
docker compose logs -f redis
```

## Troubleshooting
- Falha SMTP: revisar variáveis Gmail + app password.
- Fila parada: verificar Redis e worker.
- Dashboard vazio: validar filtros e dados de teste.
