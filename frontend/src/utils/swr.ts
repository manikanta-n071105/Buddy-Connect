import api from '../services/api';

/**
 * Stale-While-Revalidate API fetcher utility.
 * Reads cached data from sessionStorage for instant 0ms rendering,
 * then revalidates in the background to fetch fresh data and update the cache.
 */
export async function fetchWithCache<T>(
  cacheKey: string,
  endpoint: string,
  onData: (data: T, isFromCache: boolean) => void,
  options: { forceRefresh?: boolean } = {}
): Promise<T | null> {
  const { forceRefresh = false } = options;

  // 1. Instant Cache Phase (0ms Render)
  if (!forceRefresh) {
    try {
      const cachedStr = sessionStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr) as T;
        onData(cached, true);
      }
    } catch (e) {
      // Ignore cache parse error
    }
  }

  // 2. Background Revalidation Phase
  try {
    const res = await api.get(endpoint);
    const freshData: T = res.data.data !== undefined ? res.data.data : res.data;
    onData(freshData, false);
    sessionStorage.setItem(cacheKey, JSON.stringify(freshData));
    return freshData;
  } catch (err) {
    console.error(`SWR fetch error [${endpoint}]:`, err);
    return null;
  }
}

/**
 * Helper to clear specific cache key or prefix from local SWR cache.
 */
export function clearSWRCache(cacheKeyOrPrefix?: string): void {
  if (!cacheKeyOrPrefix) {
    sessionStorage.clear();
    return;
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(cacheKeyOrPrefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => sessionStorage.removeItem(k));
}
