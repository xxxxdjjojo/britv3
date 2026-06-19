-- Sidecar table holding the most recent HM Land Registry sale per property.
-- Joined into search_listings to support the "sold within last N months" filter.

create table if not exists public.property_last_sold (
  property_id uuid primary key
    references public.properties(id) on delete cascade,
  last_sold_date date not null,
  source text not null default 'hmlr',
  updated_at timestamptz not null default now()
);

create index if not exists property_last_sold_date_idx
  on public.property_last_sold (last_sold_date desc);

alter table public.property_last_sold enable row level security;

-- Public-derived data; no PII. Read open, writes only via definer/service role.
drop policy if exists "property_last_sold_select_all" on public.property_last_sold;
create policy "property_last_sold_select_all"
  on public.property_last_sold
  for select
  using (true);
