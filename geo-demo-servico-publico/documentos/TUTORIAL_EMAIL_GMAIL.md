# Tutorial Gmail (SMTP)

## Configuração
Use senha de app do Google (App Password):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password
MAIL_FROM=seu-email@gmail.com
```

## Compatibilidade
Também funciona com outros provedores SMTP/transacionais (SES, Mailgun, SendGrid SMTP).

## Teste
Crie ocorrência e monitore:
```bash
docker compose logs -f email-worker
```
