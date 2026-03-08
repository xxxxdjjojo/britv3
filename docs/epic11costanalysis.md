# Epic 11 Cost Audit: The "Launch Readiness" Epic That Costs More Than The Product It's Launching

## Context

Analysis of `epic11.txt` -- Release Readiness & Deployment Infrastructure. Cross-referenced against `brit estate prd 2026.txt` and the cost patterns established in Epics 1-10. Epic 11 is the most dangerous kind of spec: it sounds essential ("we need to be launch-ready!") while hiding $2,000-5,000/mo in unnecessary tooling, phantom infrastructure for products that don't exist, and enterprise-grade processes for a team of 1-3 people.

---

## The Core Problem: Epic 11 Prepares to Launch a Fortune 500 Product, Not an MVP

The spec bundles:
1. **Legitimate launch prep** (S01, S04, S06, S12) -- Testing, load testing, UAT, compliance review. Yes, do these.
2. **Enterprise DevOps theater** (S02, S03, S07, S08) -- Multi-environment CI/CD for web + mobile + backend, Datadog/New Relic APM, centralized logging with Logtail, PagerDuty on-call rotation. You have 0 users and 1-3 engineers.
3. **Phantom infrastructure** (S03) -- "AWS for AI" was killed in the Epic 6 cost analysis. "React Native mobile apps" don't exist -- the PRD's Epic 9 is responsive design + PWA. Yet S02 and S03 reference CI/CD and infrastructure for mobile apps that were never built.
4. **Premature process** (S10, S11, S13) -- Support team training (you ARE the support team), marketing launch plans (PM work, not engineering), LaunchDarkly feature flags ($10-1000+/mo).

---

## 1. CI/CD for "Mobile Apps" That Don't Exist -- BUILDING FOR GHOSTS

**Source:** E11-S02

The spec says: "A CI/CD pipeline is configured for the frontend (Next.js web app), backend (Supabase functions/migrations, any custom services), and **mobile apps (React Native)**."

There are no React Native mobile apps. The PRD's Epic 9 is "Mobile & Responsive Design" -- which means making the Next.js web app responsive and adding PWA capabilities. Not building native apps. The roadmap puts native mobile apps in Phase 3 (Months 4-6), post-launch.

Building CI/CD for React Native means:
- iOS build configuration (Xcode, provisioning profiles, certificates)
- Android build configuration (Gradle, signing keys)
- Fastlane or EAS Build setup
- App Store / Play Store deployment automation
- Two additional test suites (iOS + Android)

| Component | Dev Time | Monthly Cost |
|-----------|----------|-------------|
| EAS Build (Expo) | 3-5 days setup | $0-99/mo depending on builds |
| Fastlane + GitHub Actions | 5-8 days setup | $0 (but macOS runners are $0.08/min) |
| Apple Developer Account | 1 day | $99/year |
| Google Play Console | 1 day | $25 one-time |
| **Total** | **5-10 days** | **$8-107/mo** |

You're about to spend 1-2 weeks building deployment infrastructure for an application that doesn't exist.

**Recommendation:**
- **Remove all React Native CI/CD from Epic 11.** It belongs in Phase 3 when native apps are actually built.
- For the Next.js web app, you need ONE pipeline: `pnpm lint` -> `pnpm build` -> deploy to Vercel. Vercel does this automatically on git push. **Zero CI/CD setup required for the web app** -- Vercel's built-in CI handles builds, previews, and production deploys out of the box.
- For Supabase migrations: `supabase db push` in a GitHub Action. One YAML file, 15 minutes of setup.
- **Savings:** 5-10 days of dev time + eliminates phantom infrastructure.

---

## 2. "AWS for AI" Infrastructure -- ALREADY KILLED IN EPIC 6

**Source:** E11-S03

The spec says: "Finalization and hardening of production environments (Supabase, **AWS for AI**, Vercel for frontend)."

The Epic 6 cost analysis conclusively killed self-hosted AI on AWS:
- Self-hosted DeepSeek on AWS: **~$1,700/mo at zero users**
- Claude Haiku API for same workload: **~$6/mo**
- Break-even point: 280,000+ API requests/month (post product-market fit)

There is no AWS AI infrastructure to harden because it should never be built. The AI features use Claude API via the Anthropic SDK (as specified in CLAUDE.md).

**Recommendation:**
- **Remove all AWS references from Epic 11.** Production infrastructure is: Supabase (database, auth, storage, realtime) + Vercel (frontend, serverless functions). That's it.
- "Hardening" Supabase and Vercel means: enabling Supabase's built-in Point-in-Time Recovery ($25/mo on Pro), confirming RLS policies (already done per-epic), and enabling Vercel's production protection (free on Pro). **2 hours of work, not days.**
- **Savings:** Eliminates an entire infrastructure tier ($1,700+/mo) and days of DevOps work.

---

## 3. Monitoring Stack: Datadog + New Relic + Sentry + PostHog + PagerDuty -- FIVE TOOLS FOR ZERO USERS

**Source:** E11-S07, E11-S08

The spec mentions: Sentry, Datadog, New Relic, PostHog, AWS CloudWatch, Logtail, and PagerDuty. Let's price the "enterprise" monitoring stack:

| Tool | Purpose | Monthly Cost | Free Tier |
|------|---------|-------------|-----------|
| Sentry | Error tracking | $26/mo (Team) | Yes -- 5K errors/mo |
| Datadog | APM + logs | $31/host/mo minimum | 14-day trial only |
| New Relic | APM | $0.35/GB ingested | 100GB free/mo |
| PostHog | Analytics | $0 | Yes -- 1M events/mo |
| PagerDuty | On-call alerting | $21/user/mo | 14-day trial only |
| Logtail (Better Stack) | Centralized logging | $24/mo | Yes -- 1GB/mo |
| AWS CloudWatch | Infrastructure monitoring | $3-50/mo | Only if using AWS |

**The spec doesn't pick one -- it lists all of them.** A developer reading this will integrate 3-4 of these, creating:
- 3-4 dashboards nobody checks
- 3-4 alert configurations that fire into the void
- 3-4 SDK integrations adding bundle size
- $100-200/mo in monitoring costs before a single user signs up

**What Vercel already gives you (free on Pro):**
- Web Vitals monitoring (LCP, FID, CLS)
- Serverless function logs
- Deployment analytics
- Build error tracking

**What Supabase already gives you (included in Pro):**
- Database query performance monitoring
- Auth logs
- API request logs
- Realtime connection metrics

**What you actually need at MVP:**
1. **Sentry Free Tier** (5K errors/month) -- for error tracking. This is the only external monitoring tool you need at launch.
2. **PostHog Free Tier** (1M events/month) -- for product analytics. Already in the tech stack per CLAUDE.md.
3. **Vercel built-in analytics** -- for performance monitoring.
4. **Supabase Dashboard** -- for infrastructure metrics.

**Total monitoring cost at MVP: $0/mo.**

**Recommendation:**
- **Sentry Free + PostHog Free + Vercel/Supabase built-in dashboards.** That's your entire monitoring stack.
- No Datadog. No New Relic. No Logtail. No PagerDuty. No AWS CloudWatch.
- PagerDuty is for teams with on-call rotations. At 1-3 people, you set up Sentry to send email/Slack alerts. When an error spikes, you see it in Slack. That's your "on-call rotation."
- Add Datadog/New Relic when you have 50K+ DAU and the free tiers are genuinely insufficient. That's a Month 6-12 decision.
- **Savings:** $100-200/mo in tools + 3-5 days of integration work.

---

## 4. Centralized Logging Solution -- YOU ALREADY HAVE IT

**Source:** E11-S07

The spec wants "structured logging centralized in a log management system (e.g., Supabase Logs, AWS CloudWatch, or a dedicated service like Logtail/Datadog)."

The answer is right there in the spec's own suggestion: **Supabase Logs.** You're already paying for it.

- Vercel logs serverless function output (free, 1-hour retention on Pro, extended with Vercel Log Drains)
- Supabase logs all database queries, auth events, and API requests (included in Pro)
- `console.log` / `console.error` in your Next.js code shows up in Vercel logs

The only thing missing is **structured logging format** in your application code. That's a utility function, not a new service:

```typescript
// lib/logger.ts -- This is your entire "centralized logging solution"
export function log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...context };
  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
```

**Dev time: 30 minutes.** Not days. Not a new service.

**Recommendation:**
- Use Vercel + Supabase built-in logging. Add structured JSON logging to your app code (30 min).
- If you need log persistence beyond 1 hour (Vercel's default), set up a Vercel Log Drain to Supabase (free) or Better Stack's free tier (1GB/mo). **1 hour of setup.**
- Don't integrate Datadog, Logtail, or CloudWatch at MVP. They solve problems you don't have yet.
- **Savings:** 2-3 days of integration work + $24-50/mo in tooling.

---

## 5. Load Testing Tools -- RIGHT IDEA, WRONG SCALE

**Source:** E11-S04

The spec mentions k6, JMeter, and Artillery. All solid tools. But the acceptance criteria says "simulate expected concurrent user load for MVP launch."

**Your MVP concurrent user load is: 50-200 users.** Maybe 500 on a good day. You're not launching to 10,000 concurrent users on day one.

| Tool | Cost | Complexity | Right for MVP? |
|------|------|-----------|---------------|
| k6 (local) | Free | Medium | Yes -- but overkill |
| k6 Cloud | $0-99/mo | Low | Unnecessary |
| JMeter | Free | High (Java, XML configs) | No -- too complex |
| Artillery | Free | Low | Yes |
| **Playwright load test** | Free | Already have it | Best -- reuse E2E tests |

**What you actually need:**
- Open 5 browser tabs. Click around. Does it feel fast? Good.
- Run your Playwright E2E tests in parallel (3-5 workers). If they pass without timeouts, your MVP handles 50 concurrent users.
- If you want actual numbers: run Artillery with 100 virtual users hitting your search endpoint for 60 seconds. One command, one config file. 15 minutes.

**What you don't need:**
- k6 Cloud dashboards
- JMeter test plans with 50 scenarios
- Load testing infrastructure that takes days to set up
- Simulating 10,000 concurrent users when you'll have 50

**Recommendation:**
- **Run Artillery locally** against your Vercel preview deployment. 100 VUs, 60 seconds, key endpoints (search, auth, listing detail). **Half a day including analysis.**
- Document the results. If response times are under 2s at 100 VUs, you're fine for MVP.
- Add proper load testing (k6 with cloud recording) when you're preparing for a marketing push that could bring spiky traffic. Not at MVP launch to friends and family.
- **Savings:** 2-3 days of test infrastructure setup.

---

## 6. Security Testing -- MOSTLY FREE, BUT SCOPE IT

**Source:** E11-S05

The spec mentions OWASP ZAP, Snyk, Dependabot, and "basic penetration testing." Let's break this down:

| Tool | Cost | Value | Recommendation |
|------|------|-------|---------------|
| **Dependabot** | Free (GitHub built-in) | High -- catches vulnerable deps | Enable it (5 min) |
| **Snyk** | Free tier (200 tests/mo) | Medium -- overlaps Dependabot | Skip -- Dependabot is sufficient |
| **OWASP ZAP** | Free | Medium -- automated scan | Run once before launch (2 hours) |
| **Third-party pentest** | $5,000-20,000 | Low for MVP | Skip until post-revenue |
| **RLS policy review** | Free (manual) | Critical | Do it (1-2 days) |

**The expensive trap:** "basic penetration testing performed by... potentially a third-party for critical areas." A professional pentest costs $5,000-20,000. At pre-revenue MVP, this is burning runway.

**What actually matters for security at launch:**
1. RLS policies are correct (manual review, 1-2 days)
2. Auth flows don't have bypass vectors (test manually, 1 day)
3. No secrets in client-side code (grep for API keys, 30 min)
4. Dependencies don't have known CVEs (Dependabot, free)
5. CSP headers are set (already in middleware from Epic 1)

**Recommendation:**
- Enable GitHub Dependabot (5 minutes, free).
- Run OWASP ZAP automated scan once against staging (2 hours, free).
- Manually review all RLS policies (1-2 days -- this is the most important security task).
- Test auth flows manually against the OWASP Top 10 checklist (1 day).
- **Skip third-party pentesting until post-revenue.** Schedule it for Month 6 when you have budget and users worth protecting.
- **Savings:** $5,000-20,000 pentest cost + Snyk subscription + 2-3 days integrating redundant tools.

---

## 7. Feature Flags -- LAUNCHDARKLY IS $10K/YEAR SCOPE CREEP

**Source:** E11-S13

The spec suggests "LaunchDarkly, home-grown solution, or Supabase config."

LaunchDarkly pricing:
- Starter: Free (single environment, limited)
- Pro: $10/mo per seat, $0.00125 per client MAU over 1K
- Enterprise: Custom (typically $1,000+/mo)

At 100K MAU: ~$125/mo for LaunchDarkly Pro. At 1M MAU: ~$1,250/mo.

**You don't need a feature flag service at MVP.** You're launching ALL features to ALL users. That's what an MVP is. Feature flags are for controlled rollouts when you have an existing user base you don't want to disrupt.

**What you need for "controlled rollout":**
- A `FEATURE_FLAGS` object in your environment variables
- Check `process.env.NEXT_PUBLIC_ENABLE_AI_SEARCH === 'true'` in your code
- To toggle: change the env var in Vercel dashboard, redeploy (takes 30 seconds)

```typescript
// lib/features.ts -- Your entire feature flag system
export const features = {
  aiSearch: process.env.NEXT_PUBLIC_ENABLE_AI_SEARCH === 'true',
  marketplace: process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE === 'true',
  aiRecommendations: process.env.NEXT_PUBLIC_ENABLE_AI_RECS === 'true',
} as const;
```

**Dev time: 15 minutes.** Cost: $0/mo.

If you need user-segment targeting later (show feature to 10% of users), PostHog has free feature flags built in (already in your stack). That's your upgrade path.

**Recommendation:**
- **Environment variables for MVP feature flags.** 15 minutes, $0/mo.
- **PostHog feature flags** when you need percentage rollouts or user targeting (free tier, already integrated for analytics).
- **Never LaunchDarkly** until you have 10+ engineers who need self-service flag management. That's a Series B problem.
- **Savings:** $10-1,250/mo in tooling + 2-3 days of integration.

---

## 8. UAT With "Representative Users From All Roles" -- SCALE IT DOWN

**Source:** E11-S06

The spec wants UAT with "representative end-users for all roles" -- that's 6 roles (homebuyer, renter, seller, landlord, agent, service provider) plus admin. The acceptance criteria wants a "dedicated UAT environment with representative test data," a "structured feedback process," and "sign-off from key stakeholders."

At MVP, your "UAT participants" are:
- You (the founder)
- Your co-founder / first hire
- 3-5 friends/family who represent different roles
- Maybe 1-2 estate agents you've talked to

You don't need a "UAT plan document." You need to put the staging URL in a group chat and say "try to break this, tell me what's confusing." That's MVP UAT.

**What you actually need:**
1. Staging deployment on Vercel (automatic -- every PR gets a preview URL)
2. Seed data in staging Supabase (10-20 fake listings, 5-10 fake providers)
3. A shared doc (Notion page or Google Doc) where testers write feedback
4. 1 week of collecting feedback, 1 week of fixing critical issues

**Recommendation:**
- Skip the formal UAT plan document. Create a Notion page with test scenarios per role (1 hour).
- Send staging URL to 5-10 people. Collect feedback for 1 week.
- Fix critical bugs. Ignore cosmetic feedback for post-launch.
- **Total time: 2-3 days of setup + 1 week of testing + 1 week of fixes.** Not a formal UAT program with stakeholder sign-off.
- **Savings:** 3-5 days of process documentation nobody will read.

---

## 9. Support Team Training (S10) -- YOU ARE THE SUPPORT TEAM

**Source:** E11-S10

"The customer support team (even if small initially) is fully trained on all MVP features."

At MVP launch, your support infrastructure is:
- An email address (support@britestate.com)
- You reading those emails
- You replying to those emails

The Epic 10 cost analysis already established: no custom ticket system, use contact form + Freshdesk Free at Month 3. Training "the support team" means reading your own docs.

**Recommendation:**
- Write a 1-page internal runbook: "How to handle support emails" -- common issues, where to look in Supabase Dashboard, how to reset a user's password. **1 hour.**
- Skip SOPs, SLAs, knowledge bases, and training programs. Write them when you hire your first support person.
- **Savings:** 2-3 days of creating training materials for a team that doesn't exist.

---

## 10. Disaster Recovery Drill -- PREMATURE FOR MANAGED INFRASTRUCTURE

**Source:** E11-S03

"At least one DR drill (simulated recovery) has been successfully performed for critical data."

Your infrastructure is:
- **Vercel** -- stateless, deploys from git. "DR" = push to main. Recovery time: 30 seconds.
- **Supabase** -- managed PostgreSQL with daily backups (free), Point-in-Time Recovery on Pro ($25/mo). "DR" = click "Restore" in Supabase Dashboard.

A DR drill for managed infrastructure means: "Can you click the restore button in the Supabase Dashboard?" Yes. Drill complete.

What a DR drill means for self-hosted infrastructure (which you don't have): spinning up new servers, restoring from backup, reconfiguring networking, testing data integrity. That takes days to plan and execute.

**Recommendation:**
- Verify Supabase backups are enabled and test one restore to a branch database. **1 hour.**
- Document: "If Vercel goes down, we wait. If Supabase goes down, we restore from backup via Dashboard." **15 minutes.**
- Skip formal DR drills, DR documentation, and simulated recovery scenarios. Supabase and Vercel have their own DR -- you're paying them to handle this.
- **Savings:** 1-2 days of DR planning and execution.

---

## 11. Infrastructure as Code (IaC) -- FOR WHAT INFRASTRUCTURE?

**Source:** E11-S03

"Infrastructure as Code (IaC) practices for environment consistency (if applicable)."

Your infrastructure:
- Vercel: configured via `vercel.json` (already in your repo) or the Vercel Dashboard
- Supabase: configured via `supabase/config.toml` + migrations (already in your repo)

There is no Terraform. No CloudFormation. No Pulumi. Because there is no AWS/GCP/Azure infrastructure to provision. Everything is managed SaaS.

The `supabase/migrations/` directory IS your IaC for the database. The `vercel.json` IS your IaC for the frontend. You already have it.

**Recommendation:**
- Acknowledge that Supabase migrations + vercel.json = your IaC. Check that box. Move on.
- Don't create Terraform configs for managed services. Terraform is for provisioning cloud resources. You don't have cloud resources -- you have SaaS subscriptions.
- **Savings:** 2-3 days of unnecessary IaC setup.

---

## Cost Summary: Spec vs. Recommended

| Item | Spec Approach | Recommended | Savings |
|------|--------------|-------------|---------|
| CI/CD for mobile apps (S02) | React Native pipelines: 5-10 days | Remove -- no mobile apps exist | 5-10 days |
| AWS AI infrastructure (S03) | Harden AWS for self-hosted LLM | Remove -- using Claude API | $1,700/mo + days |
| Monitoring stack (S07, S08) | Datadog + Sentry + New Relic + PagerDuty | Sentry Free + PostHog Free + Vercel built-in | $100-200/mo + 3-5 days |
| Centralized logging (S07) | Logtail/Datadog integration | Vercel logs + structured console.log | $24-50/mo + 2-3 days |
| Load testing (S04) | k6/JMeter infrastructure: 3-5 days | Artillery local run: half a day | 2-4 days |
| Security testing (S05) | Third-party pentest + multiple scanners | Dependabot + OWASP ZAP + manual RLS review | $5,000-20,000 + 2-3 days |
| Feature flags (S13) | LaunchDarkly: $10-1,250/mo | Env vars + PostHog free flags | $10-1,250/mo + 2-3 days |
| UAT process (S06) | Formal UAT with plan docs | Staging URL + group chat + Notion | 3-5 days |
| Support training (S10) | SOPs + SLAs + knowledge base | 1-page runbook | 2-3 days |
| DR drill (S03) | Formal DR simulation | Verify Supabase backup restore works | 1-2 days |
| IaC (S03) | Terraform/Pulumi setup | Already have migrations + vercel.json | 2-3 days |
| **Total Dev Time** | **30-50 days (6-10 weeks)** | **8-12 days (2 weeks)** | **22-38 days saved** |
| **Monthly Infrastructure** | **$1,834-3,200+/mo** | **$0/mo** (free tiers) | **$1,834-3,200+/mo** |
| **One-Time Costs** | **$5,000-20,000** (pentest) | **$0** | **$5,000-20,000** |

---

## What Epic 11 Should Actually Be (MVP)

**Build (2 weeks total):**

1. **Supabase migration for staging seed data** -- 10-20 fake listings, 5-10 providers, 3-5 users per role. Enables testing. **Half a day.**

2. **GitHub Action for Supabase migrations** -- One YAML file: on push to main, run `supabase db push`. Vercel already handles frontend deploys. **2 hours.**

3. **Sentry integration** -- `@sentry/nextjs` package, wrap layout with error boundary, add Sentry DSN to env vars. Free tier (5K errors/mo). **Half a day.**

4. **PostHog integration** -- Already planned per CLAUDE.md. Add PostHog script to layout, track key events (search, signup, listing view). Free tier (1M events/mo). **Half a day.**

5. **Structured logging utility** -- 20-line `lib/logger.ts` file. Use throughout codebase. Outputs to Vercel logs. **30 minutes.**

6. **Enable Dependabot** -- Toggle in GitHub repo settings. **5 minutes.**

7. **OWASP ZAP scan** -- Run automated scan against staging URL. Fix critical findings. **1 day.**

8. **RLS policy audit** -- Manually review every RLS policy across all tables. Test with service role vs anon key. This is the highest-value security task. **2 days.**

9. **Artillery load test** -- 100 VUs, 60 seconds, 5 key endpoints. Document results. **Half a day.**

10. **Manual UAT** -- Send staging URL to 5-10 testers. Collect feedback in Notion for 1 week. Fix critical issues for 1 week. **2 weeks (overlaps with other work).**

11. **Feature flag env vars** -- Add 3-5 `NEXT_PUBLIC_ENABLE_*` vars to Vercel. Wrap risky features in conditional checks. **30 minutes.**

12. **Verify Supabase backup** -- Check backups are running. Test restore to branch. **1 hour.**

13. **Legal review** -- Review Terms, Privacy Policy, Cookie Policy are up to date. Add disclaimers to calculators and AVMs. **PM task, not engineering -- 1 day.**

14. **Launch runbook** -- One Notion page: "How to launch" (flip DNS, enable production env vars, monitor Sentry for first hour). "How to rollback" (revert Vercel deployment, one click). **1 hour.**

**Defer to Month 3-6:**
- Formal load testing with k6 Cloud (when marketing push expected)
- Third-party penetration testing (when you have revenue and users worth protecting)
- Datadog/New Relic APM (when free tiers are insufficient)
- PagerDuty on-call (when you have a team with on-call rotation)

**Defer indefinitely / Never build:**
- React Native CI/CD (build it when you build native apps)
- AWS infrastructure (using Claude API, not self-hosted LLM)
- LaunchDarkly (use env vars, then PostHog free flags)
- Custom centralized logging service (Vercel + Supabase built-in logging is sufficient)
- Formal DR drills for managed SaaS (Supabase/Vercel handle their own DR)
- SOPs and knowledge bases for a non-existent support team

**Total new infrastructure cost: $0** beyond existing Supabase Pro ($25/mo) + Vercel Pro ($20/mo) you're already paying.

---

## The 3 Rules for Epic 11

1. **Don't build infrastructure for products that don't exist.** There are no React Native apps. There is no AWS AI infrastructure. There is no support team. Epic 11 should prepare to launch what you've actually built (a Next.js web app on Vercel + Supabase), not what the roadmap imagines building in 6 months.

2. **Free tiers exist -- use them until they break.** Sentry Free (5K errors/mo), PostHog Free (1M events/mo), Freshdesk Free (10 agents), Dependabot (unlimited) -- these cover a startup from 0 to 50K users. The moment you start paying for Datadog ($31/host/mo) or LaunchDarkly or PagerDuty at zero users, you're buying insurance for a house you haven't built yet.

3. **Managed infrastructure IS your DR plan.** Supabase and Vercel employ hundreds of engineers to keep their platforms running. Your DR plan is: "We use managed services that handle DR." Writing Terraform configs for SaaS subscriptions and conducting DR drills for databases you don't operate is cargo cult DevOps. Verify backups work, document the restore button location, and move on.

---

## Cross-Epic Cost Summary: Total Savings Across All Audits

| Epic | Spec Monthly Cost | Recommended Monthly Cost | Monthly Savings | Dev Time Saved |
|------|-------------------|-------------------------|----------------|---------------|
| Epic 4 (Marketplace) | ~$915/mo | ~$110/mo | $805/mo | Significant |
| Epic 5 (Comms) | ~$2,500/mo | ~$25/mo | $2,475/mo | 3-4 weeks |
| Epic 6 (AI) | ~$1,700+/mo | ~$6/mo | $1,694/mo | 2-3 weeks |
| Epic 7 (Landlord) | ~$200/mo | ~$40/mo | $160/mo | 1 week |
| Epic 8 (Financial) | ~$200-600/mo | ~$0/mo | $200-600/mo | 4-6 weeks |
| Epic 10 (Admin) | ~$0-55/mo | ~$0/mo | $0-55/mo | 8-13 weeks |
| **Epic 11 (Launch)** | **~$1,834-3,200/mo** | **~$0/mo** | **$1,834-3,200/mo** | **4-8 weeks** |
| **TOTAL** | **~$7,349-9,170/mo** | **~$181/mo** | **~$7,168-8,989/mo** | **~25-40 weeks** |

**At scale (100K users), the gap is even wider.** The spec approach scales to $15,000-25,000/mo. The recommended approach scales to $500-1,500/mo. That's the difference between a startup that survives to Series A and one that burns through runway on monitoring dashboards nobody checks.

---

*Analysis date: 2026-03-07*
*Applies to: Epic 11 -- Release Readiness & Deployment Infrastructure*
