import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const batchRemindersSchema = z.object({
  tenant_ids: z
    .array(z.string().uuid())
    .min(1, "At least one tenant required")
    .max(10, "Maximum 10 tenants per batch"),
});

type BatchResult = {
  sent: string[];
  failed: Array<{ id: string; reason: string }>;
};

/**
 * POST /api/landlord/batch/reminders
 * Send rent reminders to multiple tenants.
 * Max 10 per request. Verifies ownership of each tenancy.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = batchRemindersSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }

  const result: BatchResult = { sent: [], failed: [] };

  for (const tenancyId of parsed.data.tenant_ids) {
    try {
      // Verify ownership via RLS — landlord_id must match
      const { data: tenancy, error } = await supabase
        .from("tenancies")
        .select("id, tenant_name, tenant_email")
        .eq("id", tenancyId)
        .eq("landlord_id", user.id)
        .single();

      if (error || !tenancy) {
        result.failed.push({ id: tenancyId, reason: "Tenancy not found or not owned" });
        continue;
      }

      if (!tenancy.tenant_email) {
        result.failed.push({ id: tenancyId, reason: "No email address for tenant" });
        continue;
      }

      // TODO: Send actual email via Resend when email service is integrated
      // For now, create a notification record
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "rent_reminder",
        title: `Rent reminder sent to ${tenancy.tenant_name}`,
        message: `Rent reminder sent to ${tenancy.tenant_name} at ${tenancy.tenant_email}`,
        link: "/dashboard/landlord/rent",
      });

      result.sent.push(tenancyId);
    } catch {
      result.failed.push({ id: tenancyId, reason: "Unexpected error" });
    }
  }

  console.info("[posthog] landlord_batch_reminder_sent", {
    count: parsed.data.tenant_ids.length,
    success_count: result.sent.length,
    failure_count: result.failed.length,
  });

  return NextResponse.json(result);
}
