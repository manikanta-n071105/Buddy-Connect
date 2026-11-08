/**
 * High-Performance Concurrency Limiter & Batching Utility for Frontend
 * Prevents HTTP request storms, browser connection choking, and excessive server load.
 */

/**
 * Creates a concurrency limiter function that ensures no more than `concurrency`
 * asynchronous requests execute at the same time.
 */
export function pLimit(concurrency: number) {
  if (!((Number.isInteger(concurrency) || concurrency === Infinity) && concurrency > 0)) {
    throw new TypeError('Expected `concurrency` to be an integer from 1 and up or Infinity');
  }

  const queue: Array<() => void> = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const task = queue.shift();
      task?.();
    }
  };

  const run = async <T>(fn: () => Promise<T>, resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => {
    activeCount++;
    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      next();
    }
  };

  const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      if (activeCount < concurrency) {
        run(fn, resolve, reject);
      } else {
        queue.push(() => run(fn, resolve, reject));
      }
    });
  };

  return enqueue;
}

/**
 * Splits an array into chunks of `batchSize`.
 */
export function chunkArray<T>(items: T[], batchSize: number): T[][] {
  if (batchSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize));
  }
  return chunks;
}

/**
 * Executes async tasks over items in batches with concurrency limits.
 *
 * @param items Array of data items to process
 * @param batchSize Number of items per batch
 * @param worker Function processing each batch
 * @param concurrency Maximum concurrent batches (defaults to 3)
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  worker: (batch: T[], batchIndex: number) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> {
  if (!items || items.length === 0) return [];

  const chunks = chunkArray(items, batchSize);
  const limit = pLimit(concurrency);

  const promises = chunks.map((chunk, idx) =>
    limit(() => worker(chunk, idx))
  );

  return Promise.all(promises);
}

/**
 * In-Flight Request Coalescing (Deduplication)
 * Prevents identical concurrent HTTP calls (e.g. from tab switches, rapid clicks, re-renders).
 */
const inFlightRequests = new Map<string, Promise<any>>();

export function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

