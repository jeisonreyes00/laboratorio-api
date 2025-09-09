import 'dotenv/config';
import { getTransport } from './src/mailer.js';

const t = getTransport();
t.verify().then(() => {
  console.log('SMTP OK');
  return t.sendMail({
    from: process.env.SMTP_FROM,
    to: 'test@inbox.mailtrap.io',
    subject: 'Test directo',
    html: '<b>Hola</b>'
  });
}).then(info => {
  console.log('Enviado:', info.messageId || info);
}).catch(err => {
  console.error('Fallo SMTP:', err);
});
