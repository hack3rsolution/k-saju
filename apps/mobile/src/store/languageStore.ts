import { create } from 'zustand';
import i18n, { type SupportedLanguage } from '../i18n';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: i18n.language as SupportedLanguage,
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
