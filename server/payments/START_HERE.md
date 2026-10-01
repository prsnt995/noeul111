# 토스 테스트 결제 연결: 적용 순서

이 저장소에는 결제 화면, 서버 승인/환불 API, Supabase 저장소 코드가 들어 있습니다. 별도 결제 활성화 스위치는 없습니다. **회사 Supabase DB 함수와 같은 상점의 테스트 키 두 개가 준비되면** `/checkout`의 결제 버튼이 활성화됩니다. 현재 운영 사이트에서 결제가 된다는 뜻은 아닙니다.

1. 회사 Supabase 프로젝트에 기존 `app.orders`, `app.payments`, `app.order_items` 등이 있는지 확인합니다. 기존 마이그레이션을 적용한 프로젝트라면 `supabase/migrations/202610010001_toss_payment_store.sql`을 다음 순서로 적용합니다. SQL 오류가 나면 임의로 테이블을 삭제하거나 초기화하지 말고 오류 전문을 공유합니다.
2. 서버에 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_ORIGIN`, `SESSION_KEY`를 설정합니다. `APP_ORIGIN`은 스테이징 HTTPS 주소와 정확히 같아야 합니다. 시크릿 키는 브라우저 번들에 넣지 않습니다.
3. **같은 토스 상점의 결제위젯용 테스트 키 쌍**을 서버 환경의 `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`에 설정합니다. UI/약관 설정은 `TOSS_WIDGET_VARIANT_KEY=DEFAULT`, `TOSS_AGREEMENT_VARIANT_KEY=AGREEMENT`입니다. 키는 채팅·Git 커밋에 붙이지 않습니다. 로컬 `.env.pg-test`는 `pg:sandbox` 전용이므로 일반 서버는 자동으로 읽지 않습니다.
4. `npm run pg:preflight`를 실행합니다. 테스트 키, 서버 DB 접근, `pg_payment_health()`가 모두 PASS여야 합니다. `npm run ci`도 실행합니다.
5. 정상 API·프런트를 HTTPS 스테이징에 배포합니다. `GET /api/v1/payments/toss/config`의 `data.enabled=true`를 확인합니다. false이면 키 또는 DB/권한이 아직 연결되지 않은 것입니다. `pg:lab`이나 `pg:sandbox`를 배포하지 않습니다.
6. 테스트 고객으로 실제 상품의 주문을 만든 뒤 `/checkout` → 토스 위젯 → 테스트 인증 → 서버 승인 → 주문 `paid`/결제 원장/Toss 테스트내역을 대조합니다. 이어서 관리자 3,000원 부분취소와 잔액 취소, 새로고침·중복 클릭·서버 재시작 복구를 확인합니다. [전체 검증표](./TESTING.md)를 따릅니다.

오류가 나면 **스테이징 URL, 적용 커밋, 실패 단계, HTTP 상태/오류 코드, 비밀값을 지운 서버 로그**를 공유해주세요. 키와 고객 카드 정보는 보내지 않습니다. 운영키·실결제 전환은 토스 심사와 별도 검증 후 진행합니다.
