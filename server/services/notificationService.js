/**
 * Modular Notification Adapter
 * Ready for Kakao Alimtalk (카카오 알림톡), SMS (CoolSMS / Solapi), and Email notifications.
 */
export const notificationService = {
  /**
   * Send Order Confirmation
   */
  async sendOrderConfirmation(order) {
    console.log(`[Notification] Order confirmation sent for ${order.order_number} to ${order.customer_email || order.customer_phone}`);
    return { success: true };
  },

  /**
   * Send Shipping Status Update (with tracking number)
   */
  async sendShippingUpdate(order) {
    console.log(`[Notification] Shipping update sent for ${order.order_number}: Courier ${order.courier_name}, Tracking ${order.tracking_number}`);
    return { success: true };
  }
};
