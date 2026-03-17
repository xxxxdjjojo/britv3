import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewingFeedback } from "@/services/agent/agent-viewing-service";
import { ViewingFeedbackForm } from "@/components/dashboard/agent/viewings/ViewingFeedbackForm";

export const metadata = {
  title: "Viewing Feedback - Agent Dashboard",
  description: "Review and submit viewing feedback",
};

export default async function ViewingFeedbackPage() {
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
