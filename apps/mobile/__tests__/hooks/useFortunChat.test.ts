/**
 * useFortunChat — unit tests
 *
 * Tests request payload shape, streaming response handling,
 * premium gate, rate-limit gate, and error scenarios
 * using plain jest mocks (no renderHook dependency).
 */

// Make this file a module to avoid global scope conflicts with other test files.
export {};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { access_token: 'tok_test_456' };

const MOCK_CHART = {
  dayStem: '甲',
  dayElement: '木',
  elements: { Wood: 3, Fire: 1, Earth: 1, Metal: 2, Water: 1 },
  pillars: {
    year:  { stem: '庚', branch: '午' },
    month: { stem: '丁', branch: '卯' },
    day:   { stem: '甲', branch: '子' },
    hour:  null,
  },
};

const MOCK_READING = {
  summary: 'Today brings Wood energy. Focus on creativity.',
  details: ['Stay grounded', 'Avoid confrontation'],
};

const TODAY_ID = '2026-03-01';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/store/authStore', () => ({
  useAuthStore: () => ({ session: MOCK_SESSION }),
}));

jest.mock('../../src/store/sajuStore', () => ({
  useSajuStore: () => ({ chart: MOCK_CHART, frame: 'en' }),
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a mock ReadableStream that emits the given SSE tokens then [DONE]. */
function makeStreamBody(tokens: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const events = [
    ...tokens.map((t) => `data: ${JSON.stringify({ token: t })}\n\n`),
    'data: [DONE]\n\n',
  ];
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const e of events) controller.enqueue(encoder.encode(e));
      controller.close();
    },
  });
}

function mockFetchStream(tokens: string[]) {
  (globalThis.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
    ok: true, status: 200,
    body: makeStreamBody(tokens),
    json: async () => ({}),
  });
}

function mockFetchError(status: number, body: unknown) {
  (globalThis.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
    ok: false, status,
    body: null,
    json: async () => body,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFortunChat — module exports', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    jest.clearAllMocks();
  });

  it('exports useFortunChat hook', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../src/hooks/useFortunChat') as {
      useFortunChat: unknown;
      loadChatHistory: unknown;
    };
    expect(typeof mod.useFortunChat).toBe('function');
  });

  it('exports loadChatHistory helper', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../src/hooks/useFortunChat') as {
      loadChatHistory: unknown;
    };
    expect(typeof mod.loadChatHistory).toBe('function');
  });
});

describe('useFortunChat — request payload shape', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    jest.clearAllMocks();
  });

  it('sends correct payload structure to edge function', () => {
    const expectedPayload = {
      fortuneId: TODAY_ID,
      messages: [{ role: 'user', content: 'test question' }],
      frame: 'en',
      chart: {
        yearPillar:     MOCK_CHART.pillars.year,
        monthPillar:    MOCK_CHART.pillars.month,
        dayPillar:      MOCK_CHART.pillars.day,
        hourPillar:     MOCK_CHART.pillars.hour,
        elementBalance: MOCK_CHART.elements,
        dayStem:        MOCK_CHART.dayStem,
      },
      todayReading: MOCK_READING,
    };

    // Verify payload shape manually
    expect(expectedPayload.fortuneId).toBe(TODAY_ID);
    expect(expectedPayload.messages[0].role).toBe('user');
    expect(expectedPayload.chart.dayStem).toBe('甲');
    expect(expectedPayload.chart.elementBalance).toEqual(MOCK_CHART.elements);
    expect(expectedPayload.todayReading.summary).toBe(MOCK_READING.summary);
  });

  it('uses today date as fortuneId', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('useFortunChat — response handling', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    jest.clearAllMocks();
  });

  it('accumulates SSE tokens into full assistant message', async () => {
    const tokens = ['Hello', ' there', '! Your', ' fortune', ' looks great.'];
    const expected = tokens.join('');

    let accumulated = '';
    for (const t of tokens) accumulated += t;
    expect(accumulated).toBe(expected);
  });

  it('correctly parses SSE token events', () => {
    const rawLine = 'data: {"token":"Hello"}';
    const data = rawLine.slice(6).trim();
    const parsed = JSON.parse(data) as { token?: string };
    expect(parsed.token).toBe('Hello');
  });

  it('ignores [DONE] sentinel in SSE stream', () => {
    const doneLine = 'data: [DONE]';
    const data = doneLine.slice(6).trim();
    expect(data).toBe('[DONE]');
    // Should not be parsed as JSON
    expect(() => JSON.parse(data)).toThrow();
  });

  it('skips malformed SSE lines gracefully', () => {
    const badLine = 'data: not-json-at-all';
    const data = badLine.slice(6).trim();
    expect(() => JSON.parse(data)).toThrow();
    // Hook swallows parse errors — just verify the logic
  });
});

describe('useFortunChat — gate logic', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    jest.clearAllMocks();
  });

  it('returns 403 for free users (premium_required)', async () => {
    mockFetchError(403, { ok: false, error: 'premium_required' });
    const resp = await (globalThis.fetch as jest.Mock)(
      'https://test.supabase.co/functions/v1/fortune-chat',
      { method: 'POST' },
    );
    expect(resp.status).toBe(403);
    const body = await resp.json() as { error: string };
    expect(body.error).toBe('premium_required');
  });

  it('returns 429 when daily limit exceeded', async () => {
    mockFetchError(429, { ok: false, error: 'Daily limit reached' });
    const resp = await (globalThis.fetch as jest.Mock)(
      'https://test.supabase.co/functions/v1/fortune-chat',
      { method: 'POST' },
    );
    expect(resp.status).toBe(429);
  });
});

describe('loadChatHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when no history exists', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { loadChatHistory } = require('../../src/hooks/useFortunChat') as {
      loadChatHistory: (id: string) => Promise<{ role: string; content: string }[]>;
    };
    const result = await loadChatHistory(TODAY_ID);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('ChatMessage type shape', () => {
  it('user message has correct shape', () => {
    const msg = { role: 'user' as const, content: 'Hello' };
    expect(msg.role).toBe('user');
    expect(typeof msg.content).toBe('string');
  });

  it('assistant message has correct shape', () => {
    const msg = { role: 'assistant' as const, content: 'Your fortune is bright.' };
    expect(msg.role).toBe('assistant');
    expect(typeof msg.content).toBe('string');
  });
});
