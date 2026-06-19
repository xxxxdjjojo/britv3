/**
 * Tests for land-registry-service helpers that write to property_last_sold.
 *
 * Pure helpers (extractLatestSaleDate, addressMatches) are tested directly.
 * The Supabase-touching upsertLastSoldForProperty is tested with an injected
 * mock client; we do NOT exercise the real admin client here.
 */

import { describe, it, expect, vi } from "vitest";
import {
  extractLatestSaleDate,
  addressMatches,
  upsertLastSoldForProperty,
} from "./land-registry-service";

describe("extractLatestSaleDate", () => {
  it("returns the maximum date when given multiple records", () => {
    expect(
      extractLatestSaleDate([
        { date: "2024-03-01" },
        { date: "2025-08-15" },
        { date: "2023-01-20" },
      ]),
    ).toBe("2025-08-15");
  });

  it("returns the single date when given one record", () => {
    expect(extractLatestSaleDate([{ date: "2024-05-10" }])).toBe("2024-05-10");
  });

  it("returns null for an empty array", () => {
    expect(extractLatestSaleDate([])).toBeNull();
  });

  it("ignores entries with missing / non-string date", () => {
    expect(
      extractLatestSaleDate([
        { date: null },
        { date: undefined },
        { date: "2024-05-10" },
      ]),
    ).toBe("2024-05-10");
  });

  it("returns null when no entry has a valid date", () => {
    expect(
      extractLatestSaleDate([{ date: null }, { date: undefined }]),
    ).toBeNull();
  });
});

describe("addressMatches", () => {
  it("matches when LR address starts with the listing address_line1", () => {
    // LR builds "PAON, SAON, STREET, TOWN" — first token is the same number/name
    // that listings.address_line1 carries.
    expect(addressMatches("42, HIGH STREET, LONDON", "42 High Street")).toBe(
      true,
    );
  });

  it("matches case- and whitespace-insensitively", () => {
    expect(addressMatches("  42, high street, london  ", "42 HIGH STREET")).toBe(
      true,
    );
  });

  it("does not match when number differs", () => {
    expect(addressMatches("44, HIGH STREET, LONDON", "42 High Street")).toBe(
      false,
    );
  });

  it("does not match when street differs", () => {
    expect(addressMatches("42, LOW STREET, LONDON", "42 High Street")).toBe(
      false,
    );
  });

  it("returns false for empty / missing inputs", () => {
    expect(addressMatches("", "42 High Street")).toBe(false);
    expect(addressMatches("42, HIGH STREET", "")).toBe(false);
  });
});

describe("upsertLastSoldForProperty", () => {
  function makeMockClient() {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    return { client: { from } as never, upsert, from };
  }

  it("upserts the max date of comparables whose address matches", async () => {
    const { client, from, upsert } = makeMockClient();

    await upsertLastSoldForProperty(
      "prop-1",
      "42 High Street",
      [
        { address: "42, HIGH STREET, LONDON", date: "2024-03-01" },
        { address: "42, HIGH STREET, LONDON", date: "2025-08-15" },
        { address: "99, OTHER ROAD, LONDON", date: "2026-01-01" },
      ],
      client,
    );

    expect(from).toHaveBeenCalledWith("property_last_sold");
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      {
        property_id: "prop-1",
        last_sold_date: "2025-08-15",
        source: "hmlr",
      },
      { onConflict: "property_id" },
    );
  });

  it("does not upsert when no comparable matches the property address", async () => {
    const { client, upsert } = makeMockClient();

    await upsertLastSoldForProperty(
      "prop-1",
      "42 High Street",
      [
        { address: "99, OTHER ROAD, LONDON", date: "2025-08-15" },
        { address: "13, ELM ROAD, LONDON", date: "2024-03-01" },
      ],
      client,
    );

    expect(upsert).not.toHaveBeenCalled();
  });

  it("does not upsert when comparables array is empty", async () => {
    const { client, upsert } = makeMockClient();
    await upsertLastSoldForProperty("prop-1", "42 High Street", [], client);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("does not upsert when comparables is null", async () => {
    const { client, upsert } = makeMockClient();
    await upsertLastSoldForProperty("prop-1", "42 High Street", null, client);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("does not throw when the upsert returns an error — swallows + logs", async () => {
    const from = vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: { message: "boom" } }),
    }));
    const client = { from } as never;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      upsertLastSoldForProperty(
        "prop-1",
        "42 High Street",
        [{ address: "42, HIGH STREET, LONDON", date: "2025-08-15" }],
        client,
      ),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("does not throw when the client throws — swallows + logs", async () => {
    const from = vi.fn(() => {
      throw new Error("connection refused");
    });
    const client = { from } as never;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      upsertLastSoldForProperty(
        "prop-1",
        "42 High Street",
        [{ address: "42, HIGH STREET, LONDON", date: "2025-08-15" }],
        client,
      ),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
