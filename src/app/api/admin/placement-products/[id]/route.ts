/**
 * PATCH /api/admin/placement-products/[id]
 *
 * Update an admin-configured placement product (price, slots, status, launch
 * discount, targeting). Audited.
 */

import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { updateProduct, type ProductInput } from "@/services/placements/placement-admin-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Partial<ProductInput>;
  try {
    body = (await request.json()) as Partial<ProductInput>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    request,
    "placement_product.update",
    "placement_product",
    id,
    "manage_subscriptions",
    async ({ supabase }) => {
      await updateProduct(supabase, id, body);
      return { ok: true };
    },
  );
}
