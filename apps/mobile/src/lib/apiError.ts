/**
 * apiError.ts — server error sanitizer
 *
 * Converts raw server-side error messages (API key errors, internal 500s, etc.)
 * to user-friendly strings before surfacing them in the UI.
 *
 * In __DEV__: prefixes with "[DEV] " so developers still see the root cause.
 * In production: internal errors are replaced with a generic, localisable message.
 */

// Patterns that indicate an internal server configuration error.
const INTERNAL_PATTERNS = [
  /api[_\s.-]?key/i,
  /anthropic/i,
  /secret/i,
  /env(ironment)?/i,
  /not set/i,
  /undefined/i,
  /HTTP 5\d{2}/,  // 5xx server errors
  /HTTP 503/,
];

const FRIENDLY_SERVER_ERROR =
  '서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';

const FRIENDLY_NOT_FOUND =
  '요청한 기능을 아직 사용할 수 없습니다. 나중에 다시 시도해 주세요.';

export function friendlyApiError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);

  if (/HTTP 404/.test(raw)) {
    return __DEV__ ? `[DEV] ${raw}` : FRIENDLY_NOT_FOUND;
  }

  if (INTERNAL_PATTERNS.some((re) => re.test(raw))) {
    return __DEV__ ? `[DEV] ${raw}` : FRIENDLY_SERVER_ERROR;
  }

  return raw;
}
