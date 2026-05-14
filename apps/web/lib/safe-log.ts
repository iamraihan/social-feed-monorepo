// Defence-in-depth logger. Strips known-sensitive keys from a logged
// metadata object before forwarding to the underlying logger. Replace the
// `console.error` body with a real logger (pino / winston / Sentry) and
// every call site picks up the change for free.
//
// This isn't a security boundary — never trust a denylist to keep secrets
// out of logs in adversarial conditions. It's a pragmatic seatbelt for the
// "I added a debug log and forgot the request body has a password in it"
// failure mode.

const REDACTED_KEYS = new Set<string>([
  'password',
  'passwordHash',
  'confirmPassword',
  'accessToken',
  'refreshToken',
  'token',
  'authorization',
  'cookie',
  'setCookie',
]);

function redact(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key)) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = redact(val);
    }
  }
  return out;
}

export function logError(tag: string, meta?: Record<string, unknown>): void {
  if (meta === undefined) {
    console.error(tag);
    return;
  }
  console.error(tag, redact(meta));
}
