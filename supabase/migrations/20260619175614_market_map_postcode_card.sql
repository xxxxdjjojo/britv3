-- ============================================================================
-- market-map: postcode-keyed area-card read RPC.
--
-- WHY: a property/search surface keyed by postcode needs the flat + house
-- price bands for the area that postcode sits in. We resolve the postcode to
-- its geography (postcode_geography), then for each property type walk a
-- fallback ladder lsoa → postcode_district → msoa → local_authority, taking
-- the FIRST level whose precompute row clears p_min_count transactions. This
-- reads ONLY the precompute table (public.market_map_area_stats — indexed PK
-- lookup) plus the postcode lookup, never the live ppd_with_geography path.
--
-- Each band carries level_used + area_name so the UI can label the result
-- truthfully (e.g. "Manchester (local authority)") instead of pretending a
-- coarser fallback is the postcode itself. A band with no qualifying level is
-- returned as a SQL null; the service layer maps that to an all-insufficient
-- series (never £0). An unknown postcode returns {found:false}.
--
-- ROLLBACK: drop function public.market_map_postcode_card(text, int, int);
-- ============================================================================

create or replace function public.market_map_postcode_card(
  p_postcode text, p_window int default 12, p_min_count int default 6)
returns jsonb language plpgsql stable security definer
set statement_timeout = '5s' as $$
declare
  v_pc          public.postcode_geography%rowtype;
  v_normalised  text;
  v_flat        jsonb;
  v_house       jsonb;
begin
  v_normalised := upper(regexp_replace(p_postcode, '\s', '', 'g'));

  select * into v_pc
  from public.postcode_geography
  where postcode_normalised = v_normalised;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  -- Flat band: first ladder level (lsoa → postcode_district → msoa →
  -- local_authority) that clears p_min_count, or null.
  select to_jsonb(b) into v_flat
  from (
    select s.median_price_pence,
           s.p10_price_pence,
           s.p90_price_pence,
           s.transaction_count,
           c.level as level_used,
           s.area_name,
           s.latest_transaction_date
    from (values
            (1, 'lsoa',             v_pc.lsoa_cd),
            (2, 'postcode_district', v_pc.postcode_district),
            (3, 'msoa',             v_pc.msoa_cd),
            (4, 'local_authority',  v_pc.lad_cd)
         ) as c(priority, level, area_id)
    join public.market_map_area_stats s
      on s.geography_level = c.level
     and s.area_id = c.area_id
     and s.property_type = 'flat'
     and s.window_months = p_window
    where s.transaction_count >= p_min_count
    order by c.priority
    limit 1
  ) b;

  -- House band: same ladder.
  select to_jsonb(b) into v_house
  from (
    select s.median_price_pence,
           s.p10_price_pence,
           s.p90_price_pence,
           s.transaction_count,
           c.level as level_used,
           s.area_name,
           s.latest_transaction_date
    from (values
            (1, 'lsoa',             v_pc.lsoa_cd),
            (2, 'postcode_district', v_pc.postcode_district),
            (3, 'msoa',             v_pc.msoa_cd),
            (4, 'local_authority',  v_pc.lad_cd)
         ) as c(priority, level, area_id)
    join public.market_map_area_stats s
      on s.geography_level = c.level
     and s.area_id = c.area_id
     and s.property_type = 'house'
     and s.window_months = p_window
    where s.transaction_count >= p_min_count
    order by c.priority
    limit 1
  ) b;

  return jsonb_build_object(
    'found', true,
    'location', jsonb_build_object(
      'postcode_display', v_pc.postcode_display,
      'lad_name', v_pc.lad_name,
      'region', v_pc.region,
      'lat', v_pc.latitude,
      'lng', v_pc.longitude),
    'flat', v_flat,
    'house', v_house);
end;
$$;

grant execute on function public.market_map_postcode_card(text, int, int)
  to anon, authenticated, service_role;
