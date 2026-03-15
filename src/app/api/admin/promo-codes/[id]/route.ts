import { auditedAdminAction } from "@/lib/audited-admin-action";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return auditedAdminAction(
    req,
    "promo_code.delete",
    "promo_code",
    id,
    async ({ supabase }) => {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
      return { deleted: true, id };
    },
  );
}
