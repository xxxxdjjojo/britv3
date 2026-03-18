import { describe, it, expect } from "vitest";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo/schemas";
import { SITE_NAME, SITE_URL } from "@/lib/seo/config";

describe("buildOrganizationJsonLd", () => {
  it("has correct @context and @type", () => {
    const ld = buildOrganizationJsonLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Organization");
  });

  it("has correct name and url from config", () => {
    const ld = buildOrganizationJsonLd();
    expect(ld["name"]).toBe(SITE_NAME);
    expect(ld["url"]).toBe(SITE_URL);
  });

  it("has a logo URL ending in /icons/icon-512.png", () => {
    const ld = buildOrganizationJsonLd();
    expect(typeof ld["logo"]).toBe("string");
    expect((ld["logo"] as string).endsWith("/icons/icon-512.png")).toBe(true);
  });

  it("sameAs is an array with at least one entry", () => {
    const ld = buildOrganizationJsonLd();
    expect(Array.isArray(ld["sameAs"])).toBe(true);
    expect((ld["sameAs"] as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("buildWebSiteJsonLd", () => {
  it("has correct @context and @type", () => {
    const ld = buildWebSiteJsonLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("WebSite");
  });

  it("has correct name from config", () => {
    const ld = buildWebSiteJsonLd();
    expect(ld["name"]).toBe(SITE_NAME);
  });

  it("potentialAction has @type SearchAction", () => {
    const ld = buildWebSiteJsonLd();
    const action = ld["potentialAction"] as Record<string, unknown>;
    expect(action["@type"]).toBe("SearchAction");
  });

  it("potentialAction target urlTemplate contains search_term_string", () => {
    const ld = buildWebSiteJsonLd();
    const action = ld["potentialAction"] as Record<string, unknown>;
    const target = action["target"] as Record<string, unknown>;
    expect(typeof target["urlTemplate"]).toBe("string");
    expect((target["urlTemplate"] as string).includes("{search_term_string}")).toBe(true);
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("returns valid structure for an empty array", () => {
    const ld = buildBreadcrumbJsonLd([]);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(Array.isArray(ld["itemListElement"])).toBe(true);
    expect((ld["itemListElement"] as unknown[]).length).toBe(0);
  });

  it("3-item array has correct positions and names", () => {
    const items = [
      { name: "Home", url: "https://britestate.co.uk" },
      { name: "London", url: "https://britestate.co.uk/properties?location=London" },
      { name: "3-bed flat in London", url: "https://britestate.co.uk/properties/some-slug" },
    ];
    const ld = buildBreadcrumbJsonLd(items);
    const list = ld["itemListElement"] as Array<Record<string, unknown>>;
    expect(list.length).toBe(3);

    expect(list[0]["position"]).toBe(1);
    expect(list[0]["name"]).toBe("Home");
    expect(list[0]["item"]).toBe("https://britestate.co.uk");

    expect(list[1]["position"]).toBe(2);
    expect(list[1]["name"]).toBe("London");

    expect(list[2]["position"]).toBe(3);
    expect(list[2]["name"]).toBe("3-bed flat in London");
  });

  it("each list item has @type ListItem", () => {
    const ld = buildBreadcrumbJsonLd([{ name: "Home", url: "https://britestate.co.uk" }]);
    const list = ld["itemListElement"] as Array<Record<string, unknown>>;
    expect(list[0]["@type"]).toBe("ListItem");
  });
});
