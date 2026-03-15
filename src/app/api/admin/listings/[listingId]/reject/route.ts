import { auditedAdminAction } from "@/lib/audited-admin-action";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  return auditedAdminAction(
    req,
    "listing.reject",
    "listing",
    listingId,
    async ({ supabase }) => {
      const { error } = await supabase
        .from("properties")
        .update({ status: "rejected" })
        .eq("id", listingId);
      if (error) throw new Error("Failed to reject listing");
      return { success: true };
    },
  );
}
