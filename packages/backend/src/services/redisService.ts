import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

let client: RedisClientType | null = null;
let isConnected = false;

export async function connectRedis(): Promise<void> {
  try {
    client = createClient({ url: config.redis.url });
    client.on('error', (err) => console.error('Redis error:', err));
    client.on('connect', () => { isConnected = true; });
    client.on('end', () => { isConnected = false; });
    await client.connect();
    console.log('Redis connected');
  } catch (err) {
    console.warn('Redis unavailable, caching disabled:', (err as Error).message);
    client = null;
    isConnected = false;
  }
}

function ready(): boolean {
  return client !== null && isConnected;
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  if (!ready()) return null;
  try {
    const raw = await client!.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 60): Promise<void> {
  if (!ready()) return;
  try {
    await client!.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {}
}

export async function cacheDel(pattern: string): Promise<void> {
  if (!ready()) return;
  try {
    if (pattern.includes('*')) {
      const keys = await client!.keys(pattern);
      if (keys.length > 0) await client!.del(keys);
    } else {
      await client!.del(pattern);
    }
  } catch {}
}

export async function cacheInvalidateComic(comicId?: string): Promise<void> {
  await cacheDel('comics:list:*');
  await cacheDel('comics:featured');
  await cacheDel('comics:stats');
  if (comicId) await cacheDel(`comics:detail:${comicId}`);
}

export function getRedisClient(): RedisClientType | null {
  return ready() ? client : null;
}
