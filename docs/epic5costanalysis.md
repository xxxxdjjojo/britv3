# Epic 5 Cost Audit: Where the Communication Spec is Dangerously Naive

## Context

Analysis of `epic5.txt` — the Communication & Collaboration Platform spec. Compared against how Zoopla, Rightmove, and OnTheMarket actually handle messaging/notifications. This spec reads like a developer who's never had to pay a hosting bill. At scale (millions of UK users), several design decisions here will either bankrupt the platform or collapse under load.

---

## The Brutal Truth: What Zoopla Actually Does

Before diving into flaws, here's what the big players do for communication:

- **Zoopla/Rightmove**: No real-time chat at all. They use **email relay** (user@messaging.zoopla.co.uk forwards to agent). Zero WebSocket infrastructure. Zero presence tracking.
- **OpenRent**: Simple contact forms that generate emails. Chat added later as a thin layer.
- **Purplebricks**: Basic in-app messaging, no presence, no read receipts, no real-time requirement.

The spec proposes building **WhatsApp inside a property portal**. That is a catastrophically expensive mistake for a startup.

---

## 1. Supabase Realtime for Chat -- THE BIGGEST COST RISK IN THE ENTIRE PROJECT

**Source:** E05-S01, E05-S02, Technical Considerations

The spec calls for real-time WebSocket messaging via Supabase Realtime. The cost math:

**Supabase Realtime pricing:**
- Free tier: 200 concurrent connections
- Pro ($25/mo): 500 concurrent connections
- Beyond that: $10 per 1,000 additional concurrent connections

**What "concurrent connections" means for chat:**
Every user with an open browser tab = 1 persistent WebSocket connection. At scale:

| Monthly Active Users | Peak Concurrent (est. 5%) | Monthly Realtime Cost |
|---------------------|--------------------------|----------------------|
| 10K | 500 | $0 (Pro tier) |
| 100K | 5,000 | ~$45/mo |
| 500K | 25,000 | ~$245/mo |
| 1M | 50,000 | ~$495/mo |
| 5M | 250,000 | **~$2,495/mo** |

This looks manageable in isolation, BUT -- the spec also uses Realtime for:
- Presence tracking (online/offline) -- **doubles connection usage**
- Read receipts -- constant write events back through the channel
- Notification delivery -- another subscription per user

Each user could have **3-4 simultaneous Realtime subscriptions**. Multiply costs by 3-4x:

| 1M users | Naive estimate | Real estimate (3-4 subs/user) |
|----------|---------------|-------------------------------|
| Cost | ~$495/mo | **~$1,500-2,000/mo** |

**The real killer:** Supabase Realtime broadcasts to ALL subscribers on a channel. If your conversations table has 1M rows and 50K subscribers, every INSERT triggers broadcast evaluation for all of them. This is an **O(n) cost per message**.

**Recommendation:**
- **Phase 1: Don't build real-time chat at all.** Use a contact form that creates a message in the DB and sends an email notification. This is what Zoopla does. It costs nearly nothing.
- **Phase 2 (post product-market fit):** Add polling-based "inbox" -- check for new messages every 30s via a simple API call. No WebSockets.
- **Phase 3 (post revenue):** Add real-time only for ACTIVE conversations (user is looking at the chat window), not globally.

---

## 2. Presence Tracking (Online/Offline) -- VANITY FEATURE, REAL COST

**Source:** E05-S02

"A basic presence indicator (e.g., 'Online,' 'Last seen [timestamp/date]')"

Presence requires:
- A heartbeat from every connected client (every 10-30s)
- Server-side tracking of last heartbeat per user
- Broadcasting presence changes to all users who care

At 1M users:
- **33K-100K heartbeat writes/second** to the database
- Storage for presence state
- Realtime broadcasts for every status change

Zoopla doesn't do this. Rightmove doesn't do this. OnTheMarket doesn't do this. **No property portal does this** because it provides zero business value for property transactions.

A buyer doesn't care if an agent is "online" -- they care if the agent responds within 24 hours.

**Recommendation:** Cut entirely. Show "Typically responds within X hours" (calculated from historical response times). This is one static DB query, not a persistent connection.

---

## 3. Read Receipts -- WRITE AMPLIFICATION DISASTER

**Source:** E05-S02

Every time a user READS a message, you need to:
1. UPDATE the message row (or a separate read_receipts table)
2. Broadcast the change via Realtime to the sender

At scale, "reading" happens far more than "sending." A user opens a conversation with 50 messages = 50 UPDATE queries to mark them read. If 10K users check their messages in a minute = **500K UPDATE queries/minute** just for read receipts.

On Supabase's shared Postgres, this will cause:
- Lock contention on the messages table
- WAL (Write-Ahead Log) bloat
- Replication lag
- Autovacuum pressure

**Recommendation:**
- Track "last read timestamp" per user per conversation (1 row), not per message
- Display "read up to this point" rather than per-message ticks
- Update on conversation close, not per-message view
- This reduces writes from O(messages_read) to O(1) per conversation view

---

## 4. File Attachments in Chat -- STORAGE COST CREEP

**Source:** E05-S03

"Supported file types include common image formats (JPG, PNG, GIF) and documents (PDF, DOCX, TXT) up to a defined size limit (e.g., 10MB)"

10MB per attachment, no compression mentioned. Chat file sharing is notoriously abused:
- Users share photos of properties (5-10MB each)
- Agents share floor plans, brochures
- Providers share invoices, certificates

At scale:

| Monthly Active Convos | Avg Attachments | Avg Size | Monthly Storage Added |
|----------------------|----------------|----------|----------------------|
| 10K | 3 | 5MB | 150GB |
| 100K | 3 | 5MB | 1.5TB |
| 1M | 3 | 5MB | **15TB** |

Supabase Storage pricing: $0.021/GB/month. At 15TB/month accumulating = **$315/mo after month 1, $3,780/mo after year 1** (cumulative).

**Recommendation:**
- Compress images client-side before upload (target 500KB max)
- Cap file size at 2MB for chat, 5MB for document sharing areas
- Set retention policy: chat attachments auto-delete after 12 months
- Use thumbnails in chat, full file on-demand download
- Limit attachments per conversation (e.g., 20 files max)

---

## 5. Notification System Architecture -- THE SPEC SAYS NOTHING

**Source:** E05-S06, E05-S07, E05-S10

The spec describes WHAT notifications to send but says almost nothing about HOW. This is where startups silently bleed money. The naive approach (which a developer will build without guidance):

```
User action -> INSERT into user_notifications -> Supabase Realtime broadcasts -> Email sent
```

Problems:
- **Fan-out cost:** A new property listing matching 5,000 saved searches = 5,000 notification INSERTs + 5,000 Realtime broadcasts + potentially 5,000 emails. One listing = 5,000 operations.
- **Email cost at scale:** If 10% of notifications trigger emails, at 1M users generating 20 notifications/day = 2M emails/day. Resend pricing: **$6,000+/mo**
- **Database bloat:** user_notifications table grows by millions of rows daily with no mention of cleanup

**Recommendation:**
- **In-app notifications:** Don't INSERT per-user rows. Use a "notification feed" pattern: store the EVENT once, query "events relevant to user X" at read time. This is how Twitter/Facebook do it. One INSERT instead of 5,000.
- **Email:** Never send real-time emails for non-critical events. Batch into daily/weekly digest. For critical events (booking confirmation, offer received), send immediately but rate-limit to max 5 emails/user/hour.
- **Retention:** Auto-delete notifications older than 90 days. Add a cleanup cron job from day 1.
- **Push over email:** When you add PWA (Phase 7), push notifications are FREE. Plan the architecture to prefer push > in-app > email.

---

## 6. "Secure Document Sharing" -- REINVENTING GOOGLE DRIVE

**Source:** E05-S08

The spec wants a "dedicated space to securely share and access relevant documents" with access controls per transaction/job.

This is building a document management system. For MVP, this is massively overscoped:

- Per-transaction folder structure in Supabase Storage
- Access control lists per folder
- Upload/download/view permissions
- Notification on new document
- "Basic versioning or overwrite warnings"

**What Zoopla does:** Nothing. They link out to solicitors/conveyancers who handle documents. Rightmove: same. Document management is the solicitor's job, not the portal's.

**Recommendation:**
- **MVP:** Simple file attachment on the conversation/booking. No separate "document space." If a buyer needs to share ID with an agent, they attach it in the message thread.
- **Post-MVP:** If there's demand, add a simple "files" tab on the booking/transaction page that lists attachments from the conversation. No separate storage system, no folder structure, no versioning.
- This eliminates an entire feature (and its storage/access control complexity) while providing 90% of the value.

---

## 7. Milestone Tracking -- SCOPE CREEP FROM EPIC 8

**Source:** E05-S09

Transaction milestone tracking (Offer Accepted -> Survey -> Exchange -> Completion) is already part of Epic 8 (Transaction Pipeline, Phase 6). Including it here means:
- Duplicate implementation risk
- Unclear ownership (is it Epic 5 or Epic 8?)
- Premature build (transactions don't exist until Phase 6)

**Recommendation:** Remove from Epic 5 entirely. It belongs in Phase 6 (Landlord Tools & Transactions). Don't build features for flows that don't exist yet.

---

## 8. "End-to-End Security for Messages" -- SOUNDS GOOD, COSTS A LOT

**Source:** Technical Considerations

"Ensure end-to-end security for messages and file attachments"

True E2E encryption (like Signal/WhatsApp) means:
- Client-side key generation and management
- Key exchange protocol
- Encrypted storage (server can't read messages)
- Key rotation
- Multi-device key sync

This is a 3-6 month project on its own. No property portal does this. It also makes server-side features impossible (search messages, moderation, compliance).

**What you actually need:** TLS in transit (free, automatic with HTTPS) + RLS in the database (already planned). That's it. Messages are private to the conversation participants via database access controls.

**Recommendation:** Drop "end-to-end" language. Use "encrypted in transit, access-controlled at rest" -- which you get for free with Supabase + HTTPS.

---

## 9. Chat History "Lazy Loading" -- QUERY COST AT SCALE

**Source:** E05-S04

"The interface supports scrolling back through older messages (e.g., lazy loading or pagination for long histories)"

Without explicit guidance, developers will write:
```sql
SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 50 OFFSET ?
```

OFFSET-based pagination is O(n) -- Postgres still scans all skipped rows. For a conversation with 10K messages, loading page 200 scans 10K rows.

**Recommendation:** Mandate cursor-based pagination in the spec:
```sql
SELECT * FROM messages WHERE conversation_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT 50
```

This is O(1) regardless of conversation size. Free performance win by specifying it upfront.

---

## Cost Summary: What Epic 5 Will Actually Cost vs. What It Should

| Item | Spec Approach (at 1M users) | Recommended | Savings |
|------|---------------------------|-------------|---------|
| Supabase Realtime (chat) | ~$1,500-2,000/mo | Polling-based inbox | ~$1,800/mo |
| Presence tracking | ~$500/mo (heartbeats) | "Responds in X hours" | ~$500/mo |
| Read receipts (writes) | DB pressure, indirect cost | Per-conversation timestamp | Significant DB relief |
| File storage (chat) | ~$300/mo growing | Client compression + retention | ~$200/mo |
| Email notifications | ~$2,000-6,000/mo | Digest batching + push | ~$4,000/mo |
| Document sharing system | Dev time: 2-3 weeks | Reuse chat attachments | 2-3 weeks saved |
| Milestone tracking | Dev time: 1-2 weeks | Defer to Phase 6 | 1-2 weeks saved |
| **Total** | **~$4,300-8,800/mo + 3-5 weeks** | **~$200-500/mo** | **~$4,000-8,000/mo** |

---

## The Zoopla Test

Before building any communication feature, ask: **"Does Zoopla do this?"**

| Feature | Zoopla | Rightmove | Spec Proposes | Verdict |
|---------|--------|-----------|--------------|---------|
| Real-time WebSocket chat | No | No | Yes | Cut |
| Online/offline presence | No | No | Yes | Cut |
| Read receipts | No | No | Yes | Cut |
| File sharing in chat | No | No | Yes | Simplify |
| Email relay messaging | Yes | Yes | Buried | Prioritize |
| In-app notification feed | Yes | Yes | Yes | Keep |
| Document sharing space | No | No | Yes | Defer |
| Milestone tracking | No | No | Yes | Defer to Phase 6 |

**Zoopla handles millions of property inquiries per month with email relay and a simple inbox.** Match them first, then differentiate.

---

## What Epic 5 Should Actually Be (MVP)

1. **Contact form** on listings/bookings that creates a message and emails the recipient
2. **Simple inbox** (polling every 30s, not WebSocket) showing message threads
3. **In-app notification feed** with event-based architecture (store events, not per-user notifications)
4. **Email notifications** for critical events only, batched digest for everything else
5. **File attachments** in messages (compressed, 2MB limit, 12-month retention)

That's it. Total new infrastructure cost: ~$0 beyond existing Supabase plan.

---

*Analysis date: 2026-03-07*
*Applies to: Epic 5 -- Communication & Collaboration Platform*
