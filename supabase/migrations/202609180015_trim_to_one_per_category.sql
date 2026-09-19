-- 015: Trim catalog to 1 product per category, 1 image per product
-- Keepers (12, one per category): 20 tshirts, 22 shirts, 24 jeans, 26 pants,
-- 32 dresses, 34 skirts, 28 jackets, 30 hoodies, 36 bags, 38 socks,
-- 39 underwear, 42 accessories.
-- Order history is preserved: variants referenced by order_items (and their
-- products) are never deleted. Idempotent, free-tier safe (deletes only).
-- Frontend mirror: src/data/products.js PRODUCTS now holds the same 12.

-- 1) Remove customer collections pointing at retired products
delete from app.wishlists where product_id not in (20,22,24,26,32,34,28,30,36,38,39,42);
delete from app.reviews where product_id not in (20,22,24,26,32,34,28,30,36,38,39,42);
delete from app.recently_viewed where product_id not in (20,22,24,26,32,34,28,30,36,38,39,42);

-- 2) Remove media of retired products
delete from app.product_media where product_id not in (20,22,24,26,32,34,28,30,36,38,39,42);

-- 3) Remove variants of retired products unless referenced by order history
delete from app.product_variants
where product_id not in (20,22,24,26,32,34,28,30,36,38,39,42)
  and id not in (select distinct variant_id from app.order_items);

-- 4) Remove retired products unless they still hold ordered variants
delete from app.products
where id not in (20,22,24,26,32,34,28,30,36,38,39,42)
  and not exists (select 1 from app.product_variants where product_id = app.products.id);

-- 5) Trim kept products to a single image (lowest sort_order wins)
delete from app.product_media
where product_id in (20,22,24,26,32,34,28,30,36,38,39,42)
  and id not in (
    select distinct on (product_id) id
    from app.product_media
    where product_id in (20,22,24,26,32,34,28,30,36,38,39,42)
    order by product_id, sort_order, id
  );
