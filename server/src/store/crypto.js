import crypto from 'crypto';
const keyHex = process.env.DATA_KEY || '';
if (!keyHex || keyHex.length < 64) {
  console.warn('[crypto] DATA_KEY no configurada o inválida. Usando clave débil DEMO (no usar en prod).');
}
const KEY = Buffer.from((keyHex && keyHex.length >= 64 ? keyHex : '0'.repeat(64)), 'hex');
export function encryptJson(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.from(JSON.stringify(obj), 'utf8');
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}
export function decryptJson(b64) {
  if (!b64) return null;
  const buf = Buffer.from(b64, 'base64');
  const iv = buf.subarray(0,12);
  const tag = buf.subarray(12,28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString('utf8'));
}
