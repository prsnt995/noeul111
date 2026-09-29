// 네트워크/결제/DB 쓰기 없이 실제 테스트에 필요한 연결 누락만 진단합니다.
// 키값은 출력하지 않습니다. 이 검사를 통과해도 실결제 검증은 별도입니다.
import 'dotenv/config';
import {paymentStore} from '../server/payments/store.js';
const required=['readOrder','prepareAttempt','claimConfirmation','completeConfirmation','claimRefund','completeRefund','readPayment','readAdminPayment','reconcile','claimRecoveryBatch','deferRecovery'];
const checks = [
 ['테스트 클라이언트 키',/^test_(gck|ck)_/.test(process.env.TOSS_CLIENT_KEY || '')],
 ['테스트 시크릿 키',/^test_(gsk|sk)_/.test(process.env.TOSS_SECRET_KEY || '')],
 ['결제 활성화',process.env.PAYMENTS_ENABLED === 'true'],
 ['기본 서버 워커 비활성화 설정 없음',process.env.WORKERS_ENABLED !== '0'],
 ...required.map(name=>[`DB 어댑터 ${name}`,typeof paymentStore?.[name] === 'function']),
];
for(const [label,ok] of checks) console.log(`${ok?'PASS':'BLOCKED'} ${label}`);
console.log('이 검사는 키 형식/메서드 존재만 확인합니다. 키 쌍/MID/DB 원자성/웹훅/실제 결제는 TESTING.md 절차로 검증하세요.');
process.exitCode=checks.every(([,ok])=>ok)?0:1;
