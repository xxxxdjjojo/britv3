/**
 * Financial service -- income/expense CRUD, receipt upload,
 * and RPC-based financial summary for landlord properties.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialEntry, PropertyFinancialSummary, RentCollectionGroup, TaxSummary } from "@/types/landlord";
import { financialEntrySchema } from "@/types/landlord";
import { validateFileType } from "@/lib/file-validation";
import { compressReceipt } from "@/lib/image-compression";

// -- Filter types -------------------------------------------------------------

type FinancialFilters = Readonly<{
  type?: "income" | "expense";
  category?: string;
  dateRange?: { start: string; end: string };
}>;

// -- Service functions --------------------------------------------------------

/**
 * List financial entries for a property, with optional type/category/date filters.
 * Ordered by entry_date DESC (newest first).
 */
export async function getFinancialEntries(
  supabase: SupabaseClient,
  propertyId: string,
  filters?: FinancialFilters,
): Promise<FinancialEntry[]> {
  let query = supabase
    .from("financial_entries")
    .select("*")
    .eq("property_id", propertyId)
    .order("entry_date", { ascending: false });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.dateRange) {
    query = query
      .gte("entry_date", filters.dateRange.start)
      .lte("entry_date", filters.dateRange.end);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch financial entries: ${error.message}`);
  }

  return (data ?? []) as FinancialEntry[];
}

/**
 * Create a new financial entry for a property.
 * Validates input with Zod schema. Sets user_id from the authenticated user.
 * For rent income entries, also sets tenancy_id and rent period dates.
 */
export async function createFinancialEntry(
  supabase: SupabaseClient,
  propertyId: string,
  data: {
    type: string;
    category: string;
    amount: number;
    entry_date: string;
    description?: string;
    tenancy_id?: string;
    rent_period_start?: string;
    rent_period_end?: string;
  },
): Promise<FinancialEntry> {
  // Validate with Zod
  const parsed = financialEntrySchema.parse({
    type: data.type,
    category: data.category,
    amount: data.amount,
    entry_date: data.entry_date,
    description: data.description ?? "",
    rent_period_start: data.rent_period_start ?? "",
    rent_period_end: data.rent_period_end ?? "",
  });

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Build insert payload
  const insertData: Record<string, unknown> = {
    property_id: propertyId,
    user_id: user.id,
    type: parsed.type,
    category: parsed.category,
    amount: parsed.amount,
    entry_date: parsed.entry_date,
    description: parsed.description || null,
  };

  // Set rent-specific fields for rent income
  if (parsed.type === "income" && parsed.category === "rent") {
    if (data.tenancy_id) insertData.tenancy_id = data.tenancy_id;
    if (parsed.rent_period_start) insertData.rent_period_start = parsed.rent_period_start;
    if (parsed.rent_period_end) insertData.rent_period_end = parsed.rent_period_end;
  }

  const { data: record, error } = await supabase
    .from("financial_entries")
    .insert(insertData)
    .select()
    .single();

  if (error || !record) {
    throw new Error(
      `Failed to create financial entry: ${error?.message ?? "no data"}`,
    );
  }

  return record as FinancialEntry;
}

/**
 * Get financial summary for a property over a date range.
 * Uses the get_property_financial_summary RPC function for server-side aggregation.
 */
export async function getFinancialSummary(
  supabase: SupabaseClient,
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<PropertyFinancialSummary> {
  const { data, error } = await supabase.rpc("get_property_financial_summary", {
    p_property_id: propertyId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    throw new Error(`Failed to fetch financial summary: ${error.message}`);
  }

  // RPC returns a single row or array with one element
  const result = Array.isArray(data) ? data[0] : data;

  return {
    total_income: result?.total_income ?? 0,
    total_expenses: result?.total_expenses ?? 0,
    net_income: result?.net_income ?? 0,
    entry_count: result?.entry_count ?? 0,
  };
}

/**
 * Upload a receipt for a financial entry.
 * Validates file type (PDF, JPG, PNG only) and compresses images.
 * Uploads to Supabase Storage 'expense-receipts' bucket.
 */
export async function uploadReceipt(
  supabase: SupabaseClient,
  propertyId: string,
  entryId: string,
  file: File,
): Promise<string> {
  // Validate file type
  const validation = await validateFileType(file);
  if (!validation.valid) {
    throw new Error("Only PDF, JPEG, and PNG files are allowed");
  }

  // Compress images (PDFs pass through unchanged)
  const processed = await compressReceipt(file);

  // Upload to storage
  const filePath = `${propertyId}/${entryId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("expense-receipts")
    .upload(filePath, processed, {
      contentType: validation.mimeType!,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload receipt: ${uploadError.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("expense-receipts").getPublicUrl(filePath);

  // Update receipt_url on the financial entry
  const { error: updateError } = await supabase
    .from("financial_entries")
    .update({ receipt_url: publicUrl })
    .eq("id", entryId);

  if (updateError) {
    throw new Error(`Failed to update receipt URL: ${updateError.message}`);
  }

  return publicUrl;
}

/**
 * Get rent payments for a specific tenancy.
 * Returns financial entries where tenancy_id matches, type=income, category=rent.
 * Used by RentStatusIndicator to derive payment status.
 */
export async function getRentPaymentsForTenancy(
  supabase: SupabaseClient,
  tenancyId: string,
): Promise<FinancialEntry[]> {
  const { data, error } = await supabase
    .from("financial_entries")
    .select("*")
    .eq("tenancy_id", tenancyId)
    .eq("type", "income")
    .eq("category", "rent")
    .order("entry_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch rent payments: ${error.message}`);
  }

  return (data ?? []) as FinancialEntry[];
}

// -- Phase 14 additions -------------------------------------------------------

/**
 * Fetch rent collection grouped by payment_status for the authenticated landlord.
 * Queries financial_entries WHERE category = 'rent' (not the tenancies table).
 * Groups entries as paid / partial / overdue.
 */
export async function getRentCollection(
  supabase: SupabaseClient,
  propertyId?: string,
): Promise<RentCollectionGroup> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  let query = supabase
    .from("financial_entries")
    .select("*")
    .eq("category", "rent")
    .order("entry_date", { ascending: false });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch rent collection: ${error.message}`);
  }

  const entries = (data ?? []) as FinancialEntry[];

  const result: RentCollectionGroup = { paid: [], partial: [], overdue: [] };

  for (const entry of entries) {
    const item = {
      entry,
      tenant_name: "",
      property_address: "",
    };

    const status = entry.payment_status;
    if (status === "paid") {
      result.paid.push(item);
    } else if (status === "partial") {
      result.partial.push(item);
    } else if (status === "overdue") {
      result.overdue.push(item);
    }
  }

  return result;
}

/**
 * Fetch tax summary for a UK tax year (Apr 6 – Apr 5).
 * taxYear: the year the tax year starts in (e.g., 2025 means Apr 6 2025 – Apr 5 2026).
 */
export async function getTaxSummary(
  supabase: SupabaseClient,
  taxYear: number,
): Promise<TaxSummary> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const startDate = `${taxYear}-04-06`;
  const endDate = `${taxYear + 1}-04-06`; // exclusive upper bound

  const { data, error } = await supabase
    .from("financial_entries")
    .select("*")
    .gte("entry_date", startDate)
    .lt("entry_date", endDate)
    .order("entry_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tax summary: ${error.message}`);
  }

  const entries = (data ?? []) as FinancialEntry[];

  let income = 0;
  let expenses = 0;

  for (const entry of entries) {
    if (entry.type === "income") {
      income += entry.amount;
    } else if (entry.type === "expense") {
      expenses += entry.amount;
    }
  }

  return {
    income,
    expenses,
    net: income - expenses,
    tax_year: `${taxYear}/${String(taxYear + 1).slice(2)}`,
  };
}

// -- Period preset helpers ----------------------------------------------------

/**
 * Resolves a period preset name into a start/end date range.
 */
export function resolvePeriodPreset(
  preset: string,
): { start: string; end: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case "this_month": {
      const start = new Date(year, month, 1).toISOString().slice(0, 10);
      return { start, end: today };
    }
    case "this_quarter": {
      const quarterStart = Math.floor(month / 3) * 3;
      const start = new Date(year, quarterStart, 1).toISOString().slice(0, 10);
      return { start, end: today };
    }
    case "ytd": {
      const start = new Date(year, 0, 1).toISOString().slice(0, 10);
      return { start, end: today };
    }
    case "last_12_months": {
      const past = new Date(year, month - 12, now.getDate());
      const start = past.toISOString().slice(0, 10);
      return { start, end: today };
    }
    default:
      // Default to current month
      return {
        start: new Date(year, month, 1).toISOString().slice(0, 10),
        end: today,
      };
  }
}
