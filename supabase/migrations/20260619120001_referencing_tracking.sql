-- Tenant referencing / credit check tracking
-- Extends tenant_applications with provider-agnostic referencing fields.
-- credit_check_status and references_status already exist
-- (20260313000000_landlord_dashboard_extensions.sql) and are reused as-is.

ALTER TABLE IF EXISTS public.tenant_applications
  ADD COLUMN IF NOT EXISTS referencing_external_ref TEXT,
  ADD COLUMN IF NOT EXISTS referencing_provider TEXT,
  ADD COLUMN IF NOT EXISTS referencing_requested_at TIMESTAMPTZ;

-- Look up an application quickly by the provider's external reference when a
-- referencing webhook arrives.
CREATE INDEX IF NOT EXISTS idx_tenant_applications_referencing_external_ref
  ON public.tenant_applications (referencing_external_ref);
