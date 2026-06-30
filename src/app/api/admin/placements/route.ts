/**
 * GET /api/admin/placements
 *
 * All sponsored placements (optionally filtered by status) plus the current
 * monthly recurring advertising revenue. Requires the manage_subscriptions
 * admin permission.
 */

import { adminWithPermission } from "@/lib/admin-guard";
import { getActiveRevenuePence, listAllPlacements } from "@/services/placements/placement-admin-service";
import type { PlacementStatus } from "@/types/sponsored-placements";

const STATUSES: PlacementStatus[] = ["pending_review", "active", "paused", "cancelled", "rejected", "expired"];

export async function GET(request: Request) {
  const ctx = await adminWithPermission(request, "manage_subscriptions");
  if (ctx instanceof Response) return ctx;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status = STATUSES.includes(statusParam as PlacementStatus) ? (statusParam as PlacementStatus) : undefined;

  try {
    const [placements, revenuePence] = await Promise.all([
      listAllPlacements(ctx.supabase, status ? { status } : undefined),
      getActiveRevenuePence(ctx.supabase),
    ]);
    return Response.json({ placements, revenuePence });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load placements";
    return Response.json({ error: message }, { status: 500 });
  }
}
