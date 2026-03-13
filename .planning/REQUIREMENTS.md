# Requirements: Britestate v3.1 — Buyer/Renter Dashboard

**Defined:** 2026-03-13
**Milestone:** v3.1
**Core Value:** Buyer and renter users can manage their entire property journey — viewings, offers, documents, and professional discovery — from a single FAANG-quality dashboard with real data, not mocks.

## v3.1 Requirements

### Foundation & Security (FOUND)

- [x] **FOUND-01**: DB migration creates 10 new tables (viewings, viewing_slots, offers, offer_status_history, user_documents, ai_match_preferences, ai_match_results, moving_checklist_items, referral_codes, referral_conversions) with RLS policies
- [x] **FOUND-02**: Role route authorization enforces active_role — buyers cannot navigate to /dashboard/landlord or /dashboard/agent routes
- [x] **FOUND-03**: All buyer dashboard API routes and Server Components call supabase.auth.getUser() server-side (defense-in-depth, not middleware-only auth)
- [x] **FOUND-04**: npm packages installed: react-day-picker@9, date-fns@4, tus-js-client@4, nanoid@5

### Dashboard Home & Discovery (DISC)

- [ ] **DISC-01**: User can see real stat cards on Dashboard Home: saved properties count, upcoming viewings, active offers, unread messages
- [ ] **DISC-02**: User can see an activity feed on Dashboard Home showing real events (price changes on saved properties, new matches, viewing confirmations)
- [ ] **DISC-03**: User can see recommended property listings based on their saved searches and preferences
- [ ] **DISC-04**: User can view Saved Properties in grid or list view, sort by date saved / price, and remove properties
- [ ] **DISC-05**: User can compare up to 3 saved properties side-by-side in a modal comparison table
- [ ] **DISC-06**: User can view Saved Searches, edit criteria, delete searches, and toggle alert frequency (instant/daily/weekly/off)
- [ ] **DISC-07**: User can configure Property Alert notification preferences (email + push) per saved search
- [ ] **DISC-08**: User can view in-app notification centre with read/unread status and mark-all-as-read

### Viewings (VIEW)

- [ ] **VIEW-01**: User can view all upcoming and past viewings in a calendar and list view
- [ ] **VIEW-02**: User can add a viewing to Google Calendar or Apple Calendar via .ics link
- [ ] **VIEW-03**: User can book a viewing by selecting a date/time slot from agent-published availability, choosing in-person or virtual, and receiving confirmation email
- [ ] **VIEW-04**: User can confirm, reschedule (select new slot), or cancel a viewing with reason
- [ ] **VIEW-05**: User receives email confirmation for booked, rescheduled, and cancelled viewings

### Offers (OFFR)

- [ ] **OFFR-01**: User can view all submitted offers with status badges, amounts, property thumbnails, and submission dates
- [ ] **OFFR-02**: User can submit an offer with amount, conditions, solicitor details, and optional AIP document attachment
- [ ] **OFFR-03**: User can track offer status through a 7-stage UK conveyancing pipeline: Offer Submitted → Solicitors Instructed → Searches → Survey → Mortgage Approved → Exchange → Completion
- [ ] **OFFR-04**: Offer status transitions are server-side enforced with audit trail in offer_status_history
- [ ] **OFFR-05**: User can withdraw a pending offer

### Communication & Documents (COMMS)

- [ ] **COMMS-01**: User can view Messages Inbox with conversation list, unread counts, and latest message previews
- [ ] **COMMS-02**: User can view and reply in a Message Conversation Thread with file attachments
- [ ] **COMMS-03**: User can upload documents (ID, proof of funds, AIP letter) to a private Supabase Storage bucket
- [ ] **COMMS-04**: Document uploads use TUS resumable protocol with progress indicator
- [ ] **COMMS-05**: Document previews use signed URLs (never public getPublicUrl) with 1-hour expiry
- [ ] **COMMS-06**: User can see document status (uploaded / verified / pending review)

### Tools & AI (TOOLS)

- [ ] **TOOLS-01**: User can view and check off items on a pre-populated UK moving checklist (20+ tasks) linked to their active offer stage
- [ ] **TOOLS-02**: User can edit AI Property Match preferences: location, budget range, bedrooms, must-haves, and lifestyle factors (commute destination, school priority, garden importance)
- [ ] **TOOLS-03**: User can view AI Property Match results ranked by match score with match reason tooltips
- [ ] **TOOLS-04**: AI Match results are cached in ai_match_results table for 24 hours (never calls Claude on every page load)
- [ ] **TOOLS-05**: AI Match falls back to heuristic scoring (preference field count matches) if pgvector embeddings are not available
- [ ] **TOOLS-06**: User can use Affordability Calculator (pure client-side): income × 4.5 stress-test, deposit %, LTV, estimated monthly payment

### Financial & Professional Browse (FIN)

- [ ] **FIN-01**: User can access Mortgage Comparison Tool via embedded Mojo/Habito widget with affordability calc values pre-filled as URL parameters
- [ ] **FIN-02**: User can browse Mortgage Brokers filtered from existing Epic 4 provider marketplace (category=mortgage_broker)
- [ ] **FIN-03**: User can browse Conveyancers / Solicitors filtered from existing Epic 4 provider marketplace (category=conveyancer)
- [ ] **FIN-04**: User can browse Surveyors filtered from existing Epic 4 provider marketplace (category=surveyor)

### Referral (REF)

- [ ] **REF-01**: User can generate a unique referral link with a nanoid-based code stored in referral_codes table
- [ ] **REF-02**: User can see their Referral Tracker showing: link, total signups, pending/converted status per referral
- [ ] **REF-03**: New user signups via referral link are recorded in referral_conversions table with referring user ID

## v3.2 Requirements (Deferred)

### Deferred features

- Real-time mortgage rate scraping — maintenance liability; v3.2 if needed
- Offer counter-proposal flow — agent dashboard feature, deferred
- Video viewing (WebRTC) — infrastructure scope, deferred
- Advanced AI match with full pgvector pipeline — deferred pending Epic 6 completion

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native iOS/Android app | Web-first, PWA covers mobile |
| Real mortgage rate API | Maintenance liability; white-label embed preferred |
| Solicitor/conveyancer actual booking | Complex legal workflow, v3.2+ |
| Offer negotiation back-and-forth thread | Agent dashboard feature, not buyer scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 8 | Complete |
| FOUND-02 | Phase 8 | Complete |
| FOUND-03 | Phase 8 | Complete |
| FOUND-04 | Phase 8 | Complete |
| DISC-01 | Phase 9 | Pending |
| DISC-02 | Phase 9 | Pending |
| DISC-03 | Phase 9 | Pending |
| DISC-04 | Phase 9 | Pending |
| DISC-05 | Phase 9 | Pending |
| DISC-06 | Phase 9 | Pending |
| DISC-07 | Phase 9 | Pending |
| DISC-08 | Phase 9 | Pending |
| VIEW-01 | Phase 9 | Pending |
| VIEW-02 | Phase 9 | Pending |
| VIEW-03 | Phase 10 | Pending |
| VIEW-04 | Phase 10 | Pending |
| VIEW-05 | Phase 10 | Pending |
| OFFR-01 | Phase 10 | Pending |
| OFFR-02 | Phase 10 | Pending |
| OFFR-03 | Phase 10 | Pending |
| OFFR-04 | Phase 10 | Pending |
| OFFR-05 | Phase 10 | Pending |
| COMMS-01 | Phase 9 | Pending |
| COMMS-02 | Phase 9 | Pending |
| COMMS-03 | Phase 10 | Pending |
| COMMS-04 | Phase 10 | Pending |
| COMMS-05 | Phase 10 | Pending |
| COMMS-06 | Phase 10 | Pending |
| TOOLS-01 | Phase 10 | Pending |
| TOOLS-02 | Phase 11 | Pending |
| TOOLS-03 | Phase 11 | Pending |
| TOOLS-04 | Phase 11 | Pending |
| TOOLS-05 | Phase 11 | Pending |
| TOOLS-06 | Phase 9 | Pending |
| FIN-01 | Phase 12 | Pending |
| FIN-02 | Phase 9 | Pending |
| FIN-03 | Phase 9 | Pending |
| FIN-04 | Phase 9 | Pending |
| REF-01 | Phase 12 | Pending |
| REF-02 | Phase 12 | Pending |
| REF-03 | Phase 12 | Pending |

**Coverage:**
- v3.1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 — phase assignments updated after roadmap creation (FIN-01 and REF-01/02/03 moved to Phase 12)*
