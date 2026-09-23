import { initDatabase, query } from './database.js';

// Finding #3: this seed must NEVER create users, passwords, sessions, or
// orders. Approved catalog/content/settings/media only. Admin accounts are
// provisioned out of band (Google allowlist + staff_members), never from
// checked-in credentials.

export function seed() {
  console.log('🌱 Initializing NOEUL Korean K-Fashion Mall database...');
  initDatabase();

  // 2. Seed Categories (Upsert)
  const categoriesData = [
    { slug: 'outerwear', name_ko: '아우터', name_en: 'Outerwear', image_url: '/products/men/tshirts/classic-tshirt/1.jpg', sort_order: 1 },
    { slug: 'tops', name_ko: '상의', name_en: 'Tops', image_url: '/products/men/tshirts/classic-tshirt/1.jpg', sort_order: 2 },
    { slug: 'shirts', name_ko: '셔츠/블라우스', name_en: 'Shirts & Blouses', image_url: '/products/men/tshirts/classic-tshirt/1.jpg', sort_order: 3 },
    { slug: 'knitwear', name_ko: '니트웨어', name_en: 'Knitwear', image_url: '/products/men/tshirts/classic-tshirt/1.jpg', sort_order: 4 },
    { slug: 'pants', name_ko: '팬츠/데님', name_en: 'Pants & Denim', image_url: '/products/men/tshirts/classic-tshirt/1.jpg', sort_order: 5 },
    { slug: 'skirts', name_ko: '스커트', name_en: 'Skirts', image_url: '/products/men/tshirts/classic-tshirt/1.jpg', sort_order: 6 },
    { slug: 'dresses', name_ko: '원피스', name_en: 'Dresses', image_url: '/products/men/tshirts/classic-tshirt/1.jpg', sort_order: 7 },
    { slug: 'accessories', name_ko: '악세사리/가방', name_en: 'Accessories & Bags', image_url: '/products/men/tshirts/classic-tshirt/1.jpg', sort_order: 8 },
    { slug: 'socks', name_ko: '양말/삭스', name_en: 'Socks', image_url: '/products/men/tshirts/classic-tshirt/1.jpg', sort_order: 9 }
  ];

  for (const cat of categoriesData) {
    const existing = query.get('SELECT id FROM categories WHERE slug = ?', cat.slug);
    if (existing) {
      query.run(`
        UPDATE categories SET name_ko = ?, name_en = ?, image_url = ?, sort_order = ?, is_active = 1
        WHERE id = ?
      `, cat.name_ko, cat.name_en, cat.image_url, cat.sort_order, existing.id);
    } else {
      query.run(`
        INSERT INTO categories (slug, name_ko, name_en, image_url, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `, cat.slug, cat.name_ko, cat.name_en, cat.image_url, cat.sort_order);
    }
  }

  // 3. Clear and Seed Homepage Sections (Exact 66girls-style Korean Fashion Layout)
  query.run('DELETE FROM homepage_sections');
  const koreanMallSections = [
    {
      section_key: 'main_hero_editorial',
      type: 'hero',
      title_ko: '2026 S/S 스트리트 룩북',
      title_en: '2026 S/S Street Lookbook',
      subtitle_ko: '간절기 데일리룩의 정석',
      subtitle_en: 'Daily seasonal street essentials',
      content_json: JSON.stringify({
        image_url: '/products/men/tshirts/classic-tshirt/1.jpg',
        secondary_image_url: '/products/men/tshirts/classic-tshirt/1.jpg',
        button_link: '/shop?filter=new'
      }),
      sort_order: 1,
      is_active: 1,
      is_draft: 0
    },
    {
      section_key: 'curated_themes_3cards',
      type: 'curated_themes',
      title_ko: '시즌 테마 큐레이션',
      title_en: 'Curated Season Themes',
      subtitle_ko: '간절기 셔츠부터 데님까지',
      subtitle_en: 'From seasonal shirts to signature wide denim',
      content_json: JSON.stringify({
        themes: [
          {
            tag_sub: '간절기',
            title: '셔츠코디',
            subtitle_script: 'Season of Shirt',
            image: '/products/men/tshirts/classic-tshirt/1.jpg',
            label: '셔츠의 계절',
            hashtags: ['#셔츠', '#체크셔츠', '#코디추천'],
            link: '/shop?category=shirts'
          },
          {
            tag_sub: 'BRAND',
            title: 'SlgTho',
            subtitle_script: 'Slog & Thought',
            image: '/products/men/tshirts/classic-tshirt/1.jpg',
            label: 'SlgTho 슬토',
            hashtags: ['#Slog', '#Thought', '#브랜드'],
            link: '/shop?filter=featured'
          },
          {
            tag_sub: 'CUSTOM',
            title: '노을 데님',
            subtitle_script: 'now, here...',
            image: '/products/men/tshirts/classic-tshirt/1.jpg',
            label: 'now, here...',
            hashtags: ['#잘만든', '#데님', '#와이드핏'],
            link: '/shop?category=pants'
          }
        ]
      }),
      sort_order: 2,
      is_active: 1,
      is_draft: 0
    },
    {
      section_key: 'daily_updates_grid',
      type: 'daily_updates',
      title_ko: '매일 매일 업데이트',
      title_en: 'Daily Updates',
      subtitle_ko: '신상 5% 할인',
      subtitle_en: 'New In 5% OFF',
      content_json: JSON.stringify({
        filter_type: 'all',
        limit: 8,
        view_all_link: '/shop?filter=new'
      }),
      sort_order: 3,
      is_active: 1,
      is_draft: 0
    },
    {
      section_key: 'promo_welcome',
      type: 'promo_banner',
      title_ko: 'NOEUL 멤버십 웰컴 혜택',
      title_en: 'NOEUL Membership Welcome Benefit',
      subtitle_ko: '신규 가입 시 첫 주문 10% 할인 쿠폰 & 전 상품 무료배송 혜택',
      subtitle_en: 'Enjoy 10% off your first order & complimentary nationwide shipping upon signup',
      content_json: JSON.stringify({
        image_url: '/products/men/tshirts/classic-tshirt/1.jpg',
        button_text_ko: '회원가입하고 혜택 받기',
        button_link: '/auth?mode=register',
        coupon_code: 'WELCOME10'
      }),
      sort_order: 4,
      is_active: 1,
      is_draft: 0
    },
    {
      section_key: 'instagram_feed',
      type: 'instagram_feed',
      title_ko: '인스타그램 리뷰 & 데일리룩',
      title_en: 'Instagram Daily Looks',
      subtitle_ko: '#NOEUL #노을룩 고객님들의 실시간 스타일링',
      subtitle_en: '#NOEUL Customer OOTD styling feed',
      content_json: JSON.stringify({
        images: [
          '/products/men/tshirts/classic-tshirt/1.jpg',
          '/products/men/tshirts/classic-tshirt/1.jpg',
          '/products/men/tshirts/classic-tshirt/1.jpg',
          '/products/men/tshirts/classic-tshirt/1.jpg',
          '/products/men/tshirts/classic-tshirt/1.jpg',
          '/products/men/tshirts/classic-tshirt/1.jpg'
        ]
      }),
      sort_order: 5,
      is_active: 1,
      is_draft: 0
    }
  ];

  for (const sec of koreanMallSections) {
    query.run(`
      INSERT INTO homepage_sections (section_key, type, title_ko, title_en, subtitle_ko, subtitle_en, content_json, sort_order, is_active, is_draft)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, sec.section_key, sec.type, sec.title_ko, sec.title_en, sec.subtitle_ko, sec.subtitle_en, sec.content_json, sec.sort_order, sec.is_active, sec.is_draft);
  }

  // 4. Clear and Seed Menu Items
  query.run('DELETE FROM menu_items');
  const defaultMenus = [
    { title_ko: '신상 5%', title_en: 'NEW 5%', link_type: 'filter', link_value: '/shop?filter=new', badge_tag: 'NEW', sort_order: 1, is_active: 1 },
    { title_ko: '당일발송', title_en: 'Fast Ship', link_type: 'custom', link_value: '/shop?tag=today', badge_tag: '', sort_order: 2, is_active: 1 },
    { title_ko: 'BEST', title_en: 'BEST', link_type: 'filter', link_value: '/shop?filter=best', badge_tag: 'HOT', sort_order: 3, is_active: 1 },
    { title_ko: '노을제작', title_en: 'NOEUL MADE', link_type: 'custom', link_value: '/shop?tag=custom', badge_tag: '', sort_order: 4, is_active: 1 },
    { title_ko: '아우터', title_en: 'Outerwear', link_type: 'category', link_value: '/shop?category=outerwear', badge_tag: '', sort_order: 5, is_active: 1 },
    { title_ko: '상의', title_en: 'Tops', link_type: 'category', link_value: '/shop?category=tops', badge_tag: '', sort_order: 6, is_active: 1 },
    { title_ko: '셔츠/블라우스', title_en: 'Shirts', link_type: 'category', link_value: '/shop?category=shirts', badge_tag: '', sort_order: 7, is_active: 1 },
    { title_ko: '팬츠/데님', title_en: 'Pants', link_type: 'category', link_value: '/shop?category=pants', badge_tag: '', sort_order: 8, is_active: 1 },
    { title_ko: '2026 룩북', title_en: 'Lookbook', link_type: 'page', link_value: '/p/lookbook', badge_tag: '', sort_order: 9, is_active: 1 },
    { title_ko: 'SALE', title_en: 'SALE', link_type: 'filter', link_value: '/shop?filter=sale', badge_tag: 'SALE', sort_order: 10, is_active: 1 },
  ];

  for (const m of defaultMenus) {
    query.run(`
      INSERT INTO menu_items (title_ko, title_en, link_type, link_value, badge_tag, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, m.title_ko, m.title_en, m.link_type, m.link_value, m.badge_tag, m.sort_order, m.is_active);
  }

  // 5. Seed Site Settings (Bank Transfer, Business Info)
  const paymentInfo = {
    bank_name: '우리은행 (Woori Bank)',
    account_holder: '박기성',
    account_number: '1002340390276',
    currency: 'KRW',
    payment_instructions_ko: '주문 접수 후 위 계좌로 주문 금액을 정확히 입금하신 후, 결제 영수증(이체 확인증 또는 모바일 뱅킹 스크린샷)을 업로드해주세요. 관리자 입금 확인 후 즉시 배송이 준비됩니다.',
    payment_instructions_en: 'Please transfer the exact order amount to the bank account above, then upload your transfer screenshot / receipt. Once verified by our team, your order will be prepared for delivery.'
  };

  const businessInfo = {
    company_name: '주식회사 페리어스엔지',
    ceo: '박기성',
    business_number: '610-88-00182',
    ecommerce_number: '[수정 가능 / 확인 필요]',
    address: '경기도 파주시 송학2길 62-3, 1층(야당동)',
    cs_phone: '010-8361-5305',
    cs_email: 'noeulenterprises@gmail.com',
    bank_account: '우리은행 1002340390276 박기성'
  };

  query.run('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)', 'payment_info', JSON.stringify(paymentInfo));
  query.run('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)', 'business_info', JSON.stringify(businessInfo));
  // 6. Ensure products have 5 curated editorial images
  const productFiveImages = [
    {
      id: 1,
      images: [
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg'
      ]
    },
    {
      id: 2,
      images: [
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg'
      ]
    },
    {
      id: 3,
      images: [
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg'
      ]
    },
    {
      id: 4,
      images: [
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg'
      ]
    },
    {
      id: 5,
      images: [
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg'
      ]
    },
    {
      id: 6,
      images: [
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg'
      ]
    },
    {
      id: 7,
      images: [
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg'
      ]
    },
    {
      id: 8,
      images: [
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg',
        '/products/men/tshirts/classic-tshirt/1.jpg'
      ]
    }
  ];
  for (const item of productFiveImages) {
    try {
      query.run('UPDATE products SET images = ? WHERE id = ?', JSON.stringify(item.images), item.id);
    } catch { /* eslint-disable-line no-empty */ }
  }

  console.log('✅ NOEUL Korean K-Fashion Mall database seeded successfully!');
}

if (process.argv[1].endsWith('seed.js')) {
  seed();
}
