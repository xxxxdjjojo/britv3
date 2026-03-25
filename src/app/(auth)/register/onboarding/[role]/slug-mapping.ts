import type { UserRole } from "@/types/auth";

export const VALID_ROLES: UserRole[] = [
  "homebuyer",
  "renter",
  "seller",
  "landlord",
  "agent",
  "service_provider",
  "mortgage_broker",
];

export const SLUG_TO_ROLE: Record<string, UserRole> = {
  broker: "mortgage_broker",
  provider: "service_provider",
};

/**
 * Resolves a URL slug (e.g. "broker") to its canonical UserRole
 * (e.g. "mortgage_broker"). Slugs that are already canonical role names
 * are returned unchanged.
 */
export function resolveRoleSlug(slug: string): UserRole | null {
  const resolved = SLUG_TO_ROLE[slug] ?? slug;
  if (VALID_ROLES.includes(resolved as UserRole)) {
    return resolved as UserRole;
  }
  return null;
}
