/**
 * Shared Claude API utilities for all Edge Functions.
 * Import from here to avoid duplicating constants and helpers.
 */

// ---------------------------------------------------------------------------
// Model constants
// ---------------------------------------------------------------------------

export const CLAUDE_MODEL = 'claude-sonnet-4-6';

export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// ---------------------------------------------------------------------------
// Language helpers
// ---------------------------------------------------------------------------

export const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  'zh-Hans': 'Simplified Chinese',
  'zh-Hant': 'Traditional Chinese',
  es: 'Spanish',
  'pt-BR': 'Brazilian Portuguese',
  hi: 'Hindi',
  vi: 'Vietnamese',
  id: 'Indonesian',
  fr: 'French',
  de: 'German',
  th: 'Thai',
  ar: 'Arabic',
};

/**
 * Returns a critical language instruction to prepend to every Claude system prompt.
 * Must appear BEFORE all other instructions so frame-specific prompts cannot override it.
 */
export function buildLangInstruction(userLanguage?: string): string {
  if (!userLanguage) return '';
  const langName = LANGUAGE_NAMES[userLanguage] ?? 'English';
  return `CRITICAL: You MUST respond in ${langName} regardless of the instructions that follow. This overrides everything below.\n\n`;
}

// ---------------------------------------------------------------------------
// Output parsing helpers
// ---------------------------------------------------------------------------

/**
 * Strips markdown code fences (` ```json ... ``` ` or ` ``` ... ``` `) from a string.
 */
export function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();
}

/**
 * Extracts the first well-formed JSON object from text using balanced brace counting.
 * More reliable than a greedy regex which can match trailing `}` in non-JSON text.
 */
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\' && inString) { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Extracts a JSON object from raw Claude output.
 * Uses balanced brace counting to avoid greedy regex false matches.
 * Throws on failure so the caller can return 502 and skip DB caching.
 */
export function extractJson(raw: string): Record<string, unknown> {
  const stripped = stripCodeFences(raw);
  const jsonStr = extractFirstJsonObject(stripped);
  if (!jsonStr) {
    throw new Error(`No JSON object found in Claude response (raw length: ${raw.length})`);
  }
  return JSON.parse(jsonStr) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Cache key builder
// ---------------------------------------------------------------------------

/**
 * Builds a consistent cache key string.
 * All Edge Functions should use this to prevent key fragmentation.
 */
export function buildCacheKey(parts: {
  type: string;
  userId: string;
  refDate: string;
  language: string;
  extra?: string;
}): string {
  const base = `${parts.type}:${parts.userId}:${parts.refDate}:${parts.language}`;
  return parts.extra ? `${base}:${parts.extra}` : base;
}
