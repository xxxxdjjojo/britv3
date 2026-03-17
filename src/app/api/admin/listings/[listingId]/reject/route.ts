import { auditedAdminAction } from "@/lib/audited-admin-action";
import { rejectListing } from "@/services/admin/listing-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;

  let reason: string | undefined;
  try {
    const body = (await req.json()) as { reason?: string };
    reason = body.reason;
  } catch {
    // reason is optional — continue without it
  }

  return auditedAdminAction(
    req,
    "listing.reject",
    "listing",
    listingId,
    async ({ supabase }) => {
      const result = await rejectListing(supabase, listingId, reason);
      if (!result.success) throw new Error("Failed to reject listing");
      return { success: true };
    },
  );
}
