import { adminOnly, type AdminContext } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/admin-audit";

export async function auditedAdminAction(
  request: Request,
  action: string,
  targetType: string,
  targetId: string,
  fn: (ctx: AdminContext) => Promise<unknown>,
): Promise<Response> {
  const ctx = await adminOnly(request);
  if (ctx instanceof Response) return ctx;

  try {
    const result = await fn(ctx);
    return Response.json(result);
  } finally {
    // Always logs, even if fn throws
    await logAdminAction(ctx.supabase, {
      adminId: ctx.user.id,
      action,
      targetType,
      targetId,
    });
  }
}
