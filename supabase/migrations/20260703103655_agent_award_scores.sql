-- ============================================================================
-- Honest Agent Awards schema — Influence Strategy Phase 3, item 3.5.
--
-- agent_award_scores       : per-agency per-metric per-period scores computed
--                            by refresh_agent_award_scores() (below). NEVER
--                            written by users. Rows below the disclosed
--                            minimum sample carry eligibility_flag = false
--                            (compute-and-suppress — same discipline as
--                            reality_gap_snapshots).
-- agent_award_nominations  : an agency's opt-in to the awards, recorded by an
--                            authenticated member of that organisation. Free
--                            to enter, always — there is no payment anywhere
--                            in the awards, and votes are never an input.
--
-- YEAR-1 METRICS: pricing_accuracy, time_to_sell, listing_hygiene.
-- FALL-THROUGH RATE IS DROPPED FOR YEAR 1: it needs transaction_milestones /
-- agent_sale_progressions coverage and as of 2026-07-03 those tables hold
-- 0 and 2 rows — nowhere near enough to score anyone honestly. Disclosed on
-- /awards/methodology; reconsidered for year 2.
--
-- Agency linkage = listings.organisation_id (verified 2026-07-03: 28 of 103
-- listings carry it across 3 distinct orgs; branch_id is all null).
--
-- Definer-fn + revoke pattern mirrors 20260702210504_reality_gap_snapshots.sql.
-- ============================================================================

create table if not exists public.agent_award_scores (
  id               uuid        primary key default gen_random_uuid(),
  agency_id        uuid        not null references public.organisations(id) on delete cascade,
  period           text        not null,   -- award year, e.g. '2026'
  metric           text        not null check (metric in ('pricing_accuracy', 'time_to_sell', 'listing_hygiene')),
  value            numeric,                -- lower is always better; null when uncomputable
  sample_n         int         not null default 0,
  eligibility_flag boolean     not null default false,
  computed_at      timestamptz not null default now(),
  unique (period, agency_id, metric)
);

comment on table public.agent_award_scores is
  'Honest Agent Awards scores (one row per agency x metric x award year), '
  'computed from public transaction data + TrueDeed listings by '
  'refresh_agent_award_scores(). eligibility_flag = false means the agency '
  'is below the disclosed minimum sample (5) and is excluded from ranking '
  '(compute-and-suppress). Votes are never an input; entry is never paid.';

create index if not exists idx_agent_award_scores_agency
  on public.agent_award_scores(agency_id, period);

create table if not exists public.agent_award_nominations (
  id           uuid        primary key default gen_random_uuid(),
  agency_id    uuid        not null references public.organisations(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  period       text        not null,   -- award year, e.g. '2026'
  opted_in_at  timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique (agency_id, period)
);

comment on table public.agent_award_nominations is
  'Awards opt-in per agency per award year, recorded by an authenticated '
  'member of the organisation. Withdrawing sets withdrawn_at; re-opting-in '
  'clears it. Opting in never costs anything and never affects scores.';

create index if not exists idx_agent_award_nominations_user
  on public.agent_award_nominations(user_id);

-- ---------------------------------------------------------------------------
-- RLS.
--
-- Scores (chosen posture, justified):
--   * public read WHERE eligibility_flag = true — eligible scores are the
--     public evidence base for the December ceremony (Phase 4) and there is
--     nothing sensitive in them (they derive from public HMLR data + public
--     listings).
--   * agency members can ALSO read their own suppressed rows so their
--     dashboard can show the honest "not enough data yet — you need ≥5
--     matched sales" explanation. Other agencies' suppressed rows stay
--     hidden: a below-threshold value must never leak as a pseudo-ranking.
--   * no write policies — writes happen only via the service role / the
--     security-definer refresh fn, both of which bypass RLS.
--
-- Nominations: members of the agency can read and manage their own agency's
-- row; inserts must carry the caller's own user_id. No public read — the
-- public /awards page for year 1 shows criteria and process, not live
-- entrant lists or rankings (data is too thin to publish honestly).
-- ---------------------------------------------------------------------------

alter table public.agent_award_scores enable row level security;

drop policy if exists agent_award_scores_public_read_eligible on public.agent_award_scores;
create policy agent_award_scores_public_read_eligible
  on public.agent_award_scores
  for select
  to anon, authenticated
  using (eligibility_flag = true);

drop policy if exists agent_award_scores_member_read_own on public.agent_award_scores;
create policy agent_award_scores_member_read_own
  on public.agent_award_scores
  for select
  to authenticated
  using (public.is_org_member(agency_id));

grant select on public.agent_award_scores to anon, authenticated, service_role;

alter table public.agent_award_nominations enable row level security;

drop policy if exists agent_award_nominations_member_select on public.agent_award_nominations;
create policy agent_award_nominations_member_select
  on public.agent_award_nominations
  for select
  to authenticated
  using (public.is_org_member(agency_id));

drop policy if exists agent_award_nominations_member_insert on public.agent_award_nominations;
create policy agent_award_nominations_member_insert
  on public.agent_award_nominations
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_org_member(agency_id)
  );

-- Members may withdraw / re-opt-in their agency (toggle withdrawn_at), even
-- when a colleague created the row.
drop policy if exists agent_award_nominations_member_update on public.agent_award_nominations;
create policy agent_award_nominations_member_update
  on public.agent_award_nominations
  for update
  to authenticated
  using (public.is_org_member(agency_id))
  with check (public.is_org_member(agency_id));

grant select, insert, update on public.agent_award_nominations to authenticated;
grant select, insert, update, delete on public.agent_award_nominations to service_role;

-- ---------------------------------------------------------------------------
-- Refresh function — recomputes ONE award year (delete-then-insert for that
-- period only). The disclosed constants below must mirror AWARD_MIN_SAMPLE /
-- STALE_LISTING_DAYS in src/services/awards/award-scoring-service.ts (the TS
-- module is the disclosed copy; this fn is the computer).
--
-- Metric definitions (lower = better for all three):
--   pricing_accuracy : median |final asking − PPD sold| as % of sold price,
--                      over confirmed ppd_match_candidates pairs completing
--                      in the award year. Prod reality 2026-07-03: 0
--                      confirmed rows → this inserts no rows for anyone,
--                      never an error, never a fabrication.
--   time_to_sell     : agency median days (listings.listed_date → HMLR
--                      transfer_date, plain date arithmetic — same semantics
--                      as 20260702210507_time_to_sell_snapshots.sql) minus
--                      the local median baseline READ FROM the published
--                      time_to_sell_snapshots dataset (never recomputed
--                      here). When no unsuppressed snapshot row exists for
--                      the period every row stays suppressed
--                      (eligibility_flag = false, value null) — no baseline,
--                      no ranking.
--   listing_hygiene  : % of the agency's listings created in the trailing 12
--                      months that are withdrawn or stale (active > 180
--                      days).
--
-- FALL-THROUGH RATE: intentionally NOT computed — dropped for year 1 (see
-- header). Do not add it without the methodology-page disclosure.
-- ---------------------------------------------------------------------------

create or replace function public.refresh_agent_award_scores(p_period text default null)
returns void
language plpgsql
security definer
set search_path = public
set statement_timeout = 0
as $$
declare
  -- Disclosed constants — mirror award-scoring-service.ts.
  c_min_sample constant int := 5;    -- AWARD_MIN_SAMPLE
  c_stale_days constant int := 180;  -- STALE_LISTING_DAYS

  v_period        text := coalesce(p_period, to_char(current_date, 'YYYY'));
  v_from          timestamptz;
  v_to            timestamptz;
  v_baseline_days numeric;
begin
  v_from := date_trunc('year', to_date(v_period, 'YYYY'));
  v_to   := v_from + interval '1 year';

  delete from public.agent_award_scores where period = v_period;

  -- ==== pricing_accuracy ====================================================
  insert into public.agent_award_scores (agency_id, period, metric, value, sample_n, eligibility_flag)
  select
    l.organisation_id,
    v_period,
    'pricing_accuracy',
    round((percentile_cont(0.5) within group (
      order by abs(l.price - (t.price_pence / 100.0)) / (t.price_pence / 100.0) * 100
    ))::numeric, 2),
    count(*)::int,
    count(*) >= c_min_sample
  from public.ppd_match_candidates m
  join public.listings l on l.id = m.listing_id
  join public.ppd_transactions t on t.ppd_tuid = m.ppd_tuid
  where m.status = 'confirmed'
    and l.organisation_id is not null
    and l.price > 0
    and t.price_pence > 0
    and t.transfer_date >= v_from
    and t.transfer_date < v_to
  group by l.organisation_id;

  -- ==== time_to_sell ========================================================
  -- Baseline: the local median from the PUBLISHED Time-to-Sell dataset
  -- (time_to_sell_snapshots) — the spec is "time-to-sell vs local median
  -- (from time_to_sell_snapshots)", so the awards must rank against the same
  -- figure the public page shows, never a private recomputation. Snapshot
  -- periods are quarterly ('<YYYY>-Q<n>'); we take the latest unsuppressed
  -- NATIONAL row within the award year. National (not district) is the
  -- deliberate choice at current data volume: district rows are almost all
  -- suppressed, and an award must never use a baseline the public dataset
  -- refuses to display. No unsuppressed row → v_baseline_days stays null →
  -- every agency below gets eligibility_flag = false (no baseline, no
  -- ranking).
  select s.median_days
  into v_baseline_days
  from public.time_to_sell_snapshots s
  where s.area_level = 'national'
    and s.suppressed = false
    and s.median_days is not null
    and s.period like v_period || '-Q%'
  order by s.period desc
  limit 1;

  -- Per-agency days-to-sell uses listings.listed_date (the semantic
  -- went-on-market column) with plain date arithmetic and the same two
  -- guards as 20260702210507_time_to_sell_snapshots.sql.
  insert into public.agent_award_scores (agency_id, period, metric, value, sample_n, eligibility_flag)
  select
    l.organisation_id,
    v_period,
    'time_to_sell',
    case
      when v_baseline_days is null then null
      else round((percentile_cont(0.5) within group (
        order by (t.transfer_date - l.listed_date)
      ) - v_baseline_days)::numeric, 2)
    end,
    count(*)::int,
    (count(*) >= c_min_sample and v_baseline_days is not null)
  from public.ppd_match_candidates m
  join public.listings l on l.id = m.listing_id
  join public.ppd_transactions t on t.ppd_tuid = m.ppd_tuid
  where m.status = 'confirmed'
    and l.organisation_id is not null
    and t.transfer_date >= v_from
    and t.transfer_date < v_to
    and l.listed_date is not null
    and t.transfer_date >= l.listed_date   -- guard bad matches / data entry
  group by l.organisation_id;

  -- ==== listing_hygiene =====================================================
  insert into public.agent_award_scores (agency_id, period, metric, value, sample_n, eligibility_flag)
  select
    l.organisation_id,
    v_period,
    'listing_hygiene',
    round(
      100.0 * count(*) filter (
        where l.status = 'withdrawn'
           or (l.status = 'active'
              and l.listed_date is not null
              and l.listed_date < (current_date - c_stale_days))
      ) / count(*),
      2
    ),
    count(*)::int,
    count(*) >= c_min_sample
  from public.listings l
  where l.organisation_id is not null
    and l.deleted_at is null
    and l.created_at >= now() - interval '12 months'
  group by l.organisation_id;
end;
$$;

comment on function public.refresh_agent_award_scores(text) is
  'Recomputes agent_award_scores for one award year (default: current; period '
  'format ''2026''). Metrics: pricing_accuracy, time_to_sell, listing_hygiene '
  '— fall-through rate is deliberately dropped for year 1 (progression '
  'coverage too thin). Minimum sample 5 mirrors AWARD_MIN_SAMPLE in '
  'award-scoring-service.ts. Service-role only.';

-- Same hardening as refresh_reality_gap_snapshots: definer fn, service-role
-- only.
revoke execute on function public.refresh_agent_award_scores(text)
from public, anon, authenticated;
grant execute on function public.refresh_agent_award_scores(text)
to service_role;
