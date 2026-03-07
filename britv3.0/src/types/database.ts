/**
 * Database types -- central re-export and Supabase type stubs.
 * The Database type will be replaced by Supabase-generated types
 * once `supabase gen types typescript` is available.
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

// -- Supabase type stubs ----------------------------------------------------

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

/**
 * Placeholder Database type. Will be replaced by the output of
 * `supabase gen types typescript --local` once the Supabase project
 * is connected.
 */
export type Database = {
  public: {
    Tables: {
      [K in TableName]: {
        Row: Tables[K];
        Insert: Partial<Tables[K]>;
        Update: Partial<Tables[K]>;
      };
    };
  };
};
