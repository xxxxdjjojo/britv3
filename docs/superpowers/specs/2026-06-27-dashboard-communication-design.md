# Unified Dashboard Communication — Design Spec

**Date:** 2026-06-27
**Status:** Approved (brainstorming) → ready for implementation plan
**Author:** Claude (with user)

## Problem

1. **Live incident:** the `/inbox` tab shows *"Failed to load conversations"* in production. Nothing renders, despite real data existing.
2. **Feature gap:** the user wants a complete, consistent communication surface ("inbox") reachable from every role dashboard, styled with the chosen shadcn components (`sidebar-09` mail shell + radix-rhea `Message`/`Bubble`/`MessageScroller` primitives), with mail-style folders (Inbox / Unread / Sent / Drafts / Archived / Spam).

## Root-cause analysis (the live bug)

Verified facts (prod project `ynkqzzpcbpphjczmrfva`):

- RPCs `get_inbox_for_user` and `get_unread_count` **exist**.
- Tables `conversations`, `messages`, `conversation_read_status` **exist**.
- Real data present: **56 conversations, 142 messages**.

So the failure is **not** missing data or a missing migration.

Code path:

- `getConversations()` (`src/services/messaging/message-service.ts:111`) wraps everything in `try/catch` and **returns `[]` on any error**. An RPC/DB failure therefore renders the **empty state** ("No conversations found"), *not* the red error banner.
- The *"Failed to load conversations"* banner (`InboxList.tsx:319`) only renders when `useInbox()` throws, which happens **only on a non-200 response** from `GET /api/messages` (`useInbox.ts:42`).
- For a logged-in user, the GET handler (`src/app/api/messages/route.ts`) returns a non-200 only as:
  - **401** — `supabase.auth.getUser()` returns no user (server-side Supabase client not reading the session cookie in the live/Vercel environment), or
  - **500** — a throw before/around the service call.

**Conclusion:** the banner is an **auth/transport-boundary failure (most likely 401)**, masked by a service layer that swallows errors. Execution **Step 1 reproduces the failure as a seeded logged-in user and reads the exact status** to confirm 401-vs-500 before fixing. The fix is then the precise cause (server Supabase cookie wiring in `src/lib/supabase/server.ts` and/or the route auth read).

### Permanent fixes (prevent recurrence)

1. **Stop masking failures.** `getConversations()` must distinguish *empty* from *broken* (typed result or throw). The route returns a meaningful status; the UI shows a precise message + retry.
2. **Auth-contract tests** on every messaging route: 200 for an authed request, 401 for anon. A silent SSR-cookie regression can never ship again.
3. **E2E smoke** in CI: two seeded users exchange a message and each sees it. The single test that would have caught "live but nothing shows."
4. **Observability:** replace the eslint-disabled `console.error` in the messaging service/route with `captureException` (Sentry) so prod 401/500 surfaces.

## Decisions (from brainstorming)

- **Folder model:** conversation folders (pragmatic), mapped onto the 1:1 DM model — *not* a full email client.
- **Surfacing:** one canonical `/inbox`; every dashboard links to it with a live unread badge.
- **Scope:** everything in one cycle (bug fix + folders + restyle + cross-dashboard wiring + tests + screenshots + docs).

## Data model

No new table. Extend the existing per-(conversation, user) `conversation_read_status` (PK `conversation_id, user_id`):

```sql
ALTER TABLE public.conversation_read_status
  ADD COLUMN IF NOT EXISTS archived_at     timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_at      timestamptz,
  ADD COLUMN IF NOT EXISTS draft_text      text,
  ADD COLUMN IF NOT EXISTS draft_updated_at timestamptz;
```

Folders are **derived per user**, reusing the single-query RPC. `get_inbox_for_user` is extended to also return `archived_at`, `blocked_at`, `draft_text`, and a computed `has_sent boolean` (`EXISTS(messages where conversation_id = c.id and sender_id = p_user_id)`).

| Folder | Derivation |
|---|---|
| Inbox | not archived, not blocked |
| Unread | `unread_count > 0`, not archived/blocked |
| Sent | `has_sent` true |
| Drafts | `draft_text` non-empty |
| Archived | `archived_at` set |
| Spam | `blocked_at` set — also rejects new messages from that user in `getOrCreateConversation`/`sendMessage` |

RLS: rows are already scoped to the owning `user_id`. Mutations upsert (creating the row if a user archives/blocks/drafts a conversation they hadn't "read").

## API

- `GET /api/messages` returns conversations **with** the new state fields; the client buckets into folders and computes per-folder counts (one query — fine at this scale).
- New routes:
  - `POST /api/messages/[conversationId]/archive` — toggle `archived_at`.
  - `POST /api/messages/[conversationId]/block` — toggle `blocked_at` (Spam).
  - `PUT /api/messages/[conversationId]/draft` — save `draft_text`; `DELETE` clears it.
- New service functions: `archiveConversation`, `setConversationBlocked`, `saveDraft`, `getDraft`. `sendMessage`/`getOrCreateConversation` reject when the recipient relationship is blocked.
- Wires the **swipe-to-archive** that is currently visual-only (`InboxList.tsx:278` TODO) to the archive endpoint.

## UI

Chosen components (install via shadcn registry, adapt import paths to `@/components/ui/*`): `sidebar-09`, `message`, `bubble`, `message-scroller`.

- **`InboxShell`** (sidebar-09): left = `FolderRail` (6 folders + live counts), middle = `InboxList` filtered by active folder, right = thread.
- **Thread** restyled with `Message` / `MessageGroup` / `Bubble` / `MessageScroller`; sender alignment via `align` (own messages `end`).
- **`MessageComposer`** gains **draft autosave** (debounced `PUT .../draft`; clears on send).
- **Brand:** override the demo `theme-blue` to the app's brand-green dashboard tokens (no blue). Preserve existing a11y (listbox semantics, aria labels, keyboard nav) and the current mobile 2-pane switching; the folder rail collapses to a sheet on mobile.

## Cross-dashboard surfacing

Single `/inbox` is the source of truth. Audit all 6 role dashboards (homebuyer, renter, seller, landlord, agent, provider) + `Sidebar` + `ProtectedHeader`. Each must expose a **"Messages" link + live unread badge** (`useUnreadCount`). Enforced by extending the existing **dashboard-link-integrity** test so a missing/broken link fails CI.

## Testing (TDD: RED → GREEN → screenshots → iterate)

Write failing tests first, commit, then implement to green:

1. **Route auth-contracts** — each messaging route: 200 authed, 401 anon; archive/block/draft happy + auth paths.
2. **Folder rail** — renders all 6 folders, correct counts, clicking filters the list.
3. **Dashboard link-integrity** — every dashboard renders a Messages link → `/inbox` with an unread badge.
4. **Service mutations** — `archiveConversation`, `setConversationBlocked`, `saveDraft`; `getConversations` surfaces errors (no silent `[]`).
5. **E2E (Playwright)** — two seeded users exchange real messages; message appears in each inbox; archive moves it out of Inbox; draft persists across reload. Screenshots at 320 / 768 / 1440 as proof.

## Files (sketch)

- `supabase/migrations/<ts>_messaging_folders.sql` — columns + RPC update; applied to prod after merge + ledger repair.
- `src/services/messaging/message-service.ts` — new mutations; error-surfacing; blocked enforcement; new return fields.
- `src/types/messaging.ts` — extend `Conversation` (`archived_at`, `blocked_at`, `draft_text`, `has_sent`); add `Folder` type.
- `src/app/api/messages/[conversationId]/{archive,block,draft}/route.ts` — new.
- `src/hooks/useInbox.ts` — folder bucketing + counts; `useDraft`; archive/block mutation hooks.
- `src/components/messaging/InboxShell.tsx`, `FolderRail.tsx` — new; restyle `MessageThread.tsx`, `MessageComposer.tsx`, `InboxList.tsx`.
- `src/components/ui/{message,bubble,message-scroller}.tsx`, sidebar-09 — installed.
- `src/lib/supabase/server.ts` — root-cause fix (pending reproduction).
- 6 dashboards + `Sidebar`/`ProtectedHeader` — Messages link + badge.
- `src/lib/observability` wiring — `captureException` in messaging service/route.
- Tests mirroring each unit; `docs/` update.

## Parallelizable workstreams (subagents)

Sequenced so the bug fix + migration land before UI depends on them:

1. Bug reproduction + root-cause fix + auth-contract tests + error-surfacing.
2. Migration + RPC update + service mutations.
3. Folder-shell UI (sidebar-09 + FolderRail).
4. Thread restyle (Message/Bubble/MessageScroller + draft composer).
5. Cross-dashboard surfacing + link-integrity test.
6. E2E two-user message exchange + screenshots.

## Out of scope

- Full email client (standalone composable drafts to no recipient, spam ML classification, trash retention).
- New attachment types beyond the existing image/pdf support.
