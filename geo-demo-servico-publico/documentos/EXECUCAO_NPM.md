# Execução com NPM

## Backend + Frontend Web
```bash
cd geo-demo-servico-publico/backend
npm install
npm run dev
```

Acesse: `http://localhost:3340`

## Smoke test
```bash
curl http://localhost:3340/api/health
curl http://localhost:3340/api/geo/sao-vicente-de-minas
```
