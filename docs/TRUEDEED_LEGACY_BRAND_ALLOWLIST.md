# TrueDeed Legacy Brand Allowlist

Last audited: 2026-06-19.

Purpose: keep `pnpm check:brand` strict for new work while documenting the legacy `Britestate` backlog that still exists in tracked files.

Current no-allowlist baseline:

| Metric | Count |
| --- | ---: |
| Total findings | 1,322 |
| Files with findings | 270 |
| Content findings | 1,318 |
| Filename findings | 3 |
| Unknown binary findings | 1 |
| Text files scanned | 2,720 |
| Files skipped by dependency/build/report/cache/binary rules | 351 |

Rules:

- Remove entries as files are rebranded.
- Do not add broad `src/**` or `scripts/**` entries.
- New source files containing `Britestate` should fail CI unless a concrete, time-limited exception is added here.
- The scanner reads only the block between the markers below.

<!-- TRUEDEED_LEGACY_ALLOWLIST_START -->
```gitignore
# Historical docs, plans, and archived generated review material.
docs/**
.planning/**
.superpowers/**
britv3.0/**

# Root-level historical/reference files.
.env.example
CHANGELOG.md
CLAUDE.md
DESIGN.md
MANUAL_VERIFICATION_CHECKLIST.md
SECURITY_AUDIT_REPORT.md
TODOS.md
britestatestyle.txt
stitch_homepage.html

# Scanner search token and scanner test fixtures.
scripts/check-legacy-brand-references.ts
src/__tests__/ci/check-legacy-brand-references.test.ts

# Existing scripts with legacy operational labels.
scripts/ingest-mobility-scores.ts
scripts/stripe-setup/create-pricing-v2.ts
scripts/stripe-setup/verify-pricing-v2.ts

# Existing E2E/test fixtures with legacy cookies, users, or expected copy.
e2e/auth.setup.ts
e2e/auth.spec.ts
e2e/checklist-link-render.spec.ts
e2e/configured-navigation-render.spec.ts
e2e/dashboard-smoke.spec.ts
e2e/homepage-link-audit.spec.ts
e2e/navigation.spec.ts
e2e/public-page-screenshots.spec.ts
e2e/search.spec.ts
tests/e2e/referral-system.spec.ts
tests/security/rls-audit.sql
tests/security/zap-baseline.sh
tests/security/zap-config.conf

# Existing database/demo records.
supabase/migrations/20260307010000_epic7_property_management.sql
supabase/migrations/20260320000003_fix_test_user_roles.sql
supabase/seed/00_demo_users.sql
supabase/seed/seed-test-users.ts
supabase/seed/seed.sh
supabase/seed/verify.sql

# Current source backlog, exact paths only.
src/__tests__/lib/billing-config.test.ts
src/__tests__/m3/provider-jobs/QuoteBuilderForm.test.tsx
src/__tests__/middleware-subscription-gate.test.ts
src/__tests__/mocks/resend.ts
src/__tests__/navigation/configured-route-targets.test.ts
src/__tests__/navigation/orphan-routes.test.ts
src/__tests__/routes/route-manifest.ts
src/__tests__/services/landlord/tenant-application-service.test.ts
src/app/(main)/legal/acceptable-use/page.tsx
src/app/(main)/legal/accessibility/page.tsx
src/app/(main)/legal/ai-transparency/page.tsx
src/app/(main)/legal/aml-policy/page.tsx
src/app/(main)/legal/complaints/page.tsx
src/app/(main)/legal/cookies/page.tsx
src/app/(main)/legal/data-processing/page.tsx
src/app/(main)/legal/disclaimer/page.tsx
src/app/(main)/legal/fair-housing/page.tsx
src/app/(main)/legal/fee-transparency/page.tsx
src/app/(main)/legal/gdpr-rights/page.tsx
src/app/(main)/legal/modern-slavery/page.tsx
src/app/(main)/legal/page.tsx
src/app/(main)/legal/privacy/page.tsx
src/app/(main)/legal/professional-standards/page.tsx
src/app/(main)/legal/refunds/page.tsx
src/app/(main)/legal/regulatory/page.tsx
src/app/(main)/legal/review-policy/page.tsx
src/app/(main)/legal/terms/page.tsx
src/app/(main)/legal/third-party-services/page.tsx
src/app/(protected)/settings/security/page.tsx
src/app/api/gdpr/export/route.ts
src/app/api/legal/gdpr-request/route.ts
src/app/api/offers/[id]/route.test.ts
src/app/api/provider/invoices/[id]/pdf/route.ts
src/app/api/provider/quotes/[id]/pdf/route.ts
src/app/api/referrals/v2/attribute/route.ts
src/app/api/webhooks/stripe/route.test.ts
src/app/auth/callback/route.ts
src/app/globals.css
src/components/auth/OAuthButtons.tsx
src/components/auth/RegisterForm.tsx
src/components/auth/TwoFactorSetupFlow.tsx
src/components/auth/onboarding/SellerOnboarding.tsx
src/components/compare/useCompare.ts
src/components/dashboard/provider/InvoicePreview.tsx
src/components/dashboard/provider/ProviderSidebar.tsx
src/components/dashboard/provider/QuoteBuilderForm.tsx
src/components/gdpr/ConsentBanner.tsx
src/components/gdpr/DataExportButton.tsx
src/components/layout/Sidebar.tsx
src/components/marketplace/SearchFilters.tsx
src/components/providers/TrustBadges.tsx
src/components/pwa/InstallPrompt.tsx
src/config/navigation.ts
src/hooks/useFormPersistence.ts
src/hooks/useMortgageParams.test.ts
src/hooks/useMortgageParams.ts
src/hooks/useOfflineData.ts
src/inngest/client.ts
src/inngest/functions/jwt-hook-monitor.ts
src/inngest/functions/price-drop-alerts.ts
src/inngest/functions/stripe-webhook-dlq.ts
src/inngest/functions/truedeed-audit-query.ts
src/inngest/functions/truedeed-dispute-emails.ts
src/inngest/functions/truedeed-hash-anchor.ts
src/inngest/functions/truedeed-invoice-emails.ts
src/inngest/functions/truedeed-notify-introduction.ts
src/lib/billing-config.ts
src/lib/constants.ts
src/lib/currency.ts
src/lib/marketplace/__tests__/spam-detector.test.ts
src/lib/mock-data/blog-posts.ts
src/lib/providers/jsonld.ts
src/lib/providers/seo-utils.ts
src/lib/push/push-notifications.test.ts
src/lib/seo/area-jsonld.ts
src/lib/seo/breadcrumb-jsonld.ts
src/lib/seo/navigation-jsonld.ts
src/lib/seo/property-jsonld.ts
src/proxy.ts
src/services/billing/__tests__/billing-service.test.ts
src/services/billing/stripe-event-processor.ts
src/services/referrals/unified-referral-service.ts
```
<!-- TRUEDEED_LEGACY_ALLOWLIST_END -->

