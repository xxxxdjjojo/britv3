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
  let sentimentResult: { sentiment: string; confidence: number };
  try {
    sentimentResult = analyzeReviewSentiment(sanitizedText);
  } catch {
    sentimentResult = { sentiment: "neutral", confidence: 0 };
  }

  // Run spam detection
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
  const { error: queueError } = await supabase.from("moderation_queue").insert({
    review_id: review.id,
    priority_score: priorityScore,
  });

  if (queueError) {
    console.error("[review-service] Failed to insert moderation queue entry", {
      reviewId: review.id,
      error: queueError.message,
    });
  }

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
 * Vote on whether a review is helpful.
 * Uses an atomic RPC to prevent race conditions on concurrent votes.
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
 * Flag a review for moderation using an atomic RPC.
 * Prevents self-flagging, duplicate flags, and handles priority boosting server-side.
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
