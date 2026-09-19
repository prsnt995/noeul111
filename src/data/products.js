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
    ],
    description: 'NOEUL Heavyweight Loopwheel Tee — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 루프휠 헤비웨이트 티셔츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 70,
  },
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
    ],
    description: 'NOEUL Oxford BD Shirt — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 옥스포드 버튼다운 셔츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 55,
  },
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
    ],
    description: 'NOEUL Tapered Selvedge Jean — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 테이퍼드 셀비지 진 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 44,
  },
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
    ],
    description: 'NOEUL Deconstructed Cargo Trousers — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 디컨스트럭션 카고 팬츠 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 52,
  },
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
    ],
    description: 'NOEUL Slip Cami Dress — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 슬립 캐미 원피스 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 30,
  },
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
    ],
    description: 'NOEUL Cargo Pocket Midi — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 카고 포켓 미디 스커트 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 35,
  },
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
    ],
    description: 'NOEUL Quilted MA-1 Bomber — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 퀼팅 MA-1 봄버 자켓 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 32,
  },
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
    ],
    description: 'NOEUL Garment-Dyed Hoodie — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 가먼트다이 후디 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 58,
  },
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
    ],
    description: 'NOEUL Padded Tote Shopper — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 패디드 토트 쇼퍼백 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 28,
  },
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
    ],
    description: 'NOEUL Performance Hiker Socks — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 퍼포먼스 하이커 삭스 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: false,
    stock: 180,
  },
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
    ],
    description: 'NOEUL Air-Cool Trunk 2-Pack — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 에어쿨 트렁크 2팩 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 85,
  },
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
    ],
    description: 'NOEUL Acetate Slim Sunglasses — synthetic placeholder until real shoot, cache-friendly reused local image.',
    description_ko: '노을 아세테이트 슬림 선글라스 — 실제 촬영 전까지 재사용 로컬 이미지로 구성된 합성 플레이스홀더입니다.',
    is_new: true,
    is_best: true,
    stock: 45,
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
