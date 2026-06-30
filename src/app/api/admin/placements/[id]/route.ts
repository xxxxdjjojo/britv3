/**
 * PATCH /api/admin/placements/[id]
 *
 * Moderate a placement: approve, reject (with reason), pause, resume, feature
 * (manual pin), or override its ranking priority. Audited.
 */

import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { reviewPlacement, type ReviewAction } from "@/services/placements/placement-admin-service";

type Body =
  | { action: "approve" }
  | { action: "reject"; reason?: string }
  | { action: "pause" }
  | { action: "resume" }
  | { action: "feature"; featured: boolean }
  | { action: "override"; priority: number | null };

function toReviewAction(body: Body): ReviewAction {
  switch (body.action) {
    case "reject":
      return { type: "reject", reason: body.reason?.trim() || "Rejected by admin" };
    case "feature":
      return { type: "feature", featured: Boolean(body.featured) };
    case "override":
      return { type: "override", priority: body.priority ?? null };
    case "approve":
    case "pause":
    case "resume":
      return { type: body.action };
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    request,
    `placement.${body.action}`,
    "sponsored_placement",
    id,
    "manage_subscriptions",
    async ({ supabase }) => {
      await reviewPlacement(supabase, id, toReviewAction(body));
      return { ok: true };
    },
  );
}
