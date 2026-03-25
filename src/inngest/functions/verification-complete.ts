/**
 * Inngest function: verification-complete
 *
 * Triggered when all 5 verification steps are approved. Awards the
 * "professional_verified" badge, persists the trust score, updates the
 * profile status, and sends a congratulations email.
 *
 * Event: "provider/verification.complete"
 * Data: { providerId }
 */

import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVerificationSteps } from "@/services/provider/provider-verification-service";
import { computeTrustScore, persistTrustScore } from "@/services/provider/trust-score-service";

type VerificationCompleteEventData = {
  providerId: string;
};

export const verificationComplete = inngest.createFunction(
  { id: "verification-complete", name: "Award professional verified badge", retries: 3 },
  { event: "provider/verification.complete" },
  async ({ event, step }) => {
    const { providerId } = event.data as VerificationCompleteEventData;
    const supabase = createAdminClient();

    // Step 1: Recompute and persist trust score
    const { score } = await step.run("persist-trust-score", async () => {
      const steps = await getVerificationSteps(providerId, supabase);
      const score = computeTrustScore(steps);
      await persistTrustScore(providerId, score, supabase);
      return { score };
    });

    // Step 2: Upsert professional_verified badge
    await step.run("award-badge", async () => {
      // Check if badge already exists
      const { data: existing } = await supabase
        .from("provider_badges")
        .select("id")
        .eq("provider_id", providerId)
        .eq("badge_type", "professional_verified")
        .maybeSingle();

      if (!existing) {
        await supabase.from("provider_badges").insert({
          provider_id: providerId,
          badge_type: "professional_verified",
          badge_label: "Professional Verified",
          is_active: true,
          earned_at: new Date().toISOString(),
        });
      }
    });

    // Step 3: Update profiles.provider_verification_status
    await step.run("update-profile-status", async () => {
      // Get user_id from service_provider_details
      const { data: provider } = await supabase
        .from("service_provider_details")
        .select("user_id")
        .eq("id", providerId)
        .single();

      if (provider?.user_id) {
        await supabase
          .from("profiles")
          .update({ provider_verification_status: "verified" })
          .eq("id", provider.user_id);
      }
    });

    // Step 4: Send congratulations email (best-effort)
    await step.run("send-congrats-email", async () => {
      try {
        const { data: provider } = await supabase
          .from("service_provider_details")
          .select("user_id, business_name")
          .eq("id", providerId)
          .single();

        if (!provider) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, first_name")
          .eq("id", provider.user_id)
          .single();

        if (!profile?.email) return;

        const { VerificationCompleteEmail } = await import("@/emails/verification-complete");
        const { render } = await import("@react-email/components");
        const { Resend } = await import("resend");

        const html = await render(
          VerificationCompleteEmail({
            providerName: provider.business_name || profile.first_name || "there",
            trustScore: score,
          }),
        );

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Britestate <hello@britestate.co.uk>",
          to: profile.email,
          subject: "You're now a Verified Professional on Britestate!",
          html,
        });
      } catch (err) {
        console.error("[verification-complete] congrats email failed:", err);
      }
    });

    return { providerId, score, badgeAwarded: true };
  },
);
