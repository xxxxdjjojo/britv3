import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewingFeedback } from "@/services/agent/agent-viewing-service";
import { ViewingFeedbackForm } from "@/components/dashboard/agent/viewings/ViewingFeedbackForm";
import type { AgentViewingFeedback } from "@/types/agent";

export default async function ViewingFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let feedback: AgentViewingFeedback[] = [];
  try {
    feedback = await getViewingFeedback(supabase, user.id);
  } catch {
    feedback = [];
  }

  return <ViewingFeedbackForm initialFeedback={feedback} />;
}
