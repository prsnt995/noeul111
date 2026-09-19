-- 013: Category Management enhancement — image, description, gender for cloth store
alter table app.categories add column if not exists image_url text default '';
alter table app.categories add column if not exists description_ko text default '';
alter table app.categories add column if not exists description_en text default '';
alter table app.categories add column if not exists gender text default 'unisex' check (gender in ('unisex','men','women'));
-- Backfill existing 15 categories with sensible gender (tshirts/shirts/jeans/pants/jackets/hoodies -> unisex already, dresses/skirts -> women, others unisex)
update app.categories set gender='women' where slug in ('dresses','skirts') and gender='unisex';
-- Ensure image_url for demo categories uses local placeholder if empty
update app.categories set image_url='/products/men/tshirts/classic-tshirt/1.jpg' where (image_url is null or image_url='') and slug in ('tshirts','shirts','jeans','pants','jackets','hoodies','bags','socks','underwear','accessories');
update app.categories set image_url='/products/women/tshirts/oversized-tshirt/1.jpg' where (image_url is null or image_url='') and slug in ('dresses','skirts');
