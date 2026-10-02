import React, { useRef, useState } from 'react';
import { adminApi } from '../../utils/api.js';

// 관리자 API는 주문 UUID를 받고, 저장소가 토스 공개 주문번호로 변환합니다.
export default function AdminPaymentActions({ orderId }) {
  const [snapshot, setSnapshot] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const operation = useRef(null);
  async function run(refund = false) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage('');
    try {
      await adminApi.get('/me');
      if (refund) {
        // 응답 불명 시 같은 작업 ID/내용을 보존합니다. 실제 동시성 제어는 DB에서 수행합니다.
        operation.current ||= { operationId: crypto.randomUUID(), amount: Number(amount), reason: reason.trim() };
        const op = operation.current;
        await adminApi.post(`/admin/payments/${encodeURIComponent(orderId)}/refunds`, op, { headers: { 'Idempotency-Key': op.operationId } });
        operation.current = null;
        setAmount(''); setReason('');
        setMessage('PG 취소와 서버 저장이 완료되었습니다.');
      }
      const { data } = await adminApi.post(`/admin/payments/${encodeURIComponent(orderId)}/recover`, {});
      setSnapshot(data);
      if (!data.recoveryRequired) operation.current = null;
    } catch { setSnapshot(null); setMessage('처리 여부 확인이 필요합니다. 새 환불을 만들지 말고 상태를 다시 조회하세요.'); }
    finally { lock.current = false; setBusy(false); }
  }
  const canRefund = snapshot && !snapshot.recoveryRequired
    && Number.isSafeInteger(Number(amount)) && Number(amount) > 0
    && Number(amount) <= (snapshot.balanceAmount || 0)
    && (snapshot?.isPartialCancelable !== false || Number(amount) === snapshot.balanceAmount)
    && reason.trim();
  return (
    <section className="adm-card" style={{ padding: 16, marginBottom: 4 }} aria-label="토스 결제 취소 Toss refund">
      <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>토스 결제 · 전체/부분 취소 Toss Refund</h4>
      <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#71717a' }}>
        전체 취소는 조회된 잔액 전액을 입력하세요. 배송·반품 처리는 별도입니다.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" className="adm-btn" disabled={busy} onClick={() => run()}>
          {busy ? '조회 중…' : '결제 상태 조회·복구 Check status'}
        </button>
      </div>
      {snapshot && (
        <p style={{ fontSize: '0.85rem', margin: '0 0 8px' }}>
          상태: <strong>{snapshot.status}</strong> / 취소 가능 잔액: <strong>{snapshot.balanceAmount ?? '확인 필요'}원</strong>
          {snapshot.recoveryRequired && ' (복구 대기)'}
        </p>
      )}
      {snapshot?.isPartialCancelable === false && (
        <p style={{ fontSize: '0.8rem', color: '#92400e', margin: '0 0 8px' }}>이 결제는 전체 취소만 가능합니다.</p>
      )}
      <div className="adm-form-grid" style={{ marginBottom: 12 }}>
        <div>
          <label className="adm-label" htmlFor={`refund-amount-${orderId}`}>취소 금액(원) Amount</label>
          <input
            id={`refund-amount-${orderId}`}
            className="adm-input"
            type="number"
            min="1"
            step="1"
            value={amount}
            disabled={busy || !!operation.current}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="adm-label" htmlFor={`refund-reason-${orderId}`}>취소 사유 Reason</label>
          <input
            id={`refund-reason-${orderId}`}
            className="adm-input"
            maxLength={200}
            value={reason}
            disabled={busy || !!operation.current}
            onChange={e => setReason(e.target.value)}
          />
        </div>
      </div>
      <button type="button" className="adm-btn adm-btn-primary" onClick={() => run(true)} disabled={busy || !canRefund}>
        입력한 금액 취소 Refund
      </button>
      {message && <p role="alert" style={{ fontSize: '0.85rem', margin: '10px 0 0' }}>{message}</p>}
    </section>
  );
}
