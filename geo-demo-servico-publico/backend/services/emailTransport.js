import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

export const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_SECURE,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS
  }
});

export async function sendInstitutionalEmail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: ENV.MAIL_FROM,
    to,
    subject,
    text,
    html
  });
}
