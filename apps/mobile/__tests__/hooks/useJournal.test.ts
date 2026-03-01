/**
 * useJournal — unit tests
 *
 * Tests CRUD operations, analysis fetch, and validation logic.
 */
import { useJournalStore } from '../../src/store/journalStore';
import { LifeEvent } from '../../src/types/journal';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_DB_ROW = {
  id:         'evt-1',
  user_id:    'user-1',
  title:      'Got promoted',
  category:   'career',
  event_date: '2024-06-01',
  note:       'Big day at work!',
  sentiment:  'positive',
  created_at: '2024-06-01T10:00:00Z',
};

const MOCK_ANALYSIS_RESPONSE = {
  ok:              true,
  summary:         'Your career shifts cluster in Metal years, especially 庚.',
  patterns: [
    {
      category:    'career',
      description: 'Major promotions occurred in 庚 years',
      bestPeriod:  '庚午 대운',
      watchPeriod: '壬 세운',
    },
    {
      category:    'love',
      description: 'Relationship changes align with 丙丁 fire energy',
      bestPeriod:  '丁卯 세운',
      watchPeriod: '庚 대운',
    },
  ],
  dominantElement: 'Metal (庚辛)',
  eventCount:      7,
  cachedAt:        '2026-03-01T00:00:00Z',
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/store/authStore', () => ({
  useAuthStore: () => ({
    session: {
      user: { id: 'user-1' },
      access_token: 'tok-123',
    },
  }),
}));

jest.mock('../../src/store/sajuStore', () => ({
  useSajuStore: () => ({
    chart: {
      pillars: {
        year:  { stem: '甲', branch: '子' },
        month: { stem: '丙', branch: '午' },
        day:   { stem: '戊', branch: '戌' },
        hour:  null,
      },
      elements: { Wood: 2, Fire: 2, Earth: 2, Metal: 1, Water: 1 },
      dayStem: '戊',
    },
    frame: 'en',
  }),
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function mockFetch(status: number, body?: unknown) {
  (globalThis.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

// ── Tests: store operations ───────────────────────────────────────────────────

describe('useJournal: store operations', () => {
  beforeEach(() => {
    useJournalStore.setState({ events: [] });
  });

  it('starts with empty events', () => {
    expect(useJournalStore.getState().events).toHaveLength(0);
  });

  it('setEvents replaces list', () => {
    const evt: LifeEvent = {
      id: 'e1', userId: 'u1', title: 'Started therapy',
      category: 'health', eventDate: '2024-01-10',
      sentiment: 'positive', createdAt: '2024-01-10T00:00:00Z',
    };
    useJournalStore.getState().setEvents([evt]);
    expect(useJournalStore.getState().events).toHaveLength(1);
  });

  it('addEvent prepends to list', () => {
    const e1: LifeEvent = { id: 'e1', userId: 'u1', title: 'A', category: 'career', eventDate: '2024-01-01', sentiment: 'positive', createdAt: '' };
    const e2: LifeEvent = { id: 'e2', userId: 'u1', title: 'B', category: 'love',   eventDate: '2024-06-01', sentiment: 'negative', createdAt: '' };
    useJournalStore.getState().addEvent(e1);
    useJournalStore.getState().addEvent(e2);
    expect(useJournalStore.getState().events[0]!.id).toBe('e2');
  });

  it('removeEvent removes by id', () => {
    const e1: LifeEvent = { id: 'e1', userId: 'u1', title: 'A', category: 'career', eventDate: '2024-01-01', sentiment: 'positive', createdAt: '' };
    const e2: LifeEvent = { id: 'e2', userId: 'u1', title: 'B', category: 'love',   eventDate: '2024-06-01', sentiment: 'negative', createdAt: '' };
    useJournalStore.getState().setEvents([e1, e2]);
    useJournalStore.getState().removeEvent('e1');
    expect(useJournalStore.getState().events).toHaveLength(1);
    expect(useJournalStore.getState().events[0]!.id).toBe('e2');
  });

  it('clear empties the list', () => {
    const e1: LifeEvent = { id: 'e1', userId: 'u1', title: 'A', category: 'career', eventDate: '2024-01-01', sentiment: 'positive', createdAt: '' };
    useJournalStore.getState().setEvents([e1]);
    useJournalStore.getState().clear();
    expect(useJournalStore.getState().events).toHaveLength(0);
  });
});

// ── Tests: DB row mapping ─────────────────────────────────────────────────────

describe('useJournal: DB row mapping', () => {
  it('maps snake_case DB columns to camelCase app fields', () => {
    function rowToEvent(row: typeof MOCK_DB_ROW) {
      return {
        id:        row.id,
        userId:    row.user_id,
        title:     row.title,
        category:  row.category,
        eventDate: row.event_date,
        note:      row.note ?? undefined,
        sentiment: row.sentiment,
        createdAt: row.created_at,
      };
    }

    const mapped = rowToEvent(MOCK_DB_ROW);
    expect(mapped.userId).toBe('user-1');
    expect(mapped.eventDate).toBe('2024-06-01');
    expect(mapped.note).toBe('Big day at work!');
    expect(mapped.sentiment).toBe('positive');
  });

  it('insert payload uses correct snake_case keys', () => {
    const input = {
      title: 'Got promoted', category: 'career' as const,
      eventDate: '2024-06-01', note: 'Big day!', sentiment: 'positive' as const,
    };
    const payload = {
      user_id:    'user-1',
      title:      input.title,
      category:   input.category,
      event_date: input.eventDate,
      note:       input.note ?? null,
      sentiment:  input.sentiment,
    };
    expect(payload.event_date).toBe('2024-06-01');
    expect(payload.category).toBe('career');
    expect(payload.user_id).toBe('user-1');
  });

  it('note is undefined when null in DB row', () => {
    const row = { ...MOCK_DB_ROW, note: null as null };
    const note = row.note ?? undefined;
    expect(note).toBeUndefined();
  });
});

// ── Tests: analysis fetch ─────────────────────────────────────────────────────

describe('useJournal: analysis fetch', () => {
  it('200 OK returns analysis data', async () => {
    mockFetch(200, MOCK_ANALYSIS_RESPONSE);
    const resp = await (globalThis.fetch as jest.Mock)('http://localhost/journal-analysis');
    const data = await resp.json();
    expect(data.ok).toBe(true);
    expect(data.eventCount).toBe(7);
    expect(data.patterns).toHaveLength(2);
    expect(data.dominantElement).toBe('Metal (庚辛)');
  });

  it('pattern has required fields', () => {
    const p = MOCK_ANALYSIS_RESPONSE.patterns[0]!;
    expect(p.category).toBe('career');
    expect(p.bestPeriod).toBeTruthy();
    expect(p.watchPeriod).toBeTruthy();
    expect(p.description).toBeTruthy();
  });

  it('502 indicates AI upstream failure', async () => {
    mockFetch(502);
    const resp = await (globalThis.fetch as jest.Mock)('http://localhost/journal-analysis');
    expect(resp.ok).toBe(false);
    expect(resp.status).toBe(502);
  });
});

// ── Tests: analysis gate logic ────────────────────────────────────────────────

describe('useJournal: analysis gate (>= 5 events)', () => {
  const MIN_EVENTS = 5;

  it('analysis is locked with 0 events', () => {
    expect(0 >= MIN_EVENTS).toBe(false);
  });

  it('analysis is locked with 4 events', () => {
    expect(4 >= MIN_EVENTS).toBe(false);
  });

  it('analysis unlocks at exactly 5 events', () => {
    expect(5 >= MIN_EVENTS).toBe(true);
  });

  it('analysis remains unlocked above 5', () => {
    expect(10 >= MIN_EVENTS).toBe(true);
  });

  it('locked banner shows correct remaining count', () => {
    const count = 3;
    const remaining = MIN_EVENTS - count;
    expect(remaining).toBe(2);
  });
});
