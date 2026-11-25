-- Add an optional company/brand name to products so admin can tag a product
-- (e.g. "Razon") and see it next to the product in admin lists.
alter table app.products add column if not exists company_name text;
