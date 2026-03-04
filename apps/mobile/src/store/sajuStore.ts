import { create } from 'zustand';
import type { SajuChart, DaewoonPeriod, BirthData, CulturalFrame } from '@k-saju/saju-engine';

interface SajuState {
  chart: SajuChart | null;
  daewoon: DaewoonPeriod[];
  birthData: BirthData | null;
  frame: CulturalFrame | null;
  setChart: (
    chart: SajuChart,
    birth: BirthData,
    daewoon: DaewoonPeriod[],
    frame: CulturalFrame,
  ) => void;
  updateFrame: (frame: CulturalFrame) => void;
  clear: () => void;
}

export const useSajuStore = create<SajuState>((set) => ({
  chart: null,
  daewoon: [],
  birthData: null,
  frame: null,
  setChart: (chart, birthData, daewoon, frame) =>
    set({ chart, birthData, daewoon, frame }),
  updateFrame: (frame) => set({ frame }),
  clear: () => set({ chart: null, daewoon: [], birthData: null, frame: null }),
}));
