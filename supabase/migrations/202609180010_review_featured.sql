-- Wave 3: featured flag for review curation (AdminReviewsPage feature toggle).
-- Sole schema authority; run with migration credentials, never the API role.
alter table app.reviews add column if not exists is_featured boolean not null default false;
