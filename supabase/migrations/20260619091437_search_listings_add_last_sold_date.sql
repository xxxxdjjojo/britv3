-- Add HM Land Registry last_sold_date to the search_listings materialized view
-- to support the "sold within last N months" filter on /search.
--
-- The matview's original definition lives in 003001_property_portal.sql.
-- PostgreSQL does not support ALTER MATERIALIZED VIEW ... ADD COLUMN, so the
-- only path is drop + recreate. We do NOT use CASCADE: every reference to
-- search_listings inside other migrations is from inside plpgsql function
-- bodies (search_listings_by_radius, search_listings_by_polygon, the price-
-- drop digest in 20260319_backend_blueprint.sql), which are resolved at call
-- time rather than at function-definition time. The refresh wrapper and the
-- pg_cron schedule survive the drop intact.

drop materialized view if exists public.search_listings;

create materialized view public.search_listings as
select
  l.id as listing_id,
  p.id as property_id,
  l.listing_type,
  l.status,
  l.price,
  p.property_type,
  p.bedrooms,
  p.bathrooms,
  p.city,
  p.postcode,
  p.coordinates,
  p.description_tsv,
  p.features,
  p.epc_rating,
  p.new_build,
  l.listed_date,
  l.slug,
  pm.thumbnail_url,
  p.title,
  p.address_line1,
  l.rent_frequency,
  l.price_qualifier,
  p.reception_rooms,
  p.square_footage,
  l.view_count,
  l.favorite_count,
  l.enquiry_count,
  pls.last_sold_date
from listings l
join properties p on p.id = l.property_id
left join property_media pm
  on pm.listing_id = l.id
 and pm.sort_order = 0
 and pm.media_type = 'image'
left join public.property_last_sold pls on pls.property_id = p.id
where l.status = 'active'
  and l.deleted_at is null
  and p.deleted_at is null;

-- Recreate the original indexes (preserving names so other migrations
-- referencing them by name still resolve).
create unique index idx_search_listings_listing_id
  on public.search_listings (listing_id);
create index idx_search_listings_type_price
  on public.search_listings (listing_type, price);
create index idx_search_listings_coordinates
  on public.search_listings using gist (coordinates);
create index idx_search_listings_tsv
  on public.search_listings using gin (description_tsv);

-- New index for the sold-within filter. nulls last keeps un-enriched rows
-- (no LR data cached yet) out of the cheap range scan.
create index idx_search_listings_last_sold_date
  on public.search_listings (last_sold_date desc nulls last);

-- Repopulate. Subsequent refreshes go through refresh_search_listings()
-- on the existing pg_cron schedule (*/5 minutes); that wrapper is untouched.
refresh materialized view public.search_listings;
