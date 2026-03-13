# Phase 15: Estate Agent Dashboard - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning
**Source:** PRD Express Path (user specification + Stitch reference screens)

<domain>
## Phase Boundary

This phase delivers the complete Estate Agent Dashboard — 32 features covering the full agency operation lifecycle. The dashboard enables estate agents to manage listings, leads, viewings, offers, sales pipeline, CRM, team/branch operations, analytics, reviews, billing, and third-party property feed integrations.

**Existing codebase state:**
- 4 route stubs exist under `/dashboard/agent/` (leads, viewings, team, revenue) — all use mock data
- `AgentDashboard.tsx` component exists with decorative display and mock KPIs
- Agent role is fully registered in auth system with multi-role support
- Generic dashboard infrastructure (activity log, messaging, notifications) exists from Phase 3
- Listings/properties tables exist from Phase 2
- Reviews system exists from Phase 4 (marketplace)
- No agent-specific database tables for leads, offers, commissions, CRM, team, branches

**Supabase tables available (relevant):**
- `profiles`, `user_roles` — agent user management
- `listings`, `properties`, `property_media`, `price_history` — property data
- `conversations`, `messages`, `conversation_read_status` — messaging
- `platform_events`, `activity_log` — notifications/activity
- `reviews`, `review_helpfulness`, `review_flags` — review system
- `bookings`, `booking_state_transitions` — booking workflow
- `viewing_history` — viewing tracking
- `transaction_milestones` — sale progression
- `service_provider_details`, `provider_documents` — provider profiles

</domain>

<decisions>
## Implementation Decisions

### Database & Backend
- New Supabase migration for agent-specific tables: agent_leads, agent_offers, agent_commissions, agent_team_members, agent_branches, agent_crm_clients, agent_api_keys, agent_feed_integrations
- All tables MUST have RLS policies enforcing agent ownership
- Use Supabase MCP to validate migrations before deployment
- Agent-specific service layer under `src/services/agent/`
- API routes under `src/app/api/agent/`

### UI/UX
- FAANG-quality implementation — polished, performant, production-ready
- Follow Stitch reference designs for all screens (14 reference screens provided)
- Shadcn UI components with Tailwind v4
- Recharts for all analytics/charts
- react-day-picker for calendar views
- Server Components by default, client only where needed
- Real-time updates via Supabase Realtime for leads/viewings/offers

### Lead Pipeline
- Kanban-style pipeline: New Enquiry → Qualified → Viewing Booked → Offer Made → Closed
- Drag-and-drop stage transitions
- Lead assignment with team member notifications

### Sales Pipeline (Kanban)
- 8-stage UK conveyancing: Offer Accepted → Memorandum of Sale → Solicitors Instructed → Searches → Survey → Mortgage → Exchange → Completion
- Server-side enforced transitions with audit trail
- Integrates with existing transaction_milestones table

### Integrations
- Reapit, Alto, Jupix property feed APIs — webhook-based sync
- API key management with rate limiting (Upstash Redis)

### Billing
- Stripe Connect integration for subscriptions and featured listing purchases
- 2.5% platform commission model

### Claude's Discretion
- Exact component file structure within agent feature directories
- Specific Recharts chart configurations and colour schemes
- Internal caching strategy for analytics queries
- Pagination approach for large datasets (cursor vs offset)
- WebSocket vs polling for real-time updates

</decisions>

<specifics>
## Specific Ideas

### Stitch Reference Screens (Project: Britestate Homepage, ID: 5956704101394866719)

**Batch 1:**
1. Agent - Viewing Management (0946d419dbce4f7e8a1d6efcf32a057d)
2. Agent - My Listings (14db2503597243e49aa6e396e6dcbe2f)
3. Agent - Lead Pipeline (58783c0bdf02424eb4229ae2dbb7e2f3)
4. Estate Agent Dashboard - Home (a8dae3b02b434d68b737fc9edbf5cd5a)

**Batch 2:**
5. Agency Analytics & Reporting (0231272737054f9ba60d82bb5abf5f9f)
6. Offers & Negotiation Management (0dc20477100b455cbaf4d9191e3f3103)
7. Team & Branch Administration (3bd435a47d814ae2ae3f4dcb08b14052)
8. Estate Agent Overview Dashboard (55326c15010842808ecc0ca57c57a3dc)
9. Property Inventory Management (83f7fee3f8174e798e087f98130faf1f)
10. Viewings Calendar & Feedback (83fc4ef9a5b54547965410687a5b7518)
11. Client CRM & Profile Management (87ef750a34b0461187037e8dfe098346)
12. Sale Progression Board / Kanban (abb29577be3f4659abcd8c984f80d6ea)
13. Integrations & Property Feeds (f47b0c69154c4fbca2d7ac8fc5d05cbf)
14. Lead Management & Pipeline (fb117d1961884f1f8f63d37511f40527)

### Feature Sub-pages (32 total)
1. Dashboard Home (active listings, leads, performance KPIs)
2. Agency Profile — Edit
3. Agency Branding (logo, colours, description)
4. My Listings — Active
5. My Listings — Sold / Let
6. My Listings — Archived / Draft
7. Create Listing (agent enhanced — valuation, floorplans, pro photos)
8. Listing Performance Analytics
9. Lead Management — All Leads
10. Lead — Detail / Timeline
11. Lead — Assign / Reassign
12. Viewing Management — Calendar
13. Viewing Feedback Collection
14. Offers Dashboard
15. Offer Negotiation Thread
16. Sale Progression Board (Kanban / Pipeline)
17. Vendor Reports (auto-generated)
18. Market Appraisal Tool
19. CRM — Client List
20. CRM — Client Profile
21. Team Management — Members
22. Team Management — Roles & Permissions
23. Branch Management (multi-location agencies)
24. Reviews & Ratings — Dashboard
25. Reviews — Respond
26. Subscription & Billing
27. Performance Reports — Agent Level
28. Performance Reports — Branch Level
29. Competitor Analysis (area)
30. Featured Listing / Boost Purchase
31. API Key Management
32. Property Feed Integration (Reapit, Alto, Jupix)

### Existing Code to Preserve/Extend
- `/src/app/(protected)/dashboard/agent/` — existing route structure
- `/src/components/dashboard/agent/AgentDashboard.tsx` — replace mock data with real queries
- `/src/types/dashboard.ts` — extend AgentDashboard type
- `/src/services/dashboard/dashboard-service.ts` — extend with agent-specific methods

</specifics>

<deferred>
## Deferred Ideas

- Video tour creation and editing (complex media pipeline)
- White-label portal for agencies (multi-tenant architecture)
- AI-powered lead scoring with ML model training
- Automated social media posting from listings
- Advanced reporting with custom report builder
- Property staging virtual tour (AR/VR)

</deferred>

---

*Phase: 15-estate-agent-dashboard*
*Context gathered: 2026-03-13 via PRD Express Path*
