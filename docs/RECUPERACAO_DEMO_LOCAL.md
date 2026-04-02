# Recuperação rápida para demo local (investidor)

## Objetivo
Subir uma versão estável do CidadeAtende em poucos minutos, evitando travas de geolocalização.

## Passo a passo (rápido)
1. Entrar no backend:
```bash
cd "aplicativo municipal/backend"
```

2. Instalar dependências:
```bash
npm install
```

3. Rodar aplicação:
```bash
npm run dev
```

4. Abrir no navegador:
- Interface: `http://localhost:3334/app`
- API status: `http://localhost:3334/api`
- Healthcheck: `http://localhost:3334/api/health`

## Fluxo de demo recomendado
1. Faça cadastro do morador.
2. Clique em **Usar minha localização** (opcional).
3. Se geolocalização não funcionar, preencha apenas endereço manualmente e envie a solicitação.
4. Atualize a lista de protocolos.

## Checklist de estabilidade
- `GET /api/health` deve retornar `status: ok`.
- O cadastro deve funcionar mesmo com usuário já existente (retorno 409 com sessão carregada).
- A solicitação aceita:
  - coordenadas automáticas, **ou**
  - endereço manual válido.

## Se quiser voltar ao estado mínimo anterior (fallback)
```bash
git log --oneline -n 10
git checkout <commit_estavel>
```
Depois rode novamente `npm install` e `npm run dev` em `aplicativo municipal/backend`.
