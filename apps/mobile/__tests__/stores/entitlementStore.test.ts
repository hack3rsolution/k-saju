/**
 * entitlementStore — pure Zustand store, no native dependencies.
 */
import { useEntitlementStore } from '../../src/store/entitlementStore';

const DEFAULT_ADDONS = {
  deepCompatibility: false,
  careerWealth:      false,
  daewoonPdf:        false,
  nameAnalysis:      false,
};

function resetStore() {
  useEntitlementStore.setState({
    isPremium:  false,
    addons:     DEFAULT_ADDONS,
    isLoading:  false,
  });
}

describe('entitlementStore', () => {
  beforeEach(resetStore);

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts with free tier defaults', () => {
    const { isPremium, addons, isLoading } = useEntitlementStore.getState();
    expect(isPremium).toBe(false);
    expect(addons).toEqual(DEFAULT_ADDONS);
    expect(isLoading).toBe(false);
  });

  // ── setEntitlements ───────────────────────────────────────────────────────

  it('setEntitlements marks user as premium', () => {
    useEntitlementStore.getState().setEntitlements(true, DEFAULT_ADDONS);

    const { isPremium, isLoading } = useEntitlementStore.getState();
    expect(isPremium).toBe(true);
    expect(isLoading).toBe(false);
  });

  it('setEntitlements unlocks individual addons', () => {
    const addons = {
      deepCompatibility: true,
      careerWealth:      true,
      daewoonPdf:        false,
      nameAnalysis:      false,
    };
    useEntitlementStore.getState().setEntitlements(false, addons);

    const state = useEntitlementStore.getState();
    expect(state.addons.deepCompatibility).toBe(true);
    expect(state.addons.careerWealth).toBe(true);
    expect(state.addons.daewoonPdf).toBe(false);
    expect(state.addons.nameAnalysis).toBe(false);
  });

  it('setEntitlements clears isLoading', () => {
    useEntitlementStore.setState({ isLoading: true });
    useEntitlementStore.getState().setEntitlements(false, DEFAULT_ADDONS);
    expect(useEntitlementStore.getState().isLoading).toBe(false);
  });

  // ── setLoading ────────────────────────────────────────────────────────────

  it('setLoading updates the loading flag', () => {
    useEntitlementStore.getState().setLoading(true);
    expect(useEntitlementStore.getState().isLoading).toBe(true);

    useEntitlementStore.getState().setLoading(false);
    expect(useEntitlementStore.getState().isLoading).toBe(false);
  });

  // ── reset ─────────────────────────────────────────────────────────────────

  it('reset clears premium and all addons', () => {
    useEntitlementStore.setState({
      isPremium: true,
      addons: { deepCompatibility: true, careerWealth: true, daewoonPdf: true, nameAnalysis: true },
      isLoading: true,
    });

    useEntitlementStore.getState().reset();

    const { isPremium, addons, isLoading } = useEntitlementStore.getState();
    expect(isPremium).toBe(false);
    expect(addons).toEqual(DEFAULT_ADDONS);
    expect(isLoading).toBe(false);
  });

  it('reset is idempotent when already at defaults', () => {
    useEntitlementStore.getState().reset();
    useEntitlementStore.getState().reset();

    expect(useEntitlementStore.getState().isPremium).toBe(false);
  });
});
