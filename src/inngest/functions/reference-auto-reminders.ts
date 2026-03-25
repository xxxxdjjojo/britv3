/**
 * Inngest cron function: reference-auto-reminders
 *
 * Runs daily at 9am UTC. Finds pending, non-cancelled reference requests
 * that are due for a reminder (3, 7, or 14 days after request) and fires
 * the same provider/reference.requested event to reuse the email logic.
 *
 * Max 3 reminders per reference. 24-hour cooldown between sends.
 */

import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";

export const referenceAutoReminders = inngest.createFunction(
  { id: "reference-auto-reminders", name: "Daily reference reminder emails" },
  { cron: "0 9 * * *" }, // Daily at 9am UTC
  async ({ step }) => {
    const supabase = createAdminClient();

    // Fetch all pending, non-cancelled references that need reminders
    const refs = await step.run("fetch-pending-refs", async () => {
      const { data, error } = await supabase
        .from("provider_references")
        .select("id, provider_id, referee_name, referee_email, reference_type, requested_at, last_reminded_at, reminder_count")
        .eq("status", "pending")
        .is("cancelled_at", null)
        .lt("reminder_count", 3); // Max 3 reminders

      if (error) throw error;
      return data ?? [];
    });

    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Determine which refs need a reminder based on schedule: 3, 7, 14 days
    const REMINDER_SCHEDULE = [3, 7, 14]; // days after request

    const toRemind = refs.filter((ref) => {
      const requestedAt = new Date(ref.requested_at).getTime();
      const daysSinceRequest = (now - requestedAt) / DAY_MS;
      const nextReminderDay = REMINDER_SCHEDULE[ref.reminder_count];

      if (!nextReminderDay) return false; // Already sent all 3
      if (daysSinceRequest < nextReminderDay) return false; // Not time yet

      // Check cooldown: don't send if last reminded < 24h ago
      if (ref.last_reminded_at) {
        const lastReminded = new Date(ref.last_reminded_at).getTime();
        if (now - lastReminded < DAY_MS) return false;
      }

      return true;
    });

    // Send reminders
    let sent = 0;
    for (const ref of toRemind) {
      await step.run(`remind-${ref.id}`, async () => {
        // Update reminder tracking
        await supabase
          .from("provider_references")
          .update({
            last_reminded_at: new Date().toISOString(),
            reminder_count: ref.reminder_count + 1,
          })
          .eq("id", ref.id);

        // Fire the reference.requested event to reuse email logic
        await inngest.send({
          name: "provider/reference.requested",
          data: {
            referenceId: ref.id,
            providerId: ref.provider_id,
            refereeName: ref.referee_name,
            refereeEmail: ref.referee_email,
            referenceType: ref.reference_type,
          },
        });
      });
      sent++;
    }

    return { total: refs.length, reminded: sent };
  },
);
