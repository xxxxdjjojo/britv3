# Epic 11 (Final): Release Readiness & Deployment Infrastructure

**Epic Number:** E11
**Epic Title:** Release Readiness & Deployment Infrastructure
**Date Created:** May 13, 2025
**Last Updated:** March 7, 2026 (Cost-Optimized Rewrite)
**Target Release:** Phase 7 (Final phase before MVP launch)

---

## 1. Description

This Epic covers everything required to take the Britestate platform from "feature complete" to "confidently launched." It includes production hardening, monitoring setup, testing execution, security review, and launch coordination.

The original spec proposed 6-10 weeks of enterprise DevOps theater: CI/CD for React Native apps that don't exist, AWS infrastructure for self-hosted AI that was killed in Epic 6, five overlapping monitoring tools, LaunchDarkly feature flags, PagerDuty on-call rotations, third-party penetration testing, and formal DR drills for managed SaaS. Total cost: $1,834-3,200/mo + $5,000-20,000 one-time.

This rewrite strips all of that. Production infrastructure is Vercel + Supabase — both managed services that handle their own scaling, DR, and monitoring. CI/CD for the web app is handled by Vercel's built-in git integration (zero setup). AI uses the Claude API (no AWS). The monitoring stack is Sentry Free + PostHog Free + built-in Vercel/Supabase dashboards.

What remains is 2 weeks of focused work: integrate error tracking, run security checks, load test key endpoints, collect UAT feedback, and write a launch runbook. Total new infrastructure cost: $0/mo.

---

## 2. Goals

- Validate the platform meets functional and non-functional requirements through testing and UAT
- Integrate error tracking (Sentry) and product analytics (PostHog) for production visibility
- Verify security posture: RLS policies, dependency vulnerabilities, OWASP Top 10
- Confirm the platform handles expected MVP load (50-200 concurrent users)
- Prepare a simple launch runbook with rollback procedures
- Complete final legal/compliance review (GDPR, disclaimers)
- Launch the Britestate MVP with confidence

---

## 3. Scope

### In Scope

**Monitoring & Error Tracking:**
- Sentry integration for error tracking (free tier: 5K errors/month)
- PostHog integration for product analytics (free tier: 1M events/month)
- Structured logging utility for application code (outputs to Vercel logs)
- Vercel + Supabase built-in dashboards for infrastructure metrics

**CI/CD & Deployment:**
- GitHub Action for Supabase database migrations (one YAML file)
- Vercel handles frontend builds and deploys automatically (already configured)
- Feature flag environment variables for controlled rollout of risky features

**Testing & QA:**
- Artillery load test against key endpoints (100 virtual users, 60 seconds)
- RLS policy audit across all Supabase tables
- OWASP ZAP automated security scan against staging
- GitHub Dependabot for dependency vulnerability scanning
- Manual UAT with 5-10 testers across all user roles
- Cross-browser and responsive verification

**Launch Preparation:**
- Verify Supabase backup and restore process
- Final legal review (Terms, Privacy Policy, Cookie Policy, disclaimers)
- Launch runbook: how to deploy, how to rollback, what to monitor in the first hour
- 1-page internal support runbook for handling early user emails

### Out of Scope

- React Native CI/CD (no native apps exist — Epic 9 is PWA)
- AWS infrastructure (AI uses Claude API per Epic 6 rewrite)
- Datadog, New Relic, Logtail, or any paid monitoring tools
- PagerDuty or formal on-call rotation (1-3 person team uses Sentry email/Slack alerts)
- Third-party penetration testing (defer to Month 6 when there's revenue)
- LaunchDarkly or paid feature flag services
- Terraform/Pulumi IaC (Supabase migrations + vercel.json = your IaC)
- Formal DR drills (managed services handle their own DR)
- Support team training programs (you are the support team)
- Marketing launch campaigns (PM work, not engineering)
- New feature development

---

## 4. User Stories & Acceptance Criteria

### Monitoring & Error Tracking

**Story ID: E11-S01**

**User Story:** As a developer, I want unhandled errors in production automatically captured and reported, so I can fix issues before users report them.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- `@sentry/nextjs` is installed and configured with the Sentry DSN in environment variables
- The root layout is wrapped with Sentry's error boundary
- Client-side errors (unhandled exceptions, promise rejections) are captured automatically
- Server-side errors (API route failures, Server Component errors) are captured automatically
- Each error report includes: stack trace, browser/OS info, user ID (if authenticated), URL, timestamp
- Source maps are uploaded to Sentry during build for readable stack traces
- Sentry Free tier is used (5K errors/month — sufficient for MVP)
- Sentry project is configured with email alerts for new error types

---

**Story ID: E11-S02**

**User Story:** As a product owner, I want key user actions tracked so I can understand how people use the platform after launch.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- PostHog JS snippet is added to the root layout (or `@posthog/next` integration)
- The following events are tracked:
  - `user_signed_up` (with role)
  - `user_logged_in`
  - `property_search` (with filter summary)
  - `property_viewed` (with property ID)
  - `property_saved`
  - `listing_created`
  - `message_sent`
  - `rfq_submitted` (marketplace)
  - `quote_accepted`
  - `calculator_used` (with calculator type)
- PostHog Free tier is used (1M events/month)
- User identification is linked to Supabase auth user ID (no PII in event properties)
- A basic dashboard is created in PostHog: signup funnel, search-to-save conversion, daily active users

---

**Story ID: E11-S03**

**User Story:** As a developer, I want structured application logs so I can diagnose production issues quickly.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- A `lib/logger.ts` utility is created with `log(level, message, context)` function
- Log entries are structured JSON: `{ level, message, timestamp, ...context }`
- Levels: `info`, `warn`, `error`
- Sensitive data (passwords, API keys, PII) is never included in log context
- The logger is used in API routes, server actions, and service functions
- Logs output to `console.log`/`console.error` which Vercel captures automatically
- No external logging service integration at MVP (Vercel logs are sufficient)

---

### CI/CD & Deployment

**Story ID: E11-S04**

**User Story:** As a developer, I want database migrations to deploy automatically when I push to main, so I don't have to run them manually.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- A GitHub Action workflow file (`.github/workflows/migrate.yml`) is created
- On push to `main`, the action runs `supabase db push` against the production Supabase project
- Supabase project ID and service role key are stored as GitHub Actions secrets
- The action reports success/failure in the GitHub Actions UI
- Frontend deployment continues to use Vercel's built-in git integration (no custom CI needed)
- The workflow includes a manual trigger option (`workflow_dispatch`) for ad-hoc migration runs

---

**Story ID: E11-S05**

**User Story:** As a developer, I want to toggle risky features on/off without redeploying, so I can control the rollout.

**Priority:** Should
**Status:** To Do

**Acceptance Criteria:**
- A `lib/features.ts` file exports a `features` object reading from environment variables:
  ```typescript
  export const features = {
    aiSearch: process.env.NEXT_PUBLIC_ENABLE_AI_SEARCH === "true",
    marketplace: process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE === "true",
    aiRecommendations: process.env.NEXT_PUBLIC_ENABLE_AI_RECS === "true",
  } as const;
  ```
- Features identified as higher-risk are wrapped in conditional checks using this object
- Toggling a feature: change the env var in Vercel dashboard, trigger redeploy (30 seconds)
- No LaunchDarkly, no third-party feature flag service
- Upgrade path documented: when percentage rollouts are needed, use PostHog's free feature flags (already integrated for analytics)

---

### Testing & Security

**Story ID: E11-S06**

**User Story:** As a developer, I want all RLS policies verified to ensure no data leaks between users or roles.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- Every Supabase table with user data has RLS enabled (verified via SQL query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity`)
- Each RLS policy is manually reviewed against the expected access pattern:
  - Users can only read/write their own data
  - Agents can see their own listings and associated buyer/renter data
  - Providers can see their own service listings and received RFQs
  - Landlords can see their own properties and associated tenant data
  - Admin role can access all data through admin-specific policies
- Test cases are written and executed using Supabase's `service_role` key (bypasses RLS) and `anon` key (respects RLS) to verify:
  - User A cannot read User B's messages, saved properties, or profile details
  - An agent cannot see another agent's listings
  - A provider cannot see another provider's quotes
- Any policy gaps found are fixed and re-tested
- Results documented in a security review log

---

**Story ID: E11-S07**

**User Story:** As a developer, I want known vulnerabilities in our dependencies identified automatically.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- GitHub Dependabot is enabled in the repository settings (Security > Dependabot alerts)
- Dependabot security updates are enabled (auto-creates PRs for vulnerable dependencies)
- Any existing critical or high-severity alerts are reviewed and resolved before launch
- No additional dependency scanning tools (Snyk, etc.) — Dependabot is sufficient at MVP

---

**Story ID: E11-S08**

**User Story:** As a developer, I want an automated security scan run against the application to catch common web vulnerabilities.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- OWASP ZAP is run in automated scan mode against the staging deployment URL
- The scan covers OWASP Top 10 categories: XSS, injection, broken auth, security misconfiguration, etc.
- Critical and high-severity findings are triaged and fixed
- Medium-severity findings are documented for post-launch remediation
- CSP headers (from Epic 1 middleware) are verified as correctly configured
- No secrets or API keys are exposed in client-side JavaScript bundles (verified via source inspection)
- Security scan report is saved for reference
- No third-party penetration testing at MVP (defer to Month 6 when budget allows)

---

**Story ID: E11-S09**

**User Story:** As a developer, I want to verify the platform handles expected MVP traffic without degradation.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- Artillery is installed and configured with a test scenario targeting 5 key endpoints:
  - `GET /` (home page)
  - `GET /search?q=london` (property search)
  - `GET /properties/[id]` (property detail)
  - `POST /api/auth/login` (authentication)
  - `GET /api/properties` (API endpoint)
- Test configuration: 100 virtual users, ramp up over 30 seconds, sustain for 60 seconds
- Test is run against the Vercel staging/preview deployment
- Pass criteria:
  - Average response time < 2 seconds
  - 95th percentile response time < 5 seconds
  - Error rate < 1%
- Results are documented (Artillery generates a JSON/HTML report)
- Any endpoints failing the criteria are investigated and optimized
- No k6 Cloud, JMeter, or paid load testing infrastructure

---

### User Acceptance Testing

**Story ID: E11-S10**

**User Story:** As a product owner, I want real people to test the platform before launch so I can catch usability issues and critical bugs.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- Staging environment is seeded with realistic test data:
  - 10-20 property listings across different types (sale, rent) and locations
  - 5-10 service provider profiles across different categories
  - 3-5 user accounts per role (homebuyer, renter, seller, landlord, agent, provider)
- A Notion page (or Google Doc) is created with test scenarios per role:
  - Homebuyer: search properties, save favorites, use mortgage calculator, send message to agent
  - Renter: search rentals, filter by budget, contact landlord
  - Seller: create listing, manage photos, respond to inquiries
  - Landlord: add property, view tenant applications, maintenance requests
  - Agent: manage listings, respond to leads, view analytics
  - Provider: create service listing, receive and respond to RFQs, submit quotes
- Staging URL is shared with 5-10 testers (friends, family, contacts representing different roles)
- Feedback is collected for 1 week in the shared document
- Critical bugs (blocking core flows) are fixed before launch
- Usability feedback is triaged: critical fixes pre-launch, cosmetic issues deferred to post-launch
- No formal UAT plan document, no stakeholder sign-off ceremony — just real testing and real fixes

---

### Cross-Browser & Responsive Verification

**Story ID: E11-S11**

**User Story:** As a developer, I want to verify the platform works correctly across major browsers and screen sizes before launch.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- Key user flows are manually tested on:
  - Chrome (latest), Firefox (latest), Safari (latest), Edge (latest)
  - Mobile: iOS Safari, Android Chrome
- Responsive breakpoints verified: 320px, 375px, 768px, 1024px, 1280px
- No layout breaks, no horizontal scrolling, no cut-off text at any breakpoint
- Forms are usable on mobile (correct input types, adequate tap targets)
- Map interactions work on touch devices
- Any issues found are fixed before launch

---

### Launch Preparation

**Story ID: E11-S12**

**User Story:** As a developer, I want Supabase backups verified so I know data can be restored if something goes wrong.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- Supabase Pro plan's daily backups are confirmed as active in the Supabase Dashboard
- Point-in-Time Recovery (PITR) is enabled ($25/mo add-on on Pro — included in existing Supabase costs)
- A test restore is performed to a Supabase branch database to verify the backup is valid
- The restore process is documented in the launch runbook (which button to click, expected restore time)
- No formal DR drills, no simulated failure scenarios — Supabase and Vercel handle their own infrastructure DR

---

**Story ID: E11-S13**

**User Story:** As a legal/compliance officer, I want a final review of the platform against regulations before launch.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- Terms & Conditions (from Epic 1) are reviewed and finalized
- Privacy Policy (from Epic 1) accurately describes all data collection and processing
- Cookie Policy and consent banner are functional and compliant
- GDPR compliance verified:
  - Users can export their data (data portability)
  - Users can request account deletion (right to erasure)
  - Consent is collected before non-essential data processing
  - Data processing purposes are clearly stated
- Payment processing disclaimer confirms PCI DSS compliance is handled by Stripe (no card data touches our servers)
- Financial calculator disclaimers are in place: "This is an estimate for illustration purposes only"
- AVM/property valuation disclaimers are in place (if applicable)
- Property listing disclaimers: "Information provided by the advertiser. Verify independently."

---

**Story ID: E11-S14**

**User Story:** As a developer, I want a simple launch runbook so the launch process is clear and repeatable.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- A single-page launch runbook document is created covering:
  - **Pre-launch checklist:**
    - All E11 stories completed
    - Critical UAT bugs fixed
    - Sentry and PostHog receiving events on staging
    - Supabase backups verified
    - Environment variables set in Vercel production
    - DNS configured for production domain
    - SSL certificate active (Vercel handles automatically)
  - **Launch steps:**
    - Merge main to production branch (or deploy main to Vercel production)
    - Run Supabase migration against production (`supabase db push`)
    - Verify the production URL loads correctly
    - Check Sentry for any immediate errors
    - Check PostHog for incoming events
    - Monitor for 1 hour
  - **Rollback procedure:**
    - Revert Vercel deployment (one click in Vercel dashboard: Deployments > previous > Redeploy)
    - If database migration caused issues: restore from Supabase PITR
  - **First-week monitoring:**
    - Check Sentry daily for new error types
    - Check PostHog daily for user engagement
    - Respond to support emails within 24 hours
- The runbook is stored in the repo (`docs/launch-runbook.md`)

---

**Story ID: E11-S15**

**User Story:** As the founder (who is also the support team), I want a simple guide for handling early user support, so I can respond effectively.

**Priority:** Should
**Status:** To Do

**Acceptance Criteria:**
- A 1-page internal support runbook is created covering:
  - Support email address: `support@britestate.com`
  - Common issues and how to resolve them:
    - Password reset: direct user to "Forgot Password" flow
    - Account stuck: check user record in Supabase Dashboard > Authentication
    - Listing not appearing: check listing status in Supabase Dashboard > Table Editor
    - Payment issue: check Stripe Dashboard
  - How to look up a user in Supabase Dashboard
  - Escalation: if it's a bug, create a GitHub issue
  - Response time target: within 24 hours on business days
- No SOPs, SLAs, knowledge bases, or training programs — those come when you hire support staff
- No custom ticket system — use the contact form (from Epic 10) which sends email, then reply via email

---

## 5. Acceptance Criteria (Epic-Level)

1. Sentry is capturing errors from both client and server in staging/production
2. PostHog is tracking key user events with a basic analytics dashboard
3. Structured logging is implemented across API routes and services
4. GitHub Action deploys Supabase migrations on push to main
5. All RLS policies audited and verified with test cases
6. Dependabot enabled with no unresolved critical vulnerabilities
7. OWASP ZAP scan completed with critical findings resolved
8. Artillery load test passes (< 2s avg response, < 1% error rate at 100 VUs)
9. UAT completed with 5-10 testers; critical bugs fixed
10. Cross-browser testing passes on Chrome, Firefox, Safari, Edge, iOS, Android
11. Supabase backup verified with successful test restore
12. Legal/compliance review completed (GDPR, disclaimers, terms)
13. Launch runbook documented and stored in repo
14. Total new monthly infrastructure cost: $0 (all free tiers)

---

## 6. Dependencies

- **Epics 1-10:** All preceding epics must be substantially complete — Epic 11 validates and launches what's already built, it does not add features
- **Supabase Pro plan:** Required for PITR backups ($25/mo — already budgeted)
- **Vercel Pro plan:** Required for production deployment ($20/mo — already budgeted)
- **Sentry account:** Free tier, requires sign-up and project creation
- **PostHog account:** Free tier, requires sign-up and project creation
- **Production domain:** DNS must be configured and pointing to Vercel
- **Staging environment:** Vercel preview deployments serve as staging (automatic)

---

## 7. Technical Implementation

### Sentry Integration

```
Install: pnpm add @sentry/nextjs
Setup: npx @sentry/wizard@latest -i nextjs
Files created:
  - sentry.client.config.ts (client-side initialization)
  - sentry.server.config.ts (server-side initialization)
  - sentry.edge.config.ts (edge runtime initialization)
  - instrumentation.ts (Next.js instrumentation hook)
Env vars:
  - SENTRY_DSN (client + server)
  - SENTRY_AUTH_TOKEN (build-time, for source map upload)
  - SENTRY_ORG, SENTRY_PROJECT (build-time)
```

Source maps are uploaded during `pnpm build` via the Sentry webpack plugin (configured automatically by the wizard).

### PostHog Integration

```
Install: pnpm add posthog-js @posthog/next
Setup:
  - Add PostHogProvider to root layout
  - Configure with NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST
  - Track custom events via posthog.capture('event_name', { properties })
  - Identify users on login: posthog.identify(userId, { role })
```

### Structured Logger

```typescript
// lib/logger.ts
type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...context };
  if (level === "error") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
```

20 lines. Outputs structured JSON to Vercel's built-in log viewer. No external service.

### GitHub Action for Migrations

```yaml
# .github/workflows/migrate.yml
name: Supabase Migrate
on:
  push:
    branches: [main]
    paths: [supabase/migrations/**]
  workflow_dispatch:

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

One file. Triggers only when migrations change. 15 minutes to set up.

### Feature Flags

Environment variables in Vercel. Read by a `lib/features.ts` module. Toggle in Vercel Dashboard. Redeploy takes 30 seconds. Upgrade path: PostHog free feature flags when percentage rollouts are needed.

---

## 8. Infrastructure Cost

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Sentry | $0 | Free tier: 5K errors/month |
| PostHog | $0 | Free tier: 1M events/month |
| Structured logging | $0 | Uses Vercel built-in logs |
| GitHub Actions | $0 | Free for public repos, 2K min/mo for private |
| Dependabot | $0 | Built into GitHub |
| OWASP ZAP | $0 | Open source, run once |
| Artillery | $0 | Open source, run locally |
| Feature flags (env vars) | $0 | Vercel environment variables |
| Supabase PITR | $0 | Included in Pro plan already budgeted |
| **Total** | **$0/month** | |

Compare to original spec: **$1,834-3,200/month** + $5,000-20,000 one-time (penetration testing).

---

## 9. Timeline

| Week | Activities |
|------|-----------|
| **Week 1** | Sentry integration (half day), PostHog integration (half day), structured logger (30 min), GitHub Action for migrations (15 min), enable Dependabot (5 min), feature flag env vars (30 min), seed staging data (half day), RLS policy audit begins (ongoing through week) |
| **Week 2** | OWASP ZAP scan + fix critical findings (1 day), Artillery load test (half day), verify Supabase backup restore (1 hour), cross-browser testing (1 day), legal/compliance review (1 day), write launch runbook (1 hour), write support runbook (1 hour) |
| **Weeks 2-3** | UAT: share staging URL with testers, collect feedback for 1 week |
| **Week 3** | Fix critical UAT bugs, final verification, launch |

**Total engineering effort: 8-12 days** (compared to 30-50 days in original spec).

---

## 10. What Was Removed and Why

| Original Story | Removed | Rationale |
|---------------|---------|-----------|
| React Native CI/CD (S02) | Yes | No native apps exist — Epic 9 is PWA. Build mobile CI/CD when mobile apps are built. |
| AWS AI infrastructure (S03) | Yes | Killed in Epic 6 cost analysis. AI uses Claude API, not self-hosted LLM. No AWS to harden. |
| Datadog APM (S08) | Yes | $31/host/month. Vercel built-in analytics + Sentry cover MVP needs. Add at 50K+ DAU. |
| New Relic APM (S08) | Yes | Overlaps with Sentry + Vercel. Not needed at zero users. |
| Logtail/centralized logging (S07) | Yes | $24/month. Vercel logs + structured console.log is sufficient at MVP. |
| PagerDuty on-call (S08) | Yes | $21/user/month. At 1-3 people, Sentry email/Slack alerts are your on-call. |
| AWS CloudWatch (S07) | Yes | No AWS infrastructure exists. |
| LaunchDarkly feature flags (S13) | Yes | $10-1,250/month. Environment variables + PostHog free flags cover MVP. |
| Third-party pentest (S05) | Yes | $5,000-20,000. Defer to Month 6 when there's revenue and users worth protecting. |
| Formal DR drill (S03) | Yes | Managed services (Vercel/Supabase) handle their own DR. Verify backup restore works, move on. |
| IaC / Terraform (S03) | Yes | Supabase migrations + vercel.json = your IaC. No cloud resources to provision. |
| Support team training (S10) | Yes | You are the support team. Write a 1-page runbook, not a training program. |
| Formal UAT program (S06) | Simplified | No UAT plan document or stakeholder sign-off. Send staging URL to testers, collect feedback, fix bugs. |
| Marketing launch plan (S11) | Yes | PM work, not engineering. Out of scope for this epic. |
| k6 Cloud / JMeter (S04) | Yes | Artillery run locally is sufficient for MVP load testing. Add k6 when expecting spiky traffic. |
| Snyk (S05) | Yes | Overlaps with GitHub Dependabot (free, built-in). |
| Master Test Plan document (S01) | Yes | Tests are written per-epic. Epic 11 runs them, doesn't re-document them. |

---

## 11. QA & Testing Strategy

This epic IS the final testing pass. The testing work here validates everything built in Epics 1-10.

**Automated tests (already written per-epic):**
- Run full unit test suite: `pnpm test`
- Run full E2E test suite: `pnpm test:e2e`
- All tests must pass before launch. Fix any regressions found.

**Security testing (this epic):**
- RLS policy audit: manual review + automated test cases (E11-S06)
- OWASP ZAP scan: automated, fix critical/high findings (E11-S08)
- Dependency scan: Dependabot alerts resolved (E11-S07)
- Secrets check: no API keys in client bundles

**Performance testing (this epic):**
- Artillery load test: 100 VUs, key endpoints, pass criteria defined (E11-S09)
- Lighthouse audit: verify Core Web Vitals meet targets from Epic 9

**Manual testing (this epic):**
- UAT with real testers across all roles (E11-S10)
- Cross-browser and responsive verification (E11-S11)

**What's NOT in testing scope:**
- Setting up test infrastructure (already done per-epic)
- Writing new unit/integration tests for existing features (done per-epic)
- Performance testing at 10K+ concurrent users (not expected at MVP launch)

---

## 12. Post-Launch Monitoring Plan

The first month after launch, monitor with the tools set up in this epic:

| Tool | Check | Frequency |
|------|-------|-----------|
| Sentry | New error types, error spike alerts | Daily (email alerts) |
| PostHog | Signup funnel, daily active users, key event counts | Daily |
| Vercel Dashboard | Build failures, serverless function errors, Web Vitals | Weekly |
| Supabase Dashboard | Database performance, auth logs, storage usage | Weekly |
| Support email | User-reported issues | Within 24 hours |

**Escalation triggers (add tooling):**
- Error rate > 5% sustained for 1 hour: investigate immediately
- Response times > 5s on key endpoints: investigate Supabase query performance
- 50K+ DAU reached: evaluate Datadog/New Relic for APM
- First support hire: set up Freshdesk Free (10 agents)
- Marketing push planned: run proper k6 load test beforehand

---

*Original spec: epic11.txt (May 13, 2025)*
*Cost analysis: epic11costanalysis.md (March 7, 2026)*
*This rewrite: March 7, 2026*
*Key changes: Removed React Native CI/CD (no apps), AWS infrastructure (Claude API), 5 paid monitoring tools (use free tiers), LaunchDarkly ($10-1,250/mo), third-party pentest ($5-20K), formal DR drills (managed SaaS), support training (you are support). Kept: Sentry Free, PostHog Free, GitHub Action for migrations, RLS audit, OWASP ZAP scan, Artillery load test, manual UAT, feature flag env vars, backup verification, legal review, launch runbook. Total infrastructure cost: $0/mo. Dev time: 2 weeks instead of 6-10.*
