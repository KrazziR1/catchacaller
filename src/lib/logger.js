// Structured logging for monitoring & debugging

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

function formatLog(level, context, message, data = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    ...data,
  };
}

export const log = {
  error(context, message, data = {}) {
    const logEntry = formatLog(LOG_LEVELS.ERROR, context, message, data);
    console.error(JSON.stringify(logEntry));
    return logEntry;
  },

  warn(context, message, data = {}) {
    const logEntry = formatLog(LOG_LEVELS.WARN, context, message, data);
    console.warn(JSON.stringify(logEntry));
    return logEntry;
  },

  info(context, message, data = {}) {
    const logEntry = formatLog(LOG_LEVELS.INFO, context, message, data);
    console.log(JSON.stringify(logEntry));
    return logEntry;
  },

  debug(context, message, data = {}) {
    const logEntry = formatLog(LOG_LEVELS.DEBUG, context, message, data);
    // Debug logs only in development
    return logEntry;
  },
};

// Log function metrics
export function logMetric(name, value, tags = {}) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'metric',
      name,
      value,
      tags,
    })
  );
}

// Log API calls
export function logApiCall(method, endpoint, statusCode, duration, error = null) {
  const level = statusCode >= 500 ? LOG_LEVELS.ERROR : statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
  
  log[level.toLowerCase()]('API', `${method} ${endpoint}`, {
    status: statusCode,
    duration_ms: duration,
    ...(error && { error }),
  });
}