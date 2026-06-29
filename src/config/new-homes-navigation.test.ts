import { describe, expect, test } from "vitest";
import {
  COMMAND_PALETTE_ROUTES,
  FOOTER_LINKS,
  NAV_ITEMS,
} from "./navigation";

/** Recursively collect every `href` string within a nav config tree. */
function collectHrefs(value: unknown, acc: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectHrefs(item, acc);
  } else if (value && typeof value === "object") {
    for (const [key, val] of Object.entries(value)) {
      if (key === "href" && typeof val === "string") acc.push(val);
      else collectHrefs(val, acc);
    }
  }
  return acc;
}

describe("New Homes navigation", () => {
  test("the main nav links to /new-homes", () => {
    const hrefs = collectHrefs(NAV_ITEMS);
    expect(hrefs).toContain("/new-homes");
  });

  test("the command palette can reach /new-homes", () => {
    const hrefs = collectHrefs(COMMAND_PALETTE_ROUTES);
    expect(hrefs).toContain("/new-homes");
  });

  test("the nav links to the developer dashboard", () => {
    const hrefs = collectHrefs(NAV_ITEMS);
    expect(hrefs).toContain("/dashboard/developer");
  });

  test("the footer surfaces New Homes", () => {
    const hrefs = collectHrefs(FOOTER_LINKS);
    expect(hrefs).toContain("/new-homes");
  });
});
