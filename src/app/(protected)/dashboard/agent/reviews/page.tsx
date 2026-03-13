import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewsDashboard } from "@/components/dashboard/agent/reviews/ReviewsDashboard";

type ReviewRow = {
  id: string;
  rating: number;
  content: string | null;
  reviewer_id: string | null;
  reviewed_entity_id: string;
  agent_response: string | null;
  responded_at: string | null;
  created_at: string;
  reviewer_name: string | null;
};

export default async function AgentReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let reviews: ReviewRow[] = [];
  try {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewed_entity_id", user.id)
      .order("created_at", { ascending: false });

    reviews = (data ?? []) as ReviewRow[];
  } catch {
    reviews = [];
  }

  const total = reviews.length;
  const avgRating =
    total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    distribution[star] = (distribution[star] ?? 0) + 1;
  }

  return (
    <ReviewsDashboard
      reviews={reviews}
      avgRating={avgRating}
      total={total}
      distribution={distribution}
    />
  );
}
