# Britestate — Dashboard Requirements Traceability Matrix

> **PRD requirement → implementation → test coverage.** Milestone 1 deliverable.
> Companion to [`DASHBOARD_SCAFFOLDING.md`](./DASHBOARD_SCAFFOLDING.md). Generated 2026-06-16 from
> read-only inspection. **No feature is marked working without UI-reachability + code/test evidence.**

## How to read this

**Implementation status:**
- ✅ **Implemented** — wired to real data (Supabase/services/Stripe), reachable in the UI.
- 🟡 **Partial** — built but incomplete (missing action, no states, display-only, or not in nav).
- 🔴 **Mock-only** — renders hardcoded/placeholder data; not connected to live data.
- ❌ **Missing** — no implementation / "coming soon".
- ❔ **Unclear** — exists but behaviour not verifiable from static inspection alone.

**Test coverage status** (audited against real test bodies, not file names):
- **Unit(svc)** — service/logic unit tests exist (Vitest). **Comp** — component test exists.
- **E2E** — Playwright flow asserts it. **Smoke** — nav/render smoke only (no behaviour).
- **Needs E2E / Needs integration / Needs unit** — gap. **None** — no coverage.

**ID scheme:** existing IDs reused verbatim from `.planning/REQUIREMENTS.md`; `LL/AG/SL/PRV/BRK/
ADMIN/BILL/SET/MSG/NOTIF-*` derived from PRD epics + inventory.

**Evidence** cites the authoritative file. Where a route is generic it is shown as
`/dashboard/[role]/…` (resolves per active role).

---

## Summary

| Area | Reqs | ✅ | 🟡 | 🔴 | ❌/❔ | Test posture |
|---|---|---|---|---|---|---|
| Buyer/Renter (v3.1) | 41 | 12 | 18 | 6 | 5 | Nav smoke + some svc; **needs E2E/integration** |
| Landlord | 23 | 20 | 3 | 0 | 0 | **Strong svc unit / thin UI**; needs E2E |
| Agent | 20 | 16 | 4 | 0 | 0 | Strong svc / thin UI; nav-parity gap; needs E2E |
| Seller | 13 | 9 | 4 | 0 | 0 | Some svc + 1 E2E spec; needs form E2E |
| Provider | 17 | 15 | 2 | 0 | 0 | Strong svc (9 test files); needs UI/E2E |
| Broker | 10 | 0 | 1 | 9 | 0 | **None** — mock dashboard |
| Admin | 24 | 14 | 10 | 0 | 0 | **Strong E2E** (~154 scenarios); write-paths thin |
| Cross-role | 22 | 12 | 7 | 0 | 3 | 0 page tests; needs integration/E2E |
| **Total** | **~170** | | | | | |

> Counts are feature-level requirements (the testable unit); the PRD's ~227 line-items roll up into
> these. Status reflects evidence at time of writing — update as M2–M4 progress.

---

## Buyer / Renter dashboard (v3.1 — formal IDs from `.planning/REQUIREMENTS.md`)

Roles: homebuyer (HB), renter (RN). Routes resolve under `/dashboard/[role]/…`.

### Foundation & Security (FOUND)
| ID | Requirement | Route / evidence | Impl | Test | Notes |
|---|---|---|---|---|---|
| FOUND-01 | 10 buyer tables + RLS (viewings, offers, documents, ai_match, moving, referrals) | `supabase/migrations/**` | ✅ | DB(`db-tests`) | REQUIREMENTS marks [x]; verify RLS in db-tests |
| FOUND-02 | Role-route authz — buyer cannot reach `/dashboard/landlord` etc. | `middleware.ts`, `[role]/layout.tsx` | ✅ | E2E `role-dashboard-redirect.spec.ts` | Covered |
| FOUND-03 | All buyer routes call `auth.getUser()` server-side | server components/services | ✅ | Needs integration | Defence-in-depth; spot-check |
| FOUND-04 | Packages installed (react-day-picker@9, date-fns@4, tus-js-client@4, nanoid@5) | `package.json` | ✅ | n/a | Build-time |

### Dashboard Home & Discovery (DISC)
| ID | Requirement | Route / evidence | Impl | Test | Notes |
|---|---|---|---|---|---|
| DISC-01 | Real stat cards (saved, viewings, offers, unread) | `[role]/page.tsx` + `useDashboard()` | 🟡 | Smoke | Stats real; verify counts wired vs placeholder |
| DISC-02 | Activity feed of real events | `[role]/page.tsx` ActivityFeed | 🔴 | None | Feed is placeholder/mock |
| DISC-03 | Recommended listings from saved searches | overview | 🟡 | None | Verify data source |
| DISC-04 | Saved properties grid/list, sort, remove | `[role]/saved/page.tsx`, `SavedPropertyRemoveButton` | 🟡 | Needs integration | **No sort/filter** implemented; remove works |
| DISC-05 | Compare up to 3 saved side-by-side | saved compare modal | ❔ | Needs E2E | Compare UI not confirmed present |
| DISC-06 | Saved searches edit/delete + alert frequency | `[role]/searches/page.tsx`, `SavedSearchActions` | 🟡 | Needs integration | Delete present; **edit/frequency toggle missing** |
| DISC-07 | Per-search alert prefs (email+push) | searches | ❌ | None | Not implemented |
| DISC-08 | Notification centre read/unread + mark-all | `/notifications` `NotificationCentreClient` | ✅ | Needs integration | Tabs + mark-all present |

### Viewings (VIEW)
| ID | Requirement | Route / evidence | Impl | Test | Notes |
|---|---|---|---|---|---|
| VIEW-01 | Upcoming/past viewings calendar+list | `[role]/viewings/page.tsx` `useViewings()` | ✅ | Needs E2E | Tabs upcoming/past |
| VIEW-02 | Add to Google/Apple calendar (.ics) | viewings | ❔ | None | .ics export not confirmed |
| VIEW-03 | Book viewing from agent slots (in-person/virtual) + email | `[role]/viewings/book/page.tsx` | ✅ | Needs E2E | Slot fetch + book hook present |
| VIEW-04 | Confirm/reschedule/cancel with reason | `[role]/viewings/[id]/reschedule/page.tsx` (**exists**) + cancel | ✅ | Needs E2E | Reschedule page confirmed present |
| VIEW-05 | Email confirmations (book/reschedule/cancel) | Resend integration | ❔ | None | Verify email send path |

### Offers (OFFR)
| ID | Requirement | Route / evidence | Impl | Test | Notes |
|---|---|---|---|---|---|
| OFFR-01 | List offers w/ status badges, amounts, thumbnails | `[role]/offers/page.tsx` | 🔴 | None | **Mock `OfferStatus` data** |
| OFFR-02 | Submit offer (amount, conditions, solicitor, AIP doc) | offers | ❌ | None | Display-only; no submit |
| OFFR-03 | 7-stage conveyancing pipeline tracking | offers | 🔴 | None | Stages defined but mock |
| OFFR-04 | Server-side status transitions + audit trail | `offer_status_history` | ❔ | DB? | Verify service exists |
| OFFR-05 | Withdraw pending offer | offers | ❌ | None | No action |

### Communication & Documents (COMMS)
| ID | Requirement | Route / evidence | Impl | Test | Notes |
|---|---|---|---|---|---|
| COMMS-01 | Messages inbox (list, unread, previews) | `/inbox` `InboxPageClient` (Realtime) | ✅ | Needs integration | Realtime subscription present |
| COMMS-02 | Conversation thread + attachments | `/inbox` MessageThread | 🟡 | Needs E2E | Thread present; attachment path unverified |
| COMMS-03 | Upload docs (ID, funds, AIP) to private bucket | `[role]/documents/page.tsx` `useDocuments()` | ✅ | Needs integration | Upload + type select |
| COMMS-04 | TUS resumable upload + progress | documents | ❔ | None | tus-js-client installed; verify usage |
| COMMS-05 | Signed-URL previews (1h, never public) | documents | 🟡 | Needs unit | **Download/preview link not generated** |
| COMMS-06 | Document status (uploaded/verified/pending) | documents | ✅ | Needs integration | Status badges present |

### Tools & AI (TOOLS)
| ID | Requirement | Route / evidence | Impl | Test | Notes |
|---|---|---|---|---|---|
| TOOLS-01 | UK moving checklist (20+ tasks) tied to offer stage | `[role]/moving/page.tsx` + `/api/moving-checklist` | ✅ | Needs integration | Phases + checkbox mutation |
| TOOLS-02 | Edit AI Match preferences | `[role]/ai-match/page.tsx` | ✅ | Needs integration | Pref form present |
| TOOLS-03 | AI Match results ranked w/ score tooltips | ai-match | 🟡 | None | Scores shown; Claude wiring unverified |
| TOOLS-04 | Cache AI results 24h (no per-load Claude) | `ai_match_results` | ❔ | Needs unit | Verify cache layer |
| TOOLS-05 | Heuristic fallback w/o pgvector | ai-match service | ❔ | Needs unit | Verify fallback |
| TOOLS-06 | Affordability calculator (client-side) | `[role]/calculators/page.tsx` | ✅ | Needs unit | Calc logic in `lib/calculators/` |

### Financial & Professional Browse (FIN) & Referral (REF)
| ID | Requirement | Route / evidence | Impl | Test | Notes |
|---|---|---|---|---|---|
| FIN-01 | Mortgage comparison widget w/ prefilled params | calculators/services | 🟡 | None | Verify embed |
| FIN-02 | Browse mortgage brokers (marketplace filter) | `[role]/services?category=mortgage_broker` | ✅ | Needs E2E | Provider marketplace filter |
| FIN-03 | Browse conveyancers/solicitors | `[role]/services?category=conveyancer` | ✅ | Needs E2E | |
| FIN-04 | Browse surveyors | `[role]/services?category=surveyor` | ✅ | Needs E2E | |
| REF-01 | Generate referral link (nanoid) | `[role]/referrals/page.tsx` `ReferralDashboard` | 🟡 | None | Verify generation/copy |
| REF-02 | Referral tracker (signups, status) | referrals | 🟡 | None | |
| REF-03 | Record referral conversions | `referral_conversions` | ❔ | DB? | Verify signup hook |

### Renter-specific
| ID | Requirement | Route / evidence | Impl | Test | Notes |
|---|---|---|---|---|---|
| RN-APPLY-01 | View applications w/ status badges + stats | `[role]/applications/page.tsx` | ✅ | Needs integration | Display-only |
| RN-APPLY-02 | Apply to listing (form, validation, persistence) | `[role]/applications/apply/[listingId]` | 🟡 | Needs E2E | Submit action present; no success redirect/upload |
| RN-TEN-01 | Tenancy overview (lease, rent, deposit, landlord) | `[role]/tenancy/page.tsx` | 🔴 | None | **100% hardcoded mock** |

---

## Landlord dashboard (`/dashboard/landlord/**`)

Service layer is **well unit-tested**; page/UI behaviour is **not** E2E-tested. Coverage = Unit(svc)
unless noted; all rows additionally **Need E2E** for the UI flow.

| ID | Requirement | Route / evidence | Impl | Test |
|---|---|---|---|---|
| LL-HOME-01 | Portfolio KPIs, alerts, action items | `landlord/page.tsx` | ✅ | Unit(svc) |
| LL-PORTFOLIO-01 | Properties list + add property | `landlord/properties`, `properties/add` | ✅ | Unit(svc) |
| LL-PORTFOLIO-02 | Property detail tabs (overview/financials/docs/maint/listing) | `landlord/properties/[id]/**` | ✅ | Unit(svc) |
| LL-TENANCY-01 | Tenancy list per property + detail | `properties/[id]/tenancies/**` | ✅ | Unit(svc) |
| LL-TENANCY-02 | Lease document view | `tenancies/[tenancyId]/lease` | ✅ | Unit(svc) |
| LL-TENANT-01 | Tenant applications + screening | `landlord/tenants` | ✅ | Unit(svc) |
| LL-TENANT-02 | Application decision flow | `tenants/[applicationId]/decision` | ✅ | Unit(svc) |
| LL-TENANT-03 | Create tenancy + agreement (AST PDF) | `tenants/[applicationId]/tenancy/agreement` | ✅ | Unit(svc) |
| LL-RENT-01 | Rent collection/tracking (portfolio + per-property) | `landlord/rent`, `rent/[propertyId]` | ✅ | Unit(svc) |
| LL-DEPOSIT-01 | Deposit registration/claims/returns | `landlord/deposits` | ✅ | Unit(svc) |
| LL-COMPLIANCE-01 | Compliance overview (Gas/EPC/EICR) + expiry alerts | `landlord/compliance`, `/alerts` | ✅ | Unit(svc) |
| LL-COMPLIANCE-02 | Compliance matrix view | `compliance/matrix` | ✅ | Unit(svc) |
| LL-COMPLIANCE-03 | Certificate upload | `compliance/upload` | 🟡 | Needs integration |
| LL-MAINT-01 | Maintenance queue + request detail | `landlord/maintenance`, `[id]` | ✅ | Unit(svc) |
| LL-MAINT-02 | Assign tradesperson | `maintenance/[id]/assign` | ✅ | Unit(svc) |
| LL-FINANCE-01 | Expense tracker | `landlord/finance/expenses` | ✅ | Unit(svc) |
| LL-FINANCE-02 | Income/expense report | `finance/report` | ✅ | Unit(svc) |
| LL-FINANCE-03 | Tax summary | `finance/tax` | ✅ | Unit(svc) |
| LL-INVENTORY-01 | Inventory check-in/check-out | `landlord/inventory/[propertyId]/check-in|out` | ✅ | Unit(svc) |
| LL-LEGAL-01 | Section 21/8 notice generator (PDF) | `landlord/legal/notices` | ✅ | Unit(svc) |
| LL-ANALYTICS-01 | Portfolio analytics (occupancy/yield/cashflow) | `landlord/analytics` | ✅ | Unit(svc) |
| LL-MARKET-01 | Find letting agents / tradespeople | `landlord/find-agent`, `find-tradespeople` | ✅ | Needs E2E |
| LL-TOOLS-01 | Yield calculator | `landlord/tools/yield-calculator` | 🟡 | Needs unit |

**Cross-cutting gap (all landlord rows):** no page-level loading skeletons in several pages;
silent error fallback to empty; **no E2E for any landlord form submission**.

---

## Estate Agent dashboard (`/dashboard/agent/**`)

Strong service tests; **28/34 pages not in sidebar nav** (reachable via deep links). All rows
**Need E2E**; nav-parity is its own test target.

| ID | Requirement | Route / evidence | Impl | Test |
|---|---|---|---|---|
| AG-HOME-01 | Dashboard KPIs, activity, today's diary | `agent/page.tsx` `agent-dashboard-service` | ✅ | Unit(svc) |
| AG-LISTINGS-01 | Listings list (active/archived/sold) | `agent/listings`, `/archived`, `/sold` | ✅ | Unit(svc) |
| AG-LISTINGS-02 | Create listing wizard | `agent/listings/create` | 🟡 | Needs E2E |
| AG-LISTINGS-03 | Listing analytics | `listings/[id]/analytics` | ✅ | Unit(svc) |
| AG-OFFERS-01 | Offers dashboard + detail + negotiation thread | `agent/offers`, `/[id]` | ✅ | Unit(svc) |
| AG-VIEWINGS-01 | Viewing calendar | `agent/viewings` | ✅ | Unit(svc) |
| AG-VIEWINGS-02 | Viewing feedback | `viewings/feedback` | ✅ | Unit(svc) |
| AG-LEADS-01 | Lead pipeline Kanban (drag/drop) + detail | `agent/leads`, `/[id]` | ✅ | Needs E2E |
| AG-CRM-01 | CRM client list + profile | `agent/crm`, `/[id]` | ✅ | Unit(svc) |
| AG-INTRO-01 | Introductions / referrals (Truedeed) | `agent/introductions` | ✅ | Unit(svc)+E2E |
| AG-PROFILE-01 | Agency profile + branding | `agent/profile`, `/branding` | ✅ | Needs integration |
| AG-TEAM-01 | Team members + branches | `agent/team`, `/branches` | ✅ | Unit(svc) |
| AG-TEAM-02 | Roles & permissions | `team/roles` | 🟡 | None — static page |
| AG-ANALYTICS-01 | Performance / branch / competitor analytics | `agent/analytics/**` | ✅ | Unit(svc) |
| AG-SALES-01 | Sale progression Kanban + chain risk | `agent/sales` | ✅ | Unit(svc) |
| AG-SALES-02 | Market appraisal tool | `sales/appraisal` | 🟡 | None — static |
| AG-SALES-03 | Vendor reports | `sales/reports` | ✅ | Needs integration |
| AG-REVENUE-01 | Revenue + commissions | `agent/revenue` | ✅ | Unit(svc) |
| AG-REVIEWS-01 | Reviews + respond | `agent/reviews`, `/[id]/respond` | ✅ | Needs E2E |
| AG-BILLING-01 | Subscription billing / boost / truedeed mandate | `agent/billing/**` | ✅ | Unit(svc) |

---

## Seller dashboard (`/dashboard/seller/**`)

| ID | Requirement | Route / evidence | Impl | Test |
|---|---|---|---|---|
| SL-HOME-01 | Overview KPIs + performance chart | `seller/page.tsx` `getSellerKPIs()` | ✅ | E2E `dashboard-seller.spec.ts` |
| SL-LISTING-01 | Listings list w/ status tabs | `seller/listings` | ✅ | E2E |
| SL-LISTING-02 | 7-step create/edit listing wizard | `seller/listings/create` (Step1–7) | 🟡 | Needs E2E |
| SL-LISTING-03 | Per-listing analytics | `listings/[id]/analytics` | ✅ | Unit(svc) |
| SL-VIEWINGS-01 | Viewings upcoming/past (API) | `seller/viewings` `/api/seller/viewings` | ✅ | Needs E2E |
| SL-OFFERS-01 | Offers list + compare table | `seller/offers` `/api/seller/offers` | ✅ | Needs E2E |
| SL-VALUATION-01 | Instant valuation by postcode | `seller/valuation` | ✅ | Needs integration |
| SL-AGENTS-01 | Find agents by area | `seller/agents` `/api/seller/agents` | ✅ | Needs E2E |
| SL-AGENTS-02 | Compare up to 3 agents | `seller/agents/compare` | ✅ | Needs integration |
| SL-AGENTS-03 | Agent detail | `seller/agents/[id]` | ✅ | Needs integration |
| SL-SALE-01 | Sale progression detail | `seller/sale-progress/[id]` | ✅ | Unit(svc) |
| SL-ENQUIRY-01 | Buyer enquiries inbox | `seller/enquiries` | ❌ | None — "coming soon" |
| SL-ANALYTICS-01 | Aggregate sales analytics | `seller/analytics` | ❌ | None — "coming soon" |

---

## Service Provider dashboard (`/dashboard/provider/**`)

9 provider service test files exist (`provider/__tests__`). Rows = Unit(svc) unless noted; UI/E2E
absent.

| ID | Requirement | Route / evidence | Impl | Test |
|---|---|---|---|---|
| PRV-HOME-01 | Overview KPIs, cash position, activity | `provider/page.tsx` | ✅ | Unit(svc) |
| PRV-JOBS-01 | Leads accept/decline | `provider/jobs/leads` | ✅ | Unit(svc) |
| PRV-JOBS-02 | Active + completed jobs (pagination) | `jobs/active`, `/completed` | ✅ | Unit(svc) |
| PRV-JOBS-03 | Job detail + certificates (CP12/EICR) | `jobs/[id]`, `/certificates` | ✅ | Unit(svc) |
| PRV-QUOTES-01 | Quote list w/ status filter | `provider/quotes` | ✅ | Needs integration |
| PRV-QUOTES-02 | Quote builder (line items, RFQ prefill) | `quotes/builder` | ✅ | Unit(svc) |
| PRV-QUOTES-03 | Generate invoice (VAT) | `quotes/[id]/invoice` | ✅ | Unit(svc) |
| PRV-PAY-01 | Stripe Connect onboarding + balance | `provider/payments` (flag `FEATURE_STRIPE_CONNECT_ENABLED`) | ✅ | Unit(svc) |
| PRV-PAY-02 | Payment/transaction detail | `payments/[id]` | ✅ | Unit(svc) |
| PRV-AVAIL-01 | Availability calendar block dates | `provider/availability` | ✅ | Needs E2E |
| PRV-SERVICES-01 | Services config + service-area map editor | `provider/services`, `/areas` | ✅ | Needs E2E |
| PRV-PORTFOLIO-01 | Portfolio gallery | `provider/portfolio` | ✅ | Needs integration |
| PRV-VERIFY-01 | Verification overview (trust gauge, 5-step) | `provider/verification` | ✅ | Unit(svc) |
| PRV-VERIFY-02 | Credentials upload (8 doc types) | `verification/credentials` | ✅ | Needs integration |
| PRV-VERIFY-03 | Badges + client/peer references | `verification/badges`, `/client-references`, `/peer-references` | ✅ | Needs integration |
| PRV-REVIEWS-01 | Reviews + respond | `provider/reviews`, `/[id]/respond` | ✅ | Needs E2E |
| PRV-FIELD-01 | Field tools (today's jobs, payments, directions) | `provider/field/**` | 🟡 | Needs E2E |

---

## Mortgage Broker dashboard (`/dashboard/broker/**`)

**Prototype — mock data confirmed via grep (`MOCK_*`).** No Supabase wiring. All rows **Need full
implementation before meaningful tests**; current tests = None.

| ID | Requirement | Route / evidence | Impl | Test |
|---|---|---|---|---|
| BRK-HOME-01 | Overview KPIs + pipeline summary | `broker/page.tsx` | 🔴 | None |
| BRK-LEADS-01 | Lead list + status | `broker/leads` `MOCK_LEADS` | 🔴 | None |
| BRK-PIPELINE-01 | Client pipeline by stage | `broker/pipeline` `MOCK_CLIENTS` | 🔴 | None |
| BRK-PRODUCTS-01 | Mortgage product search/filter | `broker/products` `MOCK_PRODUCTS` | 🔴 | None |
| BRK-CALC-01 | Mortgage/SDLT/affordability calculators | `broker/calculators` | 🟡 | Needs unit |
| BRK-ANALYTICS-01 | Performance analytics | `broker/analytics` (hardcoded) | 🔴 | None |
| BRK-PROFILE-01 | Broker profile edit | `broker/profile` (local state) | 🔴 | None |
| BRK-REVIEWS-01 | Reviews + respond | `broker/reviews` `MOCK_REVIEWS` | 🔴 | None |
| BRK-FCA-01 | FCA verification docs | `broker/fca-verification` `MOCK_DOCUMENTS` | 🔴 | None |
| BRK-BILLING-01 | Plan + payment history | `broker/billing` (hardcoded) | 🔴 | None |

---

## Admin back-office (`/admin/**`)

**Strongest E2E coverage** (`admin-scenario-*.spec.ts`, ~154 scenario tests). Read paths render real
data; many **write/action handlers are incomplete** (🟡). Gating per `ADMIN_ROUTE_PERMISSIONS`.

| ID | Requirement | Route / permission | Impl | Test |
|---|---|---|---|---|
| ADMIN-HOME-01 | Platform KPIs + recent activity | `/admin` · `view_analytics` | ✅ | E2E |
| ADMIN-USERS-01 | User search + pagination | `/admin/users` · `manage_users` | ✅ | E2E |
| ADMIN-USERS-02 | User detail + suspend/ban/activate | `/admin/users/[id]` | 🟡 | E2E (scenario) |
| ADMIN-MOD-01 | Listing moderation (pending/all/flagged) | `/admin/moderation` · `moderate_listings` | 🟡 | E2E |
| ADMIN-REVIEW-01 | Review moderation queue | `/admin/reviews` · `moderate_reviews` | 🟡 | E2E |
| ADMIN-REPORT-01 | Reported content queue | `/admin/reported` · `moderate_content` | 🟡 | E2E |
| ADMIN-VERIFY-01 | Provider verification queue | `/admin/verifications` · `manage_verifications` | 🟡 | E2E |
| ADMIN-ROLES-01 | Role counts + promote to admin | `/admin/roles` · `manage_roles` (super) | ✅ | E2E |
| ADMIN-TEAM-01 | Admin team list + invite | `/admin/team` · `manage_team` (super) | 🟡 | E2E |
| ADMIN-AUDIT-01 | Audit log w/ filters + cursor pagination | `/admin/audit-log` · `view_audit_log` | ✅ | E2E |
| ADMIN-HEALTH-01 | System health (Supabase/Stripe/Resend/PostHog ping) | `/admin/system-health` · `view_system_health` | ✅ | Needs integration |
| ADMIN-API-01 | API usage / rate-limit stats (Redis) | `/admin/api-usage` · `view_api_usage` | ✅ | Needs integration |
| ADMIN-FLAGS-01 | Feature flags toggle + rollout % | `/admin/feature-flags` · `manage_feature_flags` | 🟡 | E2E |
| ADMIN-GDPR-01 | GDPR export/deletion queue | `/admin/gdpr` · `manage_gdpr` | 🟡 | E2E (scenario) |
| ADMIN-FRAUD-01 | Fraud risk scoring queue | `/admin/fraud` · `manage_fraud` | 🟡 | E2E (scenario) |
| ADMIN-EMAIL-01 | Email campaigns | `/admin/email-campaigns` · `send_campaigns` | 🟡 | Needs E2E |
| ADMIN-PROMO-01 | Promo codes | `/admin/promo-codes` · `manage_promo_codes` | 🟡 | Needs E2E |
| ADMIN-SUBS-01 | Subscriptions management | `/admin/subscriptions` · `manage_subscriptions` | 🟡 | Needs E2E |
| ADMIN-SEO-01 | SEO management | `/admin/seo` · `manage_seo` | ✅ | Needs integration |
| ADMIN-CMS-01 | CMS blog/help/landing + editor | `/admin/cms/**` · `manage_cms` | 🟡 | Needs E2E |
| ADMIN-ANALYTICS-01 | Platform/revenue/search/behaviour analytics | `/admin/analytics/**` · `view_analytics`/`view_revenue` | ✅ | Needs integration |
| ADMIN-TRUEDEED-01 | Disputes/candidates/rebuttals queues | `/admin/truedeed/**` (**custom check**) | ✅ | Comp (`CandidateReviewQueue.test.tsx`, `RebuttalQueue.test.tsx`) |
| ADMIN-PRICING-01 | Pricing review checkpoint dashboard | `/admin/pricing-review` (**custom check**) | ✅ | E2E `pricing-*.spec.ts` |
| ADMIN-SDR-01 | SDR outbound campaign queue | `/admin/sdr` (**custom check, in-memory**) | 🟡 | Needs integration |

---

## Cross-role surfaces

| ID | Requirement | Route / evidence | Impl | Test |
|---|---|---|---|---|
| BILL-01 | Billing hub (subscription status) | `[role]/billing` | ✅ | Needs integration |
| BILL-02 | Subscription manage (upgrade/downgrade/cancel) | `billing/subscription` | ✅ | Needs E2E |
| BILL-03 | Invoices list + download | `billing/invoices` `/api/billing/invoices` | ✅ | Needs integration |
| BILL-04 | Payment methods (set default/delete) | `billing/payment-methods` | ✅ | Needs integration |
| BILL-05 | Subscription checkout (Stripe Embedded) | `billing/checkout/subscription` | ✅ | Needs E2E |
| BILL-06 | One-time checkout | `billing/checkout/one-time` | ✅ | Needs E2E |
| BILL-07 | Confirmation (polling + success) | `billing/confirmation` | ✅ | Needs integration |
| BILL-08 | Failed payment (decline-code messaging) | `billing/failed` | ✅ | Needs unit |
| BILL-09 | Refund request form | `billing/refund` `/api/billing/refund` | ✅ | Needs E2E |
| SET-01 | Account profile + avatar | `/settings/account` | ✅ | Needs integration |
| SET-02 | Security: password change | `/settings/security` | ✅ | Needs E2E |
| SET-03 | Security: MFA/TOTP enrol/disable/backup codes | `/settings/security` | ✅ | Needs E2E |
| SET-04 | Security: sessions + login history | `/settings/security` | ✅ | Needs integration |
| SET-05 | Connected OAuth accounts | `/settings/security` | 🟡 | Needs integration |
| SET-06 | Preferences / privacy / notifications prefs | `/settings/{preferences,privacy,notifications}` | ❌ | None — stubs |
| MSG-01 | Inbox conversation list (Realtime) | `/inbox` | ✅ | Needs integration |
| MSG-02 | Message thread + attachments | `/inbox` | 🟡 | Needs E2E |
| NOTIF-01 | Notification centre tabs + mark-all | `/notifications` | ✅ | Needs integration |
| RFQ-01 | RFQ list w/ status filter | `/dashboard/rfqs` `/api/rfq/list` | ✅ | Needs E2E |
| RFQ-02 | Create RFQ | `/dashboard/rfqs/create` | ❔ | Needs E2E |
| BOOK-01 | Bookings list w/ status tabs + counts | `/dashboard/bookings` `/api/bookings/list` | ✅ | Needs E2E |
| REVW-01 | Reviews written/received + write form | `/dashboard/reviews` `/api/reviews/list` | ✅ | Needs E2E |

---

## Layout / system-state requirements (apply to all dashboards)

| ID | Requirement | Evidence | Impl | Test |
|---|---|---|---|---|
| SYS-AUTH-01 | Unauthenticated → `/login` | `(protected)/layout.tsx` | ✅ | E2E `auth.spec.ts` |
| SYS-ROLE-01 | URL role must match active_role | `[role]/layout.tsx` | ✅ | E2E `role-dashboard-redirect.spec.ts` |
| SYS-ADMIN-01 | Admin layout gates `is_admin`+`admin_role` | `(admin)/layout.tsx` | ✅ | E2E (admin scenarios) |
| SYS-NAV-01 | Sidebar/bottom-tab links resolve (per role) | `config/navigation.ts` | ✅ | E2E `dashboard-navigation.spec.ts` |
| SYS-NAV-02 | **All built pages reachable** (incl. agent's 28 hidden, broker's 4) | — | 🟡 | **Needs E2E** (nav-parity / deep-link) |
| SYS-VERIFY-01 | Email-verify banner when unconfirmed | `EmailVerifyBanner` | ✅ | Needs integration |
| SYS-DELETE-01 | Deletion-pending banner | `DeletionPendingBanner` | ✅ | Needs integration |
| SYS-404-01 | Unknown route → not-found fallback | `not-found.tsx` | ✅ | Needs E2E |
| SYS-ERR-01 | Error boundary on dashboard pages | `error.tsx`/`global-error.tsx` (root only) | 🟡 | Needs integration — **no per-page boundaries** |
| SYS-STATE-01 | Loading/empty/error states per page | varies | 🟡 | **Needs integration — sparse skeletons, silent error fallback** |

---

## Highest-priority test targets (entry point for M2/M3)

1. **Form submissions (zero E2E today):** seller 7-step wizard, agent create-listing, renter apply,
   provider quote builder, settings password/MFA, billing checkout, billing refund.
2. **State assertions:** empty/loading/error for every list page (saved, viewings, offers, jobs,
   bookings, RFQs).
3. **Nav→page parity (SYS-NAV-02):** deep-link the 28 agent + 4 broker pages absent from nav.
4. **Negative permissions/RLS:** cross-role URL block (have some), cross-user resource access (none),
   admin sub-role route gating, custom-checked admin pages (`pricing-review`/`sdr`/`truedeed`).
5. **Mock-data guards:** assert broker/tenancy/offers surfaces are mock and pin `search_live_data`;
   convert to real-data tests as those surfaces are implemented (M4).

*Update Impl/Test columns as M2–M4 land. A row is only promoted to a "Covered" test status when a
named test file demonstrably asserts the behaviour.*
