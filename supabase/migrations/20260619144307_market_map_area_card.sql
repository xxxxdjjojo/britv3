-- ============================================================================
-- market-map: instant area-card read RPC.
--
-- WHY: the selected-area "instant card" needs only the flat + house price
-- bands for one area, and must read ONLY the precompute table
-- (public.market_map_area_stats — indexed PK lookup), never the live
-- ppd_with_geography / market_map_area_detail path. This RPC returns both
-- bands in a single jsonb payload keyed by (level, area_id, window).
--
-- When a band's row is missing it is returned as a jsonb object with
-- transaction_count = 0 (NOT a SQL null that would drop the key), so the
-- service layer can treat it as Insufficient without special-casing nulls.
--
-- ROLLBACK: drop function public.market_map_area_card(text, text, int);
-- ============================================================================

create or replace function public.market_map_area_card(
  p_level text, p_area_id text, p_window int default 12)
returns jsonb language sql stable security invoker as $$
  select jsonb_build_object(
    'flat',  coalesce((select to_jsonb(r) from (
        select median_price_pence, p10_price_pence, p90_price_pence,
               transaction_count, latest_transaction_date
        from public.market_map_area_stats
        where geography_level = p_level and area_id = p_area_id
          and property_type = 'flat' and window_months = p_window) r),
      jsonb_build_object('transaction_count', 0)),
    'house', coalesce((select to_jsonb(r) from (
        select median_price_pence, p10_price_pence, p90_price_pence,
               transaction_count, latest_transaction_date
        from public.market_map_area_stats
        where geography_level = p_level and area_id = p_area_id
          and property_type = 'house' and window_months = p_window) r),
      jsonb_build_object('transaction_count', 0)));
$$;

grant execute on function public.market_map_area_card(text, text, int)
  to anon, authenticated, service_role;
