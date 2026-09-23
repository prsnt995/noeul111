// Retired adapter. It must never fabricate successful charges or refunds.
export const paymentService = {
  async processPayment() { throw new Error('Legacy payments disabled; use Toss via /api/v1'); },
  async processRefund() { throw new Error('Legacy refunds disabled; use verified Toss refunds'); },
};
