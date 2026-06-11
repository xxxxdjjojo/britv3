# Britestate API Reference

Complete list of all APIs required to run the platform at 100%.

---

## 1. Authentication & User Management

### 1.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register with email/password, role selection, GDPR consent |
| POST | `/api/auth/login` | Email/password login, returns JWT (access + refresh) |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/google` | Google OAuth sign-in |
| POST | `/api/auth/magic-link` | Send magic link email |
| POST | `/api/auth/magic-link/verify` | Verify magic link token |
| POST | `/api/auth/mfa/enable` | Enable TOTP or SMS-based 2FA |
| POST | `/api/auth/mfa/verify` | Verify 2FA code during login |
| POST | `/api/auth/mfa/disable` | Disable 2FA |
| POST | `/api/auth/password/reset` | Request password reset email |
| POST | `/api/auth/password/update` | Set new password with reset token |
| GET | `/api/auth/session` | Get current session and user info |

### 1.2 User Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update current user profile |
| DELETE | `/api/users/me` | Delete account (GDPR right to deletion) |
| GET | `/api/users/me/data-export` | Export all user data as JSON (GDPR) |
| GET | `/api/users/:id` | Get public user profile |

### 1.3 Roles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me/roles` | List user's active roles |
| POST | `/api/users/me/roles` | Add a new role to user |
| PATCH | `/api/users/me/roles/active` | Switch active role |
| DELETE | `/api/users/me/roles/:role` | Remove a role |

### 1.4 Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verification/email/send` | Send email verification |
| POST | `/api/verification/email/verify` | Confirm email verification |
| POST | `/api/verification/phone/send` | Send phone verification SMS |
| POST | `/api/verification/phone/verify` | Confirm phone verification |
| POST | `/api/verification/identity` | Upload ID documents for verification |
| GET | `/api/verification/status` | Get current verification level |
| POST | `/api/verification/provider/insurance` | Upload insurance certificate |
| POST | `/api/verification/provider/qualifications` | Upload qualification documents |
| POST | `/api/verification/provider/business` | Submit Companies House details |
| GET | `/api/verification/provider/status` | Get provider verification pipeline status |

### 1.5 GDPR & Consent
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/consent` | Get current consent preferences |
| PATCH | `/api/consent` | Update consent preferences (marketing, analytics, third-party) |
| GET | `/api/consent/audit` | Get consent change audit trail |

---

## 2. Property Search & Discovery

### 2.1 Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties/search` | Search with filters (location, type, price, beds, baths, amenities, EPC, etc.) |
| GET | `/api/properties/search/advanced` | Advanced filters (commute time, school catchment, crime, flood risk, planning) |
| GET | `/api/properties/search/map` | Map-based search with bounding box / polygon coordinates |
| POST | `/api/properties/search/semantic` | AI semantic search with natural language query |
| GET | `/api/properties/search/suggestions` | Search autocomplete / suggestions |

### 2.2 Saved Searches & Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/saved-searches` | List user's saved searches |
| POST | `/api/saved-searches` | Save a search criteria |
| PATCH | `/api/saved-searches/:id` | Update saved search criteria or alert settings |
| DELETE | `/api/saved-searches/:id` | Delete a saved search |
| PATCH | `/api/saved-searches/:id/notifications` | Configure alert frequency (instant, daily, weekly, SMS) |

### 2.3 Saved Properties (Shortlist)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/saved-properties` | List user's saved/shortlisted properties |
| POST | `/api/saved-properties` | Save a property to shortlist |
| DELETE | `/api/saved-properties/:propertyId` | Remove property from shortlist |
| POST | `/api/saved-properties/compare` | Compare multiple saved properties side-by-side |

### 2.4 Area Data (External Integrations)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/areas/:postcode/schools` | Get schools in catchment area |
| GET | `/api/areas/:postcode/crime` | Get crime statistics |
| GET | `/api/areas/:postcode/transport` | Get transport links and commute times |
| GET | `/api/areas/:postcode/flood-risk` | Get flood risk data |
| — | ~~`/api/areas/:postcode/planning`~~ | Superseded — planning applications are server-rendered on the property detail page via `src/services/properties/planit-service.ts` (PlanIt API, lat/lng radius search, 24h Redis cache) |
| GET | `/api/areas/:postcode/sold-prices` | Get recent sold prices in area |

---

## 3. Property Listings

### 3.1 Listing CRUD
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | List properties (public, paginated) |
| GET | `/api/properties/:id` | Get single property details |
| POST | `/api/properties` | Create new listing (agent/seller/landlord) |
| PATCH | `/api/properties/:id` | Update listing details |
| DELETE | `/api/properties/:id` | Delete/archive listing |
| PATCH | `/api/properties/:id/status` | Change listing status (draft, live, under offer, sold, let) |

### 3.2 Listing Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/properties/:id/media` | Upload photos (up to 30), floor plans, videos |
| DELETE | `/api/properties/:id/media/:mediaId` | Delete a media item |
| PATCH | `/api/properties/:id/media/reorder` | Reorder media items |
| POST | `/api/properties/:id/virtual-tour` | Embed 360 virtual tour URL |

### 3.3 Listing Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties/:id/analytics` | Get listing performance (views, saves, enquiries) |
| GET | `/api/properties/:id/analytics/photos` | Best performing photos |
| GET | `/api/properties/:id/price-history` | Get price change history |

### 3.4 AI Content Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/properties/:id/generate-description` | AI-generate listing description (tone: professional/friendly/luxury) |
| POST | `/api/properties/:id/generate-seo` | AI-generate SEO meta description |
| POST | `/api/properties/:id/generate-highlights` | AI-extract key highlights from features |

---

## 4. Viewings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/viewings` | List user's viewings (upcoming/past) |
| POST | `/api/viewings` | Request a viewing for a property |
| PATCH | `/api/viewings/:id` | Confirm/reschedule/cancel viewing |
| POST | `/api/viewings/:id/feedback` | Submit post-viewing feedback |
| GET | `/api/viewings/calendar` | Get calendar view of all viewings |

---

## 5. Communication

### 5.1 Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List user's conversations |
| POST | `/api/conversations` | Create new conversation (direct or group) |
| GET | `/api/conversations/:id` | Get conversation details and messages |
| POST | `/api/conversations/:id/messages` | Send a message (text, file, image) |
| GET | `/api/conversations/:id/messages` | Get paginated message history |
| POST | `/api/conversations/:id/messages/search` | Search messages in conversation |
| PATCH | `/api/conversations/:id/read` | Mark conversation as read |
| GET | `/api/conversations/:id/participants` | List conversation participants |
| POST | `/api/conversations/:id/participants` | Add participant to group conversation |

### 5.2 Real-Time (Supabase Realtime / WebSocket)
| Channel | Event | Description |
|---------|-------|-------------|
| `conversation:{id}` | `new_message` | Real-time message delivery |
| `conversation:{id}` | `typing` | Typing indicator |
| `conversation:{id}` | `read_receipt` | Message read receipts |
| `presence:{userId}` | `online/offline` | User online/offline status |
| `notifications:{userId}` | `new` | Real-time notification delivery |
| `property:{id}` | `update` | Property listing updates |

### 5.3 Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List user's notifications (paginated) |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read |
| GET | `/api/notifications/unread-count` | Get unread notification count |
| GET | `/api/notifications/preferences` | Get notification preferences |
| PATCH | `/api/notifications/preferences` | Update preferences (per-channel, quiet hours, digest frequency) |
| POST | `/api/notifications/push/subscribe` | Subscribe to web push notifications |
| DELETE | `/api/notifications/push/unsubscribe` | Unsubscribe from push notifications |

---

## 6. Dashboards

### 6.1 Homebuyer Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/homebuyer/overview` | Overview stats (saved count, searches, matches, viewings) |
| GET | `/api/dashboard/homebuyer/recommendations` | AI property recommendations with match scores |
| GET | `/api/dashboard/homebuyer/activity` | Activity feed |

### 6.2 Renter Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/renter/overview` | Overview (saved rentals, applications, viewings) |
| GET | `/api/dashboard/renter/applications` | Application tracker |
| POST | `/api/dashboard/renter/applications` | Submit rental application |
| PATCH | `/api/dashboard/renter/applications/:id` | Update application |
| GET | `/api/dashboard/renter/tenancy` | Current tenancy details |
| GET | `/api/dashboard/renter/profile` | Rental profile (references, employment) |
| PATCH | `/api/dashboard/renter/profile` | Update rental profile |

### 6.3 Seller Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/seller/overview` | Listing performance, viewing requests, offers |
| GET | `/api/dashboard/seller/listings` | Seller's active/draft listings |

### 6.4 Landlord Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/landlord/overview` | Portfolio stats (properties, occupancy, income, actions) |
| GET | `/api/dashboard/landlord/portfolio` | Property cards with status, tenant info |
| GET | `/api/dashboard/landlord/financials` | Income/expense tracking, reports, tax summary |
| GET | `/api/dashboard/landlord/financials/export` | Export financial reports |

### 6.5 Agent Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/agent/overview` | Active listings, leads pipeline, viewings, revenue |
| GET | `/api/dashboard/agent/listings` | Agent's property portfolio with bulk actions |
| GET | `/api/dashboard/agent/analytics` | Performance metrics, commission tracking, market analysis |

### 6.6 Provider Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/provider/overview` | Verification status, active jobs, rating, earnings |
| GET | `/api/dashboard/provider/insights` | AI business insights, pricing suggestions |

---

## 7. Agent CRM (Leads & Clients)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List leads with filtering and stages |
| POST | `/api/leads` | Create a lead |
| PATCH | `/api/leads/:id` | Update lead (stage, notes, assignment) |
| DELETE | `/api/leads/:id` | Archive lead |
| GET | `/api/leads/:id/history` | Lead interaction history |
| POST | `/api/leads/:id/follow-up` | Schedule follow-up task |
| GET | `/api/clients` | List agent's clients (vendors/buyers) |
| POST | `/api/clients` | Add client |
| PATCH | `/api/clients/:id` | Update client details and notes |
| GET | `/api/agent/team` | List team members |
| POST | `/api/agent/team` | Add team member |
| PATCH | `/api/agent/team/:id` | Update member role/assignment |
| DELETE | `/api/agent/team/:id` | Remove team member |
| GET | `/api/agent/commission` | Commission tracking (pipeline, agreed, completed) |

---

## 8. Offers & Transactions

### 8.1 Offers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/offers` | List offers (sent/received) |
| POST | `/api/offers` | Submit offer (price, conditions, timeline) |
| PATCH | `/api/offers/:id` | Update offer (counter, accept, reject) |
| GET | `/api/offers/:id` | Get offer details with communication thread |
| POST | `/api/offers/:id/counter` | Submit counter-offer |
| POST | `/api/offers/:id/accept` | Accept offer, generate memorandum of sale |
| POST | `/api/offers/:id/reject` | Reject offer |

### 8.2 Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List user's transactions |
| GET | `/api/transactions/:id` | Get transaction details |
| GET | `/api/transactions/:id/timeline` | Get transaction timeline with milestones |
| PATCH | `/api/transactions/:id/timeline/:milestoneId` | Update milestone status/dates |
| GET | `/api/transactions/:id/chain` | Get chain visualization data |
| POST | `/api/transactions/:id/tasks` | Create task assignment |
| PATCH | `/api/transactions/:id/tasks/:taskId` | Update task status |

### 8.3 Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/:id/documents` | List transaction documents |
| POST | `/api/transactions/:id/documents` | Upload document (property info, survey, contract, etc.) |
| GET | `/api/transactions/:id/documents/:docId` | Download document |
| DELETE | `/api/transactions/:id/documents/:docId` | Delete document |
| GET | `/api/transactions/:id/documents/:docId/versions` | Get document version history |
| POST | `/api/transactions/:id/documents/:docId/share` | Share document with parties |
| POST | `/api/transactions/:id/documents/:docId/sign` | Request e-signature (HelloSign) |

---

## 9. Service Provider Marketplace

### 9.1 Provider Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | Browse/search providers by category, location, rating |
| GET | `/api/providers/:id` | Get provider profile (services, portfolio, certifications, coverage) |
| PATCH | `/api/providers/me` | Update own provider profile |
| GET | `/api/providers/categories` | List all 27+ service categories |
| GET | `/api/providers/:id/availability` | Get provider availability calendar |
| PATCH | `/api/providers/me/availability` | Update availability / time blocking |

### 9.2 RFQ (Request for Quote)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rfqs` | List RFQs (user's created or provider's matched) |
| POST | `/api/rfqs` | Create RFQ (category, requirements, budget, documents, deadline) |
| GET | `/api/rfqs/:id` | Get RFQ details |
| PATCH | `/api/rfqs/:id` | Update RFQ |
| DELETE | `/api/rfqs/:id` | Cancel RFQ |
| GET | `/api/rfqs/:id/matched-providers` | Get auto-matched providers for RFQ |

### 9.3 Quotes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quotes` | List quotes (sent or received) |
| POST | `/api/quotes` | Provider submits quote (itemized pricing, timeline, terms) |
| GET | `/api/quotes/:id` | Get quote details |
| PATCH | `/api/quotes/:id` | Update quote |
| POST | `/api/quotes/:id/accept` | User accepts quote |
| POST | `/api/quotes/:id/decline` | User declines quote |
| GET | `/api/rfqs/:id/quotes` | Compare all quotes for an RFQ |

### 9.4 Bookings & Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List bookings (upcoming, active, completed) |
| POST | `/api/bookings` | Create booking from accepted quote |
| PATCH | `/api/bookings/:id` | Reschedule/cancel booking |
| PATCH | `/api/bookings/:id/status` | Update job status (in-progress, complete) |
| GET | `/api/bookings/:id` | Get booking/job details |

### 9.5 Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/:id/reviews` | Get provider reviews |
| POST | `/api/reviews` | Submit review (rating, category ratings, text, photos) |
| POST | `/api/reviews/:id/respond` | Provider responds to review |
| POST | `/api/reviews/:id/report` | Report/flag a review |
| GET | `/api/reviews/:id` | Get review details |

### 9.6 Referrals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/me/referrals` | Get referral stats and rewards |
| POST | `/api/providers/me/referrals/invite` | Send referral invite |

---

## 10. Payments (Stripe Connect)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-intent` | Create Stripe payment intent |
| POST | `/api/payments/confirm` | Confirm payment |
| GET | `/api/payments` | List payment history |
| GET | `/api/payments/:id` | Get payment details |
| POST | `/api/payments/:id/refund` | Request refund |
| POST | `/api/payments/:id/dispute` | Open payment dispute |
| POST | `/api/payments/escrow/create` | Create escrow for large job |
| POST | `/api/payments/escrow/:id/release` | Release escrow payment |
| POST | `/api/payments/milestone` | Create milestone payment schedule |
| POST | `/api/payments/milestone/:id/release` | Release milestone payment |
| GET | `/api/payments/invoices` | List invoices |
| GET | `/api/payments/invoices/:id/pdf` | Download invoice PDF |
| POST | `/api/stripe/connect/onboard` | Onboard provider to Stripe Connect |
| GET | `/api/stripe/connect/status` | Get Stripe Connect account status |
| GET | `/api/stripe/connect/dashboard-link` | Get link to Stripe Express dashboard |

---

## 11. Landlord Tools

### 11.1 Portfolio Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/landlord/properties` | List portfolio properties |
| POST | `/api/landlord/properties` | Add property to portfolio |
| PATCH | `/api/landlord/properties/:id` | Update property details |
| DELETE | `/api/landlord/properties/:id` | Remove property from portfolio |

### 11.2 Tenant Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/landlord/tenants` | List all tenants |
| POST | `/api/landlord/tenants` | Add tenant to property |
| PATCH | `/api/landlord/tenants/:id` | Update tenant details |
| GET | `/api/landlord/tenants/:id/lease` | Get lease/tenancy agreement details |
| POST | `/api/landlord/tenants/screen` | Screen prospective tenant |
| POST | `/api/landlord/tenants/:id/notice` | Generate notice (templates) |

### 11.3 Rent Collection
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/landlord/rent` | Rent payment tracking (by property/tenant) |
| POST | `/api/landlord/rent/reminders` | Send rent reminders |
| GET | `/api/landlord/rent/history` | Payment history with arrears tracking |

### 11.4 Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/landlord/maintenance` | List maintenance requests (new/in-progress/complete) |
| POST | `/api/landlord/maintenance` | Create maintenance request |
| PATCH | `/api/landlord/maintenance/:id` | Update request status |
| POST | `/api/landlord/maintenance/:id/assign` | Assign contractor |
| GET | `/api/landlord/contractors` | List preferred contractors |
| POST | `/api/landlord/contractors` | Add preferred contractor |
| DELETE | `/api/landlord/contractors/:id` | Remove contractor |

### 11.5 Compliance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/landlord/compliance` | List compliance certificates (gas, electrical, EPC) |
| POST | `/api/landlord/compliance` | Upload/add certificate |
| PATCH | `/api/landlord/compliance/:id` | Update certificate details |
| GET | `/api/landlord/compliance/reminders` | Get upcoming renewal reminders |

### 11.6 Tenancy Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/landlord/templates` | List agreement/notice templates |
| POST | `/api/landlord/templates` | Create template |
| PATCH | `/api/landlord/templates/:id` | Update template |
| POST | `/api/landlord/templates/:id/generate` | Generate document from template |

---

## 12. Financial Tools

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calculators/mortgage` | Calculate mortgage payments and amortization |
| POST | `/api/calculators/stamp-duty` | Calculate stamp duty (standard, FTB, additional, non-resident, Wales/Scotland) |
| POST | `/api/calculators/total-cost` | Calculate total purchase costs |
| POST | `/api/calculators/investment` | Buy-to-let investment analysis (yield, ROI, cash-on-cash) |
| POST | `/api/calculators/capital-gains` | Estimate capital gains for sellers |
| POST | `/api/calculators/affordability` | Affordability check |

---

## 13. AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/search` | Semantic search with natural language (Claude + pgvector) |
| GET | `/api/ai/recommendations` | Get personalized property recommendations |
| POST | `/api/ai/match-score` | Calculate match score (0-100) with breakdown |
| POST | `/api/ai/valuation` | Automated Valuation Model (value, confidence, range) |
| POST | `/api/ai/generate/description` | Generate property description (tone options) |
| POST | `/api/ai/generate/seo` | Generate SEO meta description |
| POST | `/api/ai/generate/email-template` | Generate communication email template |
| POST | `/api/ai/generate/review-response` | Suggest review response for provider |
| POST | `/api/ai/generate/social-snippet` | Generate social media snippet |
| GET | `/api/ai/provider/insights` | AI business insights for provider |
| POST | `/api/ai/provider/pricing-suggestion` | AI pricing suggestion for provider |
| GET | `/api/ai/neighborhood/:postcode` | AI neighborhood insights |
| POST | `/api/ai/compare` | AI property comparison summary |
| POST | `/api/ai/search-refinement` | AI search refinement suggestions |

---

## 14. Admin Panel

### 14.1 User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Search/filter users |
| GET | `/api/admin/users/:id` | Get user details with activity history |
| PATCH | `/api/admin/users/:id` | Update user status, roles |
| POST | `/api/admin/users/:id/verify` | Override verification status |
| DELETE | `/api/admin/users/:id` | Suspend/ban user |

### 14.2 Content Moderation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/moderation/listings` | Listing review queue |
| PATCH | `/api/admin/moderation/listings/:id` | Approve/reject listing |
| GET | `/api/admin/moderation/reviews` | Review moderation queue |
| PATCH | `/api/admin/moderation/reviews/:id` | Approve/remove review |
| GET | `/api/admin/moderation/messages` | Flagged messages queue |
| GET | `/api/admin/moderation/reports` | User reports queue |
| PATCH | `/api/admin/moderation/reports/:id` | Resolve report |

### 14.3 Provider Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/verification/queue` | Verification queue |
| GET | `/api/admin/verification/:id` | Review verification documents |
| POST | `/api/admin/verification/:id/approve` | Approve verification |
| POST | `/api/admin/verification/:id/reject` | Reject verification with reason |

### 14.4 Support Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/tickets` | List support tickets |
| GET | `/api/admin/tickets/:id` | Get ticket details |
| PATCH | `/api/admin/tickets/:id` | Update ticket (priority, assignment, status) |
| POST | `/api/admin/tickets/:id/reply` | Reply to ticket |

### 14.5 Analytics & Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics/overview` | Platform metrics (users, revenue, performance) |
| GET | `/api/admin/analytics/users` | User growth charts |
| GET | `/api/admin/analytics/revenue` | Revenue tracking |
| GET | `/api/admin/analytics/health` | Health indicators |
| GET | `/api/admin/audit-log` | Audit trail (user/admin actions, data access) |
| GET | `/api/admin/audit-log/export` | Export audit log |

---

## 15. Webhooks (Incoming)

| Endpoint | Source | Description |
|----------|--------|-------------|
| POST | `/api/webhooks/stripe` | Stripe payment events (succeeded, failed, disputed, refunded) |
| POST | `/api/webhooks/stripe/connect` | Stripe Connect events (account updated, payout) |
| POST | `/api/webhooks/supabase` | Database trigger events |
| POST | `/api/webhooks/hellosign` | E-signature events (signed, declined, expired) |

---

## 16. File Storage (Supabase Storage)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/storage/upload` | Upload file (images, documents, certificates) |
| GET | `/api/storage/:bucket/:path` | Get signed URL for file download |
| DELETE | `/api/storage/:bucket/:path` | Delete file |
| POST | `/api/storage/upload/bulk` | Bulk upload (property photos) |

---

## 17. Support

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/support/tickets` | Create support ticket |
| GET | `/api/support/tickets` | List user's tickets |
| GET | `/api/support/tickets/:id` | Get ticket details |
| POST | `/api/support/tickets/:id/reply` | Reply to ticket |
| GET | `/api/support/faq` | Get FAQ content |

---

## Summary

| Category | API Count |
|----------|-----------|
| 1. Auth & Users | 28 |
| 2. Property Search | 16 |
| 3. Property Listings | 13 |
| 4. Viewings | 5 |
| 5. Communication | 17 |
| 6. Dashboards | 14 |
| 7. Agent CRM | 14 |
| 8. Offers & Transactions | 18 |
| 9. Marketplace | 22 |
| 10. Payments | 15 |
| 11. Landlord Tools | 22 |
| 12. Financial Tools | 6 |
| 13. AI Features | 14 |
| 14. Admin Panel | 20 |
| 15. Webhooks | 4 |
| 16. File Storage | 4 |
| 17. Support | 5 |
| **Total** | **237** |

### Third-Party API Integrations Required

| Service | Purpose | Integration Type |
|---------|---------|------------------|
| Supabase Auth | Authentication, JWT, sessions | SDK |
| Supabase DB | PostgreSQL with RLS | SDK |
| Supabase Realtime | WebSocket subscriptions | SDK |
| Supabase Storage | File storage | SDK |
| Stripe | Payment processing | API + Webhooks |
| Stripe Connect | Marketplace payments | API + OAuth |
| MapTiler / MapLibre | Vector maps | SDK + API |
| Anthropic Claude | AI features (search, descriptions, valuation) | API |
| pgvector | Embedding similarity search | PostgreSQL extension |
| Resend | Transactional email | API |
| HelloSign | E-signatures | API + Webhooks |
| Companies House | Business verification | API |
| Sentry | Error tracking | SDK |
| PostHog | Product analytics, feature flags | SDK |
| Upstash Redis | Rate limiting, caching | SDK |
| BullMQ | Background job processing | Library |
| Web Push API | Push notifications | Browser API |
