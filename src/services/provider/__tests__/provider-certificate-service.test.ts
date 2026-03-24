/**
 * Tests for provider-certificate-service.
 *
 * Functions under contract:
 *  - issueCertificate(supabase, providerId, input): Promise<Certificate>
 *  - getCertificatesByBooking(supabase, bookingId, providerId): Promise<Certificate[]>
 *  - getCertificatesByProvider(supabase, providerId): Promise<Certificate[]>
 *  - uploadCertificateFile(supabase, certId, providerId, filePath, fileBuffer): Promise<string>
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  issueCertificate,
  getCertificatesByBooking,
  getCertificatesByProvider,
} from "../provider-certificate-service";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/**
 * Builds a chainable Supabase query mock that resolves to `resolveValue`.
 * Terminal methods (maybeSingle, single) resolve to the value.
 * Awaiting the chain directly also works via `.then`.
 */
function makeQueryMock(resolveValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "in",
    "not",
    "gte",
    "lte",
    "gt",
    "lt",
    "order",
    "limit",
    "maybeSingle",
    "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  // Make the chain itself awaitable
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    resolveValue,
  ).then.bind(Promise.resolve(resolveValue));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return chain as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCertRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "cert-uuid-1",
    booking_id: "booking-uuid-1",
    provider_id: "provider-uuid-1",
    certificate_type: "gas_safe_cp12",
    certificate_number: "123456",
    data: {},
    issued_at: "2026-03-22",
    expires_at: "2027-03-22",
    file_path: null,
    notes: null,
    created_at: "2026-03-22T10:00:00Z",
    updated_at: "2026-03-22T10:00:00Z",
    ...overrides,
  };
}

function makeInsertClient(row: Record<string, unknown>) {
  const insertChain: Record<string, unknown> = {};
  const methods = ["select", "single"];
  for (const m of methods) {
    insertChain[m] = vi.fn(() => insertChain);
  }
  (insertChain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: row,
    error: null,
  });

  return {
    from: vi.fn(() => ({
      insert: vi.fn(() => insertChain),
    })),
  } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

function makeSelectClient(rows: unknown[]) {
  const selectChain: Record<string, unknown> = {};
  const methods = ["eq", "order"];
  for (const m of methods) {
    selectChain[m] = vi.fn(() => selectChain);
  }
  (selectChain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve({
    data: rows,
    error: null,
  }).then.bind(
    Promise.resolve({
      data: rows,
      error: null,
    }),
  );

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => selectChain),
    })),
  } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

// ---------------------------------------------------------------------------
// issueCertificate
// ---------------------------------------------------------------------------

describe("issueCertificate", () => {
  it("creates a gas_safe_cp12 certificate with valid data", async () => {
    const row = makeCertRow();
    const client = makeInsertClient(row);

    const result = await issueCertificate(client, "provider-uuid-1", {
      bookingId: "booking-uuid-1",
      certificateType: "gas_safe_cp12",
      certificateNumber: "123456",
      issuedAt: "2026-03-22",
      expiresAt: "2027-03-22",
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: "cert-uuid-1",
        providerId: "provider-uuid-1",
        certificateType: "gas_safe_cp12",
        certificateNumber: "123456",
      }),
    );
  });

  it("creates an eic certificate", async () => {
    const row = makeCertRow({
      certificate_type: "eic",
      certificate_number: "EIC-001",
      booking_id: null,
    });
    const client = makeInsertClient(row);

    const result = await issueCertificate(client, "provider-uuid-1", {
      certificateType: "eic",
      certificateNumber: "EIC-001",
    });

    expect(result).toEqual(
      expect.objectContaining({
        certificateType: "eic",
        certificateNumber: "EIC-001",
      }),
    );
  });

  it("rejects an invalid certificate type", async () => {
    const client = makeQueryMock({ data: null, error: null });

    await expect(
      issueCertificate(client, "provider-uuid-1", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        certificateType: "invalid_type" as any,
      }),
    ).rejects.toThrow();
  });

  it("validates Gas Safe certificate number format — rejects non-6-digit value", async () => {
    const client = makeQueryMock({ data: null, error: null });

    await expect(
      issueCertificate(client, "provider-uuid-1", {
        certificateType: "gas_safe_cp12",
        certificateNumber: "ABC",
      }),
    ).rejects.toThrow(/gas safe/i);
  });

  it("allows null certificate number for gas_safe_cp12", async () => {
    const row = makeCertRow({ certificate_number: null });
    const client = makeInsertClient(row);

    const result = await issueCertificate(client, "provider-uuid-1", {
      certificateType: "gas_safe_cp12",
      // no certificateNumber
    });

    expect(result.certificateNumber).toBeNull();
  });

  it("stores custom data as JSONB", async () => {
    const customData = { client_name: "John Doe", property_address: "1 Test Lane" };
    const row = makeCertRow({
      certificate_type: "custom",
      certificate_number: null,
      data: customData,
    });
    const client = makeInsertClient(row);

    const result = await issueCertificate(client, "provider-uuid-1", {
      certificateType: "custom",
      data: customData,
    });

    expect(result.data).toEqual(customData);
  });
});

// ---------------------------------------------------------------------------
// getCertificatesByBooking
// ---------------------------------------------------------------------------

describe("getCertificatesByBooking", () => {
  it("returns certificates for a booking", async () => {
    const rows = [makeCertRow(), makeCertRow({ id: "cert-uuid-2" })];
    const client = makeSelectClient(rows);

    const result = await getCertificatesByBooking(client, "booking-uuid-1", "provider-uuid-1");

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        certificateType: expect.any(String),
        providerId: expect.any(String),
      }),
    );
  });

  it("returns empty array when no certificates exist for booking", async () => {
    const client = makeSelectClient([]);

    const result = await getCertificatesByBooking(client, "booking-uuid-none", "provider-uuid-1");

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getCertificatesByProvider
// ---------------------------------------------------------------------------

describe("getCertificatesByProvider", () => {
  it("returns all certificates for a provider", async () => {
    const rows = [
      makeCertRow(),
      makeCertRow({ id: "cert-uuid-2", certificate_type: "eicr", booking_id: null }),
    ];
    const client = makeSelectClient(rows);

    const result = await getCertificatesByProvider(client, "provider-uuid-1");

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[1]).toEqual(
      expect.objectContaining({
        certificateType: "eicr",
      }),
    );
  });
});
