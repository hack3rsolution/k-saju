import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import i18n, { type SupportedLanguage, detectLanguage } from '../i18n';

const RTL_LANGUAGES = new Set(['ar']);

function applyRTL(lang: string) {
  const isRTL = RTL_LANGUAGES.has(lang);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }
}

interface LanguageState {
  language: SupportedLanguage;
  /** true only when the user explicitly picked a language in settings */
  userSelected: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  setLanguageAuto: (lang: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: i18n.language as SupportedLanguage,
      userSelected: false,
      setLanguage: (lang) => {
        // Explicit user selection — persist and mark as chosen
        i18n.changeLanguage(lang);
        applyRTL(lang);
        set({ language: lang, userSelected: true });
      },
      setLanguageAuto: (lang) => {
        // Auto-detected — persist but keep userSelected false
        i18n.changeLanguage(lang);
        applyRTL(lang);
        set({ language: lang, userSelected: false });
      },
    }),
    {
      name: 'language-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.userSelected) {
          // User explicitly chose a language — honour their choice
          i18n.changeLanguage(state.language);
          applyRTL(state.language);
        } else {
          // Auto-detected previously — re-detect from device to pick up locale changes
          const fresh = detectLanguage();
          i18n.changeLanguage(fresh);
          applyRTL(fresh);
          state.language = fresh;
        }
      },
    }
  )
);
