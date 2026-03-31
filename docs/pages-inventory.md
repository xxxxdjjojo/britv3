# Britestate Pages Inventory

**Total: 309 pages + 209 API routes = 518 routes**

Generated: 2026-03-30

---

## Summary

| Route Group | Pages | Purpose |
|---|---|---|
| **(admin)** | 29 | Admin panel — analytics, CMS, moderation, user management |
| **(auth)** | 14 | Authentication flows — login, register, MFA, password reset |
| **(main)** | 83 | Public pages — homepage, blog, services, tools, directories |
| **(protected)** | 176 | Authenticated — role dashboards, messaging, settings |
| **Root-level** | 7 | Utility — error states, maintenance, offline |
| **API routes** | 209 | Backend endpoints |

---

## (auth) — 14 Pages

| Route | Page |
|---|---|
| `/login` | Login |
| `/register` | Register |
| `/register/role-select` | Role selection |
| `/register/onboarding/[role]` | Role-specific onboarding |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |
| `/verify-email` | Email verification |
| `/verify-email/confirmed` | Email confirmed |
| `/two-factor` | Two-factor authentication |
| `/two-factor-setup` | Two-factor setup |
| `/welcome` | Welcome page |
| `/account-locked` | Account locked |
| `/account-suspended` | Account suspended |
| `/account-deletion-confirm` | Account deletion confirmation |

---

## (main) — 83 Pages

### Homepage & Company

| Route | Page |
|---|---|
| `/` | Homepage |
| `/about` | About us |
| `/careers` | Careers |
| `/contact` | Contact |
| `/how-it-works` | How it works |
| `/investors` | Investors |
| `/jobs` | Jobs |
| `/partners` | Partners |
| `/press` | Press |
| `/pricing` | Pricing |
| `/sitemap-page` | HTML sitemap |

### Properties & Search

| Route | Page |
|---|---|
| `/search` | Property search |
| `/properties/[slug]` | Property detail |
| `/compare` | Property comparison |
| `/valuation` | Property valuation |

### Areas & Location Data

| Route | Page |
|---|---|
| `/areas` | Area guides index |
| `/areas/[city]` | City area guide |
| `/areas/[city]/[area]` | Specific area guide |
| `/areas/[city]/stats` | City statistics |

### Sold Prices & Market Data

| Route | Page |
|---|---|
| `/sold-prices` | Sold prices search |
| `/sold-prices/[area]` | Area sold prices |
| `/sold-prices/[area]/[slug]` | Individual sold price detail |
| `/market-trends` | Market trends |

### Marketplace & Reviews

| Route | Page |
|---|---|
| `/marketplace` | Marketplace index |
| `/marketplace/[slug]` | Marketplace listing |
| `/reviews` | Reviews landing |
| `/post-a-job` | Post a job |
| `/reference/[token]` | Reference submission |

### Professional Directories

| Route | Page |
|---|---|
| `/agents` | Estate agents directory |
| `/agents/[slug]` | Agent profile |
| `/architects` | Architects directory |
| `/architects/[slug]` | Architect profile |
| `/surveyors` | Surveyors directory |
| `/surveyors/[slug]` | Surveyor profile |
| `/conveyancers` | Conveyancers directory |
| `/conveyancers/[slug]` | Conveyancer profile |
| `/mortgage-brokers` | Mortgage brokers directory |
| `/mortgage-brokers/[slug]` | Mortgage broker profile |

### Services

| Route | Page |
|---|---|
| `/services` | Services index |
| `/services/[category]` | Service category |
| `/services/[category]/[slug]` | Service provider profile |
| `/services/cleaning` | Cleaning services |
| `/services/electrical` | Electrical services |
| `/services/gardening` | Gardening services |
| `/services/moving` | Moving services |
| `/services/plumbing` | Plumbing services |

### Financial Tools & Calculators

| Route | Page |
|---|---|
| `/tools/mortgage-calculator` | Mortgage calculator |
| `/tools/stamp-duty-calculator` | Stamp duty calculator |
| `/tools/rental-yield-calculator` | Rental yield calculator |
| `/tools/affordability-calculator` | Affordability calculator |
| `/tools/buy-vs-rent` | Buy vs rent comparison |
| `/tools/equity-calculator` | Equity calculator |
| `/tools/investment-calculator` | Investment calculator |
| `/tools/ltv-calculator` | Loan-to-value calculator |
| `/tools/moving-cost-calculator` | Moving cost calculator |
| `/tools/overpayment-calculator` | Overpayment calculator |

### Blog & Help

| Route | Page |
|---|---|
| `/blog` | Blog index |
| `/blog/[slug]` | Blog post |
| `/blog/category/[slug]` | Blog category |
| `/help` | Help centre |
| `/help/[slug]` | Help article |
| `/help/contact` | Help contact |

### Legal Pages

| Route | Page |
|---|---|
| `/legal` | Legal index |
| `/legal/terms` | Terms of service |
| `/legal/privacy` | Privacy policy |
| `/legal/cookies` | Cookie policy |
| `/legal/accessibility` | Accessibility statement |
| `/legal/complaints` | Complaints procedure |
| `/legal/anti-money-laundering` | AML policy |
| `/legal/data-processing` | Data processing agreement |
| `/legal/disclaimer` | Disclaimer |
| `/legal/dpa` | DPA |
| `/legal/fair-housing` | Fair housing policy |
| `/legal/gdpr-rights` | GDPR rights |
| `/legal/modern-slavery` | Modern slavery statement |
| `/legal/professional-standards` | Professional standards |
| `/legal/refund-policy` | Refund policy |
| `/legal/regulatory` | Regulatory information |
| `/legal/third-party-services` | Third-party services |

---

## (protected) — 176 Pages

### Main Dashboard

| Route | Page |
|---|---|
| `/dashboard` | Dashboard hub |
| `/dashboard/[role]` | Role-specific dashboard home |
| `/inbox` | Messaging inbox |
| `/inbox/[conversationId]` | Conversation thread |
| `/notifications` | Notifications |
| `/profile` | User profile |
| `/profile/settings` | Profile settings |

### Settings (5 pages)

| Route | Page |
|---|---|
| `/settings/account` | Account settings |
| `/settings/notifications` | Notification preferences |
| `/settings/preferences` | Language & accessibility preferences |
| `/settings/privacy` | Privacy settings |
| `/settings/security` | Security & connected accounts |

### Shared Dashboard Features (per role)

| Route | Page |
|---|---|
| `/dashboard/[role]/ai-match` | AI property/service matching |
| `/dashboard/[role]/referrals` | Referral programme |
| `/dashboard/[role]/billing` | Billing overview |
| `/dashboard/[role]/billing/checkout` | Checkout |
| `/dashboard/[role]/billing/payment-methods` | Payment methods |
| `/dashboard/[role]/billing/invoices` | Invoices |
| `/dashboard/[role]/billing/refund` | Refund request |
| `/dashboard/[role]/billing/subscription` | Subscription management |
| `/dashboard/[role]/documents` | Documents |
| `/dashboard/[role]/searches` | Saved searches |
| `/dashboard/[role]/services` | Services |
| `/dashboard/[role]/calculators` | Calculators |
| `/dashboard/[role]/moving` | Moving checklist |

### Buyer/Renter Pages

| Route | Page |
|---|---|
| `/dashboard/[role]/saved` | Saved properties |
| `/dashboard/[role]/applications` | Rental applications |
| `/dashboard/[role]/applications/apply/[listingId]` | Apply for listing |
| `/dashboard/[role]/offers` | Offers |
| `/dashboard/[role]/viewings` | Viewings |
| `/dashboard/[role]/viewings/book` | Book a viewing |
| `/dashboard/[role]/viewings/[id]/reschedule` | Reschedule viewing |
| `/dashboard/[role]/tenancy` | Tenancy management |
| `/dashboard/[role]/listings` | Listings |
| `/dashboard/[role]/listings/[id]` | Listing detail |
| `/dashboard/[role]/listings/[id]/analytics` | Listing analytics |
| `/dashboard/[role]/listings/new` | New listing |

### Seller Dashboard (15 pages)

| Route | Page |
|---|---|
| `/dashboard/seller` | Seller dashboard home |
| `/dashboard/seller/agents` | Find agents |
| `/dashboard/seller/agents/[id]` | Agent detail |
| `/dashboard/seller/agents/compare` | Compare agents |
| `/dashboard/seller/analytics` | Seller analytics |
| `/dashboard/seller/enquiries` | Enquiries |
| `/dashboard/seller/listings` | Seller listings |
| `/dashboard/seller/listings/[id]/analytics` | Listing analytics |
| `/dashboard/seller/listings/[id]/edit` | Edit listing |
| `/dashboard/seller/listings/create` | Create listing |
| `/dashboard/seller/offers` | Offers received |
| `/dashboard/seller/sale-progress/[id]` | Sale progress tracker |
| `/dashboard/seller/valuation` | Valuation tool |
| `/dashboard/seller/viewings` | Viewings |

### Agent Dashboard (27 pages)

| Route | Page |
|---|---|
| `/dashboard/agent` | Agent dashboard home |
| `/dashboard/agent/analytics/behaviour` | Behavioural analytics |
| `/dashboard/agent/analytics/branch` | Branch analytics |
| `/dashboard/agent/analytics/competitors` | Competitor analytics |
| `/dashboard/agent/billing` | Agent billing |
| `/dashboard/agent/boost` | Listing boost |
| `/dashboard/agent/crm` | CRM |
| `/dashboard/agent/crm/[id]` | CRM contact detail |
| `/dashboard/agent/feeds` | Property feeds/integrations |
| `/dashboard/agent/leads` | Leads |
| `/dashboard/agent/leads/[id]` | Lead detail |
| `/dashboard/agent/listings` | Agent listings |
| `/dashboard/agent/listings/[id]/analytics` | Listing analytics |
| `/dashboard/agent/listings/archived` | Archived listings |
| `/dashboard/agent/listings/sold` | Sold listings |
| `/dashboard/agent/listings/create` | Create listing |
| `/dashboard/agent/offers` | Offers |
| `/dashboard/agent/offers/[id]` | Offer detail |
| `/dashboard/agent/profile` | Agent profile |
| `/dashboard/agent/profile/branding` | Brand settings |
| `/dashboard/agent/revenue` | Revenue |
| `/dashboard/agent/reviews` | Reviews |
| `/dashboard/agent/reviews/[id]/respond` | Respond to review |
| `/dashboard/agent/sales/appraisal` | Appraisal tool |
| `/dashboard/agent/sales/reports` | Sales reports |
| `/dashboard/agent/team` | Team management |
| `/dashboard/agent/team/branches` | Branch management |
| `/dashboard/agent/team/roles` | Role management |
| `/dashboard/agent/viewings` | Viewings |
| `/dashboard/agent/viewings/feedback` | Viewing feedback |

### Broker Dashboard (11 pages)

| Route | Page |
|---|---|
| `/dashboard/broker` | Broker dashboard home |
| `/dashboard/broker/analytics` | Broker analytics |
| `/dashboard/broker/billing` | Broker billing |
| `/dashboard/broker/calculators` | Mortgage calculators |
| `/dashboard/broker/fca-verification` | FCA verification |
| `/dashboard/broker/leads` | Leads |
| `/dashboard/broker/pipeline` | Deal pipeline |
| `/dashboard/broker/products` | Mortgage products |
| `/dashboard/broker/profile` | Broker profile |
| `/dashboard/broker/reviews` | Reviews |

### Landlord Dashboard (35+ pages)

| Route | Page |
|---|---|
| `/dashboard/landlord` | Landlord dashboard home |
| `/dashboard/landlord/analytics` | Landlord analytics |
| `/dashboard/landlord/compliance-guide` | Compliance guide |
| `/dashboard/landlord/compliance/matrix` | Compliance matrix |
| `/dashboard/landlord/compliance/alerts` | Compliance alerts |
| `/dashboard/landlord/compliance/upload` | Upload compliance docs |
| `/dashboard/landlord/deposits` | Deposit management |
| `/dashboard/landlord/finance/expenses` | Expenses |
| `/dashboard/landlord/finance/report` | Financial reports |
| `/dashboard/landlord/finance/tax` | Tax reporting |
| `/dashboard/landlord/find-agent` | Find letting agent |
| `/dashboard/landlord/find-tradespeople` | Find tradespeople |
| `/dashboard/landlord/insurance` | Insurance |
| `/dashboard/landlord/inventory/check-in` | Inventory check-in |
| `/dashboard/landlord/inventory/check-out` | Inventory check-out |
| `/dashboard/landlord/legal/notices` | Legal notices |
| `/dashboard/landlord/maintenance` | Maintenance overview |
| `/dashboard/landlord/maintenance/[id]` | Maintenance request detail |
| `/dashboard/landlord/maintenance/[id]/assign` | Assign tradesperson |
| `/dashboard/landlord/properties` | Properties list |
| `/dashboard/landlord/properties/[id]` | Property detail |
| `/dashboard/landlord/properties/[id]/documents` | Property documents |
| `/dashboard/landlord/properties/[id]/financials` | Property financials |
| `/dashboard/landlord/properties/[id]/listing` | Property listing |
| `/dashboard/landlord/properties/[id]/maintenance` | Property maintenance |
| `/dashboard/landlord/properties/[id]/overview` | Property overview |
| `/dashboard/landlord/properties/[id]/tenancies` | Property tenancies |
| `/dashboard/landlord/rent` | Rent overview |
| `/dashboard/landlord/rent/[propertyId]` | Rent by property |
| `/dashboard/landlord/tenants` | Tenants |
| `/dashboard/landlord/tenants/[applicationId]` | Tenant application |
| `/dashboard/landlord/tenants/decision` | Tenant decision |
| `/dashboard/landlord/tenants/agreement` | Tenancy agreement |
| `/dashboard/landlord/tools/yield-calculator` | Yield calculator |

### Provider/Tradesperson Dashboard (45+ pages)

| Route | Page |
|---|---|
| `/dashboard/provider` | Provider dashboard home |
| `/dashboard/provider/analytics` | Provider analytics |
| `/dashboard/provider/availability` | Availability calendar |
| `/dashboard/provider/billing` | Provider billing |
| `/dashboard/provider/boost` | Profile boost |
| `/dashboard/provider/documents` | Documents |
| `/dashboard/provider/field/jobs` | Field jobs |
| `/dashboard/provider/field/payments` | Field payments |
| `/dashboard/provider/jobs` | Jobs overview |
| `/dashboard/provider/jobs/[id]` | Job detail |
| `/dashboard/provider/jobs/[id]/certificates` | Job certificates |
| `/dashboard/provider/jobs/active` | Active jobs |
| `/dashboard/provider/jobs/completed` | Completed jobs |
| `/dashboard/provider/jobs/leads` | Job leads |
| `/dashboard/provider/payments` | Payments overview |
| `/dashboard/provider/payments/[id]` | Payment detail |
| `/dashboard/provider/portfolio` | Portfolio |
| `/dashboard/provider/profile` | Provider profile |
| `/dashboard/provider/quotes` | Quotes overview |
| `/dashboard/provider/quotes/[id]/invoice` | Quote invoice |
| `/dashboard/provider/quotes/builder` | Quote builder |
| `/dashboard/provider/referrals` | Referrals |
| `/dashboard/provider/reviews` | Reviews |
| `/dashboard/provider/reviews/[id]/respond` | Respond to review |
| `/dashboard/provider/services` | Services offered |
| `/dashboard/provider/services/areas` | Service areas |
| `/dashboard/provider/verification` | Verification overview |
| `/dashboard/provider/verification/badges` | Verification badges |
| `/dashboard/provider/verification/client-references` | Client references |
| `/dashboard/provider/verification/credentials` | Credentials |
| `/dashboard/provider/verification/peer-references` | Peer references |

### General Protected Routes

| Route | Page |
|---|---|
| `/dashboard/rfqs` | RFQ list |
| `/dashboard/rfqs/[id]` | RFQ detail |
| `/dashboard/rfqs/create` | Create RFQ |
| `/dashboard/bookings` | Bookings |
| `/dashboard/bookings/[id]` | Booking detail |
| `/dashboard/reviews` | Reviews |
| `/milestones/transaction/[id]` | Transaction milestone tracker |
| `/milestones/job/[bookingId]` | Job milestone tracker |

---

## (admin) — 29 Pages

| Route | Page |
|---|---|
| `/admin` | Admin dashboard home |
| `/admin/analytics/behaviour` | User behaviour analytics |
| `/admin/analytics/platform` | Platform analytics |
| `/admin/analytics/revenue` | Revenue analytics |
| `/admin/analytics/search` | Search analytics |
| `/admin/api-usage` | API usage monitoring |
| `/admin/audit-log` | Audit log |
| `/admin/cms/blog` | Blog CMS |
| `/admin/cms/blog/[id]` | Edit blog post |
| `/admin/cms/help` | Help centre CMS |
| `/admin/cms/help/[id]` | Edit help article |
| `/admin/cms/landing` | Landing page CMS |
| `/admin/cms/landing/[id]` | Edit landing page |
| `/admin/email-campaigns` | Email campaigns |
| `/admin/feature-flags` | Feature flags |
| `/admin/fraud` | Fraud detection |
| `/admin/gdpr` | GDPR management |
| `/admin/moderation` | Content moderation |
| `/admin/promo-codes` | Promo codes |
| `/admin/reported` | Reported content |
| `/admin/reviews` | Review moderation |
| `/admin/roles` | Role management |
| `/admin/seo` | SEO management |
| `/admin/subscriptions` | Subscription management |
| `/admin/system-health` | System health |
| `/admin/team` | Admin team |
| `/admin/users` | User management |
| `/admin/users/[id]` | User detail |
| `/admin/verifications` | Verification queue |

---

## Root-Level Utility Pages — 7 Pages

| Route | Page |
|---|---|
| `/forbidden` | 403 Forbidden |
| `/maintenance` | 503 Maintenance |
| `/offline` | Offline fallback |
| `/overview` | Site overview |
| `/rate-limited` | 429 Rate limited |
| `/session-expired` | Session expired |
| `/unsubscribe` | Email unsubscribe |

---

## API Routes — 209 Endpoints

### Admin APIs (24 routes)

| Route | Method |
|---|---|
| `/api/admin/audit-log` | Audit logs |
| `/api/admin/campaigns` | Email campaigns |
| `/api/admin/cms/blog` | Blog CRUD |
| `/api/admin/cms/blog/[id]` | Blog item |
| `/api/admin/cms/help` | Help CRUD |
| `/api/admin/cms/help/[id]` | Help item |
| `/api/admin/cms/landing` | Landing page CRUD |
| `/api/admin/cms/landing/[id]` | Landing page item |
| `/api/admin/feature-flags` | Feature flags |
| `/api/admin/gdpr` | GDPR requests |
| `/api/admin/listings/approve` | Listing approval |
| `/api/admin/promo-codes` | Promo codes |
| `/api/admin/reports` | Reports |
| `/api/admin/roles` | Roles |
| `/api/admin/subscriptions` | Subscriptions |
| `/api/admin/team` | Team management |
| `/api/admin/users` | User list |
| `/api/admin/users/[id]` | User detail |
| `/api/admin/users/[id]/ban` | Ban user |
| `/api/admin/users/[id]/impersonate` | Impersonate user |
| `/api/admin/users/[id]/roles` | User roles |
| `/api/admin/users/[id]/verify` | Verify user |
| `/api/admin/verifications` | Verification queue |
| `/api/admin/verifications/[id]` | Verification item |

### Agent APIs (19 routes)

| Route | Method |
|---|---|
| `/api/agent/analytics/behaviour` | Behaviour analytics |
| `/api/agent/analytics/branch` | Branch analytics |
| `/api/agent/analytics/competitors` | Competitor analytics |
| `/api/agent/billing` | Agent billing |
| `/api/agent/branches` | Branch management |
| `/api/agent/crm` | CRM contacts |
| `/api/agent/crm/[id]` | CRM contact |
| `/api/agent/dashboard` | Dashboard data |
| `/api/agent/feeds` | Property feeds |
| `/api/agent/leads` | Leads |
| `/api/agent/leads/[id]` | Lead detail |
| `/api/agent/listings` | Agent listings |
| `/api/agent/offers` | Agent offers |
| `/api/agent/offers/[id]` | Offer detail |
| `/api/agent/reports` | Reports |
| `/api/agent/reviews` | Reviews |
| `/api/agent/sales/appraisal` | Appraisal |
| `/api/agent/team` | Team |
| `/api/agent/viewings` | Viewings |

### AI APIs (3 routes)

| Route | Method |
|---|---|
| `/api/ai-match` | AI matching |
| `/api/ai/generate-description` | AI description generation |
| `/api/ai/quote-draft` | AI quote drafting |

### Billing & Payments (7 routes)

| Route | Method |
|---|---|
| `/api/billing/checkout` | Checkout session |
| `/api/billing/invoices` | Invoice list |
| `/api/billing/methods` | Payment methods |
| `/api/billing/plans` | Subscription plans |
| `/api/billing/proration` | Proration preview |
| `/api/billing/refund` | Refund request |
| `/api/billing/sessions` | Billing sessions |

### Listings & Properties (16 routes)

| Route | Method |
|---|---|
| `/api/listings` | Listings CRUD |
| `/api/listings/[id]` | Listing detail |
| `/api/listings/[id]/media` | Listing media |
| `/api/properties/[id]` | Property detail |
| `/api/properties/[id]/book-viewing` | Book viewing |
| `/api/properties/[id]/contact` | Contact agent |
| `/api/properties/[id]/documents` | Property documents |
| `/api/properties/[id]/financials` | Property financials |
| `/api/properties/[id]/maintenance` | Property maintenance |
| `/api/properties/[id]/report` | Property report |
| `/api/properties/[id]/save` | Save property |
| `/api/properties/[id]/tenancies` | Property tenancies |
| `/api/properties/[id]/viewing-slots` | Viewing slots |
| `/api/saved/properties` | Saved properties |
| `/api/saved/searches` | Saved searches |
| `/api/search` | Property search |
| `/api/search/instant` | Instant search |

### Landlord APIs (17 routes)

| Route | Method |
|---|---|
| `/api/landlord/compliance` | Compliance status |
| `/api/landlord/compliance/alerts` | Compliance alerts |
| `/api/landlord/compliance/upload` | Upload compliance docs |
| `/api/landlord/deposits` | Deposits |
| `/api/landlord/finance/expenses` | Expenses |
| `/api/landlord/finance/report` | Financial reports |
| `/api/landlord/finance/tax` | Tax data |
| `/api/landlord/inventory` | Inventory |
| `/api/landlord/maintenance` | Maintenance requests |
| `/api/landlord/maintenance/[id]` | Maintenance detail |
| `/api/landlord/maintenance/[id]/assign` | Assign tradesperson |
| `/api/landlord/properties` | Properties |
| `/api/landlord/properties/[id]` | Property detail |
| `/api/landlord/rent` | Rent overview |
| `/api/landlord/rent/[propertyId]` | Rent by property |
| `/api/landlord/rent/batch-reminders` | Batch reminders |
| `/api/landlord/tenants` | Tenants |

### Provider APIs (20+ routes)

| Route | Method |
|---|---|
| `/api/service-provider/availability` | Availability |
| `/api/service-provider/boost` | Boost profile |
| `/api/service-provider/certificates` | Certificates |
| `/api/service-provider/documents` | Documents |
| `/api/service-provider/invoices` | Invoices |
| `/api/service-provider/jobs` | Jobs |
| `/api/service-provider/jobs/[id]` | Job detail |
| `/api/service-provider/payments` | Payments |
| `/api/service-provider/payments/[id]` | Payment detail |
| `/api/service-provider/portfolio` | Portfolio |
| `/api/service-provider/portfolio/[id]` | Portfolio item |
| `/api/service-provider/portfolio/reorder` | Reorder portfolio |
| `/api/service-provider/profile` | Profile |
| `/api/service-provider/quotes` | Quotes |
| `/api/service-provider/quotes/[id]` | Quote detail |
| `/api/service-provider/quotes/[id]/accept` | Accept quote |
| `/api/service-provider/references` | References |
| `/api/service-provider/references/[id]/cancel` | Cancel reference |
| `/api/service-provider/references/[id]/resend` | Resend reference |
| `/api/service-provider/reviews` | Reviews |
| `/api/service-provider/service-areas` | Service areas |
| `/api/service-provider/services` | Services |

### Seller APIs (8 routes)

| Route | Method |
|---|---|
| `/api/seller/agents` | Find agents |
| `/api/seller/describe` | AI description |
| `/api/seller/listings` | Seller listings |
| `/api/seller/offers` | Offers |
| `/api/seller/sale-progress` | Sale progress |
| `/api/seller/valuation` | Valuation |
| `/api/seller/viewings` | Viewings |

### Messaging & Notifications (7 routes)

| Route | Method |
|---|---|
| `/api/messages` | Messages |
| `/api/messages/conversations` | Conversations |
| `/api/notifications` | Notifications |
| `/api/notifications/preferences` | Notification preferences |
| `/api/notifications/read` | Mark as read |
| `/api/contact` | Contact form |
| `/api/unsubscribe` | Email unsubscribe |

### Settings APIs (15 routes)

| Route | Method |
|---|---|
| `/api/settings/change-email` | Change email |
| `/api/settings/change-password` | Change password |
| `/api/settings/connected` | Connected accounts |
| `/api/settings/login-history` | Login history |
| `/api/settings/mfa/enroll` | MFA enroll |
| `/api/settings/mfa/verify` | MFA verify |
| `/api/settings/mfa/unenroll` | MFA unenroll |
| `/api/settings/mfa/backup-codes` | MFA backup codes |
| `/api/settings/notifications` | Notification settings |
| `/api/settings/preferences` | Preferences |
| `/api/settings/privacy` | Privacy settings |
| `/api/settings/profile` | Profile |
| `/api/settings/profile/avatar` | Avatar upload |
| `/api/settings/reauth` | Re-authentication |
| `/api/settings/sessions` | Active sessions |

### Other APIs

| Route | Method |
|---|---|
| `/api/analytics/event` | Analytics event tracking |
| `/api/attachments` | File attachments |
| `/api/bookings` | Bookings CRUD |
| `/api/bookings/[id]` | Booking detail |
| `/api/bookings/[id]/status` | Booking status |
| `/api/documents` | Documents |
| `/api/documents/[id]` | Document detail |
| `/api/email/digest` | Email digest |
| `/api/geocode` | Geocoding |
| `/api/moving-checklist` | Moving checklist |
| `/api/moving-checklist/[id]` | Checklist item |
| `/api/offers` | Offers |
| `/api/offers/[id]` | Offer detail |
| `/api/offers/listing` | Offers by listing |
| `/api/providers/[slug]` | Provider profile |
| `/api/providers/compare` | Compare providers |
| `/api/providers/nearby` | Nearby providers |
| `/api/providers/search` | Provider search |
| `/api/quotes` | Quotes |
| `/api/quotes/[id]` | Quote detail |
| `/api/referrals/v2` | Referrals |
| `/api/referrals/attribute` | Referral attribution |
| `/api/reviews` | Reviews |
| `/api/reviews/aggregate` | Review aggregation |
| `/api/reviews/[id]/helpful` | Mark helpful |
| `/api/reviews/[id]/flag` | Flag review |
| `/api/reviews/[id]/edit` | Edit review |
| `/api/reviews/[id]/respond` | Respond to review |
| `/api/reviews/moderation` | Review moderation |
| `/api/rfqs` | RFQ list |
| `/api/rfqs/[id]` | RFQ detail |
| `/api/rfqs/create` | Create RFQ |
| `/api/sold-prices/search` | Sold prices search |
| `/api/tenancies` | Tenancies |
| `/api/viewings` | Viewings |
| `/api/viewings/book` | Book viewing |
| `/api/viewings/slots` | Viewing slots |
| `/api/webhooks/stripe` | Stripe webhook |
| `/auth/callback` | Auth callback |
