const SLA_HOURS = Number(process.env.SLA_HOURS || 72);
const ALERT_THRESHOLD = Number(process.env.SLA_ALERT_THRESHOLD || 0.2);

export function calculateSlaDeadline(createdAt) {
  const created = new Date(createdAt);
  return new Date(created.getTime() + SLA_HOURS * 3600000);
}

export function classifySlaStatus({ status, createdAt, slaDeadline, now = new Date() }) {
  if (['CONCLUIDA'].includes(status)) return 'ok';

  const created = new Date(createdAt);
  const deadline = slaDeadline ? new Date(slaDeadline) : calculateSlaDeadline(created);

  const totalWindowMs = deadline.getTime() - created.getTime();
  const remainingMs = deadline.getTime() - now.getTime();

  if (remainingMs < 0) return 'violado';
  if (remainingMs <= totalWindowMs * ALERT_THRESHOLD) return 'atencao';
  return 'ok';
}

export function getRemainingTimeLabel(slaDeadline, now = new Date()) {
  const diffMs = new Date(slaDeadline).getTime() - now.getTime();
  const absMinutes = Math.floor(Math.abs(diffMs) / 60000);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  const label = `${hours}h ${minutes}m`;
  return diffMs >= 0 ? `restam ${label}` : `atrasado ${label}`;
}

export function calculateSlaCompliance(total, violated) {
  if (!total) return 100;
  return Number((((total - violated) / total) * 100).toFixed(2));
}

export { SLA_HOURS };
