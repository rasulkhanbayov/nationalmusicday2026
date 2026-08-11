/**
 * Minimal in-memory rate limiter.
 *
 * Deliberately simple: this app runs a single small event, so a fixed-window
 * counter keyed by IP is enough to stop trivial scripted abuse (credential
 * stuffing on /admin, bulk order creation on /api/checkout).
 *
 * Limitation worth knowing: state lives in the process, so on a serverless
 * platform each instance keeps its own counter and a distributed attacker
 * spread across instances gets a proportionally higher effective limit. For
 * stronger guarantees this would need a shared store (Upstash/Redis) — but
 * that adds a dependency and, for this traffic level, this stops the realistic
 * attacks (a script hammering one endpoint from one host).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Drop expired buckets occasionally so the map cannot grow without bound.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Consumes one unit from `key`'s budget.
 *
 * @param limit    max requests allowed per window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Best-effort client IP. On Vercel the platform sets x-forwarded-for; the
 * left-most entry is the client. Falls back to a constant so a missing header
 * degrades to a shared (stricter) bucket rather than no limit at all.
 */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
