# Britestate v3.0 -- Consolidated Cost Analysis (CFO Report)

*Date: 2026-03-07*
*Prepared for: Founder/CEO*
*Perspective: CFO -- ruthless cost discipline for a pre-revenue startup*

---

## Executive Summary

The original v2.0 epic specs, if built as written, would cost **$7,349-9,170/month** at launch (zero users) and scale to **$15,000-25,000/month** at 100K users. Most of this spend delivers zero revenue and zero competitive advantage.

By applying the recommendations from all 8 epic cost audits, **total monthly infrastructure drops to ~$181/month at launch**, scaling to **$500-1,500/month at 100K users**. This represents a **96-98% cost reduction**.

Additionally, **25-40 weeks of engineering time** is saved by cutting features that should be bought (not built), deferred (not launched), or eliminated (not needed).

---

## Monthly Cost: Spec vs. Recommended (at Launch / 0 Users)

| Epic | What It Covers | Spec Cost/mo | Recommended/mo | Savings/mo |
|------|---------------|-------------|---------------|-----------|
| 4 - Marketplace | Claude sentiment, BullMQ, VirusTotal, R2, Mapbox, emails | $915 | $110 | $805 |
| 5 - Communication | Supabase Realtime chat, presence, read receipts, email notifications | $2,500 | $25 | $2,475 |
| 6 - AI Features | Self-hosted LLM on AWS, Twilio SMS/WhatsApp, AVM, NLP search | $1,700+ | $6 | $1,694+ |
| 7 - Landlord Tools | Document storage, reminder emails, PDF generation | $200 | $40 | $160 |
| 8 - Financial Tools | E-signatures (HelloSign/DocuSign), rent collection (Stripe fees) | $200-600 | $0 | $200-600 |
| 9 - Mobile | React Native CI/CD, Apple/Google accounts, device testing | $405-1,405 | $0 | $405-1,405 |
| 10 - Admin | Custom CMS, ticket system, financial dashboard | $0-55 | $0 | $0-55 |
| 11 - Launch Readiness | Datadog, New Relic, PagerDuty, LaunchDarkly, AWS AI infra | $1,834-3,200 | $0 | $1,834-3,200 |
| **TOTAL** | | **$7,754-10,575** | **~$181** | **$7,573-10,394** |

---

## Monthly Cost at Scale (100K Monthly Active Users)

| Epic | Spec Cost/mo | Recommended/mo |
|------|-------------|---------------|
| 4 - Marketplace | $915 | $110 |
| 5 - Communication | $4,300-8,800 | $200-500 |
| 6 - AI Features | $8,500-28,000 | $50-200 |
| 7 - Landlord Tools | $650 | $240 |
| 8 - Financial Tools | $200-600 | $0 |
| 9 - Mobile | $405-1,405 | $0 |
| 10 - Admin | $0-55 | $0 |
| 11 - Launch Readiness | $1,834-3,200 | $0 |
| **TOTAL** | **$16,804-43,625** | **$600-1,050** |

At 1M users, the spec approach could exceed **$50,000-80,000/month**. The recommended approach stays under **$3,000/month**.

---

## Your Actual Monthly Bill (Recommended Stack)

These are the only services you should be paying for:

### Fixed Costs (Day 1)

| Service | Plan | Monthly Cost | What You Get |
|---------|------|-------------|-------------|
| Supabase | Pro | $25 | PostgreSQL, Auth, Storage, Realtime, PITR backups |
| Vercel | Pro | $20 | Frontend hosting, serverless functions, CI/CD, analytics |
| Domain + DNS | Cloudflare | $0 (free tier) | DNS, basic DDoS protection |
| **Subtotal** | | **$45/mo** | |

### Variable Costs (Scale with Usage)

| Service | Free Tier | Cost Beyond Free | When You'll Pay |
|---------|-----------|-----------------|----------------|
| Sentry | 5K errors/mo | $26/mo (Team) | Month 3-6 |
| PostHog | 1M events/mo | $0.00031/event | Month 6-12 |
| Resend | 3K emails/mo | $20/mo (Pro) | Month 2-3 |
| Anthropic Claude API | Pay-per-use | ~$6/mo at 10K listings | When AI features launch |
| Upstash Redis | 10K commands/day | $10/mo (Pro) | When rate limiting needed |
| MapTiler | 100K tiles/mo | $25/mo | When map search launches |
| Stripe | 0 (% of transactions) | 1.5% + 20p per txn | When marketplace has payments |
| **Subtotal** | **$0-6/mo** | **$87-107/mo** | **Gradual** |

### Realistic Monthly Spend by Stage

| Stage | Timeline | MAU | Monthly Spend |
|-------|----------|-----|--------------|
| Pre-launch (building) | Now | 0 | **$45/mo** |
| Soft launch | Month 1 | 500 | **$45-65/mo** |
| Early traction | Month 3 | 5K | **$85-130/mo** |
| Growth | Month 6 | 25K | **$150-250/mo** |
| Scale | Month 12 | 100K | **$400-800/mo** |
| Breakout | Month 18 | 500K | **$1,000-2,500/mo** |

---

## Engineering Time Saved

| Epic | Spec Dev Time | Recommended Dev Time | Time Saved |
|------|-------------|---------------------|-----------|
| 5 - Communication | 6-8 weeks | 2-3 weeks | 3-5 weeks |
| 6 - AI Features | 8-12 weeks | 1-2 weeks | 6-10 weeks |
| 8 - Financial Tools | 6-8 weeks | 1-2 weeks | 4-6 weeks |
| 9 - Mobile | 16-24 weeks | 1-2 weeks | 15-22 weeks |
| 10 - Admin | 10-16 weeks | 2-3 weeks | 8-13 weeks |
| 11 - Launch Readiness | 6-10 weeks | 2 weeks | 4-8 weeks |
| **TOTAL** | **52-78 weeks** | **9-14 weeks** | **~40-64 weeks** |

That's roughly **10-16 months of solo developer time** saved. At contractor rates ($100-150/hr), that's **$160,000-$384,000** in engineering costs avoided.

---

## CFO Recommendations: How to Reduce Costs Even Further

### 1. ELIMINATE: Things You Should Never Build

| Item | Why | Annual Savings |
|------|-----|---------------|
| Self-hosted LLM on AWS | Claude API is 280x cheaper at your scale | $20,400/yr |
| React Native mobile apps | PWA gives 95% of value at 0% cost | $4,860-16,860/yr + 4-6 months |
| Custom support ticket system | Freshdesk Free exists (10 agents, $0/mo) | 3-4 weeks eng time |
| Custom CMS/knowledge base | Notion public pages or MDX files in repo | 2-3 weeks eng time |
| Financial dashboard in admin | Stripe Dashboard already shows all this | 1-2 weeks eng time |
| E-signature integration | Users can sign PDFs natively; premium feature post-revenue | $2,400-7,200/yr |
| Real-time WebSocket chat | No property portal does this. Email relay + polling inbox | $18,000-24,000/yr at scale |
| Presence tracking | Zero business value. "Responds in X hours" is free | $6,000/yr at scale |
| Automated Valuation Model | 6+ months to build, high liability. Partner with Hometrack instead | 6 months eng time |

### 2. DEFER: Things That Belong After Product-Market Fit

| Item | When to Build | Trigger |
|------|--------------|---------|
| NLP/semantic search | Month 6+ | When structured search usage exceeds 50K/mo |
| AI recommendation engine | Month 6+ | When you have 10K+ saved properties to train on |
| Smart reply suggestions | Never (use static lookup) | N/A |
| AI provider assistant (SMS) | Post-revenue | When providers request it AND will pay for it |
| Datadog/New Relic APM | Month 6-12 | When Sentry + Vercel built-in analytics are insufficient |
| PagerDuty on-call | Month 12+ | When you have 3+ engineers with on-call rotation |
| LaunchDarkly | Never (use env vars, then PostHog) | N/A |
| Third-party penetration test | Month 6 | When you have revenue and users worth protecting |
| Rent payment processing | Post-revenue | When landlords request it as paid feature |
| Complex admin RBAC | Month 6+ | When you have 5+ admin users |

### 3. SUBSTITUTE: Cheaper Alternatives for Required Features

| Spec Says | Use Instead | Cost Impact |
|-----------|------------|-----------|
| Claude Opus for sentiment analysis | Rule-based keyword scorer | $350/mo saved |
| BullMQ + ioredis on Upstash | Inngest or Supabase Edge Functions + pg_cron | $50/mo saved |
| VirusTotal for document scanning | `file-type` library + admin review queue | $200/mo saved |
| Cloudflare R2 storage | Supabase Storage (already paying for it) | $30/mo saved |
| Mapbox geocoding | postcodes.io (free, open source) | $75/mo saved |
| Individual notification emails | Daily digest batching + in-app first | 60-80% email cost reduction |
| Per-message read receipts | Per-conversation "last read" timestamp | Massive DB pressure relief |
| Puppeteer server-side PDF | Client-side html2pdf.js or jspdf | ~$50/mo compute saved |
| Pre-moderation for listings | Post-moderation with auto-flags | Admin workload reduced 95% |

### 4. NEGOTIATE: Services Where You Have Leverage

| Service | Current Approach | Negotiation Opportunity |
|---------|-----------------|----------------------|
| Supabase | Pro $25/mo | Negotiate startup credits; Supabase has a startup program |
| Vercel | Pro $20/mo | Apply for Vercel's startup program (potentially free Pro for 1 year) |
| Stripe | 1.5% + 20p standard | Negotiate volume pricing at 1K+ transactions/month |
| Anthropic | Pay-per-use | Explore Anthropic startup credits program |
| Resend | $20/mo Pro | Stay on free tier (3K emails/mo) until Month 3 |
| MapTiler | $25/mo starter | Free tier covers 100K tiles; only upgrade when map usage spikes |

### 5. MONETIZE: Features That Should Generate Revenue, Not Cost Money

Several "free" features in the spec are features competitors charge for:

| Feature | What Competitors Charge | Your Approach |
|---------|------------------------|--------------|
| Landlord rent tracking | Arthur: $1.25/unit/mo, Goodlord: $31/tenant/mo | Free basic, premium for automated collection |
| Compliance reminders | Arthur: paid feature | Free basic, premium for auto-scheduling contractors |
| Financial reporting | Arthur: paid feature | Free summary, premium for detailed analytics |
| AI property descriptions | Premium feature elsewhere | Free basic (drives agent adoption), premium for bulk/advanced |
| AI provider assistant | N/A (novel feature) | Premium feature from day 1 ($10-25/mo per provider) |
| E-signatures | DocuSign: $15-45/mo | Premium add-on when transaction volume justifies API cost |
| Featured listings | Zoopla: $200-1,000/listing | Revenue stream from agents |
| Priority RFQ matching | N/A | Premium for providers ($15-30/mo) |

---

## The Bottom Line

### What You'll Actually Spend (Month 1-6)

```
Supabase Pro:           $25/mo
Vercel Pro:             $20/mo
Resend (free tier):      $0/mo
Sentry (free tier):      $0/mo
PostHog (free tier):     $0/mo
Claude API (light use):  $2-6/mo
Domain:                  $1/mo (amortized)
                        --------
TOTAL:                  $48-52/mo
```

### What The Spec Would Have You Spend (Month 1-6)

```
Supabase Pro:                $25/mo
Vercel Pro:                  $20/mo
AWS GPU instances (AI):   $1,700/mo
Datadog:                     $31/mo
PagerDuty:                   $21/mo
LaunchDarkly:                $10/mo
Logtail:                     $24/mo
HelloSign API:              $200/mo
EAS Build (mobile CI):       $99/mo
BrowserStack:               $199/mo
VirusTotal:                  $50/mo
BullMQ VPS:                  $50/mo
Resend (high volume):        $20/mo
R2 Storage:                  $10/mo
Mapbox:                      $25/mo
Twilio (provider SMS):      $100/mo
                           --------
TOTAL:                   $2,584/mo (BEFORE a single user signs up)
```

**Annual burn rate difference: $576/yr vs $31,008/yr.**

That $30,432/year saved is runway. Runway is survival. Survival is the only thing that matters pre-product-market-fit.

---

## Decision Framework: When to Spend More

Increase spending ONLY when one of these triggers fires:

| Trigger | Action | Expected Cost Increase |
|---------|--------|----------------------|
| Free tier limit hit (Sentry, PostHog, Resend) | Upgrade to paid tier | $20-50/mo per service |
| 10K+ MAU sustained | Add Upstash Redis for rate limiting | $10/mo |
| 50K+ MAU sustained | Evaluate Datadog if Vercel analytics insufficient | $31-100/mo |
| Marketplace live with payments | Stripe Connect goes live (revenue-generating) | % of revenue |
| 100K+ AI API calls/month | Evaluate switching models (Haiku vs Sonnet) | Optimize, not increase |
| 500K+ MAU sustained | Consider dedicated Supabase instance | $200-500/mo |
| Post-Series A | Native mobile apps, dedicated monitoring, pentest | $2,000-5,000/mo |

**Every dollar spent before product-market fit is a dollar that doesn't help you find product-market fit.**

---

*This analysis consolidates findings from 8 individual epic cost audits (Epics 4-11). Epics 1-3 were not audited as they primarily involve Supabase schema, auth, and UI components with negligible infrastructure cost.*
