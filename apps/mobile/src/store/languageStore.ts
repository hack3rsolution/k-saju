import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import i18n, { type SupportedLanguage } from '../i18n';

const RTL_LANGUAGES = new Set(['ar']);

function applyRTL(lang: string) {
  const isRTL = RTL_LANGUAGES.has(lang);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }
}

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: i18n.language as SupportedLanguage,
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        applyRTL(lang);
        set({ language: lang });
      },
    }),
    {
      name: 'language-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Apply persisted language to i18n and RTL after rehydration
        if (state?.language) {
          i18n.changeLanguage(state.language);
          applyRTL(state.language);
        }
      },
    }
  )
);
