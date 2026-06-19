-- Backfill property_last_sold from any cached land_registry insights.
--
-- Assumed shape of property_insights.data for insight_type='land_registry':
--   { "transactions": [ { "date": "YYYY-MM-DD", ... }, ... ] }
-- matching the LandRegistryComparable[] type at
--   src/services/properties/land-registry-service.ts (LandRegistryComparable).
--
-- Note (2026-06-19): no application code currently writes property_insights
-- rows of type 'land_registry'. This backfill is a no-op until that ingestion
-- path lands. The ongoing write path that keeps property_last_sold fresh is
-- in land-registry-service (see related task) — that one is independent of
-- property_insights and will populate this table on every LR fetch.
--
-- If the eventual writer stores LR data under a different key (e.g. top-level
-- array instead of {transactions: [...]}) or with a different date field
-- name, this backfill should be revised to match.

insert into public.property_last_sold (property_id, last_sold_date, source)
select
  pi.property_id,
  max((txn->>'date')::date) as last_sold_date,
  'hmlr' as source
from public.property_insights pi,
     lateral jsonb_array_elements(pi.data -> 'transactions') as txn
where pi.insight_type = 'land_registry'
  and pi.data ? 'transactions'
  and (txn->>'date') is not null
group by pi.property_id
on conflict (property_id) do update
  set last_sold_date = excluded.last_sold_date,
      updated_at = now()
where excluded.last_sold_date > public.property_last_sold.last_sold_date;
