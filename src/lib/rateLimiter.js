// Simple in-memory rate limiter (stores in-app state)
// For production, use Redis. This is sufficient for MVP.
const requestCounts = new Map();

export function rateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, []);
  }
  
  const timestamps = requestCounts.get(key);
  
  // Remove old timestamps outside the window
  const filtered = timestamps.filter(ts => now - ts < windowMs);
  requestCounts.set(key, filtered);
  
  if (filtered.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((filtered[0] + windowMs - now) / 1000),
    };
  }
  
  filtered.push(now);
  return {
    allowed: true,
    remaining: maxRequests - filtered.length,
    resetIn: null,
  };
}

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requestCounts.entries()) {
    const filtered = timestamps.filter(ts => now - ts < 300000);
    if (filtered.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, filtered);
    }
  }
}, 300000);