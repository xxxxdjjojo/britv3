# Epic 10 Cost Audit: The Admin Panel That Wants to Be Zendesk, Contentful, and Stripe Dashboard Combined

## Context

Analysis of `epic10.txt` — Admin Panel & Support Infrastructure. Cross-referenced against `brit estate prd 2026.txt` and the cost patterns established in Epics 4-8. Epic 10 looks innocent — "just an admin panel" — but it contains three separate products masquerading as one epic: a custom CMS, a support ticket system, and a business intelligence dashboard. Each one is a company unto itself.

---

## The Core Problem: Epic 10 Rebuilds Three Existing SaaS Products

The spec bundles:
1. **Admin CRUD operations** (S01-S05, S10-S11) — Legitimate. Search users, moderate listings, verify providers. This is real admin work.
2. **A Custom CMS / Knowledge Base** (S07) — Rich text editor, categorization, tagging, search, public-facing help center. This is Notion/GitBook/Intercom's Help Center.
3. **A Support Ticket System** (S08) — Ticket queues, assignment, status tracking, communication history. This is Zendesk/Freshdesk.
4. **A Financial Dashboard** (S09) — Aggregated revenue metrics, subscription tracking, commission totals. This is Stripe Dashboard.

You're proposing to build 3 SaaS products as side features of an admin panel. Each one will take longer to build than the actual admin operations.

---

## 1. Help Center / Knowledge Base (S07) — BUILD vs. BUY FAILURE

**Source:** E10-S07

The spec asks for:
- Rich text editor (WYSIWYG) for article creation
- Categories and tags
- Publish/unpublish workflow
- Public-facing searchable interface
- Article search by keywords

This is a **content management system**. Let's look at what building one costs vs. using an existing one:

### Build Cost

| Component | Dev Time | Maintenance |
|-----------|----------|-------------|
| Rich text editor integration (Tiptap/Plate) | 3-5 days | Ongoing bug fixes with editor quirks |
| Article CRUD API + DB schema | 2 days | RLS policies, migrations |
| Category/tag management | 1-2 days | UI + API |
| Public-facing help center pages | 2-3 days | SEO, responsive design |
| Search implementation | 1-2 days | Full-text search index |
| Image uploads in articles | 1-2 days | Storage costs |
| **Total** | **10-16 days** | **Ongoing** |

### Buy/Free Alternatives

| Solution | Cost | Setup Time | Features |
|----------|------|-----------|----------|
| **Notion (public pages)** | $0 | 1 hour | Rich editor, search, categories, SEO, custom domain |
| **GitBook** | $0 (free tier) | 2 hours | Markdown, search, versioning, custom domain |
| **Mintlify** | $0 (free tier) | 2 hours | MDX docs, search, beautiful UI out of the box |
| **Markdown files in repo** | $0 | 30 min | Version controlled, deploy with app, search via static site |
| Intercom Help Center | $74/mo | 4 hours | Full-featured, integrated with support |
| Zendesk Guide | $55/mo | 4 hours | Full-featured, integrated with tickets |

**What Rightmove does:** Static HTML help pages. No CMS. Updated by developers when needed.

**What Zoopla does:** Zendesk Guide. Off-the-shelf. Their help center IS Zendesk.

**What OpenRent does:** Simple FAQ page with accordion sections. Probably 50 lines of HTML.

### Recommendation

- **Cut the custom CMS entirely.** Use one of these approaches:
  - **Option A (Zero cost, zero dev time):** Create a `/help` section in the Next.js app with MDX files in the repo. Developers update articles via PRs. Search via a simple client-side filter on article titles/tags. This is what most startups do pre-Series A.
  - **Option B (Zero cost, 1 hour setup):** Use Notion with a public page. Link to it from the app's help menu. Admins edit directly in Notion. No code required.
  - **Option C (If you must build something):** A simple FAQ page with hardcoded categories and accordion items, sourced from a JSON file or simple DB table. No rich text editor, no WYSIWYG, no publish workflow. 1-2 days max.
- **Savings:** 10-16 days of dev time + ongoing WYSIWYG maintenance headaches.

---

## 2. Support Ticket System (S08) — THE $55/mo vs. 3-WEEK TRAP

**Source:** E10-S08

The spec asks for:
- Centralized ticket queue
- Ticket assignment to agents
- Status tracking (Open, In Progress, Resolved, Closed)
- Response/communication history per ticket
- User communication (email or integrated messaging)

This is a support ticket system. Companies spend years building these. Zendesk has 6,000 employees. You're proposing to build a basic version as a side feature.

### Build Cost

| Component | Dev Time |
|-----------|----------|
| Ticket DB schema + RLS | 1-2 days |
| Contact form → ticket creation | 1 day |
| Admin ticket list with filters/search | 2-3 days |
| Ticket detail view with conversation thread | 2-3 days |
| Email reply integration (send responses via Resend) | 2-3 days |
| Ticket assignment + status workflow | 1-2 days |
| Email → ticket creation (inbound) | 3-5 days (parsing, threading) |
| Notification to admin on new ticket | 1 day |
| **Total** | **13-20 days** |

### Buy Alternatives

| Solution | Cost | What You Get |
|----------|------|-------------|
| **Crisp** | $0 (free, 2 seats) | Live chat, inbox, knowledge base, contact form |
| **Tawk.to** | $0 (free, unlimited) | Live chat, ticketing, knowledge base |
| Freshdesk | $0 (free, up to 10 agents) | Ticketing, knowledge base, email integration |
| Zendesk | $19/agent/mo | Full ticketing, automation, reporting |
| Intercom | $74/mo | Chat, tickets, help center, AI bot |

**Read that again:** Freshdesk is **free** for up to 10 agents. Crisp is **free** for 2 seats. Tawk.to is **free unlimited.**

You're proposing to spend 3-4 weeks building what you can get for $0.

### What You Actually Need at MVP

You don't have support agents. You don't have 10,000 users filing tickets. You have a founding team handling support via email. At launch, your support volume will be:

| Month | Users | Tickets/week (est.) | Team size |
|-------|-------|-------------------|-----------|
| 1 | 500 | 5-10 | 1 person |
| 3 | 5K | 20-50 | 1-2 people |
| 6 | 25K | 100-200 | 2-3 people |
| 12 | 100K | 500-1000 | 5-8 people |

At 5-10 tickets/week, you manage support from your Gmail inbox. At 100+/week, you need Zendesk/Freshdesk — but by then you have revenue to pay for it.

### Recommendation

- **MVP:** Add a simple contact form on the `/contact` page that sends an email to `support@britestate.com` via Resend. That's it. One API route, one form, one email template. **Half a day of dev time.**
- **Month 3 (when tickets hit 50/week):** Sign up for Freshdesk Free (10 agents, email ticketing, knowledge base included). Point the contact form at Freshdesk's email intake address instead of your inbox. **Zero dev time, $0/month.**
- **Month 12+ (when you need automation):** Upgrade to Zendesk/Intercom with proper integrations. By then you have revenue and a support team. Budget: $200-500/mo.
- **Never build:** A custom ticket system. The ROI is negative at every scale. Zendesk exists. Use it.
- **Savings:** 13-20 days of dev time.

---

## 3. Financial Overview Dashboard (S09) — REBUILDING STRIPE DASHBOARD

**Source:** E10-S09

The spec asks for read-only views of:
- Active subscriptions by tier
- Commission revenue over periods
- Number of successful fee transactions

**Stripe already provides all of this.** The Stripe Dashboard at `dashboard.stripe.com` shows:
- Revenue by period (daily/weekly/monthly/yearly)
- Active subscriptions with MRR
- Successful/failed payment counts
- Commission tracking via Connect
- Exportable reports

You're proposing to build a read-only copy of data that already exists in a purpose-built dashboard with 2,000+ engineers behind it.

### The Hidden Cost of "Read-Only" Financial Data

"Read-only" sounds cheap. It's not. To display financial summaries, you need:

1. **Stripe webhook handler** to sync payment events to your DB (or query Stripe API on every dashboard load)
2. **Aggregation queries** across payment records
3. **Period selectors** (last 7 days, last month, YTD, custom range)
4. **Charts/visualizations** (Recharts or similar)
5. **Data accuracy guarantees** — if your dashboard says £50K revenue and Stripe says £48K, which is right? Now you're debugging discrepancies.

| Component | Dev Time |
|-----------|----------|
| Stripe webhook → local payment records | 2-3 days |
| Aggregation queries + API routes | 2 days |
| Dashboard UI with charts | 2-3 days |
| Period selectors + filters | 1-2 days |
| Data reconciliation testing | 1-2 days |
| **Total** | **8-12 days** |

### Recommendation

- **Cut entirely for MVP.** Admins use the Stripe Dashboard directly for financial data. It's better than anything you'll build.
- Add a simple link in the admin panel: "View Financial Reports" → opens Stripe Dashboard in new tab.
- If you need platform-specific metrics later (e.g., "commission per service category"), build that ONE specific query when the marketplace has enough volume to make it meaningful. Don't build a generic financial dashboard.
- **Savings:** 8-12 days of dev time + avoided data sync complexity.

---

## 4. Separate Admin Panel Application (S10) — OVER-ARCHITECTURE

**Source:** E10-S10

"Build a separate, secure frontend application or a protected section for the Admin Panel."

The spec suggests either a **separate Next.js app** or a **protected section**. A separate app means:
- Separate deployment pipeline
- Separate build process
- Separate environment configuration
- Duplicated shared components (Shadcn UI, Supabase clients, types)
- Two codebases to maintain, two sets of dependencies to update

**What every startup does:** A route group within the same app. `/admin/*` routes protected by middleware.

### Recommendation

- **Use a route group in the existing Next.js app.** Create `src/app/(admin)/` with its own layout optimized for data tables and forms.
- Middleware checks for admin role on `/admin/*` routes — you're already building auth middleware in Phase 1.
- Same deployment, same build, same shared code. Zero additional infrastructure.
- "Not discoverable by regular users" = don't link to it in the nav. That's it. Security-through-obscurity is NOT your security layer — the middleware auth check is.
- If you need IP whitelisting later, add it to the middleware. Still the same app.
- **Savings:** Eliminates separate deployment pipeline, reduces maintenance burden.

---

## 5. Admin Roles & Permissions (S11) — YAGNI AT ITS FINEST

**Source:** E10-S11

"At least three distinct admin roles: Super Admin, Content Moderator, Support Agent."

At MVP, your admin team is you and maybe one other person. You're both Super Admins. Building a granular RBAC system for 1-2 users is engineering for a problem you don't have.

### The Real RBAC Cost

| Component | Dev Time |
|-----------|----------|
| Admin roles table + Supabase custom claims | 1-2 days |
| Permission definitions per role | 1 day |
| UI conditional rendering (show/hide per role) | 2-3 days |
| API-level permission enforcement | 2-3 days |
| Role management UI (assign/remove) | 1-2 days |
| Testing all permission combinations | 2-3 days |
| **Total** | **9-14 days** |

**What you need at MVP:** A boolean `is_admin` field on the profiles table. One RLS policy: `auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)`. Done.

### Recommendation

- **MVP:** Single admin role. `is_admin` boolean on profiles table. All admin features visible to all admins.
- **When you hire a dedicated moderator (Month 6+):** Add a `admin_role` enum column (`super_admin`, `moderator`, `support`). Conditionally render UI sections. 2 days of work at that point.
- Don't build role management UI until you have 5+ admin users. Before that, set roles directly in Supabase Dashboard.
- **Savings:** 7-12 days of dev time.

---

## 6. Listing & Content Moderation (S04) — PRE-MODERATION IS A GROWTH KILLER

**Source:** E10-S04

"A Listing Moderation queue displays property listings that are newly created or edited and awaiting admin approval."

This means: every listing is invisible until an admin manually approves it. At 2 AM when an agent creates a listing, it sits in a queue until you wake up.

**What Rightmove does:** Listings go live immediately. Automated checks flag obvious violations (profanity, suspicious pricing, duplicate detection). Human review is reactive, not proactive.

**What Zoopla does:** Same. Post-moderation, not pre-moderation.

**What will actually happen with pre-moderation:**
- Agent creates listing at 6 PM → admin reviews at 10 AM next day → 16-hour delay
- Agent gets frustrated → lists on Rightmove instead (instant)
- At 100 listings/day, you need a full-time moderator just to keep the queue clear
- Weekends and holidays = 48-72 hour backlog

### Recommendation

- **Post-moderation, not pre-moderation.** Listings go live immediately.
- Add automated checks on creation:
  - Profanity filter on title/description (simple word list, client-side)
  - Price sanity check (< £1,000 for sale or > £100M = flagged)
  - Duplicate address detection (simple DB query)
- Flagged listings go to moderation queue. Clean listings go live.
- Add a "Report Listing" button for users — community-driven moderation scales infinitely.
- Admin queue shows: flagged listings + reported listings. Not ALL listings.
- **This changes the admin workload from "review everything" to "review exceptions."** At 1,000 listings/day, you review 20-50 instead of 1,000.

---

## 7. Review Moderation (S06) — AUTOMATE FIRST, HUMANS SECOND

**Source:** E10-S06

"Interface to moderate user-submitted reviews" with flagging, approval/deletion, and dispute handling.

At MVP, you won't have enough reviews to justify a moderation interface. And when you do, 95% of reviews are fine.

### Recommendation

- **MVP:** Automated profanity filter on review submission (simple word list). Reviews with flagged words go to a "pending" state. Everything else publishes immediately.
- Add "Report Review" button for users and providers.
- Admin moderation = a simple list of flagged/reported reviews with "Approve" / "Delete" buttons. No dispute workflow, no internal notes system. If there's a dispute, handle it via email.
- **Don't build:** Dispute resolution workflow, review editing interface, or category-based filtering of reviews. These are month-12 problems.
- **Savings:** 3-5 days of dev time.

---

## 8. Admin Dashboard Metrics (S02) — SUPABASE DASHBOARD ALREADY EXISTS

**Source:** E10-S02

The spec wants widgets showing: new users, new listings, pending verifications, pending moderation, open tickets, error rates.

Half of these are already in Supabase Dashboard (user counts, DB metrics) and Sentry (error rates). The other half are simple COUNT queries.

### Recommendation

- **MVP:** A single admin page with 4-5 count cards. Each card is one SQL count query:
  - `SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days'` (new users)
  - `SELECT COUNT(*) FROM listings WHERE created_at > NOW() - INTERVAL '7 days'` (new listings)
  - `SELECT COUNT(*) FROM profiles WHERE verification_status = 'pending'` (pending verifications)
  - `SELECT COUNT(*) FROM listings WHERE is_flagged = true` (flagged listings)
- No charts. No trend lines. No real-time updates. Just numbers with links to the relevant management pages.
- Total dev time: **half a day.** These are server components that run a query and display a number.
- Add charts and trends when you have 3+ months of data that makes trends meaningful.

---

## Cost Summary: Spec vs. Recommended

| Item | Spec Approach | Recommended | Savings |
|------|--------------|-------------|---------|
| Help Center / CMS (S07) | Custom CMS with WYSIWYG: 10-16 days | MDX files in repo or Notion link | 10-16 days |
| Support Tickets (S08) | Custom ticket system: 13-20 days | Contact form + Freshdesk Free (Month 3) | 13-19 days |
| Financial Dashboard (S09) | Custom charts + Stripe sync: 8-12 days | Link to Stripe Dashboard | 8-12 days |
| Separate Admin App (S10) | Separate Next.js app | Route group in main app | Deployment complexity |
| Admin RBAC (S11) | 3-role system: 9-14 days | `is_admin` boolean | 7-12 days |
| Listing Moderation (S04) | Pre-moderation queue: 3-5 days | Post-moderation with auto-flags | Eliminates bottleneck |
| Review Moderation (S06) | Full moderation + disputes: 5-7 days | Auto-filter + report button | 3-5 days |
| Admin Dashboard (S02) | Widget dashboard with metrics: 3-5 days | Simple count cards | 2-4 days |
| **Total Dev Time** | **51-79 days (10-16 weeks)** | **8-14 days (2-3 weeks)** | **43-65 days saved** |
| **Monthly Infrastructure** | **$0-55/mo (Zendesk if chosen)** | **$0/mo** | **$0-55/mo** |

---

## What Epic 10 Should Actually Be (MVP)

**Build (2-3 weeks total):**

1. **Admin route group** — `(admin)/` in the existing Next.js app with admin layout (sidebar nav, data-dense design). Protected by middleware checking `is_admin` on profile. **1-2 days.**

2. **User management** (S03) — Search users by email/name, view profile details, suspend/activate toggle. This is a data table + detail page. **2-3 days.**

3. **Provider verification queue** (S05) — List of pending verifications, view submitted documents, approve/reject with reason. This is essential for marketplace trust. **2-3 days.**

4. **Listing moderation** (S04, simplified) — Post-moderation: flagged/reported listings queue. Approve/remove buttons. Auto-flag on creation for profanity and price anomalies. **2 days.**

5. **Admin dashboard** (S02, simplified) — 5 count cards linking to management sections. Half a day.

6. **Contact form** (S08, simplified) — Public `/contact` page, sends email to support inbox via Resend. **Half a day.**

7. **Help page** (S07, simplified) — Static `/help` page with FAQ accordion, sourced from MDX files in the codebase. **1 day.**

**Defer to Month 3-6 (when you have support volume):**
- Freshdesk Free integration for proper ticketing
- Review moderation queue (when you have reviews)
- Admin role granularity (when you have multiple admins)

**Defer indefinitely / Never build:**
- Custom CMS with WYSIWYG editor (use MDX or Notion)
- Custom support ticket system (use Freshdesk/Crisp free tier)
- Financial dashboard (use Stripe Dashboard)
- Pre-moderation workflow (use post-moderation with auto-flags)
- Complex admin RBAC (use `is_admin` boolean until 5+ admin users)

**Total new infrastructure cost: $0** beyond existing Supabase + Resend.

---

## The Stripe Dashboard Test

Before building any admin reporting feature, open `dashboard.stripe.com` and check if it already shows what you need. Stripe has spent $1B+ building dashboards. You will not build a better one.

| Data Point | Stripe Dashboard | Build Custom? |
|-----------|-----------------|--------------|
| Total revenue | Yes | No |
| Revenue by period | Yes | No |
| Active subscriptions | Yes | No |
| Commission via Connect | Yes | No |
| Failed payments | Yes | No |
| Payout history | Yes | No |
| Revenue per service category | No | Maybe (later, when meaningful) |

---

## The 3 Rules for Epic 10

1. **Don't build SaaS products as side features.** A CMS is a product. A ticket system is a product. A financial dashboard is a product. Use the free tiers of companies that have spent years building these — Notion, Freshdesk, Stripe Dashboard. Your competitive advantage is the property platform, not your admin panel.

2. **Post-moderation beats pre-moderation at every scale.** Pre-moderation creates bottlenecks that kill agent adoption. Auto-flag + community reporting + reactive review scales infinitely. Rightmove and Zoopla didn't get to millions of listings by manually approving each one.

3. **Admin tooling grows with admin headcount, not user count.** At 1-2 admins, you need a boolean and some data tables. At 5 admins, you need role separation. At 20 admins, you need audit trails and workflows. Build for the team you have, not the team you imagine having in 2 years.

---

*Analysis date: 2026-03-07*
*Applies to: Epic 10 -- Admin Panel & Support Infrastructure*
