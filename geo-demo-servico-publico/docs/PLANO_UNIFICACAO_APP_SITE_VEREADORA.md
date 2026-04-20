# Plano técnico — Unificação App de Serviços Urbanos + Site da Vereadora

## 1) Estratégia de unificação

### Opção recomendada (BFF + Frontends separados)
- **Mesmo backend API** para app de serviços e site da vereadora.
- **Dois frontends**:
  - Frontend cidadão (app/mobile/web) focado em abertura e acompanhamento de solicitações.
  - Site da vereadora (conteúdo institucional + portal do cidadão com SSO para serviços).
- **SSO unificado** com JWT + refresh token + sessão web com cookie seguro no site.

### Racional
- Separa experiências (institucional vs. transacional) sem duplicar regras de negócio.
- Permite evoluir identidade visual da vereadora sem quebrar o app de serviços.
- Facilita governança de dados e analytics centralizado.

## 2) Domínios funcionais por plataforma

### App de serviços urbanos
- Abrir solicitação geolocalizada.
- Consultar status, SLA e histórico.
- Upload de anexos e notificações.

### Site da vereadora
- Conteúdo institucional e prestação de contas.
- Notícias e agendas.
- Área logada com SSO para:
  - abrir chamados,
  - acompanhar chamados,
  - ver comunicados personalizados.

## 3) Modelo de dados unificado (alto nível)
- `users` (identidade única): nome, email, cpf, role, verificação de email.
- `profiles` (opcional): dados de preferências/comunicação.
- `occurrences`: solicitações urbanas + SLA.
- `audit_logs`: rastreabilidade.
- `email_deliveries`: entregabilidade.
- `refresh_tokens`: sessão contínua segura.

## 4) Fluxos de usuário

### Cadastro e ativação
1. Usuário cria conta (nome, email, CPF, senha).
2. Sistema valida CPF e regras de senha.
3. Sistema envia email de confirmação com token temporário.
4. Usuário confirma email.
5. Conta é ativada para login nas duas plataformas.

### Login unificado
1. Login em qualquer canal (app ou site).
2. Emissão de access token + refresh token.
3. Site usa sessão/cookie HttpOnly para UX melhor; app usa token no storage seguro.

## 5) Segurança e conformidade
- Hash de senha com bcrypt.
- Token de verificação de email com hash no banco.
- Expiração de token de verificação (24h).
- CPF armazenado apenas em formato numérico (sem máscara).
- LGPD: consentimento, finalidade e trilha de auditoria.

## 6) Riscos e mitigação
- **Duplicidade de identidade** (mesmo CPF/email): usar constraints únicas + tratamento 409.
- **Falha SMTP em ambiente local**: fallback com token de verificação retornado apenas para DEV.
- **Dados legados sem CPF**: migração gradual, CPF obrigatório só para novos cadastros.

## 7) Roadmap sugerido
1. Fase 1: identidade unificada (cadastro + verificação email + CPF).
2. Fase 2: integração SSO no novo site.
3. Fase 3: dashboard unificado com métricas e campanhas.
4. Fase 4: automações de atendimento e chatbot cívico.
