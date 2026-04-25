import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// In-memory rate limit tracker (resets on deployment)
const testSmsAttempts = new Map();
const RATE_LIMIT = 5; // attempts per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    const userKey = user.email;
    const attempts = testSmsAttempts.get(userKey) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(t => now - t < WINDOW_MS);

    if (recentAttempts.length >= RATE_LIMIT) {
      const oldestAttempt = Math.min(...recentAttempts);
      const retryAfter = Math.ceil((oldestAttempt + WINDOW_MS - now) / 1000);
      return Response.json(
        { error: `Rate limited. Retry after ${retryAfter} seconds` },
        { status: 429, headers: { 'Retry-After': retryAfter } }
      );
    }

    // Record this attempt
    recentAttempts.push(now);
    testSmsAttempts.set(userKey, recentAttempts);

    return Response.json({ allowed: true, remaining: RATE_LIMIT - recentAttempts.length });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});