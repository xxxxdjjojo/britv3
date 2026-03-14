import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getViewingFeedback,
  getAgentViewingSlots,
} from "@/services/agent/agent-viewing-service";
import { ViewingFeedbackForm } from "@/components/dashboard/agent/viewings/ViewingFeedbackForm";
import type { AgentViewingSlot } from "@/types/agent";

export default async function AgentViewingFeedbackPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let feedbackList: Awaited<ReturnType<typeof getViewingFeedback>> = [];
  let allSlots: AgentViewingSlot[] = [];

  try {
    feedbackList = await getViewingFeedback(supabase, user.id);
  } catch {
    // Graceful fallback
  }

  try {
    // Fetch past 90 days of booked slots
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    allSlots = await getAgentViewingSlots(supabase, user.id, undefined, { start, end });
  } catch {
    // Graceful fallback
  }

  // Find booked slots that don't have feedback yet
  const slotIdsWithFeedback = new Set(feedbackList.map((f) => f.viewing_slot_id));
  const bookedSlotsWithoutFeedback = allSlots.filter(
    (s) => s.is_booked && !slotIdsWithFeedback.has(s.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Viewing Feedback</h1>
        <p className="text-muted-foreground">
          Collect and review post-viewing feedback from buyers
        </p>
      </div>

      <ViewingFeedbackForm
        feedbackList={feedbackList}
        bookedSlotsWithoutFeedback={bookedSlotsWithoutFeedback}
      />
    </div>
  );
}
