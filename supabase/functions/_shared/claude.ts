/**
 * Shared Claude API language utilities for all K-Saju Edge Functions.
 * Centralizes LANGUAGE_NAMES lookup and language instruction generation
 * so each function does not need its own duplicate copy.
 */

// ── Language code → display name map ─────────────────────────────────────────

export const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean',
  en: 'English',
  'zh-Hans': 'Simplified Chinese',
  'zh-Hant': 'Traditional Chinese',
  ja: 'Japanese',
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
 * Builds a critical language instruction string to prepend to any Claude
 * system prompt, ensuring the AI responds in the user's language regardless
 * of the frame-level language directive that follows.
 *
 * @param userLanguage  BCP-47 language code (e.g. 'ko', 'zh-Hans', 'fr').
 *                      Defaults to 'en' if omitted or unrecognised.
 * @returns  Ready-to-prepend instruction string (includes trailing newlines).
 */
export function buildLangInstruction(userLanguage?: string): string {
  const langName = userLanguage
    ? (LANGUAGE_NAMES[userLanguage] ?? userLanguage)
    : LANGUAGE_NAMES['en'];

  return (
    `CRITICAL: You MUST respond ENTIRELY in ${langName} language.\n` +
    `Every single word of your response must be in ${langName}.\n` +
    `Do NOT use Korean unless the language is Korean (ko).\n` +
    `Do NOT mix languages. This instruction overrides all other instructions that follow.\n\n`
  );
}
