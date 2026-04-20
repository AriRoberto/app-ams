# Plano de evolução — Portal da Vereadora integrado ao Sistema de Serviços Urbanos

## Objetivo
Unificar a experiência do cidadão entre:
1. **Portal institucional da vereadora** (conteúdo, agenda, transparência, comunicação), e
2. **Sistema transacional de solicitações urbanas** (abertura, acompanhamento e SLA).

## Estratégia recomendada (melhor custo-benefício)
### Arquitetura híbrida com identidade única (SSO)
- Manter o backend atual como **núcleo transacional** (ocorrências, SLA, auditoria, notificações).
- Criar o novo portal como **frontend separado** (SEO + conteúdo institucional).
- Compartilhar o mesmo módulo de autenticação (`/api/auth`) com:
  - cadastro único,
  - confirmação de e-mail,
  - validação de CPF,
  - sessão contínua entre portal e app.

## Divisão de responsabilidades
### Portal da vereadora
- Página inicial, agenda, notícias, projetos, prestação de contas.
- Canal de comunicação com a comunidade.
- Área logada: atalhos para abrir/acompanhar solicitações.

### Sistema de serviços urbanos
- Abertura de chamado com localização.
- Acompanhamento por status e SLA.
- Histórico de atendimento e notificações.

## Fluxo do cidadão (jornada unificada)
1. Usuário entra no portal da vereadora.
2. Clica em “Solicitar serviço urbano”.
3. Se não autenticado, faz cadastro/login único.
4. Após login, é redirecionado ao formulário já autenticado.
5. Acompanha andamento no portal ou app (mesmo usuário/dados).

## Modelo de dados comum
- `users`: identidade única (nome, email, cpf, role, email_verified_at).
- `occurrences`: solicitações e SLA.
- `audit_logs`: rastreabilidade administrativa.
- `refresh_tokens`: sessão segura.
- `email_deliveries`: histórico de notificações.

## Roadmap sugerido (4 sprints)
### Sprint 1 — Fundação
- Definir identidade visual e arquitetura da informação do portal.
- Publicar landing institucional + autenticação unificada.

### Sprint 2 — Integração funcional
- SSO entre portal e app.
- Widget “Meus chamados” dentro do portal.

### Sprint 3 — Engajamento e dados
- Painel cidadão com histórico e SLA.
- Captura de métricas de engajamento e funil.

### Sprint 4 — Escala e governança
- Revisão de LGPD, consentimento e retenção de dados.
- Observabilidade e alertas operacionais.

## Riscos e mitigação
- **Risco:** confusão de marca entre site institucional e app de serviços.
  - **Mitigação:** design system único + navegação global consistente.
- **Risco:** duplicidade de cadastro.
  - **Mitigação:** constraints por email/cpf + fluxo de recuperação de conta.
- **Risco:** baixa entregabilidade de e-mail.
  - **Mitigação:** templates validados + fila + monitoramento de bounce.
