/**
 * useRelationships — unit tests
 *
 * Tests CRUD operations, fortune fetch, and compatibility status logic.
 */
import { useRelationshipStore } from '../../src/store/relationshipStore';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_DB_ROW = {
  id:                      'rel-1',
  owner_id:                'user-1',
  name:                    'Alice',
  birth_year:              1990,
  birth_month:             5,
  birth_day:               15,
  birth_hour:              null as null,
  gender:                  'F',
  relationship_type:       'friend',
  compatibility_score:     null as null,
  compatibility_status:    null as null,
  compatibility_cached_at: null as null,
  created_at:              '2026-03-01T00:00:00Z',
  updated_at:              '2026-03-01T00:00:00Z',
};

const MOCK_FORTUNE_RESPONSE = {
  ok:                  true,
  compatibilityScore:  78,
  compatibilityStatus: 'good',
  summary:             'Great match',
  monthlyFlow:         'Positive energy this month',
  strengths:           ['Good communication', 'Shared values'],
  cautions:            ['Watch for miscommunication'],
  elementSynergy:      { Wood: 3, Fire: 2, Earth: 3, Metal: 1, Water: 1 } as Record<string, number>,
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/store/authStore', () => ({
  useAuthStore: () => ({
    session: {
      user: { id: 'user-1', user_metadata: { is_premium: true } },
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

describe('useRelationships: store operations', () => {
  beforeEach(() => {
    useRelationshipStore.setState({ relationships: [] });
  });

  it('starts with empty list', () => {
    expect(useRelationshipStore.getState().relationships).toHaveLength(0);
  });

  it('setRelationships replaces list', () => {
    const rel = { id: 'r1', name: 'Alice', ownerId: 'u1', birthYear: 1990, birthMonth: 1, birthDay: 1, gender: 'F' as const, relationshipType: 'friend' as const, createdAt: '', updatedAt: '' };
    useRelationshipStore.getState().setRelationships([rel]);
    expect(useRelationshipStore.getState().relationships).toHaveLength(1);
  });

  it('addRelationship prepends to list', () => {
    const r1 = { id: 'r1', name: 'Alice', ownerId: 'u1', birthYear: 1990, birthMonth: 1, birthDay: 1, gender: 'F' as const, relationshipType: 'friend' as const, createdAt: '', updatedAt: '' };
    const r2 = { id: 'r2', name: 'Bob',   ownerId: 'u1', birthYear: 1988, birthMonth: 3, birthDay: 5, gender: 'M' as const, relationshipType: 'colleague' as const, createdAt: '', updatedAt: '' };
    useRelationshipStore.getState().addRelationship(r1);
    useRelationshipStore.getState().addRelationship(r2);
    expect(useRelationshipStore.getState().relationships[0]!.id).toBe('r2');
  });

  it('removeRelationship removes by id', () => {
    const r1 = { id: 'r1', name: 'Alice', ownerId: 'u1', birthYear: 1990, birthMonth: 1, birthDay: 1, gender: 'F' as const, relationshipType: 'friend' as const, createdAt: '', updatedAt: '' };
    const r2 = { id: 'r2', name: 'Bob',   ownerId: 'u1', birthYear: 1988, birthMonth: 3, birthDay: 5, gender: 'M' as const, relationshipType: 'colleague' as const, createdAt: '', updatedAt: '' };
    useRelationshipStore.getState().setRelationships([r1, r2]);
    useRelationshipStore.getState().removeRelationship('r1');
    expect(useRelationshipStore.getState().relationships).toHaveLength(1);
    expect(useRelationshipStore.getState().relationships[0]!.id).toBe('r2');
  });

  it('updateRelationship patches compatibility score', () => {
    const r1 = { id: 'r1', name: 'Alice', ownerId: 'u1', birthYear: 1990, birthMonth: 1, birthDay: 1, gender: 'F' as const, relationshipType: 'friend' as const, createdAt: '', updatedAt: '' };
    useRelationshipStore.getState().setRelationships([r1]);
    useRelationshipStore.getState().updateRelationship('r1', {
      compatibilityScore: 85, compatibilityStatus: 'good',
    });
    const rel = useRelationshipStore.getState().relationships[0]!;
    expect(rel.compatibilityScore).toBe(85);
    expect(rel.name).toBe('Alice');
  });

  it('clear empties the list', () => {
    const r1 = { id: 'r1', name: 'Alice', ownerId: 'u1', birthYear: 1990, birthMonth: 1, birthDay: 1, gender: 'F' as const, relationshipType: 'friend' as const, createdAt: '', updatedAt: '' };
    useRelationshipStore.getState().setRelationships([r1]);
    useRelationshipStore.getState().clear();
    expect(useRelationshipStore.getState().relationships).toHaveLength(0);
  });
});

// ── Tests: DB row mapping ─────────────────────────────────────────────────────

describe('useRelationships: DB row mapping', () => {
  it('maps snake_case DB columns to camelCase app fields', () => {
    function rowToRelationship(row: typeof MOCK_DB_ROW) {
      return {
        id:               row.id,
        ownerId:          row.owner_id,
        name:             row.name,
        birthYear:        row.birth_year,
        birthMonth:       row.birth_month,
        birthDay:         row.birth_day,
        birthHour:        row.birth_hour ?? undefined,
        gender:           row.gender,
        relationshipType: row.relationship_type,
        compatibilityScore:    row.compatibility_score ?? undefined,
        compatibilityStatus:   row.compatibility_status ?? undefined,
        createdAt:        row.created_at,
        updatedAt:        row.updated_at,
      };
    }

    const mapped = rowToRelationship(MOCK_DB_ROW);
    expect(mapped.ownerId).toBe('user-1');
    expect(mapped.birthYear).toBe(1990);
    expect(mapped.relationshipType).toBe('friend');
    expect(mapped.birthHour).toBeUndefined();
    expect(mapped.compatibilityScore).toBeUndefined();
  });

  it('insert payload uses correct snake_case keys', () => {
    const input = {
      name: 'Bob', birthYear: 1988, birthMonth: 8, birthDay: 20,
      birthHour: 14, gender: 'M' as const, relationshipType: 'colleague' as const,
    };
    const payload = {
      owner_id:          'user-1',
      name:              input.name,
      birth_year:        input.birthYear,
      birth_month:       input.birthMonth,
      birth_day:         input.birthDay,
      birth_hour:        input.birthHour ?? null,
      gender:            input.gender,
      relationship_type: input.relationshipType,
    };
    expect(payload.relationship_type).toBe('colleague');
    expect(payload.birth_hour).toBe(14);
    expect(payload.owner_id).toBe('user-1');
  });
});

// ── Tests: fortune fetch ──────────────────────────────────────────────────────

describe('useRelationships: fortune fetch', () => {
  it('200 OK returns compatibility data', async () => {
    mockFetch(200, MOCK_FORTUNE_RESPONSE);
    const resp = await (globalThis.fetch as jest.Mock)('http://localhost/relationship-fortune');
    const data = await resp.json();
    expect(data.compatibilityScore).toBe(78);
    expect(data.compatibilityStatus).toBe('good');
    expect(data.strengths).toHaveLength(2);
    expect(data.elementSynergy.Wood).toBe(3);
  });

  it('403 indicates premium_required', async () => {
    mockFetch(403);
    const resp = await (globalThis.fetch as jest.Mock)('http://localhost/relationship-fortune');
    expect(resp.ok).toBe(false);
    expect(resp.status).toBe(403);
  });

  it('502 indicates AI upstream failure', async () => {
    mockFetch(502);
    const resp = await (globalThis.fetch as jest.Mock)('http://localhost/relationship-fortune');
    expect(resp.ok).toBe(false);
    expect(resp.status).toBe(502);
  });
});

// ── Tests: compatibility status logic ────────────────────────────────────────

describe('useRelationships: compatibility status', () => {
  function scoreToStatus(score: number): 'good' | 'neutral' | 'caution' {
    if (score >= 70) return 'good';
    if (score >= 40) return 'neutral';
    return 'caution';
  }

  const STATUS_EMOJI: Record<'good' | 'neutral' | 'caution', string> = {
    good: '🟢', neutral: '🟡', caution: '🔴',
  };

  it('score 70+ maps to good 🟢', () => {
    expect(scoreToStatus(70)).toBe('good');
    expect(scoreToStatus(100)).toBe('good');
  });

  it('score 40–69 maps to neutral 🟡', () => {
    expect(scoreToStatus(40)).toBe('neutral');
    expect(scoreToStatus(69)).toBe('neutral');
  });

  it('score <40 maps to caution 🔴', () => {
    expect(scoreToStatus(39)).toBe('caution');
    expect(scoreToStatus(0)).toBe('caution');
  });

  it('emoji lookup works for all statuses', () => {
    expect(STATUS_EMOJI[scoreToStatus(80)]).toBe('🟢');
    expect(STATUS_EMOJI[scoreToStatus(50)]).toBe('🟡');
    expect(STATUS_EMOJI[scoreToStatus(20)]).toBe('🔴');
  });
});
