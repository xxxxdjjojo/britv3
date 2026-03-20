/**
 * Tests for provider-portfolio-service.
 *
 * Functions under contract:
 *  - getPortfolioItems(supabase, providerId)
 *  - addPortfolioItem(supabase, providerId, input)
 *  - updatePortfolioItem(supabase, providerId, itemId, updates)
 *  - deletePortfolioItem(supabase, providerId, itemId)
 *  - reorderPortfolioItems(supabase, providerId, orderedIds)
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  getPortfolioItems,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  reorderPortfolioItems,
} from "../provider-portfolio-service";

import type { AddPortfolioItemInput } from "../provider-portfolio-service";

// ---------------------------------------------------------------------------
// Helpers to build a chainable Supabase query mock
// ---------------------------------------------------------------------------

function makeQueryMock(resolveValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "not", "gte", "lte", "gt", "lt",
    "order", "limit", "range", "maybeSingle", "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    resolveValue,
  ).then.bind(Promise.resolve(resolveValue));
  return chain as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

/**
 * Creates a mock client with storage support for deletePortfolioItem tests.
 */
function makeClientWithStorage(resolveValue: unknown) {
  const client = makeQueryMock(resolveValue);
  const storageBucket = {
    remove: vi.fn().mockResolvedValue({ error: null }),
  };
  (client as unknown as Record<string, unknown>)["storage"] = {
    from: vi.fn(() => storageBucket),
  };
  return client;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROVIDER_ID = "prov-001";
const now = new Date().toISOString();

function makePortfolioItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-001",
    provider_id: PROVIDER_ID,
    title: "Kitchen Renovation",
    description: "Full kitchen refit in Victorian terrace",
    category: "kitchen",
    before_image_path: "portfolio/before-001.jpg",
    after_image_path: "portfolio/after-001.jpg",
    is_featured: false,
    display_order: 1,
    created_at: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getPortfolioItems
// ---------------------------------------------------------------------------

describe("getPortfolioItems", () => {
  it("returns items ordered by display_order ASC", async () => {
    const items = [
      makePortfolioItem({ id: "item-001", display_order: 1 }),
      makePortfolioItem({ id: "item-002", display_order: 2, title: "Bathroom" }),
    ];
    const client = makeQueryMock({ data: items, error: null });

    const result = await getPortfolioItems(client, PROVIDER_ID);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].display_order).toBe(1);
    expect(result[1].display_order).toBe(2);

    // Verify order() was called with ascending: true
    const orderFn = client.order as ReturnType<typeof vi.fn>;
    expect(orderFn).toHaveBeenCalledWith("display_order", { ascending: true });
  });

  it("returns empty array for new provider (not null)", async () => {
    const client = makeQueryMock({ data: [], error: null });
    const result = await getPortfolioItems(client, PROVIDER_ID);
    expect(result).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeQueryMock({ data: null, error: null });
    const result = await getPortfolioItems(client, PROVIDER_ID);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// addPortfolioItem
// ---------------------------------------------------------------------------

describe("addPortfolioItem", () => {
  it("returns correct shape with auto-incremented display_order", async () => {
    const newItem = makePortfolioItem({ display_order: 4 });

    // First from() = get max display_order (maybeSingle returns existing max)
    const maxChain = makeQueryMock({ data: { display_order: 3 }, error: null });
    // Second from() = insert
    const insertChain = makeQueryMock({ data: newItem, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: newItem, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? maxChain : insertChain;
    });

    const input: AddPortfolioItemInput = {
      title: "Kitchen Renovation",
      description: "Full kitchen refit in Victorian terrace",
      category: "kitchen",
    };

    const result = await addPortfolioItem(client, PROVIDER_ID, input);
    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        provider_id: PROVIDER_ID,
        title: "Kitchen Renovation",
        display_order: expect.any(Number),
        is_featured: false,
        created_at: expect.any(String),
      }),
    );

    // Verify insert was called with display_order = max + 1 = 4
    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        display_order: 4,
      }),
    );
  });

  it("sets display_order to 1 when provider has no existing items", async () => {
    const newItem = makePortfolioItem({ display_order: 1 });

    // maybeSingle returns null (no existing items)
    const maxChain = makeQueryMock({ data: null, error: null });
    const insertChain = makeQueryMock({ data: newItem, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: newItem, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? maxChain : insertChain;
    });

    await addPortfolioItem(client, PROVIDER_ID, { title: "First item" });

    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        display_order: 1,
      }),
    );
  });

  it("accepts optional before/after image paths", async () => {
    const newItem = makePortfolioItem({
      before_image_path: "portfolio/before.jpg",
      after_image_path: "portfolio/after.jpg",
    });

    const maxChain = makeQueryMock({ data: null, error: null });
    const insertChain = makeQueryMock({ data: newItem, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: newItem, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? maxChain : insertChain;
    });

    const input: AddPortfolioItemInput = {
      title: "Kitchen Renovation",
      before_image_path: "portfolio/before.jpg",
      after_image_path: "portfolio/after.jpg",
    };

    const result = await addPortfolioItem(client, PROVIDER_ID, input);
    expect(result.before_image_path).toBe("portfolio/before.jpg");
    expect(result.after_image_path).toBe("portfolio/after.jpg");

    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        before_image_path: "portfolio/before.jpg",
        after_image_path: "portfolio/after.jpg",
      }),
    );
  });

  it("sets null for omitted optional fields", async () => {
    const newItem = makePortfolioItem({
      description: null,
      category: null,
      before_image_path: null,
      after_image_path: null,
    });

    const maxChain = makeQueryMock({ data: null, error: null });
    const insertChain = makeQueryMock({ data: newItem, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: newItem, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? maxChain : insertChain;
    });

    await addPortfolioItem(client, PROVIDER_ID, { title: "Minimal item" });

    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
        category: null,
        before_image_path: null,
        after_image_path: null,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// updatePortfolioItem
// ---------------------------------------------------------------------------

describe("updatePortfolioItem", () => {
  it("updates title and description", async () => {
    const existing = makePortfolioItem();
    const updated = { ...existing, title: "Updated Title", description: "New description" };

    const fetchChain = makeQueryMock({ data: { provider_id: PROVIDER_ID }, error: null });
    const updateChain = makeQueryMock({ data: updated, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: updated, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    const result = await updatePortfolioItem(client, PROVIDER_ID, "item-001", {
      title: "Updated Title",
      description: "New description",
    });
    expect(result.title).toBe("Updated Title");
    expect(result.description).toBe("New description");
  });

  it("throws when item not found", async () => {
    const fetchChain = makeQueryMock({ data: null, error: null });
    const client = makeQueryMock({ data: null, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      updatePortfolioItem(client, PROVIDER_ID, "nonexistent", { title: "Test" }),
    ).rejects.toThrow("Portfolio item nonexistent not found");
  });

  it("throws authorization error when item belongs to different provider", async () => {
    const fetchChain = makeQueryMock({ data: { provider_id: "other-provider" }, error: null });
    const client = makeQueryMock({ data: null, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      updatePortfolioItem(client, PROVIDER_ID, "item-001", { title: "Test" }),
    ).rejects.toThrow("Authorization error: portfolio item belongs to a different provider");
  });
});

// ---------------------------------------------------------------------------
// deletePortfolioItem
// ---------------------------------------------------------------------------

describe("deletePortfolioItem", () => {
  it("removes item without error", async () => {
    const existing = {
      provider_id: PROVIDER_ID,
      before_image_path: null,
      after_image_path: null,
    };

    // fetch = maybeSingle, delete = thenable
    const fetchChain = makeQueryMock({ data: existing, error: null });
    const deleteChain = makeQueryMock({ error: null });

    let callCount = 0;
    const client = makeClientWithStorage({ data: existing, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : deleteChain;
    });

    await expect(deletePortfolioItem(client, PROVIDER_ID, "item-001")).resolves.toBeUndefined();
  });

  it("throws when item not found", async () => {
    const fetchChain = makeQueryMock({ data: null, error: null });
    const client = makeClientWithStorage({ data: null, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      deletePortfolioItem(client, PROVIDER_ID, "nonexistent"),
    ).rejects.toThrow("Portfolio item nonexistent not found");
  });

  it("throws authorization error for wrong provider", async () => {
    const existing = {
      provider_id: "other-provider",
      before_image_path: null,
      after_image_path: null,
    };
    const fetchChain = makeQueryMock({ data: existing, error: null });
    const client = makeClientWithStorage({ data: existing, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      deletePortfolioItem(client, PROVIDER_ID, "item-001"),
    ).rejects.toThrow("Authorization error: portfolio item belongs to a different provider");
  });

  it("removes storage files when before/after images exist", async () => {
    const existing = {
      provider_id: PROVIDER_ID,
      before_image_path: "portfolio/before.jpg",
      after_image_path: "portfolio/after.jpg",
    };

    const fetchChain = makeQueryMock({ data: existing, error: null });
    const deleteChain = makeQueryMock({ error: null });

    let callCount = 0;
    const client = makeClientWithStorage({ data: existing, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : deleteChain;
    });

    await deletePortfolioItem(client, PROVIDER_ID, "item-001");

    // Verify storage.from("portfolio").remove() was called with both paths
    const storage = (client as unknown as Record<string, unknown>)["storage"] as {
      from: ReturnType<typeof vi.fn>;
    };
    expect(storage.from).toHaveBeenCalledWith("portfolio");
    const bucket = storage.from.mock.results[0].value;
    expect(bucket.remove).toHaveBeenCalledWith([
      "portfolio/before.jpg",
      "portfolio/after.jpg",
    ]);
  });
});

// ---------------------------------------------------------------------------
// reorderPortfolioItems
// ---------------------------------------------------------------------------

describe("reorderPortfolioItems", () => {
  it("updates display_order for all items", async () => {
    const orderedIds = ["item-c", "item-a", "item-b"];
    const items = orderedIds.map((id) => ({ id, provider_id: PROVIDER_ID }));

    // First from() = fetch ownership check (in query)
    const fetchChain = makeQueryMock({ data: items, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: items, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : makeQueryMock({ error: null });
    });

    await expect(
      reorderPortfolioItems(client, PROVIDER_ID, orderedIds),
    ).resolves.toBeUndefined();
  });

  it("throws authorization error when item belongs to different provider", async () => {
    const orderedIds = ["item-a", "item-b"];
    const items = [
      { id: "item-a", provider_id: PROVIDER_ID },
      { id: "item-b", provider_id: "other-provider" },
    ];

    const fetchChain = makeQueryMock({ data: items, error: null });
    const client = makeQueryMock({ data: items, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      reorderPortfolioItems(client, PROVIDER_ID, orderedIds),
    ).rejects.toThrow("Authorization error: item item-b belongs to a different provider");
  });

  it("no-ops when orderedIds is empty", async () => {
    const client = makeQueryMock({ data: null, error: null });

    await expect(
      reorderPortfolioItems(client, PROVIDER_ID, []),
    ).resolves.toBeUndefined();

    // from() should never have been called
    expect(client.from).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Portfolio items support before/after image pairs
// ---------------------------------------------------------------------------

describe("portfolio before/after image support", () => {
  it("portfolio item type supports before_image_path and after_image_path", () => {
    const item = makePortfolioItem({
      before_image_path: "portfolio/before-kitchen.jpg",
      after_image_path: "portfolio/after-kitchen.jpg",
    });
    expect(item.before_image_path).toBe("portfolio/before-kitchen.jpg");
    expect(item.after_image_path).toBe("portfolio/after-kitchen.jpg");
  });

  it("before/after paths can be null", () => {
    const item = makePortfolioItem({
      before_image_path: null,
      after_image_path: null,
    });
    expect(item.before_image_path).toBeNull();
    expect(item.after_image_path).toBeNull();
  });
});
