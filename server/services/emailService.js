import nodemailer from 'nodemailer';

const CS_TARGET_EMAIL = process.env.CS_TARGET_EMAIL || 'noeulenterprises@gmail.com';

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || 'noeulenterprises@gmail.com';
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASSWORD;

  if (pass) {
    return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  }
  return nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
};

export const emailService = {
  // Finding #23: delivery states are honest. The stream transport only
  // buffers mail in-process (dev/test) — it must never report delivery.
  // In production a missing SMTP password fails closed.
  async sendMail({ to, subject, template, data }) { // eslint-disable-line no-unused-vars -- template/data reserved for the template renderer; delivery state is the contract here
    const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASSWORD;
    const streaming = !pass;
    if (streaming && process.env.NODE_ENV === 'production' && process.env.EMAIL_ALLOW_STREAM !== '1') {
      throw new Error('SMTP is not configured (production delivery required)');
    }
    const transporter = createTransporter();
    const mailOptions = { from: `"NOEUL 고객센터" <${process.env.SMTP_USER || 'noeulenterprises@gmail.com'}>`, to, subject };
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Sent to ${to}: ${info.messageId || 'sent'}`);
      return streaming
        ? { success: true, queued: true, delivered: false, transport: 'stream', messageId: info.messageId || null }
        : { success: true, queued: false, delivered: true, transport: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to ${to}:`, err.message);
      return { success: false, queued: false, delivered: false, transport: streaming ? 'stream' : 'smtp', messageId: null, error: err.message };
    }
  },

  async sendCustomerInquiry({ name, email, phone, category, message, inquiryId }) {
    const categoryLabels = { shipping: '배송 문의', return: '교환 및 반품 문의', product: '상품 관련 문의', payment: '결제 및 입금 문의', other: '기타 일반 문의' };
    const categoryTitle = categoryLabels[category] || category || '고객 문의';
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const subject = `[NOEUL 고객문의 #${inquiryId || 'NEW'}] ${categoryTitle} - ${name}님`;
    const htmlContent = `<div style="font-family:'Pretendard',sans-serif;max-width:650px;margin:0 auto;background:#0d0d0e;color:#f4f4f5;padding:32px;border-radius:12px;border:1px solid #232328;"><div style="border-bottom:2px solid #e05638;padding-bottom:16px;margin-bottom:24px;"><h1 style="color:#fff;font-size:20px;margin:0 0 6px;">📩 NOEUL 새로운 고객센터 문의 접수</h1><p style="color:#8e8e93;font-size:13px;margin:0;">접수 일시: ${timestamp}</p></div><div style="background:#141416;padding:20px;border-radius:8px;border:1px solid #232328;margin-bottom:24px;"><h2 style="color:#e05638;font-size:15px;margin-top:0;margin-bottom:12px;">고객 정보</h2><table style="width:100%;border-collapse:collapse;font-size:14px;color:#d1d1d6;"><tr><td style="padding:6px 0;color:#8e8e93;width:100px;">성함:</td><td style="padding:6px 0;color:#fff;font-weight:bold;">${name}</td></tr><tr><td style="padding:6px 0;color:#8e8e93;">이메일:</td><td style="padding:6px 0;color:#e05638;"><a href="mailto:${email}" style="color:#e05638;text-decoration:underline;">${email}</a></td></tr><tr><td style="padding:6px 0;color:#8e8e93;">연락처:</td><td style="padding:6px 0;color:#fff;">${phone || '미기재'}</td></tr><tr><td style="padding:6px 0;color:#8e8e93;">문의 유형:</td><td style="padding:6px 0;color:#fff;font-weight:bold;">${categoryTitle}</td></tr></table></div><div style="background:#141416;padding:20px;border-radius:8px;border:1px solid #232328;margin-bottom:24px;"><h2 style="color:#fff;font-size:15px;margin-top:0;margin-bottom:12px;">문의 내용</h2><div style="font-size:14px;line-height:1.7;color:#f4f4f5;white-space:pre-wrap;">${message.replace(/\n/g,'<br/>')}</div></div><div style="font-size:12px;color:#68686d;border-top:1px solid #1a1a1e;padding-top:16px;text-align:center;">이 메일은 NOEUL 공식 웹사이트(noeul.me) 고객센터 폼에서 자동으로 전달되었습니다.<br/>답장(Reply) 시 고객 이메일(${email})로 회신하실 수 있습니다.</div></div>`;
    const mailOptions = { from: `"${name} (NOEUL 고객문의)" <${process.env.SMTP_USER || 'noeulenterprises@gmail.com'}>`, to: CS_TARGET_EMAIL, replyTo: email, subject, html: htmlContent };
    try { const transporter = createTransporter(); const info = await transporter.sendMail(mailOptions); console.log(`[EmailService] Customer inquiry sent to ${CS_TARGET_EMAIL}. MessageId: ${info.messageId || 'sent'}`); return { success: true, messageId: info.messageId }; } catch (error) { console.error('[EmailService] Failed to send:', error); return { success: false, error: error.message }; }
  }
};
