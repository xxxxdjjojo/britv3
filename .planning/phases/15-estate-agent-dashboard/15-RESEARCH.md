# Phase 15: Estate Agent Dashboard - Research

**Researched:** 2026-03-13
**Domain:** Next.js App Router dashboard, Supabase BaaS, UK estate agent workflows, CRM, property feed integrations
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Database & Backend:**
- New Supabase migration for agent-specific tables: agent_leads, agent_offers, agent_commissions, agent_team_members, agent_branches, agent_crm_clients, agent_api_keys, agent_feed_integrations
- All tables MUST have RLS policies enforcing agent ownership
- Use Supabase MCP to validate migrations before deployment
- Agent-specific service layer under `src/services/agent/`
- API routes under `src/app/api/agent/`

**UI/UX:**
- FAANG-quality implementation -- polished, performant, production-ready
- Follow Stitch reference designs for all screens (14 reference screens provided)
- Shadcn UI components with Tailwind v4
- Recharts for all analytics/charts
- react-day-picker for calendar views
- Server Components by default, client only where needed
- Real-time updates via Supabase Realtime for leads/viewings/offers

**Lead Pipeline:**
- Kanban-style pipeline: New Enquiry -> Qualified -> Viewing Booked -> Offer Made -> Closed
- Drag-and-drop stage transitions
- Lead assignment with team member notifications

**Sales Pipeline (Kanban):**
- 8-stage UK conveyancing: Offer Accepted -> Memorandum of Sale -> Solicitors Instructed -> Searches -> Survey -> Mortgage -> Exchange -> Completion
- Server-side enforced transitions with audit trail
- Integrates with existing transaction_milestones table

**Integrations:**
- Reapit, Alto, Jupix property feed APIs -- webhook-based sync
- API key management with rate limiting (Upstash Redis)

**Billing:**
- Stripe Connect integration for subscriptions and featured listing purchases
- 2.5% platform commission model

**Feature Sub-pages (32 total):**
1. Dashboard Home (active listings, leads, performance KPIs)
2. Agency Profile -- Edit
3. Agency Branding (logo, colours, description)
4. My Listings -- Active
5. My Listings -- Sold / Let
6. My Listings -- Archived / Draft
7. Create Listing (agent enhanced -- valuation, floorplans, pro photos)
8. Listing Performance Analytics
9. Lead Management -- All Leads
10. Lead -- Detail / Timeline
11. Lead -- Assign / Reassign
12. Viewing Management -- Calendar
13. Viewing Feedback Collection
14. Offers Dashboard
15. Offer Negotiation Thread
16. Sale Progression Board (Kanban / Pipeline)
17. Vendor Reports (auto-generated)
18. Market Appraisal Tool
19. CRM -- Client List
20. CRM -- Client Profile
21. Team Management -- Members
22. Team Management -- Roles & Permissions
23. Branch Management (multi-location agencies)
24. Reviews & Ratings -- Dashboard
25. Reviews -- Respond
26. Subscription & Billing
27. Performance Reports -- Agent Level
28. Performance Reports -- Branch Level
29. Competitor Analysis (area)
30. Featured Listing / Boost Purchase
31. API Key Management
32. Property Feed Integration (Reapit, Alto, Jupix)

### Claude's Discretion
- Exact component file structure within agent feature directories
- Specific Recharts chart configurations and colour schemes
- Internal caching strategy for analytics queries
- Pagination approach for large datasets (cursor vs offset)
- WebSocket vs polling for real-time updates

### Deferred Ideas (OUT OF SCOPE)
- Video tour creation and editing (complex media pipeline)
- White-label portal for agencies (multi-tenant architecture)
- AI-powered lead scoring with ML model training
- Automated social media posting from listings
- Advanced reporting with custom report builder
- Property staging virtual tour (AR/VR)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AGT-01 | Dashboard home with real KPIs and trend indicators | Recharts for activity chart, Supabase aggregation RPCs, StatCardData pattern from dashboard.ts |
| AGT-02 | Edit agency profile | react-hook-form + zod validation, Supabase profiles extension |
| AGT-03 | Agency branding (logo, colours) | Supabase Storage for logo upload, browser-image-compression |
| AGT-04 | My Listings -- Active with metrics | Existing listings table, add agent_id filter, views/saves/enquiries counts |
| AGT-05 | My Listings -- Sold/Let with completion metrics | Listings table status filter, time-on-market calculation |
| AGT-06 | My Listings -- Archived/Draft with actions | Soft delete pattern, listing status enum |
| AGT-07 | Create Listing with enhanced features | AI descriptions via Claude SDK, floorplan upload, EPC integration |
| AGT-08 | Listing performance analytics | Recharts line/pie charts, listing_analytics_events table |
| AGT-09 | Lead pipeline Kanban view | @dnd-kit/core + @dnd-kit/sortable, agent_leads table with stage column |
| AGT-10 | Lead detail with timeline | Activity log pattern, agent_leads + communication history |
| AGT-11 | Lead assignment to team | agent_team_members table, Supabase Realtime notification |
| AGT-12 | Viewing calendar | react-day-picker day/week/month, agent_viewing_slots table |
| AGT-13 | Post-viewing feedback | Structured feedback form, viewing_feedback table |
| AGT-14 | Offers dashboard grouped by property | agent_offers table, grouped query, AIP status |
| AGT-15 | Offer negotiation threads | Messaging extension, accept/reject/counter state machine |
| AGT-16 | Sale progression Kanban | @dnd-kit, 8-stage conveyancing, transaction_milestones integration |
| AGT-17 | Vendor reports PDF | @react-pdf/renderer for PDF generation, Supabase data aggregation |
| AGT-18 | Market appraisal tool | Land Registry Price Paid Data (free, OGL), comparable sales lookup |
| AGT-19 | CRM client list | agent_crm_clients table, search/filter, bulk actions |
| AGT-20 | CRM client profile | Communication history, linked properties, preferences |
| AGT-21 | Team member management | agent_team_members table, invite via email (Resend) |
| AGT-22 | Roles & permissions | 5-tier permission model, granular toggles |
| AGT-23 | Branch management | agent_branches table, team-branch assignments |
| AGT-24 | Reviews dashboard | Existing reviews table, aggregate rating stats |
| AGT-25 | Review responses | Public response with character limit, profanity filter |
| AGT-26 | Subscription & billing | Stripe Customer Portal, subscription CRUD |
| AGT-27 | Agent-level performance reports | Recharts, aggregated analytics queries |
| AGT-28 | Branch-level performance reports | Branch-scoped aggregation, team comparison |
| AGT-29 | Competitor analysis | Area-based aggregate from listings table |
| AGT-30 | Featured listing purchase | Stripe Checkout session, featured_until column |
| AGT-31 | API key management | agent_api_keys table, Upstash rate limiting |
| AGT-32 | Property feed integration | Reapit/Alto/Jupix webhook handlers, sync status tracking |
</phase_requirements>

## Summary

Phase 15 is the largest dashboard phase at 32 features and requires approximately 10 new database tables, 7+ service modules, and 32 UI pages. The core challenge is not individual feature complexity but the breadth of interconnected domains: listing management, lead CRM, viewing scheduling, offer negotiation, sale progression, team management, analytics, billing, and third-party integrations.

The good news is that the existing codebase provides strong patterns to follow. The landlord dashboard (Phase 6/14) established the service-layer + types + migration pattern. Key libraries are already installed: @dnd-kit for Kanban drag-and-drop, @react-pdf/renderer for PDF generation, Recharts for charts, react-hook-form + zod for forms, Supabase for everything backend. The agent dashboard extends rather than invents.

The highest-risk areas are: (1) property feed integrations with Reapit/Alto/Jupix which depend on external API access and credentials, (2) the Stripe Connect subscription and featured listing billing which requires Stripe dashboard configuration, and (3) the Land Registry Price Paid Data integration for market appraisals which needs a data ingestion strategy.

**Primary recommendation:** Structure the build as DB schema first (Plan 01), then service layers (Plans 02-04), then UI pages grouped by domain (Plans 05-14). Use @dnd-kit for both Kanban boards. Use Supabase Realtime for leads/viewings/offers. Use @react-pdf/renderer for vendor reports. Treat property feed integrations as a configuration layer with webhook stubs -- the actual API connections require agency-specific credentials.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | Framework | Project standard |
| react | 19.2.3 | UI library | Project standard |
| @supabase/supabase-js | ^2.98.0 | Backend (auth, DB, storage, realtime) | Project standard |
| @supabase/ssr | ^0.9.0 | Server-side Supabase | Project standard |
| @dnd-kit/core | ^6.3.1 | Drag-and-drop foundation | Already installed, used for Kanban boards |
| @dnd-kit/sortable | ^10.0.0 | Sortable lists within columns | Already installed, pairs with core |
| @dnd-kit/modifiers | ^9.0.0 | Axis lock, snap modifiers | Already installed |
| @react-pdf/renderer | ^4.3.2 | PDF generation (vendor reports) | Already installed, React 19 compatible |
| recharts | ^2.15.4 | Charts and analytics | Already installed, project standard |
| react-hook-form | ^7.71.2 | Form state management | Already installed |
| @hookform/resolvers | ^5.2.2 | Zod resolver for forms | Already installed |
| zod | ^4.3.6 | Schema validation | Already installed |
| @tanstack/react-query | ^5.90.21 | Client-side async state | Already installed |
| @tanstack/react-table | ^8.21.3 | Data tables (CRM, leads, listings) | Already installed |
| @upstash/ratelimit | ^2.0.8 | API key rate limiting | Already installed |
| @upstash/redis | ^1.36.3 | Redis client for caching/rate limiting | Already installed |
| resend | ^6.9.3 | Email (team invites, notifications) | Already installed |
| lucide-react | ^0.577.0 | Icons | Already installed |
| sonner | ^2.0.7 | Toast notifications | Already installed |
| browser-image-compression | ^2.0.2 | Client-side image compression | Already installed |
| jspdf | ^4.2.0 | Alternative PDF (simple exports) | Already installed |
| stripe | - | Stripe SDK (server-side) | Needs installation for billing features |

### Supporting (Need Installation)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-day-picker | ^9.x | Calendar component for viewings | Required by AGT-12 -- Shadcn Calendar wraps this |
| stripe | ^17.x | Stripe Node.js SDK | Required by AGT-26 and AGT-30 for billing |
| @stripe/stripe-js | ^5.x | Stripe client-side | Required for Checkout redirect |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | react-beautiful-dnd | @dnd-kit already installed, better maintained, supports React 19 |
| @react-pdf/renderer | jspdf | jspdf also installed but @react-pdf/renderer gives JSX-based PDFs which are easier to maintain |
| Supabase Realtime | Socket.IO | Supabase Realtime is already integrated, no extra infra needed |
| @tanstack/react-table | Custom table | react-table already installed, handles sorting/filtering/pagination natively |

**Installation (new packages only):**
```bash
pnpm add react-day-picker stripe @stripe/stripe-js
```

**Shadcn UI components to add (if not already present):**
```bash
pnpm dlx shadcn@latest add calendar
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (protected)/dashboard/agent/
│   │   ├── page.tsx                    # Dashboard home (AGT-01)
│   │   ├── profile/
│   │   │   ├── page.tsx                # Agency profile edit (AGT-02)
│   │   │   └── branding/page.tsx       # Agency branding (AGT-03)
│   │   ├── listings/
│   │   │   ├── page.tsx                # Active listings (AGT-04)
│   │   │   ├── sold/page.tsx           # Sold/Let (AGT-05)
│   │   │   ├── archived/page.tsx       # Archived/Draft (AGT-06)
│   │   │   ├── create/page.tsx         # Create listing wizard (AGT-07)
│   │   │   └── [id]/analytics/page.tsx # Listing analytics (AGT-08)
│   │   ├── leads/
│   │   │   ├── page.tsx                # Lead pipeline Kanban (AGT-09)
│   │   │   ├── [id]/page.tsx           # Lead detail (AGT-10)
│   │   │   └── assign/page.tsx         # Lead assignment (AGT-11)
│   │   ├── viewings/
│   │   │   ├── page.tsx                # Calendar view (AGT-12)
│   │   │   └── feedback/page.tsx       # Feedback collection (AGT-13)
│   │   ├── offers/
│   │   │   ├── page.tsx                # Offers dashboard (AGT-14)
│   │   │   └── [id]/page.tsx           # Negotiation thread (AGT-15)
│   │   ├── sales/
│   │   │   ├── page.tsx                # Sale progression Kanban (AGT-16)
│   │   │   ├── reports/page.tsx        # Vendor reports (AGT-17)
│   │   │   └── appraisal/page.tsx      # Market appraisal (AGT-18)
│   │   ├── crm/
│   │   │   ├── page.tsx                # Client list (AGT-19)
│   │   │   └── [id]/page.tsx           # Client profile (AGT-20)
│   │   ├── team/
│   │   │   ├── page.tsx                # Team members (AGT-21)
│   │   │   ├── roles/page.tsx          # Roles & permissions (AGT-22)
│   │   │   └── branches/page.tsx       # Branch management (AGT-23)
│   │   ├── reviews/
│   │   │   ├── page.tsx                # Reviews dashboard (AGT-24)
│   │   │   └── [id]/respond/page.tsx   # Review response (AGT-25)
│   │   ├── billing/
│   │   │   ├── page.tsx                # Subscription & billing (AGT-26)
│   │   │   └── boost/page.tsx          # Featured listing purchase (AGT-30)
│   │   ├── analytics/
│   │   │   ├── page.tsx                # Agent performance (AGT-27)
│   │   │   ├── branch/page.tsx         # Branch performance (AGT-28)
│   │   │   └── competitors/page.tsx    # Competitor analysis (AGT-29)
│   │   └── integrations/
│   │       ├── page.tsx                # API key management (AGT-31)
│   │       └── feeds/page.tsx          # Property feed config (AGT-32)
│   └── api/agent/
│       ├── leads/route.ts
│       ├── offers/route.ts
│       ├── viewings/route.ts
│       ├── team/route.ts
│       ├── crm/route.ts
│       ├── analytics/route.ts
│       ├── billing/route.ts
│       ├── feeds/route.ts
│       └── reports/route.ts
├── components/dashboard/agent/
│   ├── AgentDashboardHome.tsx
│   ├── listings/
│   ├── leads/
│   │   ├── LeadPipelineKanban.tsx
│   │   ├── LeadCard.tsx
│   │   └── LeadDetailTimeline.tsx
│   ├── viewings/
│   │   ├── ViewingCalendar.tsx
│   │   └── ViewingFeedbackForm.tsx
│   ├── offers/
│   │   ├── OffersDashboard.tsx
│   │   └── NegotiationThread.tsx
│   ├── sales/
│   │   ├── SaleProgressionKanban.tsx
│   │   └── VendorReportPDF.tsx
│   ├── crm/
│   │   ├── ClientList.tsx
│   │   └── ClientProfile.tsx
│   ├── team/
│   │   ├── TeamMemberList.tsx
│   │   └── BranchManager.tsx
│   ├── analytics/
│   │   ├── AgentPerformanceCharts.tsx
│   │   └── CompetitorAnalysis.tsx
│   └── integrations/
│       ├── ApiKeyManager.tsx
│       └── FeedIntegrationConfig.tsx
├── services/agent/
│   ├── agent-dashboard-service.ts      # KPIs, activity feed
│   ├── agent-listings-service.ts       # Listing CRUD, analytics
│   ├── agent-lead-service.ts           # Lead pipeline, assignment
│   ├── agent-viewing-service.ts        # Calendar, slots, feedback
│   ├── agent-offer-service.ts          # Offer negotiation, pipeline
│   ├── agent-sale-service.ts           # Sale progression Kanban
│   ├── agent-crm-service.ts            # CRM client management
│   ├── agent-team-service.ts           # Team, roles, branches
│   ├── agent-analytics-service.ts      # Reports, competitor data
│   ├── agent-billing-service.ts        # Stripe subscription management
│   └── agent-feed-service.ts           # Property feed integrations
└── types/agent.ts                      # All agent domain types
```

### Pattern 1: Kanban Board with @dnd-kit

**What:** Drag-and-drop Kanban board for lead pipeline and sale progression
**When to use:** AGT-09 (leads) and AGT-16 (sales)
**Example:**
```typescript
// Source: @dnd-kit docs + Georgegriff/react-dnd-kit-tailwind-shadcn-ui
"use client";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Each column is a droppable container with SortableContext
// Cards use useSortable() hook
// On DragEnd: call API to update lead.stage, then optimistic update via React Query
// DragOverlay renders a ghost card during drag

const LEAD_STAGES = [
  "new_enquiry",
  "qualified",
  "viewing_booked",
  "offer_made",
  "closed",
] as const;

const SALE_STAGES = [
  "offer_accepted",
  "memorandum_of_sale",
  "solicitors_instructed",
  "searches",
  "survey",
  "mortgage",
  "exchange",
  "completion",
] as const;
```

### Pattern 2: Service Layer with Supabase Server Client

**What:** Stateless service modules for each agent domain
**When to use:** All service files under src/services/agent/
**Example:**
```typescript
// Source: Established pattern from src/services/landlord/portfolio-service.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAgentLeads(
  supabase: SupabaseClient,
  agentId: string,
  stage?: string
) {
  let query = supabase
    .from("agent_leads")
    .select("*, agent_lead_activities(*)")
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false });

  if (stage) {
    query = query.eq("stage", stage);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

### Pattern 3: Server Component + Client Wrapper

**What:** Server Components fetch data, pass to client components that need interactivity
**When to use:** All dashboard pages -- data fetching is server-side, interactive UI is client
**Example:**
```typescript
// page.tsx (Server Component -- no "use client")
import { createClient } from "@/lib/supabase/server";
import { getAgentLeads } from "@/services/agent/agent-lead-service";
import { LeadPipelineKanban } from "@/components/dashboard/agent/leads/LeadPipelineKanban";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const leads = await getAgentLeads(supabase, user.id);
  return <LeadPipelineKanban initialLeads={leads} />;
}

// LeadPipelineKanban.tsx ("use client" -- has DnD interactivity)
```

### Pattern 4: Supabase Realtime Subscription

**What:** Real-time updates for leads, viewings, and offers
**When to use:** AGT-09, AGT-12, AGT-14
**Example:**
```typescript
// Source: Supabase docs (supabase.com/docs/guides/realtime/postgres-changes)
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function useRealtimeLeads(agentId: string, onUpdate: (payload: unknown) => void) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("agent-leads")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_leads",
          filter: `agent_id=eq.${agentId}`,
        },
        onUpdate
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agentId, onUpdate]);
}
```

### Pattern 5: TypeScript Types (Established Project Pattern)

**What:** Domain types matching SQL schema exactly, using Readonly wrappers and const arrays for enums
**When to use:** src/types/agent.ts
**Example:**
```typescript
// Source: Established pattern from src/types/landlord.ts
export const LEAD_STAGES = [
  "new_enquiry", "qualified", "viewing_booked", "offer_made", "closed",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export type AgentLead = Readonly<{
  id: string;
  agent_id: string;
  property_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  stage: LeadStage;
  source: string;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;
```

### Anti-Patterns to Avoid
- **Mock data arrays in components:** All data must come from Supabase queries. No hardcoded arrays.
- **Client-side data fetching for initial page load:** Use Server Components for initial data, React Query for mutations and refetches.
- **Missing RLS policies:** Every single table MUST have RLS enabled with policies keyed on auth.uid(). Never rely on API-level auth alone.
- **Monolithic service files:** Split by domain (leads, offers, viewings, etc.) not by operation type.
- **Direct Stripe API calls from client:** All Stripe operations go through API routes (server-side only).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop Kanban | Custom mouse event tracking | @dnd-kit/core + @dnd-kit/sortable | Accessibility, touch support, keyboard nav, already installed |
| PDF generation | HTML-to-canvas approaches | @react-pdf/renderer | JSX-based, server-compatible, already installed |
| Data tables with sort/filter | Custom table with state | @tanstack/react-table | Headless, handles pagination/sorting/filtering, already installed |
| Calendar views | Custom date grid | react-day-picker (via Shadcn Calendar) | Accessibility, i18n, customizable, Shadcn integration |
| Form validation | Manual validation logic | react-hook-form + zod | Established project pattern, type-safe |
| Toast notifications | Custom notification system | sonner | Already installed, accessible |
| Rate limiting | Custom token bucket | @upstash/ratelimit | Already installed, edge-compatible |
| Real-time updates | WebSocket server + reconnect | Supabase Realtime | Built into Supabase, handles reconnection, RLS-aware |
| Subscription billing UI | Custom billing pages | Stripe Customer Portal | Pre-built, PCI compliant, handles all edge cases |
| Image compression | Server-side Sharp for uploads | browser-image-compression (client) | Already installed, reduces upload size before network transfer |

**Key insight:** Every major infrastructure need for this phase is already installed in the project. The phase is about assembly and integration, not library selection.

## Common Pitfalls

### Pitfall 1: RLS Policy Gaps in Multi-Tenant Agent Tables
**What goes wrong:** Agent A can see Agent B's leads, offers, or team members because RLS policy is missing or wrong.
**Why it happens:** Agent tables need ownership through agent_id, but some queries (team member viewing branch data) require more complex policies.
**How to avoid:** Every table gets `ENABLE ROW LEVEL SECURITY`. For team tables, use a policy that checks `auth.uid() = agent_id OR auth.uid() IN (SELECT user_id FROM agent_team_members WHERE agent_id = agent_leads.agent_id)`. Test RLS with multiple test users.
**Warning signs:** Queries returning data without `.eq("agent_id", userId)` filters.

### Pitfall 2: Kanban DragEnd Without Optimistic Updates
**What goes wrong:** Drag feels laggy -- card snaps back to original position, then jumps to new position after API response.
**Why it happens:** Waiting for server confirmation before updating UI state.
**How to avoid:** Optimistic update via React Query `onMutate` -- move the card in local state immediately, revert `onError`. Call `queryClient.setQueryData` in the drag handler.
**Warning signs:** Visible card "teleportation" after drag.

### Pitfall 3: @react-pdf/renderer in Server Components
**What goes wrong:** PDF generation crashes or produces empty output in RSC context.
**Why it happens:** @react-pdf/renderer needs specific Next.js configuration for server-side use.
**How to avoid:** Add `@react-pdf/renderer` to `serverComponentsExternalPackages` in `next.config.ts`. For download links, use dynamic import with `ssr: false` for `PDFDownloadLink`. For server-side generation (API route), use `renderToBuffer()`.
**Warning signs:** "Module not found" errors or empty PDF output.

### Pitfall 4: Stripe Webhook Signature Verification Skipped
**What goes wrong:** Fake webhook payloads can trigger subscription status changes or featured listing activations.
**Why it happens:** Developer skips `stripe.webhooks.constructEvent()` verification during development.
**How to avoid:** Always verify webhook signatures. Use `stripe listen --forward-to` for local development. Store `STRIPE_WEBHOOK_SECRET` in environment variables.
**Warning signs:** Webhook handler processes `req.json()` directly without signature check.

### Pitfall 5: Sale Progression Allows Invalid Stage Transitions
**What goes wrong:** A sale jumps from "Offer Accepted" directly to "Exchange" bypassing intermediate stages.
**Why it happens:** Client-side Kanban allows arbitrary drag-and-drop between any columns.
**How to avoid:** Server-side validation: define allowed transitions as a directed graph. The API route checks `current_stage -> new_stage` is in the allowed transitions map. The Kanban UI also disables invalid drop targets visually.
**Warning signs:** Missing CHECK constraint or transition validation in the API route.

### Pitfall 6: Property Feed Integration Assumes API Access
**What goes wrong:** Phase blocks on waiting for Reapit/Alto/Jupix API credentials that require agency-level subscriptions.
**Why it happens:** External API access requires the agency to have active subscriptions with those providers.
**How to avoid:** Build the integration configuration UI and webhook receiver stubs. Use mock/sandbox data for development (Reapit has a SBOX sandbox). The actual connection requires per-agency credentials stored in agent_feed_integrations.
**Warning signs:** Hardcoded API keys in source code.

### Pitfall 7: N+1 Queries in Dashboard KPIs
**What goes wrong:** Dashboard home makes 10+ separate queries for each KPI stat card.
**Why it happens:** Each stat (active listings count, leads count, viewings count, etc.) is a separate query.
**How to avoid:** Create a single Supabase RPC function `get_agent_dashboard_kpis(agent_id uuid)` that returns all KPIs in one round trip. Cache the result in Upstash Redis with 60-second TTL.
**Warning signs:** Dashboard home page loads slowly, multiple sequential supabase calls.

## Code Examples

### Database Schema Pattern (agent_leads)

```sql
-- Source: Established pattern from landlord migration files

CREATE TABLE IF NOT EXISTS agent_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  stage TEXT NOT NULL DEFAULT 'new_enquiry'
    CHECK (stage IN ('new_enquiry', 'qualified', 'viewing_booked', 'offer_made', 'closed')),
  source TEXT NOT NULL DEFAULT 'website'
    CHECK (source IN ('website', 'portal', 'phone', 'walk_in', 'referral', 'other')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE agent_leads ENABLE ROW LEVEL SECURITY;

-- Agent can see their own leads + leads visible to their team
CREATE POLICY "agent_leads_select" ON agent_leads
  FOR SELECT USING (
    agent_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM agent_team_members
      WHERE agent_id = agent_leads.agent_id
        AND status = 'active'
    )
  );

CREATE POLICY "agent_leads_insert" ON agent_leads
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_leads_update" ON agent_leads
  FOR UPDATE USING (
    agent_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM agent_team_members
      WHERE agent_id = agent_leads.agent_id
        AND role IN ('admin', 'senior_negotiator')
    )
  );
```

### Vendor Report PDF Generation

```typescript
// Source: @react-pdf/renderer docs + project pattern
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  header: { fontSize: 18, marginBottom: 20 },
  section: { marginBottom: 15 },
  label: { fontSize: 10, color: "#666" },
  value: { fontSize: 14, marginTop: 2 },
});

export function VendorReportDocument({ data }: Readonly<{ data: VendorReportData }>) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Vendor Report: {data.property_address}</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Total Views</Text>
          <Text style={styles.value}>{data.total_views}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Viewings Conducted</Text>
          <Text style={styles.value}>{data.viewings_count}</Text>
        </View>
        {/* Market analysis, offers summary, comparable sales */}
      </Page>
    </Document>
  );
}

// API route for server-side PDF generation:
// import { renderToBuffer } from "@react-pdf/renderer";
// const buffer = await renderToBuffer(<VendorReportDocument data={reportData} />);
// return new Response(buffer, { headers: { "Content-Type": "application/pdf" } });
```

### Stripe Subscription Integration

```typescript
// Source: Stripe docs + vercel/nextjs-subscription-payments pattern
// API route: src/app/api/agent/billing/route.ts

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const { action, priceId } = await request.json();

  if (action === "create-checkout") {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/agent/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/agent/billing?canceled=true`,
      // application_fee_percent for platform commission
      subscription_data: {
        application_fee_percent: 2.5,
      },
    });
    return Response.json({ url: session.url });
  }

  if (action === "portal") {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId, // from agent's Stripe customer ID
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/agent/billing`,
    });
    return Response.json({ url: session.url });
  }
}
```

### Land Registry Price Paid Data Query

```typescript
// Source: landregistry.data.gov.uk/app/ppd (free, OGL licence)
// Market appraisal tool -- comparable sales lookup

const LAND_REGISTRY_API = "https://landregistry.data.gov.uk/app/ppd";

export async function getComparableSales(
  postcode: string,
  propertyType: string,
  radiusKm: number = 1
): Promise<ComparableSale[]> {
  // Option 1: Direct SPARQL endpoint (free)
  // Option 2: Download monthly CSV and store in Supabase
  // Option 3: Use pre-seeded data from bulk download

  // Recommended: Bulk download CSV into Supabase table, query locally
  // The Price Paid Data is updated monthly and available under OGL
  // Download from: gov.uk/government/statistical-data-sets/price-paid-data-downloads
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2023 (rbd deprecated) | Must use @dnd-kit for Kanban; already installed |
| Custom PDF with canvas | @react-pdf/renderer JSX | 2024 (v4.x) | React 19 compatible, JSX-based PDF layout |
| REST polling for updates | Supabase Realtime postgres_changes | 2023+ | Built-in, RLS-aware, no extra WebSocket server |
| Stripe.js direct charges | Stripe Checkout + Customer Portal | 2024+ | PCI compliance simplified, pre-built billing UI |
| Custom rate limiting | @upstash/ratelimit | 2024+ | Edge-compatible, sliding window, already installed |

**Deprecated/outdated:**
- react-beautiful-dnd: Officially deprecated, does not support React 18+ strict mode
- Stripe Charges API: Use Payment Intents + Checkout Sessions instead
- Supabase Realtime v1: Current codebase uses v2 channel-based API

## Database Schema Design

### Required New Tables (10 tables)

| Table | Purpose | Key Columns | RLS Strategy |
|-------|---------|-------------|--------------|
| agent_leads | Lead pipeline tracking | id, agent_id, property_id, stage, source, assigned_to, contact_* | agent_id = auth.uid() OR team member |
| agent_offers | Offer management | id, agent_id, listing_id, buyer_id, amount, status, conditions | agent_id = auth.uid() OR team member |
| agent_commissions | Commission tracking | id, agent_id, listing_id, amount, status, paid_at | agent_id = auth.uid() |
| agent_team_members | Team member registry | id, agent_id, user_id, role, branch_id, status | agent_id = auth.uid() OR user_id = auth.uid() |
| agent_branches | Multi-branch support | id, agent_id, name, address, phone, email | agent_id = auth.uid() OR team member |
| agent_crm_clients | CRM client records | id, agent_id, name, email, phone, type, notes | agent_id = auth.uid() OR team member |
| agent_api_keys | API key management | id, agent_id, key_hash, name, rate_limit, last_used, revoked_at | agent_id = auth.uid() |
| agent_feed_integrations | Property feed config | id, agent_id, provider, config, sync_status, last_sync, error_log | agent_id = auth.uid() |
| agent_viewing_slots | Published availability | id, agent_id, listing_id, start_time, end_time, booked_by | agent_id = auth.uid() |
| agent_vendor_reports | Generated report metadata | id, agent_id, listing_id, report_type, generated_at, storage_path | agent_id = auth.uid() |

### Additional Supporting Tables/Extensions

| Table | Purpose | Notes |
|-------|---------|-------|
| agent_lead_activities | Lead timeline/audit | FK to agent_leads, stores stage changes, notes, calls |
| agent_offer_history | Offer negotiation trail | FK to agent_offers, stores counter-offers with timestamps |
| listing_analytics_events | Per-listing view/save/enquiry tracking | May already exist or extend existing table |
| agent_viewing_feedback | Post-viewing buyer feedback | FK to bookings, structured feedback fields |

### RLS Policy Pattern

Every table uses the same base pattern:
```sql
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

-- Owner access
CREATE POLICY "{table}_owner" ON {table}
  FOR ALL USING (agent_id = auth.uid());

-- Team member read access (where appropriate)
CREATE POLICY "{table}_team_read" ON {table}
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM agent_team_members
      WHERE agent_id = {table}.agent_id AND status = 'active'
    )
  );
```

### Team Roles and Permission Model

| Role | Level | Can Manage Listings | Can Manage Leads | Can Manage Team | Can View Billing | Can Manage Integrations |
|------|-------|--------------------|--------------------|-----------------|------------------|------------------------|
| Admin | 1 | Yes | Yes | Yes | Yes | Yes |
| Senior Negotiator | 2 | Yes | Yes | No | No | No |
| Negotiator | 3 | Own only | Assigned only | No | No | No |
| Lettings Manager | 4 | Lettings only | Lettings leads | No | No | No |
| Viewer | 5 | Read-only | Read-only | No | No | No |

## Property Feed Integration Details

### Reapit Foundations API
- **Auth:** OpenID Connect (OAuth 2.0), Client Credentials flow for server-to-server
- **Base URL:** `https://platform.reapit.cloud/`
- **Rate limits:** 20 req/s, 5 concurrent, 250K daily max
- **Key endpoints:** GET /properties, GET /contacts, GET /offices, GET /negotiators
- **Sandbox:** Available immediately with customer ID "SBOX"
- **API version:** 2020-01-31 (required header)
- **Pagination:** pageSize + pageNumber parameters
- **Webhooks:** Supported for installation notifications

### Alto (Vebra) API
- **Auth:** API key-based
- **Updates:** Polls for changes every 15 minutes
- **Setup cost:** GBP 100 one-off + GBP 128/year/branch
- **Data:** Price, property details, images, documents, EPC, floorplans

### Jupix API
- **Provider:** Part of Zoopla group
- **Data:** Property listings, portal feeds, documents
- **Integration:** Feed-based sync, typically XML/JSON feeds

### Implementation Strategy
Build a unified `PropertyFeedAdapter` interface that each provider implements:
```typescript
type PropertyFeedAdapter = {
  connect(config: FeedConfig): Promise<void>;
  syncProperties(): Promise<SyncResult>;
  handleWebhook(payload: unknown): Promise<void>;
  getStatus(): Promise<FeedStatus>;
};
```

Store per-agency credentials encrypted in agent_feed_integrations. The webhook receiver at `/api/agent/feeds/webhook` routes to the correct adapter based on provider.

## Open Questions

1. **Land Registry Data Ingestion**
   - What we know: Price Paid Data is free under OGL, available as monthly CSV downloads or via SPARQL endpoint
   - What's unclear: Whether to bulk-import into a Supabase table or query the SPARQL endpoint at runtime
   - Recommendation: Bulk import monthly CSV into a `land_registry_prices` table for fast comparable lookups. The SPARQL endpoint has no SLA and can be slow.

2. **Stripe Product/Price Configuration**
   - What we know: Need subscription plans and one-off featured listing products
   - What's unclear: Exact plan tiers and pricing for agent subscriptions
   - Recommendation: Create a seed script that sets up Stripe products/prices in test mode. Use environment variables for price IDs.

3. **Property Feed API Credentials**
   - What we know: Each provider requires separate agency-level subscriptions
   - What's unclear: Whether any test/sandbox credentials are available for development
   - Recommendation: Reapit offers a sandbox (SBOX). For Alto and Jupix, build the integration UI with mock mode and a toggle for live/sandbox.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + happy-dom |
| Config file | Exists (vitest configured in package.json) |
| Quick run command | `pnpm test -- --run` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AGT-01 | Dashboard KPI aggregation | unit | `pnpm test -- --run src/__tests__/services/agent-dashboard-service.test.ts` | No -- Wave 0 |
| AGT-09 | Lead pipeline stage transitions | unit | `pnpm test -- --run src/__tests__/services/agent-lead-service.test.ts` | No -- Wave 0 |
| AGT-11 | Lead assignment with notification | unit | `pnpm test -- --run src/__tests__/services/agent-lead-service.test.ts` | No -- Wave 0 |
| AGT-15 | Offer accept/reject/counter state machine | unit | `pnpm test -- --run src/__tests__/services/agent-offer-service.test.ts` | No -- Wave 0 |
| AGT-16 | Sale progression stage validation | unit | `pnpm test -- --run src/__tests__/services/agent-sale-service.test.ts` | No -- Wave 0 |
| AGT-17 | Vendor report PDF generation | unit | `pnpm test -- --run src/__tests__/services/agent-report-service.test.ts` | No -- Wave 0 |
| AGT-22 | Role permission enforcement | unit | `pnpm test -- --run src/__tests__/services/agent-team-service.test.ts` | No -- Wave 0 |
| AGT-26 | Stripe checkout session creation | unit | `pnpm test -- --run src/__tests__/services/agent-billing-service.test.ts` | No -- Wave 0 |
| AGT-31 | API key generation and rate limiting | unit | `pnpm test -- --run src/__tests__/services/agent-api-key-service.test.ts` | No -- Wave 0 |
| AGT-32 | Feed integration config validation | unit | `pnpm test -- --run src/__tests__/services/agent-feed-service.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test -- --run`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/services/agent-dashboard-service.test.ts` -- covers AGT-01
- [ ] `src/__tests__/services/agent-lead-service.test.ts` -- covers AGT-09, AGT-11
- [ ] `src/__tests__/services/agent-offer-service.test.ts` -- covers AGT-14, AGT-15
- [ ] `src/__tests__/services/agent-sale-service.test.ts` -- covers AGT-16
- [ ] `src/__tests__/services/agent-viewing-service.test.ts` -- covers AGT-12, AGT-13
- [ ] `src/__tests__/services/agent-crm-service.test.ts` -- covers AGT-19, AGT-20
- [ ] `src/__tests__/services/agent-team-service.test.ts` -- covers AGT-21, AGT-22, AGT-23
- [ ] `src/__tests__/services/agent-billing-service.test.ts` -- covers AGT-26, AGT-30
- [ ] `src/__tests__/services/agent-feed-service.test.ts` -- covers AGT-32
- [ ] `src/__tests__/services/agent-report-service.test.ts` -- covers AGT-17
- [ ] `src/__tests__/services/agent-api-key-service.test.ts` -- covers AGT-31

## Discretion Recommendations

### Component File Structure
**Recommendation:** Group by feature domain (leads/, viewings/, offers/, etc.) under `src/components/dashboard/agent/`. Each domain folder gets its own components. Shared agent components (stat cards, agent sidebar nav) go in `src/components/dashboard/agent/shared/`.

### Recharts Configuration
**Recommendation:** Use the existing Shadcn `chart.tsx` component wrapper (already in `src/components/ui/chart.tsx`). Use the project's CSS custom property colours. Line charts for time series, bar charts for comparisons, pie charts for breakdowns. Consistent height of 300px for dashboard cards.

### Caching Strategy
**Recommendation:** Use Upstash Redis with TTLs:
- Dashboard KPIs: 60 seconds
- Analytics reports: 5 minutes
- Competitor analysis: 1 hour
- Listing performance: 2 minutes

### Pagination Approach
**Recommendation:** Cursor-based pagination for timeline/activity feeds (using `created_at`). Offset pagination for tabular data (CRM client list, team members) where page jumping is useful. Use `@tanstack/react-table` built-in pagination for tables.

### Real-time Updates
**Recommendation:** Use Supabase Realtime `postgres_changes` for leads, viewings, and offers tables. This gives immediate updates without polling overhead. For analytics (which are aggregated and don't need instant updates), use React Query with a 60-second refetch interval. Do NOT use Realtime for analytics -- it would generate excessive events.

## Sources

### Primary (HIGH confidence)
- Supabase Docs (supabase.com/docs/guides/realtime/postgres-changes) -- Realtime subscription patterns
- @dnd-kit official docs -- Kanban DnD patterns
- @react-pdf/renderer npm page and docs -- PDF generation, React 19 compatibility confirmed
- Reapit Foundations API docs (foundations-documentation.reapit.cloud) -- API structure, auth, rate limits, sandbox
- HM Land Registry (gov.uk/government/statistical-data-sets/price-paid-data-downloads) -- Free Price Paid Data under OGL
- Stripe docs (docs.stripe.com/connect/platform-pricing-tools) -- Platform commission model
- Project codebase -- package.json (all installed deps), types/landlord.ts (type patterns), services/landlord/* (service patterns)

### Secondary (MEDIUM confidence)
- Georgegriff/react-dnd-kit-tailwind-shadcn-ui (github.com) -- Kanban board reference implementation
- Vebra Alto integration docs (bluelinemedia.co.uk, los.digital) -- Alto API access model and pricing
- vercel/nextjs-subscription-payments (github.com) -- Stripe + Next.js + Supabase subscription pattern

### Tertiary (LOW confidence)
- Jupix API specifics -- Limited public documentation; integration details gathered from third-party sites (estateagentfeeds.com, propertywebmasters.com)
- Alto/Vebra exact API schema -- No official public API documentation found; details from integration partner descriptions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All core libraries already installed and verified in package.json
- Architecture: HIGH -- Follows established patterns from landlord dashboard (Phase 6/14)
- Database schema: HIGH -- Follows established migration patterns, RLS patterns documented
- Kanban (@dnd-kit): HIGH -- Library installed, well-documented, community examples available
- PDF generation: HIGH -- @react-pdf/renderer installed, React 19 compatible confirmed
- Stripe billing: MEDIUM -- Pattern clear but requires Stripe dashboard product setup
- Property feed integrations: MEDIUM (Reapit) / LOW (Alto, Jupix) -- Reapit has public docs and sandbox; Alto/Jupix have limited public API documentation
- Land Registry data: HIGH -- Free public data, download format documented by UK government
- Pitfalls: HIGH -- Based on real-world Next.js + Supabase development patterns

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable stack, 30-day validity)
