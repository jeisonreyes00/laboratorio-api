import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || '';
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';
const from = process.env.SMTP_FROM || 'Soporte <no-reply@example.com>';

let transporter = null;

/**
 * Retorna (o crea) el transporter de nodemailer
 */
export function getTransport() {
  if (transporter) return transporter;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    // Verifica la conexión al iniciar
    transporter.verify((err, success) => {
      if (err) {
        console.error('[mailer] Error al verificar SMTP:', err);
      } else {
        console.log('[mailer] SMTP listo:', success);
      }
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    console.warn('[mailer] SMTP no configurado. Usando jsonTransport (solo log).');
  }

  return transporter;
}

/**
 * Envía un correo
 * @param {Object} opts
 * @param {string} opts.to - destinatario
 * @param {string} opts.subject - asunto
 * @param {string} [opts.text] - cuerpo en texto plano
 * @param {string} [opts.html] - cuerpo en HTML
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransport();

  const info = await t.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  console.log('[mailer] enviado a:', to, '| id:', info.messageId);
  return info;
}
