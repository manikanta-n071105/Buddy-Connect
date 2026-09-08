import { getRedisClient, getIsRedisConnected } from '../config/redis';

// High-Performance In-Memory TTL Cache (Fallback & Tier-1 Cache)
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();

// Unified Distributed Redis + Memory Cache Manager
class UnifiedCache {
  async get<T>(key: string): Promise<T | null> {
    // 1. Tier-1: Fast In-Memory Check
    const localVal = memoryCache.get<T>(key);
    if (localVal !== null) return localVal;

    // 2. Tier-2: Redis Distributed Cache Check
    if (getIsRedisConnected()) {
      try {
        const client = getRedisClient();
        if (client) {
          const data = await client.get(key);
          if (data) {
            const parsed = JSON.parse(data) as T;
            // Populate Tier-1 Memory cache for fast subsequent hits (5s local cache)
            memoryCache.set(key, parsed, 5000);
            return parsed;
          }
        }
      } catch (err) {
        // Fall back gracefully if Redis call fails
      }
    }
    return null;
  }

  getSync<T>(key: string): T | null {
    return memoryCache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlMs: number = 30000): Promise<void> {
    // Write to Tier-1 Memory Cache
    memoryCache.set(key, value, ttlMs);

    // Write to Tier-2 Redis Cache
    if (getIsRedisConnected()) {
      try {
        const client = getRedisClient();
        if (client) {
          const stringified = JSON.stringify(value);
          const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
          await client.set(key, stringified, 'EX', ttlSeconds);
        }
      } catch (err) {
        // Suppress error and continue with memory cache
      }
    }
  }

  async del(key: string): Promise<void> {
    memoryCache.del(key);
    if (getIsRedisConnected()) {
      try {
        const client = getRedisClient();
        if (client) {
          await client.del(key);
        }
      } catch (err) {
        // Suppress
      }
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    memoryCache.deleteByPrefix(prefix);
    if (getIsRedisConnected()) {
      try {
        const client = getRedisClient();
        if (client) {
          const keys = await client.keys(`${prefix}*`);
          if (keys && keys.length > 0) {
            await client.del(...keys);
          }
        }
      } catch (err) {
        // Suppress
      }
    }
  }

  async clear(): Promise<void> {
    memoryCache.clear();
    if (getIsRedisConnected()) {
      try {
        const client = getRedisClient();
        if (client) {
          await client.flushdb();
        }
      } catch (err) {
        // Suppress
      }
    }
  }
}

export const cache = new UnifiedCache();
