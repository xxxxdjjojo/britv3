# Phase 3: Dashboards & Communication - Research

**Researched:** 2026-03-07
**Domain:** Role-specific dashboards, polling-based messaging, AI quote drafting, event-based notifications, milestone tracking
**Confidence:** HIGH

## Summary

Phase 3 combines two epics: Epic 3 (User Dashboards & Profile Management) and Epic 5 (Communication, Quoting & Collaboration). Together they deliver 6 role-specific dashboards with aggregated API + Redis caching, a polling-based messaging system (no WebSockets at MVP), AI-powered quote drafting for tradespeople and agents via Claude Haiku, an event-based notification system (in-app + email via Resend), and milestone tracking for transactions and service jobs.

The primary technical challenge is building an efficient aggregated dashboard API that consolidates 8-12 individual queries into 1-2 calls using PostgreSQL RPC functions and Upstash Redis caching. The messaging system deliberately avoids WebSocket complexity -- using 30-second polling via `@tanstack/react-query` `refetchInterval`. The notification system uses an event-based architecture (O(1) writes per action, not per-recipient fan-out) to keep costs at near-zero. AI quote drafting uses Claude Haiku with structured JSON output, costing approximately GBP 0.001 per draft.

The codebase already has Supabase clients, Zod, react-hook-form, Shadcn UI, and Vitest from Phase 1. Phase 3 adds Upstash Redis for caching, `@anthropic-ai/sdk` for AI quote drafting, Resend + React Email for email notifications, sharp for server-side image processing, file-type for upload validation, and isomorphic-dompurify for input sanitization.

**Primary recommendation:** Use PostgreSQL RPC functions for aggregated dashboard queries cached in Upstash Redis (5-minute TTL), `@tanstack/react-query` with `refetchInterval: 30000` for inbox polling, `@anthropic-ai/sdk` with structured JSON output for quote drafting, and Resend with React Email components for notifications.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Homebuyer dashboard with saved properties, active searches, upcoming viewings | Aggregated RPC function + Redis cache, role-conditional data fetching |
| DASH-02 | Renter dashboard with saved rentals, application status, tenancy details | Same aggregated pattern as DASH-01, role-specific query branch |
| DASH-03 | Seller dashboard with listing performance, viewing requests, offers | Aggregated query pulling from listings + materialized view counts |
| DASH-04 | Landlord dashboard with portfolio overview, occupancy, income | Aggregated query with property portfolio joins |
| DASH-05 | Agent dashboard with active listings, leads pipeline, viewings, revenue | Aggregated query with listings + lead pipeline data |
| DASH-06 | Provider dashboard with verification status, active jobs, rating, earnings | Aggregated query joining service_provider_details + bookings |
| DASH-07 | Aggregated dashboard API (1-2 calls instead of 8-12) | PostgreSQL `get_user_dashboard()` RPC function, single materialized view |
| DASH-08 | Dashboard caching via Upstash Redis | `@upstash/redis` with 5-minute TTL, cache invalidation on profile/data updates |
| DASH-09 | Profile CRUD with Zod validation for all roles | Zod schemas per role, react-hook-form integration, server action validation |
| DASH-10 | Profile picture upload with client-side compression | Canvas API client-side compression + sharp server-side resize to 400x400 WebP |
| DASH-11 | Service provider extended profile (services, coverage area, pricing) | Upsert to service_provider_details with JSONB pricing column |
| DASH-12 | Activity log with cursor-based pagination | Partitioned activity_log table, `WHERE created_at < cursor` pattern |
| DASH-13 | Notification preferences per user | JSONB `preferences` column on profiles table, Zod schema validation |
| DASH-14 | Real-time dashboard updates via Supabase Realtime | Supabase Realtime channel subscription for postgres_changes on relevant tables |
| COM-01 | Contextual messaging from listings, bookings, RFQs | `conversations` table with context_type/context_id, pre-filled contact forms |
| COM-02 | Polling-based inbox with 30s refresh | `@tanstack/react-query` useQuery with `refetchInterval: 30000` |
| COM-03 | Message thread with cursor-based pagination | `WHERE created_at < cursor ORDER BY created_at DESC LIMIT 20` on messages table |
| COM-04 | File attachments in messages (compressed, 2MB limit) | Canvas API client-side image compression to 500KB, Supabase Storage with RLS |
| COM-05 | Per-conversation "last read" timestamp | `conversation_read_status` table, single UPDATE on conversation open |
| COM-06 | AI quote drafting for tradespeople via Claude Haiku | `@anthropic-ai/sdk` structured JSON output with rate card + market pricing context |
| COM-07 | AI quote drafting for estate agents via Claude Haiku | Same SDK, different prompt template with Land Registry comparables |
| COM-08 | Trader rate card management | JSONB `pricing` column on service_provider_details, form with Zod validation |
| COM-09 | Market pricing intelligence data | `market_pricing` table seeded with public trade data, weekly pg_cron recalculation |
| COM-10 | Event-based in-app notification feed | `platform_events` table, O(1) writes, query filtered by user's entity IDs |
| COM-11 | Email notifications (immediate critical + daily digest) | Resend SDK + React Email templates, rate limiting (5/hr/user), pg_cron digest at 8am |
| COM-12 | Notification preferences per-type with quiet hours | Stored in profiles.preferences JSONB, checked before email dispatch |
| COM-13 | Files tab on bookings/transactions | Query messages attachments by conversation context + direct uploads to Supabase Storage |
| COM-14 | Transaction milestones (8-step UK property pipeline) | `transaction_milestones` table with hardcoded template, status + notes per step |
| COM-15 | Service job milestones (5-step pipeline) | `service_job_milestones` table, same pattern as transaction milestones |
</phase_requirements>

## Standard Stack

### Core (New for Phase 3)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@upstash/redis` | ^1.36.3 | Dashboard caching, rate limiting | Serverless Redis, works in Vercel Edge/serverless, free tier covers MVP |
| `@upstash/ratelimit` | ^2.0 | Email rate limiting (5/hr/user) | Built on @upstash/redis, sliding window algorithm |
| `@anthropic-ai/sdk` | ^0.52 | Claude Haiku API for AI quote drafting | Official SDK, supports structured JSON output |
| `resend` | ^4.0 | Transactional email sending | Simple API, React Email integration, free tier (100 emails/day) |
| `@react-email/components` | ^0.0.31 | Email template components | React-based email templates, renders to HTML |
| `@tanstack/react-query` | ^5.62 | Client-side async state, inbox polling | Industry standard, refetchInterval for polling, cache management |
| `sharp` | ^0.33 | Server-side image resize/optimize | 4-5x faster than ImageMagick, WebP output, EXIF stripping |
| `file-type` | ^19.6 | Server-side file validation via magic bytes | Detects actual file type regardless of extension |
| `isomorphic-dompurify` | ^2.20 | XSS sanitization (client + server) | Works in SSR and client, wraps DOMPurify for isomorphic use |

### Already Installed (from Phase 1)
| Library | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.98.0 | Supabase client (DB, Auth, Storage, Realtime) |
| `@supabase/ssr` | ^0.9.0 | Server-side Supabase with cookies |
| `zod` | ^4.3.6 | Schema validation |
| `react-hook-form` | ^7.71 | Form state management |
| `@hookform/resolvers` | ^5.2 | Zod resolver for RHF |
| `lucide-react` | ^0.577 | Icons |
| `shadcn` | ^4.0 | UI component system |
| `sonner` | ^2.0 | Toast notifications |

### Shadcn UI Components (additional for Phase 3)
Install via CLI: `progress`, `textarea`, `tooltip`, `popover`, `scroll-area`, `switch`, `skeleton`, `table`, `command` (for search in inbox).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@tanstack/react-query` polling | Supabase Realtime | WebSockets add complexity/cost; polling is explicitly chosen per spec |
| `@upstash/redis` | Vercel KV | Upstash has better free tier and is already in the project spec |
| `@anthropic-ai/sdk` | Vercel AI SDK (`@ai-sdk/anthropic`) | Direct SDK is simpler for structured output, no streaming needed |
| `isomorphic-dompurify` | `sanitize-html` | DOMPurify is more battle-tested, isomorphic wrapper handles SSR |
| `sharp` (server) | Client-side only compression | Server-side ensures consistent output quality and strips EXIF reliably |

**Installation:**
```bash
cd britv3.0
pnpm add @upstash/redis @upstash/ratelimit @anthropic-ai/sdk resend @react-email/components @tanstack/react-query sharp file-type isomorphic-dompurify
pnpm add -D @types/dompurify
pnpm dlx shadcn@latest add progress textarea tooltip popover scroll-area switch skeleton table command
```

## Architecture Patterns

### Recommended Project Structure (Phase 3 additions)
```
britv3.0/src/
├── app/
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   ├── [role]/
│   │   │   │   ├── page.tsx              # Role-specific dashboard content
│   │   │   │   └── layout.tsx            # Role sidebar (from Phase 1)
│   │   │   └── layout.tsx                # Dashboard query provider
│   │   ├── profile/
│   │   │   ├── page.tsx                  # Profile management
│   │   │   └── settings/page.tsx         # Notification preferences
│   │   ├── inbox/
│   │   │   ├── page.tsx                  # Conversation list (inbox)
│   │   │   └── [conversationId]/
│   │   │       └── page.tsx              # Message thread view
│   │   ├── notifications/
│   │   │   └── page.tsx                  # Full notification history
│   │   └── milestones/
│   │       ├── transaction/[id]/page.tsx # Transaction milestone view
│   │       └── job/[bookingId]/page.tsx  # Service job milestone view
│   ├── api/
│   │   ├── dashboard/route.ts            # Aggregated dashboard API
│   │   ├── profile/
│   │   │   ├── route.ts                  # Profile CRUD
│   │   │   └── picture/route.ts          # Profile picture upload
│   │   ├── service-provider/
│   │   │   └── profile/route.ts          # Extended provider profile
│   │   ├── messages/
│   │   │   ├── route.ts                  # List conversations / send message
│   │   │   └── [conversationId]/
│   │   │       ├── route.ts              # Get/send messages in thread
│   │   │       └── read/route.ts         # Update last_read_at
│   │   ├── attachments/
│   │   │   └── route.ts                  # File upload for messages
│   │   ├── ai/
│   │   │   └── quote-draft/route.ts      # AI quote drafting endpoint
│   │   ├── notifications/
│   │   │   ├── route.ts                  # Get notification feed
│   │   │   ├── read/route.ts             # Mark all as read
│   │   │   └── preferences/route.ts      # Update notification prefs
│   │   ├── milestones/
│   │   │   ├── transaction/route.ts      # Transaction milestones CRUD
│   │   │   └── job/route.ts              # Service job milestones CRUD
│   │   └── email/
│   │       └── digest/route.ts           # Cron-triggered daily digest
├── components/
│   ├── dashboard/
│   │   ├── DashboardShell.tsx            # Shared dashboard layout
│   │   ├── StatCard.tsx                  # Metric card component
│   │   ├── ActivityFeed.tsx              # Activity log widget
│   │   ├── homebuyer/                    # Role-specific widgets
│   │   ├── renter/
│   │   ├── seller/
│   │   ├── landlord/
│   │   ├── agent/
│   │   └── provider/
│   ├── profile/
│   │   ├── ProfileForm.tsx               # General profile form
│   │   ├── AvatarUpload.tsx              # Profile picture upload
│   │   ├── ProviderProfileForm.tsx       # Extended provider fields
│   │   └── NotificationPreferences.tsx   # Notification settings
│   ├── messaging/
│   │   ├── InboxList.tsx                 # Conversation list
│   │   ├── MessageThread.tsx             # Chat-like message view
│   │   ├── MessageComposer.tsx           # Input + attach button
│   │   ├── ContactForm.tsx               # Contextual contact form
│   │   ├── AttachmentPreview.tsx         # File preview in messages
│   │   └── UnreadBadge.tsx               # Unread count in nav
│   ├── notifications/
│   │   ├── NotificationBell.tsx          # Bell icon with dropdown
│   │   ├── NotificationFeed.tsx          # Notification list
│   │   └── NotificationItem.tsx          # Single notification row
│   ├── milestones/
│   │   ├── MilestoneTracker.tsx          # Progress stepper component
│   │   ├── TransactionMilestones.tsx     # 8-step property pipeline
│   │   └── JobMilestones.tsx             # 5-step service pipeline
│   ├── ai/
│   │   ├── QuoteDraftButton.tsx          # "Draft Quote with AI" button
│   │   ├── MarketComparison.tsx          # Price comparison banner
│   │   └── AIDraftBadge.tsx              # "AI Draft" label badge
│   └── files/
│       └── FilesTab.tsx                  # Document list on bookings
├── hooks/
│   ├── useDashboard.ts                   # Dashboard data + cache
│   ├── useInbox.ts                       # Inbox polling (30s)
│   ├── useMessages.ts                    # Message thread + send
│   ├── useNotifications.ts              # Notification feed + count
│   └── useRealtime.ts                   # Supabase Realtime wrapper
├── services/
│   ├── dashboard/
│   │   └── dashboard-service.ts          # Dashboard data aggregation
│   ├── messaging/
│   │   ├── message-service.ts            # Message CRUD
│   │   └── attachment-service.ts         # File upload/validation
│   ├── ai/
│   │   └── quote-draft-service.ts        # AI quote generation logic
│   ├── notifications/
│   │   ├── notification-service.ts       # Event creation + feed query
│   │   └── email-service.ts             # Resend email dispatch
│   ├── profile/
│   │   └── profile-service.ts            # Profile CRUD + image upload
│   └── milestones/
│       └── milestone-service.ts          # Milestone CRUD
├── lib/
│   ├── cache/
│   │   └── redis.ts                      # Upstash Redis client singleton
│   ├── validation/
│   │   └── sanitize.ts                   # XSS sanitization utilities
│   └── email/
│       └── templates/                    # React Email templates
│           ├── MessageNotification.tsx
│           ├── QuoteReceived.tsx
│           ├── BookingConfirmed.tsx
│           └── DailyDigest.tsx
└── types/
    ├── dashboard.ts                      # Dashboard data types per role
    ├── messaging.ts                      # Conversation, Message types
    ├── notifications.ts                  # PlatformEvent, preferences types
    └── milestones.ts                     # Milestone template types
```

### Pattern 1: Aggregated Dashboard API with Redis Cache
**What:** Single RPC call fetches all dashboard data, cached in Redis for 5 minutes.
**When to use:** Every dashboard page load.
**Example:**
```typescript
// services/dashboard/dashboard-service.ts
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function getDashboardData(userId: string, role: string) {
  const cacheKey = `dashboard:${userId}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return { data: cached, cached: true };

  // Call aggregated RPC function
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_user_dashboard", {
    p_user_id: userId,
  });

  if (error) throw error;

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, data);

  return { data, cached: false };
}

export async function invalidateDashboardCache(userId: string) {
  await redis.del(`dashboard:${userId}`);
}
```

### Pattern 2: Polling-Based Inbox with React Query
**What:** Inbox data refreshes every 30 seconds via refetchInterval.
**When to use:** Inbox page and unread badge in navigation.
**Example:**
```typescript
// hooks/useInbox.ts
import { useQuery } from "@tanstack/react-query";

export function useInbox() {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error("Failed to fetch inbox");
      return res.json();
    },
    refetchInterval: 30_000, // 30 seconds
    refetchIntervalInBackground: false, // Don't poll when tab is hidden
    staleTime: 10_000, // Consider data fresh for 10s
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/messages?count_only=true");
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
```

### Pattern 3: AI Quote Drafting with Structured Output
**What:** Single Claude Haiku API call returns structured JSON for quote pre-fill.
**When to use:** "Draft Quote with AI" button on RFQ detail page.
**Example:**
```typescript
// services/ai/quote-draft-service.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type QuoteDraft = Readonly<{
  line_items: Array<{ description: string; amount: number }>;
  total: number;
  estimated_duration: string;
  scope_of_work: string;
}>;

export async function draftQuote(
  rfqDescription: string,
  rateCard: Record<string, unknown>,
  marketPricing: Record<string, unknown>,
): Promise<QuoteDraft | null> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4.5-20250315",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a quoting assistant for a UK tradesperson. Based on the following RFQ, the trader's rate card, and market pricing data, draft a competitive quote.

RFQ: ${rfqDescription}

Trader Rate Card: ${JSON.stringify(rateCard)}

Market Pricing: ${JSON.stringify(marketPricing)}

Respond with JSON only: { "line_items": [{"description": "...", "amount": 0.00}], "total": 0.00, "estimated_duration": "...", "scope_of_work": "..." }`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return JSON.parse(text) as QuoteDraft;
  } catch {
    // Fallback: return null, UI shows empty form with rate card pre-fill
    return null;
  }
}
```

### Pattern 4: Event-Based Notifications (O(1) Writes)
**What:** Single event INSERT per action, not per recipient. Notifications resolved at read time.
**When to use:** All notification-triggering actions (new message, quote received, booking confirmed, etc.).
**Example:**
```typescript
// services/notifications/notification-service.ts
export async function createPlatformEvent(
  supabase: SupabaseClient,
  event: {
    event_type: string;
    entity_type: string;
    entity_id: string;
    actor_id: string;
    metadata?: Record<string, unknown>;
  },
) {
  return supabase.from("platform_events").insert({
    event_type: event.event_type,
    entity_type: event.entity_type,
    entity_id: event.entity_id,
    actor_id: event.actor_id,
    metadata: event.metadata ?? {},
  });
}

// Query: get notifications for a user
export async function getNotificationFeed(
  supabase: SupabaseClient,
  userEntityIds: string[], // conversation IDs, booking IDs, etc.
  limit = 50,
) {
  return supabase
    .from("platform_events")
    .select("*")
    .in("entity_id", userEntityIds)
    .order("created_at", { ascending: false })
    .limit(limit);
}
```

### Pattern 5: Email Notifications with Resend + React Email
**What:** Immediate emails for critical events, batched daily digest for non-critical.
**When to use:** After platform event creation, filtered by user preferences.
**Example:**
```typescript
// services/notifications/email-service.ts
import { Resend } from "resend";
import { QuoteReceivedEmail } from "@/lib/email/templates/QuoteReceived";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCriticalEmail(
  to: string,
  template: React.ReactElement,
  subject: string,
) {
  return resend.emails.send({
    from: "Britestate <notifications@britestate.com>",
    to,
    subject,
    react: template,
  });
}
```

### Pattern 6: Cursor-Based Pagination for Messages
**What:** Use `created_at` timestamp as cursor, not OFFSET.
**When to use:** Message history, activity log, notification feed.
**Example:**
```typescript
// Cursor-based query for message thread
const { data: messages } = await supabase
  .from("messages")
  .select("id, sender_id, content, attachment_url, attachment_type, created_at")
  .eq("conversation_id", conversationId)
  .lt("created_at", cursor) // WHERE created_at < cursor
  .order("created_at", { ascending: false })
  .limit(20);
```

### Anti-Patterns to Avoid
- **N+1 dashboard queries:** Never make 8-12 individual API calls for dashboard data. Use a single aggregated RPC function.
- **WebSocket for messaging at MVP:** The spec explicitly states polling-based inbox. WebSockets add complexity and cost with no user benefit at current scale.
- **Per-message read receipts:** Use single `last_read_at` timestamp per conversation per user, not per-message tracking.
- **Fan-out notification writes:** Never INSERT one row per recipient per event. Use event-based architecture -- one INSERT per action, query at read time.
- **OFFSET-based pagination:** Always use cursor-based pagination (`WHERE created_at < cursor`). OFFSET degrades as data grows.
- **Unbounded activity log queries:** Always use LIMIT + cursor. The activity_log table must be partitioned by time.
- **Client-only image validation:** Always validate file type server-side using magic bytes (`file-type` library), not just MIME type from browser.
- **Sending raw image uploads:** Always compress client-side (Canvas API, target 500KB for chat attachments) AND server-side (sharp for profile pictures to 400x400 WebP).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dashboard caching | Custom in-memory cache | `@upstash/redis` with TTL | Survives serverless cold starts, shared across instances |
| Email rate limiting | Custom counter logic | `@upstash/ratelimit` sliding window | Handles edge cases (distributed, atomic) |
| AI quote generation | Custom LLM wrapper | `@anthropic-ai/sdk` with structured output | Official SDK handles retries, timeouts, token counting |
| Email sending | Custom SMTP/SES | Resend with React Email templates | Handles deliverability, templates, unsubscribe |
| Image optimization | Custom resize logic | `sharp` (server) + Canvas API (client) | 4-5x faster, handles EXIF, edge cases |
| File type detection | Extension checking | `file-type` magic bytes | Cannot be spoofed like extensions |
| XSS sanitization | Custom regex | `isomorphic-dompurify` | Battle-tested, handles edge cases regex misses |
| Async state + polling | Custom setInterval | `@tanstack/react-query` refetchInterval | Handles stale data, error retry, background tab |

**Key insight:** This phase combines 6 distinct feature domains (dashboards, profiles, messaging, AI quotes, notifications, milestones). Using established libraries for each cross-cutting concern (caching, email, AI, file handling) prevents compounding custom code that would be brittle and hard to maintain.

## Common Pitfalls

### Pitfall 1: Dashboard N+1 Query Problem
**What goes wrong:** Making 8-12 sequential API calls per dashboard load, resulting in 4+ second load times.
**Why it happens:** Building each dashboard widget as an independent data fetcher.
**How to avoid:** Create a PostgreSQL RPC function (`get_user_dashboard`) that aggregates all data in a single query. Cache the result in Redis for 5 minutes. Invalidate cache on profile/data updates.
**Warning signs:** Dashboard load time >500ms; multiple simultaneous API calls visible in Network tab.

### Pitfall 2: Activity Log Query Degradation
**What goes wrong:** Activity log queries slow to 15+ seconds after 6 months of data.
**Why it happens:** Unbounded queries with no LIMIT, no table partitioning.
**How to avoid:** Partition `activity_log` table by month (RANGE on `created_at`). Always use cursor-based pagination with LIMIT. Set 12-month retention with automated cleanup.
**Warning signs:** Activity log page load increasing over time; database CPU spikes.

### Pitfall 3: Profile Picture Storage Costs
**What goes wrong:** Raw 4.8MB uploads stored without optimization, bandwidth costs spiral.
**Why it happens:** No client-side compression, no server-side resize, no CDN cache headers.
**How to avoid:** Client-side Canvas API compression before upload. Server-side `sharp` resize to 400x400 WebP with quality 85. Set `cacheControl: '31536000'` (1 year) on Supabase Storage uploads. Strip EXIF metadata.
**Warning signs:** Storage bucket growing faster than user count; high bandwidth costs.

### Pitfall 4: Notification Fan-Out Explosion
**What goes wrong:** Creating one notification row per user per event causes O(n) writes and table bloat.
**Why it happens:** Traditional notification pattern (one row per recipient per notification).
**How to avoid:** Use event-based architecture: one INSERT into `platform_events` per action. At read time, query events WHERE `entity_id` IN (user's conversations, bookings, etc.). Track "last read" via single `notifications_read_at` timestamp on user profile.
**Warning signs:** platform_events table growing faster than expected; slow notification feed queries.

### Pitfall 5: AI Quote Draft Timeout
**What goes wrong:** AI API call takes too long, blocking the user.
**Why it happens:** No timeout, no fallback strategy.
**How to avoid:** Set 5-second timeout on Claude API call. If it fails or times out, fall back to template-based quote form pre-filled from trader's rate card. Show loading state during AI call. Label AI-generated content with "AI Draft" badge.
**Warning signs:** Quote drafting hanging; users abandoning the flow.

### Pitfall 6: Email Cost Explosion
**What goes wrong:** Sending immediate emails for every event burns through Resend free tier.
**Why it happens:** No distinction between critical and non-critical events, no rate limiting.
**How to avoid:** Only immediate emails for critical events (quote received, booking confirmed, offer received). Max 5 immediate emails/user/hour via `@upstash/ratelimit`. Batch everything else into daily digest at 8am UTC via pg_cron. Check user notification preferences before sending.
**Warning signs:** Resend free tier quota exhausted; user email complaints.

### Pitfall 7: Supabase Realtime Cost on DASH-14
**What goes wrong:** Subscribing to too many Realtime channels per user.
**Why it happens:** Creating a channel per table/entity instead of consolidating.
**How to avoid:** Use Realtime selectively -- subscribe to a single channel per user for dashboard-relevant changes. For messaging, use polling (30s) not Realtime. Only use Realtime for critical dashboard updates (new booking, status change).
**Warning signs:** Hitting Supabase Realtime connection limits; high concurrent connection count.

### Pitfall 8: Missing RLS on New Tables
**What goes wrong:** Data leaks between users because new tables lack Row Level Security.
**Why it happens:** Forgetting to enable RLS + create policies on conversations, messages, platform_events, milestones tables.
**How to avoid:** Every migration must include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and appropriate SELECT/INSERT/UPDATE/DELETE policies. Test RLS by querying as different users.
**Warning signs:** Users can see other users' conversations or notifications.

## Code Examples

### Database Schema: Conversations & Messages
```sql
-- Source: Epic 5 spec (docs/epic5final.md)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES auth.users(id),
  participant_2_id UUID NOT NULL REFERENCES auth.users(id),
  context_type TEXT NOT NULL CHECK (context_type IN ('listing', 'booking', 'rfq', 'general')),
  context_id UUID,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL CHECK (LENGTH(content) <= 5000),
  attachment_url TEXT,
  attachment_type TEXT CHECK (attachment_type IN ('image', 'pdf')),
  attachment_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_read_status (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Indexes
CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_conversations_participant_1 ON conversations (participant_1_id, last_message_at DESC);
CREATE INDEX idx_conversations_participant_2 ON conversations (participant_2_id, last_message_at DESC);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_read_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversations" ON conversations
  FOR SELECT TO authenticated
  USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

CREATE POLICY "Users create conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

CREATE POLICY "Users view messages in own conversations" ON messages
  FOR SELECT TO authenticated
  USING (conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  ));

CREATE POLICY "Users send messages in own conversations" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
  );

CREATE POLICY "Users update own read status" ON conversation_read_status
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Database Schema: Platform Events & Milestones
```sql
-- Source: Epic 5 spec (docs/epic5final.md)
CREATE TABLE platform_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('conversation', 'booking', 'listing', 'rfq', 'transaction')),
  entity_id UUID NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_events_entity ON platform_events (entity_id, created_at DESC);
CREATE INDEX idx_platform_events_cleanup ON platform_events (created_at)
  WHERE created_at < NOW() - INTERVAL '90 days';

CREATE TABLE market_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category TEXT NOT NULL,
  region TEXT NOT NULL,
  price_low NUMERIC(10,2),
  price_median NUMERIC(10,2),
  price_high NUMERIC(10,2),
  sample_size INTEGER DEFAULT 0,
  data_source TEXT NOT NULL CHECK (data_source IN ('seed', 'platform', 'blended')),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_category, region)
);

-- Market pricing: public read, admin-only write
ALTER TABLE market_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read market pricing" ON market_pricing
  FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE transaction_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  milestone_key TEXT NOT NULL CHECK (milestone_key IN (
    'offer_accepted', 'mortgage_submitted', 'survey_instructed',
    'survey_completed', 'conveyancing_started', 'searches_completed',
    'contracts_exchanged', 'completion'
  )),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  completed_date DATE,
  UNIQUE(transaction_id, milestone_key)
);

CREATE TABLE service_job_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  milestone_key TEXT NOT NULL CHECK (milestone_key IN (
    'quote_accepted', 'job_scheduled', 'work_started', 'work_completed', 'payment_received'
  )),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(booking_id, milestone_key)
);

CREATE INDEX idx_transaction_milestones_txn ON transaction_milestones (transaction_id);
CREATE INDEX idx_service_job_milestones_booking ON service_job_milestones (booking_id);
```

### React Query Provider Setup
```typescript
// app/(protected)/layout.tsx or a dedicated providers file
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### React Email Template Example
```typescript
// lib/email/templates/QuoteReceived.tsx
import {
  Body, Container, Head, Heading, Html, Link,
  Preview, Section, Text, Button,
} from "@react-email/components";

export function QuoteReceivedEmail({
  recipientName,
  providerName,
  quoteAmount,
  quoteUrl,
}: Readonly<{
  recipientName: string;
  providerName: string;
  quoteAmount: string;
  quoteUrl: string;
}>) {
  return (
    <Html>
      <Head />
      <Preview>New quote from {providerName}</Preview>
      <Body style={{ fontFamily: "Inter, sans-serif" }}>
        <Container>
          <Heading>New Quote Received</Heading>
          <Text>Hi {recipientName},</Text>
          <Text>
            {providerName} has sent you a quote for {quoteAmount}.
          </Text>
          <Section>
            <Button href={quoteUrl} style={{ backgroundColor: "#1B4D3E", color: "#fff", padding: "12px 24px", borderRadius: "8px" }}>
              View Quote
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

### Client-Side Image Compression
```typescript
// lib/utils/compress-image.ts
export async function compressImage(
  file: File,
  maxSizeKB: number = 500,
  maxWidth: number = 1200,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(blob);
        },
        "image/jpeg",
        0.8,
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSocket real-time chat | Polling-based inbox (30s) | Cost optimization 2026 | $0/mo vs $500+/mo at scale |
| Per-message read receipts | Per-conversation `last_read_at` | Cost optimization 2026 | O(1) update vs O(n) per message view |
| Fan-out notifications | Event-based O(1) writes | Cost optimization 2026 | 1 INSERT per action vs 1 per recipient |
| BullMQ job queues | Inngest async jobs (Epic 4) | Cost optimization 2026 | Serverless-native, no Redis queue infra |
| Custom email rendering | React Email components | 2024-2025 | Type-safe, component-based email templates |
| `swr` for data fetching | `@tanstack/react-query` v5 | 2024 | Better polling, caching, devtools |
| ImageMagick/GM for images | `sharp` + Canvas API | Long established | 4-5x faster, smaller footprint |

**Deprecated/outdated:**
- Building WebSocket chat for property portals at MVP (polling is sufficient and cheaper)
- Per-message read receipts (per-conversation is adequate per Zoopla/Rightmove benchmarks)
- Fan-out notification writes (event-based is standard for scale)
- `@supabase/auth-helpers-nextjs` (use `@supabase/ssr`)

## Open Questions

1. **pg_partman availability on Supabase**
   - What we know: Epic 3 spec uses `pg_partman` for activity_log partitioning. Supabase supports native PostgreSQL partitioning.
   - What's unclear: Whether Supabase hosted instances have `pg_partman` extension available, or if we need native PostgreSQL PARTITION BY RANGE.
   - Recommendation: Use native PostgreSQL partitioning (`PARTITION BY RANGE`) which is always available, rather than relying on the `pg_partman` extension. Create partitions manually in migration scripts for the first 12 months.

2. **pg_cron for daily digest and cleanup jobs**
   - What we know: Epic 5 requires pg_cron for daily digest at 8am, 90-day notification cleanup, weekly market pricing recalculation, and 12-month attachment cleanup.
   - What's unclear: Whether Supabase's pg_cron support is sufficient for all these jobs, or if Inngest/Vercel Cron is needed as alternative.
   - Recommendation: Use Supabase pg_cron (available on Pro plan) for database-level cleanup jobs. Use Vercel Cron or Inngest for the daily digest email job since it requires Resend API calls.

3. **Transaction table dependency for COM-14**
   - What we know: Transaction milestones reference a `transaction_id`, but transactions are Phase 6 scope (Landlord Tools).
   - What's unclear: Whether to create a stub transactions table now or make the milestone tracking independent.
   - Recommendation: Create the `transaction_milestones` table with a UUID `transaction_id` column but no foreign key constraint yet. Add the FK constraint in Phase 6 when the transactions table exists. This allows milestone UI components to be built and tested now.

4. **Marketplace tables dependency for COM-01, COM-06, COM-08**
   - What we know: Messaging from bookings/RFQs and AI quote drafting depend on Epic 4 (Marketplace) tables (bookings, rfqs, quotes, service_provider_details).
   - What's unclear: Whether Phase 2 (Property Portal) will have created enough schema for contextual messaging, or if messaging from bookings context must wait for Phase 4.
   - Recommendation: Build messaging for listing context (COM-01 partial) in Phase 3. For booking/RFQ context, create the message service to accept any context_type but only wire up "listing" context in the UI. AI quote drafting (COM-06, COM-07) should be fully implemented as a service but the UI trigger depends on Phase 4's RFQ page. Create the `market_pricing` table and seed data now since it has no dependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library 16.3 |
| Config file | `vitest.config.mts` (created in Phase 1) |
| Quick run command | `pnpm test --run` |
| Full suite command | `pnpm test:run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Homebuyer dashboard loads with saved properties | integration | `pnpm test src/__tests__/dashboard/homebuyer.test.ts` | No -- Wave 0 |
| DASH-02 | Renter dashboard loads with saved rentals | integration | `pnpm test src/__tests__/dashboard/renter.test.ts` | No -- Wave 0 |
| DASH-03 | Seller dashboard loads with listing performance | integration | `pnpm test src/__tests__/dashboard/seller.test.ts` | No -- Wave 0 |
| DASH-04 | Landlord dashboard loads with portfolio data | integration | `pnpm test src/__tests__/dashboard/landlord.test.ts` | No -- Wave 0 |
| DASH-05 | Agent dashboard loads with listings and pipeline | integration | `pnpm test src/__tests__/dashboard/agent.test.ts` | No -- Wave 0 |
| DASH-06 | Provider dashboard loads with verification and jobs | integration | `pnpm test src/__tests__/dashboard/provider.test.ts` | No -- Wave 0 |
| DASH-07 | Dashboard API returns aggregated data in 1-2 calls | unit | `pnpm test src/__tests__/dashboard/api.test.ts` | No -- Wave 0 |
| DASH-08 | Dashboard data cached and cache invalidated correctly | unit | `pnpm test src/__tests__/dashboard/cache.test.ts` | No -- Wave 0 |
| DASH-09 | Profile CRUD with Zod validation | unit | `pnpm test src/__tests__/profile/crud.test.ts` | No -- Wave 0 |
| DASH-10 | Profile picture upload with compression | integration | `pnpm test src/__tests__/profile/picture.test.ts` | No -- Wave 0 |
| DASH-11 | Provider extended profile saves correctly | unit | `pnpm test src/__tests__/profile/provider.test.ts` | No -- Wave 0 |
| DASH-12 | Activity log with cursor-based pagination | unit | `pnpm test src/__tests__/dashboard/activity.test.ts` | No -- Wave 0 |
| DASH-13 | Notification preferences saved and retrieved | unit | `pnpm test src/__tests__/notifications/preferences.test.ts` | No -- Wave 0 |
| DASH-14 | Realtime dashboard updates received | integration | `pnpm test src/__tests__/dashboard/realtime.test.ts` | No -- Wave 0 |
| COM-01 | Contextual message sends from listing page | integration | `pnpm test src/__tests__/messaging/send.test.ts` | No -- Wave 0 |
| COM-02 | Inbox refreshes via polling every 30s | unit | `pnpm test src/__tests__/messaging/inbox.test.ts` | No -- Wave 0 |
| COM-03 | Message thread paginates with cursor | unit | `pnpm test src/__tests__/messaging/thread.test.ts` | No -- Wave 0 |
| COM-04 | File attachments uploaded and validated | unit | `pnpm test src/__tests__/messaging/attachments.test.ts` | No -- Wave 0 |
| COM-05 | Read status updates on conversation open | unit | `pnpm test src/__tests__/messaging/read-status.test.ts` | No -- Wave 0 |
| COM-06 | AI quote draft returns structured JSON | unit | `pnpm test src/__tests__/ai/quote-draft.test.ts` | No -- Wave 0 |
| COM-07 | AI agent proposal returns structured JSON | unit | `pnpm test src/__tests__/ai/agent-proposal.test.ts` | No -- Wave 0 |
| COM-08 | Trader rate card saves to provider profile | unit | `pnpm test src/__tests__/profile/rate-card.test.ts` | No -- Wave 0 |
| COM-09 | Market pricing data seeded and queryable | unit | `pnpm test src/__tests__/ai/market-pricing.test.ts` | No -- Wave 0 |
| COM-10 | Notification feed returns user-relevant events | unit | `pnpm test src/__tests__/notifications/feed.test.ts` | No -- Wave 0 |
| COM-11 | Email sent for critical events, digest for non-critical | integration | `pnpm test src/__tests__/notifications/email.test.ts` | No -- Wave 0 |
| COM-12 | Notification preferences respected in email dispatch | unit | `pnpm test src/__tests__/notifications/prefs-check.test.ts` | No -- Wave 0 |
| COM-13 | Files tab aggregates attachments from conversation | unit | `pnpm test src/__tests__/messaging/files-tab.test.ts` | No -- Wave 0 |
| COM-14 | Transaction milestones display and update | unit | `pnpm test src/__tests__/milestones/transaction.test.ts` | No -- Wave 0 |
| COM-15 | Service job milestones display and update | unit | `pnpm test src/__tests__/milestones/job.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test --run` (quick, affected tests only)
- **Per wave merge:** `pnpm test:run --coverage`
- **Phase gate:** Full suite green + `pnpm build` + `pnpm lint` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/mocks/redis.ts` -- Upstash Redis mock for dashboard cache tests
- [ ] `src/__tests__/mocks/anthropic.ts` -- Anthropic SDK mock for AI quote draft tests
- [ ] `src/__tests__/mocks/resend.ts` -- Resend mock for email notification tests
- [ ] `src/__tests__/mocks/supabase-storage.ts` -- Supabase Storage mock for file upload tests
- [ ] Additional Shadcn UI components: `progress`, `textarea`, `tooltip`, `popover`, `scroll-area`, `switch`, `skeleton`, `table`, `command`

## Sources

### Primary (HIGH confidence)
- [Epic 3 spec](britv3.0/docs/epic3mkd%20claude.txt) -- Detailed dashboard architecture, materialized views, Redis caching, profile management
- [Epic 5 spec](britv3.0/docs/epic5final.md) -- Messaging schema, AI quote drafting, notification architecture, milestone tracking
- [@upstash/redis npm](https://www.npmjs.com/package/@upstash/redis) -- v1.36.3, serverless Redis client
- [@anthropic-ai/sdk npm](https://www.npmjs.com/package/@anthropic-ai/sdk) -- Structured output support for Claude Haiku
- [Resend docs](https://resend.com/docs/send-with-nextjs) -- Next.js integration, React Email support
- [TanStack Query v5 docs](https://tanstack.com/query/v5/docs/react/overview) -- refetchInterval polling pattern
- [Supabase Realtime docs](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) -- Next.js Realtime integration
- [sharp npm](https://www.npmjs.com/package/sharp) -- Server-side image processing
- [file-type npm](https://www.npmjs.com/package/file-type) -- Magic bytes file validation

### Secondary (MEDIUM confidence)
- [Supabase Realtime broadcast_changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) -- Postgres changes subscription
- [React Email 5.0](https://resend.com/blog/react-email-5) -- Latest React Email with React 19 support
- [Anthropic structured outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- JSON schema enforcement

### Tertiary (LOW confidence)
- pg_partman availability on Supabase hosted -- may need native partitioning instead
- Claude Haiku 4.5 model ID -- may have changed since training data; verify before implementation
- Epic 3 performance projections (380ms dashboard load) -- theoretical targets, actual depends on query complexity

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via npm, well-documented integrations
- Architecture: HIGH -- patterns come directly from epic specs with clear schema definitions
- Database schema: HIGH -- detailed table definitions from Epic 5 spec with indexes and RLS
- Pitfalls: HIGH -- identified from epic spec analysis and common Next.js patterns
- AI integration: MEDIUM -- Claude Haiku structured output is documented but model ID should be verified
- pg_cron/partitioning: MEDIUM -- Supabase availability of these features varies by plan

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- stable libraries, established patterns)
