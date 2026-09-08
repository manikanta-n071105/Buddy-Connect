import Redis, { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let isRedisConnected = false;
let redisClient: Redis | null = null;

export const initRedis = (): Redis | null => {
  if (redisClient) return redisClient;

  try {
    const redisUrl = process.env.REDIS_URL;
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT || '6379');
    const password = process.env.REDIS_PASSWORD || undefined;

    const options: RedisOptions = {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times: number) {
        if (times > 3) {
          // Stop retrying continuously if Redis server is down
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    };

    if (password) options.password = password;

    redisClient = redisUrl
      ? new Redis(redisUrl, options)
      : new Redis({ host, port, ...options });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('⚡ Redis Client connected successfully.');
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
    });

    redisClient.on('error', (err) => {
      if (isRedisConnected) {
        console.warn('⚠️ Redis connection notice:', err.message);
      }
      isRedisConnected = false;
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });

    // Attempt non-blocking connection
    redisClient.connect().catch((err) => {
      isRedisConnected = false;
      console.log('ℹ️ Redis server not reachable locally. Falling back seamlessly to In-Memory Cache.');
    });

  } catch (err: any) {
    isRedisConnected = false;
    console.warn('ℹ️ Redis initialization skipped:', err.message);
  }

  return redisClient;
};

export const getIsRedisConnected = (): boolean => isRedisConnected;
export const getRedisClient = (): Redis | null => {
  if (!redisClient) {
    initRedis();
  }
  return redisClient;
};
