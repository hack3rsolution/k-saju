# K-Personality 기능 개발 로드맵 v2
# K-Saju Global → v2.4.0
# Claude Code 전용 명령어 모음
# 작성일: 2026-03-11
# 총 예상 기간: 4~5주 (솔로 개발)
#
# ─────────────────────────────────────────────
# 모든 스텝의 4가지 원칙
# ─────────────────────────────────────────────
# [원칙 1] PRE-CHECK  : 기존 파일 경로·패턴을 먼저 파악
# [원칙 2] REUSE      : K-Saju 기존 패턴 그대로 재활용
# [원칙 3] ISOLATION  : 각 스텝은 독립 실행 가능
# [원칙 4] VERIFY     : 스텝 완료 후 에러·충돌 철저 검증
# ─────────────────────────────────────────────

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 사전 준비 — 전체 로드맵 시작 전 1회 실행
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
[사전 준비] 전체 로드맵 시작 전 프로젝트 구조를 파악해줘.
작업 경로: ~/Projects/k-saju/

아래 항목을 순서대로 조사하고 결과를 표로 정리해줘.
절대 파일을 생성하거나 수정하지 말고, 조사만 해줘.

# 1. 디렉터리 구조 파악
find ~/Projects/k-saju/apps/mobile/src -type d | head -40
find ~/Projects/k-saju/supabase/functions -type d

# 2. 기존 타입 시스템 확인
find ~/Projects/k-saju/apps/mobile/src/types -type f
cat ~/Projects/k-saju/apps/mobile/src/types/index.ts

# 3. 기존 Saju 엔진 경로 확인
find ~/Projects/k-saju -name "core.ts" -path "*/engine/*"
find ~/Projects/k-saju -name "stems.json" -o -name "branches.json" | head -5
grep -r "calculatePillars\|SajuPillars" ~/Projects/k-saju/apps/mobile/src --include="*.ts" -l

# 4. Supabase Edge Function 패턴 확인
ls ~/Projects/k-saju/supabase/functions/
cat ~/Projects/k-saju/supabase/functions/saju-reading/index.ts | head -80

# 5. RevenueCat 패턴 확인
grep -r "RevenueCat\|Purchases\|presentPaywall\|entitlement" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" --include="*.tsx" -l
cat $(grep -rl "presentPaywall\|Purchases.getSharedInstance" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" --include="*.tsx" | head -1) | head -60

# 6. React Query / 훅 패턴 확인
grep -r "useQuery\|useMutation\|queryClient" \
  ~/Projects/k-saju/apps/mobile/src/hooks --include="*.ts" -l
cat $(ls ~/Projects/k-saju/apps/mobile/src/hooks/*.ts | head -1) | head -60

# 7. i18n 구조 확인
find ~/Projects/k-saju/apps/mobile -name "*.json" -path "*/locales/*" | head -5
cat $(find ~/Projects/k-saju/apps/mobile -name "en.json" -path "*/locales/*") | head -40
# 15개 언어 파일 목록
ls $(find ~/Projects/k-saju/apps/mobile -path "*/locales/*" -name "*.json" \
  | head -1 | xargs dirname)

# 8. 탭 네비게이션 파일 확인
cat ~/Projects/k-saju/apps/mobile/src/app/\(tabs\)/_layout.tsx

# 9. 딥링크 핸들러 확인
find ~/Projects/k-saju/apps/mobile -name "+native-intent*" -o -name "linking*" 2>/dev/null
cat ~/Projects/k-saju/apps/mobile/app.config.ts | grep -A5 "scheme\|intentFilter\|associatedDomain"

# 10. Supabase 클라이언트 경로 확인
grep -r "createClient\|supabaseClient\|supabase" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" -l | head -3
cat $(grep -rl "createClient" ~/Projects/k-saju/apps/mobile/src --include="*.ts" | head -1) | head -30

# 11. 테마/스타일 시스템 확인
grep -r "useTheme\|ThemeProvider\|colors\." \
  ~/Projects/k-saju/apps/mobile/src --include="*.tsx" -l | head -3
cat $(grep -rl "useTheme" ~/Projects/k-saju/apps/mobile/src --include="*.tsx" | head -1) | head -40

# 12. 기존 Supabase 마이그레이션 패턴 확인
ls ~/Projects/k-saju/supabase/migrations/ | tail -3
cat $(ls ~/Projects/k-saju/supabase/migrations/*.sql | tail -1) | head -40

# 13. 패키지 매니저 및 테스트 설정 확인
cat ~/Projects/k-saju/apps/mobile/package.json | grep -E '"test"|"jest"|"vitest"'
cat ~/Projects/k-saju/apps/mobile/package.json | grep -E '"scripts"' -A 10

# 14. 기존 컴포넌트 구조 패턴 확인
ls ~/Projects/k-saju/apps/mobile/src/components/
cat $(ls ~/Projects/k-saju/apps/mobile/src/components/*.tsx 2>/dev/null \
  | head -1) | head -50

# 15. 현재 브랜치 및 git 상태 확인
cd ~/Projects/k-saju && git branch && git status --short

조사 완료 후 아래 표를 채워줘:
┌─────────────────────────────┬──────────────────────────────────────────┐
│ 항목                         │ 실제 경로 / 패턴                          │
├─────────────────────────────┼──────────────────────────────────────────┤
│ 타입 파일 위치               │                                          │
│ Saju 엔진 경로               │                                          │
│ SajuPillars 타입 위치        │                                          │
│ Edge Function 패턴 파일      │                                          │
│ RevenueCat 훅/유틸 파일      │                                          │
│ React Query 훅 패턴 파일     │                                          │
│ i18n 언어 파일 경로          │                                          │
│ 탭 네비게이션 파일           │                                          │
│ 딥링크 핸들러 파일           │                                          │
│ Supabase 클라이언트 파일     │                                          │
│ 테마 시스템 파일             │                                          │
│ 패키지 매니저                │                                          │
│ 테스트 러너                  │                                          │
│ 현재 브랜치                  │                                          │
└─────────────────────────────┴──────────────────────────────────────────┘

이 표를 이후 모든 스텝에서 참조할 것이므로 정확하게 채워줘.
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MILESTONE 1: 오행 계산 엔진 + Claude API Edge Function
# 목표 기간: 1주
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## M1-STEP-1: 브랜치 생성 및 타입 정의

```
[M1-STEP-1] feat/k-personality 브랜치를 생성하고 타입 파일을 만들어줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 현재 브랜치 및 변경사항 없음 확인
cd ~/Projects/k-saju && git status --short
# → 변경사항 있으면 먼저 stash 또는 commit

# 기존 타입 파일 구조 파악
cat apps/mobile/src/types/index.ts
ls apps/mobile/src/types/

# 기존 타입 네이밍 컨벤션 확인 (camelCase vs PascalCase 등)
head -30 $(ls apps/mobile/src/types/*.ts | head -2 | tr '\n' ' ')

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 타입 정의만 수행. 로직·UI·API 코드 절대 건드리지 않음.

━━━ 작업 내용 ━━━

# 1. 브랜치 생성
git checkout -b feat/k-personality

# 2. apps/mobile/src/types/kPersonality.ts 생성
#    → 기존 타입 파일의 import 스타일과 동일하게 작성
#    → 기존 파일에서 쓰는 export 방식 (named export) 그대로 유지

아래 타입을 정의해줘:

export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export interface FiveElementRatio {
  wood: number;   // 합계 = 100, 소수점 1자리
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export type SasangType = 'taeyang' | 'soyang' | 'taeeum' | 'soeum';

export interface KPersonalityFree {
  dominantElement: FiveElement;
  weakestElement: FiveElement;
  elementRatio: FiveElementRatio;
  sasangType: SasangType;
  typeName: string;       // e.g. "Visionary Pioneer"
  typeNameKo: string;     // e.g. "목양 선구자"
  keywords: string[];     // 3개
  summaryShort: string;   // 120자 이내
}

export interface KPersonalityPremium extends KPersonalityFree {
  summaryFull: string;          // 500~800자
  strengths: string[];          // 3개
  growthAreas: string[];        // 2개
  careerFit: string[];          // 5개
  compatibleTypes: SasangType[];
  monthlyEnergyFlow: string;
}

export interface KPersonalityRecord {
  id: string;
  user_id: string;
  element_ratio: FiveElementRatio;
  sasang_type: SasangType;
  type_name: string;
  type_name_ko: string;
  keywords: string[];
  summary_short: string;
  summary_full?: string;
  strengths?: string[];
  growth_areas?: string[];
  career_fit?: string[];
  compatible_types?: SasangType[];
  monthly_energy_flow?: string;
  language: string;
  share_enabled: boolean;
  created_at: string;
  updated_at: string;
}

# 3. apps/mobile/src/types/index.ts에 export 추가
#    → 기존 export 줄 바로 아래에 추가 (파일 끝에 append 금지)
#    → 기존 export 패턴과 동일한 형식으로 추가

━━━ [원칙 4] VERIFY ━━━
작업 완료 후 아래를 순서대로 실행하고 결과를 보고해줘:

# 타입 에러 없음 확인
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1
# → 에러 0개 확인. 에러 있으면 즉시 수정 후 재실행.

# types/index.ts export 정상 확인
grep "kPersonality\|KPersonality\|FiveElement\|SasangType" \
  apps/mobile/src/types/index.ts
# → kPersonality 관련 export 라인이 정확히 존재하는지 확인

# 기존 타입 파일들 import 깨짐 없음 확인
npx tsc --noEmit 2>&1 | grep -v "kPersonality" | head -20
# → 기존 타입 관련 에러가 새로 생기지 않았는지 확인

검증 결과 표:
| 검증 항목                    | 결과    | 비고 |
|------------------------------|---------|------|
| tsc --noEmit 에러 0개        | PASS/FAIL |    |
| kPersonality export 존재     | PASS/FAIL |    |
| 기존 타입 에러 미발생         | PASS/FAIL |    |

FAIL 항목이 있으면 수정하고 PASS 될 때까지 반복해줘.
```

---

## M1-STEP-2: 천간/지지 오행 매핑 데이터

```
[M1-STEP-2] 오행 매핑 상수 파일을 생성해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# Saju 엔진의 기존 stems/branches 데이터 구조 파악
find ~/Projects/k-saju -name "stems.json" -o -name "branches.json" 2>/dev/null
cat $(find ~/Projects/k-saju -name "stems.json" 2>/dev/null | head -1)
cat $(find ~/Projects/k-saju -name "branches.json" 2>/dev/null | head -1)

# 기존 엔진에서 천간/지지를 어떤 키 이름으로 사용하는지 확인
grep -r "stem\|branch\|heavenly\|earthly" \
  ~/Projects/k-saju/apps/mobile/src/engine --include="*.ts" | head -20

# engine 디렉터리 구조
find ~/Projects/k-saju/apps/mobile/src/engine -type f | head -20
# (또는 packages/api/src/engine 경로도 확인)
find ~/Projects/k-saju/packages -name "*.ts" -path "*/engine/*" | head -10

# 기존 __tests__ 디렉터리 위치 및 테스트 파일 패턴 확인
find ~/Projects/k-saju/apps/mobile/src -name "*.test.ts" | head -5
cat $(find ~/Projects/k-saju/apps/mobile/src -name "*.test.ts" | head -1) | head -40

━━━ [원칙 2] REUSE ━━━
기존 stems.json, branches.json의 한자 키 표기 방식을 그대로 따라줘.
(예: 기존이 로마자 표기면 로마자, 한자면 한자로 동일하게 작성)

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 매핑 상수와 테스트만 생성. 계산 로직은 다음 스텝에서 처리.

━━━ 작업 내용 ━━━

# apps/mobile/src/engine/kPersonality/elementMapping.ts 생성
# → 기존 엔진 파일들의 import 경로 스타일과 동일하게 작성
# → 기존 stems.json의 한자 키와 동일한 표기 방식 사용

아래 상수를 정의해줘 (기존 stems.json 키 표기와 일치시킬 것):

import type { FiveElement, SasangType } from '../../types/kPersonality';
// → 위 import 경로는 실제 파일 위치에 맞게 조정해줘

// 천간(天干) → 오행 매핑
export const HEAVENLY_STEMS_ELEMENT: Record<string, FiveElement> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth','己': 'earth',
  '庚': 'metal','辛': 'metal',
  '壬': 'water','癸': 'water',
};

// 지지(地支) → 오행 매핑 (지장간 주기 가중치 포함)
export const EARTHLY_BRANCHES_ELEMENT: Record<string, {
  main: FiveElement;
  weight: number;   // 주기(主氣) 비율
}> = {
  '子': { main: 'water', weight: 1.0 },
  '丑': { main: 'earth', weight: 0.6 },
  '寅': { main: 'wood',  weight: 0.7 },
  '卯': { main: 'wood',  weight: 1.0 },
  '辰': { main: 'earth', weight: 0.6 },
  '巳': { main: 'fire',  weight: 0.7 },
  '午': { main: 'fire',  weight: 0.8 },
  '未': { main: 'earth', weight: 0.6 },
  '申': { main: 'metal', weight: 0.7 },
  '酉': { main: 'metal', weight: 1.0 },
  '戌': { main: 'earth', weight: 0.6 },
  '亥': { main: 'water', weight: 0.8 },
};

// 사상체질 매핑
export const SASANG_MAPPING: Record<FiveElement, SasangType> = {
  wood:  'taeyang',
  fire:  'soyang',
  earth: 'taeeum',
  metal: 'taeeum',
  water: 'soeum',
};

export const SASANG_NAMES: Record<SasangType, { ko: string; en: string }> = {
  taeyang: { ko: '태양인', en: 'Taeyang' },
  soyang:  { ko: '소양인', en: 'Soyang' },
  taeeum:  { ko: '태음인', en: 'Taeeum' },
  soeum:   { ko: '소음인', en: 'Soeum' },
};

# 단위 테스트 생성
# apps/mobile/src/engine/kPersonality/__tests__/elementMapping.test.ts
# → 기존 테스트 파일의 describe/it/expect 패턴과 동일하게 작성
# → 기존 테스트의 import 방식 (상대경로 vs alias) 그대로 사용

테스트 케이스:
- 천간 10개 모두 올바른 FiveElement에 매핑되는지 검증
- 지지 12개 모두 올바른 FiveElement에 매핑되는지 검증
- SASANG_MAPPING의 모든 값이 SasangType에 속하는지 검증

━━━ [원칙 4] VERIFY ━━━
작업 완료 후 순서대로 실행하고 결과를 보고해줘:

# 타입 에러 없음
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# 신규 파일 린트
npx eslint apps/mobile/src/engine/kPersonality/elementMapping.ts \
           apps/mobile/src/engine/kPersonality/__tests__/elementMapping.test.ts \
           --ext .ts --max-warnings 0 2>&1

# 테스트 실행 (기존 테스트 러너에 맞게 yarn test 또는 npx jest)
cd apps/mobile && [기존 테스트 명령어] \
  --testPathPattern="elementMapping" 2>&1

# 기존 엔진 테스트 미영향 확인
[기존 테스트 명령어] --testPathPattern="engine" 2>&1
# → 기존 엔진 테스트가 이전과 동일하게 PASS인지 확인

검증 결과 표:
| 검증 항목                         | 결과      | 비고 |
|-----------------------------------|-----------|------|
| tsc --noEmit 에러 0개             | PASS/FAIL |      |
| eslint 경고/에러 0개              | PASS/FAIL |      |
| elementMapping 테스트 전체 PASS   | PASS/FAIL |      |
| 기존 엔진 테스트 미영향           | PASS/FAIL |      |

FAIL 항목 있으면 수정 후 재실행해줘.
```

---

## M1-STEP-3: 오행 비율 계산 함수

```
[M1-STEP-3] 사주 8자에서 오행 비율을 계산하는 함수를 구현해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 기존 Saju 엔진의 calculatePillars 반환 타입 정확히 파악
grep -n "calculatePillars\|SajuPillars\|Pillars\|interface.*Pillar" \
  ~/Projects/k-saju/apps/mobile/src/engine/core.ts 2>/dev/null
# 경로가 다르면 아래로 시도
grep -rn "calculatePillars\|interface.*Pillar" \
  ~/Projects/k-saju --include="*.ts" | grep -v "node_modules\|.git" | head -15

# 반환 타입의 실제 구조 확인
# (stem, branch 필드명이 정확히 무엇인지)
grep -A 20 "interface.*Pillars\|type.*Pillars" \
  $(grep -rl "calculatePillars" ~/Projects/k-saju/apps/mobile/src --include="*.ts" | head -1)

# 기존 엔진에서 사주 글자를 어떤 형식으로 저장하는지 확인
# (한자인지, 로마자인지, 코드값인지)
grep -A 5 "year.*stem\|yearStem\|yearPillar" \
  $(grep -rl "calculatePillars" ~/Projects/k-saju/apps/mobile/src --include="*.ts" | head -1) | head -20

# M1-STEP-2에서 생성한 매핑 파일 존재 확인
ls ~/Projects/k-saju/apps/mobile/src/engine/kPersonality/

━━━ [원칙 2] REUSE ━━━
기존 SajuEngine의 calculatePillars() 반환 타입을 그대로 입력 타입으로 사용.
새로운 타입 정의 없이 기존 타입 import해서 재활용.

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 순수 계산 함수만 구현. React/Supabase/API 의존성 없음.
외부 패키지 신규 설치 없음 (기존 패키지만 사용).

━━━ 작업 내용 ━━━

# apps/mobile/src/engine/kPersonality/calculator.ts 생성
# → 기존 엔진 파일의 import 스타일과 동일하게 작성
# → SajuPillars 타입은 기존 엔진에서 import (새로 정의하지 않음)

import type { FiveElement, FiveElementRatio, SasangType } from '../../types/kPersonality';
// → 아래 import는 실제 기존 엔진 타입 경로로 교체해줘
import type { SajuPillars } from '[실제 경로]';
import {
  HEAVENLY_STEMS_ELEMENT,
  EARTHLY_BRANCHES_ELEMENT,
  SASANG_MAPPING,
} from './elementMapping';

구현할 함수:

1. calculateElementRatio(pillars: SajuPillars): FiveElementRatio
   - 8자 각각의 오행 추출
   - 천간(4개): weight 1.0 고정
   - 지지(4개): EARTHLY_BRANCHES_ELEMENT의 weight 적용
   - 전체 합을 100으로 정규화 (소수점 1자리, Math.round 활용)
   - 정규화 후 합이 정확히 100이 되도록 최대 오행에서 오차 보정

2. determineSasangType(ratio: FiveElementRatio): SasangType
   - 가장 높은 비율의 오행을 dominant로 판별
   - earth와 metal 합이 50% 이상이면 taeeum 우선 처리
   - SASANG_MAPPING 적용하여 반환

3. findDominantElement(ratio: FiveElementRatio): FiveElement
   - 가장 높은 비율 오행 반환

4. findWeakestElement(ratio: FiveElementRatio): FiveElement
   - 가장 낮은 비율 오행 반환

5. buildKPersonalityInput(pillars: SajuPillars): {
     ratio: FiveElementRatio;
     sasangType: SasangType;
     dominantElement: FiveElement;
     weakestElement: FiveElement;
   }
   - 위 함수들을 조합한 public API

# 단위 테스트 생성
# apps/mobile/src/engine/kPersonality/__tests__/calculator.test.ts
# → 기존 테스트 파일 패턴 완전히 동일하게 작성

테스트 케이스:
- 木 dominant 사주 → taeyang + wood dominant 확인
- 水 dominant 사주 → soeum + water dominant 확인
- ratio 합계 = 100 검증 (부동소수점 오차 허용: ±0.1)
- earth + metal 합 50% 이상 케이스 → taeeum 확인
- 동점 오행 처리 (wood=fire=25%씩 등) 시 에러 없음 확인

━━━ [원칙 4] VERIFY ━━━
작업 완료 후 순서대로 실행하고 결과를 보고해줘:

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -30

# 린트
npx eslint apps/mobile/src/engine/kPersonality/ --ext .ts --max-warnings 0 2>&1

# 신규 테스트
cd apps/mobile && [테스트 명령어] --testPathPattern="calculator" 2>&1

# 기존 엔진 테스트 미영향 재확인
[테스트 명령어] --testPathPattern="engine\|saju" 2>&1

# 오행 합계 = 100 검증 (5개 케이스)
# 테스트 내 각 케이스의 ratio 합계를 직접 로그로 확인

검증 결과 표:
| 검증 항목                         | 결과      | 비고 |
|-----------------------------------|-----------|------|
| tsc --noEmit 에러 0개             | PASS/FAIL |      |
| eslint 경고/에러 0개              | PASS/FAIL |      |
| calculator 테스트 전체 PASS       | PASS/FAIL |      |
| ratio 합계 100 검증               | PASS/FAIL |      |
| 기존 엔진 테스트 미영향           | PASS/FAIL |      |

FAIL 항목 있으면 수정 후 재실행해줘.
```

---

## M1-STEP-4: Supabase Edge Function

```
[M1-STEP-4] k-personality-analysis Edge Function을 생성해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 기존 Edge Function 전체 구조 파악
cat ~/Projects/k-saju/supabase/functions/saju-reading/index.ts
# (없으면 다른 함수 확인)
ls ~/Projects/k-saju/supabase/functions/
cat ~/Projects/k-saju/supabase/functions/$(ls ~/Projects/k-saju/supabase/functions/ | head -1)/index.ts

# Edge Function의 공통 유틸/헬퍼 파일 확인
find ~/Projects/k-saju/supabase/functions -name "_shared" -type d
find ~/Projects/k-saju/supabase/functions/_shared -type f 2>/dev/null
# → 공통 CORS 헤더, 에러 응답, Supabase 클라이언트 생성 패턴 파악

# Supabase secrets/환경변수 키 이름 확인
grep -r "ANTHROPIC_API_KEY\|CLAUDE_API_KEY\|Deno.env" \
  ~/Projects/k-saju/supabase/functions --include="*.ts" | head -5

# Claude API 호출 방식 확인 (fetch vs SDK)
grep -r "anthropic\|claude\|fetch.*api.anthropic" \
  ~/Projects/k-saju/supabase/functions --include="*.ts" | head -10

# 기존 캐싱 테이블/로직 패턴 확인
grep -r "cache\|Cache" ~/Projects/k-saju/supabase/functions --include="*.ts" | head -10

━━━ [원칙 2] REUSE ━━━
기존 Edge Function의 아래 패턴을 그대로 복사해서 사용해줘:
- CORS 헤더 처리 방식
- 인증 토큰 검증 방식
- Supabase admin client 생성 방식
- Claude API 호출 방식 (fetch URL, 헤더, 모델명 동일하게)
- 에러 응답 형식 (status code, 에러 JSON 구조 동일하게)
- Deno.env 키 이름 동일하게

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 Edge Function 파일만 생성.
Supabase DB 테이블은 아직 없어도 됨 (M1-STEP-5에서 생성).
현재는 캐시 로직을 try-catch로 감싸서 테이블 없어도 동작하도록 구현.

━━━ 작업 내용 ━━━

# supabase/functions/k-personality-analysis/index.ts 생성
# → 기존 함수와 완전히 동일한 파일 구조로 작성

Request body:
{
  elementRatio: { wood, fire, earth, metal, water },
  sasangType: 'taeyang'|'soyang'|'taeeum'|'soeum',
  dominantElement: FiveElement,
  weakestElement: FiveElement,
  language: string,    // 15개 언어 코드
  isPremium: boolean,
  userId: string
}

무료 Response:
{
  typeName: string,
  typeNameKo: string,
  keywords: string[3],
  summaryShort: string,
  cached: boolean
}

프리미엄 추가 필드:
{
  summaryFull: string,
  strengths: string[3],
  growthAreas: string[2],
  careerFit: string[5],
  compatibleTypes: SasangType[2],
  monthlyEnergyFlow: string
}

Claude API System Prompt:
"""
You are an expert in Korean traditional philosophy, specializing in the
Five Elements (오행/Ohaeng) and Sasang Constitutional Medicine (사상체질).
Analyze personality based on birth energy patterns.
Respond ONLY in {language}.
Be warm, insightful, culturally authentic, and globally accessible.
Frame insights as personality strengths, not fortune-telling.
Return ONLY valid JSON. No markdown, no preamble, no explanation.
"""

무료 User Prompt:
"""
Analyze this person's K-Type personality:

Five Elements:
木 Wood {wood}% | 火 Fire {fire}% | 土 Earth {earth}%
金 Metal {metal}% | 水 Water {water}%

Dominant: {dominantElement} | Sasang: {sasangType} ({sasangNameEn}/{sasangNameKo})
Needs balance: {weakestElement}

Return JSON only:
{
  "typeName": "2-3 word English archetype (e.g. Visionary Pioneer)",
  "typeNameKo": "한국어 유형명 2-3단어",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summaryShort": "120자 이내 핵심 성격 ({language}로 작성)"
}
"""

프리미엄 User Prompt (isPremium: true일 때 추가):
"""
Also provide deeper analysis. Add to your JSON:
{
  "summaryFull": "500-800자 심층 분석 ({language}로)",
  "strengths": ["강점1", "강점2", "강점3"],
  "growthAreas": ["성장영역1", "성장영역2"],
  "careerFit": ["직군1", "직군2", "직군3", "직군4", "직군5"],
  "compatibleTypes": ["sasangType1", "sasangType2"],
  "monthlyEnergyFlow": "이번 달 오행 에너지 200자 ({language}로)"
}
"""

캐싱 로직:
- k_personality_cache 테이블에서 (user_id + language + is_premium) 조회
- expires_at > now() 이면 cached_result_id로 k_personality_results 조회 후 반환
- 테이블 없으면 try-catch로 무시하고 API 호출 진행
- 신규 결과는 두 테이블에 upsert (실패해도 결과 반환은 정상 수행)

━━━ [원칙 4] VERIFY ━━━
작업 완료 후 순서대로 실행하고 결과를 보고해줘:

# Edge Function 구문 에러 확인 (Deno 없으면 기본 tsc로 대체)
deno check supabase/functions/k-personality-analysis/index.ts 2>&1 || \
  npx tsc --noEmit --allowJs supabase/functions/k-personality-analysis/index.ts 2>&1 | head -20

# 기존 Edge Function과 패턴 일치 여부 diff 확인
# (CORS 헤더, 에러 처리, 인증 토큰 검증 부분)
diff <(grep -n "corsHeaders\|Authorization\|error.*status" \
        supabase/functions/saju-reading/index.ts 2>/dev/null || echo "N/A") \
     <(grep -n "corsHeaders\|Authorization\|error.*status" \
        supabase/functions/k-personality-analysis/index.ts)
# → 패턴이 기존과 유사해야 함 (완전 동일하지 않아도 됨)

# 환경변수 키 이름 기존과 일치 확인
grep "Deno.env.get" supabase/functions/k-personality-analysis/index.ts
grep "Deno.env.get" supabase/functions/saju-reading/index.ts 2>/dev/null
# → 동일한 키 이름 사용 확인

# 기존 Edge Function 파일 미변경 확인
git diff supabase/functions/saju-reading/ 2>/dev/null | head -10
# → 변경사항 없음(빈 출력) 확인

# 신규 함수 파일 확인
ls -la supabase/functions/k-personality-analysis/

검증 결과 표:
| 검증 항목                          | 결과      | 비고 |
|------------------------------------|-----------|------|
| 구문 에러 없음                      | PASS/FAIL |      |
| CORS/인증 패턴 기존과 일치          | PASS/FAIL |      |
| 환경변수 키 이름 일치               | PASS/FAIL |      |
| 기존 함수 미변경                    | PASS/FAIL |      |
| 캐시 try-catch 구현 확인           | PASS/FAIL |      |

FAIL 항목 있으면 수정 후 재실행해줘.
```

---

## M1-STEP-5: Supabase 마이그레이션

```
[M1-STEP-5] k_personality 테이블 마이그레이션 파일을 생성해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 기존 마이그레이션 파일 구조 및 네이밍 규칙 확인
ls ~/Projects/k-saju/supabase/migrations/
# → timestamp 형식 확인 (YYYYMMDDHHmmss 또는 unix timestamp 등)
cat $(ls ~/Projects/k-saju/supabase/migrations/*.sql | tail -1) | head -60

# 기존 RLS 정책 패턴 확인 (profiles 또는 다른 테이블 참고)
grep -A 10 "CREATE POLICY\|ENABLE ROW LEVEL" \
  $(ls ~/Projects/k-saju/supabase/migrations/*.sql | head -3 | tr '\n' ' ')

# 기존 테이블에서 user_id REFERENCES 패턴 확인
grep "REFERENCES auth.users" \
  ~/Projects/k-saju/supabase/migrations/*.sql | head -5

# 기존 updated_at 트리거 패턴 확인
grep -A 5 "trigger\|moddatetime\|updated_at" \
  ~/Projects/k-saju/supabase/migrations/*.sql | head -20

# supabase/config.toml 확인 (project_id 등)
cat ~/Projects/k-saju/supabase/config.toml | head -10

━━━ [원칙 2] REUSE ━━━
기존 마이그레이션 파일의 아래 패턴을 그대로 복사해서 사용해줘:
- timestamp 네이밍 형식
- RLS ENABLE + POLICY 작성 패턴
- updated_at 자동 갱신 트리거 패턴
- CASCADE 삭제 패턴

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 마이그레이션 SQL 파일 생성만.
supabase db push는 VERIFY 단계에서 dry-run으로만 확인.
(실제 push는 Donghyun이 직접 검토 후 수행)

━━━ 작업 내용 ━━━

# supabase/migrations/[timestamp]_add_k_personality.sql 생성
# → timestamp는 기존 마이그레이션 파일의 형식 그대로 사용
# → 기존 SQL 패턴 (CREATE TABLE, RLS, TRIGGER) 그대로 따라 작성

테이블 1: k_personality_results
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- element_ratio: jsonb NOT NULL
  CHECK (
    (element_ratio->>'wood')::numeric >= 0 AND
    (element_ratio->>'fire')::numeric >= 0 AND
    (element_ratio->>'earth')::numeric >= 0 AND
    (element_ratio->>'metal')::numeric >= 0 AND
    (element_ratio->>'water')::numeric >= 0
  )
- sasang_type: text NOT NULL
  CHECK (sasang_type IN ('taeyang','soyang','taeeum','soeum'))
- type_name: text NOT NULL
- type_name_ko: text NOT NULL
- keywords: text[] NOT NULL
- summary_short: text NOT NULL
- summary_full: text
- strengths: text[]
- growth_areas: text[]
- career_fit: text[]
- compatible_types: text[]
- monthly_energy_flow: text
- language: text NOT NULL DEFAULT 'en'
- share_enabled: boolean NOT NULL DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
- INDEX: (user_id, language)
- UNIQUE: (user_id, language)   ← 언어당 1개만 유지

테이블 2: k_personality_cache
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- language: text NOT NULL
- is_premium: boolean NOT NULL DEFAULT false
- result_id: uuid REFERENCES k_personality_results(id) ON DELETE CASCADE
- expires_at: timestamptz NOT NULL
- created_at: timestamptz NOT NULL DEFAULT now()
- UNIQUE: (user_id, language, is_premium)

RLS 정책:
- k_personality_results:
  * SELECT: auth.uid() = user_id OR share_enabled = true
  * INSERT: auth.uid() = user_id
  * UPDATE: auth.uid() = user_id
  * DELETE: auth.uid() = user_id

- k_personality_cache:
  * SELECT/INSERT/UPDATE/DELETE: auth.uid() = user_id (본인만)

updated_at 트리거:
- k_personality_results에 기존 트리거 패턴 그대로 적용

━━━ [원칙 4] VERIFY ━━━
작업 완료 후 순서대로 실행하고 결과를 보고해줘:

# SQL 구문 오류 확인 (psql 없으면 기본 grep으로 대체)
grep -n "CREATE TABLE\|CREATE INDEX\|CREATE POLICY\|CREATE TRIGGER" \
  supabase/migrations/*_add_k_personality.sql
# → 4종 구문이 모두 존재하는지 확인

# Supabase dry-run (실제 적용 안 함)
cd ~/Projects/k-saju && supabase db diff --schema public 2>&1 | head -30
# → 에러 없이 diff가 출력되는지 확인

# 기존 마이그레이션 파일 미변경 확인
git diff supabase/migrations/ | grep "^---\|^+++" | grep -v "_add_k_personality"
# → 기존 파일 변경사항 없음 확인

# RLS 정책 완전성 확인
grep -c "CREATE POLICY" supabase/migrations/*_add_k_personality.sql
# → 최소 6개 (results 4개 + cache 4개) 확인

# share_enabled 컬럼 존재 확인
grep "share_enabled" supabase/migrations/*_add_k_personality.sql

검증 결과 표:
| 검증 항목                          | 결과      | 비고 |
|------------------------------------|-----------|------|
| 테이블 2개 생성 구문 존재          | PASS/FAIL |      |
| RLS 정책 최소 6개                  | PASS/FAIL |      |
| updated_at 트리거 존재             | PASS/FAIL |      |
| supabase db diff 에러 없음         | PASS/FAIL |      |
| 기존 마이그레이션 미변경           | PASS/FAIL |      |
| share_enabled 컬럼 존재           | PASS/FAIL |      |

⚠️ 실제 supabase db push는 이 스텝에서 실행하지 않음.
   M1 전체 완료 후 Donghyun이 직접 검토 후 적용할 것.

FAIL 항목 있으면 수정 후 재실행해줘.
```

---

## M1-STEP-6: React Query 훅

```
[M1-STEP-6] useKPersonality 훅을 생성해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 기존 훅 파일 구조 전체 파악
ls ~/Projects/k-saju/apps/mobile/src/hooks/
cat $(ls ~/Projects/k-saju/apps/mobile/src/hooks/*.ts | head -2 | tr '\n' ' ')

# React Query 사용 패턴 확인
grep -n "useQuery\|useMutation\|queryClient\|staleTime\|queryKey" \
  ~/Projects/k-saju/apps/mobile/src/hooks/*.ts | head -20

# Supabase 클라이언트 import 방식 확인
grep -n "import.*supabase\|from.*supabase" \
  ~/Projects/k-saju/apps/mobile/src/hooks/*.ts | head -5

# RevenueCat entitlement 체크 방식 확인
grep -rn "entitlement\|isPremium\|Purchases\|getSharedInstance" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" --include="*.tsx" | head -10
cat $(grep -rl "entitlement\|isPremium" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" | head -1) | head -60

# i18n language 값 접근 방식 확인
grep -rn "i18n.language\|useTranslation\|currentLanguage" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" --include="*.tsx" | head -5

# Edge Function 호출 방식 확인
grep -rn "supabase.functions.invoke\|functions.invoke" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" | head -5

# expo-sharing 또는 공유 유틸 확인
grep -rn "expo-sharing\|Share.share\|shareAsync" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" --include="*.tsx" | head -5

# 기존 훅의 queryKey 네이밍 컨벤션 확인
grep "queryKey" ~/Projects/k-saju/apps/mobile/src/hooks/*.ts | head -10

━━━ [원칙 2] REUSE ━━━
기존 훅 파일의 아래 패턴을 그대로 복사해서 사용해줘:
- queryKey 네이밍 방식
- useQuery options (staleTime, cacheTime, retry 등)
- Supabase client import 경로
- RevenueCat entitlement 체크 로직
- 에러 처리 패턴
- Edge Function 호출 방식

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 훅 파일만 생성.
UI 컴포넌트, 화면 파일 건드리지 않음.
react-native-view-shot은 이 스텝에서 설치하지 않음.

━━━ 작업 내용 ━━━

# apps/mobile/src/hooks/useKPersonality.ts 생성
# → 기존 훅 파일 구조와 완전히 동일한 패턴으로 작성

구현할 훅 2개:

1. useKPersonality()
반환값: {
  data: KPersonalityFree | KPersonalityPremium | null,
  isLoading: boolean,
  error: Error | null,
  isPremium: boolean,
  refetch: () => void
}

로직:
- 기존 훅과 동일한 방식으로 Supabase에서 사용자 사주 데이터 조회
- M1-STEP-3의 buildKPersonalityInput() 호출
- RevenueCat entitlement 체크 (기존 방식 그대로)
- supabase.functions.invoke('k-personality-analysis', ...) 호출
- queryKey: 기존 네이밍 컨벤션 따라 ['kPersonality', userId, language] 형태
- staleTime: 1000 * 60 * 60 * 24 (24시간)
- i18n.language 변경 시 자동 refetch (dependency array에 포함)

2. useShareKPersonality()
반환값: {
  share: (result: KPersonalityFree) => Promise<void>,
  copyLink: (userId: string) => Promise<void>,
  isSharing: boolean
}

로직:
- 딥링크: k-saju://k-type?share={userId}&lang={language}
- expo-sharing (기존 앱에 있으면) 또는 Share.share() 사용
- 기존 공유 관련 유틸 파일 있으면 그것을 import해서 사용

━━━ [원칙 4] VERIFY ━━━
작업 완료 후 순서대로 실행하고 결과를 보고해줘:

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -30

# 린트
npx eslint apps/mobile/src/hooks/useKPersonality.ts \
  --ext .ts --max-warnings 0 2>&1

# 기존 훅 파일들 타입 에러 미발생 확인
npx tsc --noEmit 2>&1 | grep -v "kPersonality\|useKPersonality" | head -20

# import 경로 실제 파일 존재 확인
node -e "
const fs = require('fs');
const content = fs.readFileSync(
  'apps/mobile/src/hooks/useKPersonality.ts', 'utf8'
);
const imports = content.match(/from ['\"](\.\.?\/[^'\"]+)['\"]*/g) || [];
imports.forEach(i => console.log(i));
" 2>&1
# → 각 import 경로가 실제 파일로 존재하는지 수동 확인

# 기존 훅들 테스트 미영향
[테스트 명령어] --testPathPattern="hooks" 2>&1

검증 결과 표:
| 검증 항목                              | 결과      | 비고 |
|----------------------------------------|-----------|------|
| tsc --noEmit 에러 0개                  | PASS/FAIL |      |
| eslint 경고/에러 0개                   | PASS/FAIL |      |
| 기존 훅 타입 에러 미발생               | PASS/FAIL |      |
| import 경로 실제 파일 존재             | PASS/FAIL |      |
| queryKey 기존 컨벤션 준수              | PASS/FAIL |      |

FAIL 항목 있으면 수정 후 재실행해줘.
```

---

## M1 마일스톤 완료 검증

```
[M1-COMPLETE] Milestone 1 전체 완료 검증을 실행해줘.

# 1. 전체 TypeScript 빌드
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1
# → 에러 0개 확인

# 2. 전체 테스트 스위트 (기존 + 신규)
cd apps/mobile && [테스트 명령어] 2>&1 | tail -20
# → 기존 테스트 PASS 유지 + 신규 테스트 PASS 확인

# 3. M1 신규 파일 목록 확인
git diff --name-only HEAD 2>/dev/null || git status --short
# → 아래 파일만 변경되어야 함:
#   apps/mobile/src/types/kPersonality.ts         (신규)
#   apps/mobile/src/types/index.ts                (수정)
#   apps/mobile/src/engine/kPersonality/*.ts      (신규)
#   apps/mobile/src/hooks/useKPersonality.ts      (신규)
#   supabase/functions/k-personality-analysis/    (신규)
#   supabase/migrations/*_add_k_personality.sql   (신규)

# 4. 기존 파일 변경사항 없음 확인
git diff apps/mobile/src/engine/core.ts
git diff supabase/functions/saju-reading/
# → 빈 출력 (변경 없음) 확인

# 5. M1 커밋
git add apps/mobile/src/types/kPersonality.ts \
        apps/mobile/src/types/index.ts \
        apps/mobile/src/engine/kPersonality/ \
        apps/mobile/src/hooks/useKPersonality.ts \
        supabase/functions/k-personality-analysis/ \
        supabase/migrations/*_add_k_personality.sql
git commit -m "feat(M1): Add K-Personality engine, types, edge function"

M1 완료 체크리스트:
| 항목                                   | 결과      |
|----------------------------------------|-----------|
| tsc --noEmit 에러 0개                  | PASS/FAIL |
| 전체 테스트 기존 PASS 유지             | PASS/FAIL |
| 신규 테스트 전체 PASS                  | PASS/FAIL |
| 기존 파일 미변경 (engine/core.ts 등)   | PASS/FAIL |
| M1 커밋 완료                           | PASS/FAIL |

⚠️ M2 진행 전 Donghyun이 직접 확인할 것:
   supabase db push (M1-STEP-5 마이그레이션 실제 적용)
   supabase functions deploy k-personality-analysis
   curl로 Edge Function 엔드포인트 응답 확인
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MILESTONE 2: 결과 카드 UI 컴포넌트
# 목표 기간: 1주
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## M2-STEP-1: ElementBarChart 컴포넌트

```
[M2-STEP-1] 오행 바 차트 컴포넌트를 생성해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 기존 컴포넌트 구조 파악
ls ~/Projects/k-saju/apps/mobile/src/components/
cat $(ls ~/Projects/k-saju/apps/mobile/src/components/*.tsx | head -2 | tr '\n' ' ')

# 테마 시스템 colors, spacing 구조 파악
grep -n "colors\|spacing\|typography\|borderRadius" \
  $(grep -rl "useTheme\|ThemeProvider" \
    ~/Projects/k-saju/apps/mobile/src --include="*.ts" | head -1) | head -30

# Animated 사용 패턴 확인
grep -rn "Animated\|useAnimatedValue\|useSharedValue" \
  ~/Projects/k-saju/apps/mobile/src --include="*.tsx" | head -10

# StyleSheet vs inline 스타일 사용 패턴 확인
grep -rn "StyleSheet.create\|style={{" \
  ~/Projects/k-saju/apps/mobile/src/components --include="*.tsx" | head -5

# 기존 컴포넌트에서 Props 타입 정의 방식 확인
grep -n "interface.*Props\|type.*Props" \
  $(ls ~/Projects/k-saju/apps/mobile/src/components/*.tsx | head -3 | tr '\n' ' ')

━━━ [원칙 2] REUSE ━━━
기존 컴포넌트의 아래 패턴을 그대로 따라줘:
- useTheme() import 경로 및 사용 방식
- StyleSheet.create vs inline 스타일 선택
- Props 타입 정의 방식 (interface vs type)
- Animated API 버전 (RN Animated vs Reanimated)
- 기존 테마의 color 변수명 그대로 사용

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 ElementBarChart 컴포넌트만 생성.
화면 파일, 훅, 탭 네비게이션 건드리지 않음.

━━━ 작업 내용 ━━━

# apps/mobile/src/components/kPersonality/ElementBarChart.tsx 생성
# → 기존 컴포넌트 파일 구조와 완전히 동일한 패턴으로 작성

interface ElementBarChartProps {
  ratio: FiveElementRatio;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  animated?: boolean;
}

오행별 색상 (기존 테마 colors에 없으면 로컬 상수로 정의):
- Wood 木: '#2D6A4F'
- Fire 火: '#C62828'
- Earth 土: '#795548'
- Metal 金: '#546E7A'
- Water 水: '#1565C0'

스펙:
- 5개 오행 수평 바 (세로로 5개 배치)
- 각 바 왼쪽: 오행 이름 (한글 + 영문)
- 각 바 오른쪽: 퍼센트 숫자
- animated: true이면 마운트 시 Animated으로 바 채워지는 애니메이션
- dominant 오행: 테두리 강조 또는 색상 밝기 증가
- size별 높이: small=4, medium=8, large=12 (px)

━━━ [원칙 4] VERIFY ━━━
작업 완료 후 순서대로 실행하고 결과를 보고해줘:

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# 린트
npx eslint apps/mobile/src/components/kPersonality/ElementBarChart.tsx \
  --ext .tsx --max-warnings 0 2>&1

# import 경로 실제 존재 확인
grep "^import" apps/mobile/src/components/kPersonality/ElementBarChart.tsx
# → 각 import 경로가 실제 파일로 존재하는지 확인

# 기존 컴포넌트 테스트 미영향
[테스트 명령어] --testPathPattern="components" 2>&1 | tail -10

# 기존 컴포넌트 파일 미변경 확인
git diff apps/mobile/src/components/ | grep "^---\|^+++" | \
  grep -v "kPersonality"
# → kPersonality 외 파일 변경 없음

검증 결과 표:
| 검증 항목                              | 결과      | 비고 |
|----------------------------------------|-----------|------|
| tsc --noEmit 에러 0개                  | PASS/FAIL |      |
| eslint 경고/에러 0개                   | PASS/FAIL |      |
| import 경로 실제 존재                  | PASS/FAIL |      |
| 기존 컴포넌트 파일 미변경              | PASS/FAIL |      |

FAIL 항목 있으면 수정 후 재실행해줘.
```

---

## M2-STEP-2: KTypeBadge 컴포넌트

```
[M2-STEP-2] 체질 유형 배지 컴포넌트를 생성해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# LinearGradient 사용 여부 확인
grep -rn "LinearGradient\|expo-linear-gradient" \
  ~/Projects/k-saju/apps/mobile --include="*.tsx" --include="*.ts" | head -5
# → 있으면 기존 import 방식 그대로 사용
# → 없으면 그라디언트 없이 단색으로 구현 (패키지 신규 설치 금지)

# 기존 뱃지/태그 형태 컴포넌트 확인
find ~/Projects/k-saju/apps/mobile/src/components -name "*Badge*" \
  -o -name "*Tag*" -o -name "*Chip*" 2>/dev/null

━━━ [원칙 2] REUSE ━━━
- LinearGradient가 기존에 없으면 단색 배경으로 구현
- 기존 컴포넌트 스타일 패턴 그대로 따를 것

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 KTypeBadge 컴포넌트만 생성.

━━━ 작업 내용 ━━━

# apps/mobile/src/components/kPersonality/KTypeBadge.tsx 생성

interface KTypeBadgeProps {
  sasangType: SasangType;
  typeName: string;
  typeNameKo: string;
  size?: 'small' | 'large';
}

체질별 색상쌍 (LinearGradient 있으면 그라디언트, 없으면 단색):
- taeyang:  from '#2D6A4F' to '#52B788' / 단색 '#2D6A4F'
- soyang:   from '#C62828' to '#EF5350' / 단색 '#C62828'
- taeeum:   from '#795548' to '#A1887F' / 단색 '#795548'
- soeum:    from '#1565C0' to '#42A5F5' / 단색 '#1565C0'

이모지:
- taeyang: 🌳  soyang: 🔥  taeeum: 🌍  soeum: 💧

레이아웃:
- 상단: 이모지
- 중간: typeName (영문, bold)
- 하단: typeNameKo + 체질명 한국어

━━━ [원칙 4] VERIFY ━━━
(M2-STEP-1과 동일한 검증 패턴 적용)

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# 린트
npx eslint apps/mobile/src/components/kPersonality/KTypeBadge.tsx \
  --ext .tsx --max-warnings 0 2>&1

# 기존 파일 미변경 확인
git diff apps/mobile/src/components/ | grep "^---\|^+++" | \
  grep -v "kPersonality"

검증 결과 표:
| 검증 항목                   | 결과      |
|-----------------------------|-----------|
| tsc 에러 0개                | PASS/FAIL |
| eslint 0개                  | PASS/FAIL |
| 기존 컴포넌트 미변경        | PASS/FAIL |
```

---

## M2-STEP-3: KPersonalityResultCard + 공유 기능

```
[M2-STEP-3] 결과 카드 컴포넌트와 공유 이미지 생성 기능을 구현해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# react-native-view-shot 설치 여부 확인
cat ~/Projects/k-saju/apps/mobile/package.json | grep "view-shot"
# → 없으면 설치 필요 여부 먼저 알려줘 (설치 전 확인 요청)

# expo-sharing 설치 여부 확인
cat ~/Projects/k-saju/apps/mobile/package.json | grep "expo-sharing"

# 기존 이미지 공유 유틸 확인
grep -rn "expo-sharing\|Share.share\|shareAsync\|MediaLibrary" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" --include="*.tsx" | head -10

# 기존 ScrollView/SafeAreaView 사용 패턴 확인
grep -rn "SafeScrollView\|SafeAreaView\|ScrollView" \
  ~/Projects/k-saju/apps/mobile/src/components --include="*.tsx" | head -5

━━━ [원칙 2] REUSE ━━━
- 기존 공유 유틸이 있으면 새로 만들지 말고 그것을 import해서 사용
- react-native-view-shot이 없으면 설치 전 Donghyun에게 확인 요청
- 기존 ScrollView 래퍼 컴포넌트(SafeScrollView 등)가 있으면 재사용

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 KPersonalityResultCard 컴포넌트만 생성.
화면 파일 건드리지 않음.

━━━ 작업 내용 ━━━

# apps/mobile/src/components/kPersonality/KPersonalityResultCard.tsx 생성

interface KPersonalityResultCardProps {
  result: KPersonalityFree;
  mode: 'screen' | 'share-image';
  onShare?: () => void;
  onUnlock?: () => void;
}

screen 모드 레이아웃:
- KTypeBadge (large)
- ElementBarChart (medium, animated: true)
- 키워드 3개 태그
- summaryShort 텍스트
- [공유하기] 버튼 → onShare() 호출
- [전체 리포트 보기] 버튼 → onUnlock() 호출

share-image 모드 (ViewShot 캡처 타깃):
- 고정 크기 (width: 360, height: 640 — 비율 유지)
- KTypeBadge + ElementBarChart + 키워드 + summaryShort
- 하단: "by K-Saju" 워터마크
- 버튼 없음

공유 흐름 (onShare):
1. ViewShot.capture() → 임시 파일 URI
2. expo-sharing으로 공유 시트 표시
   또는 기존 Share.share() 방식으로 대체
3. 실패 시 클립보드에 딥링크 URL 복사

━━━ [원칙 4] VERIFY ━━━
작업 완료 후 순서대로 실행하고 결과를 보고해줘:

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# 린트
npx eslint apps/mobile/src/components/kPersonality/ \
  --ext .tsx --max-warnings 0 2>&1

# 패키지 의존성 실제 설치 확인
cat apps/mobile/package.json | grep -E "view-shot|expo-sharing"

# 기존 컴포넌트 파일 미변경
git diff apps/mobile/src/components/ | grep "^---\|^+++" | \
  grep -v "kPersonality"

# kPersonality 컴포넌트 3개 모두 존재 확인
ls apps/mobile/src/components/kPersonality/

검증 결과 표:
| 검증 항목                          | 결과      | 비고 |
|------------------------------------|-----------|------|
| tsc 에러 0개                       | PASS/FAIL |      |
| eslint 0개                         | PASS/FAIL |      |
| 3개 컴포넌트 파일 모두 존재        | PASS/FAIL |      |
| 의존 패키지 설치됨                 | PASS/FAIL |      |
| 기존 컴포넌트 미변경               | PASS/FAIL |      |
```

---

## M2-STEP-4: 친구 비교 딥링크 + compare 화면

```
[M2-STEP-4] 친구 비교 딥링크 처리와 compare 화면을 구현해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 기존 딥링크 처리 방식 전체 파악
cat ~/Projects/k-saju/apps/mobile/app.config.ts | \
  grep -A 20 "scheme\|intentFilter\|associatedDomain\|linking"
find ~/Projects/k-saju/apps/mobile/src -name "+native-intent*" 2>/dev/null
find ~/Projects/k-saju/apps/mobile/src -name "linking*" 2>/dev/null
# → Magic Link 딥링크 처리 코드 위치 파악

# 기존 딥링크 파라미터 파싱 방식 확인
grep -rn "useLocalSearchParams\|useSearchParams\|router.push\|router.replace" \
  ~/Projects/k-saju/apps/mobile/src --include="*.tsx" | head -10

# 비로그인 리다이렉트 처리 패턴 확인
grep -rn "isAuthenticated\|session.*null\|router.*login\|redirect.*auth" \
  ~/Projects/k-saju/apps/mobile/src --include="*.tsx" | head -10

# 기존 화면 파일 구조 파악 (읽기용)
cat $(ls ~/Projects/k-saju/apps/mobile/src/app/\(tabs\)/*.tsx | head -1)

━━━ [원칙 2] REUSE ━━━
- Magic Link 딥링크 핸들러 수정 시, 기존 Magic Link 처리 로직 유지
- router, useLocalSearchParams 등 기존 네비게이션 패턴 그대로
- 비로그인 처리 로직은 기존 패턴 그대로 재사용

━━━ [원칙 3] ISOLATION ━━━
- 딥링크 핸들러 수정은 최소한으로 (기존 Magic Link 처리에 elif 추가 수준)
- compare 화면은 신규 파일로만 처리

━━━ 작업 내용 ━━━

파일 1: apps/mobile/src/app/(tabs)/k-type/compare.tsx (신규)
- URL 파라미터 share (userId) 추출
- Supabase에서 해당 userId의 k_personality_results 조회
  (share_enabled = true인 것만)
- 현재 유저의 useKPersonality() 결과와 나란히 표시
- 오행 상생(相生) 관계 계산:
  木→火→土→金→水→木 (상생), 木→土→水→火→金→木 (상극)
- "우리의 오행 궁합" 점수 + 간단한 설명 표시

파일 2: 기존 딥링크 핸들러 수정 (최소 변경)
- 기존 파일을 열어서 k-saju://k-type?share=xxx 패턴을 처리하는
  분기문 추가 (기존 Magic Link 처리는 절대 수정하지 않음)
- 비로그인: 비교 화면 미리보기 → 가입 유도 → 로그인 후 본인 결과 표시

━━━ [원칙 4] VERIFY ━━━
작업 완료 후 순서대로 실행하고 결과를 보고해줘:

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# 린트
npx eslint apps/mobile/src/app/\(tabs\)/k-type/compare.tsx \
  --ext .tsx --max-warnings 0 2>&1

# Magic Link 딥링크 처리 코드 미변경 확인 (핵심)
git diff $(find ~/Projects/k-saju/apps/mobile/src -name "+native-intent*" 2>/dev/null) \
  | grep "^-" | grep -v "^---" | grep -v "k-type\|kPersonality\|share" | head -10
# → Magic Link 관련 기존 코드가 제거된 줄이 없어야 함

# 기존 인증 플로우 미영향 확인
git diff apps/mobile/src/app/ | grep "^---\|^+++" | \
  grep -v "k-type\|kPersonality"
# → k-type 외 화면 파일 변경 없음

# 신규 화면 파일 확인
ls apps/mobile/src/app/\(tabs\)/k-type/

검증 결과 표:
| 검증 항목                               | 결과      | 비고 |
|-----------------------------------------|-----------|------|
| tsc 에러 0개                            | PASS/FAIL |      |
| eslint 0개                              | PASS/FAIL |      |
| Magic Link 처리 코드 미삭제             | PASS/FAIL |      |
| 기존 화면 파일 미변경                   | PASS/FAIL |      |
| compare.tsx 생성됨                      | PASS/FAIL |      |

FAIL 항목 있으면 수정 후 재실행해줘.
```

---

## M2 마일스톤 완료 검증

```
[M2-COMPLETE] Milestone 2 전체 완료 검증을 실행해줘.

# 1. 전체 TypeScript 빌드
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1
# → 에러 0개

# 2. kPersonality 관련 전체 린트
npx eslint apps/mobile/src/components/kPersonality/ \
           apps/mobile/src/app/\(tabs\)/k-type/ \
  --ext .ts,.tsx --max-warnings 0 2>&1

# 3. 전체 테스트 스위트
cd apps/mobile && [테스트 명령어] 2>&1 | tail -20

# 4. 신규 파일 목록 확인
git diff --name-only HEAD | grep -E "M1|M2|kPersonality|k-type"
# → M2 파일들만 추가됨 확인

# 5. M2 커밋
git add apps/mobile/src/components/kPersonality/ \
        apps/mobile/src/app/\(tabs\)/k-type/compare.tsx \
        [딥링크 핸들러 파일]
git commit -m "feat(M2): Add K-Personality UI components and share/compare flow"

M2 완료 체크리스트:
| 항목                                         | 결과      |
|----------------------------------------------|-----------|
| ElementBarChart, KTypeBadge, ResultCard 생성 | PASS/FAIL |
| compare.tsx 생성                             | PASS/FAIL |
| Magic Link 딥링크 미충돌                     | PASS/FAIL |
| 전체 테스트 PASS                             | PASS/FAIL |
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MILESTONE 3: K-Type 탭 화면 + RevenueCat 연동
# 목표 기간: 1주
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## M3-STEP-1: K-Type 탭 메인 화면

```
[M3-STEP-1] K-Type 탭 메인 화면을 생성해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 기존 탭 화면 구조 전체 파악 (readings 또는 weekly 탭)
cat ~/Projects/k-saju/apps/mobile/src/app/\(tabs\)/readings/index.tsx \
  2>/dev/null || \
cat ~/Projects/k-saju/apps/mobile/src/app/\(tabs\)/weekly/index.tsx

# 로딩 컴포넌트 확인
grep -rn "Loading\|Spinner\|ActivityIndicator" \
  ~/Projects/k-saju/apps/mobile/src/components --include="*.tsx" | head -5

# SafeAreaView, SafeScrollView 등 기존 래퍼 확인
grep -rn "SafeScrollView\|SafeAreaView\|useSafeAreaInsets" \
  ~/Projects/k-saju/apps/mobile/src/app --include="*.tsx" | head -5

# useTranslation 사용 패턴 확인
grep -n "useTranslation\|t(" \
  ~/Projects/k-saju/apps/mobile/src/app/\(tabs\)/readings/index.tsx 2>/dev/null | head -10

# 기존 탭 화면의 Header 컴포넌트 사용 방식 확인
grep -n "Header\|header" \
  ~/Projects/k-saju/apps/mobile/src/app/\(tabs\)/readings/index.tsx 2>/dev/null | head -5

━━━ [원칙 2] REUSE ━━━
기존 탭 화면의 아래 패턴을 그대로 복사해서 사용해줘:
- import 구조 (React, hooks, components 순서)
- SafeAreaView/SafeScrollView 사용 방식
- Loading 상태 처리 컴포넌트
- Header 컴포넌트 사용 방식
- useTranslation 사용 방식

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 index.tsx 파일만 생성. _layout.tsx 수정은 다음 스텝.

━━━ 작업 내용 ━━━

# apps/mobile/src/app/(tabs)/k-type/index.tsx 생성

화면 구성 (3가지 상태):

[로딩 상태]
기존 Loading 컴포넌트 재사용
텍스트: t('kPersonality.analyzing')

[무료 결과 상태]
- KTypeBadge (large)
- ElementBarChart (medium, animated: true)
- 키워드 태그 3개
- summaryShort
- [공유하기] 버튼 (useShareKPersonality().share 호출)
- [전체 리포트 보기] 버튼 (KPersonalityPaywall 표시, 비구독자만)

[프리미엄 결과 상태] (isPremium: true)
- 무료 결과 전체 포함
- summaryFull 섹션
- 강점 3개 섹션
- 성장 영역 2개 섹션
- 직업 적합도 5개 섹션
- 이달의 에너지 섹션
- 궁합 유형 섹션

useKPersonality() 훅 사용
에러 상태: 기존 에러 처리 컴포넌트 재사용

━━━ [원칙 4] VERIFY ━━━

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# 린트
npx eslint apps/mobile/src/app/\(tabs\)/k-type/index.tsx \
  --ext .tsx --max-warnings 0 2>&1

# 기존 탭 화면 미변경 확인
git diff apps/mobile/src/app/\(tabs\)/readings/ \
         apps/mobile/src/app/\(tabs\)/weekly/ 2>/dev/null | head -10
# → 변경사항 없음

검증 결과 표:
| 검증 항목                      | 결과      |
|--------------------------------|-----------|
| tsc 에러 0개                   | PASS/FAIL |
| eslint 0개                     | PASS/FAIL |
| 기존 탭 화면 미변경            | PASS/FAIL |
| i18n 키 모두 사용됨            | PASS/FAIL |
```

---

## M3-STEP-2: 탭 네비게이션 추가

```
[M3-STEP-2] _layout.tsx에 K-Type 탭을 추가하고 i18n 키를 업데이트해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 현재 탭 목록과 순서 파악
cat ~/Projects/k-saju/apps/mobile/src/app/\(tabs\)/_layout.tsx

# 탭 아이콘 라이브러리 확인
grep -n "Ionicons\|MaterialIcons\|Feather\|tabBarIcon" \
  ~/Projects/k-saju/apps/mobile/src/app/\(tabs\)/_layout.tsx

# i18n 번역 파일 전체 목록 및 경로 확인
find ~/Projects/k-saju/apps/mobile -name "*.json" -path "*/locales/*" | sort
ls $(find ~/Projects/k-saju/apps/mobile -path "*/locales/*" -name "en.json" \
  | head -1 | xargs dirname)
# → 15개 언어 파일 목록 확인

# 기존 탭명 i18n 키 확인 (tabs.* 네임스페이스 확인)
grep -n "tabs\." \
  $(find ~/Projects/k-saju/apps/mobile -name "en.json" -path "*/locales/*")

━━━ [원칙 2] REUSE ━━━
- 탭 추가 방식은 기존 탭과 완전히 동일한 코드 패턴
- 아이콘 라이브러리는 기존과 동일한 것만 사용
- i18n 파일 업데이트는 기존 키 구조 동일하게 유지

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 _layout.tsx 탭 추가 + 15개 i18n 파일 kPersonality 키 추가만.
화면 파일 내용 변경 없음.

━━━ 작업 내용 ━━━

1. _layout.tsx에 K-Type 탭 추가
   위치: readings 탭 뒤, profile 탭 앞
   name: 'k-type'
   title: t('tabs.kType')
   icon: 기존 아이콘 라이브러리에서 'leaf-outline' / 'leaf'
   (없으면 'star-outline' / 'star' 등 기존 아이콘으로 대체)

2. 15개 언어 파일에 kPersonality 섹션 추가
   (각 언어 파일 경로를 먼저 확인하고 하나씩 업데이트)

   추가할 i18n 키:
   tabs.kType / kPersonality.title / kPersonality.subtitle /
   kPersonality.analyzing / kPersonality.yourType /
   kPersonality.keywords / kPersonality.shareCard /
   kPersonality.unlockReport / kPersonality.strengths /
   kPersonality.growthAreas / kPersonality.careerFit /
   kPersonality.compatibility / kPersonality.monthlyFlow /
   kPersonality.compareWithFriend /
   kPersonality.sasangTypes.{taeyang,soyang,taeeum,soeum} /
   kPersonality.elements.{wood,fire,earth,metal,water}

   번역 참고:
   en: "K-Type" / "Your K-Type" / "Analyzing energy..." / ...
   ko: "K유형" / "나의 K유형" / "오행 에너지 분석 중..." / ...
   ja: "Kタイプ" / ...
   (나머지 12개 언어: 영어 기준으로 자연스럽게 번역,
    사상체질 명칭은 로마자 음차 유지: Taeyang, Soyang, Taeeum, Soeum)

━━━ [원칙 4] VERIFY ━━━

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# _layout.tsx 탭 추가 확인
grep -n "k-type\|kType\|K-Type" \
  apps/mobile/src/app/\(tabs\)/_layout.tsx

# 15개 언어 파일 모두 kPersonality 키 포함 확인
for lang_file in $(find apps/mobile -name "*.json" -path "*/locales/*"); do
  count=$(grep -c "kPersonality" "$lang_file" 2>/dev/null || echo "0")
  echo "$lang_file: $count keys"
done
# → 모든 파일에 kPersonality 키 존재 확인

# JSON 유효성 확인 (15개 파일 모두)
for lang_file in $(find apps/mobile -name "*.json" -path "*/locales/*"); do
  python3 -m json.tool "$lang_file" > /dev/null 2>&1 && \
    echo "✅ $lang_file" || echo "❌ JSON 에러: $lang_file"
done

# 기존 탭 구조 미변경 확인 (기존 탭들이 그대로 있는지)
grep -c "Tabs.Screen" apps/mobile/src/app/\(tabs\)/_layout.tsx
# → 기존 탭 수 + 1 (k-type 추가) 확인

검증 결과 표:
| 검증 항목                         | 결과      | 비고 |
|-----------------------------------|-----------|------|
| tsc 에러 0개                      | PASS/FAIL |      |
| k-type 탭 _layout.tsx에 추가됨   | PASS/FAIL |      |
| 15개 언어 파일 모두 업데이트됨    | PASS/FAIL |      |
| 15개 JSON 파일 유효성 통과        | PASS/FAIL |      |
| 기존 탭 미삭제                    | PASS/FAIL |      |

FAIL 항목 있으면 수정 후 재실행해줘.
```

---

## M3-STEP-3: KPersonalityPaywall 컴포넌트

```
[M3-STEP-3] K-Personality 전용 Paywall 컴포넌트를 생성해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 기존 Paywall 구현 전체 파악
find ~/Projects/k-saju/apps/mobile/src -name "*Paywall*" -o -name "*paywall*" 2>/dev/null
cat $(find ~/Projects/k-saju/apps/mobile/src -name "*Paywall*" | head -1) | head -80

# RevenueCat Offering 조회 방식 확인
grep -rn "getOfferings\|Offerings\|currentOffering" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" --include="*.tsx" | head -10

# 기존 presentPaywall 또는 paywall 트리거 방식 확인
grep -rn "presentPaywall\|showPaywall\|Purchases.shared" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" --include="*.tsx" | head -10

# Modal 컴포넌트 사용 패턴 확인
grep -rn "Modal\|BottomSheet\|modal" \
  ~/Projects/k-saju/apps/mobile/src/components --include="*.tsx" | head -5

━━━ [원칙 2] REUSE ━━━
기존 Paywall의 아래를 그대로 재사용:
- RevenueCat Offerings 조회 방식
- 구독 버튼 클릭 → Purchases.purchasePackage() 방식
- 복원 버튼 → Purchases.restorePurchases() 방식
- 성공/실패 처리 패턴

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 KPersonalityPaywall 컴포넌트만 생성.
기존 Paywall 파일 수정 없음.

━━━ 작업 내용 ━━━

# apps/mobile/src/components/kPersonality/KPersonalityPaywall.tsx 생성

interface KPersonalityPaywallProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

UI 구성:
- 잠금 아이콘 (기존 아이콘 라이브러리)
- 헤드라인: t('kPersonality.unlockReport')
- 포함 항목 체크리스트 (i18n 키 사용):
  ✓ 심층 성격 분석 (500자+)
  ✓ 강점 & 성장 영역
  ✓ 직업 적합도 TOP 5
  ✓ 오행 궁합 유형
  ✓ 이달의 에너지 흐름
- "기존 구독자는 바로 이용 가능" 안내 텍스트
- RevenueCat Offering 조회 → 가격 표시
- [구독 시작] / [기존 구독 복원] 버튼
- 닫기 버튼

기존 Paywall 구현 방식을 그대로 따르되,
UI 텍스트만 K-Personality에 맞게 변경.

━━━ [원칙 4] VERIFY ━━━

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# 린트
npx eslint apps/mobile/src/components/kPersonality/KPersonalityPaywall.tsx \
  --ext .tsx --max-warnings 0 2>&1

# 기존 Paywall 파일 미변경 확인
git diff $(find apps/mobile/src -name "*Paywall*" | grep -v "kPersonality") \
  | head -10
# → 빈 출력 (변경 없음)

검증 결과 표:
| 검증 항목                    | 결과      |
|------------------------------|-----------|
| tsc 에러 0개                 | PASS/FAIL |
| eslint 0개                   | PASS/FAIL |
| 기존 Paywall 미변경          | PASS/FAIL |
| RevenueCat 패턴 재사용       | PASS/FAIL |
```

---

## M3-STEP-4: 사주 결과 화면 티저 임베드

```
[M3-STEP-4] 기존 사주 결과 화면에 K-Type 티저 카드를 추가해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 사주 결과 화면 파일 특정
find ~/Projects/k-saju/apps/mobile/src/app/\(tabs\) -name "*.tsx" | \
  xargs grep -l "weekly\|fortune\|reading\|saju" 2>/dev/null | head -5
# → 임베드 대상 파일 특정

# 대상 파일 전체 내용 파악
cat [임베드 대상 파일]
# → 어디에 추가할지 (주간 운세 카드 섹션 아래) 정확한 위치 파악

# 기존 화면의 ScrollView 구조 파악
# → 추가할 위치의 부모 컴포넌트 확인

━━━ [원칙 2] REUSE ━━━
useKPersonality()는 이미 훅 내부에서 캐싱되므로 추가 API 호출 없음.
티저 카드는 KTypeBadge(small) + ElementBarChart(small) 재사용.

━━━ [원칙 3] ISOLATION ━━━
기존 화면 파일에 최소한의 변경만 수행:
1. useKPersonality() import 추가
2. KPersonalityTeaser 컴포넌트 정의 (파일 내 또는 별도 파일)
3. JSX에 <KPersonalityTeaser /> 1줄 추가

기존 화면의 다른 로직, 스타일, 컴포넌트 건드리지 않음.

━━━ 작업 내용 ━━━

KPersonalityTeaser 컴포넌트 (인라인 또는 별도 파일):
- useKPersonality()의 캐시된 data 사용 (isLoading 중이면 null 반환)
- KTypeBadge (small)
- ElementBarChart (small, animated: false)
- "K-Type 전체 분석 보기 →" CTA 텍스트
- 터치 시 router.push('/(tabs)/k-type') 이동
- data가 없으면 null 반환 (화면에 아무것도 표시 안 함)

임베드 위치: 주간 운세 카드 섹션 아래, 기존 마지막 요소 위

━━━ [원칙 4] VERIFY ━━━

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# 린트 (수정된 파일 포함)
npx eslint [임베드 대상 파일] --ext .tsx --max-warnings 0 2>&1

# 기존 화면 변경사항 최소 확인 (임베드 이외 변경 없음)
git diff [임베드 대상 파일] | grep "^+" | grep -v "KPersonalityTeaser\|useKPersonality\|k-type\|kPersonality" | head -10
# → 추가된 줄이 티저 관련 코드만 있어야 함

# 기존 화면 테스트 미영향
[테스트 명령어] --testPathPattern="readings\|weekly\|home" 2>&1 | tail -10

검증 결과 표:
| 검증 항목                              | 결과      | 비고 |
|----------------------------------------|-----------|------|
| tsc 에러 0개                           | PASS/FAIL |      |
| eslint 0개                             | PASS/FAIL |      |
| 기존 화면 최소 변경 확인               | PASS/FAIL |      |
| 기존 화면 테스트 미영향                | PASS/FAIL |      |
| data 없으면 null 반환 로직 존재        | PASS/FAIL |      |

FAIL 항목 있으면 수정 후 재실행해줘.
```

---

## M3 마일스톤 완료 검증

```
[M3-COMPLETE] Milestone 3 전체 완료 검증을 실행해줘.

# 1. 전체 TypeScript 빌드
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1
# → 에러 0개

# 2. 전체 린트
npx eslint apps/mobile/src/ --ext .ts,.tsx --max-warnings 0 2>&1 | tail -5

# 3. 전체 테스트 스위트
cd apps/mobile && [테스트 명령어] 2>&1 | tail -20

# 4. i18n 완전성 최종 확인
for lang_file in $(find apps/mobile -name "*.json" -path "*/locales/*"); do
  missing=$(python3 -c "
import json, sys
with open('$(find apps/mobile -name "en.json" -path "*/locales/*")') as f:
    en = json.load(f)
with open('$lang_file') as f:
    lang = json.load(f)
kp_en = en.get('kPersonality', {})
kp_lang = lang.get('kPersonality', {})
missing = [k for k in kp_en if k not in kp_lang]
if missing: print('MISSING:', missing)
" 2>/dev/null)
  [ -n "$missing" ] && echo "❌ $lang_file: $missing" || echo "✅ $lang_file"
done

# 5. M3 커밋
git add apps/mobile/src/app/\(tabs\)/k-type/index.tsx \
        apps/mobile/src/app/\(tabs\)/_layout.tsx \
        apps/mobile/src/components/kPersonality/KPersonalityPaywall.tsx \
        [임베드 대상 파일] \
        apps/mobile/locales/
git commit -m "feat(M3): Add K-Type tab screen, paywall, i18n, and teaser embed"

M3 완료 체크리스트:
| 항목                                     | 결과      |
|------------------------------------------|-----------|
| K-Type 탭 화면 (index.tsx) 생성          | PASS/FAIL |
| 탭 네비게이션 추가                        | PASS/FAIL |
| 15개 언어 kPersonality 키 추가           | PASS/FAIL |
| KPersonalityPaywall 생성                 | PASS/FAIL |
| 사주 결과 화면 티저 임베드               | PASS/FAIL |
| 전체 테스트 PASS                         | PASS/FAIL |
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MILESTONE 4: 캐싱 최적화 + 딥링크 완성
# 목표 기간: 3일
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## M4-STEP-1: 캐시 동기화 로직

```
[M4-STEP-1] useKPersonality 훅에 캐시 저장/동기화 로직을 추가해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 기존 React Query 캐시 패턴 (setQueryData, prefetchQuery) 확인
grep -rn "setQueryData\|prefetchQuery\|queryClient\." \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" | head -10

# 기존 Supabase upsert 패턴 확인
grep -rn "upsert\|onConflict" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" | head -10

# 기존 i18n 언어 변경 감지 패턴 확인
grep -rn "i18n.on\|languageChanged\|i18n.language" \
  ~/Projects/k-saju/apps/mobile/src --include="*.ts" --include="*.tsx" | head -5

━━━ [원칙 2] REUSE ━━━
기존 훅 파일들의 Supabase upsert 패턴 그대로 사용.
React Query queryClient는 기존과 동일한 Provider에서 가져오기.

━━━ [원칙 3] ISOLATION ━━━
이 스텝은 useKPersonality.ts 파일만 수정.
다른 파일 건드리지 않음.

━━━ 작업 내용 ━━━

useKPersonality.ts에 아래 로직 추가:

1. 분석 완료 onSuccess 콜백에서:
   - k_personality_results upsert (user_id + language unique 처리)
   - k_personality_cache upsert (expires_at = now() + 24h)
   - 실패해도 결과 표시에 영향 없도록 try-catch

2. 앱 재시작 시 캐시 우선 로드:
   - useQuery의 queryFn에서 먼저 Supabase k_personality_cache 조회
   - 유효한 캐시 있으면 DB에서 결과 반환 (API 호출 생략)
   - 없으면 Edge Function 호출

3. i18n.language 변경 감지:
   - useEffect의 dependency에 i18n.language 추가
   - 언어 변경 시 queryClient.invalidateQueries(['kPersonality', ...]) 호출

━━━ [원칙 4] VERIFY ━━━

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# 린트
npx eslint apps/mobile/src/hooks/useKPersonality.ts --ext .ts --max-warnings 0

# 기존 훅들 미영향 확인
npx tsc --noEmit 2>&1 | grep -v "useKPersonality\|kPersonality" | head -10

# 수정사항 최소화 확인
git diff apps/mobile/src/hooks/useKPersonality.ts | grep "^+" | wc -l
# → 너무 많은 줄 추가된 경우 검토 필요

검증 결과 표:
| 검증 항목                    | 결과      |
|------------------------------|-----------|
| tsc 에러 0개                 | PASS/FAIL |
| eslint 0개                   | PASS/FAIL |
| 기존 훅 미영향               | PASS/FAIL |
| try-catch 캐시 로직 존재     | PASS/FAIL |
```

---

## M4-STEP-2: 딥링크 최종 완성

```
[M4-STEP-2] 딥링크 설정 최종 완성 및 충돌 검증을 수행해줘.

━━━ [원칙 1] PRE-CHECK ━━━

# app.config.ts 전체 확인
cat ~/Projects/k-saju/apps/mobile/app.config.ts

# 현재 iOS scheme/Android intentFilter 설정 확인
grep -A 15 "scheme\|intentFilter\|associatedDomain" \
  ~/Projects/k-saju/apps/mobile/app.config.ts

# 기존 딥링크 핸들러 전체 파악
cat $(find ~/Projects/k-saju/apps/mobile/src -name "+native-intent*" 2>/dev/null | head -1)

# Magic Link 처리 URL 패턴 확인
grep -n "magic\|magiclink\|token_hash\|type.*email" \
  $(find ~/Projects/k-saju/apps/mobile/src -name "+native-intent*" 2>/dev/null | head -1)

━━━ [원칙 2] REUSE / [원칙 3] ISOLATION ━━━
Magic Link 처리 코드는 절대 수정하지 않음.
k-type 관련 분기문만 추가.

━━━ 작업 내용 ━━━

1. app.config.ts 확인 및 최소 수정:
   - iOS: scheme에 k-saju 이미 있는지 확인
   - Android: intentFilters에 k-type 경로 없으면 추가
   - 수정이 필요 없으면 수정하지 않음

2. 딥링크 핸들러 k-type 분기 추가:
   기존 if/else 체인에 아래 분기 추가:
   if (url.includes('k-type') && url.includes('share=')) {
     // userId 파라미터 추출
     // router.push('/(tabs)/k-type/compare?share=' + userId)
   }
   (기존 Magic Link 분기 수정 절대 없음)

━━━ [원칙 4] VERIFY ━━━

# 타입 에러
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | head -20

# Magic Link 처리 코드 유지 확인 (핵심 검증)
git diff $(find apps/mobile/src -name "+native-intent*" | head -1) | \
  grep "^-" | grep -v "^---" | \
  grep -v "k-type\|compare\|share=" | head -20
# → Magic Link 관련 기존 코드 삭제된 줄 없어야 함

# app.config.ts 변경 최소화 확인
git diff apps/mobile/app.config.ts | grep "^+" | grep -v "k-type" | head -5
# → k-type 추가 외 변경 없어야 함

검증 결과 표:
| 검증 항목                             | 결과      |
|---------------------------------------|-----------|
| tsc 에러 0개                          | PASS/FAIL |
| Magic Link 코드 삭제된 줄 없음        | PASS/FAIL |
| app.config.ts 최소 변경               | PASS/FAIL |
| k-type 분기 추가됨                    | PASS/FAIL |
```

---

## M4 마일스톤 완료 검증

```
[M4-COMPLETE] Milestone 4 전체 완료 검증을 실행해줘.

# 전체 빌드 + 테스트
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 && echo "✅ tsc PASS"
cd apps/mobile && [테스트 명령어] 2>&1 | tail -10

# Magic Link 딥링크 미충돌 최종 확인
grep -n "magic\|token_hash\|email" \
  $(find apps/mobile/src -name "+native-intent*" | head -1)
# → 기존 Magic Link 코드 그대로 존재 확인

# M4 커밋
git add apps/mobile/src/hooks/useKPersonality.ts \
        apps/mobile/app.config.ts \
        $(find apps/mobile/src -name "+native-intent*")
git commit -m "feat(M4): Add cache sync, deep link k-type handler"

M4 완료 체크리스트:
| 항목                              | 결과      |
|-----------------------------------|-----------|
| 캐시 저장/복원 로직 추가          | PASS/FAIL |
| 언어 변경 자동 재분석             | PASS/FAIL |
| 딥링크 k-type 분기 추가           | PASS/FAIL |
| Magic Link 딥링크 미충돌          | PASS/FAIL |
| 전체 테스트 PASS                  | PASS/FAIL |
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MILESTONE 5: QA 자동화 + EAS 빌드
# 목표 기간: 4일
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## M5-STEP-1: 종합 자동화 QA

```
[M5-STEP-1] K-Personality 전체 자동화 QA를 실행해줘.
에러가 있으면 수정하고 모두 PASS될 때까지 반복해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# 현재 브랜치 확인
cd ~/Projects/k-saju && git branch && git log --oneline -5

# 전체 신규 파일 목록 확인
git diff --name-only main 2>/dev/null || git diff --name-only HEAD~10

━━━ QA 체크리스트 ━━━

# [QA-1] TypeScript 전체 빌드
npx tsc --noEmit 2>&1
목표: 에러 0개

# [QA-2] 전체 린트
npx eslint apps/mobile/src/ --ext .ts,.tsx --max-warnings 0 2>&1 | tail -10
목표: 경고/에러 0개

# [QA-3] 전체 테스트 스위트 실행
cd apps/mobile && [테스트 명령어] --coverage 2>&1 | tail -30
목표: 기존 테스트 전체 PASS + 신규 테스트 전체 PASS

# [QA-4] 오행 계산 정확성 검증 (5개 케이스)
cd apps/mobile && [테스트 명령어] \
  --testPathPattern="calculator" --verbose 2>&1
목표: 모든 케이스 PASS

# [QA-5] 신규 파일들이 기존 화면에 영향 없는지 확인
cd ~/Projects/k-saju && git stash
cd apps/mobile && [테스트 명령어] 2>&1 | tail -5 > /tmp/before_test.txt
cd ~/Projects/k-saju && git stash pop
cd apps/mobile && [테스트 명령어] 2>&1 | tail -5 > /tmp/after_test.txt
diff /tmp/before_test.txt /tmp/after_test.txt
# → diff 없으면 기존 기능 미영향

# [QA-6] 15개 i18n 파일 JSON 유효성 + kPersonality 키 완전성
python3 -c "
import json, os, glob
en_path = glob.glob('apps/mobile/**/en.json', recursive=True)[0]
with open(en_path) as f: en = json.load(f)
kp_en = en.get('kPersonality', {})
all_pass = True
for path in glob.glob('apps/mobile/**/*.json', recursive=True):
    if '/locales/' not in path and '/i18n/' not in path: continue
    with open(path) as f:
        try: lang = json.load(f)
        except: print(f'❌ JSON 에러: {path}'); all_pass=False; continue
    kp = lang.get('kPersonality', {})
    missing = [k for k in kp_en if k not in kp]
    if missing: print(f'❌ {os.path.basename(path)}: 누락 {missing}'); all_pass=False
    else: print(f'✅ {os.path.basename(path)}')
print('전체 PASS' if all_pass else '수정 필요')
"

# [QA-7] 기존 Magic Link 딥링크 코드 보존 확인
grep -c "magic\|token_hash\|email.*link" \
  $(find apps/mobile/src -name "+native-intent*" 2>/dev/null | head -1) 2>/dev/null
# → 1 이상 (기존 Magic Link 코드 존재)

# [QA-8] RevenueCat entitlement 분기 코드 존재 확인
grep -n "isPremium\|entitlement" \
  apps/mobile/src/hooks/useKPersonality.ts
grep -n "isPremium\|onUnlock\|KPersonalityPaywall" \
  apps/mobile/src/app/\(tabs\)/k-type/index.tsx
# → 무료/프리미엄 분기 로직 존재 확인

━━━ QA 결과 표 ━━━
에러 발생 시 즉시 수정 후 해당 항목 재실행:

| QA 항목                              | 결과      | 에러 내용 |
|--------------------------------------|-----------|-----------|
| QA-1: tsc 에러 0개                   | PASS/FAIL |           |
| QA-2: eslint 0개                     | PASS/FAIL |           |
| QA-3: 전체 테스트 PASS               | PASS/FAIL |           |
| QA-4: 오행 계산 5케이스 PASS         | PASS/FAIL |           |
| QA-5: 기존 기능 미영향               | PASS/FAIL |           |
| QA-6: 15개 언어 파일 완전성          | PASS/FAIL |           |
| QA-7: Magic Link 코드 보존           | PASS/FAIL |           |
| QA-8: 프리미엄 분기 로직 존재        | PASS/FAIL |           |

모든 항목 PASS 후 다음 스텝으로 진행해줘.
```

---

## M5-STEP-2: EAS Preview 빌드

```
[M5-STEP-2] K-Personality 기능이 포함된 Preview 빌드를 생성해줘.

━━━ [원칙 1] PRE-CHECK ━━━
시작 전 아래를 확인해줘:

# M5-STEP-1 QA 전체 PASS 확인 (선행 조건)
cd ~/Projects/k-saju && npx tsc --noEmit 2>&1 | grep -c "error" || echo "0 errors"

# 신규 패키지 native 모듈 여부 확인
cat apps/mobile/package.json | grep -E "view-shot|expo-sharing|expo-media"
# → native 모듈이면 EAS 빌드 필수 (expo run:ios 불가)

# 현재 app.config.ts 버전 확인
grep "version\|buildNumber\|versionCode" \
  apps/mobile/app.config.ts | head -5

# eas.json 프로필 확인
cat apps/mobile/eas.json

# EAS 로그인 상태 확인
eas whoami 2>&1

━━━ 작업 내용 ━━━

1. 버전 업데이트 (app.config.ts)
   현재 버전을 확인하고 patch 버전 +1
   예: 2.3.0 → 2.4.0 (major feature)

2. react-native-view-shot native 확인
   npx expo install react-native-view-shot 2>&1 | head -5
   → 이미 설치된 경우 스킵

3. Android Preview 빌드
   cd ~/Projects/k-saju/apps/mobile
   eas build --profile preview --platform android --non-interactive 2>&1

4. 빌드 성공 후 시뮬레이터 실행
   eas build:run --platform android 2>&1

5. iOS는 Apple Developer 승인 완료 후:
   eas build --profile preview --platform ios --non-interactive 2>&1

━━━ [원칙 4] VERIFY ━━━

# 빌드 전 최종 타입 확인
npx tsc --noEmit 2>&1 | grep -c "error"
# → 0 확인 후 빌드 시작

# 빌드 로그 에러 키워드 확인
eas build:list --limit 1 --json 2>/dev/null | python3 -c "
import json,sys
builds = json.load(sys.stdin)
if builds: print(builds[0].get('status','unknown'))
" 2>/dev/null

# react-native-view-shot 빌드 이슈 발생 시:
# → package.json의 resolutions 또는 expo.plugins 확인
# → 기존 K-Saju 빌드에서 사용하지 않던 패키지는 expo prebuild 후 확인

빌드 결과:
| 항목                          | 결과      | 비고 |
|-------------------------------|-----------|------|
| Android Preview 빌드 성공     | PASS/FAIL |      |
| iOS Preview 빌드 성공         | PASS/FAIL |      |
| 시뮬레이터 K-Type 탭 표시됨   | PASS/FAIL |      |
```

---

## M5-STEP-3: PR 및 최종 정리

```
[M5-STEP-3] feat/k-personality → main PR을 준비하고 최종 정리해줘.

━━━ [원칙 1] PRE-CHECK ━━━

# 전체 변경 파일 목록 최종 확인
cd ~/Projects/k-saju && git diff --name-only main 2>/dev/null | sort

# 예상 외 파일 변경 없는지 확인
git diff --name-only main 2>/dev/null | \
  grep -v "kPersonality\|k-type\|k_personality\|_layout\|locales\|CHANGELOG\|app.config"
# → 이 grep에 걸리는 파일이 있으면 의도치 않은 변경이므로 검토 필요

━━━ 작업 내용 ━━━

1. 전체 커밋 정리 (interactive rebase 또는 squash)
   최종 커밋 구조:
   feat(M1): Add K-Personality engine, types, edge function
   feat(M2): Add K-Personality UI components and compare flow
   feat(M3): Add K-Type tab screen, paywall, i18n
   feat(M4): Add cache sync and deep link handler
   feat(M5): QA pass, version bump v2.4.0

2. CHANGELOG.md 업데이트
   ## v2.4.0 (2026-03-xx)
   ### Added
   - K-Personality: 오행 × 사상체질 AI 기질 분석
   - 무료: 유형 배지 + 오행 차트 + 키워드 + 결과 카드 공유
   - 프리미엄: 심층 리포트 + 직업 적합도 + 오행 궁합
   - 친구 비교 딥링크

3. 최종 전체 검증 실행
   cd ~/Projects/k-saju
   npx tsc --noEmit && echo "✅ tsc PASS"
   cd apps/mobile && [테스트 명령어] 2>&1 | tail -5

━━━ [원칙 4] VERIFY ━━━

# 기존 파일 의도치 않은 변경 없음 최종 확인
git diff --stat main 2>/dev/null | tail -5
# → 신규/수정 파일 수가 예상 범위 내인지 확인

# 최종 빌드
npx tsc --noEmit 2>&1 | grep -c "error" && echo "에러 있음" || echo "✅ 에러 없음"

최종 완료 체크리스트:
| 항목                                         | 결과      |
|----------------------------------------------|-----------|
| 전체 tsc 에러 0개                            | PASS/FAIL |
| 전체 테스트 PASS                             | PASS/FAIL |
| 의도치 않은 파일 변경 없음                   | PASS/FAIL |
| CHANGELOG 업데이트                           | PASS/FAIL |
| EAS Preview 빌드 성공 (Android)              | PASS/FAIL |
| 커밋 정리 완료                               | PASS/FAIL |
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 수동 QA 체크리스트 (Donghyun 직접 테스트)
# Preview 빌드 후 iOS + Android 각각 확인
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
범례: ⬜ 미완료  ✅ 통과  ❌ 실패

## 🌿 K-Type 기본 흐름
⬜ K-Type 탭 진입 → 로딩 → 결과 정상 표시
   iOS: ___  Android: ___

⬜ 오행 바 차트 애니메이션 정상
   iOS: ___  Android: ___

⬜ KTypeBadge 색상/이모지 정상
   iOS: ___  Android: ___

⬜ 기존 탭 (Home/Weekly/Readings/Profile) 정상 동작 미영향
   iOS: ___  Android: ___

## 📤 공유 기능
⬜ 공유하기 → 카드 이미지 생성 → 공유 시트 표시
   iOS: ___  Android: ___

⬜ 공유 링크 → 브라우저 → 비교 화면 표시
   iOS: ___  Android: ___

⬜ 비로그인 공유 링크 접근 → 가입 유도 정상
   iOS: ___  Android: ___

## 💳 프리미엄 흐름
⬜ 비구독자 → 리포트 CTA → Paywall 표시
   iOS: ___  Android: ___

⬜ 구독자 → 프리미엄 리포트 바로 표시
   iOS: ___  Android: ___

⬜ 사주 결과 화면 하단 K-Type 티저 표시
   iOS: ___  Android: ___

## 🔗 Magic Link 딥링크 미충돌 확인 (중요)
⬜ Magic Link 이메일 → 링크 클릭 → 앱 정상 로그인 (기존 기능 미영향)
   iOS: ___  Android: ___

## 🌍 다국어
⬜ 언어 변경 → K-Type 결과 새 언어로 재분석
   en: ___  ko: ___  ja: ___

⬜ 아랍어(ar) K-Type 화면 RTL 레이아웃 정상
   iOS: ___  Android: ___

## ⚡ 캐시 동작
⬜ 앱 재시작 → K-Type 즉시 표시 (API 재호출 없음)
   iOS: ___  Android: ___
```

---

# 빠른 참조: 파일 변경 지도

```
신규 생성:
apps/mobile/src/
├── types/kPersonality.ts                       ← M1-S1
├── engine/kPersonality/
│   ├── elementMapping.ts                       ← M1-S2
│   ├── calculator.ts                           ← M1-S3
│   └── __tests__/
│       ├── elementMapping.test.ts
│       └── calculator.test.ts
├── hooks/useKPersonality.ts                    ← M1-S6
├── components/kPersonality/
│   ├── ElementBarChart.tsx                     ← M2-S1
│   ├── KTypeBadge.tsx                          ← M2-S2
│   ├── KPersonalityResultCard.tsx              ← M2-S3
│   └── KPersonalityPaywall.tsx                 ← M3-S3
└── app/(tabs)/k-type/
    ├── index.tsx                               ← M3-S1
    └── compare.tsx                             ← M2-S4

supabase/
├── functions/k-personality-analysis/index.ts  ← M1-S4
└── migrations/[ts]_add_k_personality.sql       ← M1-S5

최소 수정:
- apps/mobile/src/types/index.ts                ← export 1줄 추가
- apps/mobile/src/app/(tabs)/_layout.tsx        ← 탭 1개 추가
- apps/mobile/src/app/(tabs)/[결과화면].tsx    ← 티저 import + JSX 1줄
- apps/mobile/src/app/+native-intent.tsx        ← elif 분기 1개 추가
- apps/mobile/app.config.ts                     ← intentFilter 최소 추가
- apps/mobile/locales/[15개 언어].json          ← kPersonality 섹션 추가
- apps/mobile/src/hooks/useKPersonality.ts      ← M4 캐시 로직 추가
- CHANGELOG.md                                  ← v2.4.0 항목
```
