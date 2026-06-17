/**
 * RLS Policy Remediation SQL — NEUTRALIZED (schema-drift reconciliation)
 *
 * This file was originally an RLS audit *worksheet* meant to be run by hand in
 * the Supabase SQL Editor ("Run these queries to fix RLS gaps..."), not a
 * migration. It was committed into supabase/migrations/ by mistake and breaks
 * `supabase db reset` because every statement targets tables/columns that do
 * not exist in the real schema, e.g.:
 *   - public.agency_leads / public.agents / agency_id   (real: agent_leads.agent_id,
 *     already RLS-protected in 20260313_agent_dashboard.sql)
 *   - provider_quotes.requester_id, rental_listings, tenant_enquiries,
 *     provider_reviews, blog_posts, seo_pages, invoices, audit_logs
 *   - properties.status = 'published' / properties.agent_id (properties has no
 *     status or agent_id column; status/price live on listings)
 * It also re-declares RLS policies that the canonical table migrations already
 * create (profiles, saved_properties, subscriptions, ...), which would collide,
 * and ends with bare SELECT verification queries.
 *
 * The actual RLS for these domains is owned by the canonical migrations
 * (001_foundation, 003001_property_portal, 20260313_agent_dashboard,
 * 20260315000000_billing_tables, 20260316100001_provider_dashboard_tables,
 * 017_public_profiles, the 20260520* GDPR policies, and
 * 20260616170725_harden_admin_rls_and_profile_self_update). This worksheet adds
 * nothing the schema actually needs, so it is intentionally a no-op.
 *
 * The original worksheet text is preserved in git history.
 */

-- intentionally no-op
