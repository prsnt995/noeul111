-- Wave 5: Remove all products to allow manual seeding.
-- Truncate child tables first (FK references to app.products), then products.
-- This is safe: all data is seed-generated and can be re-seeded.

-- 1. Cart items reference products
truncate table app.cart_items cascade;

-- 2. Wishlists reference products
truncate table app.wishlists cascade;

-- 3. Recently viewed reference products
truncate table app.recently_viewed cascade;

-- 4. Reviews reference products
truncate table app.reviews cascade;

-- 5. Product variants reference products
truncate table app.product_variants cascade;

-- 6. Product media references products
truncate table app.product_media cascade;

-- 7. Inventory ledger references products
truncate table app.inventory_ledger cascade;

-- 8. Finally truncate products themselves
truncate table app.products cascade;
