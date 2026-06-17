/**
 * Tiny in-memory TTL cache for market-map responses, keyed by the resolved
 * query. The data is public Land Registry aggregate data, so process-local
 * caching is safe and avoids recomputing the same aggregation repeatedly.
 */
const TTL_MS = 10 * 60 * 1000;

interface Entry<T> {
  at: number;
  value: T;
}

const store = new Map<string, Entry<unknown>>();

export async function cached<T>(key: string, produce: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.value;
  }
  const value = await produce();
  store.set(key, { at: Date.now(), value });
  return value;
}
