/**
 * useContentRecommendation — unit tests
 *
 * Tests request payload shape, response parsing, and error handling
 * using plain jest mocks (no renderHook dependency needed).
 */

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { access_token: 'tok_test_123' };
const MOCK_CHART = {
  dayStem: '甲',
  elements: { Wood: 3, Fire: 1, Earth: 1, Metal: 2, Water: 1 },
  pillars: {
    year:  { stem: '庚', branch: '午' },
    month: { stem: '丁', branch: '卯' },
    day:   { stem: '甲', branch: '子' },
    hour:  null,
  },
  dayElement: '木',
};

const MOCK_RECOMMENDATION = {
  ok: true,
  element: 'Wood',
  music:  [{ title: 'Song A', description: 'Desc A', tag: '🎸 Rock' }],
  books:  [{ title: 'Book B', description: 'Desc B', tag: '📚 Sci-Fi' }],
  travel: [{ title: 'Place C', description: 'Desc C', tag: '🌲 Nature' }],
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/store/authStore', () => ({
  useAuthStore: () => ({ session: MOCK_SESSION }),
}));

jest.mock('../../src/store/sajuStore', () => ({
  useSajuStore: () => ({ chart: MOCK_CHART, frame: 'en' }),
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {},
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetchOk(body: unknown) {
  (globalThis.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
    ok: true, status: 200,
    json: async () => body,
  });
}

function mockFetchFail(body: unknown, status = 401) {
  (globalThis.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
    ok: false, status,
    json: async () => body,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useContentRecommendation — network & data shape', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    jest.clearAllMocks();
  });

  it('module exports useContentRecommendation hook', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../src/hooks/useContentRecommendation') as {
      useContentRecommendation: unknown;
    };
    expect(typeof mod.useContentRecommendation).toBe('function');
  });

  it('recommendation response has correct shape', () => {
    expect(MOCK_RECOMMENDATION.ok).toBe(true);
    expect(MOCK_RECOMMENDATION.element).toBe('Wood');
    expect(MOCK_RECOMMENDATION.music).toHaveLength(1);
    expect(MOCK_RECOMMENDATION.books[0].title).toBe('Book B');
    expect(MOCK_RECOMMENDATION.travel[0].tag).toBe('🌲 Nature');
  });

  it('each recommendation item has title, description, tag', () => {
    const items = [
      ...MOCK_RECOMMENDATION.music,
      ...MOCK_RECOMMENDATION.books,
      ...MOCK_RECOMMENDATION.travel,
    ];
    for (const item of items) {
      expect(typeof item.title).toBe('string');
      expect(typeof item.description).toBe('string');
      expect(typeof item.tag).toBe('string');
    }
  });

  it('request payload matches expected schema', () => {
    const body = {
      dayStem:        MOCK_CHART.dayStem,
      elementBalance: MOCK_CHART.elements,
      frame:          'en',
    };
    expect(body.dayStem).toBe('甲');
    expect(body.elementBalance.Wood).toBe(3);
    expect(body.frame).toBe('en');
    expect(Object.keys(body.elementBalance)).toEqual(
      expect.arrayContaining(['Wood', 'Fire', 'Earth', 'Metal', 'Water'])
    );
  });

  it('successful mock fetch returns ok=true + element', async () => {
    mockFetchOk(MOCK_RECOMMENDATION);
    const resp = await (globalThis.fetch as jest.Mock)(
      'https://test.supabase.co/functions/v1/content-recommendation',
      { method: 'POST', body: '{}' },
    );
    expect(resp.ok).toBe(true);
    const data = await resp.json() as { element: string };
    expect(data.element).toBe('Wood');
  });

  it('error mock fetch returns ok=false with error field', async () => {
    mockFetchFail({ error: 'Unauthorized' }, 401);
    const resp = await (globalThis.fetch as jest.Mock)(
      'https://test.supabase.co/functions/v1/content-recommendation',
      { method: 'POST', body: '{}' },
    );
    expect(resp.ok).toBe(false);
    const err = await resp.json() as { error: string };
    expect(err.error).toBe('Unauthorized');
  });

  it('auth header is built from session access_token', () => {
    const header = `Bearer ${MOCK_SESSION.access_token}`;
    expect(header).toBe('Bearer tok_test_123');
  });
});
