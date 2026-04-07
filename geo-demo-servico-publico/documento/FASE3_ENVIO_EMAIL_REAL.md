# Fase 3 — Envio Real de E-mail Institucional (SMTP + BullMQ + Redis)

## Pacotes necessários
No backend:

```bash
cd geo-demo-servico-publico/backend
npm install nodemailer bullmq ioredis
```

## Variáveis de ambiente
```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=<usuario_smtp>
SMTP_PASS=<senha_smtp>
SMTP_SECURE=false
MAIL_FROM=noreply@geo-demo.local

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
EMAIL_QUEUE_CONCURRENCY=5
```

## Componentes adicionados
- `services/emailTransport.js`: cria `transporter` Nodemailer e envia e-mail real.
- `queues/emailQueue.js`: define fila `email-queue` com tentativas/backoff.
- `services/emailQueueService.js`: enfileira jobs de envio.
- `workers/emailWorker.js`: processa fila e faz envio SMTP real.
- `services/emailDeliveryService.js`: atualiza status no banco.

## Fluxo operacional
1. API cria ocorrência
2. API monta `emailPreview`
3. API registra pendência e enfileira job
4. Worker consome fila e executa `transporter.sendMail`
5. Banco é atualizado como `sucesso` ou `falha`

## Política de falha/retenção
- `attempts: 3`
- `backoff: exponential` (5s base)
- `removeOnComplete: 200`
- `removeOnFail: 500`

## Campos de rastreabilidade
- `occurrences.email_status`
- `occurrences.email_last_error`
- `occurrences.email_sent_at`
- `email_deliveries.status`
- `email_deliveries.erro`
- `email_deliveries.enviado_em`

## Teste rápido via Docker
```bash
cd geo-demo-servico-publico
docker compose up --build -d
```

Depois crie uma ocorrência autenticada e acompanhe logs:
```bash
docker compose logs -f email-worker
docker compose logs -f geo-demo-api
```

## Boas práticas aplicadas
- Credenciais via ambiente (sem hardcode)
- Fila desacopla API de SMTP (resiliência)
- Retry exponencial reduz impacto de falha temporária
- Atualização persistente de status de entrega/falha
- Eventos `completed`/`failed` expostos para monitoramento
