# Epic 5 (Final): Communication, Quoting & Collaboration Platform

Epic Number: E05
Epic Title: Communication, Quoting & Collaboration Platform
Date Created: May 13, 2025
Last Updated: March 7, 2026 (Cost-Optimized Rewrite)
Target Release: Phase 2

---

## 1. Description

This Epic builds a cost-efficient communication layer, an AI-powered quoting system for tradespeople and estate agents, and lightweight collaboration tools. Every design decision has been pressure-tested against the "Zoopla Test" — if a platform serving millions of UK users doesn't need it, we don't build it at MVP.

The original spec proposed building WhatsApp inside a property portal (real-time WebSocket chat, presence tracking, read receipts). This rewrite replaces that with what actually works at scale for near-zero cost, and adds an AI quote system that directly drives platform revenue via the 2.5% commission model.

---

## 2. Goals

- Enable communication between all user roles (buyers, renters, sellers, landlords, agents, providers) without leaving the platform
- Help tradespeople and agents respond to inquiries faster with AI-drafted quotes and market pricing intelligence
- Deliver timely notifications without bleeding email/infrastructure costs
- Provide lightweight document sharing and milestone tracking tied to transactions and service jobs
- Keep total infrastructure cost under $200/mo at 100K users

---

## 3. Scope

### In Scope

**Messaging System (Lean)**
- Contact forms on listings and bookings that create message threads
- Polling-based inbox (30s refresh) — no WebSockets at MVP
- Contextual conversation initiation (from listings, bookings, RFQs)
- File attachments in messages (compressed, 2MB limit)
- Message history with cursor-based pagination
- "Typically responds in X hours" indicator (replaces presence tracking)
- Per-conversation read tracking (replaces per-message read receipts)

**AI Quote System (NEW — Revenue Driver)**
- AI-drafted quotes for tradespeople responding to RFQs
- AI-drafted valuation/fee proposals for estate agents
- Trader rate card management (hourly, call-out, per-service)
- Market pricing intelligence ("plumbers in SW1 charge £80-120/hr")
- Seeded benchmark data from public sources (Checkatrade, trade bodies)
- Organic market data collection as traders use the platform
- Human-in-the-loop: trader always reviews before sending

**Notification System (Event-Based)**
- In-app notification feed using event-based architecture
- Email notifications for critical events only (booking confirmed, offer received, new quote)
- Batched daily digest for non-critical notifications
- User notification preferences (from Epic 3)
- 90-day auto-cleanup of old notifications

**Document Sharing (Lightweight)**
- "Files" tab on booking/transaction pages listing all attachments from the conversation
- No separate folder structure, no versioning, no standalone document management
- Supabase Storage with RLS — only conversation participants can access

**Milestone Tracking (Simple)**
- Predefined milestone templates for UK property transactions and service jobs
- Manual status updates by agents/providers
- Progress visualization (checklist/progress bar)
- Milestone change triggers in-app notification to all parties

### Out of Scope

- Real-time WebSocket chat (Phase 3+ when revenue justifies it)
- Online/offline presence indicators
- Per-message read receipts (double ticks)
- Group chat
- Video/voice calls
- End-to-end encryption (TLS + RLS is sufficient)
- SMS/WhatsApp via Twilio (too expensive — keep everything in-app)
- Automated milestone updates from external triggers
- AI-powered smart reply suggestions (static suggestions instead)
- Document versioning or e-signatures (Epic 8)

---

## 4. User Stories & Acceptance Criteria

### Messaging

**E05-S01: Contact & Messaging**

As a User, I want to send messages to agents, providers, and other users from relevant contexts, so I can communicate within the platform.

Priority: Must

Acceptance Criteria:
- On a property detail page, a "Contact Agent" button opens a contact form pre-filled with property context ("Regarding: 3 bed semi, SW1A 1AA")
- On a service booking page, a "Message Provider" button opens a contact form pre-filled with booking context
- Submitting the form creates a message in the `messages` table and sends an email notification to the recipient via Resend
- The recipient sees the message in their inbox on next page load or within 30 seconds (polling)
- Messages are stored in Supabase with RLS restricting access to conversation participants only
- Input is sanitized to prevent XSS

**E05-S02: Inbox**

As a User, I want an inbox showing all my conversations, so I can manage my communications in one place.

Priority: Must

Acceptance Criteria:
- Inbox page lists all conversations sorted by most recent message
- Each conversation shows: other party's name, last message preview (truncated to 100 chars), timestamp, unread indicator
- Clicking a conversation opens the message thread
- Unread count badge displayed in the main navigation header
- Inbox data refreshes via polling every 30 seconds (API call, not WebSocket)
- "Typically responds in X hours" shown per contact, calculated from their average historical response time (single query against `messages` table)

**E05-S03: Message Thread & History**

As a User, I want to view my full message history in a conversation, so I can reference past discussions.

Priority: Must

Acceptance Criteria:
- Messages displayed in chronological order with sender name, timestamp, and content
- Chat bubbles distinguish between sent and received messages
- Cursor-based pagination for scrolling back through history (WHERE created_at < cursor, not OFFSET)
- Loading older messages does not reload the page
- Read status tracked as a single `last_read_at` timestamp per user per conversation (not per-message)
- When a user opens a conversation, their `last_read_at` is updated to NOW() — one UPDATE per conversation view

**E05-S04: File Attachments**

As a User, I want to share files (photos, PDFs) within a conversation, so I can exchange documents related to our interaction.

Priority: Must

Acceptance Criteria:
- Attach button in message composer allows file selection
- Supported types: JPG, PNG, PDF (no GIF, no DOCX — keeps it simple)
- **Images compressed client-side to max 500KB before upload** (using browser Canvas API)
- PDF files capped at 2MB
- Files stored in Supabase Storage, linked to the message via `attachment_url`
- Thumbnails displayed inline for images, file icon + name for PDFs
- Click to download or view in new tab
- Upload progress indicator shown
- Max 20 attachments per conversation
- **12-month retention policy**: pg_cron job deletes attachment files older than 12 months from storage (message text preserved, attachment marked as "expired")

---

### AI Quote System (NEW)

**E05-S05: Trader Rate Card**

As a Tradesperson, I want to set up my pricing (hourly rate, call-out fee, per-service prices), so the platform can help me quote faster.

Priority: Must

Acceptance Criteria:
- Rate card editor in provider dashboard with fields for: call-out fee, hourly rate, day rate
- Per-service pricing table: trader adds service name + price (e.g., "Boiler Service — £120", "Emergency Call-Out — £180")
- Materials markup percentage (optional)
- VAT registration toggle (adds VAT to quotes automatically if registered)
- Rate card stored in `service_provider_details.pricing` JSONB column (already exists in Epic 4 schema)
- Rate card is private — not shown to customers, only used for quote generation

**E05-S06: Market Pricing Data**

As a Platform, I want to maintain benchmark pricing data per trade per region, so traders can see how competitive their quotes are.

Priority: Must

Acceptance Criteria:
- `market_pricing` table stores: service_category, region (postcode district e.g., "SW1"), price_low, price_median, price_high, sample_size, data_source, last_updated
- Seeded at launch with publicly available data from Checkatrade averages, Federation of Master Builders published rates, and trade body guidelines
- Covers at minimum: plumber, electrician, handyman, cleaning, surveying, conveyancing, moving
- Covers major UK regions (London, South East, Midlands, North, Scotland, Wales)
- As traders submit quotes on the platform, organic data is aggregated via a weekly pg_cron job that recalculates medians per category per region (only when sample_size >= 10 from platform data)
- Platform data gradually replaces seed data as it accumulates

**E05-S07: AI Quote Drafting for Tradespeople**

As a Tradesperson, I want the AI to draft a quote when I receive an RFQ, so I can respond faster and win more jobs.

Priority: Must

Acceptance Criteria:
- When a trader views an RFQ in their dashboard, a "Draft Quote with AI" button is available
- Clicking it sends a single Claude Haiku API call with: the RFQ description, the trader's rate card, and the relevant market pricing benchmarks for that trade and region
- The AI returns a structured JSON response with: suggested line items (description + amount), total, estimated duration, and a brief scope of work
- The response is parsed and pre-fills the quote form (from Epic 4)
- A market comparison banner shows: "Your quote: £420 | Market average in SW1: £380-460" with a color indicator (green = competitive, amber = above average, red = significantly above)
- The trader can edit all fields before sending — AI draft is a suggestion, never auto-sent
- "AI Drafted" badge shown on the quote (transparency for the customer)
- AI call cost: ~£0.001 per quote draft (Claude Haiku, ~500 tokens in, ~300 tokens out)
- Fallback: if AI call fails, the quote form opens empty with the trader's rate card line items pre-loaded (template mode)

**E05-S08: AI Quote Drafting for Estate Agents**

As an Estate Agent, I want AI assistance to draft fee proposals and valuation summaries for sellers, so I can respond to valuation requests faster.

Priority: Should

Acceptance Criteria:
- When an agent receives a valuation request (or creates one manually), a "Draft Proposal with AI" button is available
- AI receives: property details (type, beds, baths, postcode), recent Land Registry sold prices for the postcode (free public data), and the agent's standard fee structure
- AI returns: suggested asking price range, comparable properties summary (from Land Registry data), and a draft fee proposal with the agent's commission terms
- Agent reviews and edits before sending to the seller
- Clearly labeled as AI-assisted — "Based on recent sales data. Not a formal valuation."
- No AVM model built — just Land Registry comparables formatted intelligently
- AI call cost: ~£0.002 per proposal (slightly longer prompt)

**E05-S09: Quote Analytics**

As a Tradesperson or Agent, I want to see how my quotes compare to the market and my win rate, so I can price more competitively.

Priority: Should

Acceptance Criteria:
- Quote analytics section in provider dashboard showing: quotes sent (count), quotes accepted (count), win rate (%), average quote amount vs market median
- Data sourced from `quotes` table (Epic 4) aggregated per provider
- Simple bar chart: "Your prices vs market average" per service category
- No AI required — pure SQL aggregation
- Updates daily via pg_cron materialized view refresh (not real-time)

---

### Notifications

**E05-S10: In-App Notification Feed**

As a User, I want to see notifications for important events, so I stay informed.

Priority: Must

Acceptance Criteria:
- Notification bell icon in main navigation with unread count badge
- Clicking opens a dropdown/panel listing recent notifications
- **Event-based architecture**: notifications stored as events in a `platform_events` table (event_type, entity_id, entity_type, actor_id, created_at, metadata JSONB)
- When a user opens their notification feed, a query returns events relevant to them: "SELECT from platform_events WHERE entity_id IN (user's conversations, bookings, saved searches) ORDER BY created_at DESC LIMIT 50"
- One event INSERT per action, NOT one INSERT per recipient — this is the critical cost optimization
- Notification types: new message, new quote received, quote accepted, booking confirmed, booking status change, new RFQ matching provider's services, new property matching saved search, new document shared, milestone updated
- Notifications link to the relevant page
- "Mark all as read" button updates user's `notifications_read_at` timestamp
- Notifications older than 90 days excluded from queries (pg_cron cleanup job deletes monthly)

**E05-S11: Email Notifications**

As a User, I want to receive emails for critical events when I'm not on the platform, so I don't miss important updates.

Priority: Should

Acceptance Criteria:
- **Critical events** (sent immediately, max 5/hour/user): new quote received, quote accepted, booking confirmed, offer received on property
- **Non-critical events** (batched into daily digest at 8am): new messages, new RFQ matches, new property matches, milestone updates
- Emails sent via Resend with Britestate branding
- Each email has a clear CTA button ("View Quote", "Open Inbox", "See Property")
- Users can configure email preferences per category (from Epic 3): All, Critical Only, Daily Digest Only, None
- Unsubscribe link in every email
- Rate limiting: max 5 immediate emails per user per hour, max 1 digest per day
- pg_cron job at 8am UTC batches and sends daily digests

**E05-S12: Notification Preferences**

As a User, I want to control what notifications I receive, so I'm not overwhelmed.

Priority: Must

Acceptance Criteria:
- Settings page (from Epic 3) includes notification preferences
- Toggle per notification category: Messages, Quotes & RFQs, Bookings, Property Alerts, Milestones
- Per category, user chooses: In-App + Email, In-App Only, Off
- Default for new users: all categories In-App + Email (Critical), In-App + Daily Digest (Non-Critical)
- Backend checks preferences before sending any email
- Stored in `user_preferences` JSONB column on profiles table

---

### Document Sharing

**E05-S13: Files Tab on Bookings/Transactions**

As a User involved in a booking or transaction, I want to see all shared files in one place, so I can find documents easily.

Priority: Must

Acceptance Criteria:
- On the booking detail page (Epic 4) and transaction detail page (Phase 6), a "Files" tab is available
- The tab lists all file attachments from messages in the related conversation, plus any directly uploaded files
- Each file shows: filename, uploader name, upload date, file size, download link
- Files sorted by most recent first
- Users can upload files directly to the Files tab (stored in Supabase Storage, linked to the booking/transaction)
- RLS ensures only conversation/transaction participants can access files
- No folder structure, no versioning — simple flat list
- File size limits: same as chat attachments (images 500KB compressed, PDFs 2MB)
- Upload triggers a notification to other participants ("New document shared: invoice.pdf")

---

### Milestone Tracking

**E05-S14: Transaction Milestones**

As a Buyer, Seller, or Agent, I want to track the progress of my property transaction, so I can see what stage we're at.

Priority: Should

Acceptance Criteria:
- On the transaction detail page, a "Progress" section displays a predefined milestone checklist
- Standard UK transaction milestones (hardcoded template):
  1. Offer Accepted
  2. Mortgage Application Submitted
  3. Survey Instructed
  4. Survey Completed
  5. Conveyancing Started
  6. Searches Completed
  7. Contracts Exchanged
  8. Completion
- Each milestone has status: Not Started, In Progress, Completed
- Agent or designated party can update milestone status and add optional notes/dates
- All transaction parties (buyer, seller, agents) see the same view
- Status change triggers in-app notification to all parties
- Simple progress bar showing percentage complete (completed milestones / total milestones)
- Stored in `transaction_milestones` table (transaction_id, milestone_key, status, updated_by, updated_at, notes)

**E05-S15: Service Job Milestones**

As a Customer or Tradesperson, I want to track the progress of a service job, so we both know what stage the work is at.

Priority: Should

Acceptance Criteria:
- On the booking detail page (Epic 4), a "Job Progress" section displays milestones
- Standard service job milestones (hardcoded template):
  1. Quote Accepted
  2. Job Scheduled
  3. Work Started
  4. Work Completed
  5. Payment Received
- Same status/update/notification behavior as transaction milestones
- Provider updates milestones; customer can view

---

### Database Schema

**E05-S16: Schema Definition**

As a Developer, I need the database schema for all Epic 5 features.

Priority: Must

Acceptance Criteria:

Tables created via Supabase migration:

**conversations**
- id (UUID, PK)
- participant_1_id (UUID, FK auth.users)
- participant_2_id (UUID, FK auth.users)
- context_type (TEXT: 'listing', 'booking', 'rfq', 'general')
- context_id (UUID, nullable — links to listing/booking/rfq)
- last_message_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)

**messages**
- id (UUID, PK)
- conversation_id (UUID, FK conversations)
- sender_id (UUID, FK auth.users)
- content (TEXT, max 5000 chars)
- attachment_url (TEXT, nullable)
- attachment_type (TEXT, nullable: 'image', 'pdf')
- attachment_size_bytes (INTEGER, nullable)
- created_at (TIMESTAMPTZ)

**conversation_read_status**
- conversation_id (UUID, FK conversations)
- user_id (UUID, FK auth.users)
- last_read_at (TIMESTAMPTZ)
- PRIMARY KEY (conversation_id, user_id)

**platform_events** (notification feed)
- id (BIGSERIAL, PK)
- event_type (TEXT: 'new_message', 'quote_received', 'booking_confirmed', etc.)
- entity_type (TEXT: 'conversation', 'booking', 'listing', 'rfq', 'transaction')
- entity_id (UUID)
- actor_id (UUID, FK auth.users)
- metadata (JSONB — event-specific data like message preview, quote amount)
- created_at (TIMESTAMPTZ)

**market_pricing**
- id (UUID, PK)
- service_category (service_category enum from Epic 4)
- region (TEXT — postcode district, e.g., "SW1", "M1", "B1")
- price_low (NUMERIC 10,2)
- price_median (NUMERIC 10,2)
- price_high (NUMERIC 10,2)
- sample_size (INTEGER)
- data_source (TEXT: 'seed', 'platform', 'blended')
- last_updated (TIMESTAMPTZ)

**transaction_milestones**
- id (UUID, PK)
- transaction_id (UUID, FK — linked to transaction in Phase 6)
- milestone_key (TEXT: 'offer_accepted', 'mortgage_submitted', etc.)
- status (TEXT: 'not_started', 'in_progress', 'completed')
- updated_by (UUID, FK auth.users)
- updated_at (TIMESTAMPTZ)
- notes (TEXT, nullable)
- completed_date (DATE, nullable)

**service_job_milestones**
- id (UUID, PK)
- booking_id (UUID, FK bookings from Epic 4)
- milestone_key (TEXT: 'quote_accepted', 'job_scheduled', etc.)
- status (TEXT: 'not_started', 'in_progress', 'completed')
- updated_by (UUID, FK auth.users)
- updated_at (TIMESTAMPTZ)
- notes (TEXT, nullable)

Indexes:
- messages: (conversation_id, created_at DESC) — for cursor pagination
- platform_events: (entity_id, created_at DESC) — for notification feed queries
- platform_events: (created_at) WHERE created_at < NOW() - INTERVAL '90 days' — for cleanup
- market_pricing: (service_category, region) UNIQUE
- transaction_milestones: (transaction_id)
- service_job_milestones: (booking_id)

RLS Policies:
- conversations: users can only SELECT/INSERT where they are participant_1 or participant_2
- messages: users can only access messages in their conversations
- conversation_read_status: users can only UPDATE their own read status
- platform_events: query filtered by entity_id at application level (events table itself has no RLS — the query restricts results to user's entities)
- market_pricing: public read, admin-only write
- transaction/job milestones: only transaction/booking participants can access

pg_cron Jobs:
- Daily 2am: DELETE FROM platform_events WHERE created_at < NOW() - INTERVAL '90 days'
- Daily 8am: batch and send daily digest emails
- Weekly Sunday 3am: recalculate market_pricing from platform quote data
- Monthly 1st 4am: DELETE attachment files from Supabase Storage where message.created_at < NOW() - INTERVAL '12 months'

---

## 5. Acceptance Criteria (General)

- Users can send and receive messages with file attachments from any relevant context (listing, booking, RFQ)
- Inbox displays all conversations with unread indicators, refreshing via 30s polling
- AI drafts quotes for tradespeople and agents with market price comparison, costing < £0.002 per draft
- In-app notification feed shows relevant events without per-user row fan-out
- Email notifications sent immediately for critical events, batched daily for non-critical
- Files tab on bookings/transactions aggregates all shared documents
- Milestone tracking available for transactions and service jobs with manual updates
- Total monthly infrastructure cost at 100K users: under $200 (excluding Supabase base plan)

---

## 6. Dependencies

- Epic 1: Authentication — users must be authenticated
- Epic 2: Property listings — context for agent messaging, saved search alerts
- Epic 3: Dashboards and profiles — notification preferences, provider dashboard for rate card and quote analytics
- Epic 4: Marketplace — RFQ and quote tables, booking tables, service_provider_details with pricing JSONB
- Supabase Storage: file attachments
- Resend: email notifications
- Anthropic Claude API (Haiku): AI quote drafting (~£0.001-0.002 per call)
- Land Registry Price Paid Data (free, public): for agent valuation proposals
- Seeded market pricing data: from Checkatrade, trade body publications

---

## 7. Technical Considerations

### Messaging Architecture
- **No WebSockets at MVP.** Polling-based inbox via API route. Supabase Realtime only introduced post product-market fit when revenue justifies the cost.
- **No presence tracking.** "Typically responds in X hours" calculated as AVG(response_time) from messages table — one query, cached daily.
- **No per-message read receipts.** Single `last_read_at` timestamp per user per conversation. One UPDATE per conversation open, not per message viewed.
- **Cursor-based pagination** for message history: `WHERE created_at < ?` not `OFFSET`.

### AI Quote System
- **Single API call per quote draft.** Claude Haiku with structured JSON output. Prompt includes: RFQ description (from customer), trader's rate card (from provider profile), market benchmarks (from market_pricing table).
- **No self-hosted models.** Use Anthropic Claude API via SDK already in the stack. Switch to self-hosted only when API costs exceed £2,000/mo.
- **Graceful degradation.** If AI call fails or times out (>5s), fall back to template-based quote form pre-filled from trader's rate card.
- **Market data seeding.** Manual research to populate market_pricing table before launch. ~50-100 rows covering major trades x major UK regions.

### Notifications
- **Event-based, not fan-out.** Store the event once. Query relevant events at read time. This is O(1) writes vs O(n) writes per notification.
- **Email rate limiting.** Max 5 immediate emails/user/hour. Daily digest for everything else. Prevents email cost explosion.
- **90-day retention.** pg_cron cleanup prevents unbounded table growth.

### Security
- **TLS in transit** (automatic with HTTPS/Supabase) + **RLS at rest** (row-level security on all tables). No end-to-end encryption — it's unnecessary for property communications and would prevent server-side search/moderation.
- **Input sanitization** on all message content to prevent XSS.
- **File type validation** server-side using `file-type` library (check magic bytes, not just extension).

### File Storage
- **Client-side image compression** before upload (Canvas API, target 500KB).
- **2MB cap** for all uploads.
- **12-month retention** with automated cleanup.
- **Supabase Storage only** — no R2, no S3, no additional storage infra.

---

## 8. Design & UX Notes

- Inbox should look like email, not WhatsApp. Simple list of conversations, not a chat app.
- "Draft Quote with AI" button should be prominent on the RFQ detail page — this is the money feature.
- Market price comparison should use traffic light colors: green (competitive), amber (above average), red (significantly above).
- Notification feed: simple dropdown from bell icon. No need for a full notification page at MVP.
- Milestone progress: horizontal stepper or vertical checklist. Keep it simple.
- AI-generated content always labeled: "AI Draft" badge on quotes, "Based on recent sales data" on agent proposals.
- Contact forms should be short: message text + optional attachment. No unnecessary fields.

---

## 9. Cost Projection

| Component | At 10K users/mo | At 100K users/mo | At 1M users/mo |
|-----------|----------------|-----------------|----------------|
| Messaging (polling API) | $0 (Supabase plan) | $0 | $0 |
| AI quote drafts (Claude Haiku) | ~$3 | ~$30 | ~$300 |
| Email (Resend) | ~$5 | ~$40 | ~$300 |
| File storage (Supabase) | ~$3 | ~$30 | ~$250 |
| pg_cron jobs | $0 (Supabase plan) | $0 | $0 |
| **Total** | **~$11/mo** | **~$100/mo** | **~$850/mo** |

Compare to original spec: $4,300-8,800/mo at 1M users.

---

## 10. QA & Testing Strategy

**Unit Tests:**
- Message creation and validation
- AI quote prompt construction and response parsing
- Notification event creation
- Market pricing aggregation logic
- File type validation and size checking

**Integration Tests:**
- Send message -> recipient sees it in inbox (polling)
- Submit RFQ -> trader clicks "Draft Quote with AI" -> quote form pre-filled
- Booking confirmed -> platform_event created -> shows in notification feed
- Email digest batching: events created before 8am appear in digest
- File upload -> stored in Supabase Storage -> accessible by conversation participants only
- Milestone update -> notification sent to all parties

**E2E Tests:**
- Full flow: buyer contacts agent from listing -> agent replies -> buyer sees reply in inbox
- Full flow: customer creates RFQ -> trader receives notification -> trader drafts AI quote -> customer receives quote -> accepts -> booking created
- Full flow: agent receives valuation request -> drafts AI proposal with Land Registry comparables -> sends to seller
- Notification preferences: user disables email for messages -> no email sent on new message, but in-app notification still appears

**Performance Tests:**
- Inbox query < 100ms for user with 100 conversations
- Message history cursor pagination < 50ms regardless of conversation length
- AI quote draft < 3s end-to-end (including API call)
- Notification feed query < 100ms
- Daily digest email batch completes within 10 minutes for 100K users

---

*Original spec: epic5.txt (May 13, 2025)*
*Cost analysis: epic5costanalysis.md (March 7, 2026)*
*This rewrite: March 7, 2026*
*Key changes: Removed WebSocket chat, presence, per-message read receipts. Added AI quote system. Replaced notification fan-out with event-based feed. Added market pricing intelligence. Added file retention policy. Added milestone tracking.*
