-- Add length_type (Long/Short) as a variant dimension (e.g. long pants vs shorts).
alter table app.product_variants
  add column if not exists length_type text
  check (length_type is null or length_type in ('Long', 'Short'));

-- Replace the (product_id, color, size) uniqueness with one that also
-- includes length_type, so a product can be offered in both Long and Short.
alter table app.product_variants
  drop constraint if exists product_variants_product_id_color_size_key;
alter table app.product_variants
  add constraint product_variants_product_id_color_size_length_key
  unique (product_id, color, size, length_type);