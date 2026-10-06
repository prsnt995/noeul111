-- Rich content blocks for the product detail band (below the PDP tabs).
-- Array of { type: heading|text|image|image_grid, ... } — sanitized in
-- api/admin.js (sanitizeDetailBlocks) and rendered by DetailContentBand.
-- Additive + default '[]' so existing products simply show no band.
alter table app.products add column if not exists detail_blocks jsonb not null default '[]';
