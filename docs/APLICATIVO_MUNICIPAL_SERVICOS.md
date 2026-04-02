# Aplicativo Municipal de Serviços

## Visão geral
App para cidadãos abrirem solicitações e acompanharem protocolos com transparência.

## Funcionalidades obrigatórias
- Troca de lâmpadas de iluminação pública
- Denúncia de buracos (foto + geolocalização)
- Pedidos de limpeza urbana
- Manutenção em espaços públicos
- Acompanhamento de protocolos (Recebido, Em análise, Em execução, Concluído)

## Arquitetura recomendada
- Mobile: Flutter
- Backend: Node.js + NestJS
- Banco: PostgreSQL + PostGIS
- Painel Admin: React + TypeScript
- Notificações: FCM/APNs
- Offline parcial com fila de sincronização local

## Segurança e LGPD
- TLS em trânsito, criptografia em repouso
- RBAC para perfis administrativos
- Trilha de auditoria
- Minimização de dados e retenção por política

## Nome sugerido
CidadeAtende
