# Tutorial (Docker)

## Pré-requisitos
- Docker
- Docker Compose

## Passo a passo
1. Ir para raiz do projeto:
```bash
cd geo-demo-servico-publico
```

2. Build da imagem:
```bash
docker compose build
```

3. Subir container:
```bash
docker compose up -d
```

4. Verificar status:
```bash
docker compose ps
```

5. Testar API:
```bash
curl http://localhost:3340/api/health
curl http://localhost:3340/api/geo/sao-vicente-de-minas
```

6. Abrir frontend web:
- `http://localhost:3340`

## Encerrar
```bash
docker compose down
```
