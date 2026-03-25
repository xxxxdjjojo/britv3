import { test, expect } from "@playwright/test";

test.describe("Provider Reference Management", () => {
  // Reference API routes exist and require auth
  test("resend API returns 401 without auth", async ({ request }) => {
    const response = await request.post("/api/provider/references/fake-id/resend");
    expect(response.status()).toBe(401);
  });

  test("cancel API returns 401 without auth", async ({ request }) => {
    const response = await request.post("/api/provider/references/fake-id/cancel");
    expect(response.status()).toBe(401);
  });

  // Submission API validates input
  test("submit API rejects missing token", async ({ request }) => {
    const response = await request.post("/api/reference/submit", {
      data: { reference_text: "Great work", rating: 5, gdpr_consent: true },
    });
    expect(response.status()).toBe(400);
  });

  test("submit API rejects invalid token", async ({ request }) => {
    const response = await request.post("/api/reference/submit", {
      data: { token: "invalid", reference_text: "a".repeat(50), rating: 5, gdpr_consent: true },
    });
    expect(response.status()).toBe(401);
  });

  test("submit API rejects short reference text", async ({ request }) => {
    const response = await request.post("/api/reference/submit", {
      data: { token: "some-token", reference_text: "too short", rating: 5, gdpr_consent: true },
    });
    expect(response.status()).toBe(400);
  });

  test("submit API rejects missing GDPR consent", async ({ request }) => {
    const response = await request.post("/api/reference/submit", {
      data: { token: "some-token", reference_text: "a".repeat(50), rating: 5, gdpr_consent: false },
    });
    expect(response.status()).toBe(400);
  });

  // Inngest route exists
  test("inngest API route responds to GET", async ({ request }) => {
    const response = await request.get("/api/inngest");
    // Inngest serve returns 200 for GET (introspection)
    expect([200, 405]).toContain(response.status());
  });
});
