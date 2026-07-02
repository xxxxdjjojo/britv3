-- ============================================================================
-- reality_gap_snapshots — Influence Strategy Phase 2 ("own the data narrative").
--
-- Precomputed asking-vs-sold price gap per quarter, published on the public
-- Reality Gap report pages. Two evidence tiers:
--
--   * area_median   — median ACTIVE sale asking price (listings joined to
--                     properties) vs median sold price from HM Land Registry
--                     price_paid_transactions, trailing 12 months.
--   * matched_pair  — the same listing observed as an asking price and then a
--                     confirmed completion (ppd_match_candidates status =
--                     'confirmed' → ppd_transactions), so the gap is measured
--                     on identical properties, not two different populations.
--
-- PERIOD FORMAT: '<YYYY>-Q<n>' (e.g. '2026-Q2'). Stable, sortable within a
-- year, human-readable in URLs. refresh_reality_gap_snapshots() computes the
-- current quarter when called with no argument.
--
-- price_paid_transactions is a prod-only bulk-loaded table (~11M rows, prices
-- in POUNDS) that no repo migration creates. Every access is therefore behind
-- a `to_regclass('public.price_paid_transactions') is not null` guard so a
-- local `supabase db reset` still works: when absent the area_median sold side
-- is skipped and those rows stay suppressed.
--
-- Precompute pattern mirrors 20260619000001_market_map_precompute.sql
-- (security definer, statement_timeout = 0, repopulate-per-period). Public
-- read RLS mirrors 20260616000000_broadband_coverage.sql.
-- ============================================================================

create table if not exists public.reality_gap_snapshots (
  period               text        not null,   -- '2026-Q2'
  area_level           text        not null check (area_level in ('national', 'district')),
  area_id              text        not null,   -- 'uk' for national; district_slug otherwise
  area_name            text,
  property_type        text        not null check (property_type in ('all', 'detached', 'semi_detached', 'terraced', 'flat')),
  tier                 text        not null check (tier in ('matched_pair', 'area_median')),
  median_asking_pounds bigint,
  median_sold_pounds   bigint,
  gap_pct              numeric(6, 2),
  sample_asking_n      int         not null default 0,
  sample_sold_n        int         not null default 0,
  suppressed           boolean     not null default true,
  methodology_version  int         not null default 1,
  refreshed_at         timestamptz not null default now(),
  primary key (period, area_level, area_id, property_type, tier)
);

comment on table public.reality_gap_snapshots is
  'Quarterly asking-vs-sold price gap snapshots (Reality Gap report). '
  'area_median tier = active asking medians vs HMLR sold medians (trailing 12m); '
  'matched_pair tier = confirmed listing-to-completion pairs. Prices in pounds. '
  'Rows with suppressed = true fail the disclosed sample-size thresholds and '
  'must not be displayed as headline figures.';

-- ---------------------------------------------------------------------------
-- RLS — public read, no write policies (writes via service role / definer fn,
-- both of which bypass RLS). Same pattern as broadband_coverage.
-- ---------------------------------------------------------------------------

alter table public.reality_gap_snapshots enable row level security;

drop policy if exists reality_gap_snapshots_public_read on public.reality_gap_snapshots;
create policy reality_gap_snapshots_public_read
  on public.reality_gap_snapshots
  for select
  to anon, authenticated
  using (true);

grant select on public.reality_gap_snapshots to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Refresh function — recomputes ONE period (delete-then-insert for that
-- period only, so historical quarters are never clobbered).
--
-- DISTRICT JOIN (documented design decision): listings carry no postcode;
-- properties.postcode does (UK format, e.g. 'SW1A 1AA'). We map each active
-- listing to a district_slug by exact-postcode lookup into
-- price_paid_transactions (rides idx_ppd_postcode), i.e. "the district HMLR
-- files sales under for this exact postcode". This is the simplest join that
-- is correct by construction (a full postcode belongs to exactly one
-- district) and needs no extra geography table. Listings whose postcode has
-- never appeared in PPD fall out of district rows but still count nationally.
--
-- SUPPRESSION THRESHOLDS (disclosed on the methodology page):
--   area_median  : suppressed when sample_asking_n < 20 OR sample_sold_n < 100
--   matched_pair : suppressed when sample_asking_n < 10
--
-- GRANULARITY: national rows are emitted for 'all' + each of the four mapped
-- property types; district rows are 'all' only (per-type district cells are
-- too thin to clear suppression at current volumes). matched_pair is national
-- only until confirmed-match volume exists (table currently has 0 rows —
-- everything below degrades to suppressed zero-sample rows, never errors).
--
-- NOTE (PL/pgSQL + missing table): statements inside the `if v_has_ppd`
-- branch reference price_paid_transactions statically. PL/pgSQL resolves
-- tables per statement at first execution, so on a local stack without the
-- table the function still creates and runs fine — the guarded branch is
-- simply never entered.
-- ---------------------------------------------------------------------------

create or replace function public.refresh_reality_gap_snapshots(p_period text default null)
returns void
language plpgsql
security definer
set search_path = public
set statement_timeout = 0
as $$
declare
  -- Disclosed suppression thresholds (see methodology page).
  c_min_asking_area constant int := 20;   -- area_median: min active listings
  c_min_sold_area   constant int := 100;  -- area_median: min sold transactions
  c_min_pairs       constant int := 10;   -- matched_pair: min confirmed pairs

  -- Period format: '2026-Q2'.
  v_period  text := coalesce(p_period, to_char(current_date, 'YYYY') || '-Q' || to_char(current_date, 'Q'));
  v_from    date := current_date - interval '12 months';
  v_has_ppd boolean := to_regclass('public.price_paid_transactions') is not null;
begin
  delete from public.reality_gap_snapshots where period = v_period;

  -- =========================================================================
  -- Tier 1: area_median — asking side (always available from repo tables)
  -- vs sold side (only when price_paid_transactions is present).
  -- =========================================================================
  if v_has_ppd then
    -- ---- National: 'all' + four mapped property types ----------------------
    insert into public.reality_gap_snapshots (
      period, area_level, area_id, area_name, property_type, tier,
      median_asking_pounds, median_sold_pounds, gap_pct,
      sample_asking_n, sample_sold_n, suppressed
    )
    with asking as (
      -- Active sale asking prices, mapped onto the report's type buckets.
      select
        case p.property_type::text
          when 'detached'      then 'detached'
          when 'semi_detached' then 'semi_detached'
          when 'terraced'      then 'terraced'
          when 'flat'          then 'flat'
          else null            -- other property types count toward 'all' only
        end as ptype,
        l.price
      from public.listings l
      join public.properties p on p.id = l.property_id
      where l.listing_type = 'sale'
        and l.status in ('active', 'under_offer')
        and l.deleted_at is null
        and p.deleted_at is null
        and l.price > 0
    ),
    asking_stats as (
      select ptype,
             percentile_cont(0.5) within group (order by price)::bigint as median_p,
             count(*)::int as n
      from (
        select ptype, price from asking where ptype is not null
        union all
        select 'all', price from asking   -- 'all' rollup includes every type
      ) a
      group by ptype
    ),
    sold as (
      -- Standard residential sales only (transaction_category = 'A'), live
      -- records (record_status <> 'D') — same rule as ppd_with_geography /
      -- the market-map median. price is in POUNDS on this table.
      select
        case t.property_type
          when 'D' then 'detached'
          when 'S' then 'semi_detached'
          when 'T' then 'terraced'
          when 'F' then 'flat'
          else null              -- 'O' counts toward 'all' only
        end as ptype,
        t.price
      from public.price_paid_transactions t
      where t.transaction_date >= v_from
        and coalesce(t.record_status, 'A') <> 'D'
        and t.transaction_category = 'A'
        and t.price > 0
    ),
    sold_stats as (
      select ptype,
             percentile_cont(0.5) within group (order by price)::bigint as median_p,
             count(*)::int as n
      from (
        select ptype, price from sold where ptype is not null
        union all
        select 'all', price from sold
      ) s
      group by ptype
    ),
    spine(ptype) as (
      values ('all'), ('detached'), ('semi_detached'), ('terraced'), ('flat')
    )
    select
      v_period, 'national', 'uk', 'United Kingdom', spine.ptype, 'area_median',
      a.median_p,
      s.median_p,
      case
        when a.median_p is not null and s.median_p is not null and s.median_p > 0
          then round(((a.median_p - s.median_p)::numeric / s.median_p) * 100, 2)
        else null
      end,
      coalesce(a.n, 0),
      coalesce(s.n, 0),
      (coalesce(a.n, 0) < c_min_asking_area or coalesce(s.n, 0) < c_min_sold_area)
    from spine
    left join asking_stats a on a.ptype = spine.ptype
    left join sold_stats   s on s.ptype = spine.ptype;

    -- ---- District: 'all' only ----------------------------------------------
    insert into public.reality_gap_snapshots (
      period, area_level, area_id, area_name, property_type, tier,
      median_asking_pounds, median_sold_pounds, gap_pct,
      sample_asking_n, sample_sold_n, suppressed
    )
    with asking_listings as (
      select l.price, upper(trim(p.postcode)) as postcode
      from public.listings l
      join public.properties p on p.id = l.property_id
      where l.listing_type = 'sale'
        and l.status in ('active', 'under_offer')
        and l.deleted_at is null
        and p.deleted_at is null
        and l.price > 0
    ),
    asking_by_district as (
      -- Exact-postcode lookup into PPD for the district_slug (see header
      -- comment). Correlated per-listing lookup rides idx_ppd_postcode; the
      -- active listing set is small so this stays cheap.
      select d.district_slug,
             percentile_cont(0.5) within group (order by al.price)::bigint as median_p,
             count(*)::int as n
      from asking_listings al
      cross join lateral (
        select t.district_slug
        from public.price_paid_transactions t
        where t.postcode = al.postcode
          and t.district_slug is not null
        limit 1
      ) d
      group by d.district_slug
    ),
    sold_by_district as (
      select t.district_slug,
             max(t.district) as district_name,
             percentile_cont(0.5) within group (order by t.price)::bigint as median_p,
             count(*)::int as n
      from public.price_paid_transactions t
      where t.transaction_date >= v_from
        and coalesce(t.record_status, 'A') <> 'D'
        and t.transaction_category = 'A'
        and t.price > 0
        and t.district_slug is not null
      group by t.district_slug
    )
    select
      v_period, 'district', s.district_slug, s.district_name, 'all', 'area_median',
      a.median_p,
      s.median_p,
      case
        when a.median_p is not null and s.median_p is not null and s.median_p > 0
          then round(((a.median_p - s.median_p)::numeric / s.median_p) * 100, 2)
        else null
      end,
      coalesce(a.n, 0),
      coalesce(s.n, 0),
      (coalesce(a.n, 0) < c_min_asking_area or coalesce(s.n, 0) < c_min_sold_area)
    from sold_by_district s
    left join asking_by_district a on a.district_slug = s.district_slug;
  else
    -- price_paid_transactions absent (local stack): asking side only, sold
    -- side null → always suppressed. No district rows (the postcode →
    -- district_slug mapping needs the PPD table).
    insert into public.reality_gap_snapshots (
      period, area_level, area_id, area_name, property_type, tier,
      median_asking_pounds, median_sold_pounds, gap_pct,
      sample_asking_n, sample_sold_n, suppressed
    )
    with asking as (
      select
        case p.property_type::text
          when 'detached'      then 'detached'
          when 'semi_detached' then 'semi_detached'
          when 'terraced'      then 'terraced'
          when 'flat'          then 'flat'
          else null
        end as ptype,
        l.price
      from public.listings l
      join public.properties p on p.id = l.property_id
      where l.listing_type = 'sale'
        and l.status in ('active', 'under_offer')
        and l.deleted_at is null
        and p.deleted_at is null
        and l.price > 0
    ),
    asking_stats as (
      select ptype,
             percentile_cont(0.5) within group (order by price)::bigint as median_p,
             count(*)::int as n
      from (
        select ptype, price from asking where ptype is not null
        union all
        select 'all', price from asking
      ) a
      group by ptype
    ),
    spine(ptype) as (
      values ('all'), ('detached'), ('semi_detached'), ('terraced'), ('flat')
    )
    select
      v_period, 'national', 'uk', 'United Kingdom', spine.ptype, 'area_median',
      a.median_p, null, null,
      coalesce(a.n, 0), 0, true
    from spine
    left join asking_stats a on a.ptype = spine.ptype;
  end if;

  -- =========================================================================
  -- Tier 2: matched_pair — confirmed listing↔completion pairs, national only
  -- ('all' + per type from ppd_transactions.property_type), pairs completing
  -- in the trailing 12 months. ppd_match_candidates / ppd_transactions are
  -- repo tables (20260612000003_truedeed_ppd.sql), so no to_regclass guard is
  -- needed. ppd_transactions.price_pence is in PENCE → /100 for pounds.
  -- =========================================================================
  insert into public.reality_gap_snapshots (
    period, area_level, area_id, area_name, property_type, tier,
    median_asking_pounds, median_sold_pounds, gap_pct,
    sample_asking_n, sample_sold_n, suppressed
  )
  with pairs as (
    select
      case t.property_type
        when 'D' then 'detached'
        when 'S' then 'semi_detached'
        when 'T' then 'terraced'
        when 'F' then 'flat'
        else null
      end as ptype,
      l.price as asking_pounds,
      (t.price_pence / 100.0) as sold_pounds
    from public.ppd_match_candidates m
    join public.listings l on l.id = m.listing_id
    join public.ppd_transactions t on t.ppd_tuid = m.ppd_tuid
    where m.status = 'confirmed'
      and t.transfer_date >= v_from
      and l.price > 0
      and t.price_pence > 0
  ),
  pair_stats as (
    select ptype,
           percentile_cont(0.5) within group (order by asking_pounds)::bigint as median_ask,
           percentile_cont(0.5) within group (order by sold_pounds)::bigint  as median_sold,
           count(*)::int as n
    from (
      select ptype, asking_pounds, sold_pounds from pairs where ptype is not null
      union all
      select 'all', asking_pounds, sold_pounds from pairs
    ) p
    group by ptype
  ),
  spine(ptype) as (
    values ('all'), ('detached'), ('semi_detached'), ('terraced'), ('flat')
  )
  select
    v_period, 'national', 'uk', 'United Kingdom', spine.ptype, 'matched_pair',
    ps.median_ask,
    ps.median_sold,
    case
      when ps.median_ask is not null and ps.median_sold is not null and ps.median_sold > 0
        then round(((ps.median_ask - ps.median_sold)::numeric / ps.median_sold) * 100, 2)
      else null
    end,
    coalesce(ps.n, 0),
    coalesce(ps.n, 0),   -- one pair = one asking obs + one sold obs
    (coalesce(ps.n, 0) < c_min_pairs)
  from spine
  left join pair_stats ps on ps.ptype = spine.ptype;
end;
$$;

comment on function public.refresh_reality_gap_snapshots(text) is
  'Recomputes reality_gap_snapshots for one quarter (default: current; period '
  'format ''2026-Q2''). area_median tier needs the prod-only '
  'price_paid_transactions table (to_regclass-guarded; sold side skipped and '
  'rows stay suppressed when it is absent). Service-role only.';

-- Definer fn that scans an 11M-row table: service-role only (same hardening
-- as the other definer RPCs — REVOKE from PUBLIC/anon/authenticated).
revoke execute on function public.refresh_reality_gap_snapshots(text)
from public, anon, authenticated;
grant execute on function public.refresh_reality_gap_snapshots(text)
to service_role;
