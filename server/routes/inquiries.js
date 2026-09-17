import express from 'express';
import { query } from '../db/database.js';
import { emailService } from '../services/emailService.js';

const router = express.Router();

// 1. Customer Submit 1:1 Inquiry (Public Endpoint)
router.post('/inquiries', async (req, res) => {
  try {
    const { name, email, phone, category, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: '성함, 이메일, 문의 내용을 모두 입력해주세요.'
      });
    }

    // Insert into DB
    const result = query.run(`
      INSERT INTO customer_inquiries (name, email, phone, category, message, status)
      VALUES (?, ?, ?, ?, ?, 'new')
    `, name.trim(), email.trim(), (phone || '').trim(), category || 'general', message.trim());

    const inquiryId = result.lastInsertRowid;

    // Trigger notification email to noeulenterprises@gmail.com
    emailService.sendCustomerInquiry({
      name,
      email,
      phone,
      category,
      message,
      inquiryId
    }).catch((err) => {
      console.error('[Inquiries Route] Email dispatch error:', err);
    });

    res.json({
      success: true,
      message: '고객 문의가 성공적으로 접수되었습니다. noeulenterprises@gmail.com으로 전달되었습니다.',
      inquiry_id: inquiryId
    });
  } catch (error) {
    console.error('Submit inquiry error:', error);
    res.status(500).json({ success: false, message: '문의 접수 중 오류가 발생했습니다.' });
  }
});

// 2. Admin Get All Inquiries
router.get('/admin/inquiries', (req, res) => {
  try {
    const rows = query.all('SELECT * FROM customer_inquiries ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: '문의 목록 조회 실패' });
  }
});

// 3. Admin Update Inquiry Status
router.patch('/admin/inquiries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    query.run('UPDATE customer_inquiries SET status = ? WHERE id = ?', status, id);
    res.json({ success: true, message: '상태가 업데이트되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '상태 업데이트 실패' });
  }
});

export default router;
