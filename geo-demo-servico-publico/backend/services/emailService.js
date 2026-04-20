import { sendInstitutionalEmail } from './emailTransport.js';

const WEBSITE_URL = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3340}`;

export async function sendVerificationEmail({ to, name, token }) {
  const confirmUrl = `${WEBSITE_URL}/api/auth/confirm?token=${encodeURIComponent(token)}`;
  const subject = 'Confirme seu cadastro';
  const text = `Olá ${name},\n\nObrigado por se cadastrar. Clique no link abaixo para confirmar seu e-mail:\n${confirmUrl}\n\nSe você não fez este cadastro, ignore esta mensagem.`;
  const html = `
    <p>Olá ${name},</p>
    <p>Obrigado por se cadastrar. Clique no link abaixo para confirmar seu e-mail:</p>
    <p><a href="${confirmUrl}">${confirmUrl}</a></p>
    <p>Se você não fez este cadastro, ignore esta mensagem.</p>
  `;

  return sendInstitutionalEmail({ to, subject, text, html });
}
