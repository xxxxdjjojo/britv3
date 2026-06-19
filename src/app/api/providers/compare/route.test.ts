/**
 * Tests for GET /api/providers/compare.
 *
 * Regression guard (marketplace column-drift): service_provider_details is keyed
 * by `user_id` and has no `id` or `city` column. The route previously selected
 * `id` and filtered `.in("id", …)`, producing "column service_provider_details.id
 * does not exist" → a 500. These tests pin the aliased `id:user_id` select, the
 * `user_id` filter, and that `city` is no longer requested from the table.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

import { GET } from "./route";

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-9222-222222222222";

function makeRequest(ids: string): Request {
  return new Request(`http://localhost/api/providers/compare?ids=${ids}`);
}

beforeEach(() => mockCreateClient.mockReset());

describe("GET /api/providers/compare", () => {
  it("selects id:user_id and filters by user_id (never the non-existent id column)", async () => {
    let selectArg = "";
    const inSpy = vi.fn().mockResolvedValue({
      data: [
        {
          id: UUID_A,
          slug: "ace-plumbing",
          business_name: "Ace Plumbing",
          services: ["plumber"],
          service_postcodes: ["W8"],
          accreditations: null,
          response_time_hours: 2,
          pricing: {},
          profiles: { avatar_url: null, full_name: "Ada", provider_verification_status: "verified" },
          provider_rating_stats: { average_rating: 4.6, total_reviews: 28 },
        },
      ],
      error: null,
    });

    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn((sel: string) => {
          selectArg = sel;
          return { in: inSpy };
        }),
      })),
    });

    const res = await GET(makeRequest(`${UUID_A},${UUID_B}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    // Regression: aliased id, scoped by user_id, no bare `id`/`city` against the table.
    expect(selectArg).toContain("id:user_id");
    expect(selectArg).not.toMatch(/(^|[ ,])city([ ,]|$)/);
    expect(inSpy).toHaveBeenCalledWith("user_id", [UUID_A, UUID_B]);
    // city is supplied as null to satisfy the CompareProvider shape.
    expect(body.data[0]).toMatchObject({ id: UUID_A, city: null });
    expect(body.data[0].provider_rating_stats).toEqual({ average_rating: 4.6, total_reviews: 28 });
  });

  it("returns 400 for a non-uuid ids parameter", async () => {
    const res = await GET(makeRequest("not-a-uuid"));
    expect(res.status).toBe(400);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("returns 500 when the query errors", async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
        })),
      })),
    });

    const res = await GET(makeRequest(UUID_A));
    expect(res.status).toBe(500);
  });
});
