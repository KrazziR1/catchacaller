// Input validation utilities for security & compliance

export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return null;
  
  const digits = phone.replace(/\D/g, '');
  
  // Valid: 10 digits (US) or 11 starting with 1
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  
  return null; // Invalid
}

export function validateBusinessName(name) {
  if (!name || typeof name !== 'string') return null;
  
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return null;
  
  // Allow alphanumeric, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z0-9\s\-'&.]+$/.test(trimmed)) return null;
  
  return trimmed;
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return null;
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) ? email.toLowerCase() : null;
}

export function validateMessageBody(text) {
  if (!text || typeof text !== 'string') return null;
  
  const trimmed = text.trim();
  
  // SMS max: 160 chars (single segment)
  if (trimmed.length === 0 || trimmed.length > 1600) return null;
  
  // No control characters or suspicious patterns
  if (/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/.test(trimmed)) return null;
  
  return trimmed;
}

export function validateUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return null;
  }
}

export function validateIndustry(industry) {
  const valid = [
    'general', 'hvac', 'plumbing', 'roofing', 'med_spa', 'legal',
    'hospitality', 'marketing', 'real_estate', 'dental', 'fitness',
    'automotive', 'debt_collection', 'political', 'other'
  ];
  
  return valid.includes(industry) ? industry : null;
}

export function validateTimeZone(tz) {
  // Simple check: must match pattern like America/New_York
  if (!tz || typeof tz !== 'string') return null;
  if (!/^[A-Z][a-z]+\/[A-Z][a-z_]+$/.test(tz)) return null;
  return tz;
}

// Sanitize for logging (no PII in logs)
export function sanitizeForLogging(obj) {
  const sensitive = ['phone', 'email', 'ssn', 'credit_card'];
  const copy = { ...obj };
  
  for (const key of Object.keys(copy)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      copy[key] = '***REDACTED***';
    }
  }
  
  return copy;
}