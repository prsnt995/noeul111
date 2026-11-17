import { emailService } from './emailService.js';

const resultOf = result => ({
  success: Boolean(result?.success),
  error: result?.error || null,
  queued: result?.queued ?? !result?.success,
  delivered: result?.delivered ?? false,
  failed: !result?.success,
  transport: result?.transport || 'unknown',
  messageId: result?.messageId || null,
});

const amountOf = order => order?.total_amount ?? order?.amount ?? 0;

export const notificationService = {
  async sendOrderConfirmation(order) {
    return resultOf(await emailService.sendMail({
      to: order.customer_email,
      subject: `[NOEUL] 주문 확인 - ${order.order_number}`,
      template: 'order-confirmation',
      data: { order_number: order.order_number, total_amount: amountOf(order), items: order.items || [] }
    }));
  },

  async sendShippingUpdate(order) {
    return resultOf(await emailService.sendMail({
      to: order.customer_email,
      subject: `[NOEUL] 배송 변경 - ${order.order_number}`,
      template: 'shipping-update',
      data: { order_number: order.order_number, courier: order.courier_name, tracking: order.tracking_number }
    }));
  },

  async sendPaymentNotification(order) {
    return resultOf(await emailService.sendMail({
      to: order.customer_email,
      subject: `[NOEUL] 결제 완료 - ${order.order_number}`,
      template: 'payment-confirmation',
      data: { order_number: order.order_number, amount: amountOf(order) }
    }));
  },

  async sendCancellationNotification(order) {
    return resultOf(await emailService.sendMail({
      to: order.customer_email,
      subject: `[NOEUL] 주문 취소 - ${order.order_number}`,
      template: 'cancellation',
      data: { order_number: order.order_number, reason: order.cancel_reason || '고객 요청' }
    }));
  },

  async sendInquiryResponse(inquiry) {
    return resultOf(await emailService.sendMail({
      to: inquiry.customer_email,
      subject: `[NOEUL] 문의 답변 - #${inquiry.id}`,
      template: 'inquiry-response',
      data: { inquiry_id: inquiry.id, category: inquiry.category, response: inquiry.response }
    }));
  }
};
