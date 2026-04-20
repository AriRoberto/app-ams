# Tutorial de Dados de Demonstração (SLA)

> Este fluxo cria e remove **dados de demonstração/teste** para uso no painel administrativo.

## Pré-requisitos
- API em execução
- Login com perfil `admin` ou `ouvidoria`
- SMTP configurado (para e-mail de notificação na limpeza)

## 1) Login admin e token
```bash
curl -X POST http://localhost:3340/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"Admin@123"}'
```

Guarde o `accessToken` em `TOKEN_ADMIN`.

## 2) Gerar massa de dados demo (mínimo 20)
```bash
curl -X POST http://localhost:3340/api/admin/demo-data/seed \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"total":24}'
```

Resposta esperada:
- `inserted` com quantidade criada
- `summary.ok`, `summary.atencao`, `summary.violado`

## 3) Validar visualmente no painel
- Abrir `http://localhost:3340/admin.html`
- Verificar linhas com classes:
  - `sla-violado` (vencido)
  - `sla-atencao` (a vencer)
  - `sla-ok` (em dia)

## 4) Limpar massa demo e notificar por e-mail
```bash
curl -X DELETE http://localhost:3340/api/admin/demo-data \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

Efeito esperado:
- remove somente registros `is_demo = true`
- envia e-mail de notificação para `ariroberto@gmail.com`
- assunto: `[Geo Demo] Dados de demonstração removidos`

## 5) Variáveis SMTP obrigatórias
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password
MAIL_FROM=seu-email@gmail.com
```

