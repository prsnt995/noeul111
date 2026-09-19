-- Wave 5: Remove all categories to allow manual seeding.
-- product_variants (which references categories) was already truncated.
truncate table app.categories cascade;
