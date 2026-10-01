# 토스 직접 결제 모듈 — 서버 적용 전 필수 연동 안내

**현재 상태: PG 모듈과 Supabase DB 어댑터/마이그레이션이 코드에 있습니다.** 회사 DB 적용·실제 서버 키 주입·배포·결제 검증은 아직 확인되지 않았습니다. 키와 DB 함수가 모두 준비되기 전에는 결제 화면이 자동으로 비활성화됩니다. [간단 적용 순서](./START_HERE.md)를 먼저 보세요.

검증 명령·키 발급 후 실행 순서·결과 양식은 [TESTING.md](./TESTING.md)를 따릅니다.

## 적용 순서

1. 회사 DB의 기존 주문 스키마를 확인하고 `202610010001_toss_payment_store.sql`을 순서대로 적용합니다. 이미 적용된 데이터와 충돌하면 중단하고 보고합니다.
2. `store.js`가 호출하는 `pg_payment_action`과 `pg_payment_health`가 서버 역할에서 실행 가능한지 확인합니다. 재고·쿠폰은 결제 확정 트랜잭션에서 한 번만 반영합니다.
3. 같은 상점의 토스 **결제위젯용 테스트** 클라이언트/시크릿 키, DEFAULT 결제 UI/AGREEMENT 약관을 설정합니다. 시크릿 키는 서버 환경변수에만 저장합니다.
4. 성공/실패 URL의 SPA 라우팅, 세션 쿠키, CSRF, HTTPS 및 웹훅을 연결합니다. 웹훅 URL은 `/api/v1/payments/toss/webhook`입니다.
5. 복구 워커를 상시 실행합니다. `node api/app.js`는 WORKERS_ENABLED가 0이 아니면 실행합니다. 다른 서버 진입점·서버리스는 `runPaymentRecoveryBatch`를 별도 스케줄러에 연결해야 합니다.
6. 별도 `PAYMENTS_ENABLED` 설정은 없습니다. 키와 DB 함수가 모두 준비되면 자동으로 열리므로 테스트 키만 주입하고 즉시 아래 실DB·토스 테스트를 수행합니다. 운영키 전환/실결제·실환불 검증은 별도입니다.

## 파일과 API

- `toss.js`: PG HTTP 클라이언트, 준비/승인/환불/조회 복구/웹훅 서비스.
- `routes.js`: 인증·역할·step-up이 적용된 API. 기존 서버의 CSRF 정책과 함께 사용합니다.
- `recovery.js`: 브라우저가 없어도 실행되는 DB 작업 큐 복구. 조회만 하며 승인/환불을 무조건 재호출하지 않습니다.
- `src/pages/TossPaymentPage.jsx`: 결제창, 성공/실패 복귀, 상태 재조회.
- `src/components/admin/AdminPaymentActions.jsx`: 관리자 전체/부분 취소. 전체 취소는 조회 잔액을 취소 금액으로 사용합니다.

| API | 입력/용도 |
|---|---|
| GET `/api/v1/payments/toss/config` | 활성 여부만 공개 |
| POST `/api/v1/payments/toss/prepare` | 소유자의 `{orderId}` → 서버 확정 금액/위젯 설정 |
| POST `/api/v1/payments/toss/confirm` | `{orderId, paymentKey, amount}` → 검증/DB 반영 이후 paid |
| POST `/api/v1/payments/toss/recover` | 소유자의 `{orderId}` → PG 조회/DB 복구 및 안전한 상태 |
| POST `/api/v1/admin/payments/:id/recover` | 관리자 주문 UUID → 조회/복구 |
| POST `/api/v1/admin/payments/:id/refunds` | `{amount,reason}`, `Idempotency-Key` 필수, 관리자 UUID |
| POST `/api/v1/payments/toss/webhook` | 통지의 상태/금액을 신뢰하지 않고 PG 조회 |

고객 orderId는 **공개 주문번호**이고 관리자 :id는 **DB UUID**입니다. 어댑터에서 명시적으로 변환하세요. 관리자 요청의 actorId는 서버 세션에서 얻으며 감사 원장에 보존합니다. 구매자에게 관리자 환불 API 권한을 부여하지 않습니다. 반품 승인 정책·배송비·재입고 판단은 주문 담당자가 연결해야 합니다.

## 필수 저장소 계약

모든 메서드는 Promise입니다. 오류는 throw해야 합니다. 아래 메서드 존재 여부만으로 실제 DB 구현의 정확성까지 검증되지는 않습니다.

| 메서드 | 입력 → 반환 / 필수 동작 |
|---|---|
| readOrder(orderId,userId) | 소유자 필터 필수. 없으면 null. `{orderId, amount, currency:'KRW', status, paymentKey?, customerKey, orderName, canResume, recoveryRequired, balanceAmount,isPartialCancelable}` |
| prepareAttempt(order) | 같은 주문의 준비 시도를 영속 저장. 금액 동결, 만료/취소와 원자적 경합 제어. 만료·진행 중·기결제면 거절. 반복 준비는 멱등 처리 |
| claimConfirmation(input) | `{orderId,userId,amount,paymentKey}`를 외부 호출 **전에** 저장. 주문/결제키 유일성, 소유자·금액 재검증. `{state:'claimed'|'paid'|'busy'}`. paid는 같은 키/금액 완료 건만 |
| completeConfirmation(input,payment) | 검증된 PG 결과를 원장+주문+outbox에 한 트랜잭션 저장. 실패 시 승인 시도 잠금 유지 |
| claimRefund(input) | `{orderId(UUID),actorId,operationId,reason,amount}`. 환불 권한/정책·잔액을 재검증하고 결제별 직렬화. 동일 operationId 다른 payload는 거절. `{state:'claimed',orderId(공개번호),paymentKey,amount,originalAmount,balanceBefore,isPartialCancelable}` 또는 `{state:'completed',result}` 또는 busy |
| completeRefund(input,payment) | PG 취소 transactionKey별 원장 기록, 잔액·주문·감사·outbox 원자 반영. 네트워크/DB 오류 시 잠금 유지 |
| readPayment(paymentKey) | 저장된 승인 시도/원장만 조회. `{orderId,amount,paymentKey}` 또는 null |
| readAdminPayment(uuid) | 관리자 UUID를 공개번호로 변환. readOrder와 동일한 상태 스냅샷. 임의 외부 주문을 조회하지 않음 |
| reconcile(payment) | PG 조회 결과를 트랜잭션으로 반영. 중복 transactionKey 제거, 상태 역행 금지. 진행 중 환불과 조회 결과의 상관관계까지 검증 |
| claimRecoveryBatch({limit,now,leaseMs}) | 기한 도래한 큐를 DB 잠금으로 점유. `[{id,orderId(UUID),leaseToken,attempts}]`. 큐는 prepare/claim과 같은 트랜잭션 생성. 프로세스 종료 시 리스 만료 후 재점유 |
| deferRecovery({jobId,leaseToken,resolved,attempts,nextRunAt,needsReview}) | 현재 리스 토큰일 때만 완료/재예약. resolved=true여도 최신 상태에 미해결 시도가 없는지 재확인. needsReview면 운영자 알림/검토 큐 기록 |

`canResume=true`는 DB가 만료 전·미결제·승인/환불 미진행을 확실히 판단했을 때만 반환합니다. recoveryRequired가 true이면 결제창 재진입과 새 환불을 막습니다. 최초 준비 이후 창이 열린 시도도 복구 큐에 남겨야 합니다.

### 이탈/응답 불명 처리

- 결제창 열기 전 이탈: DB 기한과 시도 상태에 따라 준비를 재개하거나 원자적으로 만료합니다.
- 인증 뒤 성공 페이지 도착 전 이탈: 클라이언트 콜백이 없으므로 임의 승인하지 않습니다. 공개 주문번호로 PG 조회합니다. IN_PROGRESS/조회 실패는 미결제 확정이 아닙니다. EXPIRED/ABORTED 확인 후 상태/예약 해제를 트랜잭션으로 처리합니다.
- 승인 성공 후 페이지 닫힘/서버 DB 장애: 승인 호출 전 저장된 paymentKey로 조회하여 DONE을 한 번 반영합니다. 주문을 pending으로 되돌리지 않습니다.
- 환불 성공 후 응답 유실: 취소 이력/잔액과 영속 환불 의도를 대조하여 반영합니다. 금액이 우연히 같다는 이유만으로 특정 환불 작업 완료라고 판단하지 않습니다. 연관을 확정할 수 없으면 잠금 유지+운영 확인합니다.
- 이미 청구된 뒤 만료 처리된 주문이 발견되면 출고/재고를 자동 복원하지 말고 운영 검토 대상으로 둡니다.
- 404·타임아웃·페이지 닫힘·DB 원장 없음은 결제 실패의 증거가 아닙니다. fallback은 **조회와 복구**이며 가짜 성공·자동 재청구가 아닙니다.

### 기존 주문 코드와 반드시 연결할 부분

`release_hold` RPC를 고객 취소/관리자 미결제 취소/만료 워커가 공유합니다. 기존 RPC를 그대로 운영해도 안전하다는 의미가 아닙니다. **PG 시도와 같은 행 잠금으로 확인하고 승인 진행·응답 불명·환불 진행 중에는 예약을 해제하지 않도록 수정해야 합니다.** RPC 오류 시 JS로 강제 상태 변경하는 fallback은 제거했습니다.

유료 주문의 단순 상태 변경 취소는 차단했습니다. 전체/부분 환불은 반드시 `/admin/payments/:id/refunds`를 사용해야 합니다. 부분환불의 상품별 수량·재고·쿠폰·포인트 정책과 이미 배송된 주문의 반품 절차는 담당자가 정의해야 합니다. 이 모듈은 금액만으로 재입고를 추측하지 않습니다.

## 지원 범위와 운영 검증

2026-09-29 로제나 테스트 API에서 3천원 + 잔액 7천원 취소 후 `PARTIAL_CANCELED`와 `balanceAmount=0`이 함께 반환되는 것을 확인했습니다. DB 어댑터는 PG 원본 상태를 보존하면서, 취소가 완료된 결제의 잔액 0원을 내부 `refunded`로 매핑해야 합니다. `CANCELED` 문자열만으로 전액 환불 여부를 판정하지 마세요.

즉시 승인형 카드/계약된 간편결제를 대상으로 합니다. **가상계좌/WAITING_FOR_DEPOSIT는 미지원**입니다. 토스 위젯에서 미지원 수단을 노출하지 마세요. 환불계좌가 필요한 수단/에스크로 별도 처리는 구현 후 활성화해야 합니다.

- [ ] 키 없이 config=false, 결제·환불 차단 확인
- [ ] 실제 DB 트랜잭션으로 다중 탭/다중 서버 승인 1회, 동일 키 다른 payload 거절
- [ ] 브라우저 종료: 창 열기 전/인증 후/승인 요청 직후/성공 화면 전 각각 검증
- [ ] 승인 성공+DB 장애, 서버 재시작, 웹훅 선도착/중복/역순 복구 검증
- [ ] 전체/부분환불, 동시환불, 잔액 초과, 동일 작업 재시도, 환불 성공+DB 장애 검증
- [ ] 만료/고객 취소/관리자 취소와 승인 경합 시 돈·재고·쿠폰 일관성 검증
- [ ] 위조 웹훅·타인 주문·관리자 권한/CSRF/step-up 거절 검증
- [ ] 복구 리스 만료/작업 재점유/오래된 리스 완료 거절/운영 알림 검증
- [ ] 토스 테스트 결제 → 서버 승인 → DB 원장 → 관리자 취소 → 토스 취소 원장 대조
- [ ] 운영 배포 후 실제 결제·정산·취소를 별도로 확인

현재 모의 테스트는 `test/toss-payments.test.js` 및 `test/payment-recovery.test.js`입니다. `npm run ci`는 코드 검증이며 실제 DB/토스/배포 성공 증거가 아닙니다.

공식 문서: [결제위젯](https://docs.tosspayments.com/guides/v2/payment-widget/integration), [API](https://docs.tosspayments.com/reference), [웹훅](https://docs.tosspayments.com/reference/using-api/webhook-events).
