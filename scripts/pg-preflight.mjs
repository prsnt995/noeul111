// 네트워크/결제/DB 쓰기 없이 실제 테스트에 필요한 연결 누락만 진단합니다.
// 키값은 출력하지 않습니다. 이 검사를 통과해도 실결제 검증은 별도입니다.
import 'dotenv/config';
import {createClient} from '@supabase/supabase-js';
import {createPaymentStore} from '../server/payments/store.js';
const required=['readOrder','prepareAttempt','claimConfirmation','completeConfirmation','claimRefund','completeRefund','readPayment','readAdminPayment','reconcile','claimRecoveryBatch','deferRecovery'];
const database = () => createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}).schema('app');
const paymentStore = createPaymentStore({database});
const hasDb = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const checks = [
 ['테스트 위젯 클라이언트 키',/^test_gck_/.test(process.env.TOSS_CLIENT_KEY || '')],
 ['테스트 위젯 시크릿 키',/^test_gsk_/.test(process.env.TOSS_SECRET_KEY || '')],
 ['Supabase 서버 연결 정보',hasDb],
 ['기본 서버 워커 비활성화 설정 없음',process.env.WORKERS_ENABLED !== '0'],
 ...required.map(name=>[`DB 어댑터 ${name}`,typeof paymentStore?.[name] === 'function']),
];
checks.push(['DB 결제 함수 설치 및 접근',hasDb && await paymentStore.checkReady()]);
for(const [label,ok] of checks) console.log(`${ok?'PASS':'BLOCKED'} ${label}`);
console.log('이 검사는 키 형식, 저장소 메서드, DB 함수 접근만 확인합니다. 키 쌍/MID/DB 원자성/웹훅/실제 결제는 TESTING.md 절차로 검증하세요.');
process.exitCode=checks.every(([,ok])=>ok)?0:1;
