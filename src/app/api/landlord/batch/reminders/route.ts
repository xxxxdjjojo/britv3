import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendRentReminder } from "@/services/email/email-service";

type ReminderProperty = { address_line1: string | null; city: string | null };

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
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const result: BatchResult = { sent: [], failed: [] };

  for (const tenancyId of parsed.data.tenant_ids) {
    try {
      // Verify ownership via RLS — landlord_id must match
      const { data: tenancy, error } = await supabase
        .from("tenancies")
        .select(
          "id, tenant_name, tenant_email, rent_amount, rent_frequency, property:properties!inner(address_line1, city)",
        )
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

      // Supabase types a joined relation as an array; take the first row.
      const property = (Array.isArray(tenancy.property)
        ? tenancy.property[0]
        : tenancy.property) as ReminderProperty | null;
      const propertyAddress = [property?.address_line1, property?.city]
        .filter(Boolean)
        .join(", ") || "your property";
      const rentFrequency = tenancy.rent_frequency === "weekly" ? "weekly" : "monthly";

      // Send the rent reminder email via Resend.
      await sendRentReminder({
        userId: user.id,
        email: tenancy.tenant_email,
        tenantName: tenancy.tenant_name,
        propertyAddress,
        rentAmount: Number(tenancy.rent_amount),
        rentFrequency,
        dueDate: new Date().toISOString(),
      });

      // Keep an in-app audit record so the landlord's notification feed reflects the send.
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "rent_reminder",
        title: `Rent reminder sent to ${tenancy.tenant_name}`,
        body: `Rent reminder sent to ${tenancy.tenant_name} at ${tenancy.tenant_email}`,
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
