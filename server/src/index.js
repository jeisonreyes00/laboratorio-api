import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

import { seedDemoUsers, findUserByEmail, getFailed, setFailed, appendLog, addResetToken, consumeResetToken, updateUserPassword, registerUser, getDb } from './store/users.js';
import { sendMail } from './mailer.js';

const app = express();
const ORIGIN = 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || 'false') === 'true';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

app.use(cors({ origin: [ORIGIN], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

await seedDemoUsers();

function createToken(user) { return jwt.sign({ sub: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '2h' }); }

function authMiddleware(req, res, next) {
  try {
    let token = req.cookies?.token || null;
    if (!token) {
      const auth = req.headers.authorization || '';
      const parts = auth.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) token = parts[1];
    }
    if (!token) return res.status(401).json({ message: 'Token requerido' });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; next();
  } catch (e) { return res.status(401).json({ message: 'Token inválido' }); }
}
function role(required) { return (req, res, next) => { if (!req.user) return res.status(401).json({ message: 'No autenticado' }); if (req.user.role !== required) return res.status(403).json({ message: 'Prohibido' }); next(); }; }

app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Campos requeridos' });
  const passwordHash = await bcrypt.hash(password, 10);
  try { const u = registerUser({ name, email, role, passwordHash }); return res.status(201).json({ id: u.id, name: u.name, email: u.email, role: u.role }); }
  catch (e) { return res.status(400).json({ message: e.message }); }
});

const LOCK_MINUTES = 15;
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email y password son requeridos' });
  const failed = getFailed(email); const now = Date.now();
  if (failed.lockedUntil && failed.lockedUntil > now) { appendLog('login_locked', email, { lockedUntil: new Date(failed.lockedUntil).toISOString() }); return res.status(429).json({ message: 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde.' }); }
  const user = findUserByEmail(email);
  if (!user) { const next = { count: failed.count + 1, lockedUntil: failed.count + 1 >= 5 ? now + LOCK_MINUTES*60000 : 0 }; setFailed(email, next); appendLog('login_fail', email, { reason: 'user_not_found', count: next.count }); return res.status(401).json({ message: 'Credenciales inválidas' }); }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) { const next = { count: failed.count + 1, lockedUntil: failed.count + 1 >= 5 ? now + LOCK_MINUTES*60000 : 0 }; setFailed(email, next); appendLog('login_fail', email, { reason: 'bad_password', count: next.count }); return res.status(401).json({ message: 'Credenciales inválidas' }); }
  setFailed(email, { count: 0, lockedUntil: 0 });
  const token = createToken(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: COOKIE_SECURE, maxAge: 1000*60*60*2 });
  appendLog('login_success', email, { role: user.role });
  return res.json({ user: { name: user.name, email: user.email, role: user.role } });
});

app.post('/api/logout', (req, res) => { res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: COOKIE_SECURE }); appendLog('logout', req.user?.email || 'unknown', {}); res.status(204).end(); });
app.get('/api/me', authMiddleware, (req, res) => { appendLog('whoami', req.user.email, {}); res.json({ id: req.user.sub, name: req.user.name, email: req.user.email, role: req.user.role }); });

app.post('/api/request-password-reset', async (req, res) => {
  const { email } = req.body || {}; if (!email) return res.status(400).json({ message: 'Email requerido' });
  const user = findUserByEmail(email); const token = crypto.randomBytes(32).toString('hex');
  if (user) { const tokenHash = await bcrypt.hash(token, 10); const exp = Date.now() + 1000*60*30; addResetToken(user.id, tokenHash, exp); const resetLink = `${APP_BASE_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`; await sendMail(email, 'Recuperación de contraseña', `<p>Hola ${user.name},</p><p>Haz clic para restablecer tu contraseña:</p><p><a href="${resetLink}">${resetLink}</a></p><p>El enlace expira en 30 minutos.</p>`); appendLog('password_reset_requested', email, { exp }); console.log('[reset-link]', resetLink); }
  return res.json({ message: 'Si el email existe, se ha enviado un enlace de recuperación.' });
});
app.post('/api/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body || {}; if (!email || !token || !newPassword) return res.status(400).json({ message: 'Datos incompletos' });
  const user = findUserByEmail(email); if (!user) return res.status(400).json({ message: 'Token inválido' });
  const db = getDb(); const record = db.resetTokens.find(rt => rt.userId === user.id && rt.exp > Date.now()); if (!record) return res.status(400).json({ message: 'Token inválido o expirado' });
  const matches = await bcrypt.compare(token, record.hash); if (!matches) return res.status(400).json({ message: 'Token inválido' });
  const ok = consumeResetToken(user.id, record.hash); if (!ok) return res.status(400).json({ message: 'Token inválido' });
  const newHash = await bcrypt.hash(newPassword, 10); updateUserPassword(user.id, newHash); appendLog('password_reset_success', email, {}); return res.json({ message: 'Contraseña actualizada correctamente' });
});

const products = [ { id: 1, name: 'Arroz 1kg', price: 5000 }, { id: 2, name: 'Aceite 1L', price: 12000 }, { id: 3, name: 'Leche 1L', price: 3800 }, { id: 4, name: 'Huevos docena', price: 12000 }, { id: 5, name: 'Azúcar 1kg', price: 4500 } ];
app.get('/api/products', authMiddleware, (req, res) => { appendLog('products_list', req.user.email, {}); res.json(products); });
app.get('/api/admin/metrics', authMiddleware, role('admin'), (req, res) => { const now = Date.now(); const points = Array.from({length: 12}, (_, i) => { const ts = new Date(now - (11 - i) * 86400000).toISOString().slice(0,10); return { day: ts, ventas: Math.floor(50 + Math.random() * 150) }; }); appendLog('metrics_view', req.user.email, { count: points.length }); res.json(points); });

const PORT = process.env.PORT || 4000; app.listen(PORT, () => { console.log(`[server] http://localhost:${PORT}`); console.log('Login: admin@example.com / 123456  |  user@example.com / 123456'); });
