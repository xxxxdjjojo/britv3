# Reviews & Ratings (17.1–17.5) — FAANG-Level Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, FAANG-level Reviews & Ratings system covering all 5 pages: Leave a Review (17.1), Review Verification Flow (17.2), Review Edit within window (17.3), Report a Review (17.4), and Aggregate Reviews by Category/Area (17.5).

**Architecture:** Existing review infrastructure lives on the `feature/15-estate-agent-dashboard` worktree (services, API routes, components, DB tables). This plan upgrades that code with critical bug fixes (flag_count column, race condition, non-transactional moderation), adds missing features (edit flow, area aggregation, PII redaction, rate limiting), and elevates UI to FAANG-level with optimistic updates, keyboard navigation, and micro-interactions. All work targets the current feature branch.

**Tech Stack:** Next.js 16 App Router, Supabase PostgreSQL + RLS, Zod validation, React Hook Form, Shadcn UI, Recharts, Sonner toasts, Lucide icons, Tailwind CSS v4.

**Prerequisite — Task 0: Bring forward existing review code.** Before starting any task, copy these files from `.worktrees/feature/15-estate-agent-dashboard/britv3.0/src/` into the current branch's `britv3.0/src/`:
- `services/marketplace/review-service.ts`, `services/marketplace/moderation-service.ts`
- `lib/marketplace/sentiment-analyzer.ts`, `lib/marketplace/spam-detector.ts`
- `lib/validators/marketplace-schemas.ts` (review schemas only — merge into existing file)
- `components/reviews/*` (ReviewForm, ReviewsList, RatingStars, RatingDistribution)
- `app/api/reviews/**` (create, list, [id]/helpful, [id]/flag, [id]/respond, moderation/[id])
- `app/(protected)/dashboard/reviews/page.tsx`
- `types/marketplace.ts` (review types only — merge into existing file)

Run: `pnpm build` from `britv3.0/` to verify the copy compiled. Commit: `chore(reviews): bring forward review code from estate-agent branch`

---

## File Structure

### New files to create

| File | Responsibility |
|------|---------------|
| `supabase/migrations/YYYYMMDD_reviews_upgrade.sql` | Add flag_count, edit columns, atomic vote RPC, duplicate flag UNIQUE |
| `src/app/api/reviews/[id]/edit/route.ts` | PATCH endpoint for editing a review within 48h window |
| `src/app/api/reviews/aggregate/route.ts` | GET endpoint for area/category aggregation |
| `src/app/(main)/reviews/[area]/page.tsx` | Public area aggregate page (SSR) |
| `src/app/(main)/reviews/[area]/[category]/page.tsx` | Public area+category page (SSR) |
| `src/components/reviews/ReportReviewModal.tsx` | Flag/report modal with reason selection |
| `src/components/reviews/EditReviewForm.tsx` | Edit form with window countdown + audit trail |
| `src/components/reviews/ReviewAggregateHero.tsx` | Area/category aggregate stats hero card |
| `src/components/reviews/ReviewCardEnhanced.tsx` | FAANG-level review card with optimistic votes |

### Files to modify

| File | Changes |
|------|---------|
| `src/services/marketplace/review-service.ts` | Add `editReview()`, fix `flagReview()` flag_count, fix `voteHelpfulness()` → RPC |
| `src/lib/marketplace/spam-detector.ts` | Add `redactPII()` function |
| `src/lib/validators/marketplace-schemas.ts` | Add `reviewEditSchema` |
| `src/types/marketplace.ts` | Add edit fields to `Review` type |
| `src/components/reviews/ReviewForm.tsx` | Booking context header, keyboard star navigation, ARIA live regions |
| `src/components/reviews/ReviewsList.tsx` | Wire optimistic votes, edit/report modals, skeleton loading |
| `src/app/api/reviews/create/route.ts` | Rate limiting, wrap sentiment/spam in try-catch |
| `src/app/api/reviews/[id]/flag/route.ts` | Rate limiting, duplicate flag check |

---

## Chunk 1: Database & Infrastructure

### Task 1: Database Migration — flag_count, edit columns, atomic vote RPC

**Files:**
- Create: `supabase/migrations/YYYYMMDD_reviews_upgrade.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 1. Add missing flag_count column (referenced in service but missing from table)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS flag_count integer DEFAULT 0;

-- 2. Add edit-tracking columns for 17.3
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS original_text text,
  ADD COLUMN IF NOT EXISTS edit_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edit_history jsonb DEFAULT '[]'::jsonb;

-- 3. Prevent duplicate flags per user per review
ALTER TABLE public.review_flags
  ADD CONSTRAINT review_flags_user_review_unique
  UNIQUE (review_id, user_id);

-- 4. Atomic vote increment RPC (replaces race-condition-prone read-modify-write)
CREATE OR REPLACE FUNCTION public.atomic_vote_review(
  p_review_id uuid,
  p_user_id uuid,
  p_is_helpful boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_vote boolean;
  v_result jsonb;
BEGIN
  -- Check for existing vote
  SELECT is_helpful INTO v_existing_vote
  FROM public.review_helpfulness
  WHERE review_id = p_review_id AND user_id = p_user_id;

  IF v_existing_vote IS NOT NULL THEN
    -- Update existing vote
    IF v_existing_vote != p_is_helpful THEN
      UPDATE public.review_helpfulness
      SET is_helpful = p_is_helpful, created_at = now()
      WHERE review_id = p_review_id AND user_id = p_user_id;

      -- Atomically adjust counts
      IF p_is_helpful THEN
        UPDATE public.reviews
        SET helpful_count = helpful_count + 1,
            not_helpful_count = GREATEST(not_helpful_count - 1, 0)
        WHERE id = p_review_id;
      ELSE
        UPDATE public.reviews
        SET not_helpful_count = not_helpful_count + 1,
            helpful_count = GREATEST(helpful_count - 1, 0)
        WHERE id = p_review_id;
      END IF;
    END IF;
    -- If same vote, do nothing (idempotent)
  ELSE
    -- Insert new vote
    INSERT INTO public.review_helpfulness (review_id, user_id, is_helpful)
    VALUES (p_review_id, p_user_id, p_is_helpful);

    -- Atomically increment count
    IF p_is_helpful THEN
      UPDATE public.reviews
      SET helpful_count = helpful_count + 1
      WHERE id = p_review_id;
    ELSE
      UPDATE public.reviews
      SET not_helpful_count = not_helpful_count + 1
      WHERE id = p_review_id;
    END IF;
  END IF;

  -- Return updated counts
  SELECT jsonb_build_object(
    'helpful_count', r.helpful_count,
    'not_helpful_count', r.not_helpful_count
  ) INTO v_result
  FROM public.reviews r
  WHERE r.id = p_review_id;

  RETURN COALESCE(v_result, '{"helpful_count":0,"not_helpful_count":0}'::jsonb);
END;
$$;

-- 5. Atomic flag increment + moderation escalation RPC
CREATE OR REPLACE FUNCTION public.atomic_flag_review(
  p_review_id uuid,
  p_user_id uuid,
  p_reason text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reviewer_id uuid;
  v_new_flag_count integer;
  v_flag_id uuid;
BEGIN
  -- Check review exists and user is not the reviewer
  SELECT reviewer_id INTO v_reviewer_id
  FROM public.reviews
  WHERE id = p_review_id;

  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF v_reviewer_id = p_user_id THEN
    RAISE EXCEPTION 'Cannot flag your own review';
  END IF;

  -- Insert flag (UNIQUE constraint prevents duplicates)
  INSERT INTO public.review_flags (review_id, user_id, reason, description, admin_status)
  VALUES (p_review_id, p_user_id, p_reason, p_description, 'pending')
  RETURNING id INTO v_flag_id;

  -- Atomically increment flag_count
  UPDATE public.reviews
  SET flag_count = flag_count + 1
  WHERE id = p_review_id
  RETURNING flag_count INTO v_new_flag_count;

  -- Boost moderation queue priority at 3+ flags
  IF v_new_flag_count >= 3 THEN
    UPDATE public.moderation_queue
    SET priority_score = priority_score + 5
    WHERE review_id = p_review_id;
  END IF;

  RETURN jsonb_build_object('flag_id', v_flag_id, 'flag_count', v_new_flag_count);
END;
$$;

-- 6. Create area_rating_stats materialized view for 17.5
-- NOTE: service_provider_details uses ARRAY columns:
--   services service_category[] (enum array)
--   service_postcodes TEXT[] (postcode array)
-- We unnest both to get area_code × trade_category rows.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.area_rating_stats AS
SELECT
  SPLIT_PART(pc.val, ' ', 1) AS area_code,
  svc.val::text AS trade_category,
  AVG(prs.average_rating)::numeric(3,2) AS avg_rating,
  SUM(prs.total_reviews)::bigint AS total_reviews,
  COUNT(DISTINCT prs.provider_id)::integer AS total_providers,
  (ARRAY_AGG(prs.provider_id ORDER BY prs.average_rating DESC))[1] AS top_provider_id
FROM public.provider_rating_stats prs
JOIN public.service_provider_details spd ON spd.user_id = prs.provider_id
CROSS JOIN LATERAL unnest(spd.service_postcodes) AS pc(val)
CROSS JOIN LATERAL unnest(spd.services) AS svc(val)
WHERE prs.total_reviews > 0
  AND spd.service_postcodes IS NOT NULL
  AND array_length(spd.service_postcodes, 1) > 0
GROUP BY area_code, trade_category;

CREATE UNIQUE INDEX IF NOT EXISTS idx_area_rating_stats_pk
  ON public.area_rating_stats (area_code, trade_category);

-- 7. Schedule materialized view refresh via pg_cron (every 6 hours)
-- NOTE: pg_cron must be enabled in Supabase dashboard (Extensions > pg_cron)
SELECT cron.schedule(
  'refresh-area-rating-stats',
  '0 */6 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.area_rating_stats;'
);

-- 8. Grant RPC execute to authenticated users
GRANT EXECUTE ON FUNCTION public.atomic_vote_review TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_flag_review TO authenticated;
GRANT SELECT ON public.area_rating_stats TO anon, authenticated;
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Run: `mcp__supabase__apply_migration` with the SQL above.
Expected: Migration applied successfully, all columns/RPCs/views created.

- [ ] **Step 3: Verify migration**

Run via `mcp__supabase__execute_sql`:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'reviews' AND column_name IN ('flag_count', 'edited_at', 'original_text', 'edit_count', 'edit_history')
ORDER BY column_name;
```
Expected: 5 rows returned.

Run: `SELECT proname FROM pg_proc WHERE proname IN ('atomic_vote_review', 'atomic_flag_review');`
Expected: 2 rows returned.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(reviews): migration — flag_count, edit columns, atomic RPCs, area_rating_stats MV"
```

---

### Task 2: PII Redaction in Spam Detector

**Files:**
- Modify: `britv3.0/src/lib/marketplace/spam-detector.ts`

- [ ] **Step 1: Add redactPII function to spam-detector.ts**

Add this exported function after the existing `detectSpam()`:

```typescript
/**
 * Redact PII from review text before storage.
 * Reuses existing PHONE_REGEX and EMAIL_REGEX with global flag.
 * Replaces UK phone numbers, email addresses with [REDACTED].
 */
export function redactPII(text: string): string {
  // Reuse the module-level PHONE_REGEX and EMAIL_REGEX but with global flag
  const phoneGlobal = new RegExp(PHONE_REGEX.source, "g");
  const emailGlobal = new RegExp(EMAIL_REGEX.source, "gi");

  return text
    .replace(phoneGlobal, "[phone redacted]")
    .replace(emailGlobal, "[email redacted]");
}
```

- [ ] **Step 2: Wire redactPII into createReview in review-service.ts**

In `review-service.ts`, import `redactPII` and call it before inserting:

```typescript
import { detectSpam, redactPII } from "@/lib/marketplace/spam-detector";

// Inside createReview(), before the insert:
const sanitizedText = redactPII(parsed.review_text);
const sanitizedTitle = redactPII(parsed.title);

// Use sanitizedText and sanitizedTitle in the insert instead of parsed.review_text and parsed.title
```

- [ ] **Step 3: Commit**

```bash
git add britv3.0/src/lib/marketplace/spam-detector.ts britv3.0/src/services/marketplace/review-service.ts
git commit -m "feat(reviews): PII auto-redaction for phone numbers and emails in review text"
```

---

### Task 3: Fix Sentiment/Spam Try-Catch + Rate Limiting on Create

**Files:**
- Modify: `britv3.0/src/services/marketplace/review-service.ts`
- Modify: `britv3.0/src/app/api/reviews/create/route.ts`

- [ ] **Step 1: Wrap sentiment + spam analysis in try-catch**

In `review-service.ts` `createReview()`, replace the direct calls:

```typescript
// Replace these two lines:
//   const sentimentResult = analyzeReviewSentiment(parsed.review_text);
//   const spamResult = detectSpam(parsed.review_text);
// With:

let sentimentResult: { sentiment: string; confidence: number };
try {
  sentimentResult = analyzeReviewSentiment(sanitizedText);
} catch {
  sentimentResult = { sentiment: "neutral", confidence: 0 };
}

let spamResult: ReturnType<typeof detectSpam>;
try {
  spamResult = detectSpam(sanitizedText);
} catch {
  spamResult = {
    has_contact_info: false,
    has_links: false,
    has_excessive_caps: false,
    has_promotional: false,
    has_repeated_chars: false,
    has_excessive_punctuation: false,
    spam_score: 0,
  };
}
```

- [ ] **Step 2: Check moderation queue insert error**

After the moderation queue insert in `createReview()`, add error checking:

```typescript
const { error: queueError } = await supabase.from("moderation_queue").insert({
  review_id: review.id,
  priority_score: priorityScore,
});

if (queueError) {
  console.error("[review-service] Failed to insert moderation queue entry", {
    reviewId: review.id,
    error: queueError.message,
  });
  // Non-blocking: review is created, queue entry can be recovered
}
```

- [ ] **Step 3: Add rate limiting to create route**

In `app/api/reviews/create/route.ts`, add rate limiting at the top of the POST handler. Use the existing Upstash rate limiter pattern from the codebase, or add inline:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReview } from "@/services/marketplace/review-service";

const RATE_LIMIT_REVIEWS_PER_DAY = 3;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit: max 3 reviews per user per 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("reviewer_id", user.id)
    .gte("created_at", twentyFourHoursAgo);

  if ((count ?? 0) >= RATE_LIMIT_REVIEWS_PER_DAY) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 3 reviews per 24 hours." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    if (!body.booking_id) {
      return NextResponse.json({ error: "booking_id is required" }, { status: 400 });
    }

    const review = await createReview(supabase, user.id, {
      ...body,
      booking_id: body.booking_id,
    });

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create review";

    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message.includes("not found") || message.includes("only review")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("[api/reviews/create] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add britv3.0/src/services/marketplace/review-service.ts britv3.0/src/app/api/reviews/create/route.ts
git commit -m "fix(reviews): wrap sentiment/spam in try-catch, add rate limiting on create"
```

---

### Task 4: Replace voteHelpfulness with Atomic RPC

**Files:**
- Modify: `britv3.0/src/services/marketplace/review-service.ts`

- [ ] **Step 1: Replace the entire voteHelpfulness function**

Replace the existing 80+ line `voteHelpfulness()` with:

```typescript
/**
 * Vote on whether a review is helpful.
 * Uses atomic Postgres RPC — no race conditions, single round-trip.
 */
export async function voteHelpfulness(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
  isHelpful: boolean,
) {
  const { data, error } = await supabase.rpc("atomic_vote_review", {
    p_review_id: reviewId,
    p_user_id: userId,
    p_is_helpful: isHelpful,
  });

  if (error) {
    throw new Error(`Failed to record vote: ${error.message}`);
  }

  return {
    helpful_count: (data as { helpful_count: number; not_helpful_count: number }).helpful_count,
    not_helpful_count: (data as { helpful_count: number; not_helpful_count: number }).not_helpful_count,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/services/marketplace/review-service.ts
git commit -m "fix(reviews): replace voteHelpfulness race condition with atomic RPC"
```

---

### Task 5: Replace flagReview with Atomic RPC + Rate Limit

**Files:**
- Modify: `britv3.0/src/services/marketplace/review-service.ts`
- Modify: `britv3.0/src/app/api/reviews/[id]/flag/route.ts`

- [ ] **Step 1: Replace flagReview service function**

Replace the entire `flagReview()` with:

```typescript
/**
 * Flag a review for moderation. Uses atomic RPC.
 * Prevents duplicate flags (UNIQUE constraint), self-flagging (RPC check),
 * and auto-escalates at 3+ flags.
 */
export async function flagReview(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
  data: ReviewFlagInput,
) {
  const parsed = reviewFlagSchema.parse(data);

  const { data: result, error } = await supabase.rpc("atomic_flag_review", {
    p_review_id: reviewId,
    p_user_id: userId,
    p_reason: parsed.reason,
    p_description: parsed.description ?? null,
  });

  if (error) {
    // Handle known error cases
    if (error.message.includes("Cannot flag your own review")) {
      throw new Error("Cannot flag your own review");
    }
    if (error.message.includes("Review not found")) {
      throw new Error("Review not found");
    }
    if (error.code === "23505") {
      throw new Error("You have already flagged this review");
    }
    throw new Error(`Failed to flag review: ${error.message}`);
  }

  return result;
}
```

- [ ] **Step 2: Add rate limiting to flag route**

In `app/api/reviews/[id]/flag/route.ts`, add rate limiting:

```typescript
// After auth check, before calling flagReview:
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const { count } = await supabase
  .from("review_flags")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id)
  .gte("created_at", twentyFourHoursAgo);

if ((count ?? 0) >= 10) {
  return NextResponse.json(
    { error: "Rate limit exceeded. Maximum 10 flags per 24 hours." },
    { status: 429 },
  );
}
```

Also handle the new "already flagged" error:

```typescript
if (message.includes("already flagged")) {
  return NextResponse.json({ error: message }, { status: 409 });
}
```

- [ ] **Step 3: Commit**

```bash
git add britv3.0/src/services/marketplace/review-service.ts britv3.0/src/app/api/reviews/[id]/flag/route.ts
git commit -m "fix(reviews): atomic flag RPC, duplicate prevention, rate limiting"
```

---

## Chunk 2: Edit Review Flow (17.3)

### Task 6: Review Edit Schema + Types

**Files:**
- Modify: `britv3.0/src/lib/validators/marketplace-schemas.ts`
- Modify: `britv3.0/src/types/marketplace.ts`

- [ ] **Step 1: Add reviewEditSchema**

Add to `marketplace-schemas.ts`:

```typescript
export const reviewEditSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be under 100 characters"),
  review_text: z.string().min(20, "Review must be at least 20 characters").max(2000, "Review must be under 2000 characters"),
  overall_rating: z.number().int().min(1).max(5),
  punctuality_rating: z.number().int().min(1).max(5).optional(),
  quality_rating: z.number().int().min(1).max(5).optional(),
  value_rating: z.number().int().min(1).max(5).optional(),
  professionalism_rating: z.number().int().min(1).max(5).optional(),
});

export type ReviewEditInput = z.infer<typeof reviewEditSchema>;
```

- [ ] **Step 2: Update Review type**

In `types/marketplace.ts`, add to the `Review` type:

```typescript
// Add these fields to the Review type:
edited_at: Date | null;
original_text: string | null;
edit_count: number;
edit_history: Array<{ text: string; title: string; edited_at: string }>;
```

- [ ] **Step 3: Commit**

```bash
git add britv3.0/src/lib/validators/marketplace-schemas.ts britv3.0/src/types/marketplace.ts
git commit -m "feat(reviews): add edit schema and type definitions"
```

---

### Task 7: Edit Review Service Function

**Files:**
- Modify: `britv3.0/src/services/marketplace/review-service.ts`

- [ ] **Step 1: Add editReview function**

Add after `createReview()`:

```typescript
const EDIT_WINDOW_HOURS = 48;
const MAX_EDITS = 2;

/**
 * Edit a review within the 48-hour window.
 * - Max 2 edits allowed
 * - Saves original text + edit history for audit trail
 * - Resets moderation_status to "pending" (prevents approve-then-edit attack)
 * - Re-enters moderation queue
 */
export async function editReview(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
  data: ReviewEditInput,
) {
  const parsed = reviewEditSchema.parse(data);

  // Fetch the review
  const { data: review, error: fetchError } = await supabase
    .from("reviews")
    .select("id, reviewer_id, review_text, title, created_at, edit_count, edit_history, original_text")
    .eq("id", reviewId)
    .single();

  if (fetchError || !review) {
    throw new Error("Review not found");
  }

  if (review.reviewer_id !== userId) {
    throw new Error("You can only edit your own reviews");
  }

  // Check edit window (48 hours from creation)
  const createdAt = new Date(review.created_at);
  const windowExpiry = new Date(createdAt.getTime() + EDIT_WINDOW_HOURS * 60 * 60 * 1000);
  if (new Date() > windowExpiry) {
    throw new Error("Edit window has expired. Reviews can only be edited within 48 hours of submission.");
  }

  // Check max edits
  if ((review.edit_count ?? 0) >= MAX_EDITS) {
    throw new Error("Maximum number of edits (2) reached for this review.");
  }

  // PII redaction on new text
  const sanitizedText = redactPII(parsed.review_text);
  const sanitizedTitle = redactPII(parsed.title);

  // Build edit history entry
  const historyEntry = {
    text: review.review_text,
    title: review.title,
    edited_at: new Date().toISOString(),
  };
  const updatedHistory = [...(review.edit_history ?? []), historyEntry];

  // Save original text on first edit
  const originalText = review.original_text ?? review.review_text;

  // Update review
  const { data: updated, error: updateError } = await supabase
    .from("reviews")
    .update({
      title: sanitizedTitle,
      review_text: sanitizedText,
      overall_rating: parsed.overall_rating,
      punctuality_rating: parsed.punctuality_rating ?? null,
      quality_rating: parsed.quality_rating ?? null,
      value_rating: parsed.value_rating ?? null,
      professionalism_rating: parsed.professionalism_rating ?? null,
      edited_at: new Date().toISOString(),
      original_text: originalText,
      edit_count: (review.edit_count ?? 0) + 1,
      edit_history: updatedHistory,
      moderation_status: "pending", // Re-enter moderation
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to edit review: ${updateError.message}`);
  }

  // Re-enter moderation queue with fresh priority
  let sentimentResult: { sentiment: string };
  try {
    sentimentResult = analyzeReviewSentiment(sanitizedText);
  } catch {
    sentimentResult = { sentiment: "neutral" };
  }

  let spamResult: { spam_score: number };
  try {
    spamResult = detectSpam(sanitizedText);
  } catch {
    spamResult = { spam_score: 0 };
  }

  const priorityScore = (spamResult.spam_score ?? 0) * 3 + 2; // +2 priority for edits

  // Upsert into moderation queue (may already have an entry)
  const { error: queueError } = await supabase
    .from("moderation_queue")
    .upsert(
      {
        review_id: reviewId,
        priority_score: priorityScore,
        decision: null,
        completed_at: null,
        assigned_to: null,
      },
      { onConflict: "review_id" },
    );

  if (queueError) {
    console.error("[review-service] Failed to re-queue edited review", {
      reviewId,
      error: queueError.message,
    });
  }

  return updated;
}
```

- [ ] **Step 2: Add the import for reviewEditSchema at the top**

```typescript
import {
  reviewCreateSchema,
  reviewFlagSchema,
  reviewEditSchema,
  type ReviewEditInput,
} from "@/lib/validators/marketplace-schemas";
```

- [ ] **Step 3: Commit**

```bash
git add britv3.0/src/services/marketplace/review-service.ts
git commit -m "feat(reviews): editReview service with 48h window, audit trail, re-moderation"
```

---

### Task 8: Edit Review API Route

**Files:**
- Create: `britv3.0/src/app/api/reviews/[id]/edit/route.ts`

- [ ] **Step 1: Create the PATCH route**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { editReview } from "@/services/marketplace/review-service";

/**
 * PATCH /api/reviews/[id]/edit
 * Edit a review within the 48-hour window. Auth required (reviewer only).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id: reviewId } = await params;
    const body = await request.json();

    const review = await editReview(supabase, user.id, reviewId, body);

    return NextResponse.json({ data: review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to edit review";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("only edit your own")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("window has expired") || message.includes("Maximum number")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("[api/reviews/edit] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/app/api/reviews/[id]/edit/route.ts
git commit -m "feat(reviews): PATCH /api/reviews/[id]/edit — edit within 48h window"
```

---

### Task 9: EditReviewForm Component

**Files:**
- Create: `britv3.0/src/components/reviews/EditReviewForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Clock, AlertTriangle } from "lucide-react";
import {
  reviewEditSchema,
  type ReviewEditInput,
} from "@/lib/validators/marketplace-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/marketplace";

type EditReviewFormProps = Readonly<{
  review: Review;
  onSuccess?: () => void;
  onCancel?: () => void;
}>;

function StarRatingInput({
  label,
  value,
  onChange,
}: Readonly<{ label: string; value: number; onChange: (v: number) => void }>) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div
        className="flex items-center gap-0.5"
        role="radiogroup"
        aria-label={`${label} rating`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" && value < 5) onChange(value + 1);
          if (e.key === "ArrowLeft" && value > 1) onChange(value - 1);
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            tabIndex={star === value || (value === 0 && star === 1) ? 0 : -1}
            className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 rounded"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              className={cn(
                "size-5 transition-colors",
                (hovered || value) >= star
                  ? "fill-brand-secondary text-brand-secondary"
                  : "fill-none text-neutral-300",
              )}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function useEditWindowCountdown(createdAt: Date) {
  const [remaining, setRemaining] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const expiryMs = new Date(createdAt).getTime() + 48 * 60 * 60 * 1000;

    function update() {
      const diff = expiryMs - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setRemaining("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemaining(`${hours}h ${minutes}m remaining`);
    }

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return { remaining, expired };
}

export function EditReviewForm({ review, onSuccess, onCancel }: EditReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { remaining, expired } = useEditWindowCountdown(new Date(review.created_at));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewEditInput>({
    resolver: zodResolver(reviewEditSchema),
    defaultValues: {
      overall_rating: review.overall_rating,
      punctuality_rating: review.punctuality_rating ?? undefined,
      quality_rating: review.quality_rating ?? undefined,
      value_rating: review.value_rating ?? undefined,
      professionalism_rating: review.professionalism_rating ?? undefined,
      title: review.title,
      review_text: review.review_text,
    },
  });

  const overallRating = watch("overall_rating");
  const reviewText = watch("review_text") ?? "";

  async function onSubmit(data: ReviewEditInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${review.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? `Failed to edit review (${response.status})`);
      }

      toast.success("Review updated. It will be re-reviewed by our moderation team.");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to edit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (expired) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <AlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          The edit window for this review has expired. Reviews can only be edited within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Edit window indicator */}
      <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <Clock className="size-4 shrink-0" />
        <span>{remaining}</span>
        {review.edit_count > 0 && (
          <Badge variant="outline" className="ml-auto text-xs">
            Edit {review.edit_count}/2
          </Badge>
        )}
      </div>

      {/* Moderation notice */}
      <p className="text-xs text-muted-foreground">
        Edited reviews are re-submitted for moderation and may not be visible immediately.
      </p>

      <StarRatingInput
        label="Overall Rating"
        value={overallRating}
        onChange={(v) => setValue("overall_rating", v, { shouldValidate: true })}
      />

      <div className="grid grid-cols-2 gap-4">
        <StarRatingInput label="Punctuality" value={watch("punctuality_rating") ?? 0} onChange={(v) => setValue("punctuality_rating", v)} />
        <StarRatingInput label="Quality" value={watch("quality_rating") ?? 0} onChange={(v) => setValue("quality_rating", v)} />
        <StarRatingInput label="Value" value={watch("value_rating") ?? 0} onChange={(v) => setValue("value_rating", v)} />
        <StarRatingInput label="Professionalism" value={watch("professionalism_rating") ?? 0} onChange={(v) => setValue("professionalism_rating", v)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" {...register("title")} aria-invalid={!!errors.title} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-text">Your Review</Label>
        <Textarea id="edit-text" className="min-h-32" {...register("review_text")} aria-invalid={!!errors.review_text} />
        <div className="flex items-center justify-between">
          {errors.review_text ? (
            <p className="text-xs text-destructive">{errors.review_text.message}</p>
          ) : (
            <span />
          )}
          <span className={cn("text-xs", reviewText.length > 2000 ? "text-destructive" : "text-muted-foreground")}>
            {reviewText.length}/2000
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/components/reviews/EditReviewForm.tsx
git commit -m "feat(reviews): EditReviewForm with 48h countdown, edit limit, re-moderation notice"
```

---

## Chunk 3: Report Review Modal (17.4) + Aggregate Pages (17.5)

### Task 10: ReportReviewModal Component

**Files:**
- Create: `britv3.0/src/components/reviews/ReportReviewModal.tsx`

- [ ] **Step 1: Create the modal component**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FLAG_REASONS = [
  { value: "spam", label: "Spam", description: "Promotional or irrelevant content" },
  { value: "fake", label: "Fake review", description: "Not a genuine customer experience" },
  { value: "inappropriate", label: "Inappropriate", description: "Offensive or abusive language" },
  { value: "off_topic", label: "Off-topic", description: "Not related to the service received" },
  { value: "contact_info", label: "Contains personal info", description: "Phone numbers, emails, or addresses" },
  { value: "promotional", label: "Promotional", description: "Advertising a product or service" },
  { value: "duplicate", label: "Duplicate", description: "Same review posted multiple times" },
] as const;

type ReportReviewModalProps = Readonly<{
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}>;

export function ReportReviewModal({
  reviewId,
  open,
  onOpenChange,
  onSuccess,
}: ReportReviewModalProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, description: description || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? "Failed to report review");
      }

      toast.success("Report submitted. Our team will review it.");
      onOpenChange(false);
      setReason("");
      setDescription("");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to report review");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Report Review
          </DialogTitle>
          <DialogDescription>
            Help us maintain trust by reporting reviews that violate our guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason *</Label>
            <div className="space-y-2">
              {FLAG_REASONS.map((item) => (
                <label
                  key={item.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    reason === item.value
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    name="flag-reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-0.5 accent-brand-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flag-description" className="text-sm">
              Additional details (optional)
            </Label>
            <Textarea
              id="flag-description"
              placeholder="Provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-right text-xs text-muted-foreground">
              {description.length}/500
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            variant="destructive"
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/components/reviews/ReportReviewModal.tsx
git commit -m "feat(reviews): ReportReviewModal with 7 flag reasons, description, radio selection"
```

---

### Task 11: Aggregate Reviews API Route

**Files:**
- Create: `britv3.0/src/app/api/reviews/aggregate/route.ts`

- [ ] **Step 1: Create the GET route**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/reviews/aggregate
 * Returns aggregated review stats by area and/or trade category.
 * Public endpoint — no auth required.
 *
 * Query params:
 *   area (optional) — postcode district e.g. "TW7", "SW1"
 *   category (optional) — trade category e.g. "plumber", "electrician"
 *   limit (optional, default 20) — max results
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  try {
    const supabase = await createClient();

    let query = supabase
      .from("area_rating_stats")
      .select("*")
      .order("total_reviews", { ascending: false })
      .limit(limit);

    if (area) {
      query = query.eq("area_code", area.toUpperCase());
    }
    if (category) {
      query = query.eq("trade_category", category.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch aggregate stats: ${error.message}`);
    }

    return NextResponse.json({
      data: data ?? [],
      meta: { area, category, count: data?.length ?? 0 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch aggregate reviews";
    console.error("[api/reviews/aggregate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/app/api/reviews/aggregate/route.ts
git commit -m "feat(reviews): GET /api/reviews/aggregate — area/category rating stats endpoint"
```

---

### Task 12: ReviewAggregateHero Component

**Files:**
- Create: `britv3.0/src/components/reviews/ReviewAggregateHero.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Star, Users, MapPin } from "lucide-react";
import { RatingStars } from "@/components/reviews/RatingStars";

type ReviewAggregateHeroProps = Readonly<{
  areaCode: string;
  category?: string;
  avgRating: number;
  totalReviews: number;
  totalProviders: number;
}>;

export function ReviewAggregateHero({
  areaCode,
  category,
  avgRating,
  totalReviews,
  totalProviders,
}: ReviewAggregateHeroProps) {
  const title = category
    ? `${category.charAt(0).toUpperCase() + category.slice(1)}s in ${areaCode}`
    : `Service Providers in ${areaCode}`;

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm dark:bg-neutral-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span>{areaCode} area</span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {/* Average rating */}
          <div className="text-center">
            <p className="font-heading text-4xl font-bold tabular-nums text-foreground">
              {avgRating.toFixed(1)}
            </p>
            <RatingStars rating={avgRating} size="sm" />
            <p className="mt-1 text-xs text-muted-foreground">
              {totalReviews.toLocaleString()} review{totalReviews !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Provider count */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="size-5 text-brand-primary" />
              <span className="font-heading text-2xl font-bold tabular-nums text-foreground">
                {totalProviders}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              verified provider{totalProviders !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/components/reviews/ReviewAggregateHero.tsx
git commit -m "feat(reviews): ReviewAggregateHero — area/category stats hero card"
```

---

### Task 13: Area Aggregate Page (17.5)

**Files:**
- Create: `britv3.0/src/app/(main)/reviews/[area]/page.tsx`

- [ ] **Step 1: Create the SSR page**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewAggregateHero } from "@/components/reviews/ReviewAggregateHero";
import { RatingStars } from "@/components/reviews/RatingStars";
import Link from "next/link";

type PageProps = {
  params: Promise<{ area: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { area } = await params;
  return {
    title: `Service Providers in ${area.toUpperCase()} — Reviews | Britestate`,
    description: `Find verified and reviewed service providers in the ${area.toUpperCase()} area. Read real customer reviews and ratings.`,
  };
}

export default async function AreaReviewsPage({ params }: PageProps) {
  const { area } = await params;
  const areaCode = area.toUpperCase();

  const supabase = await createClient();

  // Fetch area aggregate stats
  const { data: areaStats, error } = await supabase
    .from("area_rating_stats")
    .select("*")
    .eq("area_code", areaCode)
    .order("total_reviews", { ascending: false });

  if (error || !areaStats || areaStats.length === 0) {
    notFound();
  }

  // Compute overall area stats
  const totalReviews = areaStats.reduce((sum, s) => sum + Number(s.total_reviews), 0);
  const totalProviders = areaStats.reduce((sum, s) => sum + Number(s.total_providers), 0);
  const weightedRating =
    areaStats.reduce((sum, s) => sum + Number(s.avg_rating) * Number(s.total_reviews), 0) /
    (totalReviews || 1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ReviewAggregateHero
        areaCode={areaCode}
        avgRating={weightedRating}
        totalReviews={totalReviews}
        totalProviders={totalProviders}
      />

      {/* Category breakdown */}
      <section className="mt-8">
        <h2 className="font-heading text-xl font-bold text-foreground">
          By Category
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areaStats.map((stat) => (
            <Link
              key={`${stat.area_code}-${stat.trade_category}`}
              href={`/reviews/${area}/${stat.trade_category}`}
              className="group rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-md dark:bg-neutral-900"
            >
              <h3 className="font-medium capitalize text-foreground group-hover:text-brand-primary">
                {stat.trade_category}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <RatingStars rating={Number(stat.avg_rating)} size="sm" showValue />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {Number(stat.total_reviews).toLocaleString()} reviews from {stat.total_providers} providers
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/app/(main)/reviews/[area]/page.tsx
git commit -m "feat(reviews): area aggregate page — /reviews/[area] with category cards"
```

---

## Chunk 4: FAANG-Level UI Polish

### Task 14: Enhanced ReviewForm with Booking Context + Keyboard Nav

**Files:**
- Modify: `britv3.0/src/components/reviews/ReviewForm.tsx`

- [ ] **Step 1: Rewrite ReviewForm with FAANG-level UX**

Replace the entire `ReviewForm.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle, Briefcase } from "lucide-react";
import {
  reviewCreateSchema,
  type ReviewCreateInput,
} from "@/lib/validators/marketplace-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BookingContext = Readonly<{
  serviceName: string;
  providerName: string;
  completedDate: string;
}>;

type ReviewFormProps = Readonly<{
  bookingId: string;
  providerId: string;
  bookingContext?: BookingContext;
  onSuccess?: () => void;
}>;

function StarRatingInput({
  label,
  value,
  onChange,
  required = false,
  error,
}: Readonly<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  error?: string;
}>) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-1">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div
        className="flex items-center gap-0.5"
        role="radiogroup"
        aria-label={`${label} rating`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" && value < 5) onChange(value + 1);
          if (e.key === "ArrowLeft" && value > 1) onChange(value - 1);
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            tabIndex={star === value || (value === 0 && star === 1) ? 0 : -1}
            className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 rounded"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              className={cn(
                "size-6 transition-colors",
                (hovered || value) >= star
                  ? "fill-brand-secondary text-brand-secondary"
                  : "fill-none text-neutral-300",
              )}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground" aria-live="polite">
            {value}/5 — {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ReviewForm({
  bookingId,
  providerId,
  bookingContext,
  onSuccess,
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewCreateInput>({
    resolver: zodResolver(reviewCreateSchema),
    defaultValues: {
      overall_rating: 0,
      title: "",
      review_text: "",
    },
  });

  const overallRating = watch("overall_rating");
  const reviewText = watch("review_text") ?? "";

  async function onSubmit(data: ReviewCreateInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          booking_id: bookingId,
          provider_id: providerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? `Failed to submit review (${response.status})`,
        );
      }

      setIsSubmitted(true);
      toast.success("Review submitted successfully");
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit review",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:bg-green-900/20 dark:border-green-800">
        <CheckCircle className="mx-auto mb-2 size-8 text-green-600" />
        <h3 className="text-lg font-semibold text-foreground">Review Submitted</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for your feedback. Your review is pending moderation and
          will be published shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Booking context card */}
      {bookingContext && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <Briefcase className="size-5 text-brand-primary shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {bookingContext.serviceName} by {bookingContext.providerName}
            </p>
            <p className="text-xs text-muted-foreground">
              Completed {bookingContext.completedDate}
            </p>
          </div>
        </div>
      )}

      <StarRatingInput
        label="Overall Rating"
        value={overallRating}
        onChange={(v) => setValue("overall_rating", v, { shouldValidate: true })}
        required
        error={errors.overall_rating?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <StarRatingInput label="Punctuality" value={watch("punctuality_rating") ?? 0} onChange={(v) => setValue("punctuality_rating", v)} />
        <StarRatingInput label="Quality" value={watch("quality_rating") ?? 0} onChange={(v) => setValue("quality_rating", v)} />
        <StarRatingInput label="Value for Money" value={watch("value_rating") ?? 0} onChange={(v) => setValue("value_rating", v)} />
        <StarRatingInput label="Professionalism" value={watch("professionalism_rating") ?? 0} onChange={(v) => setValue("professionalism_rating", v)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="review-title"
          placeholder="Summarise your experience"
          {...register("title")}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-text">
          Your Review <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="review-text"
          placeholder="Share details of your experience..."
          className="min-h-32"
          {...register("review_text")}
          aria-invalid={!!errors.review_text}
        />
        <div className="flex items-center justify-between">
          {errors.review_text ? (
            <p className="text-xs text-destructive">{errors.review_text.message}</p>
          ) : (
            <span />
          )}
          <span
            className={cn(
              "text-xs",
              reviewText.length > 2000
                ? "text-destructive"
                : reviewText.length > 1800
                  ? "text-amber-600"
                  : "text-muted-foreground",
            )}
          >
            {reviewText.length}/2000
          </span>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/components/reviews/ReviewForm.tsx
git commit -m "feat(reviews): FAANG ReviewForm — booking context, keyboard nav, ARIA live"
```

---

### Task 15: ReviewCardEnhanced with Optimistic Votes + Edit/Report

**Files:**
- Create: `britv3.0/src/components/reviews/ReviewCardEnhanced.tsx`

- [ ] **Step 1: Create the enhanced review card**

```tsx
"use client";

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Flag, Pencil, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { ReportReviewModal } from "@/components/reviews/ReportReviewModal";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/marketplace";

type ReviewCardEnhancedProps = Readonly<{
  review: Review;
  currentUserId?: string;
  onEdit?: (review: Review) => void;
}>;

export function ReviewCardEnhanced({
  review,
  currentUserId,
  onEdit,
}: ReviewCardEnhancedProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [notHelpfulCount, setNotHelpfulCount] = useState(review.not_helpful_count);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [votePending, setVotePending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwnReview = currentUserId === review.reviewer_id;
  const canEdit =
    isOwnReview &&
    review.edit_count < 2 &&
    new Date(review.created_at).getTime() + 48 * 60 * 60 * 1000 > Date.now();

  const dateStr = new Date(review.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleVote = useCallback(
    async (isHelpful: boolean) => {
      if (votePending || isOwnReview) return;

      // Optimistic update
      const prevHelpful = helpfulCount;
      const prevNotHelpful = notHelpfulCount;
      const prevVote = userVote;

      if (userVote === isHelpful) return; // Same vote, no-op

      // Undo previous vote if changing
      if (userVote !== null) {
        if (userVote) setHelpfulCount((c) => Math.max(0, c - 1));
        else setNotHelpfulCount((c) => Math.max(0, c - 1));
      }

      // Apply new vote
      if (isHelpful) setHelpfulCount((c) => c + 1);
      else setNotHelpfulCount((c) => c + 1);
      setUserVote(isHelpful);

      setVotePending(true);
      try {
        const response = await fetch(`/api/reviews/${review.id}/helpful`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_helpful: isHelpful }),
        });

        if (!response.ok) {
          throw new Error("Vote failed");
        }

        const data = await response.json();
        setHelpfulCount(data.data?.helpful_count ?? data.helpful_count ?? helpfulCount);
        setNotHelpfulCount(data.data?.not_helpful_count ?? data.not_helpful_count ?? notHelpfulCount);
      } catch {
        // Rollback optimistic update
        setHelpfulCount(prevHelpful);
        setNotHelpfulCount(prevNotHelpful);
        setUserVote(prevVote);
        toast.error("Failed to record vote. Please try again.");
      } finally {
        setVotePending(false);
      }
    },
    [review.id, helpfulCount, notHelpfulCount, userVote, votePending, isOwnReview],
  );

  return (
    <>
      <div className="border-b border-border py-5 last:border-0">
        {/* Header: rating + date + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <RatingStars rating={review.overall_rating} size="sm" />
            <h4 className="font-medium text-foreground">{review.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {review.edited_at && (
              <Badge variant="outline" className="text-xs">
                <Pencil className="mr-1 size-3" />
                Edited
              </Badge>
            )}
            {review.moderation_status === "approved" && (
              <Badge variant="outline" className="border-green-200 bg-green-50 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="mr-1 size-3" />
                Verified
              </Badge>
            )}
            <span className="shrink-0 text-xs text-muted-foreground">{dateStr}</span>
          </div>
        </div>

        {/* Review text */}
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {review.review_text}
        </p>

        {/* Sub-ratings (if any) */}
        {(review.punctuality_rating || review.quality_rating || review.value_rating || review.professionalism_rating) && (
          <div className="mt-3 flex flex-wrap gap-3">
            {review.punctuality_rating && (
              <span className="text-xs text-muted-foreground">
                Punctuality: <strong>{review.punctuality_rating}/5</strong>
              </span>
            )}
            {review.quality_rating && (
              <span className="text-xs text-muted-foreground">
                Quality: <strong>{review.quality_rating}/5</strong>
              </span>
            )}
            {review.value_rating && (
              <span className="text-xs text-muted-foreground">
                Value: <strong>{review.value_rating}/5</strong>
              </span>
            )}
            {review.professionalism_rating && (
              <span className="text-xs text-muted-foreground">
                Professionalism: <strong>{review.professionalism_rating}/5</strong>
              </span>
            )}
          </div>
        )}

        {/* Provider response */}
        {review.provider_response && (
          <div className="mt-3 rounded-lg bg-brand-primary/5 p-3 border-l-4 border-brand-primary">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Provider response</p>
            <p className="text-sm text-muted-foreground italic">{review.provider_response}</p>
          </div>
        )}

        {/* Actions row */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2", userVote === true && "bg-green-50 text-green-700 dark:bg-green-900/20")}
              onClick={() => handleVote(true)}
              disabled={votePending || isOwnReview}
              aria-label={`Helpful (${helpfulCount})`}
            >
              <ThumbsUp className="mr-1 size-3.5" />
              <span className="text-xs tabular-nums">{helpfulCount}</span>
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2", userVote === false && "bg-red-50 text-red-700 dark:bg-red-900/20")}
              onClick={() => handleVote(false)}
              disabled={votePending || isOwnReview}
              aria-label={`Not helpful (${notHelpfulCount})`}
            >
              <ThumbsDown className="mr-1 size-3.5" />
              <span className="text-xs tabular-nums">{notHelpfulCount}</span>
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {canEdit && (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit?.(review)}>
                <Pencil className="mr-1 size-3.5" />
                <span className="text-xs">Edit</span>
              </Button>
            )}
            {!isOwnReview && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="mr-1 size-3.5" />
                <span className="text-xs">Report</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <ReportReviewModal
        reviewId={review.id}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/components/reviews/ReviewCardEnhanced.tsx
git commit -m "feat(reviews): ReviewCardEnhanced — optimistic votes, edit/report, verified badge"
```

---

### Task 16: Wire Everything into ReviewsList

**Files:**
- Modify: `britv3.0/src/components/reviews/ReviewsList.tsx`

- [ ] **Step 1: Rewrite ReviewsList to use ReviewCardEnhanced**

Replace the entire `ReviewsList.tsx` with:

```tsx
"use client";

import { useCallback } from "react";
import { ReviewCardEnhanced } from "@/components/reviews/ReviewCardEnhanced";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/marketplace";

type ReviewsListProps = Readonly<{
  reviews: Review[];
  totalCount: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSortChange?: (sort: "recent" | "helpful") => void;
  onEdit?: (review: Review) => void;
  currentUserId?: string;
  currentPage?: number;
  sort?: "recent" | "helpful";
  loading?: boolean;
  className?: string;
}>;

function ReviewSkeleton() {
  return (
    <div className="animate-pulse border-b border-border py-5 last:border-0">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="size-4 rounded bg-neutral-200" />
            ))}
          </div>
          <div className="h-4 w-48 rounded bg-neutral-200" />
        </div>
        <div className="h-3 w-20 rounded bg-neutral-200" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-neutral-200" />
        <div className="h-3 w-3/4 rounded bg-neutral-200" />
      </div>
      <div className="mt-3 flex gap-3">
        <div className="h-7 w-16 rounded bg-neutral-200" />
        <div className="h-7 w-16 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

export function ReviewsList({
  reviews,
  totalCount,
  pageSize = 10,
  onPageChange,
  onSortChange,
  onEdit,
  currentUserId,
  currentPage = 1,
  sort = "recent",
  loading = false,
  className,
}: ReviewsListProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSortChange?.(e.target.value as "recent" | "helpful");
    },
    [onSortChange],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {totalCount} {totalCount === 1 ? "review" : "reviews"}
        </h3>
        <select
          value={sort}
          onChange={handleSortChange}
          className="rounded-md border border-input bg-transparent px-2 py-1 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          <option value="recent">Most recent</option>
          <option value="helpful">Most helpful</option>
        </select>
      </div>

      <div>
        {loading ? (
          <>
            <ReviewSkeleton />
            <ReviewSkeleton />
            <ReviewSkeleton />
          </>
        ) : reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No reviews yet.
          </p>
        ) : (
          reviews.map((review) => (
            <ReviewCardEnhanced
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onEdit={onEdit}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
            {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add britv3.0/src/components/reviews/ReviewsList.tsx
git commit -m "feat(reviews): wire ReviewCardEnhanced into ReviewsList with skeleton loading"
```

---

### Task 17: Update TODOS.md with Deferred Items

**Files:**
- Modify: `britv3.0/TODOS.md` (or project TODOS location)

- [ ] **Step 1: Add the 4 deferred TODOS**

```markdown
## Reviews & Ratings — Deferred (CEO Review 2026-03-16)

### P3 | Real-Time Review Count on Provider Profiles
Use Supabase Realtime subscription on `provider_rating_stats` to live-update review count and average rating on provider profile pages when a new review is approved. Effort: S.

### P2 | Review Response Notification to Reviewer
When a provider responds to a review, send in-app notification + email to the original reviewer using existing Resend + React Email infrastructure. Effort: S.

### P3 | Guided Review Prompts
Show contextual prompts in ReviewForm based on trade category (e.g., "How was their punctuality?"). Static prompt map by category, dismissible hint cards above textarea. Effort: S.

### P3 | Review Sentiment Emoji Badge
Show sentiment indicator badge (green/amber/red) next to each review. Visible to moderators initially, optionally public. Leverages existing sentiment analysis data. Effort: S.
```

- [ ] **Step 2: Commit**

```bash
git add TODOS.md
git commit -m "docs(reviews): add 4 deferred review TODO items from CEO plan review"
```

---

### Task 18: Final Build Verification

- [ ] **Step 1: Run the build**

```bash
cd britv3.0 && pnpm build
```
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Run lint**

```bash
cd britv3.0 && pnpm lint
```
Expected: No lint errors.

- [ ] **Step 3: Verify migration applied**

Run via Supabase MCP:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'reviews'
  AND column_name IN ('flag_count', 'edited_at', 'original_text', 'edit_count', 'edit_history');
```
Expected: 5 rows.

```sql
SELECT proname FROM pg_proc WHERE proname LIKE 'atomic_%_review';
```
Expected: 2 rows (`atomic_vote_review`, `atomic_flag_review`).

```sql
SELECT count(*) FROM pg_matviews WHERE matviewname = 'area_rating_stats';
```
Expected: 1.

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix(reviews): build/lint fixes from final verification"
```
