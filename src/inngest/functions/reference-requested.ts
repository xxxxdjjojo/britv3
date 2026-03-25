/**
 * Inngest function: reference-requested
 *
 * Triggered when a provider sends a reference request to a referee.
 * Generates an HMAC token, stores its hash, and emails the referee
 * a link to submit their reference.
 *
 * Event: "provider/reference.requested"
 * Data: { referenceId, providerId, refereeName, refereeEmail, referenceType }
 */

import { createHmac } from "crypto";
import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueReferenceToken } from "@/lib/auth/reference-token";

type ReferenceRequestedEventData = {
  referenceId: string;
  providerId: string;
  refereeName: string;
  refereeEmail: string;
  referenceType: "client" | "peer";
};

export const referenceRequested = inngest.createFunction(
  {
    id: "reference-requested",
    name: "Send reference request email",
    retries: 3,
  },
  { event: "provider/reference.requested" },
  async ({ event, step }) => {
    const { referenceId, providerId, refereeName, refereeEmail, referenceType } =
      event.data as ReferenceRequestedEventData;

    // Step 1: Generate token, store hash, fetch provider name
    const { token, providerName } = await step.run(
      "generate-token",
      async () => {
        const supabase = createAdminClient();

        // Issue HMAC token for the referee
        const issuedToken = issueReferenceToken(referenceId, providerId);

        // Hash the token for storage (so we can verify later without storing raw token)
        const tokenHash = createHmac("sha256", "reference-token-hash")
          .update(issuedToken)
          .digest("hex");

        // Store hash in provider_references
        await supabase
          .from("provider_references")
          .update({ submission_token_hash: tokenHash })
          .eq("id", referenceId);

        // Fetch provider display name
        const { data: provider } = await supabase
          .from("service_provider_details")
          .select("business_name")
          .eq("provider_id", providerId)
          .single();

        return {
          token: issuedToken,
          providerName: (provider as { business_name?: string } | null)?.business_name ?? "A Britestate Provider",
        };
      },
    );

    // Step 2: Send email via Resend
    await step.run("send-email", async () => {
      const { ReferenceRequestEmail } = await import("@/emails/reference-request");
      const { render } = await import("@react-email/components");
      const { Resend } = await import("resend");

      const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";
      const submissionUrl = `${BASE_URL}/reference/${token}`;

      const html = await render(
        ReferenceRequestEmail({
          providerName,
          refereeName,
          referenceType,
          submissionUrl,
          expiresInDays: 30,
        }),
      );

      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "Britestate <hello@britestate.co.uk>",
        to: refereeEmail,
        subject: `${providerName} has requested a reference from you`,
        html,
      });
    });

    return {
      status: "completed",
      referenceId,
      providerId,
      refereeEmail,
    };
  },
);
