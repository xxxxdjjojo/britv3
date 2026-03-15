import { auditedAdminAction } from "@/lib/audited-admin-action";
import { flagListing } from "@/services/admin/listing-service";

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
    "listing.flag",
    "listing",
    listingId,
    async ({ supabase }) => {
      const result = await flagListing(supabase, listingId, reason);
      if (!result.success) throw new Error("Failed to flag listing");
      return { success: true };
    },
  );
}
