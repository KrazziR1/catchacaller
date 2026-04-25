// Standardized API response formatting

export function success(data = {}, statusCode = 200) {
  return Response.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  );
}

export function error(message, statusCode = 400, details = null) {
  const response = {
    success: false,
    error: {
      message,
      ...(details && { details }),
    },
  };
  
  return Response.json(response, { status: statusCode });
}

export function badRequest(message, details = null) {
  return error(message, 400, details);
}

export function unauthorized(message = 'Unauthorized') {
  return error(message, 401);
}

export function forbidden(message = 'Access denied') {
  return error(message, 403);
}

export function notFound(message = 'Not found') {
  return error(message, 404);
}

export function conflict(message, details = null) {
  return error(message, 409, details);
}

export function tooManyRequests(message = 'Rate limit exceeded', resetIn = null) {
  return error(message, 429, resetIn ? { resetIn } : null);
}

export function serverError(message = 'Internal server error', details = null) {
  return error(message, 500, details);
}

// Wrapper for safe function execution
export async function safeExecute(fn, options = {}) {
  try {
    return await fn();
  } catch (err) {
    console.error('[Function Error]', err);
    
    const message = err.message || 'Unknown error';
    
    // Determine status code from error message
    if (message.includes('Unauthorized')) return unauthorized();
    if (message.includes('denied')) return forbidden();
    if (message.includes('not found')) return notFound();
    if (message.includes('rate limit')) return tooManyRequests();
    if (message.includes('Invalid')) return badRequest(message);
    
    return serverError(options.hideDetails ? 'Request failed' : message);
  }
}