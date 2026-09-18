import { emailService } from './emailService.js';

export const notificationService = {
  async sendOrderConfirmation(order) {
    const result = await emailService.sendMail({
      to: order.customer_email,
      subject: `[NOEUL] 주문 확인 - ${order.order_number}`,
      template: 'order-confirmation',
      data: { order_number: order.order_number, total_amount: order.total_amount, items: order.items || [] }
    });
    return { success: result.success, queued: result.queued ?? !result.success, delivered: result.delivered ?? false, failed: !result.success, transport: result.transport || 'unknown', messageId: result.messageId };
  },

  async sendShippingUpdate(order) {
    const result = await emailService.sendMail({
      to: order.customer_email,
      subject: `[NOEUL] 배송 변경 - ${order.order_number}`,
      template: 'shipping-update',
      data: { order_number: order.order_number, courier: order.courier_name, tracking: order.tracking_number }
    });
    return { success: result.success, queued: result.queued ?? !result.success, delivered: result.delivered ?? false, failed: !result.success, transport: result.transport || 'unknown', messageId: result.messageId };
  },

  async sendPaymentNotification(order) {
    const result = await emailService.sendMail({
      to: order.customer_email,
      subject: `[NOEUL] 결제 완료 - ${order.order_number}`,
      template: 'payment-confirmation',
      data: { order_number: order.order_number, amount: order.total_amount }
    });
    return { success: result.success, queued: result.queued ?? !result.success, delivered: result.delivered ?? false, failed: !result.success, transport: result.transport || 'unknown', messageId: result.messageId };
  },

  async sendCancellationNotification(order) {
    const result = await emailService.sendMail({
      to: order.customer_email,
      subject: `[NOEUL] 주문 취소 - ${order.order_number}`,
      template: 'cancellation',
      data: { order_number: order.order_number, reason: order.cancel_reason || '고객 요청' }
    });
    return { success: result.success, queued: result.queued ?? !result.success, delivered: result.delivered ?? false, failed: !result.success, transport: result.transport || 'unknown', messageId: result.messageId };
  },

  async sendInquiryResponse(inquiry) {
    const result = await emailService.sendMail({
      to: inquiry.customer_email,
      subject: `[NOEUL] 문의 답변 - #${inquiry.id}`,
      template: 'inquiry-response',
      data: { inquiry_id: inquiry.id, category: inquiry.category, response: inquiry.response }
    });
    return { success: result.success, queued: result.queued ?? !result.success, delivered: result.delivered ?? false, failed: !result.success, transport: result.transport || 'unknown', messageId: result.messageId };
  }
};
