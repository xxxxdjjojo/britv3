# Phase 03 Chunk 1: Dashboard Homes + Messaging Center — Design

> **Date:** 2026-03-08
> **Status:** Approved
> **Approach:** Stitch-first import with Britestate design token conversion

## Goal

Import 6 Stitch screens into the Next.js app, creating/updating dashboard home pages for all 5 roles and the messaging center inbox page. All pages follow Britestate design system tokens — no hardcoded hex values.

## Stitch Project

**Project ID:** `5956704101394866719`

## Screen Map

| # | Stitch Screen ID | Title | Target File |
|---|-----------------|-------|-------------|
| 1 | `add7af54cdbc45a79deb80b114258234` | Buyer Dashboard Overview | `src/components/dashboard/BuyerDashboard.tsx` |
| 2 | `b6f1cfc1b8a74e67b99ac66b8f00adeb` | Seller Dashboard Overview | `src/components/dashboard/SellerDashboard.tsx` |
| 3 | `38ca6396317d484c9b7778299a9db33e` | Landlord Dashboard Overview | `src/components/dashboard/LandlordDashboard.tsx` |
| 4 | `55326c15010842808ecc0ca57c57a3dc` | Estate Agent Overview Dashboard | `src/components/dashboard/AgentDashboard.tsx` |
| 5 | `4b449e2a02ae419dafcebede08dca1ee` | Tradesperson Dashboard Overview | `src/components/dashboard/ProviderDashboard.tsx` |
| 6 | `73d07387809f4bf3b6617290de33b97f` | Agent Messaging Center | `src/app/(protected)/inbox/page.tsx` |

## Architecture

### Routing

The existing dynamic route `src/app/(protected)/dashboard/[role]/page.tsx` switches content by role param. Each role's dashboard content is extracted into its own component:

```
src/components/dashboard/
├── BuyerDashboard.tsx        # homebuyer + renter role
├── SellerDashboard.tsx       # seller role
├── LandlordDashboard.tsx     # landlord role
├── AgentDashboard.tsx        # agent role
├── ProviderDashboard.tsx     # service_provider role
└── shared/
    ├── StatCard.tsx           # Reusable stat card (label, value, change, icon)
    ├── ActivityFeed.tsx       # Recent activity timeline
    ├── QuickActions.tsx       # Quick action buttons grid
    └── DashboardWelcome.tsx   # Welcome banner with user name
```

### Page Structure (all dashboards follow this pattern)

1. **Welcome banner** — "Good morning, [Name]!" with dismissible context message
2. **Stats row** — 4 StatCards showing key metrics per role
3. **Primary content** — Role-specific (new matches for buyer, listings for seller, portfolio for landlord, pipeline for agent, jobs for provider)
4. **Secondary content** — 2-column: activity feed + upcoming events/actions
5. **Quick actions** — Bottom grid of CTA buttons relevant to role

### Messaging Center

Replaces existing `src/app/(protected)/inbox/page.tsx`:
- Left panel: conversation list (avatar, name, last message, time, unread badge)
- Right panel: message thread (chat bubbles)
- Quick actions in thread: Schedule Viewing, Send Document
- Mobile: conversation list → tap → full-screen thread

### Data

All mock data — no live Supabase calls in this chunk. Realistic UK property data matching each role's context.

## Conversion Rules (apply to EVERY screen)

When converting Stitch HTML/CSS output to TSX:

1. **No hardcoded hex values** — replace with Tailwind classes: `bg-brand-primary`, `text-brand-accent`, `border-neutral-200`, etc.
2. **No inline `style={{}}` for colors/spacing** — use Tailwind utilities
3. **Images** → `<Image>` from `next/image` with `alt`, `width`, `height` props
4. **Links** → `<Link>` from `next/link`
5. **Icons** → Lucide React (`import { Home } from "lucide-react"`)
6. **`class=`** → `className=`
7. **Interactive elements** → add `"use client"` directive at top of file
8. **Buttons** → use `<Button>` from `@/components/ui/button` with correct variant
9. **Cards** → use `<Card>` from `@/components/ui/card`
10. **Badges** → use `<Badge>` from `@/components/ui/badge`
11. **`cn()` utility** → import from `@/lib/utils` for conditional classes

### Britestate Color Token Map

| Hex | Tailwind Class |
|-----|---------------|
| `#1B4D3E` | `bg-brand-primary` / `text-brand-primary` |
| `#2D7A5F` | `bg-brand-primary-light` / `text-brand-primary-light` |
| `#D4A853` | `bg-brand-secondary` / `text-brand-secondary` |
| `#2563EB` | `bg-brand-accent` / `text-brand-accent` |
| `#F8F8FA` | `bg-neutral-50` |
| `#E2E2E8` | `border-neutral-200` |
| `#171719` | `text-neutral-900` |
| `#7A7A88` | `text-neutral-500` |
| `#16A34A` | `text-success` |
| `#DC2626` | `text-error` |

## Existing Infrastructure

### Available Shadcn Components
button, input, card, label, alert, separator, dropdown-menu, tabs, radio-group, badge, checkbox, select, sheet, sonner, avatar, dialog, switch, popover, progress, tooltip, textarea, scroll-area, table, skeleton, input-group, command, slider, breadcrumb, toggle, drawer, chart, toggle-group, sidebar

### Existing Layouts
- `src/app/(protected)/layout.tsx` — protected route wrapper
- `src/app/(protected)/dashboard/layout.tsx` — dashboard layout
- `src/app/(protected)/dashboard/[role]/layout.tsx` — role-specific layout

## Task Breakdown

### Task 1: Shared Dashboard Components
- Create `src/components/dashboard/shared/StatCard.tsx`
- Create `src/components/dashboard/shared/ActivityFeed.tsx`
- Create `src/components/dashboard/shared/QuickActions.tsx`
- Create `src/components/dashboard/shared/DashboardWelcome.tsx`
- Verify: `pnpm build`
- Commit: `feat(dashboard): add shared dashboard components`

### Task 2: Buyer Dashboard
- Fetch Stitch screen `add7af54cdbc45a79deb80b114258234`
- Convert to `src/components/dashboard/BuyerDashboard.tsx`
- Update `src/app/(protected)/dashboard/[role]/page.tsx` to import and render for homebuyer/renter
- Verify: `pnpm build`
- Commit: `feat(dashboard): import buyer dashboard from Stitch`

### Task 3: Seller Dashboard
- Fetch Stitch screen `b6f1cfc1b8a74e67b99ac66b8f00adeb`
- Convert to `src/components/dashboard/SellerDashboard.tsx`
- Wire into role page for seller
- Verify + Commit: `feat(dashboard): import seller dashboard from Stitch`

### Task 4: Landlord Dashboard
- Fetch Stitch screen `38ca6396317d484c9b7778299a9db33e`
- Convert to `src/components/dashboard/LandlordDashboard.tsx`
- Wire into role page for landlord
- Verify + Commit: `feat(dashboard): import landlord dashboard from Stitch`

### Task 5: Agent Dashboard
- Fetch Stitch screen `55326c15010842808ecc0ca57c57a3dc`
- Convert to `src/components/dashboard/AgentDashboard.tsx`
- Wire into role page for agent
- Verify + Commit: `feat(dashboard): import agent dashboard from Stitch`

### Task 6: Provider Dashboard
- Fetch Stitch screen `4b449e2a02ae419dafcebede08dca1ee`
- Convert to `src/components/dashboard/ProviderDashboard.tsx`
- Wire into role page for service_provider
- Verify + Commit: `feat(dashboard): import provider dashboard from Stitch`

### Task 7: Messaging Center
- Fetch Stitch screen `73d07387809f4bf3b6617290de33b97f`
- Convert to updated `src/app/(protected)/inbox/page.tsx` + components in `src/components/messaging/`
- Verify + Commit: `feat(messaging): import messaging center from Stitch`

### Task 8: Final Token Alignment
- Scan all new files for hardcoded hex values
- Replace with Britestate design tokens
- `pnpm build` + `pnpm lint` must pass
- Commit: `style: replace hardcoded hex values with Britestate tokens`

## Done Criteria

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] Buyer/Renter dashboard renders with stats, new matches, upcoming viewings, activity feed
- [ ] Seller dashboard renders with listing performance, enquiries, offers summary
- [ ] Landlord dashboard renders with portfolio overview, compliance alerts, rent status, maintenance
- [ ] Agent dashboard renders with pipeline stats, lead summary, viewings, performance
- [ ] Provider dashboard renders with job stats, verification status, earnings, pending quotes
- [ ] Messaging center renders with conversation list + message thread
- [ ] No hardcoded hex values in any new file
- [ ] All dashboards use mock data with realistic UK property context

## Chunk 2 (Future)

Dashboard sub-pages (25 screens) + profile/settings (5 screens) — to be designed after Chunk 1 is complete.

### Chunk 2 Screen Reference

**Buyer sub-pages:** Saved Properties (`4fce8bcc`), Viewings & Calendar (`d5a40159`), AI Matches (`c034ac43`)
**Seller sub-pages:** Listings Mgmt (`abda8d0a`), Analytics (`d2e0cda4`), Sale Progression (`cc313ce5`), Valuation (`489d1e40`)
**Landlord sub-pages:** Portfolio (`65a97db8`), Tenancy Hub (`c247835e`), Compliance (`c45b9e67`), Rent Collection (`1240ef23`), Maintenance (`5eb76546`), Financials (`0685ef39`)
**Agent sub-pages:** Leads (`fb117d19`), Viewings (`83fc4ef9`), Reports (`0231272`), Kanban (`abb29577`), CRM (`87ef750a`), Team (`3bd435a4`), Integrations (`f47b0c69`)
**Provider sub-pages:** Job Leads (`11e53dcf`), Reviews (`2caad1db`), Analytics (`c43273aa`), Availability (`5b1d4bfa`)
**Communication:** Offers Dashboard (`e1c597b3`), Offer Detail (`c778fa17`)
**Profile/Settings:** Personal (`29f9b066`), Professional (`2389a8d1`), Notifications (`e31831e0`), Security (`5c3b2489`), Privacy (`e816a005`)
