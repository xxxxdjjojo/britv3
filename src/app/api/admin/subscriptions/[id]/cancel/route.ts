import { auditedAdminAction } from "@/lib/audited-admin-action";
import { cancelSubscription } from "@/services/admin/subscription-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return auditedAdminAction(
    req,
    "subscription.cancel",
    "subscription",
    id,
    async ({ supabase }) => {
      const result = await cancelSubscription(supabase, id);
      if (!result.success) throw new Error("Failed to cancel subscription");
      return { cancelled: true, subscriptionId: id };
    },
  );
}
