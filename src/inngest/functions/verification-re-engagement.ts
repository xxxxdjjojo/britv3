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

      if (error || !providers) return [];

      const stalled = [];
      for (const p of providers) {
        const { count: recentDocs } = await supabase
          .from("provider_documents")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", p.id)
          .gte("created_at", sevenDaysAgo);

        const { count: recentRefs } = await supabase
          .from("provider_references")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", p.id)
          .gte("requested_at", sevenDaysAgo);

        if ((recentDocs ?? 0) === 0 && (recentRefs ?? 0) === 0) {
          stalled.push(p);
        }
      }

      return stalled;
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
