// 테스트 전용 SDK 대역. 토스 SDK나 카드사 화면 검증이 아닙니다.
export async function loadTossPayments() {
  return { widgets: () => ({
    setAmount: async () => {},
    renderPaymentMethods: async ({selector}) => {
      document.querySelector(selector).textContent = '모의 결제수단: 카드 (실제 청구 없음)';
      return {destroy:async () => { const el=document.querySelector(selector); if(el) el.textContent=''; }};
    },
    renderAgreement: async ({selector}) => {
      document.querySelector(selector).textContent = '모의 약관 영역';
      return {destroy:async () => { const el=document.querySelector(selector); if(el) el.textContent=''; }};
    },
    requestPayment: async ({orderId,successUrl,failUrl}) => {
      if (new URLSearchParams(location.search).get('scenario') === 'cancel') { location.href = failUrl; return; }
      location.href = `${successUrl}?orderId=${orderId}&paymentKey=lab_payment_001&amount=10000`;
    },
  }) };
}
