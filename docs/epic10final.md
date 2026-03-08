# Epic 10: Admin Panel & Support Infrastructure (Final)

**Epic Number:** E10
**Date Created:** May 13, 2025
**Last Updated:** March 7, 2026 (Cost-optimized rewrite)
**Target Release:** Phase 7 (Production Readiness)

---

## 1. Description

A lightweight admin interface built as a protected route group within the main Next.js application. Provides essential operational tools for managing users, moderating flagged content, processing provider verifications, and handling support inquiries. Deliberately avoids rebuilding SaaS products (CMS, ticketing, BI dashboards) that exist as free or low-cost services.

---

## 2. Goals

- Give administrators the minimum viable tools to manage users, listings, and providers.
- Enable post-moderation of flagged/reported content (not pre-moderation of all content).
- Facilitate service provider verification from the admin side.
- Provide a simple contact form and static help page for user support.
- Surface key operational counts on a simple dashboard.

---

## 3. Scope

### In Scope

- **Admin route group** within existing Next.js app (`(admin)/` with dedicated layout)
- **Admin authentication** via `is_admin` boolean on profiles table + middleware guard
- **Admin dashboard** with count cards linking to management sections
- **User management** — search, view details, suspend/activate accounts
- **Provider verification queue** — review documents, approve/reject with reason
- **Listing moderation** — post-moderation of auto-flagged and user-reported listings
- **Review moderation** — basic queue for flagged/reported reviews
- **Contact form** — public `/contact` page that emails support inbox via Resend
- **Help page** — static `/help` with FAQ accordion sourced from MDX files in the codebase

### Out of Scope (Deferred or Eliminated)

| Item | Reason | Alternative |
|------|--------|-------------|
| Custom CMS / Knowledge Base with WYSIWYG editor | Rebuilds Notion/GitBook. 10-16 days dev for a non-differentiating feature. | MDX files in repo, editable via PR. Or link to Notion public page. |
| Custom support ticket system | Rebuilds Zendesk/Freshdesk. 13-20 days dev. Free alternatives exist. | Contact form now. Freshdesk Free (10 agents) when ticket volume exceeds 50/week. |
| Financial overview dashboard | Rebuilds Stripe Dashboard. 8-12 days dev. Stripe's version is better. | Admins use `dashboard.stripe.com` directly. Link provided in admin nav. |
| Separate Next.js application for admin | Doubles deployment complexity, duplicates shared code. | Route group in main app with admin-specific layout. |
| Granular RBAC (3+ admin roles) | YAGNI. At MVP you have 1-2 admins who are both Super Admins. | `is_admin` boolean. Add `admin_role` enum when team exceeds 5 admins. |
| Pre-moderation of all listings | Growth-killing bottleneck. Rightmove/Zoopla don't do this. | Post-moderation: auto-flag suspicious content, community reporting. |
| Advanced BI / analytics dashboards | Phase 2+ concern. No meaningful data at launch. | Supabase Dashboard + PostHog + Stripe Dashboard cover this. |
| Mass emailing / direct user communication | Not needed at MVP scale. | Email users individually through support inbox. |
| Automated fraud detection | Manual review sufficient at MVP volume. | Add when patterns emerge from manual moderation. |

---

## 4. User Stories & Acceptance Criteria

### E10-S01: Admin Authentication

**User Story:** As an Administrator, I want to securely access the Admin Panel so that platform management tools are protected.

**Priority:** Must

**Acceptance Criteria:**
- An `is_admin` boolean column exists on the `profiles` table (default `false`).
- Next.js middleware checks `is_admin = true` for all `/admin/*` routes. Unauthorized users are redirected to the home page.
- Admin routes are not linked anywhere in the public-facing navigation.
- Admin layout uses a distinct sidebar navigation optimized for data management tasks.
- Failed access attempts are logged to `auth_audit_log`.

**Implementation Notes:**
- No separate login page. Admins log in through the normal auth flow; the middleware checks the `is_admin` flag after authentication.
- Set `is_admin` directly in Supabase Dashboard for the founding team. No admin role management UI at MVP.
- When admin team exceeds 5 people, add an `admin_role` enum column (`super_admin`, `moderator`, `support`) and conditionally render UI sections. Until then, all admins see everything.

---

### E10-S02: Admin Dashboard

**User Story:** As an Administrator, I want a dashboard showing key operational counts so I can quickly identify areas needing attention.

**Priority:** Must

**Acceptance Criteria:**
- The admin dashboard (`/admin`) displays 5 count cards:
  1. New users (last 7 days) — links to User Management
  2. New listings (last 7 days) — links to Listing Moderation
  3. Pending provider verifications — links to Verification Queue
  4. Flagged/reported listings — links to Listing Moderation (filtered)
  5. Flagged/reported reviews — links to Review Moderation
- Each card shows a single number and a descriptive label.
- Cards link to the relevant management section.
- Data is fetched server-side (Server Components) with simple COUNT queries.

**Implementation Notes:**
- No charts, no trend lines, no real-time updates. Just numbers.
- Each count is a single SQL query. Total: 5 queries, all indexed.
- Add charts and historical trends when 3+ months of data exists and the admin team requests it.
- For platform health metrics (error rates, uptime), link to Sentry and Supabase Dashboard in the admin sidebar. Don't rebuild their dashboards.

**Estimated Dev Time:** 0.5 days

---

### E10-S03: User Management

**User Story:** As an Administrator, I want to search for users, view their details, and manage their account status so I can handle user-related issues.

**Priority:** Must

**Acceptance Criteria:**
- A User Management page (`/admin/users`) displays a searchable, paginated data table.
- Admins can search by email, display name, or user ID.
- Admins can filter by user role and account status (active/suspended).
- Clicking a user row opens a detail view showing:
  - Profile information (from `profiles` table)
  - Account status
  - User role
  - Registration date
  - Email verification status
- Admins can toggle account status between `active` and `suspended`.
- Admins can manually mark an email as verified (edge case for support).
- All admin actions on user accounts are logged to `auth_audit_log` with the admin's user ID, action taken, and timestamp.

**Implementation Notes:**
- Use Supabase's built-in text search on `profiles` for the search query. No need for a dedicated search index at MVP scale.
- Pagination via Supabase `.range()` — cursor-based pagination if performance becomes an issue at 100K+ users.
- The user detail view is read-only except for the status toggle and email verification override.
- Do NOT build: activity log viewer, profile editing, or role changing. Admin sets roles via Supabase Dashboard if needed.

**Estimated Dev Time:** 2-3 days

---

### E10-S04: Listing Moderation (Post-Moderation)

**User Story:** As an Administrator, I want to review flagged and reported listings so I can maintain content quality without blocking legitimate listings from going live.

**Priority:** Must

**Acceptance Criteria:**
- Listings go live immediately upon creation (no approval queue).
- On listing creation/edit, an automated check runs:
  - Profanity filter on title and description (word list check, server-side).
  - Price anomaly detection: sale price < £10,000 or > £50,000,000, or rental < £50/mo or > £50,000/mo.
  - Duplicate address detection: exact postcode + address_line1 match against existing active listings.
- Listings that fail automated checks are flagged (`is_flagged = true`, `flag_reason` stored) and remain live but appear in the admin moderation queue.
- Users can report listings via a "Report Listing" button on the listing detail page. Reported listings appear in the moderation queue.
- The moderation queue (`/admin/moderation/listings`) shows flagged and reported listings with:
  - Listing title, price, agent/seller name
  - Flag/report reason
  - Date flagged/reported
- Admins can:
  - **Dismiss flag** — listing stays live, flag cleared.
  - **Remove listing** — listing status set to `withdrawn` with admin note. Lister notified via email.
- Moderation actions are logged (admin ID, action, reason, timestamp).

**Implementation Notes:**
- The profanity filter is a simple word list (100-200 words). Not an AI service. Store as a JSON file in the codebase.
- Price anomaly thresholds are hardcoded constants. Adjust as market data informs better ranges.
- "Report Listing" creates a row in a `content_reports` table (`reporter_id`, `listing_id`, `reason`, `created_at`). Admin sees aggregated report count per listing.
- Do NOT build: listing editing by admins, pre-approval workflows, or automated takedown. Manual review only.

**Estimated Dev Time:** 2-3 days (including auto-flag logic)

---

### E10-S05: Provider Verification Queue

**User Story:** As an Administrator, I want to review provider verification submissions so I can approve or reject providers to maintain marketplace trust.

**Priority:** Must

**Acceptance Criteria:**
- A Verification Queue page (`/admin/verifications`) displays providers with pending verification status.
- Each queue item shows: provider name, service categories, submission date, documents submitted.
- Clicking a provider opens a detail view with:
  - Provider profile information
  - Submitted verification documents (viewable inline for images/PDFs via Supabase Storage signed URLs)
  - Current verification status
- Admins can set verification status to:
  - **Verified** — provider receives "Verified" badge, notified via email.
  - **Rejected** — with mandatory reason text. Provider notified via email with rejection reason.
  - **Requires More Information** — with notes describing what's needed. Provider notified via email.
- Verification status changes are logged (admin ID, old status, new status, reason, timestamp).
- The provider's public profile updates to reflect verification status immediately.

**Implementation Notes:**
- Documents are stored in Supabase Storage (from Epic 4). Admin views them via time-limited signed URLs — do not copy documents or create public URLs.
- Verification decisions are stored in a `verification_decisions` table (or as rows in `auth_audit_log` with `event_type = 'verification_decision'`).
- Email notifications use existing Resend integration with simple templates: "Congratulations, you're verified" / "Your verification needs attention: [reason]".
- Sort queue by submission date (oldest first) to ensure FIFO processing.

**Estimated Dev Time:** 2-3 days

---

### E10-S06: Review Moderation

**User Story:** As an Administrator, I want to moderate flagged and reported reviews so the review system remains fair.

**Priority:** Should

**Acceptance Criteria:**
- On review submission, an automated profanity filter checks the review text. Flagged reviews are set to `status = 'pending'` (not publicly visible until cleared).
- Users and providers can report reviews via a "Report Review" button. Reported reviews appear in the moderation queue.
- A Review Moderation page (`/admin/moderation/reviews`) shows pending and reported reviews with:
  - Review text, rating, reviewer name, reviewed entity
  - Flag/report reason
  - Date submitted
- Admins can:
  - **Approve** — review becomes publicly visible.
  - **Delete** — review removed. Reviewer not notified (to avoid gaming).
- Actions are logged.

**Implementation Notes:**
- Same profanity word list as listing moderation. One shared utility.
- Reviews that pass the profanity filter publish immediately. Only flagged ones need admin review.
- Do NOT build: review editing, dispute resolution workflows, provider response moderation, or category-based filtering. Handle disputes via email if they arise.
- This is a "Should" priority. If time is tight, defer entirely and rely on the profanity auto-filter + "Report" button with email notification to the admin inbox.

**Estimated Dev Time:** 1-2 days

---

### E10-S07: Help Page (Static)

**User Story:** As a user, I want to find answers to common questions so I can resolve issues without contacting support.

**Priority:** Must

**Acceptance Criteria:**
- A public `/help` page displays FAQ content organized by category.
- Categories include: Account & Profile, Property Search, Listings, Marketplace, Payments, Privacy & Data.
- Each category contains 5-10 FAQ items displayed as expandable accordions.
- A simple client-side search filters FAQ items by keyword match on question text.
- The page includes a prominent "Contact Us" link/button that navigates to `/contact`.

**Implementation Notes:**
- Content is sourced from MDX files in the codebase (e.g., `src/content/help/account.mdx`, `src/content/help/search.mdx`).
- Content updates happen via code PRs. No admin UI for editing help content at MVP.
- Use Shadcn UI `Accordion` component for the FAQ display.
- Client-side search is a simple `.filter()` on the FAQ data array matching against question text. No search index needed.
- When help content outgrows MDX files (50+ articles), evaluate Notion public pages, GitBook free tier, or Mintlify. Do not build a custom CMS.

**Estimated Dev Time:** 1 day

---

### E10-S08: Contact Form

**User Story:** As a user, I want to submit a support inquiry so I can get help with platform issues.

**Priority:** Must

**Acceptance Criteria:**
- A public `/contact` page displays a simple form with fields:
  - Name (pre-filled if logged in)
  - Email (pre-filled if logged in)
  - Category dropdown: Account Issue, Listing Issue, Payment Issue, Provider Issue, Bug Report, Other
  - Message (textarea, 50-2000 characters)
- On submission, an email is sent to `support@britestate.com` via Resend containing all form fields.
- The user receives a confirmation email: "We've received your inquiry and will respond within 24-48 hours."
- A success message is displayed on the page after submission.
- Rate limiting: max 3 submissions per hour per IP (via Upstash Redis, already in stack).
- Server-side validation with Zod. Honeypot field for basic spam prevention.

**Implementation Notes:**
- This is a single API route (`/api/contact`) and a single page component.
- Emails go to a shared inbox (Gmail, Fastmail, whatever the team uses). No ticket system.
- When support volume exceeds ~50 inquiries/week (likely Month 3-6), sign up for **Freshdesk Free** (10 agents, $0/mo). Change the contact form to submit to Freshdesk's email intake address instead. Zero code change — just update the recipient email.
- When volume exceeds Freshdesk Free limits, upgrade to paid tier or switch to Zendesk. By then you have revenue.
- Do NOT build: ticket tracking, assignment, status updates, conversation threading, or agent dashboard. These are solved problems. Use a free SaaS.

**Estimated Dev Time:** 0.5 days

---

### E10-S09: External Dashboard Links

**User Story:** As an Administrator, I want quick access to platform analytics and financial data so I can monitor platform health.

**Priority:** Should

**Acceptance Criteria:**
- The admin sidebar includes an "External Tools" section with links (opening in new tabs):
  - "Financial Reports" → Stripe Dashboard
  - "Error Tracking" → Sentry Dashboard
  - "Analytics" → PostHog Dashboard
  - "Database" → Supabase Dashboard
- Each link is clearly labeled with the service name and what data it provides.

**Implementation Notes:**
- This is 4 anchor tags in the admin sidebar. Literally 10 lines of code.
- URLs are stored in environment variables so they can be updated without code changes.
- Do NOT build custom dashboards for data that these services already display better than you ever will.
- When platform-specific metrics are needed that no external tool provides (e.g., "verification approval rate by month"), build that ONE specific query as a simple admin page. Don't build a generic analytics framework.

**Estimated Dev Time:** 15 minutes

---

## 5. Database Schema

### New Tables

```sql
-- Content reports (for listings and reviews)
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Polymorphic: can report listings or reviews
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'review')),
  entity_id UUID NOT NULL,

  reason TEXT NOT NULL CHECK (LENGTH(reason) <= 500),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),

  -- Admin resolution
  resolved_by UUID REFERENCES auth.users(id),
  resolution_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  -- Prevent duplicate reports
  UNIQUE(reporter_id, entity_type, entity_id)
);

-- Indexes
CREATE INDEX idx_content_reports_status ON content_reports (status, entity_type) WHERE status = 'open';
CREATE INDEX idx_content_reports_entity ON content_reports (entity_type, entity_id);

-- RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create reports
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Admins can view and update all reports
CREATE POLICY "Admins can manage reports"
  ON content_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

### Schema Modifications

```sql
-- Add admin flag to profiles (Phase 1 schema)
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Add moderation fields to listings
ALTER TABLE listings ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN flag_reason TEXT;
ALTER TABLE listings ADD COLUMN flagged_at TIMESTAMPTZ;

-- Index for admin moderation queries
CREATE INDEX idx_listings_flagged ON listings (is_flagged, flagged_at DESC) WHERE is_flagged = true;

-- Add moderation status to reviews (assuming reviews table from Epic 4)
-- Reviews default to 'published'; profanity-flagged reviews set to 'pending'
-- ALTER TABLE reviews ADD COLUMN moderation_status TEXT DEFAULT 'published'
--   CHECK (moderation_status IN ('published', 'pending', 'removed'));
```

**Total new tables: 1** (`content_reports`). Everything else is columns on existing tables.

---

## 6. Dependencies

| Dependency | Required For | Status |
|-----------|-------------|--------|
| Epic 1 (Auth + Profiles) | Admin flag on profiles, middleware auth | Phase 1 |
| Epic 2 (Listings) | Listing moderation, flagging | Phase 2 |
| Epic 4 (Marketplace) | Provider verification queue, review moderation | Phase 5 |
| Resend (Email) | Contact form confirmation, verification notifications | Already in stack |
| Upstash Redis | Contact form rate limiting | Already in stack |

---

## 7. Technical Considerations

### Security
- Middleware-based auth check on all `/admin/*` routes. Single source of truth: `is_admin` on profiles table.
- All admin actions logged to `auth_audit_log` (from Epic 1 schema).
- Admin-only RLS policies use `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)`.
- Signed URLs for viewing provider verification documents — never expose direct storage URLs.

### Performance
- Admin data tables use server-side pagination via Supabase `.range()`.
- Dashboard count queries are simple indexed COUNT operations — no materialized views needed at MVP scale.
- Search on user management uses `ILIKE` on email/name fields with existing indexes.

### Architecture
- Admin panel is a route group `src/app/(admin)/` with its own layout (sidebar navigation, no public header/footer).
- Shares all components, services, and types with the main application. No code duplication.
- Same deployment, same build process, same environment variables.

---

## 8. Implementation Estimate

| Story | Dev Time | Priority |
|-------|----------|----------|
| E10-S01: Admin Auth (middleware + is_admin) | 0.5 days | Must |
| E10-S02: Admin Dashboard (count cards) | 0.5 days | Must |
| E10-S03: User Management | 2-3 days | Must |
| E10-S04: Listing Moderation (post-mod + auto-flag) | 2-3 days | Must |
| E10-S05: Provider Verification Queue | 2-3 days | Must |
| E10-S06: Review Moderation | 1-2 days | Should |
| E10-S07: Help Page (static MDX) | 1 day | Must |
| E10-S08: Contact Form | 0.5 days | Must |
| E10-S09: External Dashboard Links | 0.25 days | Should |
| **Total** | **10-14 days** | |

### Monthly Infrastructure Cost: $0

No new services. Uses existing Supabase, Resend, and Upstash Redis.

---

## 9. Migration Path (When to Upgrade)

| Trigger | Action | Cost |
|---------|--------|------|
| Admin team > 5 people | Add `admin_role` enum, conditional UI rendering | 2 days dev |
| Support tickets > 50/week | Sign up for Freshdesk Free, point contact form at Freshdesk email | 0 days dev, $0/mo |
| Support tickets > 500/week | Upgrade to Zendesk/Intercom paid tier | $200-500/mo |
| Help articles > 50 | Move content to Notion public pages or Mintlify | 1 day migration |
| Need platform-specific financial metrics | Build single-purpose query pages as needed | 1-2 days per metric |
| Need pre-moderation for legal compliance | Add `moderation_status` field, approval queue | 2-3 days dev |

---

## 10. QA & Testing Strategy

### Unit Tests
- Admin middleware: verify `is_admin` check blocks non-admin users.
- Profanity filter: verify flagging logic on known bad words and clean text.
- Price anomaly detection: verify flag triggers at boundary values.
- Contact form: Zod validation, rate limiting.

### Integration Tests
- User management: search, view, suspend, activate — verify DB state changes and audit log entries.
- Provider verification: approve/reject — verify status update, email notification sent, audit logged.
- Listing moderation: auto-flag triggers on creation, dismiss/remove actions.
- Content reporting: create report, verify it appears in admin queue.

### E2E Tests
- Admin logs in → sees dashboard counts → navigates to user management → searches for user → suspends account → verifies user cannot log in.
- Admin logs in → navigates to verification queue → views provider documents → approves provider → verifies badge appears on provider profile.
- Admin logs in → navigates to moderation queue → removes flagged listing → verifies listing no longer visible publicly.
- Non-admin user attempts to access `/admin/*` → redirected to home page.

### Manual Testing
- Verify all admin actions produce audit log entries.
- Verify contact form sends email and shows confirmation.
- Verify help page search filters FAQ items correctly.
- Verify profanity filter catches test cases without false positives on common words.
- Test admin panel on mobile (should be usable but desktop-optimized is acceptable).

---

## 11. What Was Cut and Why

| Original Spec Item | Why Cut | Savings |
|-------------------|---------|---------|
| Custom CMS with WYSIWYG editor (S07 original) | Rebuilds Notion/GitBook. Non-differentiating. MDX files in repo achieve the same result. | 10-16 days |
| Custom support ticket system (S08 original) | Rebuilds Zendesk. Freshdesk Free exists with 10 agents at $0/mo. | 13-20 days |
| Financial overview dashboard (S09 original) | Rebuilds Stripe Dashboard. Stripe's version is categorically better. | 8-12 days |
| Separate admin application (S10 original) | Doubles deployment complexity. Route group achieves same isolation. | Ongoing ops overhead |
| 3-tier admin RBAC (S11 original) | YAGNI. 1-2 admins at MVP. `is_admin` boolean is sufficient. | 9-14 days |
| Pre-moderation of all listings (S04 original) | Blocks agent adoption. Rightmove/Zoopla use post-moderation. | Agent churn avoided |
| Review dispute resolution workflow (S06 original) | Over-scoped. Handle disputes via email at MVP volume. | 3-5 days |
| Basic financial oversight charts (S09 original) | Zero meaningful data at launch. Premature optimization. | 3-5 days |

**Total development time saved: 43-65 days (8-13 weeks).**

---

*Epic 10 Final — Cost-optimized rewrite*
*Original spec: 51-79 days estimated development*
*Final spec: 10-14 days estimated development*
*Monthly infrastructure cost: $0 new spend*
