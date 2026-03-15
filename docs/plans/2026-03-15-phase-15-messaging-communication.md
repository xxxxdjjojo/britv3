# Phase 15: Messaging & Communication — CEO Plan Review

**Date:** 2026-03-15
**Mode:** EXPANSION
**Reviewer:** Claude (plan-ceo-review skill)

---

## Pages to Implement

| # | Page | Route |
|---|---|---|
| 15.1 | Inbox — All Conversations | `/inbox` |
| 15.2 | Conversation — Thread View | `/inbox/[conversationId]` |
| 15.3 | Conversation — Attach Files/Photos | (inline in thread) |
| 15.4 | Conversation — Schedule Viewing (inline) | (modal in thread) |
| 15.5 | Conversation — Send Quote (inline) | (modal in thread) |
| 15.6 | Notification Centre — All | `/notifications` |
| 15.7 | Notification Preferences | `/settings/notifications` |
| 15.8 | Email Notification Templates (unsubscribe) | `/unsubscribe` |

---

## Stitch Design References

| Screen | ID | URL |
|---|---|---|
| Inbox — All Conversations | `c617ac3ef08f4a5a815d9ec372965e10` | Project `5956704101394866719` |
| Conversation — Thread View | `94b1cc0c1da34726a8edd0076b7ce7c3` | Project `5956704101394866719` |
| Notification Centre — All | `b74029c164114f8abb70184a1dcf96ce` | Project `5956704101394866719` |
| Notification Preferences | `5afe7edbd9914df1afaaaa1189fb2dcc` | Project `5956704101394866719` |

---

## System Audit Findings

### Critical Pre-Existing Bugs (fix BEFORE any new pages)

| # | Bug | File | Fix |
|---|---|---|---|
| 1 | `getUserEntityIds()` queries `conversation_participants` table — **does not exist**. Schema uses `participant_1_id` / `participant_2_id` columns. | `src/services/notifications/notification-service.ts:195` | Replace with `.or('participant_1_id.eq.${userId},participant_2_id.eq.${userId}')` on `conversations` table |
| 2 | `MessageComposer` selects a file but never passes it to `uploadAttachment()` — **attachments silently dropped** | `src/components/messaging/MessageComposer.tsx:33` | Call `uploadAttachment()` before `sendMutation.mutate()`, pass `attachment_url` + `attachment_type` |
| 3 | `InboxList.tsx` uses **hardcoded mock data** — not connected to Supabase | `src/components/messaging/InboxList.tsx` | Replace `MOCK_CONVERSATIONS` with `useConversations()` hook |
| 4 | `MessageThread.tsx` uses **hardcoded mock data** — not connected to Supabase | `src/components/messaging/MessageThread.tsx` | Replace `MOCK_MESSAGES` with `useMessages(conversationId)` hook + Realtime |
| 5 | `getConversations()` executes **4N+1 Supabase queries** (profile + last message + read status + unread count per conversation) | `src/services/messaging/message-service.ts:42` | Replace with single Supabase RPC using CTEs |
| 6 | `getUnreadCount()` loops through all conversations sequentially — **N×2 queries** | `src/services/messaging/message-service.ts:328` | Replace with single RPC |

---

## Architecture

### System Diagram

```
  Browser                 Next.js App              Supabase
  ────────               ─────────────             ────────────
  InboxPageClient ──────▶ /api/messages/*  ──────▶ conversations
       │                                           messages
       │  Realtime ◀────────────────────── ◀───── (Postgres CDC)
       │  subscription
       ▼
  MessageThread ──────────────────────────────────▶ messages
       │                                           attachment_url
       │  [DISCONNECTED] ◀── attachment-service ── message-attachments
       │                     (exists, not wired)      (Storage)
       ▼
  Quick Actions ──────▶ Schedule Viewing ──────────▶ viewings
  (inline modals)       Send Quote       ──────────▶ rfq / quotes

  NotificationBell ─────▶ /api/notifications ──────▶ platform_events
       │                  /feed & /count             profiles.notifications_read_at
       ▼
  /notifications ──────▶ NotificationFeed(full) ── [PAGE MISSING → create]
  /settings/notifications ▶ NotificationPreferences [UPGRADE: add Push/SMS columns]
  /unsubscribe ──────────▶ token-based opt-out ─────[PAGE MISSING → create]
```

### Realtime Architecture

```
  Supabase Realtime channel: "messages:conversation_id=<id>"
  ─────────────────────────────────────────────────────────
  subscribe on: INSERT on messages table (filtered by conversation_id)
  client action: append to React Query cache (no full refetch)
  cleanup: channel.unsubscribe() on component unmount (useEffect return)

  Typing indicator: separate broadcast channel "typing:conversation_id=<id>"
  payload: { user_id, is_typing: bool }
  transport: broadcast (NOT a DB write)
  auto-clear: setTimeout 3000ms on last keystroke
```

---

## What Already Exists (reuse fully)

| Asset | Location | Reuse |
|---|---|---|
| `message-service.ts` | `src/services/messaging/` | ✅ Full — solid Zod schemas, sendMessage, getMessages, getOrCreateConversation |
| `attachment-service.ts` | `src/services/messaging/` | ✅ Full — magic-byte validation, Supabase Storage upload. Just wire to composer. |
| `NotificationFeed.tsx` + `NotificationBell.tsx` | `src/components/notifications/` | ✅ Full — connected to real hooks. Wrap in `/notifications` page. |
| `ViewingBooking.tsx` | `src/components/properties/` | ✅ Adapt as inline modal in thread (15.4) |
| `QuoteCreateForm.tsx` | `src/components/marketplace/` | ✅ Adapt as inline modal in thread (15.5) |
| `smart-replies` service | `src/services/smart-replies/` | ✅ Surface in composer as suggestion chips (delight opportunity) |
| `NotificationPreferences.tsx` | `src/components/profile/` | ⚠️ Upgrade: add Push/SMS columns (marked "Coming Soon") |
| `notification-service.ts` | `src/services/notifications/` | ⚠️ Fix broken `conversation_participants` query first |
| `UnreadBadge.tsx` | `src/components/messaging/` | ✅ Wire to sidebar nav inbox link |

---

## NOT in Scope (deferred)

| Item | Reason |
|---|---|
| Web Push (VAPID/service worker) | Large scope; show UI column marked "Coming Soon" only |
| SMS delivery | Needs Twilio/AWS SNS integration |
| Message search / full-text | Needs pg_trgm index + search UI |
| Group conversations | Future phase (HMO multi-tenant) |
| Message reactions/emoji | Nice-to-have, not in spec |
| Video/phone call integration | Thread header shows icons; wiring is out of scope |

---

## Error & Rescue Map (Critical Gaps)

| Method | Failure | Rescued? | Fix |
|---|---|---|---|
| `getConversations()` | DB timeout | ❌ GAP | Wrap in try/catch, return `[]` with toast |
| `getConversations()` | `userId` is undefined | ❌ GAP | Guard at call site with auth check |
| `sendMessage()` | `recipient_id` is not a real user | ❌ GAP | Supabase FK constraint will throw — catch and surface to user |
| `uploadAttachment()` | Storage bucket missing | ❌ GAP | Catch `StorageError`, toast "Upload unavailable" |
| `uploadAttachment()` | Storage upload timeout | ❌ GAP | Add abort signal, 30s timeout |
| `getUserEntityIds()` | `conversation_participants` doesn't exist | ❌ CRITICAL BUG | See Bug #1 above |
| `updateReadStatus()` | DB upsert race condition (two tabs) | ❌ GAP | Upsert with `onConflict` is idempotent — OK if both write same timestamp |
| `dispatchCriticalEmail()` | Email service down | ✅ Swallowed | Upgrade: `Sentry.captureException` instead of `console.error` |
| Realtime subscription | WebSocket disconnect | ❌ GAP | Supabase client auto-reconnects; add `on('error')` handler to log |
| Realtime subscription | Auth token expiry | ❌ GAP | Re-subscribe on `onAuthStateChange` |

---

## Security Checklist

| Threat | Likelihood | Impact | Action |
|---|---|---|---|
| User reads another user's messages | Med | High | **Audit RLS policy on `messages` table** — must restrict SELECT to conversation participants |
| XSS via message content | Med | High | ✅ `sanitizeText()` called in `sendMessage()`. Render as `{content}`, never `dangerouslySetInnerHTML` |
| Unsubscribe token forgery | Low | Med | **Unsubscribe page MUST use signed JWT**, not bare user ID in URL |
| Attachment public URL enumeration | Low | Low | Path = `{conversationId}/{messageId}.ext` — both UUIDs, not guessable |
| Notification feed leaks | Low | High | `getNotificationFeed` filters by `userEntityIds` — only safe after Bug #1 is fixed |

---

## Interaction Edge Cases

| Interaction | Edge Case | Handled? |
|---|---|---|
| Send message | Double-click send | ⚠️ `isPending` disables button — but add `useRef` optimistic guard too |
| File attach | 10MB file selected | ✅ 2MB limit enforced by attachment-service |
| Switch conversation | Previous Realtime subscription leaks | ❌ Add `useEffect` cleanup: `channel.unsubscribe()` |
| Load thread | No messages yet | ✅ Returns `[]` — show empty state |
| Load older messages | Cursor-based pagination UI | ❌ Need "Load earlier messages" button |
| Mark all read | Fires while feed is loading | ❌ Disable button while `isLoading` |
| Unsubscribe link | Token expired | ❌ Show "link expired" page, offer re-send |
| Schedule Viewing inline | No available slots | ❌ Show "No slots available — contact agent directly" |
| Send Quote inline | Provider has no active RFQ | ❌ Show contextual message |

---

## Performance Issues

| Issue | Severity | Fix |
|---|---|---|
| `getConversations()` — 4N+1 Supabase round-trips | HIGH | Create Supabase RPC `get_inbox_for_user(p_user_id)` using CTEs |
| `getUnreadCount()` — N×2 sequential queries | HIGH | Create Supabase RPC `get_unread_count(p_user_id)` |
| Realtime channel opened on every render | MED | `useRef` for channel instance, open once in `useEffect` |
| Attachment images in thread — layout shift | LOW | Use `next/image` with explicit width/height |

### Recommended RPC (add to Supabase migration)

```sql
-- get_inbox_for_user: replaces 4N+1 queries with 1 CTE query
CREATE OR REPLACE FUNCTION get_inbox_for_user(p_user_id uuid)
RETURNS TABLE (
  id uuid, participant_1_id uuid, participant_2_id uuid,
  context_type text, context_id uuid, last_message_at timestamptz,
  created_at timestamptz, participant_name text,
  last_message_preview text, unread_count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH my_convs AS (
    SELECT * FROM conversations
    WHERE participant_1_id = p_user_id OR participant_2_id = p_user_id
    ORDER BY last_message_at DESC
  ),
  other_ids AS (
    SELECT id AS conv_id,
      CASE WHEN participant_1_id = p_user_id
        THEN participant_2_id ELSE participant_1_id END AS other_id
    FROM my_convs
  ),
  names AS (
    SELECT o.conv_id, p.display_name
    FROM other_ids o
    JOIN profiles p ON p.id = o.other_id
  ),
  previews AS (
    SELECT DISTINCT ON (conversation_id) conversation_id, content
    FROM messages ORDER BY conversation_id, created_at DESC
  ),
  read_status AS (
    SELECT conversation_id, last_read_at FROM conversation_read_status
    WHERE user_id = p_user_id
  ),
  unread AS (
    SELECT m.conversation_id, COUNT(*) AS cnt
    FROM messages m
    LEFT JOIN read_status rs ON rs.conversation_id = m.conversation_id
    WHERE m.sender_id <> p_user_id
      AND m.created_at > COALESCE(rs.last_read_at, '1970-01-01')
    GROUP BY m.conversation_id
  )
  SELECT c.id, c.participant_1_id, c.participant_2_id,
    c.context_type::text, c.context_id, c.last_message_at, c.created_at,
    n.display_name AS participant_name,
    LEFT(pr.content, 100) AS last_message_preview,
    COALESCE(u.cnt, 0) AS unread_count
  FROM my_convs c
  LEFT JOIN names n ON n.conv_id = c.id
  LEFT JOIN previews pr ON pr.conversation_id = c.id
  LEFT JOIN unread u ON u.conversation_id = c.id;
$$;
```

---

## Push/SMS Decision

**Agreed approach:** Show 4 columns in Notification Preferences (Email, Push, SMS, In-App) matching the Stitch design. Push and SMS columns are stored in preferences JSONB but marked "Coming soon" with disabled toggles. No backend delivery for these channels yet. No migration needed (JSONB is schema-less).

**Type additions needed:**

```typescript
// src/types/notifications.ts — extend EventChannelPreferences
export type EventChannelPreferences = Readonly<{
  in_app: boolean;
  email: boolean;
  push: boolean;   // add
  sms: boolean;    // add
}>;
```

---

## Recommended Execution Waves

### Wave 1 — Fix Critical Bugs (must do first, unblocks everything)

| Task | File | Effort |
|---|---|---|
| 1a. Fix `getUserEntityIds()` — replace `conversation_participants` query | `notification-service.ts:195` | S |
| 1b. Wire `uploadAttachment()` into `MessageComposer` | `MessageComposer.tsx` | S |
| 1c. Replace mock data in `InboxList` with real `useConversations()` hook | `InboxList.tsx` | M |
| 1d. Replace mock data in `MessageThread` with real `useMessages()` hook | `MessageThread.tsx` | M |
| 1e. Add Supabase RPC migration for `get_inbox_for_user` | `supabase/migrations/` | M |

### Wave 2 — Core Missing Pages

| Task | Route | Effort |
|---|---|---|
| 2a. Connect `InboxPageClient` to Supabase Realtime subscription | `/inbox` | M |
| 2b. Build `/notifications` page (wrap `NotificationFeed` in full-page layout matching Stitch design) | `/notifications` | M |
| 2c. Upgrade `NotificationPreferences` to 4-column table (Stitch design) | `/settings/notifications` | M |

### Wave 3 — Rich Inline Features

| Task | Route | Effort |
|---|---|---|
| 3a. Inline Schedule Viewing modal in thread (15.4) | `/inbox/[conversationId]` | M |
| 3b. Inline Send Quote modal in thread (15.5) | `/inbox/[conversationId]` | M |
| 3c. `/unsubscribe` page with signed JWT token validation (15.8) | `/unsubscribe` | M |

### Wave 4 — Delight Additions (~3hrs total)

| Task | Effort | Notes |
|---|---|---|
| Smart reply chips above composer | S (30m) | `useSmartReplies()` service already built |
| Property mini-card in thread header (when context_type=listing) | S (45m) | Matches Stitch Thread View design |
| Typing indicator via Supabase broadcast | M (1hr) | Already mocked in InboxList |
| Unread badge on sidebar inbox nav link | XS (20m) | `UnreadBadge.tsx` + `getUnreadCount()` |
| Mark as read on conversation open | XS (10m) | `updateReadStatus()` already in service |

---

## Test Plan

```
UNIT TESTS (Vitest):
  - sendMessage: happy path, empty content, content > 5000 chars
  - uploadAttachment: magic bytes valid, magic bytes mismatch, > 2MB
  - getUserEntityIds: returns correct conversation IDs (fixed)
  - validateAttachment: all 4 MIME types, edge cases
  - Realtime dedup: duplicate message INSERT ignored
  - Unsubscribe token: valid token, expired token, malformed token

INTEGRATION TESTS:
  - getConversations (RPC): returns enriched data, correct unread count
  - sendMessage + uploadAttachment: end-to-end with Storage

E2E TESTS (Playwright):
  - Full inbox flow: load inbox → select conversation → send message → see it appear
  - Attachment flow: attach file → send → see attachment bubble
  - Notification centre: load → mark all read → count goes to 0
  - Unsubscribe: click link → confirm → preferences updated
```

---

## Stitch Design Notes

### Inbox (15.1)
- Two-pane layout (conversation list left 384px, thread/placeholder right)
- Conversation filters: All | Unread | Archived | Starred (pill tabs)
- Each conversation row: avatar, role badge (Estate Agent / Client / Legal Dept), last message preview, timestamp, unread dot
- Active conversation: left green border accent + `bg-primary/5`
- Right pane empty state: centered forum icon with unread count badge + "Select a conversation" copy
- Britestate color: `#1B4D3E` (brand-primary)

### Thread View (15.2)
- Header: back button + avatar + online dot + name + role + **property mini-card** (thumbnail + label + price + external link)
- Actions: phone icon, more options (⋮)
- Messages: received = white card `rounded-bl-none`, sent = `bg-primary text-white rounded-br-none`
- Attachment bubbles: PDF = icon card with download arrow; Image = `aspect-video` rounded card
- Quick action chips: Schedule Viewing | Send Document | Property Info
- Input bar: `bg-slate-100 rounded-2xl` container, `add_circle` + emoji + textarea + send button

### Notification Centre (15.6)
- Tabs: All (with count badge) | Unread | Mentions | System
- Cards: white, `rounded-xl`, left green accent bar for unread
- Icon circles: colour-coded by type (blue=listing, green=offer, amber=viewing, rose=compliance, slate=system)
- Urgency badge: `bg-rose-100 text-rose-600` on compliance alerts
- Action buttons inline per notification (View Property, Review Counter, Get Directions, Resolve Now)

### Notification Preferences (15.7)
- Settings sidebar layout (Profile Details / Notifications / Security / Billing)
- Matrix table: 4 columns (Email | Push | SMS | In-App) × N event types
- Push + SMS = render as Switch but `disabled` with tooltip "Coming soon"
- Quiet Hours section: `bg-primary/5 rounded-xl` card, time selects + toggle
- Footer: "Last updated" + Discard / Save Changes buttons

---

## File Checklist (all files to create or modify)

### New files
- `src/app/(protected)/notifications/page.tsx`
- `src/app/(protected)/notifications/NotificationCentreClient.tsx`
- `src/app/unsubscribe/page.tsx`
- `src/app/api/notifications/unsubscribe/route.ts`
- `supabase/migrations/[timestamp]_messaging_rpc.sql`

### Modified files
- `src/components/messaging/InboxList.tsx` — replace mock with real hook
- `src/components/messaging/MessageThread.tsx` — replace mock with real hook + Realtime
- `src/components/messaging/MessageComposer.tsx` — wire uploadAttachment
- `src/app/(protected)/inbox/InboxPageClient.tsx` — Realtime connection
- `src/app/(protected)/inbox/[conversationId]/page.tsx` — add inline Schedule Viewing + Send Quote
- `src/components/profile/NotificationPreferences.tsx` — 4-column Stitch design
- `src/services/notifications/notification-service.ts` — fix getUserEntityIds
- `src/types/notifications.ts` — add push + sms to EventChannelPreferences

---

*Generated by plan-ceo-review · 2026-03-15*
