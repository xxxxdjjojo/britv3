-- Widen the provider CHECK on agent_feed_integrations to include
-- csv, sandbox, and generic_feed in addition to the existing CRM providers.
-- Idempotent: drops the constraint if it exists before re-adding it.

ALTER TABLE public.agent_feed_integrations
  DROP CONSTRAINT IF EXISTS agent_feed_integrations_provider_check;

ALTER TABLE public.agent_feed_integrations
  ADD CONSTRAINT agent_feed_integrations_provider_check
    CHECK (provider IN ('reapit', 'alto', 'jupix', 'csv', 'sandbox', 'generic_feed'));
