-- Attach the Companies House enforcement trigger to service_provider_details.
--
-- 20260619130000_company_verification_authoritative.sql created the
-- authoritative table public.company_verifications and the trigger function
-- public.enforce_company_house_verification(), and attached that trigger to
-- `agencies` and `service_provider_profiles`. But `service_provider_profiles`
-- does NOT exist — the real provider legal-entity table is
-- public.service_provider_details (it carries the companies_house_* columns,
-- added by 20260619120000_companies_house_verification.sql). So providers'
-- trust columns (companies_house_status / companies_house_verified_at /
-- incorporation_date) were never server-enforced: a browser client could still
-- write companies_house_status='verified' directly.
--
-- This migration closes that gap by attaching the EXISTING function as a
-- BEFORE INSERT OR UPDATE trigger on service_provider_details. The function's
-- non-`agencies` branch keys the owner via new.user_id, and
-- service_provider_details' PK is user_id, so it works unchanged. We do NOT
-- recreate the function or company_verifications. Guarded by to_regclass and
-- mirrors the DO-block style at the bottom of …130000.

do $$
begin
  if to_regclass('public.service_provider_details') is not null then
    drop trigger if exists trg_enforce_ch_verification on public.service_provider_details;
    create trigger trg_enforce_ch_verification
      before insert or update on public.service_provider_details
      for each row execute function public.enforce_company_house_verification();
  end if;
end $$;
