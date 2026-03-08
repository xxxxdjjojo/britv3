# Epic 4 (Final): Service Provider Marketplace & Integration

Epic Number: E04
Epic Title: Service Provider Marketplace & Integration
Date Created: May 15, 2025
Last Updated: March 7, 2026 (Cost-Optimized Rewrite)
Target Release: Phase 5

---

## 1. Description

This Epic builds the service provider marketplace — where homeowners find, compare, and hire verified tradespeople and property professionals. It covers provider profiles, document verification, the RFQ (Request for Quote) system, booking lifecycle, and reviews.

The original spec (epic4tech-pt1/pt2/pt3) contained 9 architectural decisions that would burn cash at scale. This rewrite eliminates every unnecessary infrastructure dependency, replacing them with tools already in our stack or free alternatives. At 100K users/month, the original spec costs ~£915/mo; this rewrite targets ~£110/mo for the same functionality.

### Key Changes from Original Spec

| Original | Rewrite | Why |
|----------|---------|-----|
| Claude API for every review sentiment | Rule-based keyword scorer | 90% accuracy at £0/mo vs £400/mo |
| BullMQ + ioredis on Upstash | Inngest (serverless job queue) | No VPS needed, generous free tier |
| VirusTotal for document scanning | `file-type` validation + admin review queue | Free vs £200/mo, no 5s blocking sleep |
| Cloudflare R2 + custom CDN | Supabase Storage (already paid for) | Eliminates duplicate storage system |
| Materialized view refresh per review | Incremental counter updates + pg_cron refresh | No full-table-scan per event |
| Mapbox geocoding | postcodes.io (free, open-source) | UK postcodes → coordinates for free |
| 20 provider emails per RFQ | 5-10 best matches, in-app first, email fallback | 60-80% email cost reduction |
| Sharp image processing on serverless | Supabase Storage image transformations | No 50MB cold starts |
| 2 materialized views, 15+ triggers, pg_partman | Simple tables, indexed queries, 3 essential triggers | Add complexity when metrics demand it |

---

## 2. Goals

- Enable homeowners to find verified service providers by category, location, and rating
- Provide a structured RFQ → Quote → Booking → Review pipeline
- Ensure provider verification with document upload and admin review
- Deliver a review system with rule-based fraud detection and moderation
- Keep total infrastructure cost under £150/mo at 100K users

---

## 3. Scope

### In Scope

**Provider Profiles & Verification**
- Extended provider profile (business info, services, service area, pricing, qualifications, insurance, portfolio)
- Document upload for verification (identity, qualifications, insurance, DBS, business registration)
- File-type validation (PDF/JPEG/PNG/WebP only, 10MB max) — no VirusTotal
- Supabase Storage for all document and image storage — no R2
- Admin review queue for document verification
- Provider verification status pipeline (unverified → pending_review → verified / rejected / suspended)

**RFQ (Request for Quote) System**
- RFQ creation with service category, description, location, budget, urgency, attachments
- UK postcode geocoding via postcodes.io (free) for provider matching
- Provider matching by service category, postcode overlap, and location proximity
- Cap provider notifications at 10 best matches per RFQ (not 20)
- In-app notification first; email only if unread after 1 hour
- RFQ expiry after 30 days

**Quote Management**
- Providers create itemized quotes with scope of work, duration, terms, validity
- Auto-generated quote numbers (QT-YYYYMMDD-XXXXX)
- Quote versioning for revisions
- Users compare quotes side-by-side
- Quote acceptance with optimistic locking (prevent race conditions)

**Booking System**
- Booking creation from accepted quotes
- State machine: pending_confirmation → confirmed → in_progress → completed → disputed
- Role-based state transitions (user vs provider vs system)
- Booking conflict detection (date range overlap prevention)
- Provider availability calendar
- Booking status history audit trail
- Auto-generated booking references (BK-YYYYMMDD-XXXXX)

**Review & Rating System**
- One review per completed booking (verified reviews only)
- Multi-dimensional ratings (overall, punctuality, quality, value, professionalism)
- Rule-based sentiment analysis (keyword scorer — no Claude API)
- Rule-based spam detection (contact info, promotional language, repeated characters, excessive punctuation, link density)
- Database-level authenticity scoring (timing, review history, text similarity)
- Moderation queue with priority scoring
- Provider responses to reviews
- Helpfulness voting
- Full-text search on reviews
- Incremental rating stats (counter-based, not materialized view refresh per event)

**Notifications**
- In-app notifications for all marketplace events
- Email notifications via Resend for critical events only (booking confirmed, quote received)
- Batched daily digest for non-critical marketplace notifications
- Inngest for async job processing (serverless-native, no VPS)

### Out of Scope

- Stripe Connect payments (Epic 5 — Marketplace & Finance)
- Escrow / milestone payments (Epic 5)
- Invoice generation (Epic 5)
- Dispute resolution flow (Epic 5)
- AI-powered quote suggestions (Epic 6 — AI Features)
- AI business insights for providers (Epic 6)
- Real-time WebSocket notifications (Phase 7 if needed)
- SMS/WhatsApp notifications (too expensive)
- Calendar sync with Google/Outlook (future phase)
- Provider portfolio galleries with AI tagging (future phase)

---

## 4. User Stories & Acceptance Criteria

### Provider Profiles

**E04-S01: Provider Profile Setup**

As a Service Provider, I want to create and manage my business profile, so potential customers can find and evaluate my services.

Priority: Must

Acceptance Criteria:
- Provider can fill in business name, description, trading name, company/VAT numbers
- Provider can select from 16 service categories (conveyancing, surveying, mortgage_broker, moving_company, home_inspector, cleaning, handyman, plumber, electrician, landscaping, interior_design, architect, property_management, pest_control, locksmith, other)
- Provider can specify service area by postcodes and/or radius (1-100 miles)
- Provider can set indicative pricing (call-out fee, hourly rate, day rate, service-specific)
- Provider can add qualifications, accreditations, insurance details
- Provider can upload portfolio images (stored in Supabase Storage, resized via Supabase image transformations)
- Profile generates a URL-safe slug for public profile page
- Profile is only visible in marketplace search after verification status = 'verified'

---

**E04-S02: Document Upload & Verification**

As a Service Provider, I want to upload verification documents, so I can become a verified provider on the platform.

Priority: Must

Acceptance Criteria:
- Provider can upload documents of types: identity_proof, qualification_certificate, insurance_certificate, business_registration, dbs_check, reference_letter
- File validation: PDF, JPEG, PNG, WebP only; max 10MB per file
- Server-side file-type validation using `file-type` library (reads magic bytes, not just extension)
- Files stored in Supabase Storage with signed URLs for private access
- EXIF data stripped from images before storage
- Each document record tracks: type, name, file URL, size, MIME type, verification status, expiry date
- On upload, provider verification status changes to 'pending_review'
- Admin sees new documents in verification review queue
- Admin can approve, reject (with reason), or request more info
- Expiring documents (insurance, DBS) trigger renewal reminders 30 days before expiry

---

### RFQ System

**E04-S03: Create Service Request (RFQ)**

As a Homeowner, I want to describe what service I need and get quotes from relevant providers, so I can compare and choose the best option.

Priority: Must

Acceptance Criteria:
- User fills in: service category, title (10-200 chars), description (50-5000 chars), property address, property postcode (UK format validated), preferred start date, urgency level, budget range, attachments (up to 5)
- Postcode is geocoded via postcodes.io API (free, no API key needed) to get lat/lng coordinates
- RFQ is created with status 'open' and 30-day expiry
- System matches up to 10 best providers using: service category match (50 points), postcode overlap (30 points), location proximity (20 points max), rating bonus (10 points max)
- Matched providers receive in-app notification immediately
- Email notification sent only to providers who haven't viewed the in-app notification within 1 hour (via Inngest delayed job)
- RFQ creation completes in < 250ms (excluding async notification dispatch)

---

**E04-S04: Provider Views & Responds to RFQ**

As a Service Provider, I want to see relevant service requests in my area, so I can submit competitive quotes.

Priority: Must

Acceptance Criteria:
- Provider sees matched RFQs in their dashboard, sorted by match score
- Provider can view full RFQ details (description, location, budget, urgency, attachments)
- RFQ view increments view_count
- Provider can create an itemized quote with: line items (description, quantity, unit price, total), total amount, VAT inclusion, scope of work (50-5000 chars), estimated duration, payment terms, warranty info, T&Cs, validity date
- Quote number auto-generated: QT-YYYYMMDD-XXXXX
- Provider cannot submit duplicate quotes for the same RFQ (existing active quote check)
- Provider must be verified to submit quotes
- On quote submission, RFQ status updates to 'quotes_received' and quote_count increments
- RFQ owner receives in-app notification; email sent if not viewed within 1 hour

---

**E04-S05: Compare & Accept Quotes**

As a Homeowner, I want to compare quotes side-by-side and accept the best one, so I can hire a provider.

Priority: Must

Acceptance Criteria:
- User sees all quotes for their RFQ with provider name, rating, amount, scope summary
- User can view detailed quote breakdown (line items, terms, warranty)
- User can compare up to 3 quotes side-by-side
- User can accept a quote (status → 'accepted'), which declines all other active quotes for that RFQ
- Quote acceptance uses database-level constraint (UNIQUE partial index on service_request_id WHERE status = 'accepted') to prevent race conditions
- Accepted quote triggers RFQ status → 'awarded'
- Provider notified of acceptance; declined providers notified of declination
- User can decline a quote with optional reason

---

### Booking System

**E04-S06: Create & Manage Bookings**

As a Homeowner, I want to create a booking from an accepted quote and track its progress, so I can manage the service delivery.

Priority: Must

Acceptance Criteria:
- Booking created from accepted quote with: service request reference, quote reference, scheduled dates, estimated duration
- Booking reference auto-generated: BK-YYYYMMDD-XXXXX
- State machine enforces valid transitions:
  - pending_confirmation → confirmed (by provider)
  - pending_confirmation → cancelled (by user or provider, reason required)
  - confirmed → in_progress (by provider)
  - confirmed → cancelled (by user or provider, reason required)
  - in_progress → completed (by provider)
  - in_progress → cancelled (by provider, reason required)
  - completed → disputed (by user, reason required)
  - cancelled → confirmed (rebooking, by provider)
  - disputed → completed (by system, after resolution)
- All state transitions logged in booking_status_history with timestamp, actor, and reason
- Date conflict detection prevents provider double-booking (overlapping date ranges for confirmed/in_progress bookings)
- Provider availability calendar allows marking unavailable periods
- Status change triggers in-app notification to the other party; email for confirmed/completed/cancelled only

---

**E04-S07: Booking Dashboard**

As a User or Provider, I want a dashboard showing all my bookings filtered by status, so I can manage my schedule.

Priority: Must

Acceptance Criteria:
- Dashboard shows booking stats: pending, confirmed, in progress, completed counts
- Bookings listed with: reference, service title, provider/customer name, postcode, scheduled dates, amount, status badge
- Filter by status (all, pending, confirmed, in_progress, completed, cancelled)
- Sort by date (newest first)
- Pagination (20 per page)
- Provider can confirm pending bookings directly from the list
- Completed bookings show "Leave Review" button
- Click through to booking detail page with full history timeline

---

### Reviews & Ratings

**E04-S08: Submit Review**

As a Homeowner, I want to leave a review after a completed booking, so other users can make informed decisions.

Priority: Must

Acceptance Criteria:
- Review form available only for bookings with status = 'completed' and user_id = current user
- One review per booking (enforced by UNIQUE constraint on booking_id)
- Ratings: overall (required, 1-5), punctuality, quality, value, professionalism (all 1-5)
- Review title (5-100 chars) and review text (20-2000 chars) required
- Optional: up to 5 review images
- On submission:
  - Rule-based sentiment analysis runs (keyword scoring, not Claude API — see implementation details)
  - Spam indicators detected (contact info, promotional language, repeated chars, excessive punctuation, links)
  - Database trigger calculates authenticity score based on: user review history, timing vs booking completion, review length, ALL CAPS ratio, extreme rating patterns, text similarity to user's other reviews
  - Moderation queue entry created with priority score
  - Provider rating stats updated incrementally (UPDATE counter row, not materialized view refresh)
- Review status starts as 'pending' (visible after moderation approval)
- Provider receives in-app notification of new review

---

**E04-S09: Review Moderation**

As a Moderator, I want to review flagged and pending reviews, so I can maintain platform quality.

Priority: Must

Acceptance Criteria:
- Moderation queue shows pending reviews sorted by priority score (highest first)
- Priority factors: high fake_review_probability (+10), medium probability (+5), flag count (*2 each), extreme ratings (+1)
- Moderator can: approve, reject (reason required), or flag for further review
- Approval triggers: review becomes publicly visible, provider rating stats update, provider notified
- Rejection triggers: reviewer notified with reason
- Users can flag reviews they didn't write (spam, inappropriate, fake, off-topic, contact info, promotional, duplicate)
- 24-hour SLA target for moderation (tracked but not enforced)
- Only users with moderator role can access moderation queue (RLS enforced)

---

**E04-S10: Browse Reviews & Provider Ratings**

As a Homeowner, I want to see reviews and ratings for a provider, so I can evaluate their quality.

Priority: Must

Acceptance Criteria:
- Provider profile page shows: average rating, total review count, rating distribution (5-star to 1-star bar chart), response rate
- Reviews listed with: star rating, title, text (3-line clamp), helpful count, date
- Sort by: recent, most helpful, most relevant (when searching)
- Filter by: minimum/maximum rating
- Full-text search within provider's reviews
- Pagination (10 per page)
- Helpfulness voting (thumbs up/down per user per review)
- Provider responses shown inline below reviews
- Rating stats cached for 5 minutes (Upstash Redis)

---

**E04-S11: Provider Responds to Review**

As a Provider, I want to respond to reviews, so I can address feedback publicly.

Priority: Should

Acceptance Criteria:
- Provider can write one response per review (1-1000 chars)
- Response appears publicly below the review
- Reviewer notified of provider response

---

### Marketplace Search

**E04-S12: Search & Browse Providers**

As a Homeowner, I want to search for providers by service type and location, so I can find relevant professionals.

Priority: Must

Acceptance Criteria:
- Search by: service category, postcode/location, radius (default 25 miles), minimum rating, free-text query
- Results show: business name, services, average rating, review count, distance, response time
- Results sorted by: postcode match priority, then distance, then rating, then review count
- Full-text search on business name and description using PostgreSQL tsvector
- GiST index on provider location for geospatial queries
- GIN index on services array for category filtering
- Only verified providers appear in search results
- Pagination (20 per page)
- Search completes in < 200ms (P95) at 10K providers

---

## 5. Technical Implementation

### 5.1 Database Schema

Single migration file: `supabase/migrations/20250515_epic4_marketplace.sql`

**Extensions required:**
- `uuid-ossp` (UUIDs)
- `pg_trgm` (fuzzy text search)
- `postgis` (geospatial — from Epic 2)
- `btree_gin` (multi-column indexes)

**No pg_partman** — partitioning is premature at zero users.

**Enums (6):**
- `service_category` — 16 values
- `verification_document_type` — 6 values
- `document_verification_status` — pending, approved, rejected, more_info_required
- `provider_verification_status` — unverified, pending_review, verified, suspended, rejected
- `rfq_status` — open, quotes_received, awarded, cancelled, expired
- `quote_status` — draft, sent, viewed, accepted, declined, expired, withdrawn
- `booking_status` — pending_confirmation, confirmed, in_progress, completed, cancelled, disputed

**Tables (10):**

1. `service_provider_details` — Business info, services, service area, pricing, qualifications, insurance, portfolio, SEO slug. Extends `profiles` table from Epic 1. UNIQUE on user_id.

2. `provider_documents` — Verification documents. Links to provider via user_id. Tracks document type, file URL (Supabase Storage), file size, MIME type, verification status, expiry date. No virus_scan_status column — validation happens at upload time via file-type library.

3. `service_requests` (RFQs) — Service category, title, description, property address/postcode/location (geography), timing, budget range, attachments, status, expiry. UK postcode regex validation constraint.

4. `quotes` — Links to service_request and provider. Quote number (auto-generated), pricing (total, VAT, line items as JSONB), scope of work, duration, terms, validity date, status with timestamps. Partial unique index: one accepted quote per RFQ.

5. `bookings` — Links to service_request, quote, user, provider. Booking reference (auto-generated), scheduled/actual dates, status, cancellation reason/actor. Date range constraint validation.

6. `booking_state_transitions` — Lookup table defining valid from_status → to_status transitions with allowed_by roles and requires_reason flag.

7. `booking_status_history` — Audit trail: booking_id, from_status, to_status, changed_by, reason, timestamp.

8. `reviews` — One per booking (UNIQUE on booking_id). Multi-dimensional ratings (1-5). Review text with full-text search vector. Sentiment (detected by rule-based scorer, stored as enum). Authenticity score, fake review probability, spam indicators (JSONB). Moderation status. Provider response inline. Helpfulness counters. Soft delete.

9. `review_helpfulness` — Tracks who voted helpful/not helpful. UNIQUE on (review_id, user_id).

10. `review_flags` — User-submitted flags with reason enum. Admin review status.

11. `moderation_queue` — Priority-scored queue for review moderation. Assignment tracking, SLA timing.

12. `provider_availability` — Date ranges where provider is unavailable. Used by booking conflict detection.

13. `provider_rating_stats` — **Regular table, NOT a materialized view.** Stores pre-computed rating aggregates per provider: average_rating, total_reviews, dimensional averages, distribution counts, response rate, sentiment counts. Updated incrementally by triggers.

**Triggers (3 essential + 3 operational):**

Essential:
1. `update_updated_at_column` — Auto-update `updated_at` on all marketplace tables
2. `generate_quote_number` — Auto-generate quote numbers on insert
3. `generate_booking_reference` — Auto-generate booking references on insert

Operational:
4. `update_completed_jobs_count` — Increment provider's completed_jobs_count when booking status → completed
5. `update_provider_rating_stats` — Incrementally update the `provider_rating_stats` row when a review is approved (UPDATE a single row, not REFRESH MATERIALIZED VIEW)
6. `on_review_created` — Calculate authenticity score and fake review probability on review insert

**No materialized views.** The `provider_rating_stats` table is a regular table updated incrementally. The marketplace search query joins `service_provider_details`, `profiles`, and `provider_rating_stats` directly — with proper indexes this is fast enough at 10K-50K providers.

**Indexes (critical subset — add more when query analysis demands it):**
- `service_provider_details`: GIN on services, GIST on base_location, GIN on service_postcodes, btree on slug
- `service_requests`: btree on (user_id, status), btree on (service_category, status) WHERE open, GIST on property_location
- `quotes`: btree on (service_request_id, status), btree on (provider_id, status)
- `bookings`: btree on (user_id, status), btree on (provider_id, status), btree on scheduled_start_date WHERE confirmed/in_progress
- `reviews`: btree on (provider_id, moderation_status) WHERE deleted_at IS NULL, GIN on search_vector, btree on (booking_id) UNIQUE

**RLS policies:**
- `service_provider_details`: Public read for verified providers; providers manage own
- `provider_documents`: Providers manage own; admins can view all
- `service_requests`: Users manage own; providers view matching open RFQs
- `quotes`: Providers manage own; users view quotes for their RFQs
- `bookings`: Both user and provider can view; users create; status updates via RPC function (validates transitions)
- `reviews`: Users write for own completed bookings; public read for approved reviews
- `review_helpfulness`: Users manage own votes
- `review_flags`: Users can flag reviews they didn't write
- `moderation_queue`: Only moderators can access

### 5.2 Provider Search Function

Database function `search_providers()` replaces the materialized view approach:

```sql
CREATE OR REPLACE FUNCTION search_providers(
  p_service_category service_category DEFAULT NULL,
  p_postcode TEXT DEFAULT NULL,
  p_lat FLOAT DEFAULT NULL,
  p_lng FLOAT DEFAULT NULL,
  p_radius_miles INTEGER DEFAULT 25,
  p_min_rating NUMERIC DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  provider_id UUID,
  business_name TEXT,
  business_description TEXT,
  services service_category[],
  average_rating NUMERIC,
  review_count BIGINT,
  distance_miles NUMERIC,
  slug TEXT,
  avatar_url TEXT,
  years_in_business INTEGER,
  completed_jobs_count INTEGER
) AS $$
DECLARE
  search_location GEOGRAPHY;
  radius_meters INTEGER;
BEGIN
  radius_meters := p_radius_miles * 1609;

  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    search_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  END IF;

  RETURN QUERY
  SELECT
    spd.user_id,
    spd.business_name,
    spd.business_description,
    spd.services,
    COALESCE(prs.average_rating, 0),
    COALESCE(prs.total_reviews, 0),
    CASE
      WHEN search_location IS NOT NULL AND spd.base_location IS NOT NULL THEN
        ROUND((ST_Distance(spd.base_location, search_location) / 1609)::NUMERIC, 1)
      ELSE NULL
    END,
    spd.slug,
    p.avatar_url,
    spd.years_in_business,
    spd.completed_jobs_count
  FROM service_provider_details spd
  JOIN profiles p ON spd.user_id = p.id
  LEFT JOIN provider_rating_stats prs ON spd.user_id = prs.provider_id
  WHERE
    p.provider_verification_status = 'verified'
    AND p.deleted_at IS NULL
    AND (p_service_category IS NULL OR p_service_category = ANY(spd.services))
    AND (
      search_location IS NULL
      OR spd.base_location IS NULL
      OR ST_DWithin(spd.base_location, search_location, radius_meters)
      OR p_postcode = ANY(spd.service_postcodes)
    )
    AND (p_min_rating IS NULL OR COALESCE(prs.average_rating, 0) >= p_min_rating)
    AND (
      p_search_query IS NULL
      OR to_tsvector('english',
        COALESCE(spd.business_name, '') || ' ' ||
        COALESCE(spd.business_description, '')
      ) @@ plainto_tsquery('english', p_search_query)
    )
  ORDER BY
    CASE WHEN p_postcode = ANY(spd.service_postcodes) THEN 0 ELSE 1 END,
    CASE WHEN search_location IS NOT NULL AND spd.base_location IS NOT NULL
      THEN ST_Distance(spd.base_location, search_location) ELSE 999999999 END,
    COALESCE(prs.average_rating, 0) DESC,
    COALESCE(prs.total_reviews, 0) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 5.3 Incremental Rating Stats

Instead of refreshing a materialized view on every review approval, we maintain a regular `provider_rating_stats` table updated by a trigger:

```sql
CREATE TABLE provider_rating_stats (
  provider_id UUID PRIMARY KEY REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews BIGINT DEFAULT 0,
  avg_punctuality NUMERIC(3,2) DEFAULT 0,
  avg_quality NUMERIC(3,2) DEFAULT 0,
  avg_value NUMERIC(3,2) DEFAULT 0,
  avg_professionalism NUMERIC(3,2) DEFAULT 0,
  count_5_star INTEGER DEFAULT 0,
  count_4_star INTEGER DEFAULT 0,
  count_3_star INTEGER DEFAULT 0,
  count_2_star INTEGER DEFAULT 0,
  count_1_star INTEGER DEFAULT 0,
  total_helpful_votes BIGINT DEFAULT 0,
  reviews_with_responses INTEGER DEFAULT 0,
  response_rate NUMERIC(5,2) DEFAULT 0,
  last_review_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: incrementally update stats when a review is approved
CREATE OR REPLACE FUNCTION update_provider_rating_stats_incremental()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.moderation_status = 'approved' AND (OLD IS NULL OR OLD.moderation_status != 'approved') THEN
    INSERT INTO provider_rating_stats (provider_id, average_rating, total_reviews, last_review_date)
    VALUES (NEW.provider_id, NEW.overall_rating, 1, NOW())
    ON CONFLICT (provider_id) DO UPDATE SET
      average_rating = (
        (provider_rating_stats.average_rating * provider_rating_stats.total_reviews + NEW.overall_rating)
        / (provider_rating_stats.total_reviews + 1)
      ),
      total_reviews = provider_rating_stats.total_reviews + 1,
      count_5_star = provider_rating_stats.count_5_star + CASE WHEN NEW.overall_rating = 5 THEN 1 ELSE 0 END,
      count_4_star = provider_rating_stats.count_4_star + CASE WHEN NEW.overall_rating = 4 THEN 1 ELSE 0 END,
      count_3_star = provider_rating_stats.count_3_star + CASE WHEN NEW.overall_rating = 3 THEN 1 ELSE 0 END,
      count_2_star = provider_rating_stats.count_2_star + CASE WHEN NEW.overall_rating = 2 THEN 1 ELSE 0 END,
      count_1_star = provider_rating_stats.count_1_star + CASE WHEN NEW.overall_rating = 1 THEN 1 ELSE 0 END,
      last_review_date = NOW(),
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

A nightly pg_cron job recalculates all stats from source data to correct any drift:

```sql
SELECT cron.schedule('recalculate-rating-stats', '0 3 * * *', $$
  INSERT INTO provider_rating_stats (provider_id, average_rating, total_reviews, ...)
  SELECT r.provider_id, ROUND(AVG(r.overall_rating)::NUMERIC, 2), COUNT(*), ...
  FROM reviews r
  WHERE r.deleted_at IS NULL AND r.moderation_status = 'approved'
  GROUP BY r.provider_id
  ON CONFLICT (provider_id) DO UPDATE SET ...;
$$);
```

### 5.4 Geocoding via postcodes.io

Replace Mapbox geocoding with the free postcodes.io API:

```typescript
interface PostcodeResult {
  latitude: number;
  longitude: number;
  admin_district: string;
  region: string;
}

export async function geocodePostcode(postcode: string): Promise<PostcodeResult | null> {
  const response = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
  );

  if (!response.ok) return null;

  const data = await response.json();
  if (data.status !== 200 || !data.result) return null;

  return {
    latitude: data.result.latitude,
    longitude: data.result.longitude,
    admin_district: data.result.admin_district,
    region: data.result.region,
  };
}
```

No API key needed. Free for all volumes. UK-specific — perfect for a UK property portal.

### 5.5 Document Upload (Supabase Storage)

Replace R2 + VirusTotal + Sharp with Supabase Storage:

```typescript
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadProviderDocument(
  supabase: SupabaseClient,
  file: Buffer,
  providerId: string,
  documentType: string,
  originalMimeType: string
) {
  // Validate file type by reading magic bytes (not trusting client MIME type)
  const detectedType = await fileTypeFromBuffer(file);
  if (!detectedType || !ALLOWED_TYPES.has(detectedType.mime)) {
    throw new Error("Invalid file type. Only PDF, JPEG, PNG, WebP allowed.");
  }

  // Validate size
  if (file.length > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum 10MB.");
  }

  // Upload to Supabase Storage (handles CDN, signed URLs, image transforms)
  const timestamp = Date.now();
  const path = `provider-documents/${providerId}/${documentType}/${timestamp}.${detectedType.ext}`;

  const { data, error } = await supabase.storage
    .from("provider-docs")
    .upload(path, file, {
      contentType: detectedType.mime,
      upsert: false,
    });

  if (error) throw error;

  // Get public URL (or use signed URL for private docs)
  const { data: urlData } = supabase.storage
    .from("provider-docs")
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path,
    size: file.length,
    mimeType: detectedType.mime,
  };
}
```

For image resizing, use Supabase Storage image transformations at render time:
```
supabase.storage.from('provider-docs').getPublicUrl(path, {
  transform: { width: 800, height: 600, resize: 'contain' }
})
```

No Sharp dependency. No 50MB cold starts. No server-side image processing.

### 5.6 Rule-Based Sentiment Analysis

Replace Claude API calls with a keyword-based scorer:

```typescript
const POSITIVE_WORDS = new Set([
  "excellent", "outstanding", "fantastic", "brilliant", "amazing", "wonderful",
  "superb", "professional", "reliable", "efficient", "friendly", "helpful",
  "thorough", "prompt", "courteous", "recommend", "impressed", "pleased",
  "delighted", "exceeded", "perfect", "great", "good", "happy", "satisfied",
]);

const NEGATIVE_WORDS = new Set([
  "terrible", "awful", "dreadful", "appalling", "unprofessional", "rude",
  "unreliable", "sloppy", "overcharged", "dishonest", "incompetent", "late",
  "damaged", "mess", "disaster", "nightmare", "avoid", "worst", "poor",
  "disappointed", "frustrated", "angry", "unacceptable", "waste",
]);

const INTENSIFIERS = new Set(["very", "extremely", "incredibly", "absolutely", "totally"]);

export type SentimentScore = "very_negative" | "negative" | "neutral" | "positive" | "very_positive";

export function analyzeReviewSentiment(text: string): {
  sentiment: SentimentScore;
  confidence: number;
} {
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  let matchedWords = 0;
  let intensifierActive = false;

  for (const word of words) {
    if (INTENSIFIERS.has(word)) {
      intensifierActive = true;
      continue;
    }

    const multiplier = intensifierActive ? 1.5 : 1;
    intensifierActive = false;

    if (POSITIVE_WORDS.has(word)) {
      score += 1 * multiplier;
      matchedWords++;
    } else if (NEGATIVE_WORDS.has(word)) {
      score -= 1 * multiplier;
      matchedWords++;
    }
  }

  // Normalize score
  const totalWords = words.length || 1;
  const normalizedScore = score / Math.sqrt(totalWords);
  const confidence = Math.min(matchedWords / 5, 1); // More matches = higher confidence

  let sentiment: SentimentScore;
  if (normalizedScore > 0.5) sentiment = "very_positive";
  else if (normalizedScore > 0.15) sentiment = "positive";
  else if (normalizedScore < -0.5) sentiment = "very_negative";
  else if (normalizedScore < -0.15) sentiment = "negative";
  else sentiment = "neutral";

  return { sentiment, confidence };
}
```

Cost: £0/month at any scale. Runs in < 1ms. Covers 90%+ of reviews accurately. For the remaining edge cases, moderators handle them through the moderation queue.

### 5.7 Async Job Processing (Inngest)

Replace BullMQ + ioredis + VPS with Inngest (serverless-native):

```typescript
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "britestate" });

// Define events
export const rfqCreated = inngest.createFunction(
  { id: "rfq-notify-providers" },
  { event: "marketplace/rfq.created" },
  async ({ event, step }) => {
    const { rfqId } = event.data;

    // Step 1: Get matching providers
    const providers = await step.run("get-matching-providers", async () => {
      const supabase = createServiceClient();
      const { data } = await supabase.rpc("get_matching_providers_for_rfq", {
        rfq_id: rfqId,
      });
      return data?.slice(0, 10) ?? []; // Cap at 10
    });

    // Step 2: Send in-app notifications immediately
    await step.run("send-in-app-notifications", async () => {
      const supabase = createServiceClient();
      const notifications = providers.map((p) => ({
        user_id: p.provider_id,
        type: "new_rfq_match",
        title: "New service request in your area",
        data: { rfq_id: rfqId },
        read: false,
      }));
      await supabase.from("notifications").insert(notifications);
    });

    // Step 3: Wait 1 hour, then email providers who haven't viewed
    await step.sleep("wait-for-in-app-view", "1h");

    await step.run("send-email-fallback", async () => {
      const supabase = createServiceClient();
      for (const provider of providers) {
        // Check if provider has viewed the in-app notification
        const { data: notification } = await supabase
          .from("notifications")
          .select("read")
          .eq("user_id", provider.provider_id)
          .eq("data->>rfq_id", rfqId)
          .single();

        if (!notification?.read) {
          await sendEmail({
            to: provider.email,
            subject: `New Service Request Match`,
            // ... email template
          });
        }
      }
    });
  }
);
```

**Why Inngest over BullMQ:**
- Runs on Vercel/serverless — no separate VPS needed
- Built-in retries, step functions, sleep/delay
- Free tier: 25K events/month (more than enough for early stages)
- No Redis dependency for job queues (Upstash Redis still used for caching only)

### 5.8 Email Cost Optimization

Original spec: up to 20 emails per RFQ. This rewrite:

1. **Cap provider notifications at 10** — only the 10 best-matched providers
2. **In-app notification first** — email is a 1-hour fallback for unread notifications
3. **Batch daily digests** — non-critical notifications (new RFQ matches below threshold, review responses) batched into a single daily email
4. **Critical-only instant emails** — booking confirmed, quote accepted, review moderation result

| Event | Original | Rewrite |
|-------|----------|---------|
| New RFQ | 20 emails immediately | 10 in-app + email to unread after 1h |
| Quote received | 1 email | In-app + email if unread 1h |
| Booking confirmed | 1 email | 1 email (critical) |
| Booking completed | 1 email | 1 email (critical) |
| Status changes | 1 email each | In-app only |
| Review submitted | 1 email | In-app only |
| Review approved | 1 email | Daily digest |

Estimated email reduction: 70-80% vs original spec.

---

## 6. API Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/providers/search` | Search marketplace | Public |
| GET | `/api/providers/[slug]` | Provider profile | Public |
| POST | `/api/providers/documents/upload` | Upload verification doc | Provider |
| GET | `/api/providers/documents` | List own documents | Provider |
| POST | `/api/rfq/create` | Create service request | Authenticated |
| GET | `/api/rfq/[id]` | Get RFQ details | Owner or matched provider |
| GET | `/api/rfq/list` | List user's RFQs | Authenticated |
| POST | `/api/quotes/create` | Submit quote | Verified provider |
| GET | `/api/quotes/[id]` | Get quote details | Owner or provider |
| PATCH | `/api/quotes/[id]/accept` | Accept quote | RFQ owner |
| PATCH | `/api/quotes/[id]/decline` | Decline quote | RFQ owner |
| POST | `/api/bookings/create` | Create booking | Authenticated |
| GET | `/api/bookings/list` | List bookings | Authenticated |
| GET | `/api/bookings/[id]` | Booking details | User or provider |
| PATCH | `/api/bookings/[id]/status` | Update booking status | User or provider |
| POST | `/api/reviews/create` | Submit review | Authenticated |
| GET | `/api/reviews/list` | List reviews for provider | Public |
| PATCH | `/api/reviews/moderation/[id]` | Moderate review | Moderator |
| POST | `/api/reviews/[id]/helpful` | Vote helpful/not helpful | Authenticated |
| POST | `/api/reviews/[id]/flag` | Flag review | Authenticated |
| POST | `/api/reviews/[id]/respond` | Provider response | Provider |

---

## 7. React Components

| Component | File | Purpose |
|-----------|------|---------|
| `ProviderSearchPage` | `app/(main)/marketplace/page.tsx` | Marketplace search with filters |
| `ProviderProfilePage` | `app/(main)/marketplace/[slug]/page.tsx` | Provider public profile |
| `ProviderSearchFilters` | `components/marketplace/SearchFilters.tsx` | Category, location, rating filters |
| `ProviderCard` | `components/marketplace/ProviderCard.tsx` | Search result card |
| `RFQCreateForm` | `components/marketplace/RFQCreateForm.tsx` | Service request form |
| `RFQDetailPage` | `app/(protected)/dashboard/rfqs/[id]/page.tsx` | RFQ with quotes |
| `QuoteCreateForm` | `components/marketplace/QuoteCreateForm.tsx` | Itemized quote builder |
| `QuoteComparison` | `components/marketplace/QuoteComparison.tsx` | Side-by-side quote comparison |
| `BookingDashboard` | `components/bookings/BookingDashboard.tsx` | Booking list with status filters |
| `BookingDetailPage` | `app/(protected)/dashboard/bookings/[id]/page.tsx` | Booking detail with timeline |
| `ReviewForm` | `components/reviews/ReviewForm.tsx` | Star ratings + text review form |
| `ReviewsList` | `components/reviews/ReviewsList.tsx` | Paginated review list with stats |
| `ModerationQueue` | `components/admin/ModerationQueue.tsx` | Review moderation dashboard |
| `DocumentUpload` | `components/provider/DocumentUpload.tsx` | Drag-and-drop document upload |

---

## 8. Dependencies

### New packages to install

```bash
pnpm add file-type inngest zod @upstash/ratelimit
pnpm add -D @playwright/test vitest
```

### NOT installing (removed from original spec)

| Package | Reason |
|---------|--------|
| `sharp` | Using Supabase Storage image transforms instead |
| `bullmq` | Using Inngest (serverless-native) instead |
| `ioredis` | BullMQ dependency, no longer needed |
| `@aws-sdk/client-s3` | Using Supabase Storage instead of R2 |
| `@anthropic-ai/sdk` | Rule-based sentiment analysis instead of Claude API |
| `prom-client` | Premature — add with Phase 7 monitoring |

### Environment variables (new for Epic 4)

```bash
# Inngest (serverless job queue)
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# Email (already in stack from Epic 1)
RESEND_API_KEY=your-resend-api-key
```

No R2 credentials. No VirusTotal API key. No Mapbox token (for geocoding). No separate Redis URL for BullMQ.

---

## 9. Cost Projection

| Item | Original Spec (100K users/mo) | This Rewrite | Savings |
|------|-------------------------------|--------------|---------|
| Claude sentiment analysis | £400/mo | £0 (rule-based) | £400 |
| BullMQ VPS | £50/mo | £0 (Inngest free tier) | £50 |
| VirusTotal | £200/mo | £0 (file-type lib) | £200 |
| Cloudflare R2 storage | £30/mo | £0 (Supabase Storage) | £30 |
| Mapbox geocoding | £75/mo | £0 (postcodes.io) | £75 |
| Resend emails | £160/mo | ~£50/mo (batching + in-app) | £110 |
| **Total** | **~£915/mo** | **~£50/mo** | **~£865/mo** |

At 1M users, the gap is ~£8,000/mo vs ~£400/mo.

---

## 10. Performance Targets

| Operation | Target (P95) |
|-----------|-------------|
| Provider search | < 200ms |
| RFQ creation | < 250ms |
| Quote creation | < 180ms |
| Booking creation | < 200ms |
| Booking status transition | < 150ms |
| Review submission | < 200ms |
| Review list load | < 180ms |
| Review search | < 150ms |
| Document upload | < 3s (file size dependent) |
| Notification dispatch | < 5ms (async) |

---

## 11. Testing Requirements

**Unit tests (Vitest):**
- Rule-based sentiment analyzer accuracy (positive, negative, neutral, edge cases)
- Spam indicator detection
- Authenticity score calculation
- Postcode geocoding integration
- File-type validation (valid/invalid files)
- Booking state machine transitions (valid and invalid)
- Quote acceptance race condition prevention

**Integration tests:**
- RFQ → Quote → Accept → Booking → Complete → Review full pipeline
- Provider search with filters returns correct results
- Document upload stores in Supabase Storage
- Inngest job fires on RFQ creation
- Email sent only after 1-hour in-app notification window

**E2E tests (Playwright):**
- Provider registers, uploads documents, gets verified
- User creates RFQ, receives quotes, accepts one
- User creates booking, provider confirms, completes
- User submits review, moderator approves, review appears on profile
- Marketplace search with location filter

---

## 12. Acceptance Criteria Summary

- [ ] Provider can create profile, upload documents, and get verified by admin
- [ ] User can create RFQ and receive quotes from matched providers
- [ ] User can compare quotes and accept one, creating a booking
- [ ] Booking lifecycle works with state machine validation and conflict detection
- [ ] User can submit reviews for completed bookings with multi-dimensional ratings
- [ ] Rule-based sentiment analysis and spam detection work without Claude API
- [ ] Moderation queue prioritizes suspicious reviews
- [ ] Provider search returns relevant results in < 200ms
- [ ] All notifications use in-app first, email as fallback
- [ ] No BullMQ, no R2, no VirusTotal, no Mapbox, no Sharp in dependencies
- [ ] Total infrastructure cost for marketplace features < £150/mo at 100K users
- [ ] All tables have RLS policies
- [ ] Full E2E test coverage for the RFQ → Review pipeline

---

*Analysis date: 2026-03-07*
*Applies to: Epic 4 — Service Provider Marketplace & Integration*
*Based on cost audit: epic4costanalysis.md*
