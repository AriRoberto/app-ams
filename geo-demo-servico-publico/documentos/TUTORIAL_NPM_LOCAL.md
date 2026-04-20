# Tutorial (NPM local)

## Pré-requisitos
- Node.js 22+
- npm 10+

## Passo a passo
1. Entrar no backend:
```bash
cd geo-demo-servico-publico/backend
```

2. Instalar dependências:
```bash
npm install
```

3. Subir servidor:
```bash
npm run dev
```

4. Validar API:
```bash
curl http://localhost:3340/api/health
curl http://localhost:3340/api/geo/sao-vicente-de-minas
```

5. Abrir frontend web:
- `http://localhost:3340`

## Fluxo funcional esperado
1. Clicar em **Carregar geolocalização oficial**.
2. Conferir card da cidade + mapa com marcador e bounding box.
3. Preencher formulário e registrar ocorrência.
4. Ver JSON gerado e prévia de e-mail institucional.
