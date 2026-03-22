/**
 * Auth domain types -- mirrors the database schema in 001_foundation.sql.
 * All field names and constraints match the SQL exactly.
 */

// -- Enum types (mirror SQL enums) ------------------------------------------

export type UserRole =
  | "homebuyer"
  | "renter"
  | "seller"
  | "landlord"
  | "agent"
  | "service_provider"
  | "mortgage_broker";

export type VerificationLevel =
  | "basic"
  | "standard"
  | "enhanced"
  | "professional";

export type VerificationStage =
  | "email"
  | "phone"
  | "identity"
  | "insurance"
  | "qualifications"
  | "admin_review"
  | "companies_house"
  | "hmrc_aml"
  | "professional_body"
  | "kyc";

export type EntityType = "ltd_company" | "sole_trader";

export type VerificationStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected";

// -- Table row types --------------------------------------------------------

/** Mirrors public.profiles table */
export type Profile = Readonly<{
  id: string;
  display_name: string | null;
  active_role: UserRole;
  verification_level: VerificationLevel;
  avatar_url: string | null;
  phone: string | null;
  phone_verified: boolean;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}>;

/** Mirrors public.user_roles junction table */
export type UserRoleRecord = Readonly<{
  id: string;
  user_id: string;
  role: UserRole;
  granted_at: Date;
}>;

/** Mirrors public.provider_verifications table */
export type ProviderVerification = Readonly<{
  id: string;
  user_id: string;
  stage: VerificationStage;
  status: VerificationStatus;
  document_url: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}>;

/** Mirrors public.auth_audit_log table */
export type AuthAuditLog = Readonly<{
  id: number;
  user_id: string | null;
  event_type: string;
  event_details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}>;
