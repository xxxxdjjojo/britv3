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
export type MaintenanceRequestFormData = z.infer<typeof maintenanceRequestSchema>;
export type FinancialEntryFormData = z.infer<typeof financialEntrySchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
