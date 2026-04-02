# Relatório técnico e plano de execução — CidadeAtende

## 1) Análise do projeto

### Estrutura encontrada
- `aplicativo municipal/front-end/index.html`: frontend MVP em HTML/JS puro.
- `aplicativo municipal/backend/data/db.json`: persistência em JSON.
- `aplicativo municipal/backend/src/package.json`: manifesto do Node (estava no diretório incorreto).
- `docs/`: documentação conceitual.

### Problemas identificados

| Severidade | Arquivo | Problema | Impacto |
|---|---|---|---|
| Crítico | `aplicativo municipal/backend/src/` | Não havia `server.js`, apesar de scripts apontarem para ele. | API não iniciava. |
| Crítico | `aplicativo municipal/README.md` | Caminho de execução `municipal-app/backend` inexistente e referência `frontend/` divergente de `front-end/`. | Onboarding quebrado. |
| Médio | `aplicativo municipal/front-end/index.html` | Uso de `innerHTML` com dados da API sem escape. | Risco de XSS refletido/persistido. |
| Médio | `aplicativo municipal/front-end/index.html` | Tratamento de erros inconsistente e sem mensagens persistentes na UI. | Baixa confiabilidade operacional. |
| Médio | Backend (inexistente) | Não havia validação de entrada, normalização de CPF/email e resposta padronizada. | Dados inconsistentes e falhas silenciosas. |
| Baixo | `aplicativo municipal/backend/src/package.json` | `package.json` em pasta `src` (antipadrão). | Manutenção/dockers/scripts mais difíceis. |
| Baixo | Projeto geral | Ausência de testes automatizados. | Regressões sem detecção. |
| Baixo | Projeto geral | Sem Dockerfile / compose. | Dificuldade de entrega e operação. |
| Baixo | Projeto geral | Sem estratégia mobile implementada. | Escopo mobile não atendido. |

---

## 2) Correções e melhorias aplicadas

### Backend
- Criação completa da API Express (`server.js`) com:
  - endpoints de saúde e metadados;
  - cadastro de usuário;
  - abertura/listagem de solicitações;
  - atualização de status administrativo;
  - validação de campos, normalização de CPF/email e sanitização textual;
  - persistência segura com fila de escrita para evitar corrupção concorrente;
  - inicialização automática do `db.json` quando ausente.
- Hardening básico:
  - `helmet`;
  - remoção de `x-powered-by`;
  - `json` com limite de payload.

### Frontend
- Escape de dados antes de renderizar em `innerHTML`.
- Mensageria de erro visível na interface.
- Fluxo robusto para usuário já existente (HTTP 409).
- Melhorias de validação mínima nos campos de formulário.

### Organização e qualidade
- `package.json` movido para `aplicativo municipal/backend/package.json`.
- Criação de teste de integração Node (`node:test`) cobrindo:
  - registro de usuário;
  - criação de solicitação;
  - listagem por usuário.
- Inclusão de `.env.example` e `.dockerignore` específicos.

---

## 3) Tutorial de execução local

### Pré-requisitos
- Node.js 22+
- npm 10+

### Passo a passo
1. Entrar no backend:
   ```bash
   cd "aplicativo municipal/backend"
   ```
2. Instalar dependências:
   ```bash
   npm install
   ```
3. Configurar ambiente:
   ```bash
   cp .env.example .env
   ```
4. Iniciar aplicação:
   ```bash
   npm run dev
   ```
5. Acessar frontend:
   - `http://localhost:3334/app`

### Verificações rápidas
- Saúde da API:
  ```bash
  curl http://localhost:3334/api/health
  ```
- Metadados:
  ```bash
  curl http://localhost:3334/api/meta
  ```

### Erros comuns
- **Porta em uso**: ajuste `PORT` no `.env`.
- **Arquivo DB ausente**: o backend cria automaticamente, mas confira permissão de escrita na pasta `data/`.
- **CORS em ambiente externo**: configure `CORS_ORIGIN` com domínios específicos.

---

## 4) Dockerização

### Arquivos
- `Dockerfile` (multi-stage).
- `docker-compose.yml` (serviço API + volume persistente).

### Build e execução
```bash
docker compose build
docker compose up -d
```

### Verificar
```bash
curl http://localhost:3334/api/health
```

### Parar ambiente
```bash
docker compose down
```

---

## 5) Versão mobile (Android/iOS)

### Estratégia escolhida
**React Native com Expo**.

**Justificativa:**
- stack JavaScript já existente no frontend/backend;
- menor tempo de entrega para Android/iOS;
- fácil parametrização da URL da API com `EXPO_PUBLIC_API_URL`;
- viabiliza evolução posterior para push notifications e offline.

### Implementação entregue
- Projeto em `mobile/` com:
  - cadastro de cidadão;
  - abertura de solicitação;
  - listagem de protocolos;
  - persistência local do usuário com AsyncStorage.

### Pré-requisitos mobile
- Node.js 22+
- npm 10+
- Android Studio + SDK + emulador
- Xcode 16+ (macOS) para iOS
- Expo CLI (via `npx expo`)

### Rodar mobile
```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://10.0.2.2:3334/api npm run android
```

> Para iOS simulador (macOS):
```bash
EXPO_PUBLIC_API_URL=http://localhost:3334/api npm run ios
```

### Build de release
- Android (AAB/APK): usar EAS Build (`eas build -p android`).
- iOS (IPA): usar EAS Build (`eas build -p ios`) ou fluxo Xcode após `npx expo prebuild`.

---

## Resumo executivo
O projeto saiu de um estado parcialmente incompleto (API inexistente e documentação inconsistente) para um MVP executável fim a fim com validações, segurança básica, testes automatizados, containerização e base mobile multiplataforma. Próximos passos recomendados: migrar persistência para PostgreSQL, autenticação real (JWT), RBAC admin e pipeline CI/CD com testes + lint + build de imagens.
