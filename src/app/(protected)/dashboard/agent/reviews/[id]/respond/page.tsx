import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewResponseForm } from "@/components/dashboard/agent/reviews/ReviewResponseForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Respond to Review - Britestate Agent",
  description: "Write a professional response to a client review",
};

type Props = Readonly<{ params: Promise<{ id: string }> }>;


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({ params }: Props) {
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

export default function RespondToReviewPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
