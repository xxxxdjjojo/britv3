-- ============================================================================
-- Truedeed Phase 5 — invoice_disputes GDPR scrub (follow-up to 20260612000005)
--
-- Pattern: identical to gdpr_scrub_introductions (Phase 1) — a SECURITY DEFINER
-- function gated by a transaction-local GUC, called from the GDPR purge worker
-- BEFORE auth.users is deleted. raised_by becomes nullable so the FK stays
-- happy after the scrub; grounds is replaced with '[erased]'; evidence file
-- paths are wiped (the Inngest worker is responsible for removing the actual
-- objects from the rebuttal-evidence bucket).
--
-- The dispute row itself is preserved — every decided dispute is contractual
-- evidence (clause 9.5 / playbook). Scrubbing keeps the decision audit trail
-- intact while honouring the user's deletion request.
-- ============================================================================

-- 1. raised_by becomes nullable so the scrub can null it (mirrors
--    introductions.applicant_id, also nullable for the same reason).
alter table public.invoice_disputes
  alter column raised_by drop not null;

-- 2. Extend the guard to allow the scrub path. The whitelist mirrors the
--    decide_invoice_dispute path: id, invoice_id, status, category,
--    decided_*, raised_at, properly_raised all unchanged; only raised_by,
--    grounds, and evidence_storage_paths flip.
create or replace function public.truedeed_invoice_disputes_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'append-only table: DELETE blocked on invoice_disputes';
  end if;

  if current_setting('truedeed.dispute_decide', true) = 'on'
     and old.status = 'open'
     and new.status in ('conceded','rejected')
     and new.category is not null
     and new.decided_by is not null
     and new.decided_at is not null
     and new.decision_reason is not null
     and new.id = old.id
     and new.invoice_id = old.invoice_id
     and new.raised_by is not distinct from old.raised_by
     and new.grounds = old.grounds
     and new.evidence_storage_paths = old.evidence_storage_paths
     and new.raised_at = old.raised_at
     and new.properly_raised = old.properly_raised then
    return new;
  end if;

  if current_setting('truedeed.dispute_scrub', true) = 'on'
     and new.raised_by is null
     and new.grounds = '[erased]'
     and new.evidence_storage_paths = '{}'::text[]
     and new.id = old.id
     and new.invoice_id = old.invoice_id
     and new.status = old.status
     and new.category is not distinct from old.category
     and new.decided_by is not distinct from old.decided_by
     and new.decided_at is not distinct from old.decided_at
     and new.decision_reason is not distinct from old.decision_reason
     and new.raised_at = old.raised_at
     and new.properly_raised = old.properly_raised then
    return new;
  end if;

  raise exception 'append-only table: UPDATE blocked on invoice_disputes';
end $$;

-- 3. Scrub function — the single mutation path the GUC accepts.
create or replace function public.gdpr_scrub_invoice_disputes(p_user_id uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  perform set_config('truedeed.dispute_scrub', 'on', true);
  update invoice_disputes
     set raised_by = null,
         grounds = '[erased]',
         evidence_storage_paths = '{}'::text[]
   where raised_by = p_user_id;
  get diagnostics v_count = row_count;
  perform set_config('truedeed.dispute_scrub', '', true);
  return v_count;
end $$;

revoke execute on function public.gdpr_scrub_invoice_disputes(uuid)
from public, anon, authenticated;
grant execute on function public.gdpr_scrub_invoice_disputes(uuid)
to service_role;
