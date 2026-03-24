/**
 * Single-flight deduplication for concurrent identical queries.
 * If a query is already in-flight, subsequent callers get the same promise.
 * Prevents thundering herd on cache misses.
 */

const inFlight = new Map<string, Promise<unknown>>();

export async function singleFlight<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}
