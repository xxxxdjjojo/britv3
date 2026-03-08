import { vi } from "vitest";

/**
 * Mock Upstash Redis client for tests.
 * Uses an in-memory Map as backing store.
 */
export function createMockRedis() {
  const store = new Map<string, unknown>();

  return {
    get: vi.fn((key: string) => store.get(key) ?? null),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return "OK";
    }),
    setex: vi.fn((key: string, _ttl: number, value: unknown) => {
      store.set(key, value);
      return "OK";
    }),
    del: vi.fn((...keys: string[]) => {
      let deleted = 0;
      for (const key of keys) {
        if (store.delete(key)) deleted++;
      }
      return deleted;
    }),
    scan: vi.fn(() => [0, [] as string[]]),
    _store: store,
  };
}
