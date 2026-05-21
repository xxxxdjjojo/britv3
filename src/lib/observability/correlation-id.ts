export const CORRELATION_ID_HEADER = "x-correlation-id";

const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

export function getCorrelationId(headers: Headers): string {
  const existing =
    headers.get(CORRELATION_ID_HEADER) ?? headers.get("x-request-id");

  if (existing && CORRELATION_ID_PATTERN.test(existing)) {
    return existing;
  }

  return crypto.randomUUID();
}
