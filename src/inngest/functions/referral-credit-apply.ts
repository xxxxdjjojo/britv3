import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { applyReferralCredit } from "@/services/billing/referral-credit-service";

type ReferralCreditRequestedEvent = Readonly<{
  creditId: string;
}>;

export const referralCreditApply = inngest.createFunction(
  {
    id: "referral-credit-apply",
    name: "Apply provider referral credit",
    retries: 8,
  },
  { event: "billing/referral.credit-requested" },
  async ({ event, step }) => {
    const { creditId } = event.data as ReferralCreditRequestedEvent;
    if (!creditId) throw new Error("Referral credit event is missing creditId");

    return await step.run("apply-referral-credit", async () => {
      return await applyReferralCredit(
        createAdminClient(),
        getStripe(),
        creditId,
      );
    });
  },
);
