import { describe, it, expect, vi } from 'vitest';
import { runPaymentRecoveryBatch } from '../server/payments/recovery.js';

describe('durable recovery worker', () => {
  const job = { id: 'job1', orderId: 'uuid1', leaseToken: 'lease1', attempts: 0 };
  function fixture() {
    return { service: { configured: () => true, recover: vi.fn(async () => ({ recoveryRequired: false })) },
      store: { claimRecoveryBatch: vi.fn(async () => [job]), deferRecovery: vi.fn(async () => {}) }, now: 1000 };
  }
  it('runs without any browser callback and completes only resolved jobs', async () => {
    const args = fixture();
    expect(await runPaymentRecoveryBatch(args)).toEqual({ recovered: 1, pending: 0 });
    expect(args.service.recover).toHaveBeenCalledWith('uuid1', null, true);
    expect(args.store.deferRecovery).toHaveBeenCalledWith(expect.objectContaining({ leaseToken: 'lease1', resolved: true }));
  });
  it('retains unknown outcomes and schedules retry rather than another charge', async () => {
    const args = fixture(); args.service.recover.mockRejectedValue(new Error('timeout'));
    expect(await runPaymentRecoveryBatch(args)).toEqual({ recovered: 0, pending: 1 });
    expect(args.store.deferRecovery).toHaveBeenCalledWith(expect.objectContaining({ resolved: false, nextRunAt: 61000 }));
  });
  it('escalates repeated ambiguity without abandoning recovery', async () => {
    const args = fixture(); args.store.claimRecoveryBatch.mockResolvedValue([{ ...job, attempts: 9 }]);
    args.service.recover.mockResolvedValue({ recoveryRequired: true });
    await runPaymentRecoveryBatch(args);
    expect(args.store.deferRecovery).toHaveBeenCalledWith(expect.objectContaining({ needsReview: true, resolved: false, attempts: 10 }));
  });
  it('skips an unconfigured module and surfaces queue persistence failures', async () => {
    const args = fixture(); args.service.configured = () => false;
    expect(await runPaymentRecoveryBatch(args)).toEqual({ skipped: true });
    expect(args.store.claimRecoveryBatch).not.toHaveBeenCalled();
    args.service.configured = () => true; args.store.deferRecovery.mockRejectedValue(new Error('DB'));
    await expect(runPaymentRecoveryBatch(args)).rejects.toThrow('DB');
  });
});
