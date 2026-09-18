import { describe, it, expect } from 'vitest';
import { paymentService } from '../server/services/paymentService.js';
import { CONFIG } from '../server/config.js';
import fs from 'node:fs';

describe('Phase 1 — Additional Regression Tests', () => {
  describe('Finding #3 — Seed admin password removed', () => {
    it('should not contain default admin credentials in seed source', () => {
      const seedSource = fs.readFileSync(new URL('../server/db/seed.js', import.meta.url), 'utf-8');
      expect(seedSource).not.toContain('admin1234');
      expect(seedSource).not.toContain('customer1234');
      expect(seedSource).not.toContain('bcrypt.hashSync');
    });
  });

  describe('Finding #1 — Payments without provider verification disabled', () => {
    it('should reject all payment methods via legacy adapter', async () => {
      await expect(paymentService.processPayment({ method: 'card', amount: 10000 })).rejects.toThrow('Legacy payments disabled');
      await expect(paymentService.processPayment({ method: 'vbank', amount: 10000 })).rejects.toThrow('Legacy payments disabled');
      await expect(paymentService.processPayment({ method: 'bank_transfer', amount: 10000 })).rejects.toThrow('Legacy payments disabled');
    });

    it('should reject refunds via legacy adapter', async () => {
      await expect(paymentService.processRefund({ orderId: 1 })).rejects.toThrow('Legacy refunds disabled');
    });
  });

  describe('Finding #2 — JWT secret strength', () => {
    it('should have a cryptographically strong JWT secret', () => {
      expect(CONFIG.JWT_SECRET.length).toBeGreaterThan(32);
    });
  });
});
