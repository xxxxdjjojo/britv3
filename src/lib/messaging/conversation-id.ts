/**
 * Conversation-id validation shared by the messaging action routes.
 *
 * `z.string().uuid()` (and z's newer `z.uuid()`) only accept RFC-4122
 * version 1-5 UUIDs. Postgres `uuid` columns accept any well-formed
 * 8-4-4-4-12 hex string, so some existing/seeded conversation ids (e.g. v7 or
 * all-zero variants) are valid in the database yet rejected by the stricter
 * Zod check — producing a spurious 400 on a real conversation.
 *
 * This regex matches exactly what Postgres accepts: any 8-4-4-4-12 hex shape.
 * Non-UUID input ("not-a-uuid", "", "123") still fails and still 400s.
 */
export const POSTGRES_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when `value` is a Postgres-valid UUID (any version). */
export function isPostgresUuid(value: string): boolean {
  return POSTGRES_UUID_REGEX.test(value);
}
