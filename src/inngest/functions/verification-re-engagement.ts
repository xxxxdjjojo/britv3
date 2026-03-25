/**
 * Inngest cron: verification-re-engagement
 *
 * Runs every Monday at 10am UTC. Finds providers with partial verification
 * (trust_score between 1–99) who have had no document or reference activity
 * in the past 7 days, and sends a nudge email encouraging them to complete
 * verification.
 *
 * Cron: "0 10 * * 1"
 */

import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";

export const verificationReEngagement = inngest.createFunction(
  { id: "verification-re-engagement", name: "Weekly stalled verification nudge" },
  { cron: "0 10 * * 1" },
  async ({ step }) => {
    const supabase = createAdminClient();

    const stalledProviders = await step.run("find-stalled-providers", async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: providers, error } = await supabase
        .from("service_provider_details")
        .select("id, user_id, business_name, trust_score")
        .gt("trust_score", 0)
        .lt("trust_score", 100);

      if (error || !providers || providers.length === 0) return [];

      const providerIds = providers.map((p) => p.id as string);

      // Batch query: all recent documents for all providers at once
      const { data: recentDocs, error: docsError } = await supabase
        .from("provider_documents")
        .select("provider_id")
        .in("provider_id", providerIds)
        .gte("created_at", sevenDaysAgo);

      if (docsError) {
        console.error("[verification-re-engagement] Failed to batch-fetch provider_documents:", docsError);
        return [];
      }

      // Batch query: all recent references for all providers at once
      const { data: recentRefs, error: refsError } = await supabase
        .from("provider_references")
        .select("provider_id")
        .in("provider_id", providerIds)
        .gte("requested_at", sevenDaysAgo);

      if (refsError) {
        console.error("[verification-re-engagement] Failed to batch-fetch provider_references:", refsError);
        return [];
      }

      // Build sets of providers with recent activity
      const hasRecentDoc = new Set((recentDocs ?? []).map((d) => d.provider_id as string));
      const hasRecentRef = new Set((recentRefs ?? []).map((r) => r.provider_id as string));

      // Filter to providers with NO recent activity
      return providers.filter(
        (p) => !hasRecentDoc.has(p.id as string) && !hasRecentRef.has(p.id as string),
      );
    });

    let sent = 0;
    for (const provider of stalledProviders) {
      await step.run(`nudge-${provider.id}`, async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, first_name")
          .eq("id", provider.user_id)
          .single();

        if (!profile?.email) return;

        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";
        const name = provider.business_name || profile.first_name || "there";

        await resend.emails.send({
          from: "Britestate <hello@britestate.co.uk>",
          to: profile.email,
          subject: `${name}, you're ${provider.trust_score}% verified — complete your profile to start receiving leads`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #1B4D3E;">You're almost there, ${name}!</h2>
              <p style="color: #5E5E6A; line-height: 1.6;">
                Your verification is <strong>${provider.trust_score}% complete</strong>.
                Finish the remaining steps to earn your Professional Verified badge and start appearing in marketplace search results.
              </p>
              <div style="margin: 24px 0;">
                <a href="${BASE_URL}/dashboard/provider/verification"
                   style="display: inline-block; background: #1B4D3E; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Continue Verification
                </a>
              </div>
              <p style="color: #9E9EAB; font-size: 12px;">
                You're receiving this because you started verification on Britestate.
              </p>
            </div>
          `,
        });
      });
      sent++;
    }

    return { stalledCount: stalledProviders.length, nudged: sent };
  },
);
