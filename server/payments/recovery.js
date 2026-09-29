// HANDOFF(PG_ONLY): 서버/브라우저 재시작과 무관하게 DB의 복구 작업을 처리합니다.
// 결제 승인·환불을 재호출하지 않습니다. 조회 실패는 잠금을 유지하고 재조회합니다.
export async function runPaymentRecoveryBatch({ service, store, now = Date.now() }) {
  if (!service.configured()) return { skipped: true };
  const jobs = await store.claimRecoveryBatch({ limit: 1, now, leaseMs: 120000 });
  const result = { recovered: 0, pending: 0 };
  for (const job of jobs) {
    let resolved = false;
    try {
      const state = await service.recover(job.orderId, null, true);
      resolved = !state.recoveryRequired;
    } catch { /* 토스/DB 장애는 재결제 사유가 아닙니다. */ }
    const attempts = (job.attempts || 0) + 1;
    await store.deferRecovery({ jobId: job.id, leaseToken: job.leaseToken, resolved, attempts,
      nextRunAt: now + Math.min(3600000, 30000 * 2 ** Math.min(attempts, 7)),
      needsReview: !resolved && attempts >= 10 });
    result[resolved ? 'recovered' : 'pending']++;
  }
  return result;
}

export function startPaymentRecoveryWorker({ service, store, intervalMs = 30000, onError = console.error }) {
  if (!service.configured()) return () => {};
  let stopped = false;
  let timer;
  const tick = async () => {
    try { await runPaymentRecoveryBatch({ service, store }); }
    catch { onError('[Payments] 복구 작업 실패: DB/운영 알림을 확인하세요.'); }
    if (!stopped) { timer = setTimeout(tick, intervalMs); timer.unref?.(); }
  };
  void tick();
  return () => { stopped = true; clearTimeout(timer); };
}
