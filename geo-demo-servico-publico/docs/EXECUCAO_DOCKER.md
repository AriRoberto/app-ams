# Execução com Docker

```bash
cd geo-demo-servico-publico
docker compose build
docker compose up -d
```

## Verificação
```bash
curl http://localhost:3340/api/health
```

## Encerrar
```bash
docker compose down
```
