import {
  KCULTURE_DENSITY,
  KCULTURE_REFERENCES,
  FORTUNE_CATEGORIES,
  densityToCount,
  adjustDensityByFeedback,
  pickKCultureRefs,
  buildKCultureLayer,
  containsRealPersonName,
} from '../kculture-references';
import type { FortuneCategory, KCultureDensity } from '../kculture-references';
import type { CulturalFrame } from '../types';

// ── KCULTURE_DENSITY ──────────────────────────────────────────────────────────

describe('KCULTURE_DENSITY', () => {
  test('kr/jp/cn are high density', () => {
    expect(KCULTURE_DENSITY['kr']).toBe('high');
    expect(KCULTURE_DENSITY['jp']).toBe('high');
    expect(KCULTURE_DENSITY['cn']).toBe('high');
  });

  test('en/es are medium density', () => {
    expect(KCULTURE_DENSITY['en']).toBe('medium');
    expect(KCULTURE_DENSITY['es']).toBe('medium');
  });

  test('in is low density', () => {
    expect(KCULTURE_DENSITY['in']).toBe('low');
  });

  test('all 6 cultural frames have a density', () => {
    const frames: CulturalFrame[] = ['kr', 'cn', 'jp', 'en', 'es', 'in'];
    frames.forEach((f) => expect(KCULTURE_DENSITY[f]).toBeTruthy());
  });
});

// ── KCULTURE_REFERENCES ───────────────────────────────────────────────────────

describe('KCULTURE_REFERENCES', () => {
  test('each category has at least 20 expressions', () => {
    FORTUNE_CATEGORIES.forEach((cat) => {
      expect(KCULTURE_REFERENCES[cat].length).toBeGreaterThanOrEqual(20);
    });
  });

  test('all 6 categories are present', () => {
    const expected: FortuneCategory[] = ['romance', 'business', 'wealth', 'social', 'health', 'overall'];
    expected.forEach((cat) => {
      expect(KCULTURE_REFERENCES[cat]).toBeDefined();
    });
  });

  test('no real celebrity names in references', () => {
    FORTUNE_CATEGORIES.forEach((cat) => {
      KCULTURE_REFERENCES[cat].forEach((ref) => {
        expect(containsRealPersonName(ref)).toBe(false);
      });
    });
  });

  test('romance references contain Korean drama themes', () => {
    const joined = KCULTURE_REFERENCES.romance.join(' ');
    expect(joined).toContain('드라마');
  });

  test('business references contain idol/audition themes', () => {
    const joined = KCULTURE_REFERENCES.business.join(' ');
    expect(joined).toContain('아이돌');
  });

  test('wealth references contain reversal/Cinderella themes', () => {
    const joined = KCULTURE_REFERENCES.wealth.join(' ');
    expect(joined).toContain('신데렐라');
  });

  test('social references contain fandom themes', () => {
    const joined = KCULTURE_REFERENCES.social.join(' ');
    expect(joined).toContain('팬덤');
  });

  test('health references contain K-beauty themes', () => {
    const joined = KCULTURE_REFERENCES.health.join(' ');
    expect(joined).toContain('K-뷰티');
  });

  test('overall references contain K-drama protagonist aura', () => {
    const joined = KCULTURE_REFERENCES.overall.join(' ');
    expect(joined).toContain('주인공');
  });
});

// ── densityToCount ────────────────────────────────────────────────────────────

describe('densityToCount', () => {
  test('high → 3', () => expect(densityToCount('high')).toBe(3));
  test('medium → 2', () => expect(densityToCount('medium')).toBe(2));
  test('low → 1', () => expect(densityToCount('low')).toBe(1));
  test('none → 0', () => expect(densityToCount('none')).toBe(0));
});

// ── adjustDensityByFeedback ───────────────────────────────────────────────────

describe('adjustDensityByFeedback', () => {
  test('no feedback → returns base density unchanged', () => {
    expect(adjustDensityByFeedback('medium', 0, 0)).toBe('medium');
    expect(adjustDensityByFeedback('high', 0, 0)).toBe('high');
  });

  test('>60% positive feedback → increases density one step', () => {
    expect(adjustDensityByFeedback('medium', 4, 1)).toBe('high');
    expect(adjustDensityByFeedback('low', 4, 1)).toBe('medium');
    expect(adjustDensityByFeedback('none', 4, 1)).toBe('low');
  });

  test('>60% negative feedback → decreases density one step', () => {
    expect(adjustDensityByFeedback('medium', 1, 4)).toBe('low');
    expect(adjustDensityByFeedback('high', 1, 4)).toBe('medium');
    expect(adjustDensityByFeedback('low', 1, 4)).toBe('none');
  });

  test('already at max density → cannot go higher', () => {
    expect(adjustDensityByFeedback('high', 10, 0)).toBe('high');
  });

  test('already at min density → cannot go lower', () => {
    expect(adjustDensityByFeedback('none', 0, 10)).toBe('none');
  });

  test('balanced feedback (50/50) → returns base density', () => {
    expect(adjustDensityByFeedback('medium', 5, 5)).toBe('medium');
  });

  test('exactly 60% positive → does NOT increase (threshold is >60%)', () => {
    // 3 positive, 2 negative = 60% positive → no change
    expect(adjustDensityByFeedback('medium', 3, 2)).toBe('medium');
  });
});

// ── pickKCultureRefs ──────────────────────────────────────────────────────────

describe('pickKCultureRefs', () => {
  test('returns exactly count items', () => {
    expect(pickKCultureRefs('overall', 3)).toHaveLength(3);
    expect(pickKCultureRefs('romance', 2)).toHaveLength(2);
    expect(pickKCultureRefs('business', 1)).toHaveLength(1);
  });

  test('returns empty array for count = 0', () => {
    expect(pickKCultureRefs('overall', 0)).toHaveLength(0);
  });

  test('returns empty array for negative count', () => {
    expect(pickKCultureRefs('overall', -1)).toHaveLength(0);
  });

  test('returns no more than pool size', () => {
    const pool = KCULTURE_REFERENCES['overall'];
    const result = pickKCultureRefs('overall', pool.length + 100);
    expect(result.length).toBeLessThanOrEqual(pool.length);
  });

  test('no duplicate references in a single pick', () => {
    const result = pickKCultureRefs('overall', 10);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  test('all returned items come from the category pool', () => {
    const result = pickKCultureRefs('health', 5);
    result.forEach((item) => {
      expect(KCULTURE_REFERENCES['health']).toContain(item);
    });
  });
});

// ── buildKCultureLayer ────────────────────────────────────────────────────────

describe('buildKCultureLayer', () => {
  test('returns non-empty string for high-density frames', () => {
    const layer = buildKCultureLayer('kr', 'overall', 0, 0);
    expect(layer).toBeTruthy();
    expect(layer.length).toBeGreaterThan(10);
  });

  test('returns non-empty string for medium-density frames', () => {
    const layer = buildKCultureLayer('en', 'overall', 0, 0);
    expect(layer).toBeTruthy();
  });

  test('returns non-empty string for low-density frames', () => {
    const layer = buildKCultureLayer('in', 'overall', 0, 0);
    expect(layer).toBeTruthy();
  });

  test('high density → 3 bullet points', () => {
    const layer = buildKCultureLayer('kr', 'overall', 0, 0);
    const bullets = (layer.match(/^- /gm) ?? []).length;
    expect(bullets).toBe(3);
  });

  test('medium density → 2 bullet points', () => {
    const layer = buildKCultureLayer('en', 'overall', 0, 0);
    const bullets = (layer.match(/^- /gm) ?? []).length;
    expect(bullets).toBe(2);
  });

  test('low density → 1 bullet point', () => {
    const layer = buildKCultureLayer('in', 'overall', 0, 0);
    const bullets = (layer.match(/^- /gm) ?? []).length;
    expect(bullets).toBe(1);
  });

  test('contains real-person name guard instruction', () => {
    const layer = buildKCultureLayer('kr', 'overall', 0, 0);
    expect(layer).toContain('do NOT name any real celebrities');
  });

  test('positive feedback boosts kr density — still max at 3', () => {
    const layer = buildKCultureLayer('kr', 'overall', 10, 0);
    const bullets = (layer.match(/^- /gm) ?? []).length;
    expect(bullets).toBe(3); // already max
  });

  test('negative feedback reduces high density to medium', () => {
    const layer = buildKCultureLayer('kr', 'overall', 0, 10);
    const bullets = (layer.match(/^- /gm) ?? []).length;
    expect(bullets).toBe(2); // high → medium
  });

  test('heavy negative feedback reduces in density to none → empty string', () => {
    const layer = buildKCultureLayer('in', 'overall', 0, 10);
    expect(layer).toBe(''); // low → none
  });

  test('works for all categories', () => {
    FORTUNE_CATEGORIES.forEach((cat) => {
      const layer = buildKCultureLayer('kr', cat, 0, 0);
      expect(layer).toBeTruthy();
    });
  });
});

// ── containsRealPersonName ────────────────────────────────────────────────────

describe('containsRealPersonName', () => {
  test('detects known Korean celebrity name', () => {
    expect(containsRealPersonName('이민호처럼 잘생긴 사람을 만납니다')).toBe(true);
  });

  test('detects idol names', () => {
    expect(containsRealPersonName('전정국의 노래처럼 감동적인 시기')).toBe(true);
    expect(containsRealPersonName('김제니처럼 화려한 기운')).toBe(true);
  });

  test('returns false for generic K-Culture text', () => {
    expect(containsRealPersonName('아이돌 데뷔 무대처럼 빛나는 성과')).toBe(false);
    expect(containsRealPersonName('드라마 주인공 아우라처럼')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(containsRealPersonName('')).toBe(false);
  });

  test('all KCULTURE_REFERENCES entries pass the guard', () => {
    FORTUNE_CATEGORIES.forEach((cat) => {
      KCULTURE_REFERENCES[cat].forEach((ref) => {
        expect(containsRealPersonName(ref)).toBe(false);
      });
    });
  });
});
