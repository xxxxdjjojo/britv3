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

  let result: unknown;
  let thrownError: unknown;

  try {
    result = await fn(ctx);
  } catch (e) {
    thrownError = e;
  } finally {
    await logAdminAction(ctx.supabase, {
      adminId: ctx.user.id,
      action,
      targetType,
      targetId,
    });
  }

  if (thrownError !== undefined) {
    const message =
      thrownError instanceof Error ? thrownError.message : "Action failed";
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json(result);
}
