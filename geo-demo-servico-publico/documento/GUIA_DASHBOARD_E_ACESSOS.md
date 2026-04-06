# Guia de Dashboard e Perfis de Acesso

Este guia descreve como acessar a aplicação e navegar pelos fluxos de **administrador** e **cidadão**.

---

## 1) URLs de acesso

- Aplicação cidadão: `http://localhost:3340`
- Dashboard administrativo: `http://localhost:3340/admin.html`

---

## 2) Como acessar o dashboard de requisições/solicitações

1. Abra `http://localhost:3340/admin.html`.
2. Informe credenciais de perfil autorizado:
   - `admin@demo.local / Admin@123` (admin)
   - `ouvidoria@demo.local / Ouvidoria@123` (ouvidoria)
3. Clique em **Entrar**.
4. Use filtros de `bairro`, `categoria`, `status`, `dataInicio`, `dataFim`.
5. Clique em **Aplicar filtros** para atualizar cards e tabela.

### Métricas exibidas
- Volume total
- Tempo médio de atendimento (h)
- Conformidade SLA (%)
- Total em atenção
- Total violado

### Tabela de chamados
- Colunas: ID, bairro, categoria, status, SLA, tempo restante, ação.
- SLA visual:
  - `ok`
  - `atencao`
  - `violado`

### Ações possíveis no dashboard
- Alterar status do chamado (`ABERTA`, `EM_ANALISE`, `EM_ATENDIMENTO`, `CONCLUIDA`)
- Salvar alteração e recalcular painel

---

## 3) Navegação como usuário administrador

### Objetivo
Operar e supervisionar atendimento, auditoria e métricas.

### Fluxo recomendado
1. Fazer login no dashboard admin.
2. Verificar cards de SLA e volume.
3. Aplicar filtros por período/bairro para priorização.
4. Atualizar status dos chamados críticos.
5. Consultar trilha de auditoria via API (`GET /api/admin/audit`) quando necessário.

### APIs úteis para admin
- `GET /api/admin/dashboard/metrics`
- `GET /api/admin/dashboard/tickets`
- `PATCH /api/admin/tickets/:id/status`
- `GET /api/admin/audit`

---

## 4) Navegação como usuário cidadão

### Objetivo
Registrar ocorrências urbanas e acompanhar sua lista de manifestações.

### Fluxo recomendado
1. Abrir `http://localhost:3340`.
2. Carregar geolocalização oficial.
3. Preencher formulário de ocorrência com dados de localização e categoria.
4. Enviar ocorrência autenticada.
5. Consultar lista de ocorrências do usuário (via API autenticada).

### APIs úteis para cidadão
- `POST /api/auth/login`
- `GET /api/ocorrencias`
- `POST /api/ocorrencias`

---

## 5) Diferenças-chave: admin x cidadão

| Tema | Admin/Ouvidoria | Cidadão |
|---|---|---|
| Acesso ao dashboard | Sim (`/admin.html`) | Não |
| Métricas SLA | Sim | Não |
| Alterar status de ocorrência | Sim | Não |
| Consultar auditoria | Admin: Sim / Ouvidoria: Não | Não |
| Criar ocorrência | Admin: Sim / Ouvidoria: Não | Sim |
| Listar ocorrências | Sim | Sim |

---

## 6) Nomeação da pasta de documentação (substituir `documento/`)

Sugestões (2-3 opções):

1. **`docs-operacionais/`**
   - Foco claro em execução, operação e suporte do sistema.
2. **`runbooks/`**
   - Nome comum em engenharia para procedimentos operacionais e troubleshooting.
3. **`guides/`**
   - Simples e direto para onboarding e documentação de uso técnico-funcional.

> Recomendação prática: adotar `docs-operacionais/` para manter legibilidade para times de produto, suporte e engenharia.

