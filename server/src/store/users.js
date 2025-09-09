import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { FileStore } from './fileStore.js';

const defaultDb = { users: [], resetTokens: [], failed: {}, logs: [] };
const db = new FileStore('users.enc.json', defaultDb);
export function getDb() { return db.read(); }
export function saveDb(next) { db.write(next); }

export async function seedDemoUsers() {
  const curr = getDb();
  if (curr.users.length) return;
  const hash = await bcrypt.hash('123456', 10);
  curr.users.push({ id: uuidv4(), name: 'Admin', email: 'jeisonr843@gmail.com', role: 'admin', passwordHash: hash });
  curr.users.push({ id: uuidv4(), name: 'Usuario', email: 'jeisonhreyes00@gmail.com', role: 'user', passwordHash: hash });
  saveDb(curr);
}
export function appendLog(type, email, details={}) { const curr = getDb(); curr.logs.push({ ts: new Date().toISOString(), type, email, details }); saveDb(curr); }
export function findUserByEmail(email) { const curr = getDb(); return curr.users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null; }
export function getFailed(email) { const curr = getDb(); return curr.failed[email?.toLowerCase()] || { count: 0, lockedUntil: 0 }; }
export function setFailed(email, data) { const curr = getDb(); curr.failed[email?.toLowerCase()] = data; saveDb(curr); }
export function addResetToken(userId, hash, exp) { const curr = getDb(); curr.resetTokens = curr.resetTokens.filter(rt => rt.userId !== userId); curr.resetTokens.push({ id: uuidv4(), userId, hash, exp }); saveDb(curr); }
export function consumeResetToken(userId, tokenHash) { const curr = getDb(); const idx = curr.resetTokens.findIndex(rt => rt.userId === userId && rt.hash === tokenHash && rt.exp > Date.now()); if (idx === -1) return false; curr.resetTokens.splice(idx,1); saveDb(curr); return true; }
export function updateUserPassword(userId, newHash) { const curr = getDb(); const u = curr.users.find(x => x.id === userId); if (u) u.passwordHash = newHash; saveDb(curr); }
export function registerUser({ name, email, role, passwordHash }) { const curr = getDb(); if (curr.users.some(u => u.email.toLowerCase() == email.toLowerCase())) throw new Error('Email ya existe'); const u = { id: uuidv4(), name, email, role, passwordHash }; curr.users.push(u); saveDb(curr); appendLog('user_created', email, { role }); return u; }
