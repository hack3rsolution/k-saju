/**
 * authStore — tests for synchronous state updates (setSession, signOut).
 * Async provider methods (signInWithMagicLink, etc.) that require real Supabase
 * calls are integration-tested separately and excluded here.
 */
import { useAuthStore } from '../../src/store/authStore';
import type { Session, User } from '@supabase/supabase-js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-abc-123',
    email: 'test@k-saju.app',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata:  {},
    user_metadata: { onboarding_completed: true },
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as User;
}

function makeSession(user: User): Session {
  return {
    user,
    access_token:  'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type:    'bearer',
    expires_in:    3600,
    expires_at:    Date.now() / 1000 + 3600,
  } as Session;
}

function resetStore() {
  useAuthStore.setState({ user: null, session: null, initialized: false });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('authStore', () => {
  beforeEach(resetStore);

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts unauthenticated and uninitialised', () => {
    const { user, session, initialized } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(session).toBeNull();
    expect(initialized).toBe(false);
  });

  // ── setSession ────────────────────────────────────────────────────────────

  it('setSession stores user and session, marks initialized', () => {
    const user    = makeUser();
    const session = makeSession(user);

    useAuthStore.getState().setSession(session);

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe('user-abc-123');
    expect(state.session?.access_token).toBe('mock-access-token');
    expect(state.initialized).toBe(true);
  });

  it('setSession(null) clears user and session but keeps initialized=true', () => {
    const user    = makeUser();
    const session = makeSession(user);
    useAuthStore.getState().setSession(session);

    useAuthStore.getState().setSession(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.initialized).toBe(true);
  });

  it('setSession exposes user metadata', () => {
    const user = makeUser({ user_metadata: { cultural_frame: 'kr', birth_year: 1990 } });
    useAuthStore.getState().setSession(makeSession(user));

    const meta = useAuthStore.getState().user?.user_metadata;
    expect(meta?.cultural_frame).toBe('kr');
    expect(meta?.birth_year).toBe(1990);
  });

  it('consecutive setSession calls update to the latest user', () => {
    const user1 = makeUser({ id: 'user-1' });
    const user2 = makeUser({ id: 'user-2', email: 'other@k-saju.app' });

    useAuthStore.getState().setSession(makeSession(user1));
    useAuthStore.getState().setSession(makeSession(user2));

    expect(useAuthStore.getState().user?.id).toBe('user-2');
  });

  // ── signOut ───────────────────────────────────────────────────────────────

  it('signOut clears user and session', async () => {
    const user = makeUser();
    useAuthStore.setState({ user, session: makeSession(user), initialized: true });

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });
});
