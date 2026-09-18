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
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
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
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
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
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
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
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
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
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
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
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
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
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
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
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
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
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
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
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
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
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
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
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
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
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
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
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
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
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
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
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
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
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
    ],
    description: 'Sculptural open-cuff bangle forged with subtle organic curves in solid 925 sterling silver.',
    description_ko: '심플하면서도 존재감 있는 유려한 곡선의 솔리드 실버 925 오픈 뱅글입니다.',
    is_new: true,
    is_best: false,
    stock: 40,
  },
  // 20. MEN - TSHIRTS
  {
    id: 20,
    sku: 'NE-M-TS-020',
    name: 'NOEUL Heavyweight Loopwheel Tee',
    name_en: 'NOEUL Heavyweight Loopwheel Tee',
    name_ko: '노을 루프휠 헤비웨이트 티셔츠',
    gender: 'men',
    category: 'tshirts',
    price: 45000,
    discount_price: 41000,
    discount_rate: 9,
    color: 'Washed White',
    color_hex: '#F2F0EB',
    colors: [
      { name: 'Washed White', name_en: 'Washed White', name_ko: '워시드 화이트', hex: '#F2F0EB' },
      { name: 'Pigment Black', name_en: 'Pigment Black', name_ko: '피그먼트 블랙', hex: '#212123' },
      { name: 'Moss', name_en: 'Moss', name_ko: '모스', hex: '#4A5A4A' },
    ],
    material: 'Loopwheel Cotton',
    sizes: ["S","M","L","XL"],
    images: [
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Heavyweight Loopwheel Tee — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 루프휠 헤비웨이트 티셔츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 70,
  },

  // 21. WOMEN - TSHIRTS
  {
    id: 21,
    sku: 'NE-W-TS-021',
    name: 'NOEUL Cropped Boxy Tee',
    name_en: 'NOEUL Cropped Boxy Tee',
    name_ko: '노을 우먼스 크롭 박시 티셔츠',
    gender: 'women',
    category: 'tshirts',
    price: 38000,
    discount_price: null,
    discount_rate: 0,
    color: 'Butter',
    color_hex: '#F6E8C8',
    colors: [
      { name: 'Butter', name_en: 'Butter', name_ko: '버터', hex: '#F6E8C8' },
      { name: 'Ash Pink', name_en: 'Ash Pink', name_ko: '애쉬 핑크', hex: '#E8CFCF' },
    ],
    material: 'Bio Cotton',
    sizes: ["S","M","L"],
    images: [
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Cropped Boxy Tee — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 우먼스 크롭 박시 티셔츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 90,
  },

  // 22. MEN - SHIRTS
  {
    id: 22,
    sku: 'NE-M-SH-022',
    name: 'NOEUL Oxford BD Shirt',
    name_en: 'NOEUL Oxford BD Shirt',
    name_ko: '노을 옥스포드 버튼다운 셔츠',
    gender: 'men',
    category: 'shirts',
    price: 72000,
    discount_price: null,
    discount_rate: 0,
    color: 'Vintage White',
    color_hex: '#FFFEF9',
    colors: [
      { name: 'Vintage White', name_en: 'Vintage White', name_ko: '빈티지 화이트', hex: '#FFFEF9' },
      { name: 'Light Blue', name_en: 'Light Blue', name_ko: '라이트 블루', hex: '#C8D8E4' },
    ],
    material: 'Oxford Cotton',
    sizes: ["M","L","XL"],
    images: [
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Oxford BD Shirt — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 옥스포드 버튼다운 셔츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 55,
  },

  // 23. WOMEN - SHIRTS
  {
    id: 23,
    sku: 'NE-W-SH-023',
    name: 'NOEUL Breeze Linen Shirt',
    name_en: 'NOEUL Breeze Linen Shirt',
    name_ko: '노을 브리즈 린넨 셔츠',
    gender: 'women',
    category: 'shirts',
    price: 68000,
    discount_price: 61000,
    discount_rate: 10,
    color: 'Pale Sage',
    color_hex: '#D4D9C7',
    colors: [
      { name: 'Pale Sage', name_en: 'Pale Sage', name_ko: '페일 세이지', hex: '#D4D9C7' },
      { name: 'Stone', name_en: 'Stone', name_ko: '스톤', hex: '#C9C5BA' },
    ],
    material: 'Linen 100%',
    sizes: ["S","M","L"],
    images: [
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Breeze Linen Shirt — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 브리즈 린넨 셔츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: true,
    stock: 48,
  },

  // 24. MEN - JEANS
  {
    id: 24,
    sku: 'NE-M-JN-024',
    name: 'NOEUL Tapered Selvedge Jean',
    name_en: 'NOEUL Tapered Selvedge Jean',
    name_ko: '노을 테이퍼드 셀비지 진',
    gender: 'men',
    category: 'jeans',
    price: 95000,
    discount_price: null,
    discount_rate: 0,
    color: 'Mid Blue',
    color_hex: '#6B7B8F',
    colors: [
      { name: 'Mid Blue', name_en: 'Mid Blue', name_ko: '미드 블루', hex: '#6B7B8F' },
      { name: 'One Wash', name_en: 'One Wash', name_ko: '원 워시', hex: '#2F3D4A' },
    ],
    material: '14oz Denim',
    sizes: ["30","32","34","36"],
    images: [
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Tapered Selvedge Jean — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 테이퍼드 셀비지 진 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 44,
  },

  // 25. WOMEN - JEANS
  {
    id: 25,
    sku: 'NE-W-JN-025',
    name: 'NOEUL Low-Rise Baggy Denim',
    name_en: 'NOEUL Low-Rise Baggy Denim',
    name_ko: '노을 로우라이즈 배기 데님',
    gender: 'women',
    category: 'jeans',
    price: 88000,
    discount_price: null,
    discount_rate: 0,
    color: 'Light Wash',
    color_hex: '#A9B8C8',
    colors: [
      { name: 'Light Wash', name_en: 'Light Wash', name_ko: '라이트 워시', hex: '#A9B8C8' },
      { name: 'Graphite', name_en: 'Graphite', name_ko: '그래파이트', hex: '#3A3A44' },
    ],
    material: 'Cotton Denim',
    sizes: ["25","26","27","28"],
    images: [
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Low-Rise Baggy Denim — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 로우라이즈 배기 데님 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 60,
  },

  // 26. MEN - PANTS
  {
    id: 26,
    sku: 'NE-M-PT-026',
    name: 'NOEUL Deconstructed Cargo Trousers',
    name_en: 'NOEUL Deconstructed Cargo Trousers',
    name_ko: '노을 디컨스트럭션 카고 팬츠',
    gender: 'men',
    category: 'pants',
    price: 102000,
    discount_price: null,
    discount_rate: 0,
    color: 'Khaki',
    color_hex: '#8A7F6B',
    colors: [
      { name: 'Khaki', name_en: 'Khaki', name_ko: '카키', hex: '#8A7F6B' },
      { name: 'Slate Black', name_en: 'Slate Black', name_ko: '슬레이트 블랙', hex: '#1A1C1E' },
    ],
    material: 'Ripstop Cotton',
    sizes: ["S","M","L","XL"],
    images: [
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Deconstructed Cargo Trousers — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 디컨스트럭션 카고 팬츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 52,
  },

  // 27. WOMEN - PANTS
  {
    id: 27,
    sku: 'NE-W-PT-027',
    name: 'NOEUL Tailored Barrel Pants',
    name_en: 'NOEUL Tailored Barrel Pants',
    name_ko: '노을 테일러드 배럴 팬츠',
    gender: 'women',
    category: 'pants',
    price: 96000,
    discount_price: 86000,
    discount_rate: 10,
    color: 'Oatmeal',
    color_hex: '#E9E2D6',
    colors: [
      { name: 'Oatmeal', name_en: 'Oatmeal', name_ko: '오트밀', hex: '#E9E2D6' },
      { name: 'Coal', name_en: 'Coal', name_ko: '콜', hex: '#2B2B2D' },
    ],
    material: 'Wool Blend',
    sizes: ["S","M","L"],
    images: [
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Tailored Barrel Pants — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 테일러드 배럴 팬츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: true,
    stock: 38,
  },

  // 28. MEN - JACKETS
  {
    id: 28,
    sku: 'NE-M-JK-028',
    name: 'NOEUL Quilted MA-1 Bomber',
    name_en: 'NOEUL Quilted MA-1 Bomber',
    name_ko: '노을 퀼팅 MA-1 봄버 자켓',
    gender: 'men',
    category: 'jackets',
    price: 168000,
    discount_price: null,
    discount_rate: 0,
    color: 'Olive',
    color_hex: '#5B6342',
    colors: [
      { name: 'Olive', name_en: 'Olive', name_ko: '올리브', hex: '#5B6342' },
      { name: 'Black', name_en: 'Black', name_ko: '블랙', hex: '#111112' },
    ],
    material: 'Nylon Quilted',
    sizes: ["M","L","XL"],
    images: [
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Quilted MA-1 Bomber — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 퀼팅 MA-1 봄버 자켓 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 32,
  },

  // 29. WOMEN - JACKETS
  {
    id: 29,
    sku: 'NE-W-JK-029',
    name: 'NOEUL Pastoral Wool Coat',
    name_en: 'NOEUL Pastoral Wool Coat',
    name_ko: '노을 파스토리얼 울 코트',
    gender: 'women',
    category: 'jackets',
    price: 245000,
    discount_price: 220000,
    discount_rate: 10,
    color: 'Camel',
    color_hex: '#C9A86A',
    colors: [
      { name: 'Camel', name_en: 'Camel', name_ko: '카멜', hex: '#C9A86A' },
      { name: 'Charcoal', name_en: 'Charcoal', name_ko: '차콜', hex: '#373739' },
    ],
    material: 'Wool 90%',
    sizes: ["S","M"],
    images: [
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Pastoral Wool Coat — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 파스토리얼 울 코트 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 24,
  },

  // 30. MEN - HOODIES
  {
    id: 30,
    sku: 'NE-M-HD-030',
    name: 'NOEUL Garment-Dyed Hoodie',
    name_en: 'NOEUL Garment-Dyed Hoodie',
    name_ko: '노을 가먼트다이 후디',
    gender: 'men',
    category: 'hoodies',
    price: 85000,
    discount_price: null,
    discount_rate: 0,
    color: 'Faded Navy',
    color_hex: '#4B5462',
    colors: [
      { name: 'Faded Navy', name_en: 'Faded Navy', name_ko: '페이디드 네이비', hex: '#4B5462' },
      { name: 'Brick', name_en: 'Brick', name_ko: '브릭', hex: '#8B3A2A' },
    ],
    material: '500gsm Terry',
    sizes: ["M","L","XL"],
    images: [
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Garment-Dyed Hoodie — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 가먼트다이 후디 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 58,
  },

  // 31. WOMEN - HOODIES
  {
    id: 31,
    sku: 'NE-W-HD-031',
    name: 'NOEUL Cropped Sweat Pullover',
    name_en: 'NOEUL Cropped Sweat Pullover',
    name_ko: '노을 크롭 스웨트 풀오버',
    gender: 'women',
    category: 'hoodies',
    price: 72000,
    discount_price: null,
    discount_rate: 0,
    color: 'Heather Pink',
    color_hex: '#E8CFC8',
    colors: [
      { name: 'Heather Pink', name_en: 'Heather Pink', name_ko: '헤더 핑크', hex: '#E8CFC8' },
      { name: 'Washed Grey', name_en: 'Washed Grey', name_ko: '워시드 그레이', hex: '#9E9EA0' },
    ],
    material: 'Brushed Cotton',
    sizes: ["S","M","L"],
    images: [
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Cropped Sweat Pullover — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 크롭 스웨트 풀오버 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 62,
  },

  // 32. WOMEN - DRESSES
  {
    id: 32,
    sku: 'NE-W-DR-032',
    name: 'NOEUL Slip Cami Dress',
    name_en: 'NOEUL Slip Cami Dress',
    name_ko: '노을 슬립 캐미 원피스',
    gender: 'women',
    category: 'dresses',
    price: 98000,
    discount_price: null,
    discount_rate: 0,
    color: 'Midnight',
    color_hex: '#1A1C24',
    colors: [
      { name: 'Midnight', name_en: 'Midnight', name_ko: '미드나이트', hex: '#1A1C24' },
      { name: 'Champagne', name_en: 'Champagne', name_ko: '샴페인', hex: '#E9DCC9' },
    ],
    material: 'Satin Viscose',
    sizes: ["S","M","L"],
    images: [
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Slip Cami Dress — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 슬립 캐미 원피스 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 30,
  },

  // 33. WOMEN - DRESSES
  {
    id: 33,
    sku: 'NE-W-DR-033',
    name: 'NOEUL Gathered Cotton Dress',
    name_en: 'NOEUL Gathered Cotton Dress',
    name_ko: '노을 개더 코튼 원피스',
    gender: 'women',
    category: 'dresses',
    price: 108000,
    discount_price: 97000,
    discount_rate: 10,
    color: 'White',
    color_hex: '#FFFEFB',
    colors: [
      { name: 'White', name_en: 'White', name_ko: '화이트', hex: '#FFFEFB' },
      { name: 'Sky', name_en: 'Sky', name_ko: '스카이', hex: '#B2CDD7' },
    ],
    material: 'Cotton Poplin',
    sizes: ["FREE"],
    images: [
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Gathered Cotton Dress — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 개더 코튼 원피스 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: false,
    stock: 27,
  },

  // 34. WOMEN - SKIRTS
  {
    id: 34,
    sku: 'NE-W-SK-034',
    name: 'NOEUL Cargo Pocket Midi',
    name_en: 'NOEUL Cargo Pocket Midi',
    name_ko: '노을 카고 포켓 미디 스커트',
    gender: 'women',
    category: 'skirts',
    price: 79000,
    discount_price: null,
    discount_rate: 0,
    color: 'Khaki Beige',
    color_hex: '#C2B8A3',
    colors: [
      { name: 'Khaki Beige', name_en: 'Khaki Beige', name_ko: '카키 베이지', hex: '#C2B8A3' },
      { name: 'Black', name_en: 'Black', name_ko: '블랙', hex: '#111112' },
    ],
    material: 'Cotton Twill',
    sizes: ["S","M"],
    images: [
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Cargo Pocket Midi — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 카고 포켓 미디 스커트 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 35,
  },

  // 35. WOMEN - SKIRTS
  {
    id: 35,
    sku: 'NE-W-SK-035',
    name: 'NOEUL Satin Bias Skirt',
    name_en: 'NOEUL Satin Bias Skirt',
    name_ko: '노을 새틴 바이어스 스커트',
    gender: 'women',
    category: 'skirts',
    price: 82000,
    discount_price: 73000,
    discount_rate: 11,
    color: 'Olive Satin',
    color_hex: '#7A7F6B',
    colors: [
      { name: 'Olive Satin', name_en: 'Olive Satin', name_ko: '올리브 새틴', hex: '#7A7F6B' },
      { name: 'Black Satin', name_en: 'Black Satin', name_ko: '블랙 새틴', hex: '#1A1A1E' },
    ],
    material: 'Satin',
    sizes: ["S","M"],
    images: [
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Satin Bias Skirt — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 새틴 바이어스 스커트 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 33,
  },

  // 36. UNISEX - BAGS
  {
    id: 36,
    sku: 'NE-U-BG-036',
    name: 'NOEUL Padded Tote Shopper',
    name_en: 'NOEUL Padded Tote Shopper',
    name_ko: '노을 패디드 토트 쇼퍼백',
    gender: 'unisex',
    category: 'bags',
    price: 98000,
    discount_price: null,
    discount_rate: 0,
    color: 'Cream Puff',
    color_hex: '#F5F0E6',
    colors: [
      { name: 'Cream Puff', name_en: 'Cream Puff', name_ko: '크림 퍼프', hex: '#F5F0E6' },
      { name: 'Black Quilt', name_en: 'Black Quilt', name_ko: '블랙 퀼트', hex: '#111112' },
    ],
    material: 'Nylon Padded',
    sizes: ["ONE SIZE"],
    images: [
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Padded Tote Shopper — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 패디드 토트 쇼퍼백 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 28,
  },

  // 37. UNISEX - BAGS
  {
    id: 37,
    sku: 'NE-U-BG-037',
    name: 'NOEUL Leather Utility Waist Bag',
    name_en: 'NOEUL Leather Utility Waist Bag',
    name_ko: '노을 레더 유틸리티 웨이스트백',
    gender: 'unisex',
    category: 'bags',
    price: 112000,
    discount_price: 100000,
    discount_rate: 11,
    color: 'Tan',
    color_hex: '#B08D67',
    colors: [
      { name: 'Tan', name_en: 'Tan', name_ko: '탄', hex: '#B08D67' },
      { name: 'Espresso', name_en: 'Espresso', name_ko: '에스프레소', hex: '#3E2723' },
    ],
    material: 'Cow Leather',
    sizes: ["ONE SIZE"],
    images: [
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Leather Utility Waist Bag — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 레더 유틸리티 웨이스트백 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: false,
    stock: 22,
  },

  // 38. UNISEX - SOCKS
  {
    id: 38,
    sku: 'NE-U-SK-038',
    name: 'NOEUL Performance Hiker Socks',
    name_en: 'NOEUL Performance Hiker Socks',
    name_ko: '노을 퍼포먼스 하이커 삭스',
    gender: 'unisex',
    category: 'socks',
    price: 16000,
    discount_price: null,
    discount_rate: 0,
    color: 'Forest Mix',
    color_hex: '#5A6B5A',
    colors: [
      { name: 'Forest Mix', name_en: 'Forest Mix', name_ko: '포레스트 믹스', hex: '#5A6B5A' },
      { name: 'White Pack', name_en: 'White Pack', name_ko: '화이트 팩', hex: '#FFFFFF' },
    ],
    material: 'Merino Wool',
    sizes: ["FREE"],
    images: [
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Performance Hiker Socks — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 퍼포먼스 하이커 삭스 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 180,
  },

  // 39. MEN - UNDERWEAR
  {
    id: 39,
    sku: 'NE-M-UW-039',
    name: 'NOEUL Air-Cool Trunk 2-Pack',
    name_en: 'NOEUL Air-Cool Trunk 2-Pack',
    name_ko: '노을 에어쿨 트렁크 2팩',
    gender: 'men',
    category: 'underwear',
    price: 32000,
    discount_price: null,
    discount_rate: 0,
    color: 'White/Grey',
    color_hex: '#E5E5EA',
    colors: [
      { name: 'White/Grey', name_en: 'White/Grey', name_ko: '화이트/그레이', hex: '#E5E5EA' },
      { name: 'Black Set', name_en: 'Black Set', name_ko: '블랙 세트', hex: '#111112' },
    ],
    material: 'Modal Air',
    sizes: ["M","L","XL"],
    images: [
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Air-Cool Trunk 2-Pack — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 에어쿨 트렁크 2팩 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 85,
  },

  // 40. WOMEN - UNDERWEAR
  {
    id: 40,
    sku: 'NE-W-UW-040',
    name: 'NOEUL Soft-Fit Triangle Bra',
    name_en: 'NOEUL Soft-Fit Triangle Bra',
    name_ko: '노을 소프트핏 트라이앵글 브라',
    gender: 'women',
    category: 'underwear',
    price: 38000,
    discount_price: null,
    discount_rate: 0,
    color: 'Powder Pink',
    color_hex: '#E2C2C6',
    colors: [
      { name: 'Powder Pink', name_en: 'Powder Pink', name_ko: '파우더 핑크', hex: '#E2C2C6' },
      { name: 'Black', name_en: 'Black', name_ko: '블랙', hex: '#111112' },
    ],
    material: 'Modal Soft',
    sizes: ["S","M","L"],
    images: [
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Soft-Fit Triangle Bra — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 소프트핏 트라이앵글 브라 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: true,
    stock: 70,
  },

  // 41. UNISEX - ACCESSORIES
  {
    id: 41,
    sku: 'NE-U-AC-041',
    name: 'NOEUL Canvas Ball Cap',
    name_en: 'NOEUL Canvas Ball Cap',
    name_ko: '노을 캔버스 볼캡',
    gender: 'unisex',
    category: 'accessories',
    price: 38000,
    discount_price: null,
    discount_rate: 0,
    color: 'Washed Navy',
    color_hex: '#3B4F69',
    colors: [
      { name: 'Washed Navy', name_en: 'Washed Navy', name_ko: '워시드 네이비', hex: '#3B4F69' },
      { name: 'Beige', name_en: 'Beige', name_ko: '베이지', hex: '#D7C7B2' },
    ],
    material: 'Cotton Canvas',
    sizes: ["ONE SIZE"],
    images: [
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Canvas Ball Cap — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 캔버스 볼캡 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 80,
  },

  // 42. UNISEX - ACCESSORIES
  {
    id: 42,
    sku: 'NE-U-AC-042',
    name: 'NOEUL Acetate Slim Sunglasses',
    name_en: 'NOEUL Acetate Slim Sunglasses',
    name_ko: '노을 아세테이트 슬림 선글라스',
    gender: 'unisex',
    category: 'accessories',
    price: 62000,
    discount_price: 55000,
    discount_rate: 11,
    color: 'Tortoise',
    color_hex: '#6B4F3A',
    colors: [
      { name: 'Tortoise', name_en: 'Tortoise', name_ko: '토터스', hex: '#6B4F3A' },
      { name: 'Clear Black', name_en: 'Clear Black', name_ko: '클리어 블랙', hex: '#2B2B33' },
    ],
    material: 'Acetate',
    sizes: ["ONE SIZE"],
    images: [
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Acetate Slim Sunglasses — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 아세테이트 슬림 선글라스 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 45,
  },

  // 43. MEN - TSHIRTS
  {
    id: 43,
    sku: 'NE-M-TS-043',
    name: 'NOEUL Pocket Heavy Tee',
    name_en: 'NOEUL Pocket Heavy Tee',
    name_ko: '노을 포켓 헤비 티셔츠',
    gender: 'men',
    category: 'tshirts',
    price: 42000,
    discount_price: null,
    discount_rate: 0,
    color: 'Olive Drab',
    color_hex: '#5A624E',
    colors: [
      { name: 'Olive Drab', name_en: 'Olive Drab', name_ko: '올리브 드랍', hex: '#5A624E' },
      { name: 'Natural', name_en: 'Natural', name_ko: '내추럴', hex: '#E9E2D6' },
    ],
    material: 'Heavy Cotton',
    sizes: ["M","L","XL"],
    images: [
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Pocket Heavy Tee — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 포켓 헤비 티셔츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 88,
  },

  // 44. WOMEN - JEANS
  {
    id: 44,
    sku: 'NE-W-JN-044',
    name: 'NOEUL Curved Wide Denim',
    name_en: 'NOEUL Curved Wide Denim',
    name_ko: '노을 커브드 와이드 데님',
    gender: 'women',
    category: 'jeans',
    price: 92000,
    discount_price: null,
    discount_rate: 0,
    color: 'Sunbleached',
    color_hex: '#C9C9C3',
    colors: [
      { name: 'Sunbleached', name_en: 'Sunbleached', name_ko: '선블리치', hex: '#C9C9C3' },
      { name: 'Rinsed', name_en: 'Rinsed', name_ko: '린스드', hex: '#4A5568' },
    ],
    material: 'Denim',
    sizes: ["25","27","29"],
    images: [
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Curved Wide Denim — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 커브드 와이드 데님 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 52,
  },

  // 45. UNISEX - BAGS
  {
    id: 45,
    sku: 'NE-U-BG-045',
    name: 'NOEUL Circle Crossbody Mini',
    name_en: 'NOEUL Circle Crossbody Mini',
    name_ko: '노을 서클 크로스바디 미니백',
    gender: 'unisex',
    category: 'bags',
    price: 78000,
    discount_price: null,
    discount_rate: 0,
    color: 'Milk',
    color_hex: '#FFFEFB',
    colors: [
      { name: 'Milk', name_en: 'Milk', name_ko: '밀크', hex: '#FFFEFB' },
      { name: 'Chalk Black', name_en: 'Chalk Black', name_ko: '차크 블랙', hex: '#1A1A1E' },
    ],
    material: 'Grain Leather',
    sizes: ["ONE SIZE"],
    images: [
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Circle Crossbody Mini — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 서클 크로스바디 미니백 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 30,
  },

  // 46. MEN - HOODIES
  {
    id: 46,
    sku: 'NE-M-HD-046',
    name: 'NOEUL Waffle Knit Hoodie',
    name_en: 'NOEUL Waffle Knit Hoodie',
    name_ko: '노을 와플 니트 후디',
    gender: 'men',
    category: 'hoodies',
    price: 88000,
    discount_price: 79000,
    discount_rate: 10,
    color: 'Oatmeal Waffle',
    color_hex: '#E7DCC8',
    colors: [
      { name: 'Oatmeal Waffle', name_en: 'Oatmeal Waffle', name_ko: '오트밀 와플', hex: '#E7DCC8' },
      { name: 'Moss Waffle', name_en: 'Moss Waffle', name_ko: '모스 와플', hex: '#4A5A4A' },
    ],
    material: 'Waffle Knit',
    sizes: ["M","L"],
    images: [
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Waffle Knit Hoodie — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 와플 니트 후디 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: true,
    stock: 40,
  },

  // 47. WOMEN - PANTS
  {
    id: 47,
    sku: 'NE-W-PT-047',
    name: 'NOEUL Paper Bag Waist Pants',
    name_en: 'NOEUL Paper Bag Waist Pants',
    name_ko: '노을 페이퍼백 웨이스트 팬츠',
    gender: 'women',
    category: 'pants',
    price: 86000,
    discount_price: null,
    discount_rate: 0,
    color: 'Sand',
    color_hex: '#D7C7B2',
    colors: [
      { name: 'Sand', name_en: 'Sand', name_ko: '샌드', hex: '#D7C7B2' },
      { name: 'Charcoal', name_en: 'Charcoal', name_ko: '차콜', hex: '#373739' },
    ],
    material: 'Cotton Linen',
    sizes: ["S","M","L"],
    images: [
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Paper Bag Waist Pants — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 페이퍼백 웨이스트 팬츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 36,
  },

  // 48. UNISEX - ACCESSORIES
  {
    id: 48,
    sku: 'NE-W-AC-048',
    name: 'NOEUL Knit Beanie',
    name_en: 'NOEUL Knit Beanie',
    name_ko: '노을 니트 비니',
    gender: 'unisex',
    category: 'accessories',
    price: 28000,
    discount_price: null,
    discount_rate: 0,
    color: 'Heather Charcoal',
    color_hex: '#6B6E72',
    colors: [
      { name: 'Heather Charcoal', name_en: 'Heather Charcoal', name_ko: '헤더 차콜', hex: '#6B6E72' },
      { name: 'Camel Beanie', name_en: 'Camel Beanie', name_ko: '카멜 비니', hex: '#C9A86A' },
    ],
    material: 'Wool Knit',
    sizes: ["ONE SIZE"],
    images: [
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Knit Beanie — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 니트 비니 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 95,
  },

  // 49. MEN - JACKETS
  {
    id: 49,
    sku: 'NE-M-JK-049',
    name: 'NOEUL Field Chore Jacket',
    name_en: 'NOEUL Field Chore Jacket',
    name_ko: '노을 필드 초어 자켓',
    gender: 'men',
    category: 'jackets',
    price: 138000,
    discount_price: null,
    discount_rate: 0,
    color: 'Brown Olive',
    color_hex: '#6B5A3F',
    colors: [
      { name: 'Brown Olive', name_en: 'Brown Olive', name_ko: '브라운 올리브', hex: '#6B5A3F' },
      { name: 'Faded Black', name_en: 'Faded Black', name_ko: '페이디드 블랙', hex: '#232324' },
    ],
    material: 'Canvas',
    sizes: ["M","L","XL"],
    images: [
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Field Chore Jacket — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 필드 초어 자켓 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: true,
    stock: 34,
  },

  // 50. WOMEN - DRESSES
  {
    id: 50,
    sku: 'NE-W-DR-050',
    name: 'NOEUL Puff Sleeve Mini Dress',
    name_en: 'NOEUL Puff Sleeve Mini Dress',
    name_ko: '노을 퍼프 슬리브 미니 원피스',
    gender: 'women',
    category: 'dresses',
    price: 88000,
    discount_price: 79000,
    discount_rate: 10,
    color: 'Pale Yellow',
    color_hex: '#F6E8C8',
    colors: [
      { name: 'Pale Yellow', name_en: 'Pale Yellow', name_ko: '페일 옐로우', hex: '#F6E8C8' },
      { name: 'White Mini', name_en: 'White Mini', name_ko: '화이트 미니', hex: '#FFFEFB' },
    ],
    material: 'Cotton',
    sizes: ["S","M"],
    images: [
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Puff Sleeve Mini Dress — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 퍼프 슬리브 미니 원피스 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 31,
  },

  // 51. UNISEX - SOCKS
  {
    id: 51,
    sku: 'NE-U-SK-051',
    name: 'NOEUL Waffle Crew Socks 3-Pack',
    name_en: 'NOEUL Waffle Crew Socks 3-Pack',
    name_ko: '노을 와플 크루 삭스 3팩',
    gender: 'unisex',
    category: 'socks',
    price: 19000,
    discount_price: null,
    discount_rate: 0,
    color: 'Oatmeal/Charcoal',
    color_hex: '#C9C5B8',
    colors: [
      { name: 'Oatmeal/Charcoal', name_en: 'Oatmeal/Charcoal', name_ko: '오트밀/차콜', hex: '#C9C5B8' },
      { name: 'White Set', name_en: 'White Set', name_ko: '화이트 세트', hex: '#FFFFFF' },
    ],
    material: 'Cotton Waffle',
    sizes: ["FREE"],
    images: [
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Waffle Crew Socks 3-Pack — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 와플 크루 삭스 3팩 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 150,
  },

  // 52. MEN - UNDERWEAR
  {
    id: 52,
    sku: 'NE-M-UW-052',
    name: 'NOEUL Essential Boxer 5-Pack',
    name_en: 'NOEUL Essential Boxer 5-Pack',
    name_ko: '노을 에센셜 박서 5팩',
    gender: 'men',
    category: 'underwear',
    price: 42000,
    discount_price: 38000,
    discount_rate: 10,
    color: 'Assorted',
    color_hex: '#9E9EA0',
    colors: [
      { name: 'Assorted', name_en: 'Assorted', name_ko: '어쏘티드', hex: '#9E9EA0' },
      { name: 'Solid', name_en: 'Solid', name_ko: '솔리드', hex: '#111112' },
    ],
    material: 'Cotton Modal',
    sizes: ["L","XL"],
    images: [
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Essential Boxer 5-Pack — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 에센셜 박서 5팩 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: true,
    stock: 110,
  },

  // 53. WOMEN - ACCESSORIES
  {
    id: 53,
    sku: 'NE-W-AC-053',
    name: 'NOEUL Tiny Pearl Hoops',
    name_en: 'NOEUL Tiny Pearl Hoops',
    name_ko: '노을 진주 후프 이어링',
    gender: 'women',
    category: 'accessories',
    price: 25000,
    discount_price: null,
    discount_rate: 0,
    color: 'Pearl',
    color_hex: '#F5F0E6',
    colors: [
      { name: 'Pearl', name_en: 'Pearl', name_ko: '펄', hex: '#F5F0E6' },
      { name: 'Gold Pearl', name_en: 'Gold Pearl', name_ko: '골드 펄', hex: '#D4AF37' },
    ],
    material: 'Pearl Brass',
    sizes: ["ONE SIZE"],
    images: [
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Tiny Pearl Hoops — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 진주 후프 이어링 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 70,
  },

  // 54. MEN - PANTS
  {
    id: 54,
    sku: 'NE-M-PT-054',
    name: 'NOEUL Cropped Balloon Trousers',
    name_en: 'NOEUL Cropped Balloon Trousers',
    name_ko: '노을 크롭 벌룬 트라우저',
    gender: 'men',
    category: 'pants',
    price: 99000,
    discount_price: null,
    discount_rate: 0,
    color: 'Ash Grey',
    color_hex: '#A8A9AA',
    colors: [
      { name: 'Ash Grey', name_en: 'Ash Grey', name_ko: '애쉬 그레이', hex: '#A8A9AA' },
      { name: 'Deep Navy', name_en: 'Deep Navy', name_ko: '딥 네이비', hex: '#1C2430' },
    ],
    material: 'Cotton Blend',
    sizes: ["M","L"],
    images: [
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Cropped Balloon Trousers — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 크롭 벌룬 트라우저 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 42,
  },

  // 55. WOMEN - SKIRTS
  {
    id: 55,
    sku: 'NE-W-SK-055',
    name: 'NOEUL Denim Long Skirt',
    name_en: 'NOEUL Denim Long Skirt',
    name_ko: '노을 데님 롱 스커트',
    gender: 'women',
    category: 'skirts',
    price: 76000,
    discount_price: null,
    discount_rate: 0,
    color: 'Denim Blue',
    color_hex: '#5E799B',
    colors: [
      { name: 'Denim Blue', name_en: 'Denim Blue', name_ko: '데님 블루', hex: '#5E799B' },
      { name: 'Raw Indigo Skirt', name_en: 'Raw Indigo Skirt', name_ko: '로우 인디고', hex: '#26374D' },
    ],
    material: 'Denim',
    sizes: ["S","M"],
    images: [
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Denim Long Skirt — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 데님 롱 스커트 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: false,
    stock: 37,
  },

  // 56. UNISEX - ACCESSORIES
  {
    id: 56,
    sku: 'NE-U-AC-056',
    name: 'NOEUL Woven Wide Belt',
    name_en: 'NOEUL Woven Wide Belt',
    name_ko: '노을 우븐 와이드 벨트',
    gender: 'unisex',
    category: 'accessories',
    price: 32000,
    discount_price: null,
    discount_rate: 0,
    color: 'Natural Woven',
    color_hex: '#D7C7B2',
    colors: [
      { name: 'Natural Woven', name_en: 'Natural Woven', name_ko: '내추럴 우븐', hex: '#D7C7B2' },
      { name: 'Black Woven', name_en: 'Black Woven', name_ko: '블랙 우븐', hex: '#111112' },
    ],
    material: 'Cotton Woven',
    sizes: ["ONE SIZE"],
    images: [
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Woven Wide Belt — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 우븐 와이드 벨트 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 65,
  },

  // 57. WOMEN - SHIRTS
  {
    id: 57,
    sku: 'NE-W-SH-057',
    name: 'NOEUL Stripe Cotton Shirt',
    name_en: 'NOEUL Stripe Cotton Shirt',
    name_ko: '노을 스트라이프 코튼 셔츠',
    gender: 'women',
    category: 'shirts',
    price: 74000,
    discount_price: null,
    discount_rate: 0,
    color: 'Blue Stripe',
    color_hex: '#8FB0C6',
    colors: [
      { name: 'Blue Stripe', name_en: 'Blue Stripe', name_ko: '블루 스트라이프', hex: '#8FB0C6' },
      { name: 'Navy Stripe', name_en: 'Navy Stripe', name_ko: '네이비 스트라이프', hex: '#1C2430' },
    ],
    material: 'Cotton Stripe',
    sizes: ["S","M","L"],
    images: [
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Stripe Cotton Shirt — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 스트라이프 코튼 셔츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 46,
  },

  // 58. MEN - SHIRTS
  {
    id: 58,
    sku: 'NE-M-SH-058',
    name: 'NOEUL Corduroy Overshirt',
    name_en: 'NOEUL Corduroy Overshirt',
    name_ko: '노을 코듀로이 오버셔츠',
    gender: 'men',
    category: 'shirts',
    price: 78000,
    discount_price: 70000,
    discount_rate: 10,
    color: 'Mustard',
    color_hex: '#C9A86A',
    colors: [
      { name: 'Mustard', name_en: 'Mustard', name_ko: '머스타드', hex: '#C9A86A' },
      { name: 'Olive Cord', name_en: 'Olive Cord', name_ko: '올리브 코듀', hex: '#5A624E' },
    ],
    material: 'Corduroy',
    sizes: ["M","L","XL"],
    images: [
      '/products/men/tshirts/classic-tshirt/5.jpg',
      '/products/women/tshirts/oversized-tshirt/1.jpg',
      '/products/women/tshirts/oversized-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Corduroy Overshirt — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 코듀로이 오버셔츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: false,
    is_best: true,
    stock: 41,
  },

  // 59. WOMEN - PANTS
  {
    id: 59,
    sku: 'NE-W-PT-059',
    name: 'NOEUL Corduroy Wide Pants',
    name_en: 'NOEUL Corduroy Wide Pants',
    name_ko: '노을 코듀로이 와이드 팬츠',
    gender: 'women',
    category: 'pants',
    price: 88000,
    discount_price: null,
    discount_rate: 0,
    color: 'Rust',
    color_hex: '#8B3A2A',
    colors: [
      { name: 'Rust', name_en: 'Rust', name_ko: '러스트', hex: '#8B3A2A' },
      { name: 'Dark Brown', name_en: 'Dark Brown', name_ko: '다크 브라운', hex: '#4A3B32' },
    ],
    material: 'Corduroy',
    sizes: ["S","M"],
    images: [
      '/products/women/tshirts/oversized-tshirt/3.jpg',
      '/products/women/tshirts/oversized-tshirt/4.jpg',
      '/products/women/tshirts/oversized-tshirt/5.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Corduroy Wide Pants — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 코듀로이 와이드 팬츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 39,
  },

  // 60. UNISEX - ACCESSORIES
  {
    id: 60,
    sku: 'NE-U-AC-060',
    name: 'NOEUL Nylon Bucket Hat',
    name_en: 'NOEUL Nylon Bucket Hat',
    name_ko: '노을 나일론 버킷햇',
    gender: 'unisex',
    category: 'accessories',
    price: 36000,
    discount_price: null,
    discount_rate: 0,
    color: 'Sage',
    color_hex: '#A8BBA2',
    colors: [
      { name: 'Sage', name_en: 'Sage', name_ko: '세이지', hex: '#A8BBA2' },
      { name: 'Black Hat', name_en: 'Black Hat', name_ko: '블랙 햇', hex: '#111112' },
    ],
    material: 'Nylon',
    sizes: ["ONE SIZE"],
    images: [
      '/products/men/tshirts/classic-tshirt/1.jpg',
      '/products/men/tshirts/classic-tshirt/2.jpg',
      '/products/men/tshirts/classic-tshirt/3.jpg',
      '/products/men/tshirts/classic-tshirt/4.jpg',
      '/products/men/tshirts/classic-tshirt/5.jpg'
    ],
    description: 'NOEUL Nylon Bucket Hat — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 나일론 버킷햇 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 55,
  },

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
