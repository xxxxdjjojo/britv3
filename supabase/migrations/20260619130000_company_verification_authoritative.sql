-- Companies House verification — server-authoritative trust fields.
--
-- Closes a HIGH-severity bypass: the onboarding clients wrote
-- companies_house_status='verified' (plus companies_house_verified_at /
-- incorporation_date) straight into agencies / service_provider_profiles via
-- the browser supabase client, so any user could self-mark "verified" and skip
-- the "registered >= 2 years" gate. There was also a client fail-open path.
--
-- Fix: a single authoritative record per user in company_verifications, written
-- ONLY by the server (/api/verification/company via the service-role key), and
-- BEFORE INSERT/UPDATE triggers on the legal-entity tables that overwrite the
-- trust columns from that record (or force them NULL when none exists).
-- Client-supplied values for those columns are always ignored.

create table if not exists public.company_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_number text not null,
  status text not null check (status in ('verified', 'pending_review')),
  company_name text,
  company_status text,
  incorporation_date date,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_verifications enable row level security;

-- Owner may read their own verification. There is intentionally NO client
-- insert/update/delete policy, so only the service-role key (which bypasses
-- RLS) can write it.
drop policy if exists "own company verification readable" on public.company_verifications;
create policy "own company verification readable"
  on public.company_verifications for select
  using (user_id = auth.uid());

revoke insert, update, delete on public.company_verifications from anon, authenticated;
grant select on public.company_verifications to anon, authenticated;

-- Enforcement: force the trust columns from the authoritative record on every
-- insert/update of a legal-entity row.
create or replace function public.enforce_company_house_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_rec public.company_verifications%rowtype;
begin
  -- agencies key the owner via owner_id; provider tables via user_id.
  if tg_table_name = 'agencies' then
    v_owner := new.owner_id;
  else
    v_owner := new.user_id;
  end if;

  select * into v_rec
  from public.company_verifications
  where user_id = v_owner;

  if found then
    new.companies_house_status := v_rec.status;
    new.companies_house_verified_at := v_rec.verified_at;
    new.incorporation_date := v_rec.incorporation_date;
  else
    new.companies_house_status := null;
    new.companies_house_verified_at := null;
    new.incorporation_date := null;
  end if;

  return new;
end;
$$;

-- Attach only where the legal-entity tables exist (provisioned outside this
-- migration set in some environments — mirror 20260619120000's guards).
do $$
begin
  if to_regclass('public.agencies') is not null then
    drop trigger if exists trg_enforce_ch_verification on public.agencies;
    create trigger trg_enforce_ch_verification
      before insert or update on public.agencies
      for each row execute function public.enforce_company_house_verification();
  end if;

  if to_regclass('public.service_provider_profiles') is not null then
    drop trigger if exists trg_enforce_ch_verification on public.service_provider_profiles;
    create trigger trg_enforce_ch_verification
      before insert or update on public.service_provider_profiles
      for each row execute function public.enforce_company_house_verification();
  end if;
end $$;
