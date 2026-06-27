import { describe, it, expect, vi } from "vitest";

/**
 * Regression guard for the production 500 on GET /api/messages?count_only=true
 * (the unread-message badge).
 *
 * In the Vercel serverless lambda, `isomorphic-dompurify` pulls in `jsdom`, which
 * reads `default-stylesheet.css` (relative to its own dir) at MODULE LOAD. When
 * webpack bundles jsdom into the route chunk that path resolves to
 * `.next/browser/default-stylesheet.css`, which isn't traced into the function —
 * so the whole route chunk throws `ENOENT` at evaluation and EVERY request 500s
 * before the handler even runs (anonymous requests included).
 *
 * The unread-badge GET path must not depend on that module graph. We prove it by
 * making `isomorphic-dompurify` explode at import (exactly what the lambda does)
 * and asserting the route still loads and the handler still runs.
 */

// Simulate jsdom's ENOENT-at-load inside the lambda.
vi.mock("isomorphic-dompurify", () => {
  throw new Error("ENOENT: default-stylesheet.css (simulated Vercel lambda)");
});

// Unauthenticated client → handler should return 401 (proves the module loaded
// and the handler ran, instead of the chunk crashing at import).
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}));

// POST-only collaborators — stubbed so they can't throw at import for unrelated
// reasons (missing Redis/env). They are irrelevant to the GET count path.
vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: async () => ({ success: true }) }),
}));
vi.mock("@/lib/truedeed/capture-message", () => ({
  captureListingMessageIntroduction: async () => {},
}));
vi.mock("@/services/messaging/message-notifications", () => ({
  notifyNewMessage: async () => {},
}));

describe("GET /api/messages?count_only=true (unread badge)", () => {
  it("loads and responds without pulling jsdom/dompurify into the route bundle", async () => {
    const { GET } = await import("./route");
    const { NextRequest } = await import("next/server");

    const res = await GET(
      new NextRequest("http://localhost/api/messages?count_only=true"),
    );

    // 401 is fine — the point is the route module LOADED and the handler RAN,
    // rather than the chunk crashing at import like it does in production.
    expect(res.status).toBe(401);
  });
});
