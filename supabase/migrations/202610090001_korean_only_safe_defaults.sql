-- Safe migration for Korean-only website:
-- Ensures name_en has default '' and is nullable, so English fields are never strictly required by the database.
-- Does NOT drop any columns and does NOT delete any existing data.

alter table app.products alter column name_en drop not null;
alter table app.products alter column name_en set default '';

alter table app.categories alter column name_en drop not null;
alter table app.categories alter column name_en set default '';
