import bcrypt from 'bcryptjs';
import { db, initDatabase, query } from './database.js';

export function seed() {
  console.log('🌱 Initializing and seeding NOEUL Korean K-Fashion Mall database...');
  initDatabase();

  // 1. Create Default Users (Admin & Customer)
  const salt = bcrypt.genSaltSync(10);
  const adminPassword = bcrypt.hashSync('admin1234!', salt);
  const customerPassword = bcrypt.hashSync('customer1234!', salt);

  const existingAdmin = query.get("SELECT id FROM users WHERE email = 'admin@noeul.kr'");
  if (!existingAdmin) {
    query.run(`
      INSERT INTO users (email, password_hash, name, phone, postal_code, address, detail_address, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'super_admin')
    `, 'admin@noeul.kr', adminPassword, '노을 최고관리자', '010-1234-5678', '06001', '서울특별시 강남구 압구정로 165', '노을 스튜디오 4층');
  }

  const existingCustomer = query.get("SELECT id FROM users WHERE email = 'customer@noeul.kr'");
  if (!existingCustomer) {
    query.run(`
      INSERT INTO users (email, password_hash, name, phone, postal_code, address, detail_address, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'customer')
    `, 'customer@noeul.kr', customerPassword, '이지은 (Ji-eun Lee)', '010-9876-5432', '06001', '서울특별시 강남구 압구정로 165', '현대아파트 102동 1405호');
  }

  // 2. Seed Categories (Upsert)
  const categoriesData = [
    { slug: 'outerwear', name_ko: '아우터', name_en: 'Outerwear', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=900&auto=format&fit=crop', sort_order: 1 },
    { slug: 'tops', name_ko: '상의', name_en: 'Tops', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=900&auto=format&fit=crop', sort_order: 2 },
    { slug: 'shirts', name_ko: '셔츠/블라우스', name_en: 'Shirts & Blouses', image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=900&auto=format&fit=crop', sort_order: 3 },
    { slug: 'knitwear', name_ko: '니트웨어', name_en: 'Knitwear', image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=900&auto=format&fit=crop', sort_order: 4 },
    { slug: 'pants', name_ko: '팬츠/데님', name_en: 'Pants & Denim', image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=900&auto=format&fit=crop', sort_order: 5 },
    { slug: 'skirts', name_ko: '스커트', name_en: 'Skirts', image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=900&auto=format&fit=crop', sort_order: 6 },
    { slug: 'dresses', name_ko: '원피스', name_en: 'Dresses', image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=900&auto=format&fit=crop', sort_order: 7 },
    { slug: 'accessories', name_ko: '악세사리/가방', name_en: 'Accessories & Bags', image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=900&auto=format&fit=crop', sort_order: 8 },
    { slug: 'socks', name_ko: '양말/삭스', name_en: 'Socks', image_url: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?q=80&w=900&auto=format&fit=crop', sort_order: 9 }
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
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
        secondary_image_url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
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
            image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
            label: '셔츠의 계절',
            hashtags: ['#셔츠', '#체크셔츠', '#코디추천'],
            link: '/shop?category=shirts'
          },
          {
            tag_sub: 'BRAND',
            title: 'SlgTho',
            subtitle_script: 'Slog & Thought',
            image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
            label: 'SlgTho 슬토',
            hashtags: ['#Slog', '#Thought', '#브랜드'],
            link: '/shop?filter=featured'
          },
          {
            tag_sub: 'CUSTOM',
            title: '노을 데님',
            subtitle_script: 'now, here...',
            image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop',
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
        image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
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
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=500&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=500&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=500&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?q=80&w=500&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=500&auto=format&fit=crop'
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
    account_holder: '박기삼',
    account_number: '1002340390276',
    currency: 'KRW',
    payment_instructions_ko: '주문 접수 후 위 계좌로 주문 금액을 정확히 입금하신 후, 결제 영수증(이체 확인증 또는 모바일 뱅킹 스크린샷)을 업로드해주세요. 관리자 입금 확인 후 즉시 배송이 준비됩니다.',
    payment_instructions_en: 'Please transfer the exact order amount to the bank account above, then upload your transfer screenshot / receipt. Once verified by our team, your order will be prepared for delivery.'
  };

  const businessInfo = {
    company_name: '(주)노을패션코리아 (NOEUL Fashion Korea)',
    ceo: '박기삼',
    business_number: '120-88-94821',
    ecommerce_number: '제 2026-서울강남-04821호',
    address: '서울특별시 강남구 압구정로 165 노을 빌딩 4층',
    cs_phone: '010-1234-5678',
    cs_email: 'noeulenterprise@gmail.com',
    bank_account: '우리은행 1002340390276 박기삼'
  };

  query.run('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)', 'payment_info', JSON.stringify(paymentInfo));
  // 6. Ensure products have 5 curated editorial images
  const productFiveImages = [
    {
      id: 1,
      images: [
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    {
      id: 2,
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    {
      id: 3,
      images: [
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    {
      id: 4,
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    {
      id: 5,
      images: [
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    {
      id: 6,
      images: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    {
      id: 7,
      images: [
        'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    {
      id: 8,
      images: [
        'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1000&auto=format&fit=crop'
      ]
    }
  ];
  for (const item of productFiveImages) {
    try {
      query.run('UPDATE products SET images = ? WHERE id = ?', JSON.stringify(item.images), item.id);
    } catch {}
  }

  console.log('✅ NOEUL Korean K-Fashion Mall database seeded successfully!');
}

if (process.argv[1].endsWith('seed.js')) {
  seed();
}
