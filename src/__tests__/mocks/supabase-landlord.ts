/**
 * Supabase mock overrides for landlord-specific table queries.
 *
 * Pattern: same structure as src/__tests__/mocks/supabase.ts but scoped
 * to tenant_applications, deposit_registrations, inventory_reports, legal_notices.
 *
 * Usage in tests:
 *   vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => createMockLandlordSupabaseClient()) }));
 */
import { vi } from "vitest";

export const mockTenantApplicationsChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  returns: vi.fn().mockResolvedValue({ data: [], error: null }),
  then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) =>
    resolve({ data: [], error: null }),
  ),
};

export const mockDepositRegistrationsChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) =>
    resolve({ data: [], error: null }),
  ),
};

export const mockInventoryReportsChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) =>
    resolve({ data: [], error: null }),
  ),
};

export const mockLegalNoticesChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) =>
    resolve({ data: [], error: null }),
  ),
};

/**
 * Returns a Supabase mock client pre-configured for landlord table queries.
 * Callers can override individual chain mocks per test as needed.
 */
export function createMockLandlordSupabaseClient() {
  const tableChains: Record<string, unknown> = {
    tenant_applications: mockTenantApplicationsChain,
    deposit_registrations: mockDepositRegistrationsChain,
    inventory_reports: mockInventoryReportsChain,
    legal_notices: mockLegalNoticesChain,
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      return (
        tableChains[table] ?? {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) =>
            resolve({ data: [], error: null }),
          ),
        }
      );
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
  };
}
