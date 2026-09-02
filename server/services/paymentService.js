/**
 * Modular Korean Payment Gateway Adapter
 * Designed for seamless integration with PortOne (포트원 / Iamport), Toss Payments, KG Inicis, KakaoPay, and NaverPay.
 */
export const paymentService = {
  /**
   * Process a payment request
   * @param {Object} paymentData
   * @param {string} paymentData.method - 'card' | 'kakaopay' | 'naverpay' | 'tosspay' | 'vbank' | 'bank_transfer'
   * @param {number} paymentData.amount - Amount in KRW
   * @param {string} paymentData.orderNumber - Unique order number
   * @param {Object} paymentData.customer - Customer info
   * @returns {Promise<{ success: boolean, transactionId: string, status: string, details?: any }>}
   */
  async processPayment(paymentData) {
    const { method, amount, orderNumber, customer } = paymentData;

    // Simulation of payment validation & gateway response
    if (amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    const txPrefix = method.toUpperCase().slice(0, 4);
    const transactionId = `TX_${txPrefix}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    if (method === 'bank_transfer' || method === 'vbank') {
      return {
        success: true,
        transactionId,
        status: 'pending', // Waiting for bank deposit
        virtualAccount: {
          bankName: '신한은행 (Shinhan Bank)',
          accountNumber: '110-482-' + Math.floor(100000 + Math.random() * 900000),
          holder: '주식회사 노을',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      };
    }

    // Direct card / easy-pay methods (KakaoPay, NaverPay, Toss)
    return {
      success: true,
      transactionId,
      status: 'paid',
      paidAt: new Date().toISOString(),
      provider: method
    };
  },

  /**
   * Process a refund
   */
  async processRefund(orderNumber, amount, reason) {
    return {
      success: true,
      refundId: `RF_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      amount,
      reason,
      refundedAt: new Date().toISOString()
    };
  }
};
