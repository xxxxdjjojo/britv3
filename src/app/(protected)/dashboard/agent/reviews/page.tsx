import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewsDashboard } from "@/components/dashboard/agent/reviews/ReviewsDashboard";
import type { AgentReview, MonthlyRating } from "@/components/dashboard/agent/reviews/ReviewsDashboard";

export default async function AgentReviewsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch reviews where this agent is the reviewed entity
  let reviews: AgentReview[] = [];
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, reviewer_name, rating, review_text, agent_response, responded_at, created_at")
      .eq("reviewed_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      reviews = data as AgentReview[];
    }
  } catch {
    // reviews table may not be available — fail gracefully
  }

  // Compute monthly average rating over last 12 months
  const monthlyTrend: MonthlyRating[] = (() => {
    const now = new Date();
    const buckets: Record<string, { sum: number; count: number }> = {};

    // Initialise the last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      buckets[key] = { sum: 0, count: 0 };
    }

    reviews.forEach((r) => {
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      if (buckets[key]) {
        buckets[key].sum += r.rating;
        buckets[key].count += 1;
      }
    });

    return Object.entries(buckets)
      .filter(([, v]) => v.count > 0)
      .map(([month, v]) => ({
        month,
        avg_rating: Math.round((v.sum / v.count) * 10) / 10,
      }));
  })();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reviews</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your client reviews and public responses.
        </p>
      </div>
      <ReviewsDashboard reviews={reviews} monthlyTrend={monthlyTrend} />
    </div>
  );
}
