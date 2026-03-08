/**
 * GDPR domain types -- mirrors the consent and deletion tables
 * in 001_foundation.sql.
 */

// -- Enum types -------------------------------------------------------------

export type ConsentType = "marketing" | "analytics" | "third_party";

export type DeletionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled";

// -- Table row types --------------------------------------------------------

/** Mirrors public.consent_records table */
export type ConsentRecord = Readonly<{
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
}>;

/** Mirrors public.consent_audit_log table */
export type ConsentAuditLog = Readonly<{
  id: number;
  user_id: string;
  consent_type: string;
  old_value: boolean | null;
  new_value: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}>;

/** Mirrors public.deletion_requests table */
export type DeletionRequest = Readonly<{
  id: string;
  user_id: string;
  requested_at: Date;
  scheduled_purge_at: Date;
  purged_at: Date | null;
  status: DeletionStatus;
}>;
