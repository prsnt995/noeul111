/**
 * NOEUL (노을) - Master Product Dataset & Architecture
 * 
 * Reusable, scalable data structure supporting hundreds of products.
 * Format:
 * {
 *   id: number,
 *   sku: string,
 *   name: string,
 *   name_ko: string,
 *   name_en: string,
 *   gender: 'men' | 'women' | 'unisex',
 *   category: 'tshirts' | 'shirts' | 'jeans' | 'pants' | 'underwear' | 'socks' | 'jackets' | 'hoodies' | 'dresses' | 'skirts' | 'accessories' | 'bags',
 *   price: number, // in KRW
 *   discount_price: number | null,
 *   discount_rate: number,
 *   color: string,
 *   color_hex: string,
 *   colors: Array<{ name: string, name_ko: string, name_en: string, hex: string }>,
 *   material: string,
 *   sizes: string[],
 *   images: string[], // exactly 5 continuous images
 *   description: string,
 *   description_ko: string,
 *   is_new: boolean,
 *   is_best: boolean,
 *   stock: number
 * }
 */

export const CATEGORIES_BY_GENDER = {
  men: [
    { key: 'tshirts', label: 'T-Shirts', label_ko: '티셔츠' },
    { key: 'shirts', label: 'Shirts', label_ko: '셔츠' },
    { key: 'jeans', label: 'Jeans', label_ko: '청바지/데님' },
    { key: 'pants', label: 'Pants', label_ko: '팬츠/슬랙스' },
    { key: 'underwear', label: 'Underwear', label_ko: '언더웨어' },
    { key: 'socks', label: 'Socks', label_ko: '양말' },
    { key: 'jackets', label: 'Jackets', label_ko: '자켓/아우터' },
    { key: 'hoodies', label: 'Hoodies', label_ko: '후디/스웨트' },
    { key: 'accessories', label: 'Accessories', label_ko: '액세서리' },
    { key: 'bags', label: 'Bags', label_ko: '가방' },
  ],
  women: [
    { key: 'tshirts', label: 'T-Shirts', label_ko: '티셔츠' },
    { key: 'shirts', label: 'Shirts', label_ko: '셔츠/블라우스' },
    { key: 'jeans', label: 'Jeans', label_ko: '청바지/데님' },
    { key: 'pants', label: 'Pants', label_ko: '팬츠/슬랙스' },
    { key: 'underwear', label: 'Underwear', label_ko: '언더웨어' },
    { key: 'socks', label: 'Socks', label_ko: '양말' },
    { key: 'dresses', label: 'Dresses', label_ko: '원피스' },
    { key: 'skirts', label: 'Skirts', label_ko: '스커트' },
    { key: 'jackets', label: 'Jackets', label_ko: '자켓/아우터' },
    { key: 'hoodies', label: 'Hoodies', label_ko: '후디/스웨트' },
    { key: 'accessories', label: 'Accessories', label_ko: '액세서리' },
    { key: 'bags', label: 'Bags', label_ko: '가방' },
  ],
};

export const PRODUCTS = [
  // 1. MEN - T-SHIRTS
  {
    id: 1,
    sku: 'NE-M-TS-001',
    name: 'NOEUL Classic T-Shirt',
    name_en: 'NOEUL Classic T-Shirt',
    name_ko: '노을 클래식 컴팩트 반팔 티셔츠',
    gender: 'men',
    category: 'tshirts',
    price: 39000,
    discount_price: null,
    discount_rate: 0,
    color: 'Black',
    color_hex: '#111112',
    colors: [
      { name: 'Black', name_en: 'Black', name_ko: '블랙', hex: '#111112' },
      { name: 'White', name_en: 'White', name_ko: '화이트', hex: '#FFFFFF' },
      { name: 'Charcoal', name_en: 'Charcoal', name_ko: '차콜', hex: '#373739' },
    ],
    material: '100% Cotton',
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
    ],
    description: 'Everyday heavyweight 100% combed cotton jersey t-shirt. Tailored with a relaxed modern drape and reinforced crewneck.',
    description_ko: '고밀도 16수 코튼 원단으로 제작된 노을의 시그니처 데일리 반팔 티셔츠입니다. 목 늘어남 방지 테이핑과 자연스러운 실루엣을 제공합니다.',
    is_new: true,
    is_best: true,
    stock: 120,
  },

  // 2. WOMEN - T-SHIRTS
  {
    id: 2,
    sku: 'NE-W-TS-002',
    name: "NOEUL Women's Oversized T-Shirt",
    name_en: "NOEUL Women's Oversized T-Shirt",
    name_ko: '노을 우먼스 오버사이즈 코튼 티셔츠',
    gender: 'women',
    category: 'tshirts',
    price: 42000,
    discount_price: 39000,
    discount_rate: 7,
    color: 'White',
    color_hex: '#FFFFFF',
    colors: [
      { name: 'White', name_en: 'White', name_ko: '화이트', hex: '#FFFFFF' },
      { name: 'Oatmeal', name_en: 'Oatmeal', name_ko: '오트밀', hex: '#ECE7DE' },
      { name: 'Sky Blue', name_en: 'Sky Blue', name_ko: '스카이블루', hex: '#B2CDD7' },
    ],
    material: '100% Cotton',
    sizes: ['S', 'M', 'L'],
    images: [
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
    ],
    description: 'Slouchy drop-shoulder tee made from bio-washed soft combed cotton. Fluid, airy movement perfect for tucking into denim.',
    description_ko: '바이오 워싱 가공으로 부드러운 터치감을 살린 우먼스 오버핏 티셔츠입니다. 여유로운 드롭 숄더 라인으로 세련된 핏을 선사합니다.',
    is_new: true,
    is_best: true,
    stock: 85,
  },

  // 3. MEN - SHIRTS
  {
    id: 3,
    sku: 'NE-M-SH-003',
    name: 'NOEUL Relaxed Poplin Shirt',
    name_en: 'NOEUL Relaxed Poplin Shirt',
    name_ko: '노을 릴렉스 팝린 드레스 셔츠',
    gender: 'men',
    category: 'shirts',
    price: 68000,
    discount_price: null,
    discount_rate: 0,
    color: 'Sky Blue',
    color_hex: '#B2CDD7',
    colors: [
      { name: 'Sky Blue', name_en: 'Sky Blue', name_ko: '스카이블루', hex: '#B2CDD7' },
      { name: 'Crisp White', name_en: 'Crisp White', name_ko: '크리스프 화이트', hex: '#FFFFFF' },
      { name: 'Smoke Grey', name_en: 'Smoke Grey', name_ko: '스모크 그레이', hex: '#8F9194' },
    ],
    material: '60s Poplin Cotton',
    sizes: ['M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Crisp 60-count compact poplin cotton shirt with a boxy silhouette and pearl luster button fasteners.',
    description_ko: '은은한 광택과 매끄러운 터치감의 60수 고밀도 코튼 팝린 셔츠입니다. 단정한 카라 라인과 편안한 핏을 완성합니다.',
    is_new: false,
    is_best: true,
    stock: 50,
  },

  // 4. WOMEN - SHIRTS
  {
    id: 4,
    sku: 'NE-W-SH-004',
    name: 'NOEUL Minimal Silk-Touch Shirt',
    name_en: 'NOEUL Minimal Silk-Touch Shirt',
    name_ko: '노을 미니멀 실크터치 루즈 셔츠',
    gender: 'women',
    category: 'shirts',
    price: 72000,
    discount_price: 64800,
    discount_rate: 10,
    color: 'Ivory',
    color_hex: '#FDFBF7',
    colors: [
      { name: 'Ivory', name_en: 'Ivory', name_ko: '아이보리', hex: '#FDFBF7' },
      { name: 'Muted Pink', name_en: 'Muted Pink', name_ko: '뮤트 핑크', hex: '#E2C2C6' },
      { name: 'Soft Sage', name_en: 'Soft Sage', name_ko: '소프트 세이지', hex: '#A8BBA2' },
    ],
    material: 'Modal Silk Blend',
    sizes: ['S', 'M', 'L'],
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Silky fluid drape with hidden placket styling. Elegantly balances tailored structure with effortless feminine flow.',
    description_ko: '자연스러운 드레이프성이 돋보이는 모달 실크 혼방 셔츠입니다. 히든 버튼 플래킷으로 더욱 단정하고 모던한 무드를 냅니다.',
    is_new: true,
    is_best: false,
    stock: 45,
  },

  // 5. MEN - JEANS
  {
    id: 5,
    sku: 'NE-M-JN-005',
    name: 'NOEUL Raw Selvedge Denim',
    name_en: 'NOEUL Raw Selvedge Denim',
    name_ko: '노을 로우 셀비지 와이드 데님',
    gender: 'men',
    category: 'jeans',
    price: 89000,
    discount_price: null,
    discount_rate: 0,
    color: 'Washed Indigo',
    color_hex: '#3B4F69',
    colors: [
      { name: 'Washed Indigo', name_en: 'Washed Indigo', name_ko: '워시드 인디고', hex: '#3B4F69' },
      { name: 'Raw Black', name_en: 'Raw Black', name_ko: '로우 블랙', hex: '#18191A' },
    ],
    material: '13.5oz Cotton Denim',
    sizes: ['30', '32', '34', '36'],
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Authentic 13.5oz red-line selvedge denim crafted with a wide straight leg and vintage matte hardware.',
    description_ko: '13.5온스 헤비웨이트 프리미엄 셀비지 데님입니다. 자연스럽게 흐르는 와이드 스트레이트 실루엣이 감각적입니다.',
    is_new: false,
    is_best: true,
    stock: 60,
  },

  // 6. WOMEN - JEANS
  {
    id: 6,
    sku: 'NE-W-JN-006',
    name: 'NOEUL High-Rise Straight Jeans',
    name_en: 'NOEUL High-Rise Straight Jeans',
    name_ko: '노을 하이라이즈 스트레이트 크롭 데님',
    gender: 'women',
    category: 'jeans',
    price: 84000,
    discount_price: 75600,
    discount_rate: 10,
    color: 'Vintage Blue',
    color_hex: '#5E799B',
    colors: [
      { name: 'Vintage Blue', name_en: 'Vintage Blue', name_ko: '빈티지 블루', hex: '#5E799B' },
      { name: 'Deep Indigo', name_en: 'Deep Indigo', name_ko: '딥 인디고', hex: '#26374D' },
      { name: 'Pure White', name_en: 'Pure White', name_ko: '화이트', hex: '#FFFFFF' },
    ],
    material: '100% Cotton Denim',
    sizes: ['25', '26', '27', '28', '29'],
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'High-waisted silhouette designed to elongate legs with clean non-stretch premium Korean denim.',
    description_ko: '허리 라인을 안정감 있게 잡아주며 다리가 길어 보이는 하이웨이스트 스트레이트 핏 데님입니다.',
    is_new: true,
    is_best: true,
    stock: 72,
  },

  // 7. MEN - PANTS
  {
    id: 7,
    sku: 'NE-M-PT-007',
    name: 'NOEUL Two-Tuck Wide Trousers',
    name_en: 'NOEUL Two-Tuck Wide Trousers',
    name_ko: '노을 투턱 와이드 테일러드 트라우저',
    gender: 'men',
    category: 'pants',
    price: 98000,
    discount_price: null,
    discount_rate: 0,
    color: 'Deep Black',
    color_hex: '#111112',
    colors: [
      { name: 'Deep Black', name_en: 'Deep Black', name_ko: '딥 블랙', hex: '#111112' },
      { name: 'Heather Grey', name_en: 'Heather Grey', name_ko: '헤더 그레이', hex: '#666668' },
      { name: 'Cocoa Brown', name_en: 'Cocoa Brown', name_ko: '코코아 브라운', hex: '#4A3B32' },
    ],
    material: 'TR Tailored Blend',
    sizes: ['S (28-29)', 'M (30-31)', 'L (32-33)', 'XL (34-35)'],
    images: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Sophisticated two-pleat front trouser cut for a structured wide-leg puddle hem drape.',
    description_ko: '전면 투턱 주름 디테일과 유려한 와이드 실루엣의 사계절 프리미엄 수트 트라우저 슬랙스입니다.',
    is_new: false,
    is_best: true,
    stock: 55,
  },

  // 8. WOMEN - PANTS
  {
    id: 8,
    sku: 'NE-W-PT-008',
    name: 'NOEUL Pleated Fluid Trousers',
    name_en: 'NOEUL Pleated Fluid Trousers',
    name_ko: '노을 원턱 플루이드 와이드 슬랙스',
    gender: 'women',
    category: 'pants',
    price: 92000,
    discount_price: 82800,
    discount_rate: 10,
    color: 'Charcoal',
    color_hex: '#2B2B2D',
    colors: [
      { name: 'Charcoal', name_en: 'Charcoal', name_ko: '차콜', hex: '#2B2B2D' },
      { name: 'Warm Cream', name_en: 'Warm Cream', name_ko: '웜 크림', hex: '#F5F2EA' },
      { name: 'Mocha', name_en: 'Mocha', name_ko: '모카', hex: '#5D4A3D' },
    ],
    material: 'Poly Rayon Span',
    sizes: ['S (25-26)', 'M (27-28)', 'L (29-30)'],
    images: [
      'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'High-waisted fluid trousers with a clean front tuck for an elongated tailored silhouette.',
    description_ko: '부드러운 원단감으로 걸을 때마다 유려한 실루엣을 선사하는 하이웨이스트 와이드 팬츠입니다.',
    is_new: true,
    is_best: false,
    stock: 48,
  },

  // 9. WOMEN - DRESSES
  {
    id: 9,
    sku: 'NE-W-DR-009',
    name: 'NOEUL Minimal Linen Blend Maxi Dress',
    name_en: 'NOEUL Minimal Linen Blend Maxi Dress',
    name_ko: '노을 미니멀 린넨 블렌드 맥시 원피스',
    gender: 'women',
    category: 'dresses',
    price: 112000,
    discount_price: null,
    discount_rate: 0,
    color: 'Cream',
    color_hex: '#FDFBF5',
    colors: [
      { name: 'Cream', name_en: 'Cream', name_ko: '크림', hex: '#FDFBF5' },
      { name: 'Black', name_en: 'Black', name_ko: '블랙', hex: '#111112' },
      { name: 'Olive Green', name_en: 'Olive Green', name_ko: '올리브', hex: '#5A624E' },
    ],
    material: 'Linen Viscose Blend',
    sizes: ['FREE (44-66)'],
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Clean architectural line with a subtle back slit and breathable premium linen weave.',
    description_ko: '단정하고 우아한 H라인 실루엣의 린넨 맥시 원피스입니다. 뒷면 슬릿 디테일로 활동성을 더했습니다.',
    is_new: true,
    is_best: true,
    stock: 35,
  },

  // 10. WOMEN - SKIRTS
  {
    id: 10,
    sku: 'NE-W-SK-010',
    name: 'NOEUL Pleated A-Line Midi Skirt',
    name_en: 'NOEUL Pleated A-Line Midi Skirt',
    name_ko: '노을 플리츠 A라인 미디 스커트',
    gender: 'women',
    category: 'skirts',
    price: 76000,
    discount_price: 68400,
    discount_rate: 10,
    color: 'Beige',
    color_hex: '#D7C7B2',
    colors: [
      { name: 'Beige', name_en: 'Beige', name_ko: '베이지', hex: '#D7C7B2' },
      { name: 'Charcoal Grey', name_en: 'Charcoal Grey', name_ko: '차콜', hex: '#333336' },
      { name: 'Deep Navy', name_en: 'Deep Navy', name_ko: '네이비', hex: '#1C2430' },
    ],
    material: 'Wool Cotton Blend',
    sizes: ['S (25-26)', 'M (27-28)'],
    images: [
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Permanent knife-pleated skirt tailored with a comfortable interior waist band.',
    description_ko: '깔끔하게 떨어지는 정교한 주름 디테일과 감각적인 기장감의 데일리 미디 플리츠 스커트입니다.',
    is_new: false,
    is_best: true,
    stock: 40,
  },

  // 11. MEN - JACKETS
  {
    id: 11,
    sku: 'NE-M-JK-011',
    name: 'NOEUL Signature Oversized Wool Blazer',
    name_en: 'NOEUL Signature Oversized Wool Blazer',
    name_ko: '노을 시그니처 오버사이즈 울 블레이저',
    gender: 'men',
    category: 'jackets',
    price: 198000,
    discount_price: null,
    discount_rate: 0,
    color: 'Midnight Black',
    color_hex: '#111112',
    colors: [
      { name: 'Midnight Black', name_en: 'Midnight Black', name_ko: '미드나잇 블랙', hex: '#111112' },
      { name: 'Heather Charcoal', name_en: 'Heather Charcoal', name_ko: '헤더 차콜', hex: '#373739' },
      { name: 'Warm Sand', name_en: 'Warm Sand', name_ko: '웜 샌드', hex: '#C5B8A5' },
    ],
    material: 'Wool 80%, Poly 20%',
    sizes: ['M (95-100)', 'L (100-105)', 'XL (105-110)'],
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Tailored single-breasted wool blend blazer with padded drop shoulders and cupro lining.',
    description_ko: '탄탄한 울 블렌드 소재와 자연스러운 오버사이즈 실루엣이 돋보이는 노을의 대표 시그니처 블레이저입니다.',
    is_new: true,
    is_best: true,
    stock: 30,
  },

  // 12. WOMEN - JACKETS
  {
    id: 12,
    sku: 'NE-W-JK-012',
    name: 'NOEUL Collarless Boucle Tweed Jacket',
    name_en: 'NOEUL Collarless Boucle Tweed Jacket',
    name_ko: '노을 노카라 부클 트위드 크롭 자켓',
    gender: 'women',
    category: 'jackets',
    price: 185000,
    discount_price: 166500,
    discount_rate: 10,
    color: 'Oatmeal',
    color_hex: '#E7DFD4',
    colors: [
      { name: 'Oatmeal', name_en: 'Oatmeal', name_ko: '오트밀', hex: '#E7DFD4' },
      { name: 'Noir Black', name_en: 'Noir Black', name_ko: '느와르 블랙', hex: '#111112' },
    ],
    material: 'Wool Blend Boucle',
    sizes: ['S (44-55)', 'M (55-66)'],
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Textured boucle tweed with antique silver crest buttons and a subtle cropped hemline.',
    description_ko: '고급스러운 부클 텍스처와 은은한 메탈 단추로 포인트를 준 라운드넥 트위드 크롭 자켓입니다.',
    is_new: true,
    is_best: false,
    stock: 28,
  },

  // 13. MEN - HOODIES
  {
    id: 13,
    sku: 'NE-M-HD-013',
    name: 'NOEUL Heavy Terry Boxy Hoodie',
    name_en: 'NOEUL Heavy Terry Boxy Hoodie',
    name_ko: '노을 헤비 테리 박시 오버핏 후디',
    gender: 'men',
    category: 'hoodies',
    price: 79000,
    discount_price: null,
    discount_rate: 0,
    color: 'Heather Grey',
    color_hex: '#8E9094',
    colors: [
      { name: 'Heather Grey', name_en: 'Heather Grey', name_ko: '헤더 그레이', hex: '#8E9094' },
      { name: 'Washed Black', name_en: 'Washed Black', name_ko: '워시드 블랙', hex: '#232324' },
      { name: 'Forest Green', name_en: 'Forest Green', name_ko: '포레스트 그린', hex: '#2F4032' },
    ],
    material: '450gsm French Terry',
    sizes: ['M (95-100)', 'L (100-105)', 'XL (105-110)'],
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Heavyweight 450gsm pure cotton fleece hoodie with a double-layered hood and ribbed side panels.',
    description_ko: '450g 고밀도 쮸리 원단으로 각이 무너지지 않는 헤비웨이트 후드 티셔츠입니다.',
    is_new: false,
    is_best: true,
    stock: 65,
  },

  // 14. WOMEN - HOODIES
  {
    id: 14,
    sku: 'NE-W-HD-014',
    name: 'NOEUL Relaxed Zip-Up Hoodie',
    name_en: 'NOEUL Relaxed Zip-Up Hoodie',
    name_ko: '노을 릴렉스 투웨이 집업 후디',
    gender: 'women',
    category: 'hoodies',
    price: 79000,
    discount_price: 71100,
    discount_rate: 10,
    color: 'Dusty Taupe',
    color_hex: '#8C827A',
    colors: [
      { name: 'Dusty Taupe', name_en: 'Dusty Taupe', name_ko: '더스티 토프', hex: '#8C827A' },
      { name: 'Melange Grey', name_en: 'Melange Grey', name_ko: '멜란지 그레이', hex: '#9E9EA0' },
      { name: 'Matte Black', name_en: 'Matte Black', name_ko: '매트 블랙', hex: '#111112' },
    ],
    material: 'Combed Cotton Fleece',
    sizes: ['FREE (44-66)'],
    images: [
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Two-way zipper everyday hoodie with an effortless slouchy silhouette and soft brushed interior.',
    description_ko: '2웨이 지퍼 디테일로 다양한 스타일링이 가능한 데일리 릴렉스드 기모 집업 후드입니다.',
    is_new: true,
    is_best: false,
    stock: 50,
  },

  // 15. UNISEX - BAGS
  {
    id: 15,
    sku: 'NE-U-BG-015',
    name: 'NOEUL Minimal Calfskin Crossbody Bag',
    name_en: 'NOEUL Minimal Calfskin Crossbody Bag',
    name_ko: '노을 미니멀 스무스 레더 크로스바디 백',
    gender: 'unisex',
    category: 'bags',
    price: 145000,
    discount_price: null,
    discount_rate: 0,
    color: 'Matte Black',
    color_hex: '#151516',
    colors: [
      { name: 'Matte Black', name_en: 'Matte Black', name_ko: '매트 블랙', hex: '#151516' },
      { name: 'Espresso Brown', name_en: 'Espresso Brown', name_ko: '에스프레소 브라운', hex: '#3E2723' },
      { name: 'Taupe', name_en: 'Taupe', name_ko: '토프', hex: '#8B7D6B' },
    ],
    material: 'Genuine Italian Calfskin',
    sizes: ['ONE SIZE (W 22cm x H 15cm x D 6cm)'],
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Architectural compact crossbody handcrafted from supple matte calf leather with an adjustable strap.',
    description_ko: '은은한 광택과 매끄러운 촉감의 천연 이태리 소가죽으로 제작된 미니멀 데일리 크로스백입니다.',
    is_new: false,
    is_best: true,
    stock: 25,
  },

  // 16. UNISEX - SOCKS
  {
    id: 16,
    sku: 'NE-U-SK-016',
    name: 'NOEUL 3-Pack Everyday Ribbed Socks',
    name_en: 'NOEUL 3-Pack Everyday Ribbed Socks',
    name_ko: '노을 에브리데이 코튼 골지 삭스 (3팩)',
    gender: 'unisex',
    category: 'socks',
    price: 18000,
    discount_price: null,
    discount_rate: 0,
    color: 'White/Grey/Black',
    color_hex: '#E5E5EA',
    colors: [
      { name: 'Multi Pack', name_en: 'Multi Pack', name_ko: '멀티 팩', hex: '#E5E5EA' },
      { name: 'Solid Black Pack', name_en: 'Solid Black Pack', name_ko: '올블랙 팩', hex: '#111112' },
    ],
    material: 'Combed Cotton 85%, Spandex 15%',
    sizes: ['FREE (230-280mm)'],
    images: [
      'https://images.unsplash.com/photo-1582966772680-860e372bb558?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Premium combed cotton ribbed crew socks with reinforced heel and toe cushioning for day-long comfort.',
    description_ko: '흘러내림 없는 짱짱한 골지 조직과 우수한 쿠션감의 프리미엄 데일리 코튼 삭스 3종 세트입니다.',
    is_new: false,
    is_best: true,
    stock: 200,
  },

  // 17. MEN - UNDERWEAR
  {
    id: 17,
    sku: 'NE-M-UW-017',
    name: 'NOEUL 3-Pack Seamless Modal Boxer Briefs',
    name_en: 'NOEUL 3-Pack Seamless Modal Boxer Briefs',
    name_ko: '노을 심리스 마이크로 모달 드로즈 (3팩)',
    gender: 'men',
    category: 'underwear',
    price: 36000,
    discount_price: null,
    discount_rate: 0,
    color: 'Navy/Charcoal/Black',
    color_hex: '#1D2531',
    colors: [
      { name: 'Trio Classic', name_en: 'Trio Classic', name_ko: '트리오 클래식', hex: '#1D2531' },
      { name: 'All Black', name_en: 'All Black', name_ko: '올 블랙', hex: '#111112' },
    ],
    material: 'Micro Modal 92%, Elastane 8%',
    sizes: ['M (95)', 'L (100)', 'XL (105)', 'XXL (110)'],
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Ultra-soft Lenzing modal boxer briefs with ergonomic pouch construction and no-roll waistband.',
    description_ko: '피부에 닿는 촉감이 부드러운 오스트리아 렌징 모달 92% 심리스 프리미엄 남성 드로즈입니다.',
    is_new: true,
    is_best: false,
    stock: 90,
  },

  // 18. WOMEN - UNDERWEAR
  {
    id: 18,
    sku: 'NE-W-UW-018',
    name: 'NOEUL Wireless Seamless Ribbed Bralette',
    name_en: 'NOEUL Wireless Seamless Ribbed Bralette',
    name_ko: '노을 노와이어 심리스 골지 브라렛',
    gender: 'women',
    category: 'underwear',
    price: 34000,
    discount_price: null,
    discount_rate: 0,
    color: 'Nude Sand',
    color_hex: '#E3DAC9',
    colors: [
      { name: 'Nude Sand', name_en: 'Nude Sand', name_ko: '누드 샌드', hex: '#E3DAC9' },
      { name: 'Pure White', name_en: 'Pure White', name_ko: '퓨어 화이트', hex: '#FFFFFF' },
      { name: 'Deep Black', name_en: 'Deep Black', name_ko: '딥 블랙', hex: '#111112' },
    ],
    material: 'Cotton Modal Blend',
    sizes: ['S (70A-75A)', 'M (75B-80B)', 'L (80C-85C)'],
    images: [
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Pressure-free wireless support engineered from stretchy ribbed modal knit with removable cups.',
    description_ko: '와이어 없이도 가슴 라인을 편안하게 감싸주는 심리스 골지 모달 브라렛입니다.',
    is_new: false,
    is_best: true,
    stock: 80,
  },

  // 19. UNISEX - ACCESSORIES
  {
    id: 19,
    sku: 'NE-U-AC-019',
    name: 'NOEUL Chunky Minimal Silver Bangle',
    name_en: 'NOEUL Chunky Minimal Silver Bangle',
    name_ko: '노을 청키 미니멀 실버 뱅글 팔찌',
    gender: 'unisex',
    category: 'accessories',
    price: 52000,
    discount_price: null,
    discount_rate: 0,
    color: 'Silver',
    color_hex: '#D9D9D9',
    colors: [
      { name: 'Silver 925', name_en: 'Silver 925', name_ko: '실버 925', hex: '#D9D9D9' },
      { name: 'Vintage Gold', name_en: 'Vintage Gold', name_ko: '빈티지 골드', hex: '#CFB53B' },
    ],
    material: '925 Sterling Silver',
    sizes: ['ONE SIZE (Open Cuff)'],
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=1000&auto=format&fit=crop',
    ],
    description: 'Sculptural open-cuff bangle forged with subtle organic curves in solid 925 sterling silver.',
    description_ko: '심플하면서도 존재감 있는 유려한 곡선의 솔리드 실버 925 오픈 뱅글입니다.',
    is_new: true,
    is_best: false,
    stock: 40,
  }
];

/**
 * Filter products dynamically based on gender, category, search term, and tags
 */
export function getFilteredProducts({
  gender = 'all',
  category = 'all',
  search = '',
  filter = '',
  sort = 'newest',
  minPrice,
  maxPrice,
} = {}) {
  let result = [...PRODUCTS];

  // 1. Gender Filter
  if (gender && gender !== 'all') {
    const g = gender.toLowerCase();
    result = result.filter(
      (p) => p.gender === g || p.gender === 'unisex'
    );
  }

  // 2. Category Filter
  if (category && category !== 'all') {
    const c = category.toLowerCase();
    result = result.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      // Map legacy categories
      if (c === 'outerwear') return pCat === 'jackets';
      if (c === 'tops') return pCat === 'tshirts' || pCat === 'hoodies';
      return pCat === c;
    });
  }

  // 3. Search Filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.name_ko && p.name_ko.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    });
  }

  // 4. Badges / Tags (new / best / sale)
  if (filter === 'new') {
    result = result.filter((p) => p.is_new);
  } else if (filter === 'best') {
    result = result.filter((p) => p.is_best);
  } else if (filter === 'sale') {
    result = result.filter((p) => p.discount_rate > 0 || p.discount_price !== null);
  }

  // 5. Price Filter
  if (minPrice !== undefined && minPrice !== null) {
    result = result.filter((p) => (p.discount_price || p.price) >= minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null) {
    result = result.filter((p) => (p.discount_price || p.price) <= maxPrice);
  }

  // 6. Sorting
  switch (sort) {
    case 'price_asc':
      result.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
      break;
    case 'price_desc':
      result.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
      break;
    case 'popular':
    case 'best':
      result.sort((a, b) => (b.is_best ? 1 : 0) - (a.is_best ? 1 : 0));
      break;
    case 'newest':
    default:
      result.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0) || b.id - a.id);
      break;
  }

  return result;
}

export function getProductById(id) {
  const numericId = Number(id);
  return PRODUCTS.find((p) => p.id === numericId) || null;
}

export function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  return PRODUCTS
    .filter((p) => p.id !== product.id && (p.category === product.category || p.gender === product.gender))
    .slice(0, limit);
}
