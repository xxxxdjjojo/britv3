/**
 * Inngest function: document-rejected
 *
 * Triggered when an admin rejects a provider's uploaded document.
 * Sends a rejection notification email with the reason and a link
 * to re-upload.
 *
 * Event: "provider/document.rejected"
 * Data: { providerId, documentType, rejectionReason }
 */

import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";

type DocumentRejectedEventData = {
  providerId: string;
  documentType: string;
  rejectionReason: string;
};

export const documentRejected = inngest.createFunction(
  { id: "document-rejected", name: "Send document rejection notification", retries: 3 },
  { event: "provider/document.rejected" },
  async ({ event, step }) => {
    const { providerId, documentType, rejectionReason } = event.data as DocumentRejectedEventData;
    const supabase = createAdminClient();

    await step.run("send-rejection-email", async () => {
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

      const { DocumentRejectedEmail } = await import("@/emails/document-rejected");
      const { render } = await import("@react-email/components");
      const { Resend } = await import("resend");

      const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";
      const providerName = provider.business_name || profile.first_name || "there";

      const html = await render(
        DocumentRejectedEmail({
          providerName,
          documentType,
          rejectionReason,
          verificationUrl: `${BASE_URL}/dashboard/provider/verification`,
        }),
      );

      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Britestate <hello@britestate.co.uk>",
        to: profile.email,
        subject: `Action Required: Your ${documentType} was not approved`,
        html,
      });
    });

    return { providerId, documentType };
  },
);
