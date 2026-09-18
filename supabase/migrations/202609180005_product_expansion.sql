-- 005: Product expansion 19→60 + variants/media (cache-safe, Supabase free tier)
-- Synthetic placeholders reuse 10 local public/products images (0.6MB total, immutable) — no new Storage upload, zero extra egress.
-- Variants: ~3 per product (size×color matrix, quarter stock split) → ~123 variants
-- Media: 3 per product → ~123 media, url = local /products/... (self-hosted, no vendor consent)
-- Idempotent: on conflict do nothing, safe to re-run.
-- After real shoots, replace image urls via AdminMediaPage or scripts/upload-supabase-assets.mjs.
-- Free-tier note: public/products served via Vercel immutable Cache-Control (vercel.json) + Vite hashed assets; Supabase Storage not used for these placeholders to stay under 1GB/5GB.

-- Ensure categories exist (socks, t-shirts etc already from 001). Add missing if needed:
insert into app.categories (slug, name_ko, name_en) values
  ('tshirts','티셔츠','T-Shirts'),
  ('shirts','셔츠/블라우스','Shirts & Blouses'),
  ('jeans','청바지/데님','Jeans'),
  ('pants','팬츠/슬랙스','Pants'),
  ('dresses','원피스','Dresses'),
  ('skirts','스커트','Skirts'),
  ('jackets','자켓/아우터','Jackets'),
  ('hoodies','후디/스웨트','Hoodies'),
  ('bags','가방','Bags'),
  ('socks','양말/삭스','Socks'),
  ('underwear','언더웨어','Underwear'),
  ('accessories','액세서리','Accessories')
on conflict (slug) do nothing;

insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 20, 'ne-m-ts-020-noeul-heavyweight-loopwheel-te', 'NE-M-TS-020', c.id, '노을 루프휠 헤비웨이트 티셔츠', 'NOEUL Heavyweight Loopwheel Tee', '노을 루프휠 헤비웨이트 티셔츠', 'NOEUL Heavyweight Loopwheel Tee', 45000, 41000, 'men', true, true, false
  from app.categories c where c.slug='tshirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 21, 'ne-w-ts-021-noeul-cropped-boxy-tee', 'NE-W-TS-021', c.id, '노을 우먼스 크롭 박시 티셔츠', 'NOEUL Cropped Boxy Tee', '노을 우먼스 크롭 박시 티셔츠', 'NOEUL Cropped Boxy Tee', 38000, null, 'women', true, true, true
  from app.categories c where c.slug='tshirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 22, 'ne-m-sh-022-noeul-oxford-bd-shirt', 'NE-M-SH-022', c.id, '노을 옥스포드 버튼다운 셔츠', 'NOEUL Oxford BD Shirt', '노을 옥스포드 버튼다운 셔츠', 'NOEUL Oxford BD Shirt', 72000, null, 'men', true, true, false
  from app.categories c where c.slug='shirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 23, 'ne-w-sh-023-noeul-breeze-linen-shirt', 'NE-W-SH-023', c.id, '노을 브리즈 린넨 셔츠', 'NOEUL Breeze Linen Shirt', '노을 브리즈 린넨 셔츠', 'NOEUL Breeze Linen Shirt', 68000, 61000, 'women', true, false, true
  from app.categories c where c.slug='shirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 24, 'ne-m-jn-024-noeul-tapered-selvedge-jean', 'NE-M-JN-024', c.id, '노을 테이퍼드 셀비지 진', 'NOEUL Tapered Selvedge Jean', '노을 테이퍼드 셀비지 진', 'NOEUL Tapered Selvedge Jean', 95000, null, 'men', true, true, true
  from app.categories c where c.slug='jeans'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 25, 'ne-w-jn-025-noeul-low-rise-baggy-denim', 'NE-W-JN-025', c.id, '노을 로우라이즈 배기 데님', 'NOEUL Low-Rise Baggy Denim', '노을 로우라이즈 배기 데님', 'NOEUL Low-Rise Baggy Denim', 88000, null, 'women', true, true, false
  from app.categories c where c.slug='jeans'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 26, 'ne-m-pt-026-noeul-deconstructed-cargo-trou', 'NE-M-PT-026', c.id, '노을 디컨스트럭션 카고 팬츠', 'NOEUL Deconstructed Cargo Trousers', '노을 디컨스트럭션 카고 팬츠', 'NOEUL Deconstructed Cargo Trousers', 102000, null, 'men', true, true, false
  from app.categories c where c.slug='pants'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 27, 'ne-w-pt-027-noeul-tailored-barrel-pants', 'NE-W-PT-027', c.id, '노을 테일러드 배럴 팬츠', 'NOEUL Tailored Barrel Pants', '노을 테일러드 배럴 팬츠', 'NOEUL Tailored Barrel Pants', 96000, 86000, 'women', true, false, true
  from app.categories c where c.slug='pants'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 28, 'ne-m-jk-028-noeul-quilted-ma-1-bomber', 'NE-M-JK-028', c.id, '노을 퀼팅 MA-1 봄버 자켓', 'NOEUL Quilted MA-1 Bomber', '노을 퀼팅 MA-1 봄버 자켓', 'NOEUL Quilted MA-1 Bomber', 168000, null, 'men', true, true, true
  from app.categories c where c.slug='jackets'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 29, 'ne-w-jk-029-noeul-pastoral-wool-coat', 'NE-W-JK-029', c.id, '노을 파스토리얼 울 코트', 'NOEUL Pastoral Wool Coat', '노을 파스토리얼 울 코트', 'NOEUL Pastoral Wool Coat', 245000, 220000, 'women', true, true, false
  from app.categories c where c.slug='jackets'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 30, 'ne-m-hd-030-noeul-garment-dyed-hoodie', 'NE-M-HD-030', c.id, '노을 가먼트다이 후디', 'NOEUL Garment-Dyed Hoodie', '노을 가먼트다이 후디', 'NOEUL Garment-Dyed Hoodie', 85000, null, 'men', true, true, true
  from app.categories c where c.slug='hoodies'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 31, 'ne-w-hd-031-noeul-cropped-sweat-pullover', 'NE-W-HD-031', c.id, '노을 크롭 스웨트 풀오버', 'NOEUL Cropped Sweat Pullover', '노을 크롭 스웨트 풀오버', 'NOEUL Cropped Sweat Pullover', 72000, null, 'women', true, true, false
  from app.categories c where c.slug='hoodies'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 32, 'ne-w-dr-032-noeul-slip-cami-dress', 'NE-W-DR-032', c.id, '노을 슬립 캐미 원피스', 'NOEUL Slip Cami Dress', '노을 슬립 캐미 원피스', 'NOEUL Slip Cami Dress', 98000, null, 'women', true, true, true
  from app.categories c where c.slug='dresses'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 33, 'ne-w-dr-033-noeul-gathered-cotton-dress', 'NE-W-DR-033', c.id, '노을 개더 코튼 원피스', 'NOEUL Gathered Cotton Dress', '노을 개더 코튼 원피스', 'NOEUL Gathered Cotton Dress', 108000, 97000, 'women', true, false, false
  from app.categories c where c.slug='dresses'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 34, 'ne-w-sk-034-noeul-cargo-pocket-midi', 'NE-W-SK-034', c.id, '노을 카고 포켓 미디 스커트', 'NOEUL Cargo Pocket Midi', '노을 카고 포켓 미디 스커트', 'NOEUL Cargo Pocket Midi', 79000, null, 'women', true, true, false
  from app.categories c where c.slug='skirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 35, 'ne-w-sk-035-noeul-satin-bias-skirt', 'NE-W-SK-035', c.id, '노을 새틴 바이어스 스커트', 'NOEUL Satin Bias Skirt', '노을 새틴 바이어스 스커트', 'NOEUL Satin Bias Skirt', 82000, 73000, 'women', true, true, true
  from app.categories c where c.slug='skirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 36, 'ne-u-bg-036-noeul-padded-tote-shopper', 'NE-U-BG-036', c.id, '노을 패디드 토트 쇼퍼백', 'NOEUL Padded Tote Shopper', '노을 패디드 토트 쇼퍼백', 'NOEUL Padded Tote Shopper', 98000, null, 'unisex', true, true, true
  from app.categories c where c.slug='bags'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 37, 'ne-u-bg-037-noeul-leather-utility-waist-ba', 'NE-U-BG-037', c.id, '노을 레더 유틸리티 웨이스트백', 'NOEUL Leather Utility Waist Bag', '노을 레더 유틸리티 웨이스트백', 'NOEUL Leather Utility Waist Bag', 112000, 100000, 'unisex', true, false, false
  from app.categories c where c.slug='bags'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 38, 'ne-u-sk-038-noeul-performance-hiker-socks', 'NE-U-SK-038', c.id, '노을 퍼포먼스 하이커 삭스', 'NOEUL Performance Hiker Socks', '노을 퍼포먼스 하이커 삭스', 'NOEUL Performance Hiker Socks', 16000, null, 'unisex', true, true, false
  from app.categories c where c.slug='socks'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 39, 'ne-m-uw-039-noeul-air-cool-trunk-2-pack', 'NE-M-UW-039', c.id, '노을 에어쿨 트렁크 2팩', 'NOEUL Air-Cool Trunk 2-Pack', '노을 에어쿨 트렁크 2팩', 'NOEUL Air-Cool Trunk 2-Pack', 32000, null, 'men', true, true, true
  from app.categories c where c.slug='underwear'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 40, 'ne-w-uw-040-noeul-soft-fit-triangle-bra', 'NE-W-UW-040', c.id, '노을 소프트핏 트라이앵글 브라', 'NOEUL Soft-Fit Triangle Bra', '노을 소프트핏 트라이앵글 브라', 'NOEUL Soft-Fit Triangle Bra', 38000, null, 'women', true, false, true
  from app.categories c where c.slug='underwear'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 41, 'ne-u-ac-041-noeul-canvas-ball-cap', 'NE-U-AC-041', c.id, '노을 캔버스 볼캡', 'NOEUL Canvas Ball Cap', '노을 캔버스 볼캡', 'NOEUL Canvas Ball Cap', 38000, null, 'unisex', true, true, false
  from app.categories c where c.slug='accessories'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 42, 'ne-u-ac-042-noeul-acetate-slim-sunglasses', 'NE-U-AC-042', c.id, '노을 아세테이트 슬림 선글라스', 'NOEUL Acetate Slim Sunglasses', '노을 아세테이트 슬림 선글라스', 'NOEUL Acetate Slim Sunglasses', 62000, 55000, 'unisex', true, true, true
  from app.categories c where c.slug='accessories'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 43, 'ne-m-ts-043-noeul-pocket-heavy-tee', 'NE-M-TS-043', c.id, '노을 포켓 헤비 티셔츠', 'NOEUL Pocket Heavy Tee', '노을 포켓 헤비 티셔츠', 'NOEUL Pocket Heavy Tee', 42000, null, 'men', true, true, false
  from app.categories c where c.slug='tshirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 44, 'ne-w-jn-044-noeul-curved-wide-denim', 'NE-W-JN-044', c.id, '노을 커브드 와이드 데님', 'NOEUL Curved Wide Denim', '노을 커브드 와이드 데님', 'NOEUL Curved Wide Denim', 92000, null, 'women', true, true, true
  from app.categories c where c.slug='jeans'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 45, 'ne-u-bg-045-noeul-circle-crossbody-mini', 'NE-U-BG-045', c.id, '노을 서클 크로스바디 미니백', 'NOEUL Circle Crossbody Mini', '노을 서클 크로스바디 미니백', 'NOEUL Circle Crossbody Mini', 78000, null, 'unisex', true, true, false
  from app.categories c where c.slug='bags'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 46, 'ne-m-hd-046-noeul-waffle-knit-hoodie', 'NE-M-HD-046', c.id, '노을 와플 니트 후디', 'NOEUL Waffle Knit Hoodie', '노을 와플 니트 후디', 'NOEUL Waffle Knit Hoodie', 88000, 79000, 'men', true, false, true
  from app.categories c where c.slug='hoodies'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 47, 'ne-w-pt-047-noeul-paper-bag-waist-pants', 'NE-W-PT-047', c.id, '노을 페이퍼백 웨이스트 팬츠', 'NOEUL Paper Bag Waist Pants', '노을 페이퍼백 웨이스트 팬츠', 'NOEUL Paper Bag Waist Pants', 86000, null, 'women', true, true, false
  from app.categories c where c.slug='pants'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 48, 'ne-w-ac-048-noeul-knit-beanie', 'NE-W-AC-048', c.id, '노을 니트 비니', 'NOEUL Knit Beanie', '노을 니트 비니', 'NOEUL Knit Beanie', 28000, null, 'unisex', true, true, true
  from app.categories c where c.slug='accessories'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 49, 'ne-m-jk-049-noeul-field-chore-jacket', 'NE-M-JK-049', c.id, '노을 필드 초어 자켓', 'NOEUL Field Chore Jacket', '노을 필드 초어 자켓', 'NOEUL Field Chore Jacket', 138000, null, 'men', true, false, true
  from app.categories c where c.slug='jackets'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 50, 'ne-w-dr-050-noeul-puff-sleeve-mini-dress', 'NE-W-DR-050', c.id, '노을 퍼프 슬리브 미니 원피스', 'NOEUL Puff Sleeve Mini Dress', '노을 퍼프 슬리브 미니 원피스', 'NOEUL Puff Sleeve Mini Dress', 88000, 79000, 'women', true, true, false
  from app.categories c where c.slug='dresses'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 51, 'ne-u-sk-051-noeul-waffle-crew-socks-3-pack', 'NE-U-SK-051', c.id, '노을 와플 크루 삭스 3팩', 'NOEUL Waffle Crew Socks 3-Pack', '노을 와플 크루 삭스 3팩', 'NOEUL Waffle Crew Socks 3-Pack', 19000, null, 'unisex', true, true, false
  from app.categories c where c.slug='socks'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 52, 'ne-m-uw-052-noeul-essential-boxer-5-pack', 'NE-M-UW-052', c.id, '노을 에센셜 박서 5팩', 'NOEUL Essential Boxer 5-Pack', '노을 에센셜 박서 5팩', 'NOEUL Essential Boxer 5-Pack', 42000, 38000, 'men', true, false, true
  from app.categories c where c.slug='underwear'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 53, 'ne-w-ac-053-noeul-tiny-pearl-hoops', 'NE-W-AC-053', c.id, '노을 진주 후프 이어링', 'NOEUL Tiny Pearl Hoops', '노을 진주 후프 이어링', 'NOEUL Tiny Pearl Hoops', 25000, null, 'women', true, true, false
  from app.categories c where c.slug='accessories'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 54, 'ne-m-pt-054-noeul-cropped-balloon-trousers', 'NE-M-PT-054', c.id, '노을 크롭 벌룬 트라우저', 'NOEUL Cropped Balloon Trousers', '노을 크롭 벌룬 트라우저', 'NOEUL Cropped Balloon Trousers', 99000, null, 'men', true, true, true
  from app.categories c where c.slug='pants'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 55, 'ne-w-sk-055-noeul-denim-long-skirt', 'NE-W-SK-055', c.id, '노을 데님 롱 스커트', 'NOEUL Denim Long Skirt', '노을 데님 롱 스커트', 'NOEUL Denim Long Skirt', 76000, null, 'women', true, false, false
  from app.categories c where c.slug='skirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 56, 'ne-u-ac-056-noeul-woven-wide-belt', 'NE-U-AC-056', c.id, '노을 우븐 와이드 벨트', 'NOEUL Woven Wide Belt', '노을 우븐 와이드 벨트', 'NOEUL Woven Wide Belt', 32000, null, 'unisex', true, true, false
  from app.categories c where c.slug='accessories'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 57, 'ne-w-sh-057-noeul-stripe-cotton-shirt', 'NE-W-SH-057', c.id, '노을 스트라이프 코튼 셔츠', 'NOEUL Stripe Cotton Shirt', '노을 스트라이프 코튼 셔츠', 'NOEUL Stripe Cotton Shirt', 74000, null, 'women', true, true, false
  from app.categories c where c.slug='shirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 58, 'ne-m-sh-058-noeul-corduroy-overshirt', 'NE-M-SH-058', c.id, '노을 코듀로이 오버셔츠', 'NOEUL Corduroy Overshirt', '노을 코듀로이 오버셔츠', 'NOEUL Corduroy Overshirt', 78000, 70000, 'men', true, false, true
  from app.categories c where c.slug='shirts'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 59, 'ne-w-pt-059-noeul-corduroy-wide-pants', 'NE-W-PT-059', c.id, '노을 코듀로이 와이드 팬츠', 'NOEUL Corduroy Wide Pants', '노을 코듀로이 와이드 팬츠', 'NOEUL Corduroy Wide Pants', 88000, null, 'women', true, true, false
  from app.categories c where c.slug='pants'
  on conflict (id) do nothing;
insert into app.products (id, slug, sku, category_id, name_ko, name_en, description_ko, description_en, price, discount_price, gender, is_active, is_new, is_best)
  select 60, 'ne-u-ac-060-noeul-nylon-bucket-hat', 'NE-U-AC-060', c.id, '노을 나일론 버킷햇', 'NOEUL Nylon Bucket Hat', '노을 나일론 버킷햇', 'NOEUL Nylon Bucket Hat', 36000, null, 'unisex', true, true, true
  from app.categories c where c.slug='accessories'
  on conflict (id) do nothing;

-- Variants (stock split, active true, reserved 0)
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (20, 'NE-M-TS-020-WAS-S', 'Washed White', 'S', '#F2F0EB', 23, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (20, 'NE-M-TS-020-PIG-S', 'Pigment Black', 'S', '#212123', 23, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (20, 'NE-M-TS-020-WAS-M', 'Washed White', 'M', '#F2F0EB', 23, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (21, 'NE-W-TS-021-BUT-S', 'Butter', 'S', '#F6E8C8', 30, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (21, 'NE-W-TS-021-ASH-S', 'Ash Pink', 'S', '#E8CFCF', 30, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (21, 'NE-W-TS-021-BUT-M', 'Butter', 'M', '#F6E8C8', 30, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (22, 'NE-M-SH-022-VIN-M', 'Vintage White', 'M', '#FFFEF9', 18, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (22, 'NE-M-SH-022-LIG-M', 'Light Blue', 'M', '#C8D8E4', 18, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (22, 'NE-M-SH-022-VIN-L', 'Vintage White', 'L', '#FFFEF9', 18, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (23, 'NE-W-SH-023-PAL-S', 'Pale Sage', 'S', '#D4D9C7', 16, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (23, 'NE-W-SH-023-STO-S', 'Stone', 'S', '#C9C5BA', 16, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (23, 'NE-W-SH-023-PAL-M', 'Pale Sage', 'M', '#D4D9C7', 16, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (24, 'NE-M-JN-024-MID-30', 'Mid Blue', '30', '#6B7B8F', 14, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (24, 'NE-M-JN-024-ONE-30', 'One Wash', '30', '#2F3D4A', 14, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (24, 'NE-M-JN-024-MID-32', 'Mid Blue', '32', '#6B7B8F', 14, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (25, 'NE-W-JN-025-LIG-25', 'Light Wash', '25', '#A9B8C8', 20, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (25, 'NE-W-JN-025-GRA-25', 'Graphite', '25', '#3A3A44', 20, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (25, 'NE-W-JN-025-LIG-26', 'Light Wash', '26', '#A9B8C8', 20, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (26, 'NE-M-PT-026-KHA-S', 'Khaki', 'S', '#8A7F6B', 17, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (26, 'NE-M-PT-026-SLA-S', 'Slate Black', 'S', '#1A1C1E', 17, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (26, 'NE-M-PT-026-KHA-M', 'Khaki', 'M', '#8A7F6B', 17, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (27, 'NE-W-PT-027-OAT-S', 'Oatmeal', 'S', '#E9E2D6', 12, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (27, 'NE-W-PT-027-COA-S', 'Coal', 'S', '#2B2B2D', 12, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (27, 'NE-W-PT-027-OAT-M', 'Oatmeal', 'M', '#E9E2D6', 12, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (28, 'NE-M-JK-028-OLI-M', 'Olive', 'M', '#5B6342', 10, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (28, 'NE-M-JK-028-BLA-M', 'Black', 'M', '#111112', 10, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (28, 'NE-M-JK-028-OLI-L', 'Olive', 'L', '#5B6342', 10, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (29, 'NE-W-JK-029-CAM-S', 'Camel', 'S', '#C9A86A', 8, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (29, 'NE-W-JK-029-CHA-S', 'Charcoal', 'S', '#373739', 8, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (29, 'NE-W-JK-029-CAM-M', 'Camel', 'M', '#C9A86A', 8, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (30, 'NE-M-HD-030-FAD-M', 'Faded Navy', 'M', '#4B5462', 19, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (30, 'NE-M-HD-030-BRI-M', 'Brick', 'M', '#8B3A2A', 19, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (30, 'NE-M-HD-030-FAD-L', 'Faded Navy', 'L', '#4B5462', 19, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (31, 'NE-W-HD-031-HEA-S', 'Heather Pink', 'S', '#E8CFC8', 20, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (31, 'NE-W-HD-031-WAS-S', 'Washed Grey', 'S', '#9E9EA0', 20, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (31, 'NE-W-HD-031-HEA-M', 'Heather Pink', 'M', '#E8CFC8', 20, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (32, 'NE-W-DR-032-MID-S', 'Midnight', 'S', '#1A1C24', 10, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (32, 'NE-W-DR-032-CHA-S', 'Champagne', 'S', '#E9DCC9', 10, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (32, 'NE-W-DR-032-MID-M', 'Midnight', 'M', '#1A1C24', 10, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (33, 'NE-W-DR-033-WHI-FRE', 'White', 'FREE', '#FFFEFB', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (33, 'NE-W-DR-033-SKY-FRE', 'Sky', 'FREE', '#B2CDD7', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (34, 'NE-W-SK-034-KHA-S', 'Khaki Beige', 'S', '#C2B8A3', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (34, 'NE-W-SK-034-BLA-S', 'Black', 'S', '#111112', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (34, 'NE-W-SK-034-KHA-M', 'Khaki Beige', 'M', '#C2B8A3', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (35, 'NE-W-SK-035-OLI-S', 'Olive Satin', 'S', '#7A7F6B', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (35, 'NE-W-SK-035-BLA-S', 'Black Satin', 'S', '#1A1A1E', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (35, 'NE-W-SK-035-OLI-M', 'Olive Satin', 'M', '#7A7F6B', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (36, 'NE-U-BG-036-CRE-ONE', 'Cream Puff', 'ONE SIZE', '#F5F0E6', 14, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (36, 'NE-U-BG-036-BLA-ONE', 'Black Quilt', 'ONE SIZE', '#111112', 14, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (37, 'NE-U-BG-037-TAN-ONE', 'Tan', 'ONE SIZE', '#B08D67', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (37, 'NE-U-BG-037-ESP-ONE', 'Espresso', 'ONE SIZE', '#3E2723', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (38, 'NE-U-SK-038-FOR-FRE', 'Forest Mix', 'FREE', '#5A6B5A', 90, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (38, 'NE-U-SK-038-WHI-FRE', 'White Pack', 'FREE', '#FFFFFF', 90, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (39, 'NE-M-UW-039-WHI-M', 'White/Grey', 'M', '#E5E5EA', 28, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (39, 'NE-M-UW-039-BLA-M', 'Black Set', 'M', '#111112', 28, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (39, 'NE-M-UW-039-WHI-L', 'White/Grey', 'L', '#E5E5EA', 28, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (40, 'NE-W-UW-040-POW-S', 'Powder Pink', 'S', '#E2C2C6', 23, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (40, 'NE-W-UW-040-BLA-S', 'Black', 'S', '#111112', 23, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (40, 'NE-W-UW-040-POW-M', 'Powder Pink', 'M', '#E2C2C6', 23, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (41, 'NE-U-AC-041-WAS-ONE', 'Washed Navy', 'ONE SIZE', '#3B4F69', 40, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (41, 'NE-U-AC-041-BEI-ONE', 'Beige', 'ONE SIZE', '#D7C7B2', 40, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (42, 'NE-U-AC-042-TOR-ONE', 'Tortoise', 'ONE SIZE', '#6B4F3A', 22, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (42, 'NE-U-AC-042-CLE-ONE', 'Clear Black', 'ONE SIZE', '#2B2B33', 22, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (43, 'NE-M-TS-043-OLI-M', 'Olive Drab', 'M', '#5A624E', 29, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (43, 'NE-M-TS-043-NAT-M', 'Natural', 'M', '#E9E2D6', 29, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (43, 'NE-M-TS-043-OLI-L', 'Olive Drab', 'L', '#5A624E', 29, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (44, 'NE-W-JN-044-SUN-25', 'Sunbleached', '25', '#C9C9C3', 17, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (44, 'NE-W-JN-044-RIN-25', 'Rinsed', '25', '#4A5568', 17, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (44, 'NE-W-JN-044-SUN-27', 'Sunbleached', '27', '#C9C9C3', 17, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (45, 'NE-U-BG-045-MIL-ONE', 'Milk', 'ONE SIZE', '#FFFEFB', 15, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (45, 'NE-U-BG-045-CHA-ONE', 'Chalk Black', 'ONE SIZE', '#1A1A1E', 15, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (46, 'NE-M-HD-046-OAT-M', 'Oatmeal Waffle', 'M', '#E7DCC8', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (46, 'NE-M-HD-046-MOS-M', 'Moss Waffle', 'M', '#4A5A4A', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (46, 'NE-M-HD-046-OAT-L', 'Oatmeal Waffle', 'L', '#E7DCC8', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (47, 'NE-W-PT-047-SAN-S', 'Sand', 'S', '#D7C7B2', 12, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (47, 'NE-W-PT-047-CHA-S', 'Charcoal', 'S', '#373739', 12, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (47, 'NE-W-PT-047-SAN-M', 'Sand', 'M', '#D7C7B2', 12, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (48, 'NE-W-AC-048-HEA-ONE', 'Heather Charcoal', 'ONE SIZE', '#6B6E72', 47, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (48, 'NE-W-AC-048-CAM-ONE', 'Camel Beanie', 'ONE SIZE', '#C9A86A', 47, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (49, 'NE-M-JK-049-BRO-M', 'Brown Olive', 'M', '#6B5A3F', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (49, 'NE-M-JK-049-FAD-M', 'Faded Black', 'M', '#232324', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (49, 'NE-M-JK-049-BRO-L', 'Brown Olive', 'L', '#6B5A3F', 11, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (50, 'NE-W-DR-050-PAL-S', 'Pale Yellow', 'S', '#F6E8C8', 10, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (50, 'NE-W-DR-050-WHI-S', 'White Mini', 'S', '#FFFEFB', 10, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (50, 'NE-W-DR-050-PAL-M', 'Pale Yellow', 'M', '#F6E8C8', 10, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (51, 'NE-U-SK-051-OAT-FRE', 'Oatmeal/Charcoal', 'FREE', '#C9C5B8', 75, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (51, 'NE-U-SK-051-WHI-FRE', 'White Set', 'FREE', '#FFFFFF', 75, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (52, 'NE-M-UW-052-ASS-L', 'Assorted', 'L', '#9E9EA0', 36, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (52, 'NE-M-UW-052-SOL-L', 'Solid', 'L', '#111112', 36, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (52, 'NE-M-UW-052-ASS-XL', 'Assorted', 'XL', '#9E9EA0', 36, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (53, 'NE-W-AC-053-PEA-ONE', 'Pearl', 'ONE SIZE', '#F5F0E6', 35, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (53, 'NE-W-AC-053-GOL-ONE', 'Gold Pearl', 'ONE SIZE', '#D4AF37', 35, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (54, 'NE-M-PT-054-ASH-M', 'Ash Grey', 'M', '#A8A9AA', 14, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (54, 'NE-M-PT-054-DEE-M', 'Deep Navy', 'M', '#1C2430', 14, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (54, 'NE-M-PT-054-ASH-L', 'Ash Grey', 'L', '#A8A9AA', 14, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (55, 'NE-W-SK-055-DEN-S', 'Denim Blue', 'S', '#5E799B', 12, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (55, 'NE-W-SK-055-RAW-S', 'Raw Indigo Skirt', 'S', '#26374D', 12, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (55, 'NE-W-SK-055-DEN-M', 'Denim Blue', 'M', '#5E799B', 12, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (56, 'NE-U-AC-056-NAT-ONE', 'Natural Woven', 'ONE SIZE', '#D7C7B2', 32, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (56, 'NE-U-AC-056-BLA-ONE', 'Black Woven', 'ONE SIZE', '#111112', 32, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (57, 'NE-W-SH-057-BLU-S', 'Blue Stripe', 'S', '#8FB0C6', 15, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (57, 'NE-W-SH-057-NAV-S', 'Navy Stripe', 'S', '#1C2430', 15, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (57, 'NE-W-SH-057-BLU-M', 'Blue Stripe', 'M', '#8FB0C6', 15, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (58, 'NE-M-SH-058-MUS-M', 'Mustard', 'M', '#C9A86A', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (58, 'NE-M-SH-058-OLI-M', 'Olive Cord', 'M', '#5A624E', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (58, 'NE-M-SH-058-MUS-L', 'Mustard', 'L', '#C9A86A', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (59, 'NE-W-PT-059-RUS-S', 'Rust', 'S', '#8B3A2A', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (59, 'NE-W-PT-059-DAR-S', 'Dark Brown', 'S', '#4A3B32', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (59, 'NE-W-PT-059-RUS-M', 'Rust', 'M', '#8B3A2A', 13, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (60, 'NE-U-AC-060-SAG-ONE', 'Sage', 'ONE SIZE', '#A8BBA2', 27, 0) on conflict (sku) do nothing;
insert into app.product_variants (product_id, sku, color, size, swatch, stock, reserved) values (60, 'NE-U-AC-060-BLA-ONE', 'Black Hat', 'ONE SIZE', '#111112', 27, 0) on conflict (sku) do nothing;

-- Media (local reuse, published true, sort_order 0-2)
insert into app.product_media (product_id, url, color, sort_order, published) values (20, '/products/men/tshirts/classic-tshirt/1.jpg', 'Washed White', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (20, '/products/men/tshirts/classic-tshirt/2.jpg', 'Pigment Black', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (20, '/products/men/tshirts/classic-tshirt/3.jpg', 'Washed White', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (21, '/products/men/tshirts/classic-tshirt/2.jpg', 'Butter', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (21, '/products/men/tshirts/classic-tshirt/3.jpg', 'Ash Pink', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (21, '/products/men/tshirts/classic-tshirt/4.jpg', 'Butter', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (22, '/products/men/tshirts/classic-tshirt/3.jpg', 'Vintage White', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (22, '/products/men/tshirts/classic-tshirt/4.jpg', 'Light Blue', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (22, '/products/men/tshirts/classic-tshirt/5.jpg', 'Vintage White', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (23, '/products/men/tshirts/classic-tshirt/4.jpg', 'Pale Sage', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (23, '/products/men/tshirts/classic-tshirt/5.jpg', 'Stone', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (23, '/products/women/tshirts/oversized-tshirt/1.jpg', 'Pale Sage', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (24, '/products/men/tshirts/classic-tshirt/5.jpg', 'Mid Blue', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (24, '/products/women/tshirts/oversized-tshirt/1.jpg', 'One Wash', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (24, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Mid Blue', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (25, '/products/women/tshirts/oversized-tshirt/1.jpg', 'Light Wash', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (25, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Graphite', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (25, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Light Wash', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (26, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Khaki', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (26, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Slate Black', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (26, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Khaki', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (27, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Oatmeal', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (27, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Coal', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (27, '/products/women/tshirts/oversized-tshirt/5.jpg', 'Oatmeal', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (28, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Olive', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (28, '/products/women/tshirts/oversized-tshirt/5.jpg', 'Black', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (28, '/products/men/tshirts/classic-tshirt/1.jpg', 'Olive', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (29, '/products/women/tshirts/oversized-tshirt/5.jpg', 'Camel', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (29, '/products/men/tshirts/classic-tshirt/1.jpg', 'Charcoal', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (29, '/products/men/tshirts/classic-tshirt/2.jpg', 'Camel', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (30, '/products/men/tshirts/classic-tshirt/1.jpg', 'Faded Navy', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (30, '/products/men/tshirts/classic-tshirt/2.jpg', 'Brick', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (30, '/products/men/tshirts/classic-tshirt/3.jpg', 'Faded Navy', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (31, '/products/men/tshirts/classic-tshirt/2.jpg', 'Heather Pink', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (31, '/products/men/tshirts/classic-tshirt/3.jpg', 'Washed Grey', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (31, '/products/men/tshirts/classic-tshirt/4.jpg', 'Heather Pink', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (32, '/products/men/tshirts/classic-tshirt/3.jpg', 'Midnight', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (32, '/products/men/tshirts/classic-tshirt/4.jpg', 'Champagne', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (32, '/products/men/tshirts/classic-tshirt/5.jpg', 'Midnight', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (33, '/products/men/tshirts/classic-tshirt/4.jpg', 'White', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (33, '/products/men/tshirts/classic-tshirt/5.jpg', 'Sky', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (34, '/products/men/tshirts/classic-tshirt/5.jpg', 'Khaki Beige', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (34, '/products/women/tshirts/oversized-tshirt/1.jpg', 'Black', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (34, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Khaki Beige', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (35, '/products/women/tshirts/oversized-tshirt/1.jpg', 'Olive Satin', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (35, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Black Satin', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (35, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Olive Satin', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (36, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Cream Puff', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (36, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Black Quilt', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (37, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Tan', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (37, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Espresso', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (38, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Forest Mix', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (38, '/products/women/tshirts/oversized-tshirt/5.jpg', 'White Pack', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (39, '/products/women/tshirts/oversized-tshirt/5.jpg', 'White/Grey', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (39, '/products/men/tshirts/classic-tshirt/1.jpg', 'Black Set', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (39, '/products/men/tshirts/classic-tshirt/2.jpg', 'White/Grey', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (40, '/products/men/tshirts/classic-tshirt/1.jpg', 'Powder Pink', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (40, '/products/men/tshirts/classic-tshirt/2.jpg', 'Black', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (40, '/products/men/tshirts/classic-tshirt/3.jpg', 'Powder Pink', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (41, '/products/men/tshirts/classic-tshirt/2.jpg', 'Washed Navy', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (41, '/products/men/tshirts/classic-tshirt/3.jpg', 'Beige', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (42, '/products/men/tshirts/classic-tshirt/3.jpg', 'Tortoise', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (42, '/products/men/tshirts/classic-tshirt/4.jpg', 'Clear Black', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (43, '/products/men/tshirts/classic-tshirt/4.jpg', 'Olive Drab', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (43, '/products/men/tshirts/classic-tshirt/5.jpg', 'Natural', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (43, '/products/women/tshirts/oversized-tshirt/1.jpg', 'Olive Drab', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (44, '/products/men/tshirts/classic-tshirt/5.jpg', 'Sunbleached', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (44, '/products/women/tshirts/oversized-tshirt/1.jpg', 'Rinsed', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (44, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Sunbleached', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (45, '/products/women/tshirts/oversized-tshirt/1.jpg', 'Milk', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (45, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Chalk Black', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (46, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Oatmeal Waffle', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (46, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Moss Waffle', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (46, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Oatmeal Waffle', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (47, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Sand', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (47, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Charcoal', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (47, '/products/women/tshirts/oversized-tshirt/5.jpg', 'Sand', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (48, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Heather Charcoal', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (48, '/products/women/tshirts/oversized-tshirt/5.jpg', 'Camel Beanie', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (49, '/products/women/tshirts/oversized-tshirt/5.jpg', 'Brown Olive', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (49, '/products/men/tshirts/classic-tshirt/1.jpg', 'Faded Black', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (49, '/products/men/tshirts/classic-tshirt/2.jpg', 'Brown Olive', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (50, '/products/men/tshirts/classic-tshirt/1.jpg', 'Pale Yellow', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (50, '/products/men/tshirts/classic-tshirt/2.jpg', 'White Mini', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (50, '/products/men/tshirts/classic-tshirt/3.jpg', 'Pale Yellow', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (51, '/products/men/tshirts/classic-tshirt/2.jpg', 'Oatmeal/Charcoal', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (51, '/products/men/tshirts/classic-tshirt/3.jpg', 'White Set', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (52, '/products/men/tshirts/classic-tshirt/3.jpg', 'Assorted', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (52, '/products/men/tshirts/classic-tshirt/4.jpg', 'Solid', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (52, '/products/men/tshirts/classic-tshirt/5.jpg', 'Assorted', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (53, '/products/men/tshirts/classic-tshirt/4.jpg', 'Pearl', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (53, '/products/men/tshirts/classic-tshirt/5.jpg', 'Gold Pearl', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (54, '/products/men/tshirts/classic-tshirt/5.jpg', 'Ash Grey', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (54, '/products/women/tshirts/oversized-tshirt/1.jpg', 'Deep Navy', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (54, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Ash Grey', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (55, '/products/women/tshirts/oversized-tshirt/1.jpg', 'Denim Blue', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (55, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Raw Indigo Skirt', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (55, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Denim Blue', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (56, '/products/women/tshirts/oversized-tshirt/2.jpg', 'Natural Woven', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (56, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Black Woven', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (57, '/products/women/tshirts/oversized-tshirt/3.jpg', 'Blue Stripe', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (57, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Navy Stripe', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (57, '/products/women/tshirts/oversized-tshirt/5.jpg', 'Blue Stripe', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (58, '/products/women/tshirts/oversized-tshirt/4.jpg', 'Mustard', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (58, '/products/women/tshirts/oversized-tshirt/5.jpg', 'Olive Cord', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (58, '/products/men/tshirts/classic-tshirt/1.jpg', 'Mustard', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (59, '/products/women/tshirts/oversized-tshirt/5.jpg', 'Rust', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (59, '/products/men/tshirts/classic-tshirt/1.jpg', 'Dark Brown', 1, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (59, '/products/men/tshirts/classic-tshirt/2.jpg', 'Rust', 2, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (60, '/products/men/tshirts/classic-tshirt/1.jpg', 'Sage', 0, true) on conflict do nothing;
insert into app.product_media (product_id, url, color, sort_order, published) values (60, '/products/men/tshirts/classic-tshirt/2.jpg', 'Black Hat', 1, true) on conflict do nothing;

-- no new storage objects — local public/products immutable cache covers free tier
