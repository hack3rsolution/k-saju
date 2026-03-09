import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// ── Common ──────────────────────────────────────────────────────────────────
import koCommon from './locales/ko/common.json';
import enCommon from './locales/en/common.json';
import zhHansCommon from './locales/zh-Hans/common.json';
import zhHantCommon from './locales/zh-Hant/common.json';
import jaCommon from './locales/ja/common.json';
import esCommon from './locales/es/common.json';
import ptBRCommon from './locales/pt-BR/common.json';
import hiCommon from './locales/hi/common.json';
import viCommon from './locales/vi/common.json';
import idCommon from './locales/id/common.json';
import frCommon from './locales/fr/common.json';
import deCommon from './locales/de/common.json';
import thCommon from './locales/th/common.json';
import arCommon from './locales/ar/common.json';

// ── Onboarding ───────────────────────────────────────────────────────────────
import koOnboarding from './locales/ko/onboarding.json';
import enOnboarding from './locales/en/onboarding.json';
import zhHansOnboarding from './locales/zh-Hans/onboarding.json';
import zhHantOnboarding from './locales/zh-Hant/onboarding.json';
import jaOnboarding from './locales/ja/onboarding.json';
import esOnboarding from './locales/es/onboarding.json';
import ptBROnboarding from './locales/pt-BR/onboarding.json';
import hiOnboarding from './locales/hi/onboarding.json';
import viOnboarding from './locales/vi/onboarding.json';
import idOnboarding from './locales/id/onboarding.json';
import frOnboarding from './locales/fr/onboarding.json';
import deOnboarding from './locales/de/onboarding.json';
import thOnboarding from './locales/th/onboarding.json';
import arOnboarding from './locales/ar/onboarding.json';

// ── Chart ────────────────────────────────────────────────────────────────────
import koChart from './locales/ko/chart.json';
import enChart from './locales/en/chart.json';
import zhHansChart from './locales/zh-Hans/chart.json';
import zhHantChart from './locales/zh-Hant/chart.json';
import jaChart from './locales/ja/chart.json';
import esChart from './locales/es/chart.json';
import ptBRChart from './locales/pt-BR/chart.json';
import hiChart from './locales/hi/chart.json';
import viChart from './locales/vi/chart.json';
import idChart from './locales/id/chart.json';
import frChart from './locales/fr/chart.json';
import deChart from './locales/de/chart.json';
import thChart from './locales/th/chart.json';
import arChart from './locales/ar/chart.json';

// ── Fortune ──────────────────────────────────────────────────────────────────
import koFortune from './locales/ko/fortune.json';
import enFortune from './locales/en/fortune.json';
import zhHansFortune from './locales/zh-Hans/fortune.json';
import zhHantFortune from './locales/zh-Hant/fortune.json';
import jaFortune from './locales/ja/fortune.json';
import esFortune from './locales/es/fortune.json';
import ptBRFortune from './locales/pt-BR/fortune.json';
import hiFortune from './locales/hi/fortune.json';
import viFortune from './locales/vi/fortune.json';
import idFortune from './locales/id/fortune.json';
import frFortune from './locales/fr/fortune.json';
import deFortune from './locales/de/fortune.json';
import thFortune from './locales/th/fortune.json';
import arFortune from './locales/ar/fortune.json';

// ── Paywall ───────────────────────────────────────────────────────────────────
import koPaywall from './locales/ko/paywall.json';
import enPaywall from './locales/en/paywall.json';
import zhHansPaywall from './locales/zh-Hans/paywall.json';
import zhHantPaywall from './locales/zh-Hant/paywall.json';
import jaPaywall from './locales/ja/paywall.json';
import esPaywall from './locales/es/paywall.json';
import ptBRPaywall from './locales/pt-BR/paywall.json';
import hiPaywall from './locales/hi/paywall.json';
import viPaywall from './locales/vi/paywall.json';
import idPaywall from './locales/id/paywall.json';
import frPaywall from './locales/fr/paywall.json';
import dePaywall from './locales/de/paywall.json';
import thPaywall from './locales/th/paywall.json';
import arPaywall from './locales/ar/paywall.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'ko',     label: '한국어',           flag: '🇰🇷' },
  { code: 'zh-Hans', label: '简体中文',         flag: '🇨🇳' },
  { code: 'zh-Hant', label: '繁體中文',         flag: '🇹🇼' },
  { code: 'ja',     label: '日本語',           flag: '🇯🇵' },
  { code: 'en',     label: 'English',          flag: '🇺🇸' },
  { code: 'es',     label: 'Español',          flag: '🇪🇸' },
  { code: 'pt-BR',  label: 'Português',        flag: '🇧🇷' },
  { code: 'hi',     label: 'हिन्दी',           flag: '🇮🇳' },
  { code: 'vi',     label: 'Tiếng Việt',       flag: '🇻🇳' },
  { code: 'id',     label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'fr',     label: 'Français',         flag: '🇫🇷' },
  { code: 'de',     label: 'Deutsch',          flag: '🇩🇪' },
  { code: 'th',     label: 'ภาษาไทย',          flag: '🇹🇭' },
  { code: 'ar',     label: 'العربية',          flag: '🇸🇦' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/** Returns true for RTL languages */
export function isRTL(lang: SupportedLanguage): boolean {
  return lang === 'ar';
}

/** Cultural frame → default language suggestion */
export const FRAME_DEFAULT_LANGUAGE: Record<string, SupportedLanguage> = {
  kr: 'ko',
  cn: 'zh-Hans',
  jp: 'ja',
  en: 'en',
  es: 'es',
  in: 'hi',
};

/** Language code → full language name for Claude API instructions */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ko:      'Korean',
  'zh-Hans': 'Simplified Chinese',
  'zh-Hant': 'Traditional Chinese',
  ja:      'Japanese',
  en:      'English',
  es:      'Spanish',
  'pt-BR': 'Portuguese',
  hi:      'Hindi',
  vi:      'Vietnamese',
  id:      'Indonesian',
  fr:      'French',
  de:      'German',
  th:      'Thai',
  ar:      'Arabic',
};

/** Map device locale tags to our supported codes */
function detectLanguage(): SupportedLanguage {
  const locales = Localization.getLocales();
  const tag = locales[0]?.languageTag ?? 'en';

  if (tag.startsWith('ko')) return 'ko';
  if (tag === 'zh-Hans' || tag.startsWith('zh-Hans') || tag === 'zh-CN') return 'zh-Hans';
  if (tag === 'zh-Hant' || tag.startsWith('zh-Hant') || tag === 'zh-TW' || tag === 'zh-HK') return 'zh-Hant';
  if (tag.startsWith('ja')) return 'ja';
  if (tag.startsWith('es')) return 'es';
  if (tag === 'pt-BR' || tag.startsWith('pt')) return 'pt-BR';
  if (tag.startsWith('hi')) return 'hi';
  if (tag.startsWith('vi')) return 'vi';
  if (tag.startsWith('id')) return 'id';
  if (tag.startsWith('fr')) return 'fr';
  if (tag.startsWith('de')) return 'de';
  if (tag.startsWith('th')) return 'th';
  if (tag.startsWith('ar')) return 'ar';
  return 'en';
}

i18n.use(initReactI18next).init({
  lng: detectLanguage(),
  fallbackLng: 'en',
  ns: ['common', 'onboarding', 'chart', 'fortune', 'paywall'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  resources: {
    ko:       { common: koCommon,     onboarding: koOnboarding,     chart: koChart,     fortune: koFortune,     paywall: koPaywall     },
    'zh-Hans': { common: zhHansCommon, onboarding: zhHansOnboarding, chart: zhHansChart, fortune: zhHansFortune, paywall: zhHansPaywall },
    'zh-Hant': { common: zhHantCommon, onboarding: zhHantOnboarding, chart: zhHantChart, fortune: zhHantFortune, paywall: zhHantPaywall },
    ja:       { common: jaCommon,     onboarding: jaOnboarding,     chart: jaChart,     fortune: jaFortune,     paywall: jaPaywall     },
    en:       { common: enCommon,     onboarding: enOnboarding,     chart: enChart,     fortune: enFortune,     paywall: enPaywall     },
    es:       { common: esCommon,     onboarding: esOnboarding,     chart: esChart,     fortune: esFortune,     paywall: esPaywall     },
    'pt-BR':  { common: ptBRCommon,   onboarding: ptBROnboarding,   chart: ptBRChart,   fortune: ptBRFortune,   paywall: ptBRPaywall   },
    hi:       { common: hiCommon,     onboarding: hiOnboarding,     chart: hiChart,     fortune: hiFortune,     paywall: hiPaywall     },
    vi:       { common: viCommon,     onboarding: viOnboarding,     chart: viChart,     fortune: viFortune,     paywall: viPaywall     },
    id:       { common: idCommon,     onboarding: idOnboarding,     chart: idChart,     fortune: idFortune,     paywall: idPaywall     },
    fr:       { common: frCommon,     onboarding: frOnboarding,     chart: frChart,     fortune: frFortune,     paywall: frPaywall     },
    de:       { common: deCommon,     onboarding: deOnboarding,     chart: deChart,     fortune: deFortune,     paywall: dePaywall     },
    th:       { common: thCommon,     onboarding: thOnboarding,     chart: thChart,     fortune: thFortune,     paywall: thPaywall     },
    ar:       { common: arCommon,     onboarding: arOnboarding,     chart: arChart,     fortune: arFortune,     paywall: arPaywall     },
  },
});

export default i18n;
