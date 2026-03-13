import type { ClaudeReadingOutput, ReadingType } from './types.ts';
import { CLAUDE_MODEL, stripCodeFences, extractJson } from '../_shared/claude.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = CLAUDE_MODEL;

// Base token limits calibrated for English output.
// Multipliers are applied per language below.
const BASE_TOKENS_BY_TYPE: Record<ReadingType, number> = {
  daily:   700,
  weekly:  900,
  monthly: 900,
  annual:  1100,
  daewoon: 1400,
};

// CJK scripts (Korean, Japanese, Chinese) use ~2× more BPE tokens than English.
// Arabic, Thai, Hindi use ~2.5× more — previously unaccounted for, causing recurring 502s.
const CJK_LANGS    = new Set(['ko', 'ja', 'zh-Hans', 'zh-Hant']);
const DENSE_LANGS  = new Set(['ar', 'th', 'hi', 'vi']); // 2.5× and up

function getMaxTokens(type: ReadingType, userLanguage?: string): number {
  const base = BASE_TOKENS_BY_TYPE[type];
  if (!userLanguage) return Math.ceil(base * 2);          // default: CJK-safe
  if (DENSE_LANGS.has(userLanguage))  return Math.ceil(base * 2.5);
  if (CJK_LANGS.has(userLanguage))    return Math.ceil(base * 2);
  return base;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: AnthropicMessage[];
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

// HTTP status codes from Anthropic that are safe to retry
const RETRYABLE_STATUSES = new Set([429, 500, 529]);
const RETRY_DELAY_MS = 1500;
const MAX_RETRIES = 2;

/**
 * Calls Claude API with up to MAX_RETRIES retries for transient errors (429/529/500).
 * Throws on permanent errors (400, 401) or JSON parse failure.
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  type: ReadingType = 'daily',
  userLanguage?: string,
): Promise<ClaudeReadingOutput & { rawContent: string }> {
  const maxTokens = getMaxTokens(type, userLanguage);

  const body: AnthropicRequest = {
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  };

  let lastError = '';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }

    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      lastError = `Claude API error ${res.status}: ${errText}`;
      if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_RETRIES) {
        console.warn(`[saju-reading] ${lastError} — retrying (${attempt + 1}/${MAX_RETRIES})`);
        continue;
      }
      throw new Error(lastError);
    }

    const data = (await res.json()) as AnthropicResponse;
    const rawContent = data.content?.[0]?.text ?? '';

    // Detect truncation before attempting JSON parse — gives a clear actionable error.
    if (data.stop_reason === 'max_tokens') {
      throw new Error(
        `Claude response truncated: stop_reason=max_tokens, ` +
        `type=${type}, lang=${userLanguage ?? 'unknown'}, ` +
        `output_tokens=${data.usage.output_tokens}/${maxTokens}, ` +
        `tail="${rawContent.slice(-100)}"`,
      );
    }

    const parsed = parseClaudeOutput(rawContent);
    return { ...parsed, rawContent };
  }

  throw new Error(lastError || 'Claude API failed after retries');
}

/**
 * Parses Claude's JSON output into ClaudeReadingOutput.
 * Uses extractJson() from _shared which does balanced-brace extraction —
 * safer than a greedy regex that can match trailing } in non-JSON text.
 */
export function parseClaudeOutput(raw: string): ClaudeReadingOutput {
  const parsed = extractJson(raw) as Partial<ClaudeReadingOutput>;

  return {
    summary: String(parsed.summary ?? '').slice(0, 200),
    details: Array.isArray(parsed.details)
      ? (parsed.details as string[]).map(String).slice(0, 6)
      : [],
    luckyItems: parsed.luckyItems ?? null,
  };
}
