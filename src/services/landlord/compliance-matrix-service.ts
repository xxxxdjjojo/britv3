/**
 * Compliance matrix service — fetches and transforms the matrix RPC data.
 *
 * MATRIX DATA FLOW:
 *   Supabase RPC (get_compliance_matrix)
 *       │ returns: [{ property_id, category, status, expiry_date, ... }]
 *       ▼
 *   groupByProperty() — groups rows into per-property objects
 *       │
 *       ▼
 *   MatrixData = { properties: PropertyRow[], categories: string[] }
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type MatrixCell = Readonly<{
  category: string;
  status: "valid" | "expiring" | "expired" | "missing";
  docId: string | null;
  expiryDate: string | null;
}>;

export type MatrixPropertyRow = Readonly<{
  propertyId: string;
  propertyAddress: string;
  isHmo: boolean;
  cells: MatrixCell[];
}>;

export type MatrixData = Readonly<{
  properties: MatrixPropertyRow[];
  categories: string[];
}>;

export async function getComplianceMatrix(
  supabase: SupabaseClient,
): Promise<MatrixData> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase.rpc("get_compliance_matrix", {
    p_landlord_id: user.id,
  });

  if (error) {
    throw new Error(`Failed to fetch compliance matrix: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    property_id: string;
    property_address: string;
    is_hmo: boolean;
    category: string;
    doc_id: string | null;
    expiry_date: string | null;
    status: string;
  }>;

  const propertyMap = new Map<string, MatrixPropertyRow & { cells: MatrixCell[] }>();
  const categorySet = new Set<string>();

  for (const row of rows) {
    categorySet.add(row.category);

    if (!propertyMap.has(row.property_id)) {
      propertyMap.set(row.property_id, {
        propertyId: row.property_id,
        propertyAddress: row.property_address,
        isHmo: row.is_hmo,
        cells: [],
      });
    }

    propertyMap.get(row.property_id)!.cells.push({
      category: row.category,
      status: row.status as MatrixCell["status"],
      docId: row.doc_id,
      expiryDate: row.expiry_date,
    });
  }

  return {
    properties: Array.from(propertyMap.values()),
    categories: Array.from(categorySet),
  };
}
