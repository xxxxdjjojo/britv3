/**
 * /api/admin/placement-products
 *
 * GET  — full pricing catalogue (all statuses).
 * POST — create a new admin-configured placement product.
 */

import { adminWithPermission } from "@/lib/admin-guard";
import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { createProduct, listAllProducts, type ProductInput } from "@/services/placements/placement-admin-service";

export async function GET(request: Request) {
  const ctx = await adminWithPermission(request, "manage_subscriptions");
  if (ctx instanceof Response) return ctx;
  try {
    const products = await listAllProducts(ctx.supabase);
    return Response.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: ProductInput;
  try {
    body = (await request.json()) as ProductInput;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    request,
    "placement_product.create",
    "placement_product",
    "new",
    "manage_subscriptions",
    async ({ supabase }) => {
      if (!body.name?.trim()) throw new Error("Name is required");
      if (!body.placement_type) throw new Error("Placement type is required");
      if (body.monthly_price_pence == null || body.monthly_price_pence < 0) {
        throw new Error("Monthly price must be zero or more");
      }
      return createProduct(supabase, body);
    },
  );
}
