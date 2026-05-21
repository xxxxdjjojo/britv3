import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ReviewResponseForm } from "@/components/dashboard/provider/ReviewResponseForm";
import type { ReviewRow } from "@/components/dashboard/provider/ReviewCard";

export const metadata = { title: "Respond to Review — Provider Dashboard" };

export default async function RespondToReviewPage(props: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch review — must belong to this provider
  type RawReview = {
    id: string;
    created_at: string;
    overall_rating: number;
    comment: string | null;
    provider_response: string | null;
    reviewee_id: string;
    reviewer: { full_name: string } | { full_name: string }[] | null;
  };

  const { data: raw } = await supabase
    .from("reviews")
    .select(
      "id, created_at, overall_rating, comment, provider_response, reviewee_id, reviewer:reviewer_id(full_name:display_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!raw) notFound();

  const r = raw as RawReview;

  // Ownership check
  if (r.reviewee_id !== user.id) notFound();

  // If already responded, redirect back
  if (r.provider_response) {
    redirect("/dashboard/provider/reviews");
  }

  const reviewerObj = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
  const review: ReviewRow = {
    id: r.id,
    created_at: r.created_at,
    overall_rating: r.overall_rating,
    comment: r.comment,
    provider_response: r.provider_response,
    reviewer_name: reviewerObj?.full_name ?? "Anonymous",
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Respond to Review</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Write a public response that will appear below the review.
        </p>
      </div>

      <ReviewResponseForm review={review} />
    </div>
  );
}
