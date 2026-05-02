import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

let _ratelimit: Ratelimit | null = null;

export function getRatelimit(): Ratelimit | null {
  if (_ratelimit) return _ratelimit;
  const redis = getRedis();
  if (!redis) return null; // skip rate limiting if Redis is not configured
  _ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: false,
    prefix: "roaster:rl",
  });
  return _ratelimit;
}
