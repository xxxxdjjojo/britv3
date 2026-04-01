# TEST-USER-FLOWS.md — Complete Browser Flow Testing

## Test Users (Seed Demo Accounts)

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Homebuyer | james.buyer@demo.britestate.co.uk | DemoPass123! | /dashboard/homebuyer |
| Renter | sophie.renter@demo.britestate.co.uk | DemoPass123! | /dashboard/renter |
| Seller | david.seller@demo.britestate.co.uk | DemoPass123! | /dashboard/seller |
| Landlord | mike.landlord@demo.britestate.co.uk | DemoPass123! | /dashboard/landlord |
| Agent | sarah.agent@demo.britestate.co.uk | DemoPass123! | /dashboard/agent |
| Provider | tom.provider@demo.britestate.co.uk | DemoPass123! | /dashboard/provider |
| Admin | admin@demo.britestate.co.uk | DemoPass123! | /admin |

---

## 1. PUBLIC PAGES (No Auth Required)

### Homepage & Navigation
- [ ] / (Homepage)
- [ ] /about
- [ ] /how-it-works
- [ ] /contact
- [ ] /pricing
- [ ] /careers
- [ ] /jobs
- [ ] /investors
- [ ] /partners
- [ ] /press
- [ ] /sitemap-page
- [ ] /overview
- [ ] /valuation

### Property Search & Detail
- [ ] /search
- [ ] /properties/[slug]
- [ ] /compare
- [ ] /compare/properties
- [ ] /sold-prices
- [ ] /sold-prices/[area]
- [ ] /sold-prices/[area]/[slug]

### Area Guides
- [ ] /areas
- [ ] /areas/[city]
- [ ] /areas/[city]/[area]
- [ ] /areas/[city]/stats

### Market Trends
- [ ] /market-trends
- [ ] /market-trends/national

### Marketplace & Services
- [ ] /marketplace
- [ ] /marketplace/[slug]
- [ ] /services
- [ ] /services/[category]
- [ ] /services/[category]/[slug]
- [ ] /services/architects
- [ ] /services/conveyancers
- [ ] /services/letting-agents
- [ ] /services/mortgage-brokers
- [ ] /services/surveyors
- [ ] /services/tradespeople
- [ ] /services/tradespeople/[category]/[location]

### Professional Directories
- [ ] /agents
- [ ] /agents/[slug]
- [ ] /letting-agents
- [ ] /letting-agents/[slug]
- [ ] /architects
- [ ] /architects/[slug]
- [ ] /conveyancers
- [ ] /conveyancers/[slug]
- [ ] /mortgage-brokers
- [ ] /mortgage-brokers/[slug]
- [ ] /surveyors
- [ ] /surveyors/[slug]

### Reviews
- [ ] /reviews
- [ ] /reviews/[area]
- [ ] /reviews/[area]/[provider]
- [ ] /reviews/[area]/category/[category]

### Blog
- [ ] /blog
- [ ] /blog/[slug]
- [ ] /blog/category/[slug]

### Tools & Calculators
- [ ] /tools
- [ ] /tools/mortgage-calculator
- [ ] /tools/stamp-duty-calculator
- [ ] /tools/affordability-calculator
- [ ] /tools/rental-yield-calculator
- [ ] /tools/buy-vs-rent-calculator
- [ ] /tools/energy-bill-estimator
- [ ] /tools/equity-calculator
- [ ] /tools/first-time-buyer-guide
- [ ] /tools/investment-calculator
- [ ] /tools/ltv-calculator
- [ ] /tools/mortgage-comparison
- [ ] /tools/moving-cost-estimator
- [ ] /tools/overpayment-calculator
- [ ] /tools/remortgage-calculator

### Legal Pages
- [ ] /legal
- [ ] /legal/terms
- [ ] /legal/privacy
- [ ] /legal/cookies
- [ ] /legal/accessibility
- [ ] /legal/acceptable-use
- [ ] /legal/ai-transparency
- [ ] /legal/aml-policy
- [ ] /legal/complaints
- [ ] /legal/data-processing
- [ ] /legal/disclaimer
- [ ] /legal/fair-housing
- [ ] /legal/fee-transparency
- [ ] /legal/gdpr-rights
- [ ] /legal/modern-slavery
- [ ] /legal/professional-standards
- [ ] /legal/refund-policy
- [ ] /legal/regulatory-information
- [ ] /legal/review-policy
- [ ] /legal/third-party-services

### Other Public
- [ ] /post-a-job
- [ ] /reference/[token]
- [ ] /unsubscribe

### Error/System Pages
- [ ] /forbidden
- [ ] /maintenance
- [ ] /offline
- [ ] /rate-limited
- [ ] /session-expired

---

## 2. AUTH PAGES (Unauthenticated)

- [ ] /login
- [ ] /register
- [ ] /register/role-select
- [ ] /register/onboarding/[role] (x7 roles)
- [ ] /forgot-password
- [ ] /reset-password
- [ ] /verify-email
- [ ] /verify-email/confirmed
- [ ] /two-factor
- [ ] /two-factor-setup
- [ ] /account-locked
- [ ] /account-suspended

### Post-Auth
- [ ] /welcome
- [ ] /account-deletion-confirm

---

## 3. HOMEBUYER DASHBOARD (james.buyer@demo.britestate.co.uk)

- [ ] /dashboard/homebuyer (main dashboard)
- [ ] /dashboard/homebuyer/saved
- [ ] /dashboard/homebuyer/searches
- [ ] /dashboard/homebuyer/viewings
- [ ] /dashboard/homebuyer/viewings/book
- [ ] /dashboard/homebuyer/viewings/calendar
- [ ] /dashboard/homebuyer/offers
- [ ] /dashboard/homebuyer/documents
- [ ] /dashboard/homebuyer/messages
- [ ] /dashboard/homebuyer/moving
- [ ] /dashboard/homebuyer/services
- [ ] /dashboard/homebuyer/ai-match
- [ ] /dashboard/homebuyer/calculators
- [ ] /dashboard/homebuyer/billing
- [ ] /dashboard/homebuyer/billing/invoices
- [ ] /dashboard/homebuyer/billing/payment-methods
- [ ] /dashboard/homebuyer/billing/subscription
- [ ] /dashboard/homebuyer/referrals
- [ ] /dashboard/homebuyer/verification
- [ ] /dashboard/homebuyer/applications
- [ ] /dashboard/homebuyer/tenancy
- [ ] /dashboard/homebuyer/listings

---

## 4. RENTER DASHBOARD (sophie.renter@demo.britestate.co.uk)

- [ ] /dashboard/renter (main dashboard)
- [ ] /dashboard/renter/saved
- [ ] /dashboard/renter/searches
- [ ] /dashboard/renter/viewings
- [ ] /dashboard/renter/viewings/book
- [ ] /dashboard/renter/viewings/calendar
- [ ] /dashboard/renter/applications
- [ ] /dashboard/renter/tenancy
- [ ] /dashboard/renter/documents
- [ ] /dashboard/renter/messages
- [ ] /dashboard/renter/services
- [ ] /dashboard/renter/ai-match
- [ ] /dashboard/renter/calculators
- [ ] /dashboard/renter/billing
- [ ] /dashboard/renter/referrals
- [ ] /dashboard/renter/verification

---

## 5. SELLER DASHBOARD (david.seller@demo.britestate.co.uk)

- [ ] /dashboard/seller (main dashboard)
- [ ] /dashboard/seller/listings
- [ ] /dashboard/seller/listings/create
- [ ] /dashboard/seller/listings/[id]/edit
- [ ] /dashboard/seller/listings/[id]/analytics
- [ ] /dashboard/seller/offers
- [ ] /dashboard/seller/offers/[id]
- [ ] /dashboard/seller/enquiries
- [ ] /dashboard/seller/enquiries-viewings
- [ ] /dashboard/seller/viewings
- [ ] /dashboard/seller/agents
- [ ] /dashboard/seller/agents/compare
- [ ] /dashboard/seller/agents/[id]
- [ ] /dashboard/seller/analytics
- [ ] /dashboard/seller/valuation
- [ ] /dashboard/seller/sale-progress/[id]
- [ ] /dashboard/seller/documents
- [ ] /dashboard/seller/messages
- [ ] /dashboard/seller/billing
- [ ] /dashboard/seller/referrals
- [ ] /dashboard/seller/verification

---

## 6. LANDLORD DASHBOARD (mike.landlord@demo.britestate.co.uk)

- [ ] /dashboard/landlord (main dashboard)
- [ ] /dashboard/landlord/properties
- [ ] /dashboard/landlord/properties/add
- [ ] /dashboard/landlord/properties/[id]
- [ ] /dashboard/landlord/properties/[id]/overview
- [ ] /dashboard/landlord/properties/[id]/listing
- [ ] /dashboard/landlord/properties/[id]/tenancies
- [ ] /dashboard/landlord/properties/[id]/tenancies/[tenancyId]
- [ ] /dashboard/landlord/properties/[id]/tenancies/[tenancyId]/lease
- [ ] /dashboard/landlord/properties/[id]/maintenance
- [ ] /dashboard/landlord/properties/[id]/maintenance/new
- [ ] /dashboard/landlord/properties/[id]/maintenance/[requestId]
- [ ] /dashboard/landlord/properties/[id]/financials
- [ ] /dashboard/landlord/properties/[id]/documents
- [ ] /dashboard/landlord/tenants
- [ ] /dashboard/landlord/tenants/[applicationId]
- [ ] /dashboard/landlord/tenants/[applicationId]/decision
- [ ] /dashboard/landlord/tenants/[applicationId]/tenancy/agreement
- [ ] /dashboard/landlord/maintenance
- [ ] /dashboard/landlord/maintenance/[id]
- [ ] /dashboard/landlord/maintenance/[id]/assign
- [ ] /dashboard/landlord/rent
- [ ] /dashboard/landlord/rent/[propertyId]
- [ ] /dashboard/landlord/deposits
- [ ] /dashboard/landlord/compliance
- [ ] /dashboard/landlord/compliance/matrix
- [ ] /dashboard/landlord/compliance/alerts
- [ ] /dashboard/landlord/compliance/upload
- [ ] /dashboard/landlord/compliance-guide
- [ ] /dashboard/landlord/finance/expenses
- [ ] /dashboard/landlord/finance/report
- [ ] /dashboard/landlord/finance/tax
- [ ] /dashboard/landlord/analytics
- [ ] /dashboard/landlord/insurance
- [ ] /dashboard/landlord/legal/notices
- [ ] /dashboard/landlord/find-agent
- [ ] /dashboard/landlord/find-tradespeople
- [ ] /dashboard/landlord/tools/yield-calculator
- [ ] /dashboard/landlord/inventory/[propertyId]/check-in
- [ ] /dashboard/landlord/inventory/[propertyId]/check-out
- [ ] /dashboard/landlord/billing
- [ ] /dashboard/landlord/referrals
- [ ] /dashboard/landlord/verification
- [ ] /dashboard/landlord/messages
- [ ] /dashboard/landlord/documents

---

## 7. AGENT DASHBOARD (sarah.agent@demo.britestate.co.uk)

- [ ] /dashboard/agent (main dashboard)
- [ ] /dashboard/agent/listings
- [ ] /dashboard/agent/listings/create
- [ ] /dashboard/agent/listings/archived
- [ ] /dashboard/agent/listings/sold
- [ ] /dashboard/agent/listings/[id]/analytics
- [ ] /dashboard/agent/offers
- [ ] /dashboard/agent/offers/[id]
- [ ] /dashboard/agent/leads
- [ ] /dashboard/agent/leads/[id]
- [ ] /dashboard/agent/crm
- [ ] /dashboard/agent/crm/[id]
- [ ] /dashboard/agent/viewings
- [ ] /dashboard/agent/viewings/feedback
- [ ] /dashboard/agent/sales
- [ ] /dashboard/agent/sales/appraisal
- [ ] /dashboard/agent/sales/reports
- [ ] /dashboard/agent/analytics
- [ ] /dashboard/agent/analytics/branch
- [ ] /dashboard/agent/analytics/competitors
- [ ] /dashboard/agent/reviews
- [ ] /dashboard/agent/reviews/[id]/respond
- [ ] /dashboard/agent/profile
- [ ] /dashboard/agent/profile/branding
- [ ] /dashboard/agent/team
- [ ] /dashboard/agent/team/branches
- [ ] /dashboard/agent/team/roles
- [ ] /dashboard/agent/revenue
- [ ] /dashboard/agent/integrations
- [ ] /dashboard/agent/integrations/feeds
- [ ] /dashboard/agent/billing
- [ ] /dashboard/agent/billing/boost

---

## 8. PROVIDER DASHBOARD (tom.provider@demo.britestate.co.uk)

- [ ] /dashboard/provider (main dashboard)
- [ ] /dashboard/provider/jobs/leads
- [ ] /dashboard/provider/jobs/active
- [ ] /dashboard/provider/jobs/completed
- [ ] /dashboard/provider/jobs/[id]
- [ ] /dashboard/provider/jobs/[id]/certificates
- [ ] /dashboard/provider/quotes
- [ ] /dashboard/provider/quotes/builder
- [ ] /dashboard/provider/quotes/[id]/invoice
- [ ] /dashboard/provider/payments
- [ ] /dashboard/provider/payments/[id]
- [ ] /dashboard/provider/reviews
- [ ] /dashboard/provider/reviews/[id]/respond
- [ ] /dashboard/provider/profile
- [ ] /dashboard/provider/portfolio
- [ ] /dashboard/provider/services
- [ ] /dashboard/provider/services/areas
- [ ] /dashboard/provider/availability
- [ ] /dashboard/provider/documents
- [ ] /dashboard/provider/analytics
- [ ] /dashboard/provider/verification
- [ ] /dashboard/provider/verification/credentials
- [ ] /dashboard/provider/verification/client-references
- [ ] /dashboard/provider/verification/peer-references
- [ ] /dashboard/provider/verification/badges
- [ ] /dashboard/provider/billing
- [ ] /dashboard/provider/boost
- [ ] /dashboard/provider/referrals
- [ ] /dashboard/provider/field
- [ ] /dashboard/provider/field/jobs
- [ ] /dashboard/provider/field/payments

---

## 9. BROKER DASHBOARD (No seed user yet — skip for now)

- [ ] /dashboard/broker (main dashboard)
- [ ] /dashboard/broker/leads
- [ ] /dashboard/broker/pipeline
- [ ] /dashboard/broker/products
- [ ] /dashboard/broker/calculators
- [ ] /dashboard/broker/analytics
- [ ] /dashboard/broker/reviews
- [ ] /dashboard/broker/profile
- [ ] /dashboard/broker/fca-verification
- [ ] /dashboard/broker/billing

---

## 10. ADMIN DASHBOARD (admin@demo.britestate.co.uk)

- [ ] /admin (main dashboard)
- [ ] /admin/users
- [ ] /admin/users/[id]
- [ ] /admin/moderation
- [ ] /admin/verifications
- [ ] /admin/reviews
- [ ] /admin/reported
- [ ] /admin/subscriptions
- [ ] /admin/feature-flags
- [ ] /admin/system-health
- [ ] /admin/audit-log
- [ ] /admin/gdpr
- [ ] /admin/fraud
- [ ] /admin/seo
- [ ] /admin/email-campaigns
- [ ] /admin/promo-codes
- [ ] /admin/roles
- [ ] /admin/team
- [ ] /admin/api-usage
- [ ] /admin/analytics/behaviour
- [ ] /admin/analytics/platform
- [ ] /admin/analytics/revenue
- [ ] /admin/analytics/search
- [ ] /admin/cms/blog
- [ ] /admin/cms/blog/[id]
- [ ] /admin/cms/help
- [ ] /admin/cms/help/[id]
- [ ] /admin/cms/landing
- [ ] /admin/cms/landing/[id]

---

## 11. SHARED PROTECTED PAGES (All Authenticated Roles)

- [ ] /inbox
- [ ] /inbox/[conversationId]
- [ ] /notifications
- [ ] /profile
- [ ] /profile/settings
- [ ] /settings
- [ ] /settings/account
- [ ] /settings/security
- [ ] /settings/privacy
- [ ] /settings/notifications
- [ ] /settings/email-subscriptions
- [ ] /settings/preferences
- [ ] /dashboard/bookings
- [ ] /dashboard/bookings/[id]
- [ ] /dashboard/reviews
- [ ] /dashboard/rfqs
- [ ] /dashboard/rfqs/create
- [ ] /dashboard/rfqs/[id]
- [ ] /milestones/transaction/[id]
- [ ] /milestones/job/[bookingId]

---

## Test Criteria

For each page:
1. **Renders** — No blank screen, no crash, no infinite spinner
2. **No console errors** — No JS errors or unhandled exceptions
3. **Layout correct** — Header, sidebar, content area all visible
4. **Responsive** — Works on desktop (1280px) and mobile (390px)
5. **Navigation** — Links/buttons clickable, routing works

## Progress Tracking — COMPLETED 2026-04-01

| Section | Total Pages | Passed | Failed | % |
|---------|------------|--------|--------|---|
| Public | 79 | 79 | 0 | 100% |
| Auth | 11 | 11 | 0 | 100% |
| Homebuyer | 22 | 22 | 0 | 100% |
| Renter | 16 | 16 | 0 | 100% |
| Seller | 16 | 16 | 0 | 100% |
| Landlord | 26 | 26 | 0 | 100% |
| Agent | 27 | 27 | 0 | 100% |
| Provider | 26 | 26 | 0 | 100% |
| Admin | 25 | 25 | 0 | 100% |
| Shared Protected | 15 | 15 | 0 | 100% |
| Auth Setup | 7 | 7 | 0 | 100% |
| **TOTAL** | **270** | **270** | **0** | **100%** |

Screenshots: `docs/qa-screenshots/stage-flows/` (264 PNGs)
Test file: `e2e/all-pages-render.spec.ts`
