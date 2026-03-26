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

  const { data: rawReviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewee_id", user.id)
    .order("created_at", { ascending: false });

  const reviews = rawReviews ?? [];

  // Compute stats
  const totalCount = reviews.length;
  const byStar: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;

  for (const r of reviews) {
    const rating = r.rating as number;
    ratingSum += rating;
    if (rating >= 1 && rating <= 5) {
      byStar[rating] = (byStar[rating] ?? 0) + 1;
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
