import type { CulturalFrame, ReadingType, ClaudeReadingOutput } from './types.ts';

interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
}

interface SupabaseQueryBuilder {
  select: (cols?: string) => SupabaseQueryBuilder;
  insert: (data: unknown) => SupabaseQueryBuilder;
  eq: (col: string, val: string) => SupabaseQueryBuilder;
  order: (col: string, opts?: { ascending?: boolean }) => SupabaseQueryBuilder;
  limit: (n: number) => SupabaseQueryBuilder;
  single: () => Promise<{ data: unknown; error: unknown }>;
  // PromiseLike — awaiting the builder directly returns { data, error }
  then: <T>(
    onfulfilled: (value: { data: unknown; error: unknown }) => T,
  ) => Promise<T>;
}

interface CachedReading {
  id: string;
  summary: string;
  details: string[];          // stored as JSON in DB
  luckyItems: Record<string, unknown> | null;
}

export interface FeedbackSummary {
  rating: number;
  feedbackType: string | null;
}

const CACHE_TTL_HOURS = 24;

/**
 * Looks up an existing reading in the DB.
 * Returns the reading if found and within TTL, otherwise null.
 */
export async function getCachedReading(
  supabase: SupabaseClient,
  userId: string,
  type: ReadingType,
  refDate: string,
  frame: CulturalFrame,
  language = 'ko',
): Promise<CachedReading | null> {
  const { data, error } = await supabase
    .from('Reading')
    .select('id, summary, details, luckyItems, createdAt')
    .eq('userId', userId)
    .eq('type', type)
    .eq('refDate', refDate)
    .eq('culturalFrame', frame)
    .eq('language', language)
    .single();

  if (error || !data) return null;

  const row = data as CachedReading & { createdAt: string };
  const ageHours =
    (Date.now() - new Date(row.createdAt).getTime()) / 3_600_000;
  if (ageHours > CACHE_TTL_HOURS) return null;

  // Safety: older DB records may have stored raw Claude JSON in the summary field.
  // Parse it transparently so the client always receives a clean string.
  let summary = row.summary;
  let details = row.details;
  let luckyItems = row.luckyItems;

  if (typeof summary === 'string' && summary.trim().startsWith('{')) {
    try {
      const inner = JSON.parse(summary) as {
        summary?: string;
        details?: string[];
        luckyItems?: Record<string, unknown> | null;
      };
      if (inner.summary) {
        summary = inner.summary;
        if (Array.isArray(inner.details)) details = inner.details;
        if (inner.luckyItems !== undefined) luckyItems = inner.luckyItems as Record<string, unknown>;
      }
    } catch { /* keep original values */ }
  }

  return {
    id: row.id,
    summary,
    details,
    luckyItems,
  };
}

/**
 * Stores a new reading in the DB.
 * Uses upsert semantics via Prisma unique constraint.
 */
export async function storeReading(
  supabase: SupabaseClient,
  userId: string,
  type: ReadingType,
  refDate: string,
  frame: CulturalFrame,
  output: ClaudeReadingOutput,
  rawContent: string,
  language = 'ko',
): Promise<string | null> {
  const { data, error } = await supabase
    .from('Reading')
    .insert({
      userId,
      type,
      refDate,
      culturalFrame: frame,
      language,
      summary: output.summary,
      details: output.details,
      luckyItems: output.luckyItems,
      rawContent,
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

/**
 * Fetches the user's last N feedback records for prompt personalization.
 */
export async function getRecentFeedback(
  supabase: SupabaseClient,
  userId: string,
  limit = 5,
): Promise<FeedbackSummary[]> {
  const { data, error } = await supabase
    .from('FortuneFeedback')
    .select('rating, feedbackType')
    .eq('userId', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .then((r: { data: unknown; error: unknown }) => r);

  if (error || !data) return [];
  return (data as FeedbackSummary[]);
}
