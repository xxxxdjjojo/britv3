/**
 * Review service -- handles review CRUD, helpfulness voting, provider responses, and flagging.
 * All operations require an authenticated Supabase client (RLS enforced).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ReviewCreateInput,
  ReviewFlagInput,
} from "@/lib/validators/marketplace-schemas";
import { reviewCreateSchema, reviewFlagSchema } from "@/lib/validators/marketplace-schemas";
import { analyzeReviewSentiment } from "@/lib/marketplace/sentiment-analyzer";
import { detectSpam, redactPII } from "@/lib/marketplace/spam-detector";

// -- Types -------------------------------------------------------------------

type ReviewSortOption = "recent" | "helpful" | "relevant";

type ListProviderReviewsOptions = Readonly<{
  sort?: ReviewSortOption;
  minRating?: number;
  maxRating?: number;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}>;

// -- Service functions -------------------------------------------------------

/**
 * Create a review for a completed booking.
 * Validates booking ownership, runs sentiment + spam analysis,
 * and inserts into moderation queue with priority scoring.
 */
export async function createReview(
  supabase: SupabaseClient,
  userId: string,
  data: ReviewCreateInput & { booking_id: string },
) {
  // Validate input
  const parsed = reviewCreateSchema.parse(data);

  // Verify booking exists, is completed, and belongs to user
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, user_id, provider_id, status")
    .eq("id", data.booking_id)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "completed") {
    throw new Error("Can only review completed bookings");
  }

  if (booking.user_id !== userId) {
    throw new Error("You can only review your own bookings");
  }

  // PII redaction
  const sanitizedText = redactPII(parsed.review_text);
  const sanitizedTitle = redactPII(parsed.title);

  // Run sentiment analysis
  const sentimentResult = analyzeReviewSentiment(sanitizedText);

  // Run spam detection
  const spamResult = detectSpam(sanitizedText);

  // Insert review (UNIQUE constraint on booking_id prevents duplicates)
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .insert({
      booking_id: data.booking_id,
      provider_id: booking.provider_id,
      reviewer_id: userId,
      overall_rating: parsed.overall_rating,
      punctuality_rating: parsed.punctuality_rating ?? null,
      quality_rating: parsed.quality_rating ?? null,
      value_rating: parsed.value_rating ?? null,
      professionalism_rating: parsed.professionalism_rating ?? null,
      title: sanitizedTitle,
      review_text: sanitizedText,
      sentiment: sentimentResult.sentiment,
      spam_indicators: spamResult,
      moderation_status: "pending",
      helpful_count: 0,
      not_helpful_count: 0,
      fake_review_probability: 0,
      authenticity_score: 0,
    })
    .select()
    .single();

  if (reviewError) {
    // Check for unique constraint violation (duplicate review for booking)
    if (reviewError.code === "23505") {
      throw new Error("A review already exists for this booking");
    }
    throw new Error(`Failed to create review: ${reviewError.message}`);
  }

  // Calculate moderation priority score
  const priorityScore =
    spamResult.spam_score * 3 +
    (review.fake_review_probability > 0.7 ? 10 : 0);

  // Insert into moderation queue
  await supabase.from("moderation_queue").insert({
    review_id: review.id,
    priority_score: priorityScore,
  });

  return review;
}

/**
 * List approved reviews for a provider with sorting, filtering, and pagination.
 */
export async function listProviderReviews(
  supabase: SupabaseClient,
  providerId: string,
  options: ListProviderReviewsOptions = {},
) {
  const {
    sort = "recent",
    minRating,
    maxRating,
    searchQuery,
    limit = 20,
    offset = 0,
  } = options;

  let query = supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("provider_id", providerId)
    .eq("moderation_status", "approved")
    .is("deleted_at", null);

  // Apply rating filters
  if (minRating !== undefined) {
    query = query.gte("overall_rating", minRating);
  }
  if (maxRating !== undefined) {
    query = query.lte("overall_rating", maxRating);
  }

  // Apply text search if provided
  if (searchQuery) {
    query = query.textSearch("search_vector", searchQuery);
  }

  // Apply sorting
  switch (sort) {
    case "helpful":
      query = query.order("helpful_count", { ascending: false });
      break;
    case "relevant":
      // For relevant sort with search, use default ordering from textSearch
      // Fall back to recent if no search query
      if (!searchQuery) {
        query = query.order("created_at", { ascending: false });
      }
      break;
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: reviews, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list reviews: ${error.message}`);
  }

  return {
    reviews: reviews ?? [],
    total: count ?? 0,
    limit,
    offset,
  };
}

/**
 * Vote on whether a review is helpful (upsert -- one vote per user per review).
 */
export async function voteHelpfulness(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
  isHelpful: boolean,
) {
  // Check if user already voted
  const { data: existing } = await supabase
    .from("review_helpfulness")
    .select("id, is_helpful")
    .eq("review_id", reviewId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    // Update existing vote
    const { error: updateError } = await supabase
      .from("review_helpfulness")
      .update({ is_helpful: isHelpful })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(`Failed to update vote: ${updateError.message}`);
    }

    // Adjust counts: remove old vote, add new vote
    if (existing.is_helpful !== isHelpful) {
      const incrementField = isHelpful ? "helpful_count" : "not_helpful_count";
      const decrementField = isHelpful ? "not_helpful_count" : "helpful_count";

      // Use RPC or manual update for atomic increment/decrement
      const { data: review } = await supabase
        .from("reviews")
        .select("helpful_count, not_helpful_count")
        .eq("id", reviewId)
        .single();

      if (review) {
        await supabase
          .from("reviews")
          .update({
            [incrementField]: review[incrementField] + 1,
            [decrementField]: Math.max(0, review[decrementField] - 1),
          })
          .eq("id", reviewId);
      }
    }
  } else {
    // Insert new vote
    const { error: insertError } = await supabase
      .from("review_helpfulness")
      .insert({
        review_id: reviewId,
        user_id: userId,
        is_helpful: isHelpful,
      });

    if (insertError) {
      throw new Error(`Failed to record vote: ${insertError.message}`);
    }

    // Increment count
    const { data: review } = await supabase
      .from("reviews")
      .select("helpful_count, not_helpful_count")
      .eq("id", reviewId)
      .single();

    if (review) {
      const field = isHelpful ? "helpful_count" : "not_helpful_count";
      await supabase
        .from("reviews")
        .update({ [field]: review[field] + 1 })
        .eq("id", reviewId);
    }
  }

  // Return updated counts
  const { data: updated } = await supabase
    .from("reviews")
    .select("helpful_count, not_helpful_count")
    .eq("id", reviewId)
    .single();

  return {
    helpful_count: updated?.helpful_count ?? 0,
    not_helpful_count: updated?.not_helpful_count ?? 0,
  };
}

/**
 * Post or update a provider response to a review.
 * One response per review; subsequent calls update the existing response.
 */
export async function respondToReview(
  supabase: SupabaseClient,
  providerId: string,
  reviewId: string,
  responseText: string,
) {
  // Validate response length
  if (!responseText || responseText.length < 1) {
    throw new Error("Response cannot be empty");
  }
  if (responseText.length > 1000) {
    throw new Error("Response must be 1000 characters or less");
  }

  // Verify provider owns the review's service
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, provider_id")
    .eq("id", reviewId)
    .single();

  if (reviewError || !review) {
    throw new Error("Review not found");
  }

  if (review.provider_id !== providerId) {
    throw new Error("Only the reviewed provider can respond");
  }

  // Update the review with the provider response
  const { data: updated, error: updateError } = await supabase
    .from("reviews")
    .update({
      provider_response: responseText,
      provider_response_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to save response: ${updateError.message}`);
  }

  return updated;
}

/**
 * Flag a review for moderation. Users cannot flag their own reviews.
 * After 3 flags, moderation queue priority is boosted.
 */
export async function flagReview(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
  data: ReviewFlagInput,
) {
  // Validate input
  const parsed = reviewFlagSchema.parse(data);

  // Verify review exists and user is not the reviewer
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, reviewer_id, flag_count")
    .eq("id", reviewId)
    .single();

  if (reviewError || !review) {
    throw new Error("Review not found");
  }

  if (review.reviewer_id === userId) {
    throw new Error("Cannot flag your own review");
  }

  // Insert the flag
  const { data: flag, error: flagError } = await supabase
    .from("review_flags")
    .insert({
      review_id: reviewId,
      user_id: userId,
      reason: parsed.reason,
      description: parsed.description ?? null,
      admin_status: "pending",
    })
    .select()
    .single();

  if (flagError) {
    throw new Error(`Failed to flag review: ${flagError.message}`);
  }

  // Increment flag_count on the review
  const newFlagCount = (review.flag_count ?? 0) + 1;
  await supabase
    .from("reviews")
    .update({ flag_count: newFlagCount })
    .eq("id", reviewId);

  // If flag_count >= 3, boost moderation queue priority
  if (newFlagCount >= 3) {
    const { data: queueEntry } = await supabase
      .from("moderation_queue")
      .select("id, priority_score")
      .eq("review_id", reviewId)
      .maybeSingle();

    if (queueEntry) {
      await supabase
        .from("moderation_queue")
        .update({ priority_score: queueEntry.priority_score + 5 })
        .eq("id", queueEntry.id);
    }
  }

  return flag;
}
