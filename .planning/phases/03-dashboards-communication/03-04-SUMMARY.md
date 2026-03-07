---
phase: 03-dashboards-communication
plan: 04
subsystem: messaging
tags: [supabase, react-query, polling, cursor-pagination, file-upload, magic-bytes, xss-sanitize]

requires:
  - phase: 03-01
    provides: messaging types (Conversation, Message, SendMessageInput, InboxFilters)
  - phase: 03-02
    provides: sanitizeText, compressImage, test fixtures

provides:
  - Message service with conversation lifecycle and cursor pagination
  - Attachment service with magic byte validation (JPEG/PNG/WebP/PDF)
  - 4 API routes for messages and attachments
  - useInbox hook with 30s polling, useMessages with infinite query
  - Inbox page, conversation detail page, contact form, unread badge
  - 13 unit tests for messaging service and attachment validation

affects: [03-05-notifications, ai-quote-drafting, marketplace-messaging]

tech-stack:
  added: []
  patterns: [30s-polling-via-refetchInterval, cursor-based-infinite-query, magic-byte-file-validation, per-conversation-read-status-upsert]

key-files:
  created:
    - britv3.0/src/services/messaging/message-service.ts
    - britv3.0/src/services/messaging/attachment-service.ts
    - britv3.0/src/app/api/messages/route.ts
    - britv3.0/src/app/api/messages/[conversationId]/route.ts
    - britv3.0/src/app/api/messages/[conversationId]/read/route.ts
    - britv3.0/src/app/api/attachments/route.ts
    - britv3.0/src/hooks/useInbox.ts
    - britv3.0/src/hooks/useMessages.ts
    - britv3.0/src/components/messaging/InboxList.tsx
    - britv3.0/src/components/messaging/MessageThread.tsx
    - britv3.0/src/components/messaging/MessageComposer.tsx
    - britv3.0/src/components/messaging/ContactForm.tsx
    - britv3.0/src/components/messaging/AttachmentPreview.tsx
    - britv3.0/src/components/messaging/UnreadBadge.tsx
    - britv3.0/src/app/(protected)/inbox/page.tsx
    - britv3.0/src/app/(protected)/inbox/[conversationId]/page.tsx
    - britv3.0/src/__tests__/services/message-service.test.ts
  modified: []

key-decisions:
  - "Inline magic byte validation instead of file-type library for attachment service -- simpler, no ESM import issues"
  - "Conversation enrichment via sequential queries (profile, last message, read status) rather than complex SQL join -- simpler to maintain, acceptable for inbox sizes"
  - "AttachmentPreview created in Task 2 (not Task 3) since MessageComposer imports it -- blocking dependency"

patterns-established:
  - "30s polling: useQuery with refetchInterval: 30_000, refetchIntervalInBackground: false, staleTime: 10_000"
  - "Cursor pagination: useInfiniteQuery with getNextPageParam extracting created_at from oldest message"
  - "Read status: upsert on conversation_read_status with onConflict: conversation_id,user_id"

requirements-completed: [COM-01, COM-02, COM-03, COM-04, COM-05]

duration: 21min
completed: 2026-03-07
---

# Phase 03 Plan 04: Messaging System Summary

**Polling-based messaging with 30s inbox refresh, cursor-paginated threads, magic-byte file validation, contextual contact form, and 13 unit tests**

## Performance

- **Duration:** 21 min
- **Started:** 2026-03-07T18:43:16Z
- **Completed:** 2026-03-07T19:04:30Z
- **Tasks:** 3
- **Files created:** 17

## Accomplishments
- Full messaging service layer with conversation CRUD, cursor pagination, and read status tracking
- Attachment service validating file types via magic bytes (JPEG, PNG, WebP, PDF) with 2MB size limit
- Inbox with 30-second polling refresh via react-query refetchInterval
- Message thread with cursor-based infinite scroll pagination
- Contact form for initiating conversations from listing context
- 13 passing unit tests covering all service functions and attachment validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Messaging service layer and API routes** - `24299d6` (feat)
2. **Task 2: Messaging hooks and core components** - `4d1548d` (feat)
3. **Task 3: Secondary components, pages, and unit tests** - `f7f07e0` (feat)

## Files Created/Modified
- `src/services/messaging/message-service.ts` - Conversation CRUD, message pagination, read status, Zod schema
- `src/services/messaging/attachment-service.ts` - Magic byte validation, Supabase Storage upload
- `src/app/api/messages/route.ts` - GET (inbox list / unread count) + POST (send message)
- `src/app/api/messages/[conversationId]/route.ts` - GET (thread messages) + POST (send to conversation)
- `src/app/api/messages/[conversationId]/read/route.ts` - POST (mark conversation read)
- `src/app/api/attachments/route.ts` - POST (file upload with multipart form data)
- `src/hooks/useInbox.ts` - useInbox (30s poll), useUnreadCount hooks
- `src/hooks/useMessages.ts` - useMessages (infinite query), useSendMessage, useMarkAsRead hooks
- `src/components/messaging/InboxList.tsx` - Conversation list with search, filter, skeleton loading
- `src/components/messaging/MessageThread.tsx` - Chronological message display with load-more pagination
- `src/components/messaging/MessageComposer.tsx` - Textarea with file attach, char count, Ctrl+Enter
- `src/components/messaging/ContactForm.tsx` - Contextual contact form for listing pages
- `src/components/messaging/AttachmentPreview.tsx` - Image/PDF preview (pre-send removable, post-send clickable)
- `src/components/messaging/UnreadBadge.tsx` - Red badge with unread count for nav
- `src/app/(protected)/inbox/page.tsx` - Inbox page wrapper
- `src/app/(protected)/inbox/[conversationId]/page.tsx` - Conversation detail with thread and composer
- `src/__tests__/services/message-service.test.ts` - 13 unit tests

## Decisions Made
- Used inline magic byte checks for attachment validation instead of the file-type library -- simpler, avoids ESM import issues in server context
- Conversation enrichment uses sequential queries per conversation rather than a complex join/RPC -- simpler to maintain and acceptable for typical inbox sizes
- AttachmentPreview was created during Task 2 instead of Task 3 because MessageComposer directly imports it (Rule 3 - blocking dependency)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Moved AttachmentPreview to Task 2**
- **Found during:** Task 2 (MessageComposer)
- **Issue:** MessageComposer imports AttachmentPreview which was planned for Task 3
- **Fix:** Created AttachmentPreview.tsx during Task 2 to resolve import dependency
- **Files modified:** britv3.0/src/components/messaging/AttachmentPreview.tsx
- **Committed in:** 4d1548d (Task 2 commit)

**2. [Rule 1 - Bug] Fixed Readonly assignment error in messages API route**
- **Found during:** Task 1 (API routes)
- **Issue:** TypeScript error assigning to Readonly InboxFilters properties
- **Fix:** Used spread operator to construct filters immutably
- **Files modified:** britv3.0/src/app/api/messages/route.ts
- **Committed in:** 24299d6 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Minor task boundary adjustment and TS fix. No scope creep.

## Issues Encountered
- Pre-existing build failure in notifications/preferences/route.ts (Zod v4 `.errors` property) -- out of scope, not addressed
- Pre-existing Google Fonts fetch failure during build -- network issue, not code-related

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Messaging system complete and ready for notification triggers (03-05)
- Contact form ready for integration on listing detail pages
- UnreadBadge ready for integration in navigation header

## Self-Check: PASSED

All 17 created files verified present. All 3 task commits verified in git history (24299d6, 4d1548d, f7f07e0). 13/13 messaging tests pass.

---
*Phase: 03-dashboards-communication*
*Completed: 2026-03-07*
