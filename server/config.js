import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: process.env.PORT || 5001,
  JWT_SECRET: process.env.JWT_SECRET || 'noeul_korean_luxury_fashion_jwt_secret_2026_super_secure',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: path.join(__dirname, 'db', 'noeul.db'),
  STORE_NAME: 'NOEUL 노을',
  FREE_SHIPPING_THRESHOLD: 70000, // ₩70,000 KRW
  DEFAULT_SHIPPING_FEE: 3000,      // ₩3,000 KRW
};
