/**
 * reportCacheStore — in-memory (Zustand) cache for generated add-on reports.
 *
 * Survives tab switches within the same app session.
 * Long-term persistence is handled separately via AsyncStorage in useCachedAddonReport.
 */
import { create } from 'zustand';
import type { AddonReport } from '../hooks/useAddonReport';

interface ReportCacheState {
  careerWealth: AddonReport | null;
  daewoon: AddonReport | null;
  setCareerWealth: (report: AddonReport) => void;
  setDaewoon: (report: AddonReport) => void;
  clear: () => void;
}

export const useReportCacheStore = create<ReportCacheState>((set) => ({
  careerWealth: null,
  daewoon: null,
  setCareerWealth: (report) => set({ careerWealth: report }),
  setDaewoon: (report) => set({ daewoon: report }),
  clear: () => set({ careerWealth: null, daewoon: null }),
}));
