/**
 * Organisation service.
 * Resolves a user's organisation membership and roles for the organisations
 * tenancy model (migration 20260619140000). All functions accept a Supabase
 * client as the first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  OrganisationMembership,
  OrganisationRole,
  UserOrganisation,
} from "@/types/organisation";

/**
 * Return the active organisation the user belongs to (with their role), or null.
 * A user has at most one active membership in the estate-agent vertical today;
 * if more exist this returns the most recently created.
 */
export async function getUserOrganisation(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserOrganisation | null> {
  const { data, error } = await supabase
    .from("organisation_memberships")
    .select("organisation_id, role, organisations(name, slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve user organisation: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  const org = (
    Array.isArray(row.organisations) ? row.organisations[0] : row.organisations
  ) as { name?: string; slug?: string } | null | undefined;

  // A membership without a resolvable organisation (FK gap / soft-deleted org)
  // is not a usable result — surface null rather than a blank-named org that
  // downstream authorisation/UI would treat as real.
  if (!org || !org.name || !org.slug) {
    return null;
  }

  return {
    organisation_id: String(row.organisation_id),
    name: org.name,
    slug: org.slug,
    role: String(row.role) as OrganisationRole,
  };
}

/**
 * List active members of an organisation. RLS restricts the result to callers
 * who are themselves members of the organisation.
 */
export async function getOrganisationMembers(
  supabase: SupabaseClient,
  organisationId: string,
): Promise<OrganisationMembership[]> {
  const { data, error } = await supabase
    .from("organisation_memberships")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load organisation members: ${error.message}`);
  }

  return (data ?? []) as OrganisationMembership[];
}

/**
 * Throw unless the user holds one of the given roles in the organisation.
 * Used to gate state-changing actions (connect, publish, disconnect).
 */
export async function assertOrgRole(
  supabase: SupabaseClient,
  userId: string,
  organisationId: string,
  roles: readonly OrganisationRole[],
): Promise<void> {
  const { data, error } = await supabase
    .from("organisation_memberships")
    .select("role")
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify organisation role: ${error.message}`);
  }

  const role = data ? String((data as { role: string }).role) : null;
  if (!role || !roles.includes(role as OrganisationRole)) {
    throw new Error(
      `User ${userId} lacks required role (${roles.join(", ")}) in organisation ${organisationId}`,
    );
  }
}
