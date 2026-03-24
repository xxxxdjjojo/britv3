import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  return auditedAdminActionWithPermission(
    req,
    "listing.approve",
    "listing",
    listingId,
    "moderate_listings",
    async ({ supabase }) => {
      const { error } = await supabase
        .from("properties")
        .update({ status: "active" })
        .eq("id", listingId);
      if (error) throw new Error("Failed to approve listing");
      return { success: true };
    },
  );
}
