import fs from 'fs';
import path from 'path';
import { encryptJson, decryptJson } from './crypto.js';
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
function safeRead(file) {
  if (!fs.existsSync(file)) return null;
  const b64 = fs.readFileSync(file, 'utf8');
  return decryptJson(b64);
}
function safeWrite(file, obj) {
  const b64 = encryptJson(obj);
  fs.writeFileSync(file, b64, 'utf8');
}
export class FileStore {
  constructor(filename, def) {
    this.file = path.join(DATA_DIR, filename);
    this.def = def;
    if (!fs.existsSync(this.file)) safeWrite(this.file, def);
  }
  read() { return safeRead(this.file) ?? this.def; }
  write(obj) { safeWrite(this.file, obj); }
  update(mut) { const curr = this.read(); const next = mut(curr); this.write(next); return next; }
}
