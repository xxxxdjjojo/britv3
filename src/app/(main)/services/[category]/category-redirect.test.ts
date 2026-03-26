import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedirect = vi.fn();
const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/providers/category-slugs", () => ({
  SLUG_TO_CATEGORY: {
    plumbers: "plumber",
    electricians: "electrician",
    builders: "builder",
    handymen: "handyman",
    carpenters: "carpenter",
  } as Record<string, string>,
  CATEGORY_SLUGS: {
    plumber: "plumbers",
    electrician: "electricians",
    builder: "builders",
    handyman: "handymen",
    carpenter: "carpenters",
  } as Record<string, string>,
}));

describe("/services/[category] redirect page", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockNotFound.mockClear();
  });

  it("redirects plural slug 'plumbers' to /services/tradespeople?category=plumber", async () => {
    const { default: Page } = await import("./page");
    await expect(Page({ params: Promise.resolve({ category: "plumbers" }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/services/tradespeople?category=plumber");
  });

  it("redirects singular slug 'plumber' (DB enum) to /services/tradespeople?category=plumber", async () => {
    const { default: Page } = await import("./page");
    await expect(Page({ params: Promise.resolve({ category: "plumber" }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/services/tradespeople?category=plumber");
  });

  it("redirects 'electricians' to /services/tradespeople?category=electrician", async () => {
    const { default: Page } = await import("./page");
    await expect(Page({ params: Promise.resolve({ category: "electricians" }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/services/tradespeople?category=electrician");
  });

  it("calls notFound() for invalid category", async () => {
    const { default: Page } = await import("./page");
    await expect(Page({ params: Promise.resolve({ category: "nonexistent-xyz" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });
});
