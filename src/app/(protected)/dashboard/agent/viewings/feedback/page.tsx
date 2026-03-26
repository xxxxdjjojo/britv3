import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewingFeedback } from "@/services/agent/agent-viewing-service";
import { ViewingFeedbackForm } from "@/components/dashboard/agent/viewings/ViewingFeedbackForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Viewing Feedback - Agent Dashboard",
  description: "Review and submit viewing feedback",
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

  const feedbacks = await getViewingFeedback(supabase, user.id).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Viewing Feedback</h1>
        <p className="text-muted-foreground">
          Record and review buyer feedback from viewings
        </p>
      </div>
      <ViewingFeedbackForm feedbacks={feedbacks} />
    </div>
  );
}

export default function ViewingFeedbackPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
