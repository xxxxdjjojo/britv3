import { vi } from "vitest";

/**
 * Mock Anthropic SDK client for tests.
 * Returns a configurable text response from messages.create.
 */
export function createMockAnthropic(responseText?: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text:
              responseText ??
              '{"line_items":[],"total":0,"estimated_duration":"1 day","scope_of_work":"Test"}',
          },
        ],
        usage: { input_tokens: 100, output_tokens: 200 },
      }),
    },
  };
}
