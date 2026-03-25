import { adminOnly, type AdminContext, adminWithPermission, type AdminContextWithRole } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/admin-audit";
import type { AdminPermission } from "@/lib/admin-permissions";

export class AdminActionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminActionError";
  }
}

function extractIp(request: Request): string | undefined {
  const headers = request.headers;
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  );
}

export async function auditedAdminAction(
  request: Request,
  action: string,
  targetType: string,
  targetId: string,
  fn: (ctx: AdminContext) => Promise<unknown>,
): Promise<Response> {
  const ctx = await adminOnly(request);
  if (ctx instanceof Response) return ctx;

  const ipAddress = extractIp(request);
  let result: unknown;
  let thrownError: unknown;

  try {
    result = await fn(ctx);
  } catch (e) {
    thrownError = e;
  } finally {
    try {
      await logAdminAction(ctx.supabase, {
        adminId: ctx.user.id,
        action,
        targetType,
        targetId,
        ipAddress,
        success: thrownError === undefined,
        errorMessage:
          thrownError instanceof Error ? thrownError.message : undefined,
      });
    } catch (auditError) {
      console.error("[SECURITY] Audit log write failed for action:", action, "target:", targetId, auditError);
      // In production, this should alert ops (Sentry, PagerDuty, etc.)
    }
  }

  if (thrownError !== undefined) {
    if (thrownError instanceof AdminActionError) {
      return Response.json(
        { error: thrownError.message },
        { status: thrownError.status },
      );
    }
    const message =
      thrownError instanceof Error ? thrownError.message : "Action failed";
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json(result);
}

export async function auditedAdminActionWithPermission(
  request: Request,
  action: string,
  targetType: string,
  targetId: string,
  requiredPermission: AdminPermission,
  fn: (ctx: AdminContextWithRole) => Promise<unknown>,
): Promise<Response> {
  const ctx = await adminWithPermission(request, requiredPermission);
  if (ctx instanceof Response) return ctx;

  const ipAddress = extractIp(request);
  let result: unknown;
  let thrownError: unknown;

  try {
    result = await fn(ctx);
  } catch (e) {
    thrownError = e;
  } finally {
    try {
      await logAdminAction(ctx.supabase, {
        adminId: ctx.user.id,
        action,
        targetType,
        targetId,
        ipAddress,
        success: thrownError === undefined,
        errorMessage:
          thrownError instanceof Error ? thrownError.message : undefined,
      });
    } catch (auditError) {
      console.error("[SECURITY] Audit log write failed for action:", action, "target:", targetId, auditError);
      // In production, this should alert ops (Sentry, PagerDuty, etc.)
    }
  }

  if (thrownError !== undefined) {
    if (thrownError instanceof AdminActionError) {
      return Response.json(
        { error: thrownError.message },
        { status: thrownError.status },
      );
    }
    const message =
      thrownError instanceof Error ? thrownError.message : "Action failed";
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json(result);
}
