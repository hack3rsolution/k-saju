/**
 * journalStore — pure Zustand store, no native dependencies.
 */
import { useJournalStore } from '../../src/store/journalStore';
import { LifeEvent } from '../../src/types/journal';

const MOCK_EVENT: LifeEvent = {
  id:        'evt-1',
  userId:    'user-1',
  title:     'Got promoted',
  category:  'career' as const,
  eventDate: '2024-06-01',
  sentiment: 'positive' as const,
  createdAt: '2024-06-01T10:00:00Z',
};

const MOCK_EVENT_2: LifeEvent = {
  ...MOCK_EVENT,
  id:        'evt-2',
  title:     'Broke up',
  category:  'love' as const,
  eventDate: '2023-09-15',
  sentiment: 'negative' as const,
};

function resetStore() {
  useJournalStore.setState({ events: [] });
}

describe('journalStore', () => {
  beforeEach(resetStore);

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts with empty events', () => {
    expect(useJournalStore.getState().events).toHaveLength(0);
  });

  // ── setEvents ─────────────────────────────────────────────────────────────

  it('setEvents replaces the list', () => {
    useJournalStore.getState().setEvents([MOCK_EVENT, MOCK_EVENT_2]);
    expect(useJournalStore.getState().events).toHaveLength(2);
  });

  it('setEvents with empty array clears list', () => {
    useJournalStore.getState().setEvents([MOCK_EVENT]);
    useJournalStore.getState().setEvents([]);
    expect(useJournalStore.getState().events).toHaveLength(0);
  });

  // ── addEvent ──────────────────────────────────────────────────────────────

  it('addEvent prepends to the list', () => {
    useJournalStore.getState().addEvent(MOCK_EVENT);
    useJournalStore.getState().addEvent(MOCK_EVENT_2);

    const list = useJournalStore.getState().events;
    expect(list).toHaveLength(2);
    expect(list[0]!.id).toBe('evt-2'); // most recent first
  });

  it('addEvent preserves all fields', () => {
    useJournalStore.getState().addEvent(MOCK_EVENT);
    const evt = useJournalStore.getState().events[0]!;
    expect(evt.title).toBe('Got promoted');
    expect(evt.category).toBe('career');
    expect(evt.sentiment).toBe('positive');
    expect(evt.eventDate).toBe('2024-06-01');
  });

  // ── removeEvent ───────────────────────────────────────────────────────────

  it('removeEvent removes by id', () => {
    useJournalStore.getState().setEvents([MOCK_EVENT, MOCK_EVENT_2]);
    useJournalStore.getState().removeEvent('evt-1');

    const list = useJournalStore.getState().events;
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe('evt-2');
  });

  it('removeEvent is a no-op for unknown id', () => {
    useJournalStore.getState().setEvents([MOCK_EVENT]);
    useJournalStore.getState().removeEvent('unknown-id');
    expect(useJournalStore.getState().events).toHaveLength(1);
  });

  // ── clear ─────────────────────────────────────────────────────────────────

  it('clear empties the list', () => {
    useJournalStore.getState().setEvents([MOCK_EVENT, MOCK_EVENT_2]);
    useJournalStore.getState().clear();
    expect(useJournalStore.getState().events).toHaveLength(0);
  });

  it('clear is idempotent', () => {
    useJournalStore.getState().clear();
    useJournalStore.getState().clear();
    expect(useJournalStore.getState().events).toHaveLength(0);
  });

  // ── multiple operations ───────────────────────────────────────────────────

  it('add then remove leaves correct list', () => {
    useJournalStore.getState().addEvent(MOCK_EVENT);
    useJournalStore.getState().addEvent(MOCK_EVENT_2);
    useJournalStore.getState().removeEvent('evt-1');
    const list = useJournalStore.getState().events;
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe('evt-2');
  });

  it('setEvents overwrites previous addEvent calls', () => {
    useJournalStore.getState().addEvent(MOCK_EVENT);
    useJournalStore.getState().setEvents([MOCK_EVENT_2]);
    const list = useJournalStore.getState().events;
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe('evt-2');
  });
});
