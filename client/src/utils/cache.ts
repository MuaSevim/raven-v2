/**
 * Simple TTL-based in-memory cache for API responses.
 * Prevents redundant network calls within a short window.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<any>>();

/**
 * Get cached data if valid, otherwise undefined.
 */
export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.data as T;
}

/**
 * Store data in cache with a TTL (in milliseconds).
 */
export function setCached<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalidate one or more cache keys (supports prefix matching).
 */
export function invalidateCache(keyOrPrefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      store.delete(key);
    }
  }
}

/**
 * Wrap an async function with caching.
 * @param key      Cache key
 * @param ttlMs    Time-to-live in ms (default 30s)
 * @param fn       Async function to call on miss
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== undefined) return cached;

  const data = await fn();
  setCached(key, data, ttlMs);
  return data;
}
