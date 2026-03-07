-- RLS Policy Audit Queries for Britestate
-- Run these queries against the Supabase database to audit Row-Level Security coverage.
-- All tables in the public schema must have RLS enabled and at least one policy.

-- ============================================================
-- Query 1: Find all tables WITHOUT RLS enabled
-- Expected result: EMPTY (zero rows) for a secure database
-- ============================================================
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT relname
  FROM pg_class
  WHERE relrowsecurity = true
)
ORDER BY tablename;

-- ============================================================
-- Query 2: List all RLS policies per table
-- Use this to review what policies exist and their coverage
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- Query 3: Tables with RLS enabled but NO policies (security hole)
-- Tables with RLS enabled but no policies DENY ALL access by default.
-- This may be intentional (service-role-only tables) or a mistake.
-- Expected result: EMPTY unless intentionally service-role-only tables exist.
-- ============================================================
SELECT c.relname AS tablename
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relkind = 'r'
AND c.relrowsecurity = true
AND c.relname NOT IN (
  SELECT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
)
ORDER BY c.relname;

-- ============================================================
-- Query 4: Summary counts per table (RLS status + policy count)
-- Use this for the audit report
-- ============================================================
SELECT
  t.tablename,
  CASE
    WHEN c.relrowsecurity = true THEN 'ENABLED'
    ELSE 'DISABLED'
  END AS rls_status,
  COALESCE(p.policy_count, 0) AS policy_count
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
LEFT JOIN (
  SELECT tablename, COUNT(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
ORDER BY
  CASE WHEN c.relrowsecurity = true THEN 0 ELSE 1 END,
  t.tablename;

-- ============================================================
-- Query 5: Verify specific sensitive tables have RLS
-- These are the highest-risk tables that MUST have RLS enabled
-- ============================================================
SELECT
  c.relname AS tablename,
  CASE WHEN c.relrowsecurity = true THEN 'PASS' ELSE 'FAIL' END AS rls_check
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relkind = 'r'
AND c.relname IN (
  'profiles',
  'properties',
  'messages',
  'bookings',
  'push_subscriptions',
  'content_reports',
  'tenancies',
  'rent_payments',
  'expenses',
  'compliance_documents',
  'conversations',
  'provider_profiles',
  'rfqs',
  'rfq_responses',
  'maintenance_requests'
)
ORDER BY
  CASE WHEN c.relrowsecurity = true THEN 0 ELSE 1 END,
  c.relname;
