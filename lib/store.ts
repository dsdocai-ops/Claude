import { getRedis } from "./redis";
import type { RoastResult } from "./types";

interface StoreEntry {
  siteUrl: string;
  result: RoastResult;
  paid: boolean;
  expiresAt?: number; // only used by the in-memory fallback
}

const TTL_SECONDS = 2 * 60 * 60;

// In-memory fallback — single-instance only; acceptable for local dev without Redis.
const memStore = new Map<string, StoreEntry>();

export async function saveRoast(id: string, siteUrl: string, result: RoastResult): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(`roast:${id}`, JSON.stringify({ siteUrl, result, paid: false }), {
      ex: TTL_SECONDS,
    });
    return;
  }
  memStore.set(id, { siteUrl, result, paid: false, expiresAt: Date.now() + TTL_SECONDS * 1000 });
}

export async function getRoastById(
  id: string
): Promise<{ siteUrl: string; result: RoastResult; paid: boolean } | null> {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get<string>(`roast:${id}`);
    if (!raw) return null;
    const entry = typeof raw === "string" ? JSON.parse(raw) : (raw as StoreEntry);
    return { siteUrl: entry.siteUrl, result: entry.result, paid: entry.paid ?? false };
  }
  const entry = memStore.get(id);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memStore.delete(id);
    return null;
  }
  return { siteUrl: entry.siteUrl, result: entry.result, paid: entry.paid };
}

export async function markPaid(id: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get<string>(`roast:${id}`);
    if (!raw) return;
    const entry = typeof raw === "string" ? JSON.parse(raw) : (raw as StoreEntry);
    const ttl = await redis.ttl(`roast:${id}`);
    await redis.set(
      `roast:${id}`,
      JSON.stringify({ ...entry, paid: true }),
      { ex: ttl > 0 ? ttl : TTL_SECONDS }
    );
    return;
  }
  const entry = memStore.get(id);
  if (entry) memStore.set(id, { ...entry, paid: true });
}
