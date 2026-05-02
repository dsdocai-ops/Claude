import type { RoastResult } from "./claude";

interface StoreEntry {
  siteUrl: string;
  result: RoastResult;
  expiresAt: number;
}

// Module-level Map — shared within a single serverless instance.
// ⚠️  On Vercel each cold-start gets a fresh instance, so entries don't
// survive across invocations. Acceptable for MVP; swap for Vercel KV / Redis
// when you need cross-instance persistence.
//
// TODO: Known limitation — if a user opens their results in a new browser tab
// after returning from Stripe (sessionStorage is empty in the new tab), the
// GET /api/result endpoint will return 404 because the entry won't exist in
// a different serverless instance's store. Fix: replace this Map with
// Vercel KV (or any external Redis-compatible store) for cross-instance reads.
const store = new Map<string, StoreEntry>();

const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function saveRoast(id: string, siteUrl: string, result: RoastResult): void {
  purgeExpired();
  store.set(id, { siteUrl, result, expiresAt: Date.now() + TTL_MS });
}

export function getRoastById(id: string): { siteUrl: string; result: RoastResult } | null {
  const entry = store.get(id);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(id);
    return null;
  }
  return { siteUrl: entry.siteUrl, result: entry.result };
}

function purgeExpired(): void {
  const now = Date.now();
  store.forEach(({ expiresAt }, key) => {
    if (expiresAt < now) store.delete(key);
  });
}
