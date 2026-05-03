
/**
 * Salery Cache Service
 * Optimized for high-concurrency SaaS performance.
 * Supports in-memory caching with TTL (Time-To-Live).
 */

type CacheEntry<T> = {
    value: T;
    expiry: number;
};

class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTtl = 3600 * 1000; // 1 hour

    /**
     * Get or Set a cache value
     * @param key Unique key for the resource
     * @param fetcher Async function to fetch data if cache miss
     * @param ttl Custom TTL in milliseconds
     */
    async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
        const cached = this.cache.get(key);
        const now = Date.now();

        if (cached && cached.expiry > now) {
            console.log(`[CACHE HIT] ${key}`);
            return cached.value;
        }

        console.log(`[CACHE MISS] ${key} - Fetching fresh data...`);
        const value = await fetcher();
        this.cache.set(key, {
            value,
            expiry: now + (ttl || this.defaultTtl)
        });

        return value;
    }

    /**
     * Invalidate a specific key
     */
    invalidate(key: string) {
        this.cache.delete(key);
    }

    /**
     * Invalidate all keys matching a pattern (e.g., company-specific)
     */
    invalidatePattern(pattern: string) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache (e.g., global configuration update)
     */
    flush() {
        this.cache.clear();
    }
}

export const cacheService = new CacheService();
