import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewsDashboard } from "@/components/dashboard/agent/reviews/ReviewsDashboard";

export const metadata = {
  title: "Reviews - TrueDeed Agent",
  description: "Manage your agency reviews and ratings",
};

export default async function AgentReviewsPage() {
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
