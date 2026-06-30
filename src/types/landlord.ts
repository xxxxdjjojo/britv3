/**
 * Landlord domain types -- mirrors the database schema in
 * 20260307_epic7_property_management.sql.
 * All field names and constraints match the SQL exactly.
 */

import { z } from "zod";

// -- Enum constants (mirror SQL enums) ----------------------------------------

export const TENANCY_STATUSES = [
  "active",
  "ending_soon",
  "ended",
  "terminated",
] as const;
export type TenancyStatus = (typeof TENANCY_STATUSES)[number];

export const MAINTENANCE_STATUSES = [
  "new",
  "acknowledged",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const MAINTENANCE_PRIORITIES = [
  "low",
  "medium",
  "high",
  "emergency",
] as const;
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export const FINANCIAL_ENTRY_TYPES = ["income", "expense"] as const;
export type FinancialEntryType = (typeof FINANCIAL_ENTRY_TYPES)[number];

export const DOCUMENT_CATEGORIES = [
  "gas_safety",
  "electrical_eicr",
  "epc",
  "insurance",
  "lease_agreement",
  "inventory",
  "inspection_report",
  "receipt",
  "other",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

// -- Financial categories -----------------------------------------------------

export const INCOME_CATEGORIES = [
  "rent",
  "deposit",
  "other_income",
] as const;
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export const EXPENSE_CATEGORIES = [
  "maintenance",
  "insurance",
  "service_charge",
  "ground_rent",
  "mortgage",
  "management_fee",
  "other_expense",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const ALL_FINANCIAL_CATEGORIES = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
] as const;

// -- Rent frequency -----------------------------------------------------------

export const RENT_FREQUENCIES = ["weekly", "monthly"] as const;
export type RentFrequency = (typeof RENT_FREQUENCIES)[number];

// -- Table row types ----------------------------------------------------------

/** Mirrors public.tenancies table */
export type Tenancy = Readonly<{
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone: string | null;
  tenant_user_id: string | null;
  status: TenancyStatus;
  lease_start_date: string;
  lease_end_date: string | null;
  rent_amount: number;
  rent_frequency: RentFrequency;
  deposit_amount: number | null;
  deposit_scheme: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

/** Mirrors public.maintenance_requests table */
export type MaintenanceRequest = Readonly<{
  id: string;
  property_id: string;
  tenancy_id: string | null;
  reported_by: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assigned_provider_id: string | null;
  assigned_provider_name: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}>;

/** Mirrors public.financial_entries table */
export type FinancialEntry = Readonly<{
  id: string;
  property_id: string;
  tenancy_id: string | null;
  user_id: string;
  type: FinancialEntryType;
  category: string;
  amount: number;
  entry_date: string;
  description: string | null;
  receipt_url: string | null;
  rent_period_start: string | null;
  rent_period_end: string | null;
  payment_status: "paid" | "partial" | "overdue" | null;
  created_at: string;
}>;

/** Mirrors public.property_documents table */
export type PropertyDocument = Readonly<{
  id: string;
  property_id: string;
  tenancy_id: string | null;
  uploaded_by: string;
  name: string;
  category: DocumentCategory;
  file_url: string;
  file_size: number | null;
  expiry_date: string | null;
  next_reminder_date: string | null;
  reminder_sent: boolean;
  created_at: string;
}>;

/** Return type of get_property_financial_summary RPC */
export type PropertyFinancialSummary = Readonly<{
  total_income: number;
  total_expenses: number;
  net_income: number;
  entry_count: number;
}>;

// -- Zod schemas for form validation ------------------------------------------

export const tenancySchema = z.object({
  tenant_name: z.string().min(1, "Tenant name is required"),
  tenant_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  tenant_phone: z.string().optional().or(z.literal("")),
  lease_start_date: z.string().min(1, "Lease start date is required"),
  lease_end_date: z.string().optional().or(z.literal("")),
  rent_amount: z.coerce
    .number()
    .positive("Rent amount must be positive"),
  rent_frequency: z.enum(RENT_FREQUENCIES).default("monthly"),
  deposit_amount: z.coerce.number().nonnegative().optional(),
  deposit_scheme: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const maintenanceRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be 2000 characters or fewer"),
  priority: z.enum(MAINTENANCE_PRIORITIES).default("medium"),
});

export const financialEntrySchema = z.object({
  type: z.enum(FINANCIAL_ENTRY_TYPES),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  entry_date: z.string().min(1, "Date is required"),
  description: z.string().optional().or(z.literal("")),
  rent_period_start: z.string().optional().or(z.literal("")),
  rent_period_end: z.string().optional().or(z.literal("")),
});

export const documentUploadSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  category: z.enum(DOCUMENT_CATEGORIES),
  expiry_date: z.string().optional().or(z.literal("")),
});

// -- Inferred form types from Zod schemas -------------------------------------

export type TenancyFormData = z.infer<typeof tenancySchema>;
export type MaintenanceRequestFormData = z.input<typeof maintenanceRequestSchema>;
export type FinancialEntryFormData = z.infer<typeof financialEntrySchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

// -- Phase 14 new types (tenant applications, deposits, inventory, notices) ---

export type TenantApplicationStatus =
  | "received"
  | "shortlisted"
  | "referencing"
  | "approved"
  | "rejected"
  | "withdrawn";

export type CreditCheckStatus = "pending" | "passed" | "failed" | "not_run";
export type ReferencesStatus = "pending" | "received" | "verified";
export type DepositScheme = "TDS" | "DPS" | "mydeposits" | "other";
export type DepositStatus = "pending" | "registered" | "returned" | "disputed";
export type InventoryType = "check_in" | "check_out";
export type NoticeType = "section_21" | "section_8";
export type NoticeStatus = "draft" | "generated" | "served";

export type TenantApplication = {
  id: string;
  property_id: string;
  landlord_id: string;
  applicant_user_id: string | null;
  applicant_name: string;
  applicant_email: string;
  status: TenantApplicationStatus;
  monthly_income: number | null;
  employment_status: string | null;
  credit_check_status: CreditCheckStatus | null;
  references_status: ReferencesStatus | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type DepositRegistration = {
  id: string;
  tenancy_id: string;
  amount: number;
  scheme: DepositScheme;
  scheme_reference: string | null;
  registration_date: string | null;
  prescribed_info_sent_date: string | null;
  status: DepositStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryReport = {
  id: string;
  property_id: string;
  tenancy_id: string | null;
  landlord_id: string;
  type: InventoryType;
  status: "draft" | "complete" | "signed";
  rooms: Array<{ name: string; condition: string; notes: string }>;
  notes: string | null;
  photo_urls: string[];
  completed_at: string | null;
  created_at: string;
};

export type LegalNotice = {
  id: string;
  property_id: string;
  tenancy_id: string | null;
  landlord_id: string;
  notice_type: NoticeType;
  possession_date: string | null;
  deposit_scheme_reference: string | null;
  epc_provided: boolean | null;
  gas_safety_provided: boolean | null;
  grounds: string[] | null;
  arrears_amount: number | null;
  served_date: string | null;
  pdf_storage_path: string | null;
  status: NoticeStatus;
  created_at: string;
};

export type PortfolioKPIs = {
  total_properties: number;
  occupied: number;
  vacant: number;
  occupancy_rate: number;
  total_monthly_rent: number;
  compliance_alerts: number;
  open_maintenance: number;
  expired_compliance: number;
};

export type RentCollectionEntry = {
  entry: FinancialEntry;
  tenant_name: string;
  property_address: string;
};

export type RentCollectionGroup = {
  paid: RentCollectionEntry[];
  partial: RentCollectionEntry[];
  overdue: RentCollectionEntry[];
};

export type TaxSummary = {
  income: number;
  expenses: number;
  net: number;
  tax_year: string; // e.g. "2025/26"
};

export type ComplianceStatus = "expired" | "expiring_soon" | "valid";

export type ComplianceDocument = {
  id: string;
  category: string;
  expiry_date: string;
  status: ComplianceStatus;
  property: { address_line_1: string; city: string; postcode: string };
};
