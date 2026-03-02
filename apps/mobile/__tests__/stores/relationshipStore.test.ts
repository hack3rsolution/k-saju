/**
 * relationshipStore — pure Zustand store, no native dependencies.
 */
import { useRelationshipStore } from '../../src/store/relationshipStore';

const MOCK_REL = {
  id:               'rel-1',
  ownerId:          'user-1',
  name:             'Alice',
  birthYear:        1990,
  birthMonth:       5,
  birthDay:         15,
  gender:           'F' as const,
  relationshipType: 'friend' as const,
  createdAt:        '2026-03-01T00:00:00Z',
  updatedAt:        '2026-03-01T00:00:00Z',
};

const MOCK_REL_2 = {
  ...MOCK_REL,
  id:               'rel-2',
  name:             'Bob',
  gender:           'M' as const,
  relationshipType: 'colleague' as const,
};

function resetStore() {
  useRelationshipStore.setState({ relationships: [] });
}

describe('relationshipStore', () => {
  beforeEach(resetStore);

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts with empty relationships', () => {
    expect(useRelationshipStore.getState().relationships).toHaveLength(0);
  });

  // ── setRelationships ──────────────────────────────────────────────────────

  it('setRelationships replaces the list', () => {
    useRelationshipStore.getState().setRelationships([MOCK_REL, MOCK_REL_2]);
    expect(useRelationshipStore.getState().relationships).toHaveLength(2);
  });

  it('setRelationships with empty array clears list', () => {
    useRelationshipStore.getState().setRelationships([MOCK_REL]);
    useRelationshipStore.getState().setRelationships([]);
    expect(useRelationshipStore.getState().relationships).toHaveLength(0);
  });

  // ── addRelationship ───────────────────────────────────────────────────────

  it('addRelationship prepends to the list', () => {
    useRelationshipStore.getState().addRelationship(MOCK_REL);
    useRelationshipStore.getState().addRelationship(MOCK_REL_2);

    const list = useRelationshipStore.getState().relationships;
    expect(list).toHaveLength(2);
    expect(list[0]!.id).toBe('rel-2'); // most recent first
  });

  // ── removeRelationship ────────────────────────────────────────────────────

  it('removeRelationship removes by id', () => {
    useRelationshipStore.getState().setRelationships([MOCK_REL, MOCK_REL_2]);
    useRelationshipStore.getState().removeRelationship('rel-1');

    const list = useRelationshipStore.getState().relationships;
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe('rel-2');
  });

  it('removeRelationship is a no-op for unknown id', () => {
    useRelationshipStore.getState().setRelationships([MOCK_REL]);
    useRelationshipStore.getState().removeRelationship('unknown-id');
    expect(useRelationshipStore.getState().relationships).toHaveLength(1);
  });

  // ── updateRelationship ────────────────────────────────────────────────────

  it('updateRelationship patches matching relationship', () => {
    useRelationshipStore.getState().setRelationships([MOCK_REL]);
    useRelationshipStore.getState().updateRelationship('rel-1', {
      compatibilityScore:  85,
      compatibilityStatus: 'good',
    });

    const rel = useRelationshipStore.getState().relationships[0]!;
    expect(rel.compatibilityScore).toBe(85);
    expect(rel.compatibilityStatus).toBe('good');
    expect(rel.name).toBe('Alice'); // unchanged
  });

  it('updateRelationship is a no-op for unknown id', () => {
    useRelationshipStore.getState().setRelationships([MOCK_REL]);
    useRelationshipStore.getState().updateRelationship('unknown', { name: 'Changed' });
    expect(useRelationshipStore.getState().relationships[0]!.name).toBe('Alice');
  });

  // ── clear ─────────────────────────────────────────────────────────────────

  it('clear empties the list', () => {
    useRelationshipStore.getState().setRelationships([MOCK_REL, MOCK_REL_2]);
    useRelationshipStore.getState().clear();
    expect(useRelationshipStore.getState().relationships).toHaveLength(0);
  });

  it('clear is idempotent', () => {
    useRelationshipStore.getState().clear();
    useRelationshipStore.getState().clear();
    expect(useRelationshipStore.getState().relationships).toHaveLength(0);
  });
});
