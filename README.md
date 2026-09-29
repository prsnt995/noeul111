# NOEUL

## 토스 PG 연동 — 담당자 필독

**서버 적용 전에 [결제 모듈 연동 README](server/payments/README.md)를 반드시 읽고 체크리스트를 완료하세요.**

결제창·승인·이탈 복구·웹훅·전체/부분 환불·관리자 취소 모듈을 제공합니다. 실제 DB 어댑터는 미구현이며 기본 결제 상태는 비활성화입니다. 키 설정만으로 운영 결제가 준비되지 않습니다.

DB 담당자는 문서의 저장소 메서드, 원자적 잠금, 만료/취소 경합, 복구 작업 큐를 구현해야 합니다. 모의 테스트 통과와 실제 토스 결제/DB 저장/서버 배포 완료는 별도입니다.

코드 검증: `npm run ci`

키 없이 검증: `npm run test:pg` / `npm run pg:lab`

키 발급 후 준비 검사: `npm run pg:preflight` — [공식 문서 대조·검증 결과·실제 테스트 순서](server/payments/TESTING.md)

실제 토스 테스트 SDK/API만 로컬에서 확인: `npm run pg:sandbox` — Git 제외 `.env.pg-test`에 같은 세트의 `test_gck_`/`test_gsk_` 키를 설정합니다. 127.0.0.1:5192에서만 실행하며 실제 DB·인증 대신 임시 메모리를 사용합니다. 서버 배포·터널 공개 대상이 아닙니다.

외부 개발자에게 전달할 적용 요청: [INTEGRATOR_HANDOFF.md](server/payments/INTEGRATOR_HANDOFF.md).
