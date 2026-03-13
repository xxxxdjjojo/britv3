/**
 * Supabase Edge Function: compliance-reminders
 *
 * Runs daily via pg_cron at 9 AM UTC.
 * Queries documents due for compliance reminders and creates
 * in-app notifications for landlords.
 *
 * Uses service role client to bypass RLS (system-level operation).
 */

// @ts-expect-error -- Deno runtime types not available in Node TS config
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared logic -- at build/deploy time, this path is resolved.
// For local development, the logic is inlined below as a fallback.

type ReminderType = "30-day" | "7-day" | "expired";

interface DocumentDueForReminder {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  category: string;
  expiry_date: string;
  next_reminder_date: string;
  reminder_sent: boolean;
}

function calculateReminderType(daysUntilExpiry: number): ReminderType {
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 14) return "7-day";
  return "30-day";
}

function calculateNextReminderDate(
  expiryDate: string,
  reminderType: ReminderType,
): string | null {
  if (reminderType !== "30-day") return null;
  const expiry = new Date(expiryDate);
  expiry.setDate(expiry.getDate() - 7);
  return expiry.toISOString().split("T")[0];
}

Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Call the RPC function that returns documents due for reminders
    const { data: documents, error: rpcError } = await supabase.rpc(
      "get_documents_due_for_reminder",
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return new Response(
        JSON.stringify({ processed: 0, errors: [rpcError.message] }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, errors: [] }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let processed = 0;
    const errors: string[] = [];

    for (const doc of documents as DocumentDueForReminder[]) {
      try {
        const expiry = new Date(doc.expiry_date);
        const diffMs = expiry.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        const reminderType = calculateReminderType(daysUntilExpiry);
        const nextReminderDate = calculateNextReminderDate(
          doc.expiry_date,
          reminderType,
        );

        // Build notification content
        const title =
          reminderType === "expired"
            ? `${doc.name} has expired`
            : `${doc.name} expiring in ${daysUntilExpiry} days`;

        const message = `Your ${doc.category} document '${doc.name}' for property ${doc.property_id} expires on ${doc.expiry_date}. Please renew it promptly.`;

        const link = `/dashboard/landlord/properties/${doc.property_id}/documents`;

        // Guard against duplicate notifications
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", doc.user_id)
          .eq("type", "compliance_reminder")
          .eq("link", link)
          .ilike("title", `%${doc.name}%`)
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          )
          .limit(1);

        if (existing && existing.length > 0) {
          // Skip -- notification already sent within last 24 hours
          continue;
        }

        // Insert notification
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: doc.user_id,
            type: "compliance_reminder",
            title,
            message,
            link,
          });

        if (notifError) {
          errors.push(
            `Notification insert failed for doc ${doc.id}: ${notifError.message}`,
          );
          continue;
        }

        // Update document record
        const updateData: Record<string, unknown> = {};

        if (reminderType === "30-day") {
          // Set next reminder to 7 days before expiry
          updateData.next_reminder_date = nextReminderDate;
          updateData.reminder_sent = false;
        } else {
          // 7-day or expired: mark as sent, no more reminders
          updateData.reminder_sent = true;
          updateData.next_reminder_date = null;
        }

        const { error: updateError } = await supabase
          .from("property_documents")
          .update(updateData)
          .eq("id", doc.id);

        if (updateError) {
          errors.push(
            `Document update failed for doc ${doc.id}: ${updateError.message}`,
          );
          continue;
        }

        processed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Failed to process doc ${doc.id}: ${message}`);
        // Continue processing other documents
      }
    }

    return new Response(
      JSON.stringify({ processed, errors }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Edge Function error:", message);
    return new Response(
      JSON.stringify({ processed: 0, errors: [message] }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
