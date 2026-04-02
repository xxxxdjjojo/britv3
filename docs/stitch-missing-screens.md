# Britestate — Missing Stitch Screens

**Purpose:** Gap analysis between pages inventory (309 pages) and Stitch screens reference (~160 screens).
**Generated:** 2026-03-30

---

## Summary

| Category | Total Pages | Has Screen | Missing | Coverage |
|---|---|---|---|---|
| (auth) | 14 | 9 | 5 | 64% |
| (main) — Company | 11 | 6 | 5 | 55% |
| (main) — Properties & Search | 4 | 3 | 1 | 75% |
| (main) — Areas & Sold Prices | 7 | 5 | 2 | 71% |
| (main) — Marketplace & Reviews | 5 | 2 | 3 | 40% |
| (main) — Professional Directories | 10 | 5 | 5 | 50% |
| (main) — Services | 8 | 3 | 5 | 38% |
| (main) — Calculators & Tools | 10 | 5 | 5 | 50% |
| (main) — Blog & Help | 6 | 0 | 6 | 0% |
| (main) — Legal | 17 | 4 | 13 | 24% |
| (protected) — Shared Dashboard | 13 | 5 | 8 | 38% |
| (protected) — Buyer/Renter | 12 | 7 | 5 | 58% |
| (protected) — Seller | 14 | 3 | 11 | 21% |
| (protected) — Agent | 30 | 6 | 24 | 20% |
| (protected) — Broker | 11 | 5 | 6 | 45% |
| (protected) — Landlord | 35 | 4 | 31 | 11% |
| (protected) — Provider | 31 | 4 | 27 | 13% |
| (protected) — General | 15 | 5 | 10 | 33% |
| (admin) | 29 | 9 | 20 | 31% |
| Root Utility | 7 | 7 | 0 | 100% |
| **TOTAL** | **309** | **~102** | **~191** | **~33%** |

**~191 screens still needed.**

---

## Missing Screens by Category

### 1. Authentication & Onboarding — 5 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M1 | `/account-locked` | Account Locked | May be a variant of Account States (#138) — verify |
| M2 | `/account-suspended` | Account Suspended | May be a variant of Account States (#138) — verify |
| M3 | `/account-deletion-confirm` | Account Deletion Confirmation | Confirmation dialog/page for GDPR account deletion |
| M4 | `/welcome` | Welcome Page | Post-registration welcome/next-steps page |
| M5 | `/register/onboarding/[role]` | Renter Onboarding | Buyer, landlord, agent, provider have screens — renter does not |

> **Note:** Seller onboarding and broker onboarding also have no dedicated screens, but may share buyer/agent flows respectively.

---

### 2. Homepage & Company Pages — 5 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M6 | `/investors` | Investors | Investor relations / funding info page |
| M7 | `/jobs` | Jobs | Job listings page (distinct from /careers) |
| M8 | `/partners` | Partners | Partner programme / integrations page |
| M9 | `/press` | Press | Press releases / media kit page |
| M10 | `/sitemap-page` | HTML Sitemap | SEO sitemap page — low design priority |

---

### 3. Properties & Search — 1 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M11 | `/compare` | Property Comparison | Side-by-side property comparison tool |

> **Covered:** /search (12 variants), /properties/[slug] (5 screens), /valuation (could map to seller valuation flow)

---

### 4. Areas & Sold Prices — 2 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M12 | `/areas` | Area Guides Index | Landing page listing all areas/cities |
| M13 | `/areas/[city]/stats` | City Statistics | Dedicated stats dashboard per city |

> **Covered:** /areas/[city] and /areas/[city]/[area] (screens #47-49), /sold-prices (screens #50-51), /market-trends (screens #52-53)

---

### 5. Marketplace & Reviews — 3 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M14 | `/marketplace` | Marketplace Index | Service marketplace landing/directory |
| M15 | `/marketplace/[slug]` | Marketplace Listing Detail | Individual marketplace listing page |
| M16 | `/reviews` | Reviews Landing | Public reviews aggregation page |

> **Covered:** Marketplace search results (#125) exists but may not cover the index/landing page

---

### 6. Professional Directories — 5 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M17 | `/agents` | Estate Agents Directory | Agent listing/search page |
| M18 | `/architects` | Architects Directory | Architect listing/search page |
| M19 | `/architects/[slug]` | Architect Profile | Individual architect public profile |
| M20 | `/surveyors` | Surveyors Directory | Surveyor listing/search page |
| M21 | `/mortgage-brokers` | Mortgage Brokers Directory | Broker listing/search page |

> **Covered:** Individual profiles for agents (#110), conveyancers (#102-106), surveyors (#107-108), mortgage brokers (#109). Directory LISTING pages are the gap — these are search/filter pages, not individual profiles.

---

### 7. Services — 5 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M22 | `/services` | Services Index | Main services landing page |
| M23 | `/services/[category]` | Service Category Page | Generic category template (partially covered by #94-95) |
| M24 | `/services/cleaning` | Cleaning Services | Category-specific landing |
| M25 | `/services/electrical` | Electrical Services | Category-specific landing |
| M26 | `/services/gardening` | Gardening Services | Category-specific landing |

> **Covered:** /services/moving, /services/plumbing may be covered by category page screens (#94-95). /services/[category]/[slug] covered by tradesperson profile screens (#96-99).

> **Recommendation:** Design ONE category template screen + one services index screen. The 5 specific categories use the same template.

---

### 8. Calculators & Tools — 5 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M27 | `/tools/equity-calculator` | Equity Calculator | Home equity estimator |
| M28 | `/tools/investment-calculator` | Investment Calculator | Property investment ROI tool |
| M29 | `/tools/ltv-calculator` | LTV Calculator | Loan-to-value calculator |
| M30 | `/tools/moving-cost-calculator` | Moving Cost Calculator | Moving expense estimator |
| M31 | `/tools/overpayment-calculator` | Overpayment Calculator | Mortgage overpayment savings |

> **Covered:** Mortgage (#54), affordability (#56), stamp duty (#58), buy-vs-rent (#59), rental yield (#60). Also energy bill estimator (#61) and mortgage comparison (#62) which are bonus screens not in the page inventory.

> **Recommendation:** Design ONE calculator template. All 10 calculators share the same layout — input panel left, results right. Only the fields change.

---

### 9. Blog & Help — 6 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M32 | `/blog` | Blog Index | Blog listing with categories and featured posts |
| M33 | `/blog/[slug]` | Blog Post | Individual article page with rich content |
| M34 | `/blog/category/[slug]` | Blog Category | Filtered blog listing by category |
| M35 | `/help` | Help Centre | Help centre landing with search and categories |
| M36 | `/help/[slug]` | Help Article | Individual help article page |
| M37 | `/help/contact` | Help Contact | Contact form within help centre context |

> **Recommendation:** 4 templates needed: blog index, blog post, help centre, help article. Category page reuses blog index with filter active. Help contact reuses contact page layout.

---

### 10. Legal Pages — 

| # | Route | Page | Notes |
|---|---|---|---|
| M38 | `/legal` | Legal Index | Legal pages hub/directory |
| M44 | `/legal/fair-housing` | Fair Housing Policy | | |
| M47 | `/legal/professional-standards` | Professional Standards | |
| M48 | `/legal/refund-policy` | Refund Policy | |
| M49 | `/legal/regulatory` | Regulatory Information | |
| M50 | `/legal/third-party-services` | Third-Party Services | |

> **Covered:** Privacy policy (#169), terms of service (#170), accessibility (#171), cookie policy (#172).

> **Recommendation:** Design ONE legal page template + one legal index. All 16 legal pages share the same long-form content layout (TOC sidebar + content area). Only the text changes.

---

### 11. Shared Dashboard Features — 8 Missing

These are per-role pages that every dashboard user sees.

| # | Route | Page | Notes |
|---|---|---|---|
| M51 | `/dashboard/[role]/referrals` | Referral Programme | Invite friends, track rewards |
| M52 | `/dashboard/[role]/billing` | Billing Overview | Payment overview per role |
| M53 | `/dashboard/[role]/billing/payment-methods` | Payment Methods | Manage cards/bank accounts |
| M54 | `/dashboard/[role]/billing/invoices` | Invoices | Invoice history with download |
| M55 | `/dashboard/[role]/billing/refund` | Refund Request | Request a refund form |
| M56 | `/dashboard/[role]/calculators` | Calculators Hub | In-dashboard calculator access |
| M57 | `/dashboard/[role]/moving` | Moving Checklist | Interactive moving checklist |
| M58 | `/dashboard/[role]/services` | Services | Browse services from dashboard |

> **Covered:** AI match (#69), documents (#70), saved searches (#66), billing/checkout (#139-141), billing/subscription (#142-144). The gap is the generic billing sub-pages and utility features.

---

### 12. Buyer/Renter Dashboard — 5 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M59 | `/dashboard/[role]/applications` | Rental Applications List | Renter's submitted applications |
| M60 | `/dashboard/[role]/applications/apply/[listingId]` | Apply for Listing | Rental application form |
| M61 | `/dashboard/[role]/tenancy` | Tenancy Management | Active tenancy details, payments, documents |
| M62 | `/dashboard/[role]/listings/new` | New Listing | Create new listing (buyer/renter context) |
| M63 | `/dashboard/[role]/viewings/[id]/reschedule` | Reschedule Viewing | Viewing reschedule form |

> **Covered:** Home (#63), saved (#64), searches (#66), viewings (#67), offers (#68), AI match (#69), documents (#70), messages (#71)

---

### 13. Seller Dashboard — 11 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M64 | `/dashboard/seller/agents` | Find Agents | Agent search/comparison for sellers |
| M65 | `/dashboard/seller/agents/[id]` | Agent Detail | Agent profile viewed by seller |
| M66 | `/dashboard/seller/agents/compare` | Compare Agents | Side-by-side agent comparison |
| M67 | `/dashboard/seller/enquiries` | Enquiries | Buyer enquiries received |
| M68 | `/dashboard/seller/listings/[id]/edit` | Edit Listing | Edit existing listing |
| M69 | `/dashboard/seller/listings/create` | Create Listing | New listing wizard (seller context) |
| M70 | `/dashboard/seller/offers` | Offers Received | Offers management for sellers |
| M71 | `/dashboard/seller/sale-progress/[id]` | Sale Progress Tracker | Conveyancing milestone tracker |
| M72 | `/dashboard/seller/valuation` | Valuation Tool | In-dashboard property valuation |
| M73 | `/dashboard/seller/viewings` | Viewings Management | Manage scheduled viewings |
| M74 | `/dashboard/seller/analytics` | Seller Analytics | Full analytics dashboard |

> **Covered:** Home (#73), listings (#74), listing analytics (#75)

---

### 14. Agent Dashboard — 24 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M75 | `/dashboard/agent/analytics/behaviour` | Behavioural Analytics | User engagement analytics |
| M76 | `/dashboard/agent/analytics/branch` | Branch Analytics | Per-branch performance |
| M77 | `/dashboard/agent/analytics/competitors` | Competitor Analytics | Market competitor comparison |
| M78 | `/dashboard/agent/billing` | Agent Billing | Agent-specific billing |
| M79 | `/dashboard/agent/boost` | Listing Boost | Paid promotion for listings |
| M80 | `/dashboard/agent/crm` | CRM | Contact relationship manager |
| M81 | `/dashboard/agent/crm/[id]` | CRM Contact Detail | Individual contact view |
| M82 | `/dashboard/agent/feeds` | Property Feeds | Portal feed integration (Rightmove, Zoopla) |
| M83 | `/dashboard/agent/leads` | Leads | Lead pipeline |
| M84 | `/dashboard/agent/leads/[id]` | Lead Detail | Individual lead view |
| M85 | `/dashboard/agent/listings/[id]/analytics` | Listing Analytics | Per-listing performance |
| M86 | `/dashboard/agent/listings/archived` | Archived Listings | Archived/withdrawn listings |
| M87 | `/dashboard/agent/listings/sold` | Sold Listings | Completed sale listings |
| M88 | `/dashboard/agent/offers` | Offers | Offer management |
| M89 | `/dashboard/agent/offers/[id]` | Offer Detail | Individual offer negotiation |
| M90 | `/dashboard/agent/profile` | Agent Profile | Profile management |
| M91 | `/dashboard/agent/profile/branding` | Brand Settings | Logo, colours, brand customisation |
| M92 | `/dashboard/agent/revenue` | Revenue | Revenue tracking dashboard |
| M93 | `/dashboard/agent/reviews` | Reviews | Review management |
| M94 | `/dashboard/agent/reviews/[id]/respond` | Respond to Review | Review response form |
| M95 | `/dashboard/agent/sales/appraisal` | Appraisal Tool | Market appraisal generator |
| M96 | `/dashboard/agent/sales/reports` | Sales Reports | Sales performance reports |
| M97 | `/dashboard/agent/team` | Team Management | Team members & permissions |
| M98 | `/dashboard/agent/team/branches` | Branch Management | Multi-branch management |
| M99 | `/dashboard/agent/team/roles` | Role Management | Team role permissions |
| M100 | `/dashboard/agent/viewings` | Viewings | Agent viewings calendar |
| M101 | `/dashboard/agent/viewings/feedback` | Viewing Feedback | Post-viewing feedback forms |

> **Covered:** Home (#80), active listings (#81), listings management (#82), sale progression (#83), create listing step 1 (#84), create listing step 2 (#85)

---

### 15. Broker Dashboard — 6 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M102 | `/dashboard/broker/analytics` | Broker Analytics | Performance analytics |
| M103 | `/dashboard/broker/billing` | Broker Billing | Billing management |
| M104 | `/dashboard/broker/calculators` | Broker Calculators | In-dashboard mortgage tools |
| M105 | `/dashboard/broker/fca-verification` | FCA Verification | FCA registration verification flow |
| M106 | `/dashboard/broker/leads` | Leads | Lead management |
| M107 | `/dashboard/broker/reviews` | Reviews | Review management |

> **Covered:** Home (#86), pipeline (#87), profile (#88), products (#89)

---

### 16. Landlord Dashboard — 31 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M108 | `/dashboard/landlord/analytics` | Landlord Analytics | Portfolio performance |
| M109 | `/dashboard/landlord/compliance-guide` | Compliance Guide | Regulatory compliance guide |
| M110 | `/dashboard/landlord/compliance/alerts` | Compliance Alerts | Expiry/renewal alerts |
| M111 | `/dashboard/landlord/compliance/upload` | Upload Compliance Docs | Document upload for compliance |
| M112 | `/dashboard/landlord/deposits` | Deposit Management | Tenant deposit tracking |
| M113 | `/dashboard/landlord/finance/expenses` | Expenses | Expense tracking |
| M114 | `/dashboard/landlord/finance/report` | Financial Reports | Portfolio financial reports |
| M115 | `/dashboard/landlord/finance/tax` | Tax Reporting | Section 24 tax calculations |
| M116 | `/dashboard/landlord/find-agent` | Find Letting Agent | Agent search for landlords |
| M117 | `/dashboard/landlord/find-tradespeople` | Find Tradespeople | Tradesperson search for landlords |
| M118 | `/dashboard/landlord/insurance` | Insurance | Property insurance management |
| M119 | `/dashboard/landlord/inventory/check-in` | Inventory Check-In | Move-in inventory report |
| M120 | `/dashboard/landlord/inventory/check-out` | Inventory Check-Out | Move-out inventory report |
| M121 | `/dashboard/landlord/legal/notices` | Legal Notices | Section 21/Section 8 notices |
| M122 | `/dashboard/landlord/maintenance/[id]` | Maintenance Request Detail | Individual request view |
| M123 | `/dashboard/landlord/maintenance/[id]/assign` | Assign Tradesperson | Assign tradesperson to request |
| M124 | `/dashboard/landlord/properties` | Properties List | Portfolio property list |
| M125 | `/dashboard/landlord/properties/[id]` | Property Detail | Property management hub |
| M126 | `/dashboard/landlord/properties/[id]/documents` | Property Documents | Per-property documents |
| M127 | `/dashboard/landlord/properties/[id]/financials` | Property Financials | Per-property income/expenses |
| M128 | `/dashboard/landlord/properties/[id]/listing` | Property Listing | Manage property listing |
| M129 | `/dashboard/landlord/properties/[id]/maintenance` | Property Maintenance | Per-property maintenance |
| M130 | `/dashboard/landlord/properties/[id]/overview` | Property Overview | Per-property dashboard |
| M131 | `/dashboard/landlord/properties/[id]/tenancies` | Property Tenancies | Per-property tenancy history |
| M132 | `/dashboard/landlord/rent` | Rent Overview | Rent collection dashboard |
| M133 | `/dashboard/landlord/rent/[propertyId]` | Rent by Property | Per-property rent tracking |
| M134 | `/dashboard/landlord/tenants` | Tenants | Tenant management list |
| M135 | `/dashboard/landlord/tenants/[applicationId]` | Tenant Application | Application review |
| M136 | `/dashboard/landlord/tenants/decision` | Tenant Decision | Accept/reject tenant |
| M137 | `/dashboard/landlord/tenants/agreement` | Tenancy Agreement | Agreement generation |
| M138 | `/dashboard/landlord/tools/yield-calculator` | Yield Calculator | In-dashboard yield tool |

> **Covered:** Home (#76), portfolio (#77), compliance matrix (#78), maintenance inbox (#79)

---

### 17. Provider/Tradesperson Dashboard — 27 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M139 | `/dashboard/provider/analytics` | Provider Analytics | Performance dashboard |
| M140 | `/dashboard/provider/availability` | Availability Calendar | Availability management |
| M141 | `/dashboard/provider/billing` | Provider Billing | Billing management |
| M142 | `/dashboard/provider/boost` | Profile Boost | Paid promotion |
| M143 | `/dashboard/provider/documents` | Documents | Document management |
| M144 | `/dashboard/provider/field/jobs` | Field Jobs | Mobile-first field view |
| M145 | `/dashboard/provider/field/payments` | Field Payments | Mobile-first payment tracking |
| M146 | `/dashboard/provider/jobs` | Jobs Overview | All jobs list |
| M147 | `/dashboard/provider/jobs/[id]` | Job Detail | Individual job view |
| M148 | `/dashboard/provider/jobs/[id]/certificates` | Job Certificates | Upload certificates for job |
| M149 | `/dashboard/provider/jobs/active` | Active Jobs | In-progress jobs |
| M150 | `/dashboard/provider/jobs/completed` | Completed Jobs | Completed job history |
| M151 | `/dashboard/provider/jobs/leads` | Job Leads | New job opportunities |
| M152 | `/dashboard/provider/payments` | Payments Overview | Payment tracking |
| M153 | `/dashboard/provider/payments/[id]` | Payment Detail | Individual payment view |
| M154 | `/dashboard/provider/portfolio` | Portfolio | Work portfolio management |
| M155 | `/dashboard/provider/profile` | Provider Profile | Profile management |
| M156 | `/dashboard/provider/quotes` | Quotes Overview | Quote management |
| M157 | `/dashboard/provider/quotes/[id]/invoice` | Quote Invoice | Invoice from quote |
| M158 | `/dashboard/provider/quotes/builder` | Quote Builder | Quote creation tool |
| M159 | `/dashboard/provider/referrals` | Referrals | Referral programme |
| M160 | `/dashboard/provider/reviews` | Reviews | Review management |
| M161 | `/dashboard/provider/reviews/[id]/respond` | Respond to Review | Review response form |
| M162 | `/dashboard/provider/services` | Services Offered | Manage services |
| M163 | `/dashboard/provider/services/areas` | Service Areas | Coverage area management |
| M164 | `/dashboard/provider/verification` | Verification Overview | Verification hub |
| M165 | `/dashboard/provider/verification/badges` | Verification Badges | Badge management |
| M166 | `/dashboard/provider/verification/client-references` | Client References | Client reference requests |
| M167 | `/dashboard/provider/verification/credentials` | Credentials | Credential upload/management |
| M168 | `/dashboard/provider/verification/peer-references` | Peer References | Peer reference requests |

> **Covered:** Public-facing screens (#91-101) cover search/discovery. Dashboard screens are the gap — only tradesperson onboarding (#26-29) exists in Stitch.

---

### 18. General Protected Routes — 10 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M169 | `/dashboard/rfqs` | RFQ List | Request for quotes list |
| M170 | `/dashboard/rfqs/[id]` | RFQ Detail | Individual RFQ |
| M171 | `/dashboard/rfqs/create` | Create RFQ | New RFQ form |
| M172 | `/dashboard/bookings` | Bookings | Booking list |
| M173 | `/dashboard/bookings/[id]` | Booking Detail | Individual booking |
| M174 | `/dashboard/reviews` | Reviews | User's reviews |
| M175 | `/milestones/transaction/[id]` | Transaction Milestones | Property transaction tracker |
| M176 | `/milestones/job/[bookingId]` | Job Milestones | Job progress tracker |
| M177 | `/profile` | User Profile | Public-facing profile page |
| M178 | `/profile/settings` | Profile Settings | Profile editing |

> **Covered:** Inbox (#126-127), notifications (#128), settings (#129-136)

---

### 19. Admin Dashboard — 20 Missing

| # | Route | Page | Notes |
|---|---|---|---|
| M179 | `/admin/analytics/behaviour` | User Behaviour Analytics | User engagement data |
| M180 | `/admin/analytics/platform` | Platform Analytics | Platform health metrics |
| M181 | `/admin/analytics/search` | Search Analytics | Search usage patterns |
| M182 | `/admin/api-usage` | API Usage | API usage monitoring |
| M183 | `/admin/audit-log` | Audit Log | System audit trail |
| M184 | `/admin/cms/blog` | Blog CMS | Blog content management |
| M185 | `/admin/cms/blog/[id]` | Edit Blog Post | Blog editor |
| M186 | `/admin/cms/help` | Help CMS | Help content management |
| M187 | `/admin/cms/help/[id]` | Edit Help Article | Help article editor |
| M188 | `/admin/cms/landing` | Landing Page CMS | Landing page builder |
| M189 | `/admin/cms/landing/[id]` | Edit Landing Page | Landing page editor |
| M190 | `/admin/email-campaigns` | Email Campaigns | Campaign management |
| M191 | `/admin/fraud` | Fraud Detection | Fraud alerts dashboard |
| M192 | `/admin/gdpr` | GDPR Management | Data requests management |
| M193 | `/admin/promo-codes` | Promo Codes | Promotion management |
| M194 | `/admin/reported` | Reported Content | User reports queue |
| M195 | `/admin/reviews` | Review Moderation | Review moderation queue |
| M196 | `/admin/roles` | Role Management | System role configuration |
| M197 | `/admin/seo` | SEO Management | SEO settings & metadata |
| M198 | `/admin/subscriptions` | Subscription Management | Plan & subscription admin |
| M199 | `/admin/team` | Admin Team | Admin user management |
| M200 | `/admin/verifications` | Verification Queue | Professional verification queue |

> **Covered:** Dashboard overview (#145), user management (#147-148), moderation (#149-150), system health (#151), revenue analytics (#152), activity overview (#153)

---

## Priority Recommendations

### Tier 1 — Template Screens (design once, reuse many times)

These templates eliminate the most gaps with the fewest screens.

| Template | Eliminates | Count |
|---|---|---|
| Legal page template + index | M38–M50 | 13 pages |
| Calculator template | M27–M31 | 5 pages |
| Blog index + post + help centre + article | M32–M37 | 6 pages |
| Professional directory listing template | M17–M21 | 5 pages |
| Service category template + index | M22–M26 | 5 pages |
| Admin CMS editor template | M184–M189 | 6 pages |
| Admin analytics template | M179–M181 | 3 pages |
| **Subtotal** | | **43 pages from ~8 templates** |

### Tier 2 — High-Impact Dashboard Screens

These are core user flows that need unique designs.

| Screen | Why | Gaps Covered |
|---|---|---|
| Landlord — Property Detail Hub | Central management page, 6 sub-tabs | M125–M131 |
| Landlord — Tenant Management Flow | Application → decision → agreement | M134–M137 |
| Landlord — Finance Dashboard | Expenses, reports, tax | M113–M115 |
| Agent — CRM | Core agent workflow | M80–M81 |
| Agent — Leads Pipeline | Lead management | M83–M84 |
| Agent — Analytics Suite | 3 analytics views | M75–M77 |
| Provider — Jobs Hub | Jobs list + detail + states | M146–M151 |
| Provider — Quotes & Invoicing | Quote management + invoice | M156–M158 |
| Provider — Verification Hub | Badges, credentials, references | M164–M168 |
| Seller — Sale Progress Tracker | Conveyancing milestones | M71 |
| Seller — Agent Comparison | Find + compare agents | M64–M66 |
| Transaction/Job Milestones | Progress timeline | M175–M176 |

### Tier 3 — Lower Priority

| Category | Screens | Reason |
|---|---|---|
| Company pages (investors, press, partners, jobs) | M6–M10 | Marketing pages, can launch later |
| Admin detailed pages (fraud, GDPR, campaigns, etc.) | M190–M200 | Internal tools, functional > beautiful |
| Field views (provider mobile) | M144–M145 | Mobile-specific, can adapt desktop |
| Boost/promotion pages | M79, M142 | Revenue feature, not launch-critical |

---

## Screen Count Summary

| | Count |
|---|---|
| **Total pages in inventory** | 309 |
| **Pages with Stitch screens** | ~102 |
| **Missing screens** | ~191 |
| **Eliminated by templates (Tier 1)** | ~43 |
| **Unique screens still needed** | ~148 |
| **High-priority (Tier 2)** | ~45 |
| **Lower priority (Tier 3)** | ~30 |
| **Remaining dashboard sub-pages** | ~73 |
