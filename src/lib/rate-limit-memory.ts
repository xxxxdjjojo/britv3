const windows = new Map<string, number[]>();

// Cleanup stale entries every 60s
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of windows) {
      const filtered = timestamps.filter((t) => now - t < 3_600_000);
      if (filtered.length === 0) windows.delete(key);
      else windows.set(key, filtered);
    }
  }, 60_000).unref();
}

export function createInMemoryRateLimiter(maxRequests: number, windowMs: number) {
  return {
    limit: async (identifier: string) => {
      const now = Date.now();
      const timestamps = (windows.get(identifier) ?? []).filter((t) => now - t < windowMs);
      if (timestamps.length >= maxRequests) {
        windows.set(identifier, timestamps);
        return { success: false, limit: maxRequests, remaining: 0, reset: now + windowMs };
      }
      timestamps.push(now);
      windows.set(identifier, timestamps);
      return { success: true, limit: maxRequests, remaining: maxRequests - timestamps.length, reset: now + windowMs };
    },
  };
}
