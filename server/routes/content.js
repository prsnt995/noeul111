import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

// 1. Get Active Homepage Sections (CMS Layout)
router.get('/content/sections', (req, res) => {
  try {
    const rows = query.all(`
      SELECT * FROM homepage_sections
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `).map(s => ({
      ...s,
      content: typeof s.content_json === 'string' ? JSON.parse(s.content_json || '{}') : s.content_json
    }));

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch public sections error:', error);
    res.status(500).json({ success: false, message: '홈페이지 섹션 조회 실패' });
  }
});

// 2. Get Navigation Menu
router.get('/content/menu', (req, res) => {
  try {
    const items = query.all(`
      SELECT * FROM menu_items
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `);

    // Organize hierarchy (top level + children)
    const topLevel = items.filter(i => !i.parent_id);
    const result = topLevel.map(item => ({
      ...item,
      children: items.filter(child => child.parent_id === item.id)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Fetch public menu error:', error);
    res.status(500).json({ success: false, message: '메뉴 조회 실패' });
  }
});

// 3. Get Custom Page by Slug
router.get('/pages/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const page = query.get(`
      SELECT * FROM pages
      WHERE slug = ? AND is_published = 1
    `, slug.toLowerCase());

    if (!page) {
      return res.status(404).json({ success: false, message: '페이지를 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Fetch page error:', error);
    res.status(500).json({ success: false, message: '페이지 로드 실패' });
  }
});

// 4. Get Active Banners
router.get('/content/banners', (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM banners WHERE is_active = 1';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY sort_order ASC, id DESC';
    const banners = query.all(sql, ...params);
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: '배너 정보를 불러오지 못했습니다.' });
  }
});

// 5. Get Public Site Settings
router.get('/content/settings', (req, res) => {
  try {
    const rows = query.all('SELECT key, value FROM site_settings');
    const settings = {};
    rows.forEach(r => {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    });

    res.json({
      success: true,
      data: {
        site_name: settings.site_name || 'NOEUL 노을',
        currency: 'KRW',
        shipping_policy: settings.shipping_policy || { threshold: 70000, fee: 3000 },
        payment_info: settings.payment_info || {
          bank_name: '우리은행 (Woori Bank)',
          account_holder: '박기삼',
          account_number: '1002340390276',
          currency: 'KRW',
          payment_instructions_ko: '주문 접수 후 위 계좌로 주문 금액을 정확히 입금하신 후, 결제 영수증(이체 확인증 또는 모바일 뱅킹 스크린샷)을 업로드해주세요. 관리자 입금 확인 후 즉시 배송이 준비됩니다.',
          payment_instructions_en: 'Please transfer the exact order amount to the bank account above, then upload your transfer screenshot / receipt. Once verified by our team, your order will be prepared for delivery.'
        },
        business_info: settings.business_info || {
          company_name: '노을 (NOEUL )',
          ceo: '노을',
          cs_email: 'noeulenterprise@gmail.com',
          bank_account: '우리은행 1002340390276 박기삼'
        },
        about_story: settings.about_story || {
          title_ko: '서울의 황혼에서 영감을 얻은 컨템포러리 룩',
          title_en: 'Contemporary Elegance Inspired by Seoul Twilight',
          content_ko: '노을(NOEUL)은 서울의 노을빛이 가진 따뜻하면서도 절제된 색채와 현대적인 미니멀리즘을 결합한 하이엔드 디자이너 브랜드입니다.'
        },
        header_config: settings.header_config || {
          announcement_enabled: true,
          announcement_ko: '2026 S/S 신규 가입 시 10% 웰컴 쿠폰 & ₩70,000 이상 무료배송',
          announcement_en: 'Spring 2026: Enjoy 10% off your first order & complimentary shipping over ₩70,000',
          announcement_bg: '#121213',
          announcement_color: '#ffffff',
          show_search: true,
          show_wishlist: true,
          show_cart: true,
          show_account: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '설정 정보를 불러오지 못했습니다.' });
  }
});

export default router;
