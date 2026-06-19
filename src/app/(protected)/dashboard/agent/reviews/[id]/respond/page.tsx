import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewResponseForm } from "@/components/dashboard/agent/reviews/ReviewResponseForm";

export const metadata = {
  title: "Respond to Review - TrueDeed Agent",
  description: "Write a professional response to a client review",
};

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export default async function RespondToReviewPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !review) {
    notFound();
  }

  return <ReviewResponseForm review={review} />;
}
