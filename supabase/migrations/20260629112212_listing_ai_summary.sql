-- Cache for the LLM-generated "Why you'll love this home" property summaries.
-- Keyed by (listing_id, fact_hash): the fact hash is a digest of the structured
-- fact pack fed to the model, so a summary is regenerated only when the
-- underlying facts (price, scores, key stats) change. Reads are public (the
-- property page is public and reads the cached summary); writes go through the
-- service-role client only.

create table if not exists public.listing_ai_summary (
  listing_id text not null,
  fact_hash  text not null,
  summary    jsonb not null,
  model      text not null,
  created_at timestamptz not null default now(),
  primary key (listing_id, fact_hash)
);

alter table public.listing_ai_summary enable row level security;

-- Public read of cached summaries (server reads via service role too, but a
-- public select policy keeps the table usable from anon contexts if needed).
drop policy if exists "listing_ai_summary public read" on public.listing_ai_summary;
create policy "listing_ai_summary public read"
  on public.listing_ai_summary
  for select
  using (true);

-- No insert/update/delete policies: writes are blocked for anon/authenticated
-- roles and only the service-role client (which bypasses RLS) may write.

comment on table public.listing_ai_summary is
  'Cache of LLM property summaries, keyed by listing_id + a hash of the fact pack. Service-role writes only.';
