# Auditoria Técnica — geo-demo-servico-publico

## Observação inicial
A pasta `docs/` não existia no projeto. Foi criada para consolidar esta auditoria, conforme solicitação.

## Problemas encontrados e corrigidos

1. **Ausência de pasta `docs` para análise formal**
   - **Severidade:** Baixa
   - **Correção:** criação da pasta `docs` e deste relatório.

2. **Backend sem shutdown gracioso**
   - **Severidade:** Média
   - **Impacto:** risco de encerramento abrupto em demos/containers.
   - **Correção:** adição de tratamento de `SIGINT`/`SIGTERM` e encerramento seguro do servidor.

3. **Frontend com risco de injeção em popup do mapa**
   - **Severidade:** Média
   - **Impacto:** dados externos (Nominatim) eram interpolados diretamente em HTML.
   - **Correção:** adicionado escape de HTML antes de renderização no popup.

4. **Frontend com parser frágil para respostas de erro não-JSON**
   - **Severidade:** Média
   - **Impacto:** quebra ao tentar `response.json()` em payload não-JSON.
   - **Correção:** fallback para `text()` conforme `content-type`.

5. **Payload web sem `trim()` em campos de texto**
   - **Severidade:** Baixa
   - **Impacto:** dados com espaços desnecessários.
   - **Correção:** normalização dos campos no frontend antes de envio.

6. **Mobile sem `app.json`**
   - **Severidade:** Baixa
   - **Impacto:** metadados de build/config incompletos.
   - **Correção:** criação de `mobile/app.json` com configuração base para Android/iOS.

## Validações executadas
- `node --check backend/server.js`
- `node --check backend/services/geoService.js`
- `node --check frontend/script.js`
- `node --check mobile/app/index.js`
- `node --check mobile/src/api.js`

## Estado final
Projeto organizado, auditado e corrigido de forma cirúrgica, mantendo escopo e comportamento funcional esperado para backend, frontend, mobile e execução via Docker/NPM.
