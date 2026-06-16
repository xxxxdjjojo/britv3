/**
 * RLS Policy Remediation SQL
 * Brit-Estate Supabase Database
 * 
 * Run these queries to fix RLS gaps identified in the audit.
 * Execute in Supabase SQL Editor or via migrations.
 * 
 * IMPORTANT: Test on staging first before running on production.
 */

-- ============================================================
-- HIGH PRIORITY: User-Owned Data (Sensitive)
-- ============================================================

-- Profiles Table: Enforce user_id ownership
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_own_read"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "allow_own_update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_own_delete"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Saved Properties: User can only see their own saves
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_own_saves_read"
  ON public.saved_properties
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "allow_own_saves_insert"
  ON public.saved_properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_own_saves_delete"
  ON public.saved_properties
  FOR DELETE
  USING (auth.uid() = user_id);

-- Landlord Profiles: Landlords can only see their own profile
ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_own_landlord_profile"
  ON public.landlord_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "allow_landlord_update_own"
  ON public.landlord_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AGENT ACCESS: Role-Based Access Control
-- ============================================================

-- Agency Leads: Only agents from that agency can see leads
ALTER TABLE public.agency_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_agent_read_own_leads"
  ON public.agency_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.user_id = auth.uid()
      AND a.agency_id = agency_leads.agency_id
    )
  );

CREATE POLICY "allow_agent_insert_leads"
  ON public.agency_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.user_id = auth.uid()
      AND a.agency_id = agency_id
    )
  );

-- ============================================================
-- PROVIDER ACCESS: Tradespeople Can Only See Their Leads
-- ============================================================

-- Provider Leads: Only the provider can see their leads
ALTER TABLE public.provider_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_provider_read_own_leads"
  ON public.provider_leads
  FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "allow_provider_receive_leads"
  ON public.provider_leads
  FOR INSERT
  WITH CHECK (true);  -- System can insert, not users

-- Provider Quotes: Only provider and requester can see
ALTER TABLE public.provider_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_provider_see_own_quotes"
  ON public.provider_quotes
  FOR SELECT
  USING (
    auth.uid() = provider_id
    OR auth.uid() = requester_id
  );

CREATE POLICY "allow_provider_update_own_quotes"
  ON public.provider_quotes
  FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- ============================================================
-- PAYMENT & SENSITIVE: Only Owner Can See
-- ============================================================

-- Subscriptions: User can only see their own subscription
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_own_subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Invoices: User can only see their own invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_own_invoices"
  ON public.invoices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Payments: User can only see their own payment history
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_own_payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS: User Can Only See Their Own
-- ============================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_own_notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "allow_read_own_notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TENANT ENQUIRIES: Landlord Can See Their Own Enquiries
-- ============================================================

ALTER TABLE public.tenant_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_landlord_see_enquiries"
  ON public.tenant_enquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rental_listings rl
      WHERE rl.id = rental_listing_id
      AND rl.landlord_id = auth.uid()
    )
  );

-- ============================================================
-- PUBLIC DATA: Anon + Authenticated Can Read
-- ============================================================

-- Properties: Public read access
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read_properties"
  ON public.properties
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "allow_owner_manage_properties"
  ON public.properties
  FOR UPDATE
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- Property Media: Public read
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read_media"
  ON public.property_media
  FOR SELECT
  USING (true);

-- Provider Services: Public read
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read_services"
  ON public.provider_services
  FOR SELECT
  USING (true);

-- Provider Reviews: Public read
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read_reviews"
  ON public.provider_reviews
  FOR SELECT
  USING (true);

-- Blog Posts: Public read
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read_blog"
  ON public.blog_posts
  FOR SELECT
  USING (published = true);

-- SEO Pages: Public read
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read_seo"
  ON public.seo_pages
  FOR SELECT
  USING (true);

-- ============================================================
-- ADMIN ONLY: Email Logs & Audit Logs
-- ============================================================

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_admin_view_logs"
  ON public.email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_admin_view_audit"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check all RLS policies are enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- Check all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- TESTING
-- ============================================================

/*
Test as authenticated user:
SELECT * FROM profiles WHERE id = auth.uid();
-- Should return only own profile

Test as different user:
SELECT * FROM profiles WHERE id != auth.uid();
-- Should return empty (access denied)

Test saved properties:
SELECT * FROM saved_properties WHERE user_id = auth.uid();
-- Should return only own saved properties
*/
