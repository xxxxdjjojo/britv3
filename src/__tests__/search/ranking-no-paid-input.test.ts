import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildSearchQuery } from "@/lib/search/query-builder";
import type { SearchParams, SearchSort } from "@/types/search";

/**
 * PUBLIC RANKING REGRESSION TEST — backs the no-premium-placement pledge
 * (/pledges/no-premium-placement, src/config/pledges.ts).
 *
 * Property search result ranking must never take paid input. This test pins
 * that in two ways:
 *   1. Statically: the search ordering code contains zero references to
 *      placement / sponsored / boost / featured tables or fields.
 *   2. Behaviourally: every sort option orders only by price, listed_date,
 *      or text-search relevance.
 *
 * It also pins that paid content stays visibly labelled: SponsoredSearchSlot
 * (the ONLY paid surface near search results, rendered as a separate slot)
 * must carry a visible "Sponsored" label.
 *
 * Allowed exception: search-service.ts post-filters billing-SUSPENDED
 * listings out (excludeBillingSuspendedListings). That is a suspension
 * control — it can only remove listings, never promote them — not paid
 * ranking input.
 */

const SRC = path.resolve(__dirname, "..", "..");

const read = (rel: string): string =>
  readFileSync(path.join(SRC, rel), "utf8");

const PAID_SIGNALS = /\b(placements?|sponsored|sponsor|boosts?|boosted|featured)\b/i;

describe("search ranking code has no paid input (static)", () => {
  const rankingFiles = [
    "lib/search/query-builder.ts",
    "services/search/search-service.ts",
  ];

  it.each(rankingFiles)("%s never references paid placement signals", (rel) => {
    const body = read(rel);
    const hit = body.match(PAID_SIGNALS);
    expect(
      hit,
      `paid-placement signal "${hit?.[0]}" found in ${rel} — this breaks the no-premium-placement pledge`,
    ).toBeNull();
  });

  it("every .order() call in query-builder orders only by price or listed_date", () => {
    const body = read("lib/search/query-builder.ts");
    const orderColumns = [...body.matchAll(/\.order\(\s*"([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(orderColumns.length).toBeGreaterThan(0);
    for (const column of orderColumns) {
      expect(
        ["price", "listed_date"],
        `unexpected order column "${column}" in query-builder.ts`,
      ).toContain(column);
    }
  });
});

describe("search sort options map only to price / listed_date / text-rank (behavioural)", () => {
  function createQueryRecorder() {
    const orders: Array<{ column: string; ascending: boolean }> = [];
    const base = {
      order(column: string, opts: { ascending: boolean }) {
        orders.push({ column, ascending: opts.ascending });
        return proxy;
      },
      then(resolve: (value: unknown) => void) {
        resolve({ data: [], error: null, count: 0 });
      },
    };
    // Any other chained filter method (eq, gte, textSearch, limit, …) is a
    // no-op returning the same chain — we only record ordering.
    const proxy: typeof base = new Proxy(base, {
      get(target, prop) {
        if (prop in target) {
          return target[prop as keyof typeof target];
        }
        return () => proxy;
      },
    });
    return { proxy, orders };
  }

  function createSupabaseMock() {
    const { proxy, orders } = createQueryRecorder();
    const supabase = {
      from: () => proxy,
      rpc: () => proxy,
    } as unknown as SupabaseClient;
    return { supabase, orders };
  }

  const sorts: SearchSort[] = [
    "price_asc",
    "price_desc",
    "date_asc",
    "date_desc",
    "relevance",
  ];

  it.each(sorts)("sort=%s orders only by price/listed_date", async (sort) => {
    const { supabase, orders } = createSupabaseMock();
    const params: SearchParams = { sort };

    await buildSearchQuery(supabase, params);

    expect(orders.length).toBeGreaterThan(0);
    for (const order of orders) {
      expect(["price", "listed_date"]).toContain(order.column);
    }
  });

  it("default sort (no sort param) orders by listed_date descending", async () => {
    const { supabase, orders } = createSupabaseMock();

    await buildSearchQuery(supabase, {});

    expect(orders).toEqual([{ column: "listed_date", ascending: false }]);
  });
});

describe("sponsored content stays visibly labelled", () => {
  it("SponsoredSearchSlot renders a visible 'Sponsored' label", () => {
    const body = read("components/placements/SponsoredSearchSlot.tsx");
    // Pin the literal JSX text node — a visible label, not a code comment.
    expect(body).toMatch(/>\s*Sponsored\s*</);
  });
});
