import * as Sentry from "@sentry/nextjs";

type CaptureContext = Readonly<{
  module: string;
  feature?: string;
  route?: string;
  operation?: string;
  correlationId?: string | null;
  tags?: Readonly<Record<string, string | number | boolean | null | undefined>>;
  extra?: Readonly<Record<string, unknown>>;
}>;

function removeUndefinedValues(
  input: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

export function captureException(error: unknown, context: CaptureContext): void {
  const normalizedError = error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    scope.setTag("module", context.module);

    if (context.feature) scope.setTag("feature", context.feature);
    if (context.route) scope.setTag("route", context.route);
    if (context.operation) scope.setTag("operation", context.operation);
    if (context.correlationId) scope.setTag("correlation_id", context.correlationId);

    for (const [key, value] of Object.entries(context.tags ?? {})) {
      if (value !== undefined && value !== null) {
        scope.setTag(key, String(value));
      }
    }

    if (context.extra) {
      scope.setExtras(removeUndefinedValues(context.extra));
    }

    Sentry.captureException(normalizedError);
  });
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
