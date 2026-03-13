import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewResponseForm } from "@/components/dashboard/agent/reviews/ReviewResponseForm";

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

export default async function ReviewRespondPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .eq("reviewed_entity_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const review = data as ReviewRow;

  return <ReviewResponseForm review={review} />;
}
