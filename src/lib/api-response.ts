import { NextResponse } from "next/server";

/**
 * Standardized API response helpers.
 *
 * Every API route should use these instead of raw NextResponse.json().
 * The frontend can rely on the error shape: { error: { code, message, fields? } }
 */

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

/** Return a success JSON response (default 200). */
export function apiSuccess<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/** Return a structured error response. */
export function apiError(
  message: string,
  code: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** 401 Unauthorized. */
export function apiUnauthorized(
  message = "Authentication required",
): NextResponse<ApiErrorBody> {
  return apiError(message, "UNAUTHORIZED", 401);
}

/** 403 Forbidden. */
export function apiForbidden(
  message = "You do not have permission to perform this action",
): NextResponse<ApiErrorBody> {
  return apiError(message, "FORBIDDEN", 403);
}

/** 404 Not Found. */
export function apiNotFound(resource = "Resource"): NextResponse<ApiErrorBody> {
  return apiError(`${resource} not found`, "NOT_FOUND", 404);
}

/** 400 Validation Error with per-field details. */
export function apiValidationError(
  fields: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message: "Validation failed", fields } },
    { status: 400 },
  );
}

/** 500 from a caught Supabase/DB error — logs internally, returns safe message. */
export function apiDatabaseError(
  error: unknown,
  context: string,
): NextResponse<ApiErrorBody> {
  console.error(`[${context}]`, error);
  return apiError(
    "A database error occurred. Please try again.",
    "DATABASE_ERROR",
    500,
  );
}
