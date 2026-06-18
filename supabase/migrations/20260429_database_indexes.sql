/**
 * Database Performance Indexes — NEUTRALIZED (schema-drift reconciliation)
 *
 * Companion to 20260429000001_rls_policies.sql: another audit *worksheet*
 * committed into supabase/migrations/ by mistake. Every CREATE INDEX targets a
 * table or column that does not exist in the real schema, e.g.:
 *   - public.agencies / public.agents / public.agency_leads
 *   - public.rental_listings / public.tenant_enquiries / public.property_enquiries
 *   - public.provider_quotes / public.provider_reviews / public.service_providers
 *   - public.blog_posts / public.seo_pages / public.invoices
 *   - properties.location / properties.type / properties.agent_id /
 *     properties.status = 'published'  (properties has none of these; status and
 *     price live on listings)
 * As written it fails `supabase db reset` on the first statement.
 *
 * The real performance indexes for the canonical tables are created by their
 * own migrations (20260316100000_buyer_dashboard_indexes,
 * 20260316100001_provider_dashboard_tables, 202603190_backend_blueprint_indexes,
 * etc.). This worksheet is intentionally a no-op.
 *
 * The original worksheet text is preserved in git history.
 */

-- intentionally no-op
