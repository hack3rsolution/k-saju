/**
 * 10 Heavenly Stems (천간, 天干)
 */
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export type Stem = (typeof STEMS)[number];

/**
 * 12 Earthly Branches (지지, 地支)
 */
export const BRANCHES = [
  '子', '丑', '寅', '卯', '辰', '巳',
  '午', '未', '申', '酉', '戌', '亥',
] as const;
export type Branch = (typeof BRANCHES)[number];

/**
 * Five Elements (오행, 五行)
 */
export const FIVE_ELEMENTS = ['木', '火', '土', '金', '水'] as const;
export type FiveElement = (typeof FIVE_ELEMENTS)[number];

/**
 * Stem → Five Element mapping
 */
export const STEM_ELEMENT: Record<Stem, FiveElement> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

/**
 * Branch → Five Element mapping
 */
export const BRANCH_ELEMENT: Record<Branch, FiveElement> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};

/**
 * Stem → Yin/Yang (음양)
 * Even index (0-based) = Yang (양), Odd = Yin (음)
 */
export const STEM_POLARITY: Record<Stem, 'yang' | 'yin'> = {
  甲: 'yang', 乙: 'yin',
  丙: 'yang', 丁: 'yin',
  戊: 'yang', 己: 'yin',
  庚: 'yang', 辛: 'yin',
  壬: 'yang', 癸: 'yin',
};

/**
 * 60 Sexagenary Cycle (육십갑자)
 * Index 0 = 甲子, 1 = 乙丑, …, 59 = 癸亥
 */
export const SEXAGENARY_CYCLE: readonly string[] = Array.from(
  { length: 60 },
  (_, i) => `${STEMS[i % 10]}${BRANCHES[i % 12]}`,
);

/**
 * Reference year for sexagenary base: 1984 = 甲子 (index 0)
 */
export const SEXAGENARY_BASE_YEAR = 1984;
