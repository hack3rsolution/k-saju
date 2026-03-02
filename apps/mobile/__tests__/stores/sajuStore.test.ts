/**
 * sajuStore — manages saju chart, daewoon, birthData, and cultural frame.
 * No external side-effects: pure Zustand state updates.
 */
import { useSajuStore } from '../../src/store/sajuStore';
import type { SajuChart, DaewoonPeriod, BirthData, FourPillars } from '@k-saju/saju-engine';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_PILLARS = {
  year:  { stem: '庚', branch: '午' },
  month: { stem: '丁', branch: '卯' },
  day:   { stem: '甲', branch: '子' },
  hour:  null,
};

const MOCK_ELEMENTS = { Wood: 3, Fire: 1, Earth: 1, Metal: 2, Water: 1 };

const MOCK_CHART: SajuChart = {
  pillars:    MOCK_PILLARS as FourPillars,
  elements:   MOCK_ELEMENTS,
  dayStem:    '甲',
  dayElement: '木',
};

const MOCK_BIRTH: BirthData = {
  year: 1990, month: 5, day: 15, gender: 'M',
};

const MOCK_DAEWOON: DaewoonPeriod[] = [
  { index: 0, startAge: 8,  pillar: { stem: '戊', branch: '午' }, element: '土' },
  { index: 1, startAge: 18, pillar: { stem: '己', branch: '未' }, element: '土' },
];

function resetStore() {
  useSajuStore.setState({
    chart:     null,
    daewoon:   [],
    birthData: null,
    frame:     null,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('sajuStore', () => {
  beforeEach(resetStore);

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts with null chart and empty daewoon', () => {
    const { chart, daewoon, birthData, frame } = useSajuStore.getState();
    expect(chart).toBeNull();
    expect(daewoon).toEqual([]);
    expect(birthData).toBeNull();
    expect(frame).toBeNull();
  });

  // ── setChart ──────────────────────────────────────────────────────────────

  it('setChart stores all four arguments', () => {
    useSajuStore.getState().setChart(MOCK_CHART, MOCK_BIRTH, MOCK_DAEWOON, 'kr');

    const state = useSajuStore.getState();
    expect(state.chart).toEqual(MOCK_CHART);
    expect(state.birthData).toEqual(MOCK_BIRTH);
    expect(state.daewoon).toHaveLength(2);
    expect(state.frame).toBe('kr');
  });

  it('setChart updates the day stem correctly', () => {
    useSajuStore.getState().setChart(MOCK_CHART, MOCK_BIRTH, MOCK_DAEWOON, 'en');
    expect(useSajuStore.getState().chart?.dayStem).toBe('甲');
  });

  it('setChart overwrites a previous chart', () => {
    const firstChart: SajuChart = { ...MOCK_CHART, dayStem: '丙', dayElement: '火' };
    useSajuStore.getState().setChart(firstChart, MOCK_BIRTH, [], 'cn');

    useSajuStore.getState().setChart(MOCK_CHART, MOCK_BIRTH, MOCK_DAEWOON, 'kr');

    expect(useSajuStore.getState().chart?.dayStem).toBe('甲');
    expect(useSajuStore.getState().frame).toBe('kr');
  });

  it('setChart accepts all six cultural frames', () => {
    const frames = ['kr', 'cn', 'jp', 'en', 'es', 'in'] as const;
    for (const f of frames) {
      useSajuStore.getState().setChart(MOCK_CHART, MOCK_BIRTH, [], f);
      expect(useSajuStore.getState().frame).toBe(f);
    }
  });

  it('daewoon array is stored in order', () => {
    useSajuStore.getState().setChart(MOCK_CHART, MOCK_BIRTH, MOCK_DAEWOON, 'en');
    const stored = useSajuStore.getState().daewoon;
    expect(stored[0].startAge).toBe(8);
    expect(stored[1].startAge).toBe(18);
  });

  // ── clear ─────────────────────────────────────────────────────────────────

  it('clear resets everything to initial state', () => {
    useSajuStore.getState().setChart(MOCK_CHART, MOCK_BIRTH, MOCK_DAEWOON, 'jp');
    useSajuStore.getState().clear();

    const { chart, daewoon, birthData, frame } = useSajuStore.getState();
    expect(chart).toBeNull();
    expect(daewoon).toEqual([]);
    expect(birthData).toBeNull();
    expect(frame).toBeNull();
  });

  it('clear is safe to call when already empty', () => {
    useSajuStore.getState().clear();
    expect(useSajuStore.getState().chart).toBeNull();
  });
});
