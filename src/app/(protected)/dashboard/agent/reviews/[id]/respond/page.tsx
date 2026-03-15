import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewResponseForm } from "@/components/dashboard/agent/reviews/ReviewResponseForm";
import type { AgentReview } from "@/components/dashboard/agent/reviews/ReviewsDashboard";

type Params = Readonly<{ params: Promise<{ id: string }> }>;

export default async function ReviewRespondPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the specific review, confirming it belongs to this agent
  const { data: review, error } = await supabase
    .from("reviews")
    .select("id, reviewer_name, rating, review_text, agent_response, responded_at, created_at")
    .eq("id", id)
    .eq("reviewed_user_id", user.id)
    .single();

  if (error || !review) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <a
          href="/dashboard/agent/reviews"
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to Reviews
        </a>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Respond to Review
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your response will be visible publicly to prospective clients.
        </p>
      </div>
      <ReviewResponseForm review={review as AgentReview} reviewId={id} />
    </div>
  );
}
