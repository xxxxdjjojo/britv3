-- ============================================================================
-- sold-parcels: public.market_map_sold_parcels + refresh function
--
-- WHAT: one materialised row per parcel that contains >=1 real Land-Registry
-- sale, with the sale list and £/m² stats. Built by
-- refresh_market_map_sold_parcels(p_lad) from:
--   price_paid_data  (the sale: price, date, type, address)
--   epc_certificates (floor area + UPRN, matched on normalised postcode+PAON)
--   os_open_uprn     (UPRN → precise point; postcode centroid fallback, flagged)
--   parcels          (INSPIRE geometry; point-in-polygon = the parcel)
--
-- One parcel can hold MANY sales (a block of flats is one freehold polygon), so
-- `sales` is a jsonb array and sale_count>1 for blocks. £/m² is only computed
-- where an EPC floor area matched; parcels with no area get a NULL bucket and a
-- neutral client style (NEVER a modelled/estimated colour).
--
-- bucket: fixed NATIONAL ntile(9) over median_price_per_sqm_pence across every
-- row in the table, baked in so tiles need no per-request stats.
--
-- ROLLBACK: drop function public.refresh_market_map_sold_parcels(text);
--           drop table public.market_map_sold_parcels;
-- ============================================================================

create table if not exists public.market_map_sold_parcels (
  inspire_id                 text primary key
                               references public.parcels(inspire_id) on delete cascade,
  geometry                   geometry(MultiPolygon, 4326) not null,
  lad_cd                     text,
  latest_transfer_date       date,
  sale_count                 integer not null,
  median_price_per_sqm_pence bigint,           -- NULL when no EPC-area match → neutral style
  median_price_pence         bigint not null,
  dominant_property_type     text,             -- detached|semi-detached|terraced|flat|other
  sales                      jsonb   not null, -- [{address,date,price,ppsqm,type,floor_area,estimated_location}]
  bucket                     integer,          -- 1..9 national quantile; NULL when ppsqm NULL
  updated_at                 timestamptz not null default now()
);

create index if not exists market_map_sold_parcels_geom_gist
  on public.market_map_sold_parcels using gist (geometry);
create index if not exists market_map_sold_parcels_lad_idx
  on public.market_map_sold_parcels (lad_cd);

alter table public.market_map_sold_parcels enable row level security;
drop policy if exists "sold parcels public read" on public.market_map_sold_parcels;
create policy "sold parcels public read"
  on public.market_map_sold_parcels for select using (true);
grant select on public.market_map_sold_parcels to anon, authenticated;

-- ----------------------------------------------------------------------------
-- refresh_market_map_sold_parcels(p_lad)
--   Rebuilds every sold parcel for one Local Authority (idempotent), then
--   re-bakes the national bucket across the whole table and bumps the
--   market-map data_version so tiles cache-bust.
-- ----------------------------------------------------------------------------
create or replace function public.refresh_market_map_sold_parcels(p_lad text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  -- 1. Sales in this LAD matched to an EPC (normalised postcode + PAON), with
  --    the best EPC per sale (SAON-consistent for flats, then latest inspection).
  --
  -- The PPD postcode key uses upper(replace(postcode,' ','')) — exactly the
  -- expression behind idx_ppd_postcode_normalised — so the LAD's ~10k postcodes
  -- probe price_paid_data by index instead of scanning all ~30M rows. EPC is
  -- pre-filtered to the LAD's postcodes the same way before the PAON match.
  create temp table _matched on commit drop as
  with lad_pc as (
    select postcode_normalised as pc_key, latitude as pc_lat, longitude as pc_lng
    from public.postcode_geography
    where lad_cd = p_lad and latitude is not null and longitude is not null
  ),
  th_epc as (
    select e.uprn, e.total_floor_area, e.inspection_date, e.address1,
           upper(replace(e.postcode, ' ', '')) as pc_key,
           md_norm_paon(e.paon)                as paon_key
    from public.epc_certificates e
    join lad_pc lp on lp.pc_key = upper(replace(e.postcode, ' ', ''))
  ),
  th_ppd as (
    select
      pp.transaction_id,
      (pp.price * 100)::bigint          as price_pence,
      pp.date_of_transfer::date         as transfer_date,
      upper(pp.property_type)           as ppd_type,
      pp.paon, pp.saon, pp.street,
      lp.pc_lat, lp.pc_lng,
      upper(replace(pp.postcode, ' ', '')) as pc_key,
      md_norm_paon(pp.paon)                as paon_key
    from public.price_paid_data pp
    join lad_pc lp on lp.pc_key = upper(replace(pp.postcode, ' ', ''))
    where pp.paon is not null
      and coalesce(pp.record_status, 'A') <> 'D'   -- exclude monthly deletions
      and coalesce(pp.ppd_category, 'A') = 'A'      -- standard price-paid only
  ),
  ranked as (
    select
      tp.transaction_id, tp.price_pence, tp.transfer_date, tp.ppd_type,
      tp.paon, tp.saon, tp.street, tp.pc_lat, tp.pc_lng,
      te.uprn, te.total_floor_area,
      row_number() over (
        partition by tp.transaction_id
        order by
          (case when tp.saon is not null and te.address1 is not null
                 and position(md_norm_paon(tp.saon) in md_norm_paon(te.address1)) > 0
                then 0 else 1 end),
          te.inspection_date desc nulls last
      ) as rn
    from th_ppd tp
    join th_epc te on te.pc_key = tp.pc_key and te.paon_key = tp.paon_key
  )
  select
    transaction_id, price_pence, transfer_date, paon, saon, street,
    pc_lat, pc_lng, uprn, total_floor_area,
    case upper(ppd_type)
      when 'D' then 'detached' when 'S' then 'semi-detached'
      when 'T' then 'terraced' when 'F' then 'flat' else 'other'
    end as property_type,
    case when total_floor_area > 0
         then (price_pence / total_floor_area)::bigint end as ppsqm
  from ranked
  where rn = 1;

  -- 2. Locate each sale (precise UPRN point, else postcode centroid → flagged)
  --    and snap to its containing parcel.
  create temp table _snapped on commit drop as
  select
    par.inspire_id,
    m.*,
    (ou.geom is null) as estimated_location
  from _matched m
  left join public.os_open_uprn ou
    on m.uprn ~ '^[0-9]+$' and ou.uprn = m.uprn::bigint
  join public.parcels par
    on par.lad_cd = p_lad
   and ST_Contains(
         par.geometry,
         coalesce(ou.geom, ST_SetSRID(ST_MakePoint(m.pc_lng, m.pc_lat), 4326))
       );

  -- 3. One row per parcel. Replace this LAD's rows.
  delete from public.market_map_sold_parcels where lad_cd = p_lad;

  insert into public.market_map_sold_parcels (
    inspire_id, geometry, lad_cd, latest_transfer_date, sale_count,
    median_price_per_sqm_pence, median_price_pence, dominant_property_type, sales
  )
  select
    s.inspire_id,
    par.geometry,
    p_lad,
    max(s.transfer_date),
    count(*),
    percentile_cont(0.5) within group (order by s.ppsqm)
      filter (where s.ppsqm is not null)::bigint,
    percentile_cont(0.5) within group (order by s.price_pence)::bigint,
    mode() within group (order by s.property_type),
    jsonb_agg(
      jsonb_build_object(
        'address', nullif(trim(both ', ' from
                     concat_ws(', ', nullif(s.saon,''), nullif(s.paon,''), nullif(s.street,''))), ''),
        'date', s.transfer_date,
        'price', s.price_pence,
        'ppsqm', s.ppsqm,
        'type', s.property_type,
        'floor_area', s.total_floor_area,
        'estimated_location', s.estimated_location
      ) order by s.transfer_date desc
    )
  from _snapped s
  join public.parcels par on par.inspire_id = s.inspire_id
  group by s.inspire_id, par.geometry;

  get diagnostics v_rows = row_count;

  -- 4. Re-bake the national bucket (ntile 9 over median £/m²) across ALL rows.
  with ranked as (
    select inspire_id,
           ntile(9) over (order by median_price_per_sqm_pence) as b
    from public.market_map_sold_parcels
    where median_price_per_sqm_pence is not null
  )
  update public.market_map_sold_parcels t
     set bucket = ranked.b
    from ranked
   where ranked.inspire_id = t.inspire_id;

  update public.market_map_sold_parcels
     set bucket = null
   where median_price_per_sqm_pence is null;

  -- 5. Bump the market-map data_version so edge-cached tiles refresh.
  update public.market_map_meta
     set data_version = to_char(clock_timestamp(), 'YYYYMMDDHH24MISS');

  return v_rows;
end;
$$;

grant execute on function public.refresh_market_map_sold_parcels(text) to service_role;
