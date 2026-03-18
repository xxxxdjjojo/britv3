import { describe, it, expect, vi } from "vitest";

// Mock next/og since ImageResponse is not available in happy-dom
vi.mock("next/og", () => ({
  ImageResponse: class MockImageResponse {
    body: ReadableStream | null = null;
    headers: Headers;
    status: number;

    constructor(
      _element: React.ReactElement,
      options?: { width?: number; height?: number; headers?: Record<string, string> },
    ) {
      this.status = 200;
      this.headers = new Headers({
        "content-type": "image/png",
        ...(options?.headers ?? {}),
      });
    }
  },
}));

describe("GET /api/og", () => {
  it("returns 200 with image/png content-type when title is provided", async () => {
    const { GET } = await import("@/app/api/og/route");

    const request = new Request(
      "http://localhost:3000/api/og?title=Beautiful+3+Bed+House",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=2678400, immutable",
    );
  });

  it("returns a fallback image (still 200) when title is missing", async () => {
    const { GET } = await import("@/app/api/og/route");

    const request = new Request("http://localhost:3000/api/og");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
  });

  it("returns 200 with image layout when image param is provided", async () => {
    const { GET } = await import("@/app/api/og/route");

    const request = new Request(
      "http://localhost:3000/api/og?title=Modern+Flat&image=https://example.com/photo.jpg&type=property",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
  });

  it("sets 31-day cache headers", async () => {
    const { GET } = await import("@/app/api/og/route");

    const request = new Request(
      "http://localhost:3000/api/og?title=Test",
    );
    const response = await GET(request);

    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=2678400, immutable",
    );
  });
});
