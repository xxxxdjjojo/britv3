import { vi } from "vitest";

/**
 * Mock Resend email client for tests.
 * Returns a successful send response by default.
 */
export function createMockResend() {
  return {
    emails: {
      send: vi.fn().mockResolvedValue({
        id: "mock-email-id",
        from: "test@britestate.com",
        to: "user@test.com",
      }),
    },
  };
}
