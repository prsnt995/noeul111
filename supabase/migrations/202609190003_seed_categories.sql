-- Wave 5: Seed product categories for the left-side navigation panel.
-- Categories match the catalog structure used throughout the site.
-- Each category has a unique slug, Korean/English names, and sort_order.
insert into app.categories (slug, name_ko, name_en, is_active, sort_order) values
  ('tshirts',    '티셔츠',    'T-Shirts',         true, 1),
  ('shirts',     '셔츠',      'Shirts',           true, 2),
  ('hoodies',    '후디',      'Hoodies',          true, 3),
  ('jackets',    '재킷',      'Jackets',          true, 4),
  ('jeans',      '청바지',    'Jeans',            true, 5),
  ('pants',      '바지',      'Pants',            true, 6),
  ('dresses',    '드레스',    'Dresses',          true, 7),
  ('skirts',     '스커트',    'Skirts',           true, 8),
  ('underwear',  '언더웨어',  'Underwear',        true, 9),
  ('socks',      '양말',      'Socks',            true, 10),
  ('accessories', '악세서리', 'Accessories',       true, 11),
  ('bags',       '가방',      'Bags',             true, 12)
on conflict (slug) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, is_active = true, sort_order = excluded.sort_order;
