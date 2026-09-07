-- =============================================================================
-- Adds optional geolocation to challenges.
-- Safe to re-run: only adds columns if they are missing, never touches
-- existing rows (they simply keep latitude/longitude = null).
-- =============================================================================

alter table public.challenges add column if not exists latitude double precision;
alter table public.challenges add column if not exists longitude double precision;
alter table public.challenges add column if not exists location_accuracy_m double precision;
