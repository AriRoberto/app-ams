# Auditoria de Documentação — 2026-04-06

## Escopo analisado
Pasta atual: `geo-demo-servico-publico/docs/`.

## 1) Documentos que precisam de atualização

### `AUDITORIA_TECNICA.md`
- **Ponto desatualizado:** afirma que a pasta `docs/` “não existia no projeto”, o que já não representa o estado atual.
- **Ação recomendada:** manter como histórico ou reescrever com contexto temporal (auditoria inicial).

### `TUTORIAL_DOCKER.md`
- **Ponto desatualizado:** passo 3 diz “API + PostGIS”, mas o `docker-compose.yml` também contempla Redis e worker de e-mail.
- **Ação recomendada:** atualizar descrição dos serviços e incluir validação do worker.

### `TUTORIAL_NPM_LOCAL.md`
- **Ponto desatualizado:** cobre apenas backend e frontend estático, sem explicar claramente dependências locais de PostgreSQL/Redis para funcionalidades completas (autenticação, persistência e e-mail em fila).
- **Ação recomendada:** referenciar guia único de setup local com `.env` e opções de execução.

### `FASE4_PAINEL_SLA.md`
- **Ponto desatualizado/incompleto:** muito curto para onboarding; não detalha autenticação, filtros, permissões e troubleshooting.
- **Ação recomendada:** manter como resumo executivo e apontar para guia operacional detalhado.

## 2) Documentos que podem ser removidos ou arquivados

### Candidatos a **arquivamento** (não remoção imediata)
- `FASE4_PLANO_EXECUCAO.md`
  - Útil como histórico de planejamento, mas não como manual operacional.
- `AUDITORIA_TECNICA.md`
  - Útil para rastreabilidade de correções iniciais.

> Recomenda-se mover para uma subpasta de histórico, por exemplo: `docs-archive/` (ou nome equivalente adotado pela equipe).

## 3) Lacunas de documentação identificadas

1. **Guia único de setup local para demonstração**
   - faltava um tutorial consolidado com variáveis de ambiente, token JWT e verificação fim a fim.
2. **Mapa completo de endpoints ativos**
   - endpoints estavam distribuídos em vários documentos sem uma matriz de acesso por perfil.
3. **Guia de navegação por perfil (admin x cidadão)**
   - faltava documentação comparativa de fluxo e permissões por role.
4. **Convenção de nomenclatura da pasta de documentação**
   - faltava recomendação técnica para substituir `docs/` por nome mais semântico.

## 4) Entregáveis criados para fechar lacunas

- `GUIA_CONFIG_LOCAL_DEMO.md`
  - setup local completo, token de acesso, endpoints e checklist de validação.
- `GUIA_DASHBOARD_E_ACESSOS.md`
  - acesso ao dashboard e navegação detalhada para admin e cidadão, com quadro comparativo de capacidades.

