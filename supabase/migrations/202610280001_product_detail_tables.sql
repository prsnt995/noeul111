-- Normalized storage for product detail page blocks/images.
-- Keeps products.detail_blocks JSONB as a compatibility mirror; the tables
-- below are the canonical store going forward.
create table if not exists app.product_detail_blocks (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references app.products on delete cascade,
  type text not null,
  sort_order integer not null default 0,
  text_ko text not null default '',
  text_en text not null default '',
  author text not null default '',
  url text,
  alt text not null default '',
  caption_ko text not null default '',
  caption_en text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_detail_blocks_product_idx
  on app.product_detail_blocks (product_id, sort_order);

create table if not exists app.product_detail_images (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references app.product_detail_blocks on delete cascade,
  url text not null,
  alt text not null default '',
  caption_ko text not null default '',
  caption_en text not null default '',
  sort_order integer not null default 0
);
create index if not exists product_detail_images_block_idx
  on app.product_detail_images (block_id, sort_order);

-- Backfill from the legacy JSONB column.
insert into app.product_detail_blocks
  (product_id, type, sort_order, text_ko, text_en, author, url, alt, caption_ko, caption_en)
select p.id,
  b->>'type',
  (ord - 1)::int,
  coalesce(b->'text'->>'ko', ''),
  coalesce(b->'text'->>'en', ''),
  coalesce(b->>'author', ''),
  nullif(b->>'url', ''),
  coalesce(b->>'alt', ''),
  coalesce(b->'caption'->>'ko', ''),
  coalesce(b->'caption'->>'en', '')
from app.products p
cross join lateral jsonb_array_elements(p.detail_blocks) with ordinality as t(b, ord)
where jsonb_typeof(p.detail_blocks) = 'array'
on conflict do nothing;

insert into app.product_detail_images (block_id, url, alt, caption_ko, caption_en, sort_order)
select blk.id, img->>'url', coalesce(img->>'alt', ''),
  coalesce(img->'caption'->>'ko', ''), coalesce(img->'caption'->>'en', ''),
  (iord - 1)::int
from app.products p
cross join lateral jsonb_array_elements(p.detail_blocks) with ordinality as t(b, ord)
join app.product_detail_blocks blk
  on blk.product_id = p.id and blk.sort_order = (ord - 1)::int and blk.type = 'image_grid'
cross join lateral jsonb_array_elements(b->'images') with ordinality as im(img, iord)
where jsonb_typeof(p.detail_blocks) = 'array' and b->>'type' = 'image_grid'
on conflict do nothing;

grant select, insert, update, delete on app.product_detail_blocks to noeul_api;
grant select, insert, update, delete on app.product_detail_images to noeul_api;
grant usage, select on all sequences in schema app to noeul_api;
alter table app.product_detail_blocks enable row level security;
alter table app.product_detail_images enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='app' and tablename='product_detail_blocks' and policyname='backend_access') then
    create policy backend_access on app.product_detail_blocks to noeul_api using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='app' and tablename='product_detail_images' and policyname='backend_access') then
    create policy backend_access on app.product_detail_images to noeul_api using (true) with check (true);
  end if;
end $$;