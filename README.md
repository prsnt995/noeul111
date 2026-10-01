# NOEUL

## 토스 PG 연동 — 담당자 필독

**먼저 [토스 결제 적용 순서](server/payments/START_HERE.md)를 따라주세요.**

결제창·승인·이탈 복구·웹훅·전체/부분 환불·관리자 취소 모듈과 Supabase DB 어댑터/마이그레이션을 제공합니다. DB 함수가 설치되고 서버에 키 쌍이 설정되면 결제 화면이 자동으로 열립니다. 테스트 결제 검증과 운영 심사는 별개입니다.

DB 담당자는 마이그레이션을 회사 프로젝트에 적용하고 스테이징에서 실제 토스 테스트 결제·DB 원장·환불·복구를 검증해야 합니다. 로컬 SQL/모의 테스트 통과는 배포 완료 증거가 아닙니다.

코드 검증: `npm run ci`

키 없이 검증: `npm run test:pg` / `npm run pg:lab`

키 발급 후 준비 검사: `npm run pg:preflight` — [공식 문서 대조·검증 결과·실제 테스트 순서](server/payments/TESTING.md)

실제 토스 테스트 SDK/API만 로컬에서 확인: `npm run pg:sandbox` — Git 제외 `.env.pg-test`에 같은 세트의 `test_gck_`/`test_gsk_` 키를 설정합니다. 127.0.0.1:5192에서만 실행하며 실제 DB·인증 대신 임시 메모리를 사용합니다. 서버 배포·터널 공개 대상이 아닙니다.

외부 개발자에게 전달할 적용 요청: [INTEGRATOR_HANDOFF.md](server/payments/INTEGRATOR_HANDOFF.md).
