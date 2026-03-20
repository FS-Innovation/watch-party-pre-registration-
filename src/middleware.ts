import { NextRequest, NextResponse } from "next/server";

// In-memory sliding window rate limiter
// Note: For serverless (Vercel), replace with Upstash Redis for persistence across cold starts
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = ip;
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    rateLimitStore.forEach((v, k) => {
      if (v.resetAt < now) rateLimitStore.delete(k);
    });
  }

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// Rate limit configs per route pattern
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/register": { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  "/api/meet-greet": { limit: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 min
  "/api/admin": { limit: 30, windowMs: 60 * 1000 }, // 30 per minute
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  // Find matching rate limit config
  const matchedRoute = Object.keys(RATE_LIMITS).find((route) =>
    pathname.startsWith(route)
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  const config = RATE_LIMITS[matchedRoute];
  const rateLimitKey = `${ip}:${matchedRoute}`;
  const allowed = rateLimit(rateLimitKey, config.limit, config.windowMs);

  if (!allowed) {
    const retryAfter = Math.ceil(config.windowMs / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
