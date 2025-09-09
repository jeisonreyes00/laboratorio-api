import nodemailer from 'nodemailer';
const host = process.env.SMTP_HOST || '';
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';
const from = process.env.SMTP_FROM || 'Soporte <no-reply@example.com>';
let transporter = null;
export function getTransport() {
  if (transporter) return transporter;
  if (host && user && pass) transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  else { transporter = nodemailer.createTransport({ jsonTransport: true }); console.warn('[mailer] SMTP no configurado. Usando jsonTransport (solo log)'); }
  return transporter;
}
export async function sendMail(to, subject, html) { const t = getTransport(); const info = await t.sendMail({ from, to, subject, html }); return info; }
