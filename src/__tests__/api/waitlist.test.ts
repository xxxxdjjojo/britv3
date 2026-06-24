import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getQueueStatus,
  joinWaitlist,
} from "@/services/waitlist/waitlist-service";

// ---------------------------------------------------------------------------
// Mocks (service + rate limiter) — installed before the route handlers import
// their dependencies.
// ---------------------------------------------------------------------------

vi.mock("@/services/waitlist/waitlist-service", () => ({
  joinWaitlist: vi.fn(),
  getQueueStatus: vi.fn(),
  getWaitlistCount: vi.fn(),
}));

vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true })),
  }),
}));

// ---------------------------------------------------------------------------
// Import handlers after mocks are registered.
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/waitlist/route";
import { GET } from "@/app/api/waitlist/[code]/route";

const mockJoinWaitlist = vi.mocked(joinWaitlist);
const mockGetQueueStatus = vi.mocked(getQueueStatus);

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with the new code and position for a valid email", async () => {
    mockJoinWaitlist.mockResolvedValue({
      code: "ABC",
      position: 5,
      referralCount: 0,
      total: 5,
      alreadyJoined: false,
    });

    const res = await POST(postRequest({ email: "a@b.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.code).toBe("ABC");
    expect(json.position).toBe(5);
  });

  it("returns 400 and never calls the service for an invalid email", async () => {
    const res = await POST(postRequest({ email: "nope" }));

    expect(res.status).toBe(400);
    expect(mockJoinWaitlist).not.toHaveBeenCalled();
  });
});

describe("GET /api/waitlist/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function getRequest(): Request {
    return new Request("http://localhost/api/waitlist/ABC");
  }

  it("returns 200 with the queue status when the code exists", async () => {
    const status = {
      code: "ABC",
      position: 12,
      referralCount: 2,
      total: 120,
    };
    mockGetQueueStatus.mockResolvedValue(status);

    const res = await GET(getRequest(), {
      params: Promise.resolve({ code: "ABC" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.code).toBe("ABC");
    expect(json.position).toBe(12);
  });

  it("returns 404 when the code is unknown", async () => {
    mockGetQueueStatus.mockResolvedValue(null);

    const res = await GET(getRequest(), {
      params: Promise.resolve({ code: "ABC" }),
    });

    expect(res.status).toBe(404);
  });
});
