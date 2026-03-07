import type { ClaudeReadingOutput } from './types.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1200;

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
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Calls Claude API and returns a parsed ClaudeReadingOutput.
 * Throws on API error or JSON parse failure.
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<ClaudeReadingOutput & { rawContent: string }> {
  const body: AnthropicRequest = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  };

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
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  const rawContent = data.content?.[0]?.text ?? '';

  const parsed = parseClaudeOutput(rawContent);
  return { ...parsed, rawContent };
}

/**
 * Parses Claude's JSON output. Falls back to a minimal safe structure on error.
 */
export function parseClaudeOutput(raw: string): ClaudeReadingOutput {
  // Strip markdown code fences (```json ... ```) before parsing
  const stripped = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  // Extract JSON object from the cleaned text
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      summary: stripped.slice(0, 100).trim(),
      details: [stripped.trim()],
      luckyItems: null,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<ClaudeReadingOutput>;

    return {
      summary: String(parsed.summary ?? '').slice(0, 200),
      details: Array.isArray(parsed.details)
        ? (parsed.details as string[]).map(String).slice(0, 6)
        : [],
      luckyItems: parsed.luckyItems ?? null,
    };
  } catch {
    return {
      summary: stripped.slice(0, 100).trim(),
      details: [stripped.trim()],
      luckyItems: null,
    };
  }
}
