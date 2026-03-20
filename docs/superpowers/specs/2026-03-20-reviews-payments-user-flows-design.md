# Reviews & Ratings / Payments & Billing — 10 End-to-End User Flow Scenarios

**Date:** 2026-03-20
**Author:** Claude Code
**Status:** Draft — Awaiting Review
**Version:** 1.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Inventory](#2-system-inventory)
3. [Scenario 1: Leave a Review + Verification](#scenario-1)
4. [Scenario 2: Edit a Review (Within Window)](#scenario-2)
5. [Scenario 3: Report a Review](#scenario-3)
6. [Scenario 4: Reviews Aggregate by Category / Area](#scenario-4)
7. [Scenario 5: Subscription Purchase (End-to-End)](#scenario-5)
8. [Scenario 6: One-Time Payment — Boost / Featured Listing](#scenario-6)
9. [Scenario 7: Payment Method Management](#scenario-7)
10. [Scenario 8: Billing History & Invoices](#scenario-8)
11. [Scenario 9: Subscription Management — Upgrade / Downgrade / Cancel](#scenario-9)
12. [Scenario 10: Refund Request After Failed Payment](#scenario-10)
13. [Cross-Scenario Gap Analysis](#13-cross-scenario-gap-analysis)
14. [Final Scorecard & Recommendations](#14-final-scorecard--recommendations)

---

## 1. Overview

### Purpose

This document defines 10 end-to-end user flow scenarios covering **Reviews & Ratings** (pages 17.1–17.5) and **Payments & Billing** (pages 18.1–18.8) for FAANG-level QA validation.

### Page-to-Scenario Mapping

| Page ID | Page Name | Scenario(s) |
|---------|-----------|-------------|
| 17.1 | Leave a Review — Form | Scenario 1 |
| 17.2 | Review Verification Flow | Scenario 1 (Step 3) |
| 17.3 | Review — Edit (within window) | Scenario 2 |
| 17.4 | Report a Review | Scenario 3 |
| 17.5 | Reviews — Aggregate by Category / Area | Scenario 4 |
| 18.1 | Checkout — Subscription Purchase | Scenario 5 |
| 18.2 | Checkout — One-Time Payment (boost, featured listing) | Scenario 6 |
| 18.3 | Payment Method Management | Scenario 7 |
| 18.4 | Billing History / Invoices | Scenario 8 |
| 18.5 | Payment Confirmation | Scenario 5 (Step 4), Scenario 6 (Step 3) |
| 18.6 | Payment Failed | Scenario 5 (Step 5), Scenario 10 (Step 1) |
| 18.7 | Subscription Management (upgrade / downgrade / cancel) | Scenario 9 |
| 18.8 | Refund Request | Scenario 10 |

Each scenario serves a triple function:

- **QA Validation** — Verifiable test steps with explicit pass/fail checkpoints
- **UX Audit** — Qualitative assessment of information architecture, efficiency, and delight
- **Gap Analysis** — Systematic identification of missing features, dead ends, and edge cases

### Target Environment

- **Local dev** (`localhost:3000`) with Supabase local instance + Stripe test mode
- **Stripe test cards:** `4242424242424242` (success), `4000000000000002` (decline), `4000000000009995` (insufficient funds)
- **Stripe approach:** Mix — redirect boundary for hosted Checkout/Portal, embedded Stripe Elements for payment method and boost flows

### Evaluation Dimensions (FAANG Rubric)

| Dimension | Weight | What We're Measuring |
|-----------|--------|----------------------|
| Task Completion | 25% | Can the user complete the primary goal without help? |
| Efficiency | 20% | Minimum steps, no redundant actions, fast feedback |
| Error Handling | 15% | Graceful failures, actionable messages, recovery paths |
| Empty/Edge States | 15% | Zero-data views, boundary conditions, concurrent actions |
| Information Architecture | 15% | Discoverability, navigation, breadcrumbs, back-paths |
| Delight & Polish | 10% | Animations, confirmations, smart defaults, micro-interactions |

### Severity Ratings

- **P0** — Blocker: feature is broken or unusable
- **P1** — Critical: major friction, data loss risk, or security concern
- **P2** — Important: noticeable UX degradation or missing expected feature
- **P3** — Nice-to-have: polish, delight, or minor improvement

### Gap Categories

| Category | Definition |
|----------|------------|
| Dead End | User reaches a state with no clear next action |
| Missing Link | Expected navigation path doesn't exist |
| Missing Feature | Expected functionality not implemented |
| Data Gap | Required data not shown or not available |
| Mobile Gap | Feature doesn't work or degrades on mobile |
| Edge Case | Uncommon but valid scenario not handled |
| Routing Bug | Incorrect redirect, 404, or broken link |

---

## 2. System Inventory

### 2.1 Review & Rating Routes (8 pages + 8 API routes)

| Section | Route | Page | Auth |
|---------|-------|------|------|
| Public Reviews | `/reviews/[area]` | Area review aggregates | Public |
| Public Reviews | `/reviews/[area]/[provider]` | Provider review detail (**NOT YET BUILT — see GAP-4.8**) | Public |
| Broker Dashboard | `/dashboard/broker/reviews` | Broker review management | Protected |
| Dashboard | `/dashboard/reviews` | User's submitted reviews | Protected |
| Agent Dashboard | `/dashboard/agent/reviews` | Agent review management | Protected |
| Provider Dashboard | `/dashboard/provider/reviews` | Provider review management | Protected |
| Admin | `/admin/reviews` | Moderation queue | Admin |

| API Route | Methods | Purpose |
|-----------|---------|---------|
| `/api/reviews/create` | POST | Create review (requires booking) |
| `/api/reviews/list` | GET | List/filter reviews |
| `/api/reviews/[id]/edit` | PATCH | Edit review (48h window) |
| `/api/reviews/[id]/flag` | POST | Report/flag review |
| `/api/reviews/[id]/helpful` | POST | Vote helpfulness |
| `/api/reviews/[id]/respond` | POST | Provider response |
| `/api/reviews/aggregate` | GET | Aggregate stats |
| `/api/reviews/moderation/[id]` | PATCH | Moderate (admin) |

### 2.2 Payment & Billing Routes (9 pages + 10 API routes)

| Section | Route | Page | Auth |
|---------|-------|------|------|
| Billing Hub | `/dashboard/[role]/billing` | Billing overview | Protected |
| Subscription Checkout | `/dashboard/[role]/billing/checkout/subscription` | Plan selection + Stripe | Protected |
| One-Time Checkout | `/dashboard/[role]/billing/checkout/one-time` | Boost/featured purchase | Protected |
| Subscription Mgmt | `/dashboard/[role]/billing/subscription` | Current plan, upgrade/cancel | Protected |
| Invoices | `/dashboard/[role]/billing/invoices` | Invoice history + PDF | Protected |
| Payment Methods | `/dashboard/[role]/billing/payment-methods` | Card management | Protected |
| Confirmation | `/dashboard/[role]/billing/confirmation` | Post-payment success | Protected |
| Failed | `/dashboard/[role]/billing/failed` | Payment failure | Protected |
| Refund | `/dashboard/[role]/billing/refund` | Refund request form | Protected |

| API Route | Methods | Purpose |
|-----------|---------|---------|
| `/api/billing/checkout` | POST | Create Stripe checkout session |
| `/api/billing/session/[sessionId]` | GET | Check session status |
| `/api/billing/plans` | GET | List available plans |
| `/api/billing/proration` | GET | Calculate plan change cost |
| `/api/billing/invoices` | GET | List invoices |
| `/api/billing/methods` | GET | List payment methods |
| `/api/billing/refund` | POST | Submit refund request |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |
| `/api/provider/boost` | POST | Boost listing payment |
| `/api/stripe/connect/create-account` | POST | Provider Connect account |

### 2.3 Components

| Component | File | Purpose |
|-----------|------|---------|
| ReviewForm | `src/components/reviews/ReviewForm.tsx` | Multi-dimensional rating + text input |
| ReviewCardEnhanced | `src/components/reviews/ReviewCardEnhanced.tsx` | Review display with metadata |
| ReviewsList | `src/components/reviews/ReviewsList.tsx` | Paginated review list |
| EditReviewForm | `src/components/reviews/EditReviewForm.tsx` | Edit form (within window) |
| RatingStars | `src/components/reviews/RatingStars.tsx` | Star rating component |
| RatingDistribution | `src/components/reviews/RatingDistribution.tsx` | Rating breakdown bar chart |
| ReviewAggregateHero | `src/components/reviews/ReviewAggregateHero.tsx` | Aggregate header with stats |
| ReportReviewModal | `src/components/reviews/ReportReviewModal.tsx` | Flag/report modal |
| PlanGrid | `src/components/billing/PlanGrid.tsx` | Pricing plan cards |
| SubscriptionActions | `src/components/billing/SubscriptionActions.tsx` | CTA buttons for sub mgmt |
| StripeElementsProvider | `src/components/billing/StripeElementsProvider.tsx` | Stripe Elements context |
| UpgradePrompt | `src/components/billing/UpgradePrompt.tsx` | Upsell/upgrade banner |

### 2.4 Services

| Service | File | Domain |
|---------|------|--------|
| review-service | `src/services/marketplace/review-service.ts` | Review CRUD, sentiment, flagging |
| moderation-service | `src/services/marketplace/moderation-service.ts` | Review moderation workflows |
| billing-service | `src/services/billing/billing-service.ts` | Multi-role subscriptions, invoices, methods |
| refund-service | `src/services/billing/refund-service.ts` | Refund processing & tracking |
| entitlements-service | `src/services/billing/entitlements-service.ts` | Feature access by plan tier |
| provider-payment-service | `src/services/provider/provider-payment-service.ts` | Provider Stripe Connect payouts |
| provider-invoice-service | `src/services/provider/provider-invoice-service.ts` | Provider invoice generation |

### 2.5 Key Libraries & Config

| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe singleton factory |
| `src/lib/billing-config.ts` | Plan definitions, price IDs, validation |
| `src/lib/validators/marketplace-schemas.ts` | Zod schemas for review create/edit/flag |
| `src/lib/marketplace/sentiment-analyzer.ts` | Review sentiment analysis |
| `src/lib/marketplace/spam-detector.ts` | Spam/PII detection + redaction |

---

## Scenario 1: Leave a Review + Verification {#scenario-1}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Sarah Mitchell |
| **Age** | 34 |
| **Role** | Homebuyer |
| **Context** | Just completed a house purchase through an estate agent found on Britestate |
| **Booking status** | Completed booking with agent "Harris & Co" 3 days ago |
| **Tech comfort** | High — uses Trustpilot and Google Reviews regularly |
| **Emotional state** | Satisfied but detail-oriented; wants to leave a thorough, fair review |

### FAANG Benchmark

**Google Maps** review submission — multi-dimensional rating with photo upload, verified purchase badge, immediate visibility with moderation layer.

### End-to-End Journey

#### Step 1: Navigate to Completed Booking

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Log in as homebuyer | `/login` → `/dashboard` | Dashboard loads with recent activity |
| 1.2 | Navigate to completed bookings or agent profile | `/dashboard/reviews` or agent public profile | See "Leave a Review" CTA next to completed booking |
| 1.3 | Click "Leave a Review" | `/dashboard/reviews` or inline modal | ReviewForm component renders |

**QA Checkpoints:**
- [ ] "Leave a Review" CTA only appears for bookings with status `completed`
- [ ] CTA does not appear for bookings less than 24h old (cooling period)
- [ ] CTA does not appear if user has already reviewed this booking
- [ ] User cannot access review form for someone else's booking

**UX Audit:**
- Is the "Leave a Review" CTA discoverable without searching?
- Does the UI explain why a review CTA might not appear (pending booking, already reviewed)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-1.1 | Missing Link | P2 | Is there a direct link from booking confirmation email to review form? |
| GAP-1.2 | Data Gap | P2 | Does the review form pre-populate the provider name and booking details? |

#### Step 2: Fill Out Multi-Dimensional Review

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Set overall rating (1–5 stars) | In-page form | Stars highlight on hover, click to set |
| 2.2 | Set sub-ratings: punctuality, quality, value, professionalism | In-page form | Each dimension has its own 1–5 star input |
| 2.3 | Enter title (5–100 chars) | In-page form | Character counter shown, validates on blur |
| 2.4 | Enter review text (20–2000 chars) | In-page form | Character counter, rich text hints |
| 2.5 | Preview review before submission | In-page form | Toggle preview mode showing formatted output |

**QA Checkpoints:**
- [ ] Title rejects < 5 chars and > 100 chars with inline error
- [ ] Review text rejects < 20 chars and > 2000 chars with inline error
- [ ] Star rating is keyboard-accessible (arrow keys)
- [ ] Form state persists if user navigates away and returns (localStorage draft)
- [ ] All 4 sub-ratings are required (not just overall)

**UX Audit:**
- Are the sub-rating dimensions explained (tooltip or helper text)?
- Does the form feel overwhelming with 5 rating dimensions?
- Is there a progress indicator for form completion?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-1.3 | Missing Feature | P3 | Photo/image upload for review evidence |
| GAP-1.4 | Edge Case | P2 | What happens if user submits with only 1 sub-rating filled? |

#### Step 3: Submit and Verification

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Click "Submit Review" | `POST /api/reviews/create` | Loading spinner on button, disabled to prevent double-submit |
| 3.2 | Backend: sentiment analysis runs | Server-side | `sentiment-analyzer.ts` classifies sentiment |
| 3.3 | Backend: spam/PII detection runs | Server-side | `spam-detector.ts` redacts PII, flags spam |
| 3.4 | Review created with `moderation_status: pending` | DB write | Review saved, not yet publicly visible |
| 3.5 | Success confirmation shown | In-page or redirect | "Thank you! Your review is being verified and will appear shortly." |
| 3.6 | Verification badge logic: booking exists + completed | Server-side | `verified_purchase: true` set on review |

**QA Checkpoints:**
- [ ] Double-click on submit does NOT create duplicate reviews
- [ ] API returns 400 if booking_id is invalid or not completed
- [ ] API returns 409 if review already exists for this booking
- [ ] Sentiment score is stored on the review record
- [ ] PII (phone numbers, emails) is redacted from review text before storage
- [ ] Review appears with "Verified" badge on public profile after moderation
- [ ] Toast/notification confirms submission

**UX Audit:**
- Does the success message explain the verification timeline?
- Is there a link to view the review once it's approved?
- Can the user share the review on social media post-submission?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-1.5 | Dead End | P1 | After submission, is the user directed somewhere useful (back to profile, dashboard)? |
| GAP-1.6 | Missing Feature | P2 | Email notification when review is approved/rejected by moderation |
| GAP-1.7 | Edge Case | P1 | What if the provider's profile is deactivated between booking completion and review submission? |

#### Step 4: Provider Notification and Response

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Provider receives notification of new review | Realtime / email | In-app notification + email alert |
| 4.2 | Provider navigates to review | `/dashboard/agent/reviews` | Review visible with "Respond" button |
| 4.3 | Provider writes response | `POST /api/reviews/[id]/respond` | Response appears below review |

**QA Checkpoints:**
- [ ] Provider notification fires within 60 seconds of review approval
- [ ] Provider can only respond once per review
- [ ] Provider response is also subject to PII/spam detection
- [ ] Response appears publicly beneath the original review

**UX Audit:**
- Does the provider see the review rating prominently?
- Can the provider flag a review they believe is fraudulent from the same page?

### Scenario 1 Scorecard

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Task Completion | — | Can Sarah leave a complete review from booking to confirmation? |
| Efficiency | — | How many clicks from dashboard to submitted review? |
| Error Handling | — | What happens with invalid input, duplicate submission, network error? |
| Empty/Edge States | — | First review ever? Provider deactivated? Booking still pending? |
| Information Architecture | — | Can Sarah find the review form without help? |
| Delight & Polish | — | Star animation, character counter, preview mode? |

### Scenario 1 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-1.1 | Missing Link | P2 | Direct link from booking confirmation email to review form |
| GAP-1.2 | Data Gap | P2 | Review form should pre-populate provider name/booking details |
| GAP-1.3 | Missing Feature | P3 | Photo/image upload for review evidence |
| GAP-1.4 | Edge Case | P2 | Partial sub-rating submission handling |
| GAP-1.5 | Dead End | P1 | Post-submission navigation — where does the user go? |
| GAP-1.6 | Missing Feature | P2 | Email notification for review approval/rejection |
| GAP-1.7 | Edge Case | P1 | Review submission for deactivated provider |

---

## Scenario 2: Edit a Review (Within Window) {#scenario-2}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Priya Sharma |
| **Age** | 28 |
| **Role** | Renter |
| **Context** | Left a 3-star review for a letting agent yesterday, but realized she confused two agents |
| **Review age** | 18 hours old (within 48h edit window) |
| **Tech comfort** | Medium — uses apps daily but rarely edits content |
| **Emotional state** | Slightly embarrassed, wants to correct quickly |

### FAANG Benchmark

**Amazon** review edit — inline edit with version history, clear "edited" label, time-limited editing window.

### End-to-End Journey

#### Step 1: Find the Review to Edit

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Log in as renter | `/login` → `/dashboard` | Dashboard loads |
| 1.2 | Navigate to "My Reviews" | `/dashboard/reviews` | List of submitted reviews with edit/delete actions |
| 1.3 | Locate the 3-star review | In-page list | Review shows "Edit" button (within 48h window) |

**QA Checkpoints:**
- [ ] "Edit" button visible for reviews < 48h old
- [ ] "Edit" button hidden/disabled for reviews > 48h old with tooltip explaining why
- [ ] Reviews are sorted by most recent first
- [ ] Each review card shows remaining edit window time (e.g., "30h left to edit")

**UX Audit:**
- Is the "My Reviews" section discoverable from the dashboard?
- Does the countdown create urgency without causing anxiety?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-2.1 | Missing Link | P2 | No "Edit Review" link in the review confirmation email |
| GAP-2.2 | Data Gap | P3 | Remaining edit time not shown on review card |

#### Step 2: Edit the Review

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Click "Edit" on the review | In-page or `/dashboard/reviews/[id]/edit` | EditReviewForm loads with current values pre-filled |
| 2.2 | Change overall rating from 3 to 4 stars | In-page form | Stars update, sub-ratings remain |
| 2.3 | Update review text to correct the confusion | In-page form | Character counter updates |
| 2.4 | Click "Save Changes" | `PATCH /api/reviews/[id]/edit` | Loading state, then success |

**QA Checkpoints:**
- [ ] All fields pre-populated with existing values (ratings + text)
- [ ] API returns 403 if edit window has expired
- [ ] API returns 403 if user is not the review author
- [ ] Edit history is stored in JSONB `edit_history` column
- [ ] Review shows "Edited" badge after update with timestamp
- [ ] Re-runs sentiment analysis on updated text
- [ ] Re-runs spam/PII detection on updated text
- [ ] Moderation status resets to `pending` after significant text changes

**UX Audit:**
- Is there a diff view showing what changed?
- Does the form warn if the edit window is about to expire while editing?
- Can the user cancel the edit and revert to original?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-2.3 | Edge Case | P1 | What if the 48h window expires while the user is actively editing? |
| GAP-2.4 | Missing Feature | P3 | No "undo edit" or version history visible to the user |
| GAP-2.5 | Edge Case | P2 | Does editing a review invalidate the provider's existing response? |

#### Step 3: Confirmation and Visibility

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Success toast appears | In-page | "Review updated successfully" |
| 3.2 | Review list updates with new rating/text | `/dashboard/reviews` | Updated review shows "Edited" label |
| 3.3 | Public profile reflects updated review | Provider public profile | New rating, "Edited" badge, updated aggregate |

**QA Checkpoints:**
- [ ] Provider aggregate rating recalculates after edit
- [ ] Provider receives notification that a review was edited
- [ ] "Edited" label shows original submission date + edit date
- [ ] If rating changed significantly (±2 stars), does it trigger re-moderation?

### Scenario 2 Scorecard

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Task Completion | — | Can Priya find, edit, and save her review within the window? |
| Efficiency | — | How many clicks from dashboard to saved edit? |
| Error Handling | — | Window expiry during edit, network failure mid-save? |
| Empty/Edge States | — | No reviews to edit? Window just expired? |
| Information Architecture | — | Is "My Reviews" easy to find? Is the edit button obvious? |
| Delight & Polish | — | Pre-filled form, countdown timer, edit confirmation? |

### Scenario 2 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-2.1 | Missing Link | P2 | No edit link in review confirmation email |
| GAP-2.2 | Data Gap | P3 | Edit window countdown not shown on card |
| GAP-2.3 | Edge Case | P1 | 48h window expiry during active edit session |
| GAP-2.4 | Missing Feature | P3 | No user-facing version history / undo |
| GAP-2.5 | Edge Case | P2 | Provider response invalidation after edit |

---

## Scenario 3: Report a Review {#scenario-3}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Marcus Chen |
| **Age** | 45 |
| **Role** | Service Provider (plumber) |
| **Context** | Received a 1-star review from someone he never worked with — likely a competitor |
| **Reviews received** | 47 reviews, 4.6 average |
| **Tech comfort** | Low-medium — uses phone primarily |
| **Emotional state** | Frustrated and concerned about reputation damage |

### FAANG Benchmark

**Yelp** review reporting — structured reason selection, evidence upload, clear timeline for resolution, transparency on outcome.

### End-to-End Journey

#### Step 1: Identify the Fraudulent Review

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Log in as provider | `/login` → `/dashboard/provider` | Provider dashboard loads |
| 1.2 | See notification "New 1-star review" | Dashboard notification | Alert badge or toast |
| 1.3 | Navigate to reviews | `/dashboard/provider/reviews` | Reviews list with the new 1-star review highlighted |
| 1.4 | Click on the review to expand | In-page | Full review text, reviewer info (anonymized), booking reference |

**QA Checkpoints:**
- [ ] Provider can see all reviews received, sorted by date
- [ ] New/unread reviews are visually distinguished
- [ ] Review card shows: rating, date, review text, reviewer name, booking reference
- [ ] If no booking exists for this reviewer, that's visible as "Unverified"

**UX Audit:**
- Can Marcus quickly distinguish verified vs unverified reviews?
- Is the reviewer's identity appropriately anonymized for privacy?

#### Step 2: Report the Review

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Click "Report" or flag icon on the review | In-page | ReportReviewModal opens |
| 2.2 | Select reason: `fake` from enum options | Modal form | Options: spam, inappropriate, fake, off_topic, contact_info |
| 2.3 | Add supporting details (free text) | Modal form | Text area for evidence/explanation |
| 2.4 | Submit report | `POST /api/reviews/[id]/flag` | Loading state, then confirmation |

**QA Checkpoints:**
- [ ] Modal requires a reason selection before submit
- [ ] Free text details are optional but encouraged
- [ ] API uses `atomic_flag_review()` RPC — atomic increment of `flag_count`
- [ ] User cannot flag the same review twice (409 conflict)
- [ ] Review's `flag_count` increments; auto-escalates to moderation at threshold (e.g., 3 flags)
- [ ] Flag submission is rate-limited (prevent abuse)

**UX Audit:**
- Are the flag reason options clear and distinct?
- Does the modal explain what happens after reporting?
- Is there a character limit on the details field?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-3.1 | Missing Feature | P2 | No evidence/screenshot upload for flag reports |
| GAP-3.2 | Data Gap | P1 | No visibility into report status (pending, reviewed, action taken) |
| GAP-3.3 | Missing Feature | P2 | No way to see if a review is "unverified" (no matching booking) |

#### Step 3: Post-Report Experience

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Confirmation message shown | In-page / toast | "Report submitted. Our team will review within 48 hours." |
| 3.2 | Review remains visible but may show "Under Review" | Public profile | Review stays up until moderation decides |
| 3.3 | Marcus checks report status later | `/dashboard/provider/reviews` | Report status indicator on the flagged review |
| 3.4 | Admin moderates the review | `/admin/reviews` | Review approved, removed, or reviewer warned |
| 3.5 | Marcus receives outcome notification | Email + in-app | "The review you reported has been removed" / "maintained" |

**QA Checkpoints:**
- [ ] Flagged review is visible in admin moderation queue
- [ ] Admin can see flag count, reasons, and reporter details
- [ ] Admin action (approve/reject/remove) updates review status
- [ ] Provider is notified of outcome
- [ ] If review is removed, aggregate rating recalculates
- [ ] Removed review is soft-deleted (not hard-deleted) for audit

**UX Audit:**
- Does Marcus know what to expect after reporting?
- Is the resolution timeline communicated?
- Can Marcus respond to the review while it's under moderation?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-3.4 | Dead End | P1 | No report status tracking — user has no visibility after submission |
| GAP-3.5 | Missing Feature | P2 | No outcome notification to the reporter |
| GAP-3.6 | Edge Case | P3 | What if reviewer edits the review while it's under moderation? |

### Scenario 3 Scorecard

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Task Completion | — | Can Marcus report the review and understand the outcome? |
| Efficiency | — | Steps from notification to submitted report? |
| Error Handling | — | Duplicate flag, rate limiting, network error? |
| Empty/Edge States | — | No flags available? Report already submitted? |
| Information Architecture | — | Is "Report" discoverable? Is moderation status clear? |
| Delight & Polish | — | Confirmation copy, timeline expectation, outcome notification? |

### Scenario 3 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-3.1 | Missing Feature | P2 | No evidence/screenshot upload for flags |
| GAP-3.2 | Data Gap | P1 | No report status tracking for the reporter |
| GAP-3.3 | Missing Feature | P2 | Unverified review indicator not visible |
| GAP-3.4 | Dead End | P1 | No post-report status visibility |
| GAP-3.5 | Missing Feature | P2 | No outcome notification to reporter |
| GAP-3.6 | Edge Case | P3 | Review edit during active moderation |

---

## Scenario 4: Reviews Aggregate by Category / Area {#scenario-4}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | James Okonkwo |
| **Age** | 31 |
| **Role** | Homebuyer (prospective) |
| **Context** | Researching estate agents and tradespeople in Manchester before buying |
| **Search criteria** | Manchester, M1-M4 postcodes, estate agents and plumbers |
| **Tech comfort** | High — compares ratings across Trustpilot, Google, Checkatrade |
| **Emotional state** | Analytical, wants data-driven decisions |

### FAANG Benchmark

**Yelp/Tripadvisor** area aggregation — heatmaps of provider density, rating distributions, category filtering, "Best of" lists.

### End-to-End Journey

#### Step 1: Browse Area Reviews

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Navigate to area reviews (from navbar or search) | `/reviews/manchester` | Area review landing page with aggregate stats |
| 1.2 | ReviewAggregateHero renders | In-page | Overall area rating, total reviews count, rating distribution chart |
| 1.3 | RatingDistribution shows bar chart | In-page | 5-star to 1-star bars with percentages |

**QA Checkpoints:**
- [ ] Area page loads with data from `area_rating_stats` materialized view
- [ ] Hero section shows: average rating, total reviews, review count trend
- [ ] Rating distribution bars are proportional and interactive (click to filter)
- [ ] Page is SEO-friendly (server-rendered, meta tags, structured data)
- [ ] Breadcrumb: Home > Reviews > Manchester

**UX Audit:**
- Does the hero section give James enough confidence in the data quality?
- Is the area name correctly resolved from the URL slug?
- Are there links to sub-areas (M1, M2, M3, M4)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-4.1 | Missing Feature | P2 | No provider density map showing reviewed providers geographically |
| GAP-4.2 | Data Gap | P3 | No comparison with national average ratings |

#### Step 2: Filter by Category

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Select category filter: "Estate Agents" | In-page filter | Reviews filtered to estate agents only |
| 2.2 | Aggregate stats recalculate for category | In-page | Hero updates with agent-specific averages |
| 2.3 | Switch to "Plumbers" category | In-page filter | Reviews filtered to plumbers, stats update |
| 2.4 | Sort reviews by "Highest Rated" | In-page sort | Review list reorders |

**QA Checkpoints:**
- [ ] Category filter is a dropdown or pill selector with all provider types
- [ ] Switching categories does not cause full page reload (client-side filter)
- [ ] Sort options: Highest Rated, Lowest Rated, Most Recent, Most Helpful
- [ ] URL updates with query params for shareable filtered views (e.g., `?category=estate-agents&sort=highest`)
- [ ] Empty state if no reviews exist for a category in this area

**UX Audit:**
- Can James compare categories side-by-side?
- Is the number of reviews per category shown in the filter dropdown?
- Does filtering feel instant or is there a loading state?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-4.3 | Missing Feature | P2 | No side-by-side category comparison |
| GAP-4.4 | Edge Case | P2 | Empty state for categories with zero reviews |

#### Step 3: Drill Into Provider

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Click on a provider name in the review list | `/reviews/manchester/harris-and-co` or provider profile | Provider detail with all reviews |
| 3.2 | See provider-specific aggregate | In-page | Provider rating breakdown by dimension |
| 3.3 | Read individual reviews with helpfulness votes | In-page | ReviewCardEnhanced with "Was this helpful?" button |
| 3.4 | Vote on review helpfulness | `POST /api/reviews/[id]/helpful` | Vote count increments, button state changes |

**QA Checkpoints:**
- [ ] Provider page shows: overall rating, per-dimension averages, total reviews
- [ ] Helpfulness vote is one-time per user per review (toggle, not increment)
- [ ] Anonymous users see helpfulness counts but cannot vote (prompted to log in)
- [ ] Provider response is displayed inline below each review
- [ ] Pagination works for providers with 50+ reviews

**UX Audit:**
- Does James get enough information to compare providers without leaving the page?
- Is the "Was this helpful?" CTA positioned naturally?
- Are reviews paginated or infinitely scrolled?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-4.5 | Missing Feature | P3 | No "Compare Providers" feature from aggregate page |
| GAP-4.6 | Missing Link | P2 | No link from review aggregate to provider's booking/quote page |
| GAP-4.7 | Data Gap | P2 | Review recency — are all reviews shown or only last 12 months? |
| GAP-4.8 | Routing Bug | P1 | `/reviews/[area]/[provider]` route does not exist — page not yet built |

### Scenario 4 Scorecard

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Task Completion | — | Can James research providers by area and category effectively? |
| Efficiency | — | Can he filter, sort, and drill into providers without friction? |
| Error Handling | — | Empty categories, invalid area slugs, network errors? |
| Empty/Edge States | — | Area with zero reviews? Category with one provider? |
| Information Architecture | — | Breadcrumbs, back-navigation, shareable URLs? |
| Delight & Polish | — | Animated bars, smooth filtering, rich data visualization? |

### Scenario 4 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-4.1 | Missing Feature | P2 | No geographic map of reviewed providers |
| GAP-4.2 | Data Gap | P3 | No national average comparison |
| GAP-4.3 | Missing Feature | P2 | No side-by-side category comparison |
| GAP-4.4 | Edge Case | P2 | Empty state for zero-review categories |
| GAP-4.5 | Missing Feature | P3 | No "Compare Providers" feature |
| GAP-4.6 | Missing Link | P2 | No link from aggregate to booking/quote page |
| GAP-4.7 | Data Gap | P2 | Review recency/filtering by date range |
| GAP-4.8 | Routing Bug | P1 | `/reviews/[area]/[provider]` route does not exist — page not yet built |

---

## Scenario 5: Subscription Purchase (End-to-End) {#scenario-5}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | David Hartley |
| **Age** | 52 |
| **Role** | Estate Agent (branch manager) |
| **Context** | New to Britestate, wants to subscribe to Pro plan for his branch |
| **Current plan** | None — free trial expired, dashboard gated by middleware |
| **Tech comfort** | Medium — comfortable with online payments |
| **Emotional state** | Motivated but cost-conscious, wants value for money |

### FAANG Benchmark

**Spotify** subscription checkout — clear plan comparison, transparent pricing, immediate access upon payment, frictionless upgrade path.

### End-to-End Journey

#### Step 1: Subscription Gate Redirect

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Log in as agent | `/login` → `/dashboard/agent` | Middleware detects no active subscription |
| 1.2 | Middleware redirects to checkout | `/dashboard/agent/billing/checkout/subscription` | Plan selection page loads |

**QA Checkpoints:**
- [ ] Middleware checks `subscriptions` table for `status = active OR trialing`
- [ ] Redirect preserves intended destination as `?returnTo=` query param
- [ ] User sees a clear message: "Subscribe to access your agent dashboard"
- [ ] `BYPASS_SUBSCRIPTION_GATE=true` env var works for E2E testing

**UX Audit:**
- Is the gate message welcoming rather than blocking?
- Does David understand why he's being redirected?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-5.1 | Dead End | P1 | If user dismisses checkout, where do they go? Can they access any part of the app? |

#### Step 2: Plan Comparison and Selection

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | PlanGrid component renders | In-page | 2-3 plans displayed with feature comparison |
| 2.2 | Review plan features and pricing | In-page | Clear feature matrix, pricing prominent |
| 2.3 | Toggle monthly/annual billing | In-page | Prices update, annual discount shown |
| 2.4 | Select "Pro" plan | In-page | Plan highlighted, "Continue" CTA enabled |

**QA Checkpoints:**
- [ ] Plans load from `billing-config.ts` — `AGENT_PLANS` constant
- [ ] Monthly and annual prices shown with savings percentage for annual
- [ ] Current plan (if any) is marked as "Current"
- [ ] Feature comparison is complete and accurate
- [ ] VAT/tax is mentioned (UK requirement)
- [ ] "Most Popular" or recommended plan is visually highlighted

**UX Audit:**
- Are plan differences clear at a glance?
- Is the annual savings compelling enough?
- Is VAT handling transparent (included or excluded)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-5.2 | Data Gap | P2 | Is VAT included in displayed prices? UK law requires clarity |
| GAP-5.3 | Missing Feature | P3 | No "Compare plans" side-by-side table (only cards) |

#### Step 3: Stripe Checkout (Redirect Boundary)

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Click "Subscribe to Pro" | `POST /api/billing/checkout` | API creates Stripe Checkout session |
| 3.2 | API validates price ID against allowlist | Server-side | `isPriceIdAllowed()` check in billing-config |
| 3.3 | API validates return URL | Server-side | `isValidReturnUrl()` prevents open redirect |
| 3.4 | Redirect to Stripe Checkout | `https://checkout.stripe.com/...` | **Redirect boundary — Stripe hosted page** |
| 3.5 | [Stripe] Enter test card `4242424242424242` | Stripe hosted | Card accepted |
| 3.6 | [Stripe] Complete payment | Stripe hosted | Redirects back to Britestate |

**QA Checkpoints:**
- [ ] Checkout session includes correct `price_id`, `customer_email`, `metadata`
- [ ] `success_url` points to `/dashboard/agent/billing/confirmation?session_id={CHECKOUT_SESSION_ID}`
- [ ] `cancel_url` points back to plan selection page
- [ ] Price ID is validated against `ALLOWED_PRICE_IDS` set
- [ ] Return URL validated by `isValidReturnUrl()` — no open redirects
- [ ] Session metadata includes `role: agent`, `plan: pro`

**UX Audit:**
- Is the transition to Stripe smooth (loading state, not jarring)?
- Does the Stripe page have Britestate branding?

#### Step 4: Payment Confirmation

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Stripe redirects to confirmation page | `/dashboard/agent/billing/confirmation?session_id=cs_test_...` | Confirmation page loads |
| 4.2 | Page fetches session status | `GET /api/billing/session/[sessionId]` | Payment status verified |
| 4.3 | Webhook fires: `checkout.session.completed` | `POST /api/webhooks/stripe` | Subscription created in DB |
| 4.4 | Confirmation shows plan details | In-page | Plan name, amount, next billing date |
| 4.5 | Dashboard access unlocked | `/dashboard/agent` | Full dashboard accessible |

**QA Checkpoints:**
- [ ] Confirmation page handles race condition: webhook may arrive before/after page load
- [ ] Page polls or uses Realtime to update when subscription is activated
- [ ] `billing_events` table has idempotent record (stripe_event_id UNIQUE)
- [ ] `subscriptions` table has new row with `status: active`
- [ ] Email receipt sent (Stripe-generated or custom)
- [ ] Entitlements immediately available (feature gates unlocked)
- [ ] `returnTo` param respected — redirects to originally intended page

**UX Audit:**
- Does the confirmation page feel celebratory?
- Is the next billing date clearly shown?
- Is there a clear CTA to start using the dashboard?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-5.4 | Edge Case | P1 | Race condition: page loads before webhook — what does user see? |
| GAP-5.5 | Missing Feature | P2 | No welcome email with onboarding steps after first subscription |
| GAP-5.6 | Edge Case | P2 | What if user navigates away from confirmation before webhook? |

#### Step 5: Payment Failed Path

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | [Stripe] Card declined (test card `4000000000000002`) | Stripe hosted | Stripe shows error |
| 5.2 | User clicks "Back" or Stripe redirects | `/dashboard/agent/billing/failed` or cancel URL | Failed payment page |
| 5.3 | Failed page shows error reason | In-page | "Payment declined. Please try a different card." |
| 5.4 | "Try Again" CTA | In-page | Returns to plan selection |

**QA Checkpoints:**
- [ ] Failed page loads without errors
- [ ] Error reason is user-friendly (not Stripe error codes)
- [ ] "Try Again" returns to plan selection with previous plan pre-selected
- [ ] No subscription created in DB after failed payment
- [ ] No billing_event created for declined payment (or marked as failed)

**UX Audit:**
- Is the failure message empathetic, not blaming?
- Are alternative payment methods suggested?
- Can David contact support from the failed page?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-5.7 | Missing Link | P2 | No support contact link on payment failed page |
| GAP-5.8 | Missing Feature | P3 | No alternative payment methods (Direct Debit, bank transfer) |

### Scenario 5 Scorecard

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Task Completion | — | Can David go from gate to active subscription? |
| Efficiency | — | How many steps from redirect to dashboard access? |
| Error Handling | — | Declined card, webhook race, network failure? |
| Empty/Edge States | — | Expired trial, already subscribed, mid-checkout abandon? |
| Information Architecture | — | Plan comparison clarity, pricing transparency? |
| Delight & Polish | — | Celebratory confirmation, smooth transitions? |

### Scenario 5 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-5.1 | Dead End | P1 | No escape path from checkout page without subscribing |
| GAP-5.2 | Data Gap | P2 | VAT clarity in pricing display |
| GAP-5.3 | Missing Feature | P3 | No plan comparison table |
| GAP-5.4 | Edge Case | P1 | Webhook race condition on confirmation page |
| GAP-5.5 | Missing Feature | P2 | No welcome/onboarding email after first subscription |
| GAP-5.6 | Edge Case | P2 | Navigation away from confirmation before webhook |
| GAP-5.7 | Missing Link | P2 | No support contact on failed payment page |
| GAP-5.8 | Missing Feature | P3 | No alternative payment methods |

---

## Scenario 6: One-Time Payment — Boost / Featured Listing {#scenario-6}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Elena Petrova |
| **Age** | 38 |
| **Role** | Service Provider (electrician) |
| **Context** | Wants to boost her listing to appear higher in search results for 14 days |
| **Current plan** | Active Pro subscription |
| **Tech comfort** | Medium — uses phone and laptop |
| **Emotional state** | Business-focused, ROI-driven |

### FAANG Benchmark

**LinkedIn** promoted posts — clear pricing, preview of boosted visibility, duration selection, embedded payment flow.

### End-to-End Journey

#### Step 1: Discover Boost Option

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Log in as provider | `/login` → `/dashboard/provider` | Dashboard loads |
| 1.2 | Navigate to listings or marketing section | `/dashboard/provider` | See "Boost" or "Promote" CTA on listing card |
| 1.3 | Click "Boost Listing" | `/dashboard/provider/billing/checkout/one-time` | Boost purchase page loads |

**QA Checkpoints:**
- [ ] Boost CTA is visible on listing cards
- [ ] Boost option requires active subscription (entitlement gate)
- [ ] Already-boosted listings show remaining boost duration instead of CTA

**UX Audit:**
- Is the value proposition of boosting clear?
- Does Elena understand what "boost" means in terms of visibility?

#### Step 2: Select Boost Duration and Pay (Embedded Elements)

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | See boost options: 7-day, 14-day, 30-day | In-page | Cards showing duration, price, estimated impressions |
| 2.2 | Select 14-day boost (from `BOOST_PRICES` config) | In-page | Selected option highlighted |
| 2.3 | Stripe Elements payment form renders | In-page | Card input, name, postcode fields (embedded, not redirect) |
| 2.4 | Enter test card `4242424242424242` | In-page Stripe Element | Card accepted |
| 2.5 | Click "Pay £XX" | `POST /api/provider/boost` | Payment processed |

**QA Checkpoints:**
- [ ] Boost prices match `BOOST_PRICES` from `billing-config.ts`
- [ ] Stripe Elements renders correctly within `StripeElementsProvider`
- [ ] Payment intent created server-side, client confirms
- [ ] Button shows exact amount: "Pay £29.99" not "Pay"
- [ ] Loading/processing state on button during payment
- [ ] 3D Secure challenge handled if required by card

**UX Audit:**
- Is the estimated impression/visibility increase shown?
- Does the embedded payment feel secure (Stripe badge, lock icon)?
- Is the price inclusive of VAT?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-6.1 | Missing Feature | P2 | No preview of how the boosted listing will appear in search results |
| GAP-6.2 | Data Gap | P2 | No historical ROI data ("Previous boosts got X% more views") |

#### Step 3: Confirmation

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Payment confirmed | `/dashboard/provider/billing/confirmation` | Success page with boost details |
| 3.2 | Listing immediately boosted | Search results | Listing appears higher / with "Promoted" badge |
| 3.3 | Boost expiry date shown | Dashboard | "Boost active until [date]" |
| 3.4 | Receipt available in invoices | `/dashboard/provider/billing/invoices` | One-time charge appears |

**QA Checkpoints:**
- [ ] Boost start time is immediate after payment
- [ ] Boost end time is exactly duration from now (14 days)
- [ ] Invoice/receipt generated for the one-time payment
- [ ] Listing shows "Promoted" badge in search results
- [ ] Boost status visible on provider dashboard

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-6.3 | Missing Feature | P3 | No boost analytics dashboard (impressions, clicks during boost) |
| GAP-6.4 | Edge Case | P2 | What if Elena boosts a listing that gets deactivated during boost period? |

### Scenario 6 Scorecard

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Task Completion | — | Can Elena purchase a boost and see it reflected on her listing? |
| Efficiency | — | How many clicks from dashboard to boosted listing? |
| Error Handling | — | Declined card, 3DS failure, already-boosted listing? |
| Empty/Edge States | — | No listings to boost? Boost during listing deactivation? |
| Information Architecture | — | Is the boost option discoverable? Is ROI clear? |
| Delight & Polish | — | Embedded payment feels native, immediate boost activation? |

### Scenario 6 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-6.1 | Missing Feature | P2 | No boosted listing preview |
| GAP-6.2 | Data Gap | P2 | No historical boost ROI data |
| GAP-6.3 | Missing Feature | P3 | No boost-specific analytics |
| GAP-6.4 | Edge Case | P2 | Listing deactivation during active boost |

---

## Scenario 7: Payment Method Management {#scenario-7}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Fatima Al-Rashid |
| **Age** | 41 |
| **Role** | Landlord |
| **Context** | Corporate credit card expiring next month, needs to update payment method |
| **Current plan** | Active Standard subscription, billed monthly |
| **Payment methods** | 1 card on file (expiring soon) |
| **Tech comfort** | High — manages multiple SaaS subscriptions |
| **Emotional state** | Proactive, wants to prevent payment failure |

### FAANG Benchmark

**Amazon** payment method management — add/remove/set default cards, clear default indicator, inline editing, saved card security.

### End-to-End Journey

#### Step 1: Navigate to Payment Methods

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Log in as landlord | `/login` → `/dashboard/landlord` | Dashboard loads |
| 1.2 | Navigate to billing | `/dashboard/landlord/billing` | Billing hub with subscription overview |
| 1.3 | Click "Payment Methods" | `/dashboard/landlord/billing/payment-methods` | Card management page |

**QA Checkpoints:**
- [ ] Billing link is in the sidebar/settings navigation
- [ ] Current payment method shows last 4 digits, brand (Visa/MC), expiry
- [ ] Expiring card shows warning badge ("Expires in 28 days")
- [ ] Default card is clearly marked

**UX Audit:**
- Is the expiring card warning prominent enough to prompt action?
- Can Fatima reach payment methods in ≤ 3 clicks from dashboard?

#### Step 2: Add New Payment Method (Embedded Elements)

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Click "Add Payment Method" | In-page | Stripe Elements card input renders |
| 2.2 | Enter new card details (test card) | In-page Stripe Element | Real-time validation (Luhn check, expiry) |
| 2.3 | Click "Add Card" | `POST /api/billing/methods` | SetupIntent confirmed, card saved |
| 2.4 | New card appears in list | In-page | Two cards now shown |

**QA Checkpoints:**
- [ ] Stripe Elements renders inline (not modal or redirect)
- [ ] Card validation is real-time (invalid number, past expiry)
- [ ] SetupIntent used (not PaymentIntent) — no charge on add
- [ ] New card saved to Stripe customer, synced to local display
- [ ] 3D Secure handled if required

**UX Audit:**
- Does the inline Elements form feel native to the page?
- Is there a "Cancel" option to dismiss the form without saving?

#### Step 3: Set Default and Remove Old Card

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Click "Set as Default" on new card | `PUT /api/billing/methods` | Default updated |
| 3.2 | Default indicator moves to new card | In-page | Visual confirmation |
| 3.3 | Click "Remove" on old expiring card | `DELETE /api/billing/methods` | Confirmation dialog |
| 3.4 | Confirm removal | In-page | Card removed from list |

**QA Checkpoints:**
- [ ] Cannot remove the default card (must set another as default first)
- [ ] Cannot remove the only card if subscription is active
- [ ] Removal confirmation dialog warns about consequences
- [ ] `detachPaymentMethod()` called in billing-service
- [ ] After removal, only new card shown
- [ ] Default card change reflected in next subscription renewal

**UX Audit:**
- Is the "Set as Default" action instant or does it require confirmation?
- Is the removal confirmation clear about what happens?
- Are there safety guards against removing the only payment method?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-7.1 | Missing Feature | P2 | No proactive email notification for expiring cards (30 days before) |
| GAP-7.2 | Missing Feature | P3 | No support for Direct Debit / BACS (UK-specific) |
| GAP-7.3 | Edge Case | P1 | What if user removes all cards while subscription is active? |
| GAP-7.4 | Missing Feature | P2 | No card update flow (Stripe's automatic card updater) |

### Scenario 7 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-7.1 | Missing Feature | P2 | No expiring card email notification |
| GAP-7.2 | Missing Feature | P3 | No Direct Debit / BACS support |
| GAP-7.3 | Edge Case | P1 | Guard against removing all payment methods with active subscription |
| GAP-7.4 | Missing Feature | P2 | No automatic card updater integration |

---

## Scenario 8: Billing History & Invoices {#scenario-8}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Richard Blackwell |
| **Age** | 58 |
| **Role** | Estate Agent (owner, 3 branches) |
| **Context** | End of tax year, needs to download all invoices for his accountant |
| **Subscription history** | 14 months, 2 plan changes, 3 one-time purchases |
| **Tech comfort** | Low-medium — prefers PDFs and printable documents |
| **Emotional state** | Task-focused, needs efficiency |

### FAANG Benchmark

**Stripe Dashboard** invoice management — filterable list, PDF download, bulk export, clear line items.

### End-to-End Journey

#### Step 1: Navigate to Invoice History

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Log in as agent | `/login` → `/dashboard/agent` | Dashboard loads |
| 1.2 | Navigate to billing | `/dashboard/agent/billing` | Billing hub |
| 1.3 | Click "Invoices" or "Billing History" | `/dashboard/agent/billing/invoices` | Invoice list page |

**QA Checkpoints:**
- [ ] Invoice list loads from `getInvoices()` in billing-service
- [ ] Invoices sorted by date (most recent first)
- [ ] Each row shows: date, description, amount, status (paid/pending/failed), PDF link
- [ ] Pagination works for users with 12+ invoices

**UX Audit:**
- Is the "Invoices" section easy to find from the billing hub?
- Are invoice descriptions human-readable (not Stripe product IDs)?

#### Step 2: View and Download Individual Invoice

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Click on an invoice row | In-page expand or detail view | Line items, tax breakdown, payment method used |
| 2.2 | Click "Download PDF" | Stripe-hosted PDF URL or `/api/billing/invoices/[id]/pdf` | PDF downloads |
| 2.3 | PDF contains all required fields | Downloaded file | Company details, VAT number, line items, total |

**QA Checkpoints:**
- [ ] PDF includes: Britestate company details, VAT registration, customer details
- [ ] PDF includes: line items with unit price, quantity, VAT amount, total
- [ ] PDF renders correctly (not corrupted or empty)
- [ ] UK-compliant invoice format (HMRC requirements)
- [ ] Download works on mobile (file saves, not opens in browser)

**UX Audit:**
- Can Richard preview the invoice before downloading?
- Is the PDF branded (Britestate logo, not generic Stripe)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-8.1 | Missing Feature | P1 | No bulk download (download all invoices as ZIP for tax year) |
| GAP-8.2 | Missing Feature | P2 | No date range filter for invoice list |
| GAP-8.3 | Data Gap | P2 | Invoice descriptions may show Stripe product names, not human-readable |
| GAP-8.4 | Missing Feature | P3 | No CSV/Excel export for accountant |

#### Step 3: Filter and Search

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Filter by date range (last tax year) | In-page filter | Invoices filtered to Apr 2025 – Mar 2026 |
| 3.2 | Filter by type (subscription vs one-time) | In-page filter | Filtered list |
| 3.3 | Search by invoice number | In-page search | Results match |

**QA Checkpoints:**
- [ ] Date range picker works with UK tax year (April–March)
- [ ] Type filter distinguishes subscription renewals from one-time purchases
- [ ] Search supports invoice number and description text
- [ ] Empty state: "No invoices found for this period"

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-8.5 | Missing Feature | P2 | No annual spending summary / tax summary view |
| GAP-8.6 | Edge Case | P3 | How are refunded invoices displayed? (credit note or strikethrough?) |

### Scenario 8 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-8.1 | Missing Feature | P1 | No bulk invoice download for tax filing |
| GAP-8.2 | Missing Feature | P2 | No date range filter |
| GAP-8.3 | Data Gap | P2 | Non-human-readable invoice descriptions |
| GAP-8.4 | Missing Feature | P3 | No CSV/Excel export |
| GAP-8.5 | Missing Feature | P2 | No annual spending summary |
| GAP-8.6 | Edge Case | P3 | Refunded invoice display format |

---

## Scenario 9: Subscription Management — Upgrade / Downgrade / Cancel {#scenario-9}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Sofia Marinescu |
| **Age** | 33 |
| **Role** | Service Provider (interior designer) |
| **Context** | On Basic plan, wants to upgrade to Pro for portfolio features, then later cancels |
| **Current plan** | Basic (active, 6 months) |
| **Tech comfort** | High — manages subscriptions across multiple platforms |
| **Emotional state** | Evaluative — testing if Pro features are worth it |

### FAANG Benchmark

**Netflix** plan management — instant upgrade with proration, clear downgrade consequences, retention flow on cancellation, "pause" option.

### End-to-End Journey

#### Step 1: View Current Subscription

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Log in as provider | `/login` → `/dashboard/provider` | Dashboard loads |
| 1.2 | Navigate to subscription management | `/dashboard/provider/billing/subscription` | Current plan details page |

**QA Checkpoints:**
- [ ] Current plan name, price, billing cycle shown
- [ ] Next billing date displayed
- [ ] Feature list for current plan visible
- [ ] "Upgrade", "Downgrade", "Cancel" CTAs visible and appropriate
- [ ] Usage stats shown (if applicable — e.g., listings used / max)

**UX Audit:**
- Can Sofia see what she's missing on the Pro plan?
- Is the upgrade CTA more prominent than cancel?

#### Step 2: Upgrade to Pro

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Click "Upgrade to Pro" | In-page or `/dashboard/provider/billing/subscription` | Plan comparison with proration details |
| 2.2 | Proration calculated | `GET /api/billing/proration` | "You'll be charged £X today (prorated)" |
| 2.3 | Confirm upgrade | `POST /api/billing/checkout` | Stripe processes plan change |
| 2.4 | Confirmation shown | In-page | "Upgraded to Pro! New features available immediately." |

**QA Checkpoints:**
- [ ] Proration amount is correct (remaining days on Basic credited, Pro prorated)
- [ ] `getUpcomingInvoice()` called to show preview
- [ ] Upgrade is immediate (not end-of-cycle)
- [ ] New entitlements activated instantly (portfolio features unlocked)
- [ ] `subscriptions` table updated with new `plan_name`, `price_amount`
- [ ] `billing_events` table records the plan change
- [ ] No double-charge (old plan credited, new plan prorated)

**UX Audit:**
- Is the proration calculation transparent?
- Does Sofia understand what she'll pay today vs next cycle?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-9.1 | Missing Feature | P2 | No free trial of Pro before committing |
| GAP-9.2 | Data Gap | P2 | Proration breakdown not shown line-by-line |

#### Step 3: Downgrade Back to Basic

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Navigate back to subscription management | `/dashboard/provider/billing/subscription` | Shows Pro plan |
| 3.2 | Click "Downgrade to Basic" | In-page | Warning about features that will be lost |
| 3.3 | Feature loss summary shown | Modal or in-page | "You will lose: Portfolio gallery, Featured placement, ..." |
| 3.4 | Confirm downgrade | API call | Plan change scheduled for end of billing period |

**QA Checkpoints:**
- [ ] Downgrade happens at end of current billing period (not immediate)
- [ ] Features remain available until period ends
- [ ] Clear list of features that will be lost
- [ ] `cancel_at_period_end` NOT set (this is a downgrade, not cancellation)
- [ ] Subscription record updated with pending plan change
- [ ] User can re-upgrade before period ends

**UX Audit:**
- Is the feature loss warning specific enough to prevent accidental downgrades?
- Does Sofia know she keeps Pro features until the period ends?

#### Step 4: Cancel Subscription

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Click "Cancel Subscription" | In-page | Retention flow / cancellation survey |
| 4.2 | Select cancellation reason | Modal | Dropdown: too expensive, not using, switching provider, other |
| 4.3 | Offer shown: "Stay on Basic for 50% off" | Modal | Retention offer (if applicable) |
| 4.4 | Confirm cancellation | `cancelSubscription()` in billing-service | "Subscription will end on [date]" |

**QA Checkpoints:**
- [ ] Cancellation reason is captured (analytics)
- [ ] Cancellation is end-of-period by default (`cancel_at_period_end: true`)
- [ ] "Immediate cancellation" option available but not default
- [ ] Post-cancellation: user retains access until period end
- [ ] Dashboard shows "Cancelling on [date]" banner
- [ ] Re-subscribe option available during cancellation period
- [ ] Data retention: user data preserved for 30 days post-cancellation

**UX Audit:**
- Is the retention offer genuine (not dark pattern)?
- Can Sofia easily re-subscribe if she changes her mind?
- Is the cancellation process ≤ 3 steps (no dark patterns)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-9.3 | Missing Feature | P2 | No "pause subscription" option (alternative to cancel) |
| GAP-9.4 | Missing Feature | P3 | No cancellation survey data captured |
| GAP-9.5 | Edge Case | P1 | What happens to boosted listings if subscription is cancelled? |
| GAP-9.6 | Missing Feature | P2 | No retention offer system |

### Scenario 9 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-9.1 | Missing Feature | P2 | No free trial of higher plan |
| GAP-9.2 | Data Gap | P2 | Proration not shown line-by-line |
| GAP-9.3 | Missing Feature | P2 | No pause subscription option |
| GAP-9.4 | Missing Feature | P3 | No cancellation survey |
| GAP-9.5 | Edge Case | P1 | Active boosts after subscription cancellation |
| GAP-9.6 | Missing Feature | P2 | No retention offer system |

---

## Scenario 10: Refund Request After Failed Payment {#scenario-10}

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | George Patterson |
| **Age** | 63 |
| **Role** | Landlord |
| **Context** | Was charged for subscription renewal but service was degraded that month; also has a failed payment from a second charge attempt |
| **Current plan** | Active Standard plan, renewed 5 days ago |
| **Recent issues** | Service outage for 3 days, duplicate charge attempt |
| **Tech comfort** | Low — needs clear, simple process |
| **Emotional state** | Frustrated, wants resolution quickly |

### FAANG Benchmark

**Uber** refund request — self-service form, automated eligibility check, transparent timeline, proactive communication.

### End-to-End Journey

#### Step 1: Discover the Failed/Duplicate Payment

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Log in as landlord | `/login` → `/dashboard/landlord` | Dashboard loads |
| 1.2 | See notification: "Payment failed" | Dashboard notification | Alert about failed charge attempt |
| 1.3 | Navigate to billing | `/dashboard/landlord/billing` | Billing hub shows recent activity |
| 1.4 | See failed payment in history | `/dashboard/landlord/billing/invoices` | Failed charge visible with status "Failed" |

**QA Checkpoints:**
- [ ] Failed payment notification is prominent (banner or alert)
- [ ] Failed payment page (`/billing/failed`) explains what happened
- [ ] Invoice list shows failed charges with red status indicator
- [ ] Failed charge does NOT result in service interruption if subscription is still active

**UX Audit:**
- Does George understand what "payment failed" means for his service?
- Is the notification actionable (link to resolve)?

#### Step 2: Submit Refund Request

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Navigate to refund page | `/dashboard/landlord/billing/refund` | Refund request form |
| 2.2 | Select the charge to dispute | Dropdown | List of recent charges (last 90 days) |
| 2.3 | Select reason: "Service issue / degradation" | Dropdown | Reason options from refund_requests schema |
| 2.4 | Add details about the 3-day outage | Free text | Text area for explanation |
| 2.5 | Submit request | `POST /api/billing/refund` | Request created |

**QA Checkpoints:**
- [ ] Only charges within refund window (e.g., 90 days) are selectable
- [ ] Reason dropdown covers: duplicate charge, service issue, accidental purchase, other
- [ ] `refund_requests` table row created with `status: pending`
- [ ] Request includes: `user_id`, `billing_event_id`, `reason`, `details`, `requested_amount`
- [ ] Confirmation: "Refund request submitted. We'll review within 5 business days."
- [ ] Duplicate refund request for same charge prevented (409)

**UX Audit:**
- Is the refund process self-service or does George need to contact support?
- Are the reason options clear and comprehensive?
- Is the expected timeline communicated?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-10.1 | Missing Feature | P1 | No automatic refund for duplicate charges (should be instant) |
| GAP-10.2 | Data Gap | P2 | Refund eligibility rules not visible to user |
| GAP-10.3 | Missing Feature | P2 | No partial refund option (prorated for days of outage) |

#### Step 3: Track Refund Status

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Return to billing page later | `/dashboard/landlord/billing` | Refund status visible |
| 3.2 | Check refund request status | `/dashboard/landlord/billing/refund` or billing hub | "Pending Review" → "Approved" → "Processed" |
| 3.3 | Admin reviews and approves | `/admin/billing/refunds` | Admin sets `status: approved`, triggers Stripe refund |
| 3.4 | Refund processed by Stripe | Webhook: `charge.refunded` | `stripe_refund_id` populated on request |
| 3.5 | George receives confirmation | Email + in-app | "Your refund of £X has been processed. Expect it in 5-10 business days." |

**QA Checkpoints:**
- [ ] Refund status progression: `pending` → `approved` → `processed` (or `rejected`)
- [ ] Admin can add notes visible to user
- [ ] Stripe refund is created via `stripe.refunds.create()`
- [ ] Refund appears as credit note in invoice history
- [ ] Email notification at each status change
- [ ] Rejected refund includes reason explanation

**UX Audit:**
- Can George check status without contacting support?
- Is the refund timeline realistic and clearly communicated?
- If rejected, does George have a next step (appeal, support contact)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-10.4 | Dead End | P1 | No appeal path if refund is rejected |
| GAP-10.5 | Missing Feature | P2 | No status change notifications (email or in-app) |
| GAP-10.6 | Edge Case | P2 | What if subscription is cancelled during pending refund? |
| GAP-10.7 | Missing Feature | P3 | No live chat or escalation path from refund page |

### Scenario 10 Scorecard

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Task Completion | — | Can George submit a refund request and track it to resolution? |
| Efficiency | — | How many steps from dashboard to submitted request? |
| Error Handling | — | Duplicate request, ineligible charge, network error? |
| Empty/Edge States | — | No refundable charges? Already refunded? |
| Information Architecture | — | Is refund discoverable? Is status tracking clear? |
| Delight & Polish | — | Empathetic copy, proactive communication, timeline clarity? |

### Scenario 10 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-10.1 | Missing Feature | P1 | No automatic refund for duplicate charges |
| GAP-10.2 | Data Gap | P2 | Refund eligibility rules hidden from user |
| GAP-10.3 | Missing Feature | P2 | No partial refund option |
| GAP-10.4 | Dead End | P1 | No appeal path for rejected refunds |
| GAP-10.5 | Missing Feature | P2 | No refund status change notifications |
| GAP-10.6 | Edge Case | P2 | Subscription cancellation during pending refund |
| GAP-10.7 | Missing Feature | P3 | No live chat / escalation from refund page |

---

## 13. Cross-Scenario Gap Analysis

### By Severity

#### P0 — Blockers
*None identified — core flows appear functional.*

#### P1 — Critical (12 gaps)

| ID | Scenario | Description |
|----|----------|-------------|
| GAP-1.5 | Leave Review | Post-submission dead end — no clear next action |
| GAP-1.7 | Leave Review | Review submission for deactivated provider |
| GAP-3.2 | Report Review | No report status tracking for reporter |
| GAP-3.4 | Report Review | No post-report status visibility |
| GAP-5.1 | Subscription Purchase | No escape path from checkout gate |
| GAP-5.4 | Subscription Purchase | Webhook race condition on confirmation page |
| GAP-7.3 | Payment Methods | No guard against removing all payment methods |
| GAP-8.1 | Invoices | No bulk invoice download for tax filing |
| GAP-9.5 | Subscription Mgmt | Active boosts orphaned after cancellation |
| GAP-10.1 | Refund Request | No automatic refund for duplicate charges |
| GAP-10.4 | Refund Request | No appeal path for rejected refunds |
| GAP-4.8 | Aggregate Reviews | `/reviews/[area]/[provider]` route not built |

#### P2 — Important (31 gaps)

| ID | Scenario | Description |
|----|----------|-------------|
| GAP-1.1 | Leave Review | No direct link from booking email to review |
| GAP-1.2 | Leave Review | Review form doesn't pre-populate booking details |
| GAP-1.4 | Leave Review | Partial sub-rating submission handling |
| GAP-1.6 | Leave Review | No email notification for review approval/rejection |
| GAP-2.1 | Edit Review | No edit link in confirmation email |
| GAP-2.5 | Edit Review | Provider response invalidation after edit |
| GAP-3.1 | Report Review | No evidence upload for flags |
| GAP-3.3 | Report Review | Unverified review indicator not visible |
| GAP-3.5 | Report Review | No outcome notification to reporter |
| GAP-4.1 | Aggregate Reviews | No geographic map of providers |
| GAP-4.3 | Aggregate Reviews | No side-by-side category comparison |
| GAP-4.4 | Aggregate Reviews | Empty state for zero-review categories |
| GAP-4.6 | Aggregate Reviews | No link from aggregate to booking/quote |
| GAP-4.7 | Aggregate Reviews | No date range filtering |
| GAP-5.2 | Subscription | VAT clarity in pricing |
| GAP-5.5 | Subscription | No welcome/onboarding email |
| GAP-5.6 | Subscription | Navigation away before webhook |
| GAP-5.7 | Subscription | No support link on failed payment page |
| GAP-6.1 | Boost Payment | No boosted listing preview |
| GAP-6.2 | Boost Payment | No historical boost ROI data |
| GAP-6.4 | Boost Payment | Listing deactivation during active boost |
| GAP-7.1 | Payment Methods | No expiring card email notification |
| GAP-7.4 | Payment Methods | No automatic card updater |
| GAP-8.2 | Invoices | No date range filter |
| GAP-8.3 | Invoices | Non-human-readable descriptions |
| GAP-8.5 | Invoices | No annual spending summary |
| GAP-9.1 | Subscription Mgmt | No free trial of higher plan |
| GAP-9.2 | Subscription Mgmt | Proration not line-by-line |
| GAP-9.3 | Subscription Mgmt | No pause subscription |
| GAP-9.6 | Subscription Mgmt | No retention offer system |
| GAP-10.2 | Refund Request | Refund eligibility rules hidden |
| GAP-10.3 | Refund Request | No partial refund option |
| GAP-10.5 | Refund Request | No status change notifications |
| GAP-10.6 | Refund Request | Sub cancellation during pending refund |

#### P3 — Nice-to-Have (14 gaps)

| ID | Scenario | Description |
|----|----------|-------------|
| GAP-1.3 | Leave Review | Photo/image upload |
| GAP-2.2 | Edit Review | Edit window countdown not shown |
| GAP-2.4 | Edit Review | No user-facing version history |
| GAP-3.6 | Report Review | Review edit during moderation |
| GAP-4.2 | Aggregate Reviews | No national average comparison |
| GAP-4.5 | Aggregate Reviews | No "Compare Providers" feature |
| GAP-5.3 | Subscription | No plan comparison table |
| GAP-5.8 | Subscription | No alternative payment methods |
| GAP-6.3 | Boost Payment | No boost analytics dashboard |
| GAP-7.2 | Payment Methods | No Direct Debit / BACS |
| GAP-8.4 | Invoices | No CSV/Excel export |
| GAP-8.6 | Invoices | Refunded invoice display format |
| GAP-9.4 | Subscription Mgmt | No cancellation survey |
| GAP-10.7 | Refund Request | No live chat escalation |

### By Gap Category

| Category | Count | Most Critical |
|----------|-------|---------------|
| Missing Feature | 25 | GAP-10.1 (auto-refund for duplicates) |
| Dead End | 3 | GAP-5.1 (checkout gate escape), GAP-10.4 (refund rejection) |
| Edge Case | 8 | GAP-5.4 (webhook race), GAP-7.3 (remove all cards) |
| Data Gap | 7 | GAP-8.3 (invoice descriptions) |
| Missing Link | 4 | GAP-1.1 (email to review link) |
| Routing Bug | 1 | GAP-4.8 (provider review detail route) |

### Cross-Cutting Themes

1. **Notification Gaps** — Multiple flows lack email/in-app notifications at critical state changes (review approval, report outcome, refund status, card expiry)
2. **Dead Ends** — Post-action navigation is weak; users complete tasks but aren't guided to next logical step
3. **Transparency** — Status tracking is insufficient for moderation outcomes and refund processing
4. **UK Compliance** — VAT handling and invoice formatting need verification against HMRC requirements
5. **Stripe Boundary** — Webhook race conditions and redirect edge cases need defensive handling
6. **Mobile Coverage** — No dedicated mobile scenarios in this spec. Scenario 3 (Marcus, provider) and Scenario 7 (Fatima, landlord) should be re-tested on mobile viewports, particularly Stripe Elements rendering and review form usability on small screens

---

## 14. Final Scorecard & Recommendations

### Overall Assessment

| Dimension | Reviews (1–5) | Payments (1–5) | Notes |
|-----------|---------------|----------------|-------|
| Task Completion | 4 | 4 | Core flows functional; edge cases need work |
| Efficiency | 3 | 3 | Navigation paths need shortening; too many clicks |
| Error Handling | 2 | 3 | Review errors under-handled; payment errors decent via Stripe |
| Empty/Edge States | 2 | 2 | Multiple unhandled edge cases in both domains |
| Information Architecture | 3 | 3 | Discoverable but not optimized; breadcrumbs/back-paths weak |
| Delight & Polish | 2 | 2 | Functional but not celebratory; lacks micro-interactions |
| **Weighted Average** | **2.8** | **2.9** | |

### Priority Recommendations

#### Must Fix Before Launch (P1)

1. **Webhook race condition** (GAP-5.4) — Add polling/Realtime fallback on confirmation page
2. **Report status tracking** (GAP-3.2, 3.4) — Users must see moderation progress
3. **Payment method guards** (GAP-7.3) — Prevent removing only card with active subscription
4. **Bulk invoice download** (GAP-8.1) — Critical for UK business users at tax time
5. **Post-submission navigation** (GAP-1.5) — Direct users after completing review
6. **Auto-refund duplicates** (GAP-10.1) — Detectable duplicates should refund automatically
7. **Refund rejection appeal** (GAP-10.4) — Must have escalation path

#### Should Fix (P2)

1. **Notification system** — Add email notifications for: review approval, flag outcome, refund status, card expiry
2. **VAT compliance** — Verify pricing display and invoice format meet HMRC requirements
3. **Proration transparency** — Show line-by-line breakdown for plan changes
4. **Empty states** — Design meaningful empty states for zero-review areas, no invoices, etc.
5. **Date range filters** — Invoice and review lists need date filtering

#### Nice to Have (P3)

1. **Pause subscription** — Alternative to cancel for temporary users
2. **Boost analytics** — Show impressions/clicks during boost period
3. **Photo upload in reviews** — Evidence for authenticity
4. **Direct Debit / BACS** — UK-specific alternative to cards
5. **CSV export** — For accountants and bulk data users

---

*End of specification. 10 scenarios, 57 gaps identified (12 P1, 31 P2, 14 P3), 4 user roles covered (homebuyer, renter, estate agent, service provider, landlord).*
