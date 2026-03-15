/**
 * Supabase Edge Function: weekly-digest
 *
 * Runs every Monday at 08:00 UTC via pg_cron.
 * Aggregates user activity (saved searches, viewings, messages) and sends
 * a weekly digest email via Resend.
 *
 * Uses service role client to bypass RLS (system-level operation).
 * Processes users in batches of 100 to manage memory and request timeouts.
 */

// @ts-expect-error -- Deno runtime types not available in Node TS config
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error -- Resend module
import { Resend } from "https://esm.sh/resend@3";

const BATCH_SIZE = 100;

interface DigestData {
  savedSearchResults: Array<{ searchName: string; newMatches: number }>;
  upcomingViewings: Array<{
    propertyAddress: string;
    date: string;
    time: string;
  }>;
  unreadMessageCount: number;
}

function buildWeeklyDigestHtml(
  userName: string,
  weekStarting: string,
  digest: DigestData,
): string {
  const summaryLines: string[] = [];

  if (digest.savedSearchResults.length > 0) {
    const searchSummary = digest.savedSearchResults
      .map((s) => `${s.newMatches} for "${s.searchName}"`)
      .join(", ");
    summaryLines.push(
      `<p style="margin:16px 0;color:#0A0A0B"><strong>New property matches:</strong> ${searchSummary}</p>`,
    );
  }

  if (digest.upcomingViewings.length > 0) {
    const viewingSummary = digest.upcomingViewings
      .map(
        (v) =>
          `<li style="margin:4px 0">${v.propertyAddress} on ${v.date} at ${v.time}</li>`,
      )
      .join("");
    summaryLines.push(
      `<p style="margin:16px 0;color:#0A0A0B"><strong>Upcoming viewings:</strong></p><ul style="margin:8px 0;padding-left:20px">${viewingSummary}</ul>`,
    );
  }

  if (digest.unreadMessageCount > 0) {
    summaryLines.push(
      `<p style="margin:16px 0;color:#0A0A0B"><strong>Unread messages:</strong> ${digest.unreadMessageCount}</p>`,
    );
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="background:#F8F8FA;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,sans-serif;padding:40px 0;margin:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.04)">
    <div style="background:#1B4D3E;padding:24px 32px">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0">Britestate</p>
    </div>
    <div style="padding:32px">
      <h1 style="color:#0A0A0B;font-size:24px;font-weight:700;margin:0 0 8px 0">Your Weekly Digest</h1>
      <p style="color:#5E5E6A;font-size:14px;margin:0 0 24px 0">Week of ${weekStarting}</p>
      <p style="color:#0A0A0B;font-size:15px;line-height:1.6;margin:0 0 16px 0">Hi ${userName || "there"},</p>
      ${summaryLines.join("\n")}
      <div style="margin-top:32px">
        <a href="https://britestate.co.uk/dashboard" style="display:inline-block;background:#1B4D3E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Go to Dashboard</a>
      </div>
    </div>
    <div style="padding:24px 32px;background:#F8F8FA;border-top:1px solid #E2E2E8">
      <p style="color:#9E9EAB;font-size:12px;margin:0">Britestate Ltd, 123 Property Lane, London, EC1A 1BB</p>
      <p style="color:#9E9EAB;font-size:11px;margin:8px 0 0 0">© 2026 Britestate Ltd. All rights reserved.</p>
      <p style="color:#9E9EAB;font-size:11px;margin:8px 0 0 0"><a href="https://britestate.co.uk/settings/notifications" style="color:#1B4D3E;text-decoration:none">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

async function processBatch(
  supabase: ReturnType<typeof createClient>,
  resend: InstanceType<typeof Resend>,
  userIds: string[],
  fromAddress: string,
  fromName: string,
): Promise<{ sent: number; skipped: number; errors: number }> {
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const now = new Date().toISOString();
  const sevenDaysFromNow = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const weekStarting = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  for (const userId of userIds) {
    try {
      // Check notification preference
      const { data: prefs } = await supabase
        .from("user_settings")
        .select("email_digest")
        .eq("user_id", userId)
        .single();

      const digestEnabled = prefs?.email_digest ?? true;
      if (!digestEnabled) {
        skipped++;
        continue;
      }

      // Fetch user details
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("id, email, first_name")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        console.error(`[weekly-digest] Failed to fetch user ${userId}:`, userError);
        errors++;
        continue;
      }

      // Get saved searches
      const { data: savedSearches } = await supabase
        .from("saved_searches")
        .select("id, name")
        .eq("user_id", userId);

      // For each saved search, count new matches
      const savedSearchResults: Array<{ searchName: string; newMatches: number }> = [];
      for (const search of savedSearches ?? []) {
        const { count } = await supabase
          .from("property_search_results")
          .select("*", { count: "exact", head: true })
          .eq("search_id", search.id)
          .gte("created_at", sevenDaysAgo);

        if ((count ?? 0) > 0) {
          savedSearchResults.push({
            searchName: search.name,
            newMatches: count ?? 0,
          });
        }
      }

      // Get upcoming viewings
      const { data: viewings } = await supabase
        .from("property_viewings")
        .select("property_address, viewing_date, viewing_time")
        .eq("user_id", userId)
        .eq("status", "confirmed")
        .gte("viewing_date", now)
        .lte("viewing_date", sevenDaysFromNow)
        .limit(5);

      const upcomingViewings = (viewings ?? []).map((v) => ({
        propertyAddress: v.property_address,
        date: new Date(v.viewing_date).toLocaleDateString("en-GB"),
        time: v.viewing_time,
      }));

      // Get unread message count
      const { count: unreadMessageCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);

      // Suppression check — skip if nothing to show
      if (
        savedSearchResults.length === 0 &&
        upcomingViewings.length === 0 &&
        (unreadMessageCount ?? 0) === 0
      ) {
        // Log suppression
        await supabase.from("email_logs").insert({
          user_id: userId,
          template: "weekly-digest",
          recipient: user.email,
          status: "suppressed",
          suppression_reason: "no_content",
        });
        skipped++;
        continue;
      }

      // Build digest data
      const digest: DigestData = {
        savedSearchResults,
        upcomingViewings,
        unreadMessageCount: unreadMessageCount ?? 0,
      };

      // Render HTML
      const html = buildWeeklyDigestHtml(
        user.first_name || "there",
        weekStarting,
        digest,
      );

      // Send email via Resend
      const { data, error: resendError } = await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: user.email,
        subject: `Your Weekly Property Digest — ${weekStarting}`,
        html,
      });

      if (resendError) {
        console.error(
          `[weekly-digest] Resend error for user ${userId}:`,
          resendError,
        );
        await supabase.from("email_logs").insert({
          user_id: userId,
          template: "weekly-digest",
          recipient: user.email,
          status: "failed",
          error_message: resendError.message,
        });
        errors++;
      } else {
        // Log successful send
        await supabase.from("email_logs").insert({
          user_id: userId,
          template: "weekly-digest",
          recipient: user.email,
          resend_id: data?.id,
          status: "sent",
        });
        sent++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[weekly-digest] Error processing user ${userId}:`, message);
      errors++;
    }
  }

  return { sent, skipped, errors };
}

Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const fromAddress =
      Deno.env.get("RESEND_FROM_ADDRESS") ?? "hello@britestate.co.uk";
    const fromName = Deno.env.get("RESEND_FROM_NAME") ?? "Britestate";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const resend = new Resend(resendApiKey);

    console.log("[weekly-digest] Starting weekly digest job");

    let offset = 0;
    let totalSent = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const allUserIds: string[] = [];

    // First pass: collect all active users
    while (true) {
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_deleted", false)
        .range(offset, offset + BATCH_SIZE - 1);

      if (usersError) {
        console.error("[weekly-digest] Error fetching users:", usersError);
        return new Response(
          JSON.stringify({
            processed: 0,
            sent: 0,
            skipped: 0,
            errors: [usersError.message],
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!users || users.length === 0) break;

      allUserIds.push(...users.map((u) => u.id));

      if (users.length < BATCH_SIZE) break;
      offset += BATCH_SIZE;
    }

    // Process users in smaller batches
    for (let i = 0; i < allUserIds.length; i += 10) {
      const batchUserIds = allUserIds.slice(
        i,
        Math.min(i + 10, allUserIds.length),
      );
      const batchResult = await processBatch(
        supabase,
        resend,
        batchUserIds,
        fromAddress,
        fromName,
      );
      totalSent += batchResult.sent;
      totalSkipped += batchResult.skipped;
      totalErrors += batchResult.errors;
    }

    const totalProcessed = totalSent + totalSkipped + totalErrors;
    console.log(
      `[weekly-digest] Complete. Processed: ${totalProcessed}, Sent: ${totalSent}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`,
    );

    return new Response(
      JSON.stringify({
        processed: totalProcessed,
        sent: totalSent,
        skipped: totalSkipped,
        errors: totalErrors,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[weekly-digest] Edge Function error:", message);
    return new Response(
      JSON.stringify({
        processed: 0,
        sent: 0,
        skipped: 0,
        errors: [message],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
