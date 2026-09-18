import path from 'path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jwtSecret = process.env.JWT_SECRET || randomBytes(48).toString('hex');

export const CONFIG = {
  PORT: process.env.PORT || 5001,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: '7d',
  DB_PATH: path.join(__dirname, 'db', 'noeul.db'),
  STORE_NAME: 'NOEUL 노을',
  FREE_SHIPPING_THRESHOLD: 70000,
  DEFAULT_SHIPPING_FEE: 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
