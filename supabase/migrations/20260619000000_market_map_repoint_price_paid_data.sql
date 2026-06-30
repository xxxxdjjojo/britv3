-- ============================================================================
-- market-map: repoint ppd_with_geography onto the real HM Land Registry data.
--
-- The original view (20260616000003_market_map_aggregation.sql) read from
-- public.ppd_transactions — a Truedeed-era table that, in this environment,
-- holds only the ~100-row "ZZ" seed fixture. The full HM Land Registry Price
-- Paid Data (~31M rows) is already loaded in public.price_paid_data and is
-- what the live MVP map uses. This migration rewrites the view to read
-- price_paid_data so the multi-scale map serves real national data.
--
-- Column mapping (price_paid_data → ppd_with_geography contract):
--   price (pounds, bigint)        → price_pence  (× 100)
--   date_of_transfer (timestamp)  → transfer_date (::date)
--   property_type (char D/S/T/F/O)→ property_type (unchanged; matches the
--                                    market_map_aggregate CASE exactly)
--   old_new (char 'Y'/'N')        → new_build (= 'Y')
--   record_status (char)          → delete filter (<> 'D')
--   ppd_category (char 'A'/'B')   → keep only 'A' (standard residential price;
--                                    excludes 'B' additional-price entries such
--                                    as repossessions / bulk transfers — same
--                                    rule the live MVP applies to median price)
--
-- The geography join is unchanged: normalised full postcode → postcode_geography
-- (pkey on postcode_normalised). The functional index that makes this join fast
-- on 31M rows is created separately, CONCURRENTLY, in scripts (it cannot run
-- inside a migration transaction).
--
-- Reversible: re-run 20260616000003 to point the view back at ppd_transactions.
-- ============================================================================

do $$
begin
  if to_regclass('public.price_paid_data') is null then
    raise notice 'price_paid_data is absent; leaving existing ppd_with_geography view on local fixture data.';
    return;
  end if;

  execute $view$
    create or replace view public.ppd_with_geography as
    select
      (t.price * 100)::bigint                  as price_pence,
      t.date_of_transfer::date                 as transfer_date,
      -- price_paid_data.property_type is char(1) (D/S/T/F/O); cast to text to keep
      -- the view column type stable for CREATE OR REPLACE and the aggregate CASE.
      t.property_type::text                    as property_type,
      (t.old_new = 'Y')                        as new_build,
      t.street,
      t.town,
      -- normalised street key for street-level grouping
      lower(trim(coalesce(t.street, ''))) || '|' || lower(trim(coalesce(t.town, ''))) as street_key,
      g.lad_cd,
      g.lad_name,
      g.postcode_district,
      g.msoa_cd,
      g.lsoa_cd,
      g.postcode_sector,
      g.latitude,
      g.longitude
    from public.price_paid_data t
    join public.postcode_geography g
      on upper(replace(t.postcode, ' ', '')) = g.postcode_normalised
    where
      t.postcode is not null
      and trim(t.postcode) <> ''
      and t.price > 0
      and coalesce(t.record_status, 'A') <> 'D'
      and t.ppd_category = 'A'
  $view$;

  execute $comment$
    comment on view public.ppd_with_geography is
      'HMLR Price Paid Data (public.price_paid_data, ~31M rows) joined to ONS '
      'postcode geography. Standard residential only (ppd_category = A). Excludes '
      'null/empty postcodes, zero/negative prices, and deleted records '
      '(record_status = D). Failed geo-joins excluded by the inner join. Prices in pence.'
  $comment$;
end $$;
