import { eq, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/db';
import { rateLimits } from '@/db/schema';

// Fast in-memory token bucket cache for sub-millisecond local responses
const memoryCache = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  message?: string;
}

/**
 * Enforces rate limiting on free-tier requests.
 * Paid users automatically bypass rate limits.
 *
 * Free Tier Limits:
 * - 5 requests per 60 seconds (prevents rapid-fire scraping/spam)
 */
export async function checkFreeTierRateLimit(opts: {
  userId: string;
  isPaidUser?: boolean;
  maxRequests?: number;
  windowSeconds?: number;
}): Promise<RateLimitResult> {
  const {
    userId,
    isPaidUser = false,
    maxRequests = 5,
    windowSeconds = 60,
  } = opts;

  // Paid users have NO rate limits — they own their usage
  if (isPaidUser) {
    return {
      allowed: true,
      remaining: 999999,
      resetInSeconds: 0,
    };
  }

  const now = Date.now();
  const key = `free_tier:${userId}`;

  // 1. Fast in-memory check
  const cached = memoryCache.get(key);
  if (cached && cached.resetAt > now) {
    if (cached.count >= maxRequests) {
      const waitSec = Math.max(1, Math.ceil((cached.resetAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: waitSec,
        message: `Free tier rate limit: maximum ${maxRequests} requests per minute. Please wait ${waitSec}s or upgrade to Pro.`,
      };
    }
    cached.count += 1;
  } else {
    memoryCache.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
  }

  // 2. Persistent check via Neon DB (for serverless instances)
  if (isDatabaseConfigured()) {
    try {
      const [existing] = await db
        .select()
        .from(rateLimits)
        .where(eq(rateLimits.key, key))
        .limit(1);

      if (existing && existing.resetAt > now) {
        if (existing.count >= maxRequests) {
          const waitSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
          return {
            allowed: false,
            remaining: 0,
            resetInSeconds: waitSec,
            message: `Free tier rate limit: maximum ${maxRequests} requests per minute. Please wait ${waitSec}s or upgrade to Pro.`,
          };
        }

        // Increment count
        await db
          .update(rateLimits)
          .set({ count: sql`${rateLimits.count} + 1` })
          .where(eq(rateLimits.key, key));

        return {
          allowed: true,
          remaining: maxRequests - (existing.count + 1),
          resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
        };
      } else {
        // Reset or new window
        const resetAt = now + windowSeconds * 1000;
        await db
          .insert(rateLimits)
          .values({ key, count: 1, resetAt })
          .onConflictDoUpdate({
            target: rateLimits.key,
            set: { count: 1, resetAt },
          });

        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetInSeconds: windowSeconds,
        };
      }
    } catch (dbError) {
      // In case of transient DB error, fall back to in-memory decision
      console.warn('Rate limiter DB fallback:', dbError);
    }
  }

  const currentCached = memoryCache.get(key);
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - (currentCached?.count ?? 1)),
    resetInSeconds: Math.ceil(((currentCached?.resetAt ?? now) - now) / 1000),
  };
}
