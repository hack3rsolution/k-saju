import { create } from 'zustand';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { type SupportedLanguage, isRTL } from '../i18n';

export const LANGUAGE_STORAGE_KEY = 'user_language';

interface LanguageState {
  language: SupportedLanguage;
  /** True when language changed — UI can show a "refresh to update readings" hint */
  languageChangedHint: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  clearHint: () => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: i18n.language as SupportedLanguage,
  languageChangedHint: false,
  setLanguage: (lang) => {
    const prev = get().language;
    i18n.changeLanguage(lang);
    // RTL layout — note: requires app restart to take full effect on RN
    I18nManager.forceRTL(isRTL(lang));
    set({ language: lang, languageChangedHint: prev !== lang });
    // Persist so the choice survives app restarts
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang).catch(() => {});
  },
  clearHint: () => set({ languageChangedHint: false }),
}));
