import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse, type NextRequest } from "next/server";

type Window = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

const limiterCache = new Map<string, Ratelimit>();

/** Dev-only in-memory fallback when Upstash is not configured. */
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

function getUpstashLimiter(
  name: string,
  limit: number,
  window: Window,
): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const cacheKey = `${name}:${limit}:${window}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const redis = new Redis({ url, token });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `ownbase:${name}`,
    analytics: true,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

async function checkMemoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ success: boolean; reset: number }> {
  const now = Date.now();
  const entry = memoryBuckets.get(key);
  if (!entry || entry.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, reset: now + windowMs };
  }
  if (entry.count >= limit) {
    return { success: false, reset: entry.resetAt };
  }
  entry.count += 1;
  return { success: true, reset: entry.resetAt };
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * Rate limit by identifier (IP or user id).
 * Uses Upstash when configured; otherwise in-memory (dev/single instance only).
 */
export async function rateLimit(
  identifier: string,
  options: {
    name: string;
    limit: number;
    window: Window;
  },
): Promise<RateLimitResult> {
  const { name, limit, window } = options;
  const key = `${name}:${identifier}`;

  const upstash = getUpstashLimiter(name, limit, window);
  if (upstash) {
    try {
      const { success, reset } = await upstash.limit(key);
      if (!success) {
        return {
          ok: false,
          response: rateLimitResponse(reset),
        };
      }
      return { ok: true };
    } catch (error) {
      console.error(`[rate-limit] Upstash request failed for "${name}"`, error);
      if (process.env.NODE_ENV === "production") {
        console.warn(
          `[rate-limit] Fallback to in-memory limiter for "${name}" because Upstash is unavailable.`,
        );
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[rate-limit] UPSTASH_REDIS_REST_URL not set; using in-memory limiter for "${name}" (not reliable on serverless).`,
    );
  }

  const windowMs = parseWindowMs(window);
  const { success, reset } = await checkMemoryLimit(key, limit, windowMs);
  if (!success) {
    return { ok: false, response: rateLimitResponse(reset) };
  }
  return { ok: true };
}

export async function rateLimitByIp(
  request: NextRequest,
  options: { name: string; limit: number; window: Window },
): Promise<RateLimitResult> {
  return rateLimit(getClientIp(request), options);
}

function parseWindowMs(window: Window): number {
  const [amount, unit] = window.split(" ") as [string, string];
  const n = Number(amount);
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return n * (multipliers[unit] ?? 60_000);
}

function rateLimitResponse(reset: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
      },
    },
  );
}

const AUTH_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
]);

const AI_API_PREFIX = "/api/dashboard/ai/";
const AI_INSIGHT_PATH = "/api/dashboard/repo/commit/insight";
const ADMIN_API_PREFIX = "/api/admin/";

export function isAuthRateLimitPath(pathname: string): boolean {
  return AUTH_PATHS.has(pathname);
}

export function isAiRateLimitPath(pathname: string): boolean {
  return pathname.startsWith(AI_API_PREFIX) || pathname === AI_INSIGHT_PATH;
}

export function isAdminRateLimitPath(pathname: string): boolean {
  return pathname.startsWith(ADMIN_API_PREFIX);
}

export async function applyAuthRateLimit(
  request: NextRequest,
): Promise<RateLimitResult> {
  return rateLimitByIp(request, {
    name: "auth",
    limit: 30,
    window: "10 m",
  });
}

export async function applyAiRateLimit(
  request: NextRequest,
  userId: string | null,
): Promise<RateLimitResult> {
  const identifier = userId ?? getClientIp(request);
  return rateLimit(identifier, {
    name: "ai",
    limit: 40,
    window: "1 m",
  });
}

export async function applyAdminRateLimit(
  request: NextRequest,
  userId: string | null,
): Promise<RateLimitResult> {
  const identifier = userId ?? getClientIp(request);
  return rateLimit(identifier, {
    name: "admin",
    limit: 120,
    window: "1 m",
  });
}
