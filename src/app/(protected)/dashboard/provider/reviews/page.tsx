import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { ReviewsBreakdown } from "@/components/dashboard/provider/ReviewsBreakdown";
import { ReviewCard } from "@/components/dashboard/provider/ReviewCard";
import type { ReviewRow } from "@/components/dashboard/provider/ReviewCard";

export const metadata = { title: "Reviews — Provider Dashboard" };

type SearchParams = { rating?: string };

export default async function ProviderReviewsPage(props: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Build query ──────────────────────────────────────────────────────────
  let query = supabase
    .from("reviews")
    .select(
      "id, created_at, overall_rating, comment, provider_response, reviewer:reviewer_id(full_name:display_name)",
    )
    .eq("reviewee_id", user.id)
    .order("created_at", { ascending: false });

  // Optional rating filter from ?rating=N
  const ratingFilter = searchParams.rating ? parseInt(searchParams.rating, 10) : null;
  if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
    query = query.eq("overall_rating", ratingFilter);
  }

  const { data: rawReviews } = await query;

  // ── Normalise rows ────────────────────────────────────────────────────────
  type RawReview = {
    id: string;
    created_at: string;
    overall_rating: number;
    comment: string | null;
    provider_response: string | null;
    reviewer: { full_name: string } | { full_name: string }[] | null;
  };

  const reviews: ReviewRow[] = (rawReviews ?? []).map((r: RawReview) => {
    const reviewerObj = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
    return {
      id: r.id,
      created_at: r.created_at,
      overall_rating: r.overall_rating,
      comment: r.comment,
      provider_response: r.provider_response,
      reviewer_name: reviewerObj?.full_name ?? "Anonymous",
    };
  });

  // ── Aggregate stats (computed on full unfiltered set) ─────────────────────
  const { data: allRatings } = await supabase
    .from("reviews")
    .select("overall_rating")
    .eq("reviewee_id", user.id);

  const allRatingsArr = (allRatings ?? []).map(
    (r: { overall_rating: number }) => r.overall_rating,
  );

  const totalCount = allRatingsArr.length;
  const averageRating =
    totalCount > 0
      ? allRatingsArr.reduce((s: number, r: number) => s + r, 0) / totalCount
      : 0;

  const countPerStar = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
    1 | 2 | 3 | 4 | 5,
    number
  >;
  for (const r of allRatingsArr) {
    const star = Math.round(r) as 1 | 2 | 3 | 4 | 5;
    if (star >= 1 && star <= 5) countPerStar[star]++;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reviews</h1>
        <p className="mt-1 text-sm text-neutral-500">
          See what clients are saying and respond to feedback.
        </p>
      </div>

      {/* Breakdown card */}
      {totalCount > 0 ? (
        <ReviewsBreakdown
          totalCount={totalCount}
          averageRating={averageRating}
          countPerStar={countPerStar}
        />
      ) : null}

      {/* Rating filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/provider/reviews"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !ratingFilter
              ? "border-[#1B4D3E] bg-[#1B4D3E]/10 text-[#1B4D3E]"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </Link>
        {([5, 4, 3, 2, 1] as const).map((star) => (
          <Link
            key={star}
            href={`/dashboard/provider/reviews?rating=${star}`}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              ratingFilter === star
                ? "border-[#1B4D3E] bg-[#1B4D3E]/10 text-[#1B4D3E]"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {star}★
          </Link>
        ))}
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-200 py-16 text-center">
          <Star className="size-10 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">
            {ratingFilter ? `No ${ratingFilter}-star reviews yet.` : "No reviews yet."}
          </p>
          <p className="text-xs text-neutral-400">
            Complete jobs and ask clients to leave a review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
