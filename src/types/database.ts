/**
 * Database types -- central re-export and Supabase type stubs.
 * The Database type is generated from the live Supabase schema via:
 *   supabase gen types typescript --linked > src/types/database.types.ts
 */

// Re-export all domain types for convenience
export type {
  UserRole,
  VerificationLevel,
  VerificationStage,
  VerificationStatus,
  Profile,
  UserRoleRecord,
  ProviderVerification,
  AuthAuditLog,
} from "./auth";

export type {
  ConsentType,
  DeletionStatus,
  ConsentRecord,
  ConsentAuditLog,
  DeletionRequest,
} from "./gdpr";

// -- Supabase-generated database types --------------------------------------

// Supabase-generated database types — updated after each migration
export type { Database } from "./database.types";

import type { Database } from "./database.types";

// Convenience type aliases for the 10 v3.1 buyer dashboard tables
export type Viewing = Database["public"]["Tables"]["viewings"]["Row"];
export type ViewingSlot = Database["public"]["Tables"]["viewing_slots"]["Row"];
export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type OfferStatusHistory = Database["public"]["Tables"]["offer_status_history"]["Row"];
export type UserDocument = Database["public"]["Tables"]["user_documents"]["Row"];
export type AiMatchPreferences = Database["public"]["Tables"]["ai_match_preferences"]["Row"];
export type AiMatchResult = Database["public"]["Tables"]["ai_match_results"]["Row"];
export type MovingChecklistItem = Database["public"]["Tables"]["moving_checklist_items"]["Row"];
export type ReferralCode = Database["public"]["Tables"]["referral_codes"]["Row"];
export type ReferralConversion = Database["public"]["Tables"]["referral_conversions"]["Row"];

// -- Legacy Supabase type stubs (pre-migration) -----------------------------
// These remain for any code that imports from this module using the old types.

import type { Profile, UserRoleRecord, ProviderVerification, AuthAuditLog } from "./auth";
import type { ConsentRecord, ConsentAuditLog, DeletionRequest } from "./gdpr";

/**
 * Table name to row type mapping.
 * Used for generic data-fetching helpers.
 */
export type Tables = {
  profiles: Profile;
  user_roles: UserRoleRecord;
  provider_verifications: ProviderVerification;
  consent_records: ConsentRecord;
  consent_audit_log: ConsentAuditLog;
  auth_audit_log: AuthAuditLog;
  deletion_requests: DeletionRequest;
};

/** Table names as a union type */
export type TableName = keyof Tables;
