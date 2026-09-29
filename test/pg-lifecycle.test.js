import {describe,it,expect} from 'vitest';
import {createLab} from './pg-lab/fixture.js';
import {runPaymentRecoveryBatch} from '../server/payments/recovery.js';
const payment={orderId:'lab_order_001',paymentKey:'lab_payment_001',amount:10000};
const refund={orderId:'lab-uuid',operationId:'refund-operation-001',amount:3000,reason:'반품',actorId:'admin'};
describe('키 없는 결제 생명주기 (테스트 전용 저장소)',()=>{
  it('정상 승인 → 부분취소 → 잔액 전액취소',async()=>{
    const lab=createLab();
    await lab.service.prepare(payment.orderId,'lab-user');
    await lab.service.confirm(payment,'lab-user');
    await lab.service.refund(refund);
    expect(lab.order.balanceAmount).toBe(7000);
    await lab.service.refund({...refund,amount:7000,operationId:'refund-operation-002'});
    expect(lab.order.status).toBe('refunded');
    expect(lab.order.balanceAmount).toBe(0);
    expect((await lab.client.retrieve()).status).toBe('PARTIAL_CANCELED');
  });
  it.each(['timeout','db-failure'])('승인 %s 이후 새 서비스 없이 워커 복구 및 승인 1회',async scenario=>{
    const lab=createLab(scenario);
    await expect(lab.service.confirm(payment,'lab-user')).rejects.toThrow();
    await expect(lab.service.confirm(payment,'lab-user')).rejects.toThrow();
    expect(lab.order.recoveryRequired).toBe(true);
    await runPaymentRecoveryBatch(lab);
    expect(lab.order.status).toBe('paid');
    expect(lab.counters.confirm).toBe(1);
  });
  it('환불 응답 유실 뒤 새 환불 차단 및 조회 복구',async()=>{
    const lab=createLab('refund-timeout');
    await lab.service.confirm(payment,'lab-user');
    await expect(lab.service.refund(refund)).rejects.toThrow();
    await expect(lab.service.refund({...refund,operationId:'another-operation'})).rejects.toThrow();
    await runPaymentRecoveryBatch(lab);
    expect(await lab.service.refund(refund)).toEqual({status:'PARTIAL_CANCELED',balanceAmount:7000});
    expect(lab.counters.cancel).toBe(1);
  });
  it('동시 승인/동시환불 및 완료 키 다른 내용 거절',async()=>{
    const lab=createLab();
    await Promise.allSettled([lab.service.confirm(payment,'lab-user'),lab.service.confirm(payment,'lab-user')]);
    expect(lab.counters.confirm).toBe(1);
    await Promise.allSettled([lab.service.refund(refund),lab.service.refund({...refund,operationId:'another-operation'})]);
    expect(lab.counters.cancel).toBe(1);
    await expect(lab.service.refund({...refund,amount:1})).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  });
});
