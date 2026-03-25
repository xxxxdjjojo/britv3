/**
 * Inngest function: reference-submitted
 *
 * Triggered when a referee submits their reference. Checks whether all 5
 * verification steps are now approved and, if so, fires the
 * provider/verification.complete event to award the badge.
 *
 * Event: "provider/reference.submitted"
 * Data: { referenceId, providerId }
 */

import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVerificationSteps } from "@/services/provider/provider-verification-service";
import { computeTrustScore } from "@/services/provider/trust-score-service";

type ReferenceSubmittedEventData = {
  referenceId: string;
  providerId: string;
};

export const referenceSubmitted = inngest.createFunction(
  { id: "reference-submitted", name: "Handle reference submission", retries: 3 },
  { event: "provider/reference.submitted" },
  async ({ event, step }) => {
    const { referenceId, providerId } = event.data as ReferenceSubmittedEventData;
    const supabase = createAdminClient();

    // Step 1: Check if all 5 verification steps are now approved
    const allComplete = await step.run("check-verification-complete", async () => {
      const steps = await getVerificationSteps(providerId, supabase);
      const score = computeTrustScore(steps);
      const allApproved = steps.every((s) => s.status === "approved");
      return { allApproved, score };
    });

    // Step 2: If all complete, fire verification.complete event
    if (allComplete.allApproved && allComplete.score === 100) {
      await step.run("fire-verification-complete", async () => {
        await inngest.send({
          name: "provider/verification.complete",
          data: { providerId },
        });
      });
    }

    return { referenceId, providerId, allComplete: allComplete.allApproved };
  },
);
