import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewsDashboard } from "@/components/dashboard/agent/reviews/ReviewsDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Reviews - Britestate Agent",
  description: "Manage your agency reviews and ratings",
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type Review = {
    id: string;
    rating: number;
    review_text?: string;
    reviewer_name?: string;
    created_at: string;
    agent_response?: string;
    responded_at?: string;
  };

  let reviews: Review[] = [];
  try {
    const { data: rawReviews } = await supabase
      .from("reviews")
      .select("id, rating, review_text, reviewer_name, created_at, agent_response, responded_at")
      .eq("reviewee_id", user.id)
      .order("created_at", { ascending: false });
    reviews = (rawReviews ?? []) as Review[];
  } catch {
    // Fall through with empty array
  }

  // Compute stats
  const totalCount = reviews.length;
  const byStar: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;

  for (const r of reviews) {
    ratingSum += r.rating;
    if (r.rating >= 1 && r.rating <= 5) {
      byStar[r.rating] = (byStar[r.rating] ?? 0) + 1;
    }
  }

  const overallAvg = totalCount > 0 ? ratingSum / totalCount : 0;

  const stats = {
    overall_avg: overallAvg,
    total_count: totalCount,
    by_star: byStar,
  };

  return <ReviewsDashboard reviews={reviews} stats={stats} />;
}

export default function AgentReviewsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
