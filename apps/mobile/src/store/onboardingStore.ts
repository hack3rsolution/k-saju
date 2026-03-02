import { create } from 'zustand';
import type { CulturalFrame } from '@k-saju/saju-engine';

export interface OnboardingInput {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number | null; // null = unknown
  gender: 'M' | 'F' | null;
  frame: CulturalFrame | null;
}

interface OnboardingState extends OnboardingInput {
  setBirthData: (data: Omit<OnboardingInput, 'frame'>) => void;
  setFrame: (frame: CulturalFrame) => void;
  reset: () => void;
}

const DEFAULT: OnboardingInput = {
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
  birthHour: null,
  gender: null,
  frame: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...DEFAULT,
  setBirthData: (data) => set(data),
  setFrame: (frame) => set({ frame }),
  reset: () => set(DEFAULT),
}));
