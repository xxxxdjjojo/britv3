/**
 * Organisation tenancy model types.
 * Backs the organisations / organisation_memberships tables introduced in
 * migration 20260619140000.
 */

export type OrganisationType = "estate_agency" | "trade_provider";

export type OrganisationVerificationStatus =
  | "unverified"
  | "pending_review"
  | "verified"
  | "suspended"
  | "rejected";

export type OrganisationRole = "owner" | "admin" | "member" | "viewer";

export type OrganisationMembershipStatus = "active" | "invited" | "inactive";

export type Organisation = {
  id: string;
  name: string;
  slug: string;
  org_type: OrganisationType;
  verification_status: OrganisationVerificationStatus;
  created_at: string;
  updated_at: string;
};

export type OrganisationMembership = {
  id: string;
  organisation_id: string;
  user_id: string;
  role: OrganisationRole;
  branch_id: string | null;
  status: OrganisationMembershipStatus;
  created_at: string;
  updated_at: string;
};

/** An organisation joined with the calling user's role in it. */
export type UserOrganisation = {
  organisation_id: string;
  name: string;
  slug: string;
  role: OrganisationRole;
};
