export const ENV = {
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_SECURE: String(process.env.SMTP_SECURE || 'false') === 'true',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@geo-demo.local',
  EMAIL_QUEUE_CONCURRENCY: Number(process.env.EMAIL_QUEUE_CONCURRENCY || 5)
};
