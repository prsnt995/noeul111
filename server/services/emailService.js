import nodemailer from 'nodemailer';

const CS_TARGET_EMAIL = process.env.CS_TARGET_EMAIL || 'noeulenterprises@gmail.com';

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const money = value => Number(value || 0).toLocaleString('ko-KR');

const wrap = (title, body) => `
<div style="font-family:'Pretendard',Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;color:#18181b;padding:32px;border-radius:12px;border:1px solid #e4e4e7;">
  <div style="border-bottom:2px solid #e05638;padding-bottom:14px;margin-bottom:22px;">
    <h1 style="margin:0;font-size:20px;color:#18181b;">NOEUL 노을</h1>
  </div>
  <h2 style="margin:0 0 14px;font-size:17px;">${escapeHtml(title)}</h2>
  <div style="font-size:14px;line-height:1.7;color:#3f3f46;">${body}</div>
  <p style="margin:26px 0 0;font-size:11px;color:#a1a1aa;border-top:1px solid #f0f0f0;padding-top:14px;">
    본 메일은 발신 전용입니다. 문의: noeulenterprises@gmail.com
  </p>
</div>`;

/**
 * Render the transactional templates that the notification service passes in.
 * Every value is escaped: order data originates from customer input.
 */
export function renderTemplate(template, data = {}) {
  const d = data || {};
  switch (template) {
    case 'order-confirmation': {
      const items = Array.isArray(d.items) ? d.items : [];
      const rows = items.map(it => {
        const name = it.product_name || it.name || it.sku || '상품';
        return `<li>${escapeHtml(name)} × ${escapeHtml(it.quantity ?? 1)}</li>`;
      }).join('');
      return {
        html: wrap('주문이 접수되었습니다', `
          <p>주문번호 <strong>${escapeHtml(d.order_number)}</strong></p>
          <p>결제 금액 <strong>${money(d.total_amount)}원</strong></p>
          ${rows ? `<ul style="padding-left:18px;margin:14px 0;">${rows}</ul>` : ''}
          <p>입금/결제가 확인되면 발송 준비를 시작합니다.</p>`),
        text: `NOEUL 주문 확인\n주문번호: ${d.order_number || ''}\n결제 금액: ${money(d.total_amount)}원`,
      };
    }
    case 'shipping-update':
      return {
        html: wrap('상품이 발송되었습니다', `
          <p>주문번호 <strong>${escapeHtml(d.order_number)}</strong></p>
          <p>택배사: ${escapeHtml(d.courier || 'CJ대한통운')}</p>
          <p>운송장 번호: <strong>${escapeHtml(d.tracking || '-')}</strong></p>`),
        text: `NOEUL 배송 안내\n주문번호: ${d.order_number || ''}\n택배사: ${d.courier || ''}\n운송장: ${d.tracking || ''}`,
      };
    case 'payment-confirmation':
      return {
        html: wrap('결제가 완료되었습니다', `
          <p>주문번호 <strong>${escapeHtml(d.order_number)}</strong></p>
          <p>결제 금액 <strong>${money(d.amount)}원</strong></p>`),
        text: `NOEUL 결제 완료\n주문번호: ${d.order_number || ''}\n결제 금액: ${money(d.amount)}원`,
      };
    case 'cancellation':
      return {
        html: wrap('주문이 취소되었습니다', `
          <p>주문번호 <strong>${escapeHtml(d.order_number)}</strong></p>
          <p>사유: ${escapeHtml(d.reason || '고객 요청')}</p>`),
        text: `NOEUL 주문 취소\n주문번호: ${d.order_number || ''}\n사유: ${d.reason || '고객 요청'}`,
      };
    case 'inquiry-response':
      return {
        html: wrap('문의 답변', `
          <p>문의번호 <strong>#${escapeHtml(d.inquiry_id)}</strong></p>
          <p>${escapeHtml(d.response || '').replace(/\n/g, '<br/>')}</p>`),
        text: `NOEUL 문의 답변 #${d.inquiry_id || ''}\n\n${d.response || ''}`,
      };
    case 'password-reset': {
      const link = escapeHtml(d.link || '');
      return {
        html: wrap('비밀번호 재설정', `
          <p>아래 버튼을 클릭하여 새 비밀번호를 설정해주세요. 링크는 1시간 동안 유효합니다.</p>
          <p style="margin:24px 0;">
            <a href="${link}" style="display:inline-block;background:#e05638;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px;">새 비밀번호 설정하기</a>
          </p>
          <p style="font-size:12px;color:#a1a1aa;word-break:break-all;">${link}</p>
          <p style="font-size:12px;color:#a1a1aa;">본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>`),
        text: `NOEUL 비밀번호 재설정\n\n아래 링크를 클릭하여 새 비밀번호를 설정해주세요 (1시간 유효):\n${d.link || ''}\n\n본인이 요청하지 않았다면 이 이메일을 무시해주세요.`,
      };
    }
    default:
      return { html: '', text: '' };
  }
}

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
  async sendMail({ to, subject, template, data, html, text }) {
    if (!to || !String(to).includes('@')) {
      return { success: false, queued: false, delivered: false, transport: 'none', messageId: null, error: 'MISSING_RECIPIENT' };
    }
    const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASSWORD;
    const streaming = !pass;
    if (streaming && process.env.NODE_ENV === 'production' && process.env.EMAIL_ALLOW_STREAM !== '1') {
      throw new Error('SMTP is not configured (production delivery required)');
    }
    const transporter = createTransporter();
    let bodyHtml = html;
    let bodyText = text;
    if ((!bodyHtml || !bodyText) && template) {
      const rendered = renderTemplate(template, data);
      if (!bodyHtml) bodyHtml = rendered.html || undefined;
      if (!bodyText) bodyText = rendered.text || undefined;
    }
    const mailOptions = {
      from: `"NOEUL 고객센터" <${process.env.SMTP_USER || 'noeulenterprises@gmail.com'}>`,
      to,
      subject,
      ...(bodyHtml ? { html: bodyHtml } : {}),
      ...(bodyText ? { text: bodyText } : {}),
    };
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Sent (${template || 'custom'}) messageId=${info.messageId || 'sent'}`);
      return streaming
        ? { success: true, queued: true, delivered: false, transport: 'stream', messageId: info.messageId || null }
        : { success: true, queued: false, delivered: true, transport: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed (${template || 'custom'}):`, err.message);
      return { success: false, queued: false, delivered: false, transport: streaming ? 'stream' : 'smtp', messageId: null, error: err.message };
    }
  },

  async sendCustomerInquiry({ name, email, phone, category, message, inquiryId }) {
    const categoryLabels = { shipping: '배송 문의', return: '교환 및 반품 문의', product: '상품 관련 문의', payment: '결제 및 입금 문의', other: '기타 일반 문의' };
    const categoryTitle = categoryLabels[category] || category || '고객 문의';
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || '미기재');
    const safeMessage = escapeHtml(message || '').replace(/\n/g, '<br/>');
    const subject = `[NOEUL 고객문의 #${escapeHtml(inquiryId || 'NEW')}] ${escapeHtml(categoryTitle)} - ${safeName}님`;
    const htmlContent = `<div style="font-family:'Pretendard',sans-serif;max-width:650px;margin:0 auto;background:#0d0d0e;color:#f4f4f5;padding:32px;border-radius:12px;border:1px solid #232328;"><div style="border-bottom:2px solid #e05638;padding-bottom:16px;margin-bottom:24px;"><h1 style="color:#fff;font-size:20px;margin:0 0 6px;">📩 NOEUL 새로운 고객센터 문의 접수</h1><p style="color:#8e8e93;font-size:13px;margin:0;">접수 일시: ${escapeHtml(timestamp)}</p></div><div style="background:#141416;padding:20px;border-radius:8px;border:1px solid #232328;margin-bottom:24px;"><h2 style="color:#e05638;font-size:15px;margin-top:0;margin-bottom:12px;">고객 정보</h2><table style="width:100%;border-collapse:collapse;font-size:14px;color:#d1d1d6;"><tr><td style="padding:6px 0;color:#8e8e93;width:100px;">성함:</td><td style="padding:6px 0;color:#fff;font-weight:bold;">${safeName}</td></tr><tr><td style="padding:6px 0;color:#8e8e93;">이메일:</td><td style="padding:6px 0;color:#e05638;"><a href="mailto:${safeEmail}" style="color:#e05638;text-decoration:underline;">${safeEmail}</a></td></tr><tr><td style="padding:6px 0;color:#8e8e93;">연락처:</td><td style="padding:6px 0;color:#fff;">${safePhone}</td></tr><tr><td style="padding:6px 0;color:#8e8e93;">문의 유형:</td><td style="padding:6px 0;color:#fff;font-weight:bold;">${escapeHtml(categoryTitle)}</td></tr></table></div><div style="background:#141416;padding:20px;border-radius:8px;border:1px solid #232328;margin-bottom:24px;"><h2 style="color:#fff;font-size:15px;margin-top:0;margin-bottom:12px;">문의 내용</h2><div style="font-size:14px;line-height:1.7;color:#f4f4f5;white-space:pre-wrap;">${safeMessage}</div></div><div style="font-size:12px;color:#68686d;border-top:1px solid #1a1a1e;padding-top:16px;text-align:center;">이 메일은 NOEUL 공식 웹사이트(www.noeul.me) 고객센터 폼에서 자동으로 전달되었습니다.<br/>답장(Reply) 시 고객 이메일(${safeEmail})로 회신하실 수 있습니다.</div></div>`;
    const mailOptions = { from: `"${safeName} (NOEUL 고객문의)" <${process.env.SMTP_USER || 'noeulenterprises@gmail.com'}>`, to: CS_TARGET_EMAIL, replyTo: email, subject, html: htmlContent };
    if (!email || !String(email).includes('@')) {
      return { success: false, error: 'MISSING_REPLY_TO' };
    }
    try { const transporter = createTransporter(); const info = await transporter.sendMail(mailOptions); console.log(`[EmailService] Customer inquiry sent. messageId=${info.messageId || 'sent'}`); return { success: true, messageId: info.messageId }; } catch (error) { console.error('[EmailService] Failed to send inquiry:', error.message); return { success: false, error: error.message }; }
  }
};
