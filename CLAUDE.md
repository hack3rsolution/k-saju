# K-Saju Global — Claude Context

## Project Overview

**K-Saju Global** is a cross-platform mobile app (iOS + Android) that delivers
personalized Korean Four Pillars (사주팔자) destiny readings to a global audience.
The same underlying saju calculation is surfaced through 6 culturally-localized
"lenses" to maximize resonance by region.

---

## Monorepo Structure

```
k-saju/
├── apps/
│   └── mobile/              # Expo SDK 51 + Expo Router v3
│       ├── app/
│       │   ├── _layout.tsx
│       │   ├── index.tsx    # → (auth)/login
│       │   ├── (auth)/      # login, callback
│       │   ├── (onboarding)/# birth-input, cultural-frame, result-preview
│       │   ├── (tabs)/      # home, chart, fortune, settings
│       │   ├── compatibility/
│       │   ├── reports/
│       │   └── paywall.tsx  # modal
│       └── src/
│           ├── components/
│           ├── hooks/
│           ├── lib/
│           └── store/
├── packages/
│   ├── saju-engine/         # Pure TS saju calculation (no RN deps)
│   │   └── src/
│   │       ├── constants.ts # Stems, branches, elements, 60갑자
│   │       ├── types.ts     # FourPillars, ElementBalance, etc.
│   │       ├── pillars.ts   # Year/Month/Day/Hour pillar calc
│   │       ├── elements.ts  # Five-element balance
│   │       └── daewoon.ts   # 10-year luck cycle
│   └── ui/                  # Shared React Native UI components
└── CLAUDE.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | Expo SDK 51 + Expo Router v3 |
| Language | TypeScript (strict) |
| State management | Zustand |
| Backend / Auth | Supabase (magic-link + PKCE) |
| API layer | tRPC (future) |
| In-app purchases | RevenueCat |
| AI readings | Claude API (claude-sonnet-4-6) |
| Package manager | pnpm + Turborepo |
| UI | Custom (packages/ui) + @expo/vector-icons |

---

## 사주 Domain Knowledge

### 10 Heavenly Stems (천간, 天干)

| # | Stem | Element | Polarity |
|---|------|---------|---------|
| 1 | 甲 (갑) | 木 Wood | Yang |
| 2 | 乙 (을) | 木 Wood | Yin |
| 3 | 丙 (병) | 火 Fire | Yang |
| 4 | 丁 (정) | 火 Fire | Yin |
| 5 | 戊 (무) | 土 Earth | Yang |
| 6 | 己 (기) | 土 Earth | Yin |
| 7 | 庚 (경) | 金 Metal | Yang |
| 8 | 辛 (신) | 金 Metal | Yin |
| 9 | 壬 (임) | 水 Water | Yang |
| 10 | 癸 (계) | 水 Water | Yin |

### 12 Earthly Branches (지지, 地支)

| # | Branch | Animal | Element | Month (approx) |
|---|--------|--------|---------|---------------|
| 1 | 子 (자) | Rat | 水 Water | Nov |
| 2 | 丑 (축) | Ox | 土 Earth | Dec |
| 3 | 寅 (인) | Tiger | 木 Wood | Jan |
| 4 | 卯 (묘) | Rabbit | 木 Wood | Feb |
| 5 | 辰 (진) | Dragon | 土 Earth | Mar |
| 6 | 巳 (사) | Snake | 火 Fire | Apr |
| 7 | 午 (오) | Horse | 火 Fire | May |
| 8 | 未 (미) | Goat | 土 Earth | Jun |
| 9 | 申 (신) | Monkey | 金 Metal | Jul |
| 10 | 酉 (유) | Rooster | 金 Metal | Aug |
| 11 | 戌 (술) | Dog | 土 Earth | Sep |
| 12 | 亥 (해) | Pig | 水 Water | Oct |

### 오행 (Five Elements) Generating/Controlling Cycle

**Generating (상생):** Wood → Fire → Earth → Metal → Water → Wood
**Controlling (상극):** Wood → Earth → Water → Fire → Metal → Wood

### Four Pillars (사주팔자)

Each person has 4 pillars × 2 characters = **8 characters (팔자)**:

```
 연주(年柱)  월주(月柱)  일주(日柱)  시주(時柱)
   天干        天干        天干        天干
   地支        地支        地支        地支
```

- **일간 (Day Stem)** = the "self" — most important character
- Month pillar boundary is determined by **절기 (solar terms)**, not the calendar month
- Hour pillar uses 2-hour intervals (자시 子時 = 23:00–01:00)

### 60 Sexagenary Cycle (육십갑자)

Formed by pairing 10 stems × 12 branches (LCM = 60).
Reference: **1984 = 甲子**, **2024 = 甲辰**, **2025 = 乙巳**, **2026 = 丙午**

### 대운 (大運) — 10-Year Major Luck Cycle

- Derived from the **월주 (Month Pillar)**, counting forward or backward
- Direction: Yang year + Male / Yin year + Female → **forward (순행)**
- Start age: calculated from days to next/previous solar term ÷ 3
- Each period = 10 years; typically 8 periods shown (age 8–88)

### 세운 (歲運) — Annual Luck

- Each calendar year's stem+branch overlaid on the natal chart
- Clash (충), Harmony (합), and Penalty (형) relationships drive fortune reading

---

## 6 Cultural Frame Strategies

| Frame ID | Market | Label | Framing Style |
|---|---|---|---|
| `kr` | Korea | 사주팔자 | Traditional classical: destiny, family line, karma |
| `cn` | China/Taiwan | 四柱推命 / BaZi | Precision forecasting, business timing |
| `jp` | Japan | 四柱推命 | Harmony, workplace fit, subtle personality |
| `en` | US/UK/AU | Cosmic Blueprint | Personality-first, psychology overlay (like MBTI) |
| `es` | LATAM/Spain | Destino Cósmico | Horoscope-adjacent, relationship & passion focus |
| `in` | South Asia | Vedic Fusion | Jyotish vocabulary, karma & dharma framing |

**Same calculation, different narrative layer.** The Claude API prompt
should be prefixed with the cultural frame system prompt to localize output tone.

---

## Pricing Model

### Subscription (via RevenueCat)

| Plan | Price | Billing | Key Features |
|---|---|---|---|
| **Free** | $0 | — | 1 reading/week, full onboarding, chart view |
| **Premium Monthly** | $8.99 | Monthly | Unlimited daily + weekly + monthly + annual readings, 대운 |
| **Premium Annual** | $59.99 | Yearly (~44% off) | Everything Monthly + 2 add-on reports/yr |

### Add-ons (one-time IAP)

| Add-on | Price |
|---|---|
| Deep Compatibility Report | $4.99 |
| Career & Wealth Report | $4.99 |
| Full 대운 Report (PDF export) | $6.99 |
| Name Analysis (작명) | $9.99 |

### Entitlement Gate Logic

```
FREE:    daily_fortune_count <= 1/week, chart_view, onboarding
PREMIUM: all_readings, daewoon, compatibility_basic, annual_report
ADDON:   deep_compatibility, career_wealth, daewoon_pdf, name_analysis
```

---

## Key Design Decisions

1. **saju-engine is a pure TS package** — no React Native imports. Can be used in
   server-side tRPC procedures and tested with plain Node.js.

2. **Cultural frame is selected at onboarding** and stored in Zustand + Supabase user profile.
   It affects Claude API system prompts only — not the calculation.

3. **Month pillar** requires solar-term (절기) table for full accuracy. The current
   `pillars.ts` uses a simplified approximation. Replace with a lookup table for production.

4. **Paywall** is a modal screen (`/paywall`) accessible from any locked feature.
   RevenueCat handles entitlement validation; Zustand caches the entitlement locally.

5. **Auth** uses Supabase magic link (PKCE). Deep-link scheme: `ksaju://auth/callback?code=...`.

6. **AI readings** call Claude API from a Supabase Edge Function (server-side) to keep
   the API key off the device. The edge function receives the saju chart JSON + cultural
   frame and returns a structured reading.

---

## Development Commands

```bash
# Install all deps
pnpm install

# Run mobile (Expo Go)
pnpm --filter mobile start

# Build saju-engine
pnpm --filter @k-saju/saju-engine build

# Type-check all
pnpm -r type-check
```

---

## File Naming Conventions

- Expo Router screens: lowercase, kebab-case (`birth-input.tsx`, `cultural-frame.tsx`)
- Components: PascalCase (`PillarGrid.tsx`, `ElementBar.tsx`)
- Hooks: `use` prefix (`useAuth.ts`, `useSajuChart.ts`)
- Store slices: `store/` directory, Zustand (`authStore.ts`, `sajuStore.ts`)
- Constants/utils: camelCase (`constants.ts`, `formatPillar.ts`)

---

## 트러블슈팅 히스토리 (2026-03-11)

### expo-calendar 설치 후 iOS 빌드 문제
- expo-calendar는 네이티브 모듈이라 설치 후 반드시 pod install 필요
- pod deintegrate → pod install --repo-update 순서로 실행
- Xcode DerivedData도 삭제 필요: `rm -rf ~/Library/Developer/Xcode/DerivedData/KSaju-*`
- Clean Build Folder (⇧⌘K) 후 빌드

### pod 관련 에러 패턴 및 해결
- **EXImageLoader "Build input file cannot be found"** → pod deintegrate + pod install로 xcworkspace 재생성
- **PurchasesHybridCommon "SubscriptionPeriod ambiguous"** → `Pods/PurchasesHybridCommon/StoreProduct+HybridAdditions.swift`에서 `SubscriptionPeriod` → `RevenueCat.SubscriptionPeriod`로 명시
- **ExpoLocalization "Switch must be exhaustive"** → `node_modules/expo-localization/ios/LocalizationModule.swift` switch문 끝에 `@unknown default: return "gregory"` 추가
- **ExpoDevice "Cannot find TARGET_OS_SIMULATOR"** → `node_modules/expo-device/ios/UIDevice.swift`에서 `TARGET_OS_SIMULATOR != 0` → `#if targetEnvironment(simulator)` 로 교체

### Expo Go vs Development Build
- RevenueCat(인앱결제), expo-calendar 등 네이티브 모듈은 Expo Go에서 실행 불가
- 반드시 `npx expo run:ios` 또는 Xcode 빌드로 실행
- Expo Go에서 실행 시 "NativeEventEmitter requires a non-null module" 에러 발생

### expo-calendar 권한 설정
- `app.json`의 `expo.ios.infoPlist`에 반드시 추가:
  - `NSCalendarsUsageDescription`
  - `NSCalendarsFullAccessUsageDescription` (iOS 17+ 필수)
  - `NSRemindersUsageDescription`
- `apps/mobile/ios/KSaju/Info.plist`에도 동일하게 추가 (로컬 Xcode 빌드용)
- 누락 시 `ExpoCalendar.MissingCalendarPListValueException` 발생

### saju-engine 빌드
- node_modules 재설치 후 `dist/` 파일이 사라질 수 있음
- 증상: "Unable to resolve @k-saju/saju-engine from app/(tabs)/chart.tsx"
- 해결: `PATH="$PWD/node_modules/.bin:$PATH" tsup src/index.ts --format cjs,esm --dts --tsconfig tsconfig.build.json` (packages/saju-engine에서 실행)
- `tsconfig.build.json`에 `"types": []` 필수 — `@types/minimatch@6` 충돌 방지

### expo-calendar 버전
- Expo SDK 51 호환 버전: `expo-calendar@~13.0.5`
- 주의: 최신 버전(55.x) 설치 시 호환성 문제 발생
- 설치: `pnpm --filter mobile add expo-calendar@~13.0.5`

### node_modules 꼬임 증상 및 해결
- 증상: "Unable to resolve expo/build/Expo.fx"
- 해결: `rm -rf node_modules apps/mobile/node_modules && pnpm install`

### iOS 빌드 vs npx expo run:ios
- Xcode 직접 빌드보다 `npx expo run:ios`가 더 안정적
- expo-router, metro 관련 문제는 `npx expo run:ios`가 자동 처리
- Xcode는 pod 에러 디버깅 시에만 사용

### node_modules 패치 영구 적용 (pnpm patch)
- **문제**: node_modules 재설치 시 수동 수정이 초기화됨
- **해결**: `pnpm patch <pkg>` → 수정 → `pnpm patch-commit <tmpdir>` 으로 `patches/` 폴더에 등록
- 등록된 패치 목록 (`patches/` 폴더 + `pnpm-lock.yaml` `patchedDependencies`에 자동 반영):
  - `expo-localization@15.0.3.patch` — Calendar.identifier switch에 `@unknown default: return "gregory"` 추가
  - `expo-device@6.0.2.patch` — `TARGET_OS_SIMULATOR != 0` → `#if targetEnvironment(simulator)` 교체
  - `react-native@0.74.0.patch` — `React-jsinspector.podspec`에 `"DEFINES_MODULE" => "YES"` 추가
- `pnpm install` 실행 시 자동 적용 — 추가 작업 불필요
- **주의**: `pnpm patch-commit` 실패 시("not in npm registry") → `pnpm patch`로 tmpdir 생성 후 수동 수정하면 성공
- **⚠️ pnpm patch + node-linker=hoisted 한계**: pnpm patches가 hoisted node_modules에 적용되지 않는 경우가 있음
  - `react-native@0.74.0` Java 파일 패치가 이 문제로 적용 안 됨
  - 대안: `apps/mobile/scripts/patch-android-rnsvg.js` postinstall 스크립트 사용
  - `apps/mobile/package.json`에 `"postinstall": "node scripts/patch-android-rnsvg.js"` 등록

### Android 빌드 수정 히스토리 (2026-03-14)

**에러 1**: `"Plugin [id: 'com.facebook.react.settings'] was not found"` (settings.gradle line 13)
- **원인**: Gradle의 `Process.execute()`가 Homebrew PATH를 상속 안 함 → `node` 명령어를 찾지 못함
- **해결**: `apps/mobile/plugins/withAndroidNodePath.js` config plugin 생성
  - `withSettingsGradle`으로 settings.gradle의 `"node"` → `"/opt/homebrew/bin/node"` 절대 경로 교체
  - `app.json` plugins 배열에 `"./plugins/withAndroidNodePath"` 등록

**에러 2**: `"Unsupported class file major version 69"` (Java 25 vs Gradle 8.8)
- **원인**: expo prebuild가 생성한 `gradle.properties`에 `org.gradle.java.home` 미포함 → 시스템 기본 Java 25 사용 → Gradle 8.8 미지원
- **해결**: `withAndroidNodePath.js`에 `withDangerousMod`로 `gradle.properties`에 `org.gradle.java.home` 추가

**에러 3**: `react-native-svg:compileDebugJavaWithJavac` 컴파일 실패
- **원인**: `react-native-svg@15.15.3`은 RN 0.75+ API 타겟 — `MatrixDecompositionContext` 필드 접근 불가(package-private), `setBorderRadius` 시그니처 불일치
- **해결**:
  1. `react-native-svg` 다운그레이드: `^15.15.3` → `^15.2.0` (Expo SDK 51 권장 버전)
  2. `MatrixMathHelper.MatrixDecompositionContext` 5개 필드 `public` 추가 (react-native-svg 15.2.0도 해당 필드 직접 접근함)
  3. 패치 영구 적용: `apps/mobile/scripts/patch-android-rnsvg.js` postinstall 스크립트
- **참고**: Expo SDK 버전 확인 명령: `npx expo install --check react-native-svg`

### Android 빌드 환경 설정 (2026-03-14, 영구 기록)

- **Java 버전**: 시스템 기본 Java 25 → JAVA_HOME Java 17 고정 필수
  - Gradle 8.8은 최대 Java 21까지만 지원 — Java 25 사용 시 `"Unsupported class file major version 69"` 발생
  - `~/.zshrc`에 추가: `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`
  - Gradle 관련 에러 발생 시 `java -version` 먼저 확인

- **오늘 해결한 커밋 목록 (2026-03-14)**:
  - ci.yml pnpm version 충돌 수정
  - AbortController SSE 메모리 누수 수정
  - SSE fallback raw 노출 차단
  - language useCallback deps 추가
  - addon-report extractJson 통일
  - AndroidManifest → app.json intentFilters
  - react-native-svg Java 패치 + postinstall
  - Metro blockList 중복 react-native 차단
  - i18n initImmediate race condition 수정
  - iOS podspec DEFINES_MODULE 패치

### Dev Login 버튼 조건 (expo run:ios 동작 특이사항)
- `npx expo run:ios`는 네이티브 빌드이므로 `__DEV__` 가 `false`가 될 수 있음
- Dev Login 버튼 조건을 `__DEV__` 단독에서 변경:
  ```tsx
  {(process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true' || __DEV__) && (
    <TouchableOpacity onPress={signInDev}>⚡ Dev Login</TouchableOpacity>
  )}
  ```
- **`apps/mobile/.env`에 `EXPO_PUBLIC_ENABLE_DEV_BYPASS` 없음** — 프로덕션 빌드 보안
- 로컬 개발 시 `apps/mobile/.env.local`에 `EXPO_PUBLIC_ENABLE_DEV_BYPASS=true` 설정 (gitignore됨)

---

## 현재 상태 (2026-03-15)

**브랜치**: `feat/auspicious-calendar`
**버전**: v2.4.0 준비 중
**최근 커밋**: Android 빌드 환경·재발방지 규칙 문서화 (CLAUDE.md)

### 완료된 주요 기능 (Issues #1–#34 모두 CLOSED)

- [x] Supabase Auth (magic-link PKCE), Zustand stores
- [x] 온보딩 플로우 (생년월일 입력, 문화권 선택, 결과 미리보기)
- [x] saju-engine (사주 계산, 오행 균형, 대운) — 100% test coverage
- [x] AI 운세 읽기 (Supabase Edge Function + Claude API)
- [x] 홈 화면, 사주 차트, 운세 탭
- [x] RevenueCat 인앱결제 + 페이월
- [x] 4종 애드온 리포트 + PDF export
- [x] 푸시 알림 (Expo Notifications, 매일 8시)
- [x] i18n 14개 언어 (ko, en, ja, zh-Hans, zh-Hant, es, pt-BR, hi, vi, id, fr, de, th, ar)
- [x] 관계 지도 (Relationship Map) — 궁합, AI 운세
- [x] 인생 일지 (Life Journal) — 타임라인, AI 패턴 분석
- [x] 디자인 시스템 v2.2 (tokens.ts, 오방색, 문화권별 accent)
- [x] K-Culture 레퍼런스 레이어
- [x] AI 팔로업 채팅 (Fortune Chat SSE)
- [x] 타이밍 어드바이저 (1 free/month)
- [x] 길일 캘린더 (Auspicious Days) — 천간지지 상생/상극 기반 점수 계산
- [x] K-Personality (사상체질 + 오행 기반) — M1~M4 완료
- [x] 코드 품질 개선 — 보안/성능/아키텍처/리팩토링 (2026-03-12)

### v2.4.0 QA 버그 수정 (2026-03-13)

- [x] **리포트 3-tier 캐시**: Zustand(즉시) → AsyncStorage TTL → AI 생성. 재물운 30일 / 대운 1년. `reportCacheStore.ts` 신규, `useCachedAddonReport` 훅 추가
- [x] **리포트 '새 리포트 생성' 버튼 제거**: 재물운·대운은 캐시 정책에 따라 자동 유지
- [x] **하단 탭 메뉴 i18n**: `tabs.*` 키 14개 언어 추가, `_layout.tsx` `useTranslation` 적용
- [x] **My Chart 상세 모달 복원**: 오행/십신/대운 섹션 헤더 + 개별 행/카드 onPress 연결
- [x] **My Chart 사주 데이터 기반 맞춤 설명**: 오행 과다/부족 분석, 십신 `SHISHIN_DESC`, 현재 대운 천간·지지 연결
- [x] **saju-engine `daewoon.ts` 버그 수정**: `element`가 영문(`'Wood'`)을 반환하던 버그 → `BRANCH_ELEMENT[branch]` (kanji) 직접 반환
- [x] **`SHISHIN_DESC` 키 수정**: 한자(`比肩`) → 한국어(`비견`) — `ShiShin` 타입과 일치
- [x] **일간 탭 상세 설명**: 십신 테이블에서 일간(isDay=true) 탭 시 `STEM_DESC` 기반 설명 표시
- [x] **전체 i18n 하드코딩 수정**: `check:i18n` 스크립트 신규, 온보딩/관계/일지/공유카드 등 영어 하드코딩 제거

### 2026-03-15 작업 완료

- [x] **iOS 언어 감지 버그 수정**: `detectLanguage()` — `locales[0]`만 보던 방식 → 전체 locales 순회 (Mac 호스트 `en-001`이 첫 번째로 와도 `ko` 감지)
- [x] **languageStore `userSelected` 필드 추가**: 사용자가 명시적으로 언어 선택한 경우만 AsyncStorage 값 복원 — 자동 감지값은 재시작 시 재감지
- [x] **birth-input.tsx 온보딩 i18n 완성**: "Step 1 of 3", "Year", "Day", "Hour (24h)", "Male", "Continue →" 하드코딩 → `tob()` 키 교체
- [x] **Android SSE 스트리밍 폴백**: `useContentRecommendation.ts` — `resp.body` null 시 `resp.text()` 전체 파싱 방식으로 폴백 (Hermes `ReadableStream` 미지원 대응)
- [x] **전체 탭 헤더 통일**: `ScreenHeader` 공통 컴포넌트 생성 → fortune/journal/relationships/chart/calendar/settings/face-insight 전체 적용
- [x] **CalendarScreen 다크 테마**: 두 가지 배경색 구조 → 단일 다크 배경으로 통일, EventTypePicker/MonthlyCalendarView 색상 업데이트
- [x] **paddingTop 통일**: calendar/face-insight 화면 `paddingTop: 60`으로 다른 탭과 동일하게 수정
- [x] **설정 화면 내 정보 수정 메뉴 추가**: `router.push('/edit-profile')` 연결
- [x] **edit-profile.tsx 신규 생성**: onboarding 그룹 외부 독립 라우트 — `useAuthGuard` 리다이렉트 우회
- [x] **연도 초기값 2000년 고정**: `initYearIdx = 70` 하드코딩 (메타데이터 저장값 무시)
- [x] **출생시간 토글 기본값 OFF**: `useState(false)` 고정
- [x] **WheelPicker VirtualizedLists 경고 근본 제거**: FlatList → ScrollView + map 교체

### 진행 중 / 미완료

- [ ] v2.4.0 최종 QA 및 릴리스
- [ ] 월주 계산 정밀도 개선 (절기 룩업 테이블 — 현재 근사치 사용)
- [x] Android 빌드 수정 — `npx expo run:android` BUILD SUCCESSFUL (2026-03-14)
- [ ] App Store / Play Store 메타데이터 업데이트 (v2.4.0 기준)

---

## Edge Function 수정 히스토리 (feat/auspicious-calendar 브랜치, 2026-03-12)

### saju-reading Edge Function — 핵심 버그 수정

**배포 명령**: 항상 `--no-verify-jwt` 필수
```bash
npx supabase functions deploy saju-reading --no-verify-jwt --project-ref omypurqmhfihmikyusnc
```

**수정 사항**:
- `claude.ts`: `MAX_TOKENS` 고정값 → 타입별 차등 (`daily:800, weekly:1000, monthly:1000, annual:1200, daewoon:1500`)
- `claude.ts`: `parseClaudeOutput` — 파싱 실패 시 에러 플레이스홀더 반환 → **throw** 로 변경 (호출자가 502 반환 → DB 미캐시)
- `claude.ts`: `stripCodeFences()` 추가 — ` ```json ` 마크다운 노출 방지
- `cache.ts`: `getCachedReading` — `details.length === 0` 인 오염된 캐시 항목 거부 (에러 플레이스홀더 캐시 무효화)
- `cache.ts`: `frameKey(frame, userLanguage)` — 언어를 `culturalFrame` 값에 인코딩 (e.g. `kr:ko`) — DB 마이그레이션 없이 언어별 캐시 분리
- `index.ts`: Dev bypass — `authToken === SUPABASE_ANON_KEY` → `userId = '00000000-0000-4000-8000-000000000000'`
- `prompts.ts`: `langInstruction`을 frame 프롬프트 **앞**에 배치, JSON 출력 형식 강화

**Supabase CLI v2.75.0 주의**: `functions logs` 명령 없음 — 로그는 Supabase 대시보드에서 확인

### content-recommendation Edge Function

**수정 사항**:
- `prompts.ts`: `en`/`in` frame에서 "Descriptions in English" 제거 — `langInstruction`과 충돌 방지
- `prompts.ts`: `buildSystemPrompt` — 앞뒤 bookend 강화: `CRITICAL: ... This overrides everything below` + `REMINDER: ... MUST be in ${langName}`
- `index.ts`: Claude 오류 시 영어 FALLBACK 캐시 대신 **502 반환** — 영어 데이터가 타 언어 키로 캐시되는 것 방지
- `index.ts`: 캐시 키에 `userLanguage` 포함: `${dayStem}-${frame}-${userLanguage}`

### calculate-auspicious-days Edge Function

**수정 사항**:
- `STEM_ELEMENT`, `BRANCH_ELEMENT`, `GENERATES`(상생), `CONTROLS`(상극) 매핑 추가
- `calculateDayScore`: 기존 단순 갑자 인덱스 → 천간지지 오행과 사용자 지배 오행의 상생/상극 관계로 점수 계산
  - 기본 50점 + 천간 ±25 + 지지 ±15 + 이벤트 가중치 ±15 + 길갑자 +8
- 동점 threshold 처리: `luckyThreshold === unluckyThreshold`일 때 절대값으로 분류 (65↑=lucky, 40↓=unlucky)
- 캐시 upsert: FK 위반(dev 유저) try/catch로 비치명 처리
- `onConflict`: `user_id,year_month,event_type,language` (실제 UNIQUE 제약에 맞게 수정)

### useFortune.ts 훅

- `FortuneType = 'daily' | 'weekly' | 'monthly' | 'annual' | 'daewoon'` export
- `getRefDate(type, now)`: weekly=ISO 월요일, monthly=1일, annual=Jan1, daily/daewoon=오늘
- `type` 파라미터로 5개 운세 타입 분기
- Cold start: chart 없으면 `session.user.user_metadata`에서 재구성
- `userLanguage: language` Edge Function에 전달

### home.tsx — UI 개선

- 탐색 그리드에서 "지금 결정 분석" 카드 제거
- 별도 "AI 도구" 섹션으로 분리 (가로 풀위드 카드 + 설명 텍스트)
- 14개 locale `common.json`에 `home.aiTools` / `home.timingDesc` 키 추가

---

## 코드 품질 개선 히스토리 (2026-03-12)

병렬 에이전트 팀(보안/성능/아키텍처/리팩토링) 코드 리뷰 및 수정.

### 보안 (Agent 1)

- **DEV_BYPASS 분리**: `apps/mobile/.env`에서 `EXPO_PUBLIC_ENABLE_DEV_BYPASS` 제거
  → 로컬 개발 전용 `apps/mobile/.env.local`로 이동 (gitignore됨)
  → 프로덕션 빌드에서 Dev Login 완전 비활성화

### 성능 (Agent 2)

- **`useAuspiciousDays.ts` deps 축소**: `[user, session, chart, month, eventType, language, setChart]`
  → `[user?.id, session?.access_token, month, eventType, language]`
  → auth refresh 시 불필요한 월간 길일 재계산 방지
- **`useContentRecommendation.ts` AsyncStorage 캐시 추가**: TTL 30일
  → 캐시 키: `content-recommendation:{userId}:{dayStem}:{language}`
  → 차트 화면 진입마다 반복되던 Claude API 호출 대폭 감소
- **`languageStore.ts` RTL 지원**: `I18nManager.forceRTL()` 추가
  → 아랍어(`ar`) 선택 시 레이아웃 자동 반전, 언어 복원 시에도 적용

### 아키텍처 (Agent 3)

- **`supabase/functions/_shared/claude.ts` 신규 생성**: 공통 유틸 허브
  - `CLAUDE_MODEL`: 모델명 상수 (`'claude-sonnet-4-6'`)
  - `LANGUAGE_NAMES`: 14개 언어 맵
  - `buildLangInstruction(userLanguage?)`: Claude 언어 지시 프롬프트 생성
  - `stripCodeFences(text)`: 마크다운 코드펜스 제거
  - `extractJson(raw)`: JSON 추출 + 파싱 (실패 시 throw)
  - `buildCacheKey({type, userId, refDate, language, extra?})`: 표준 캐시 키 생성
- **언어 파이프라인 완성**: 클라이언트 → Edge Function → Claude 프롬프트
  - `fortune-chat`: `FortuneChatRequest.userLanguage` 추가 + `buildSystemPrompt` 연결
  - `timing-advisor`: `TimingRequest.userLanguage` 추가 + `buildSystemPrompt` 연결
  - `journal-analysis`: `JournalAnalysisRequest.userLanguage` 추가 + 캐시 키에 language 포함
  - `ai-calendar-interpretation`: 언어 지시 프롬프트 system prompt 앞에 추가
  - 클라이언트 훅: `useFortunChat`, `useTimingAdvisor`, `useJournal` → `userLanguage: language` 전달

### 리팩토링 (Agent 4)

- **모델명 중앙화**: `saju-reading`, `fortune-chat`, `timing-advisor`, `journal-analysis`
  → 각자 하드코딩하던 `'claude-sonnet-4-6'` → `_shared/claude.ts`의 `CLAUDE_MODEL` import
- **`LANGUAGE_NAMES` 중복 제거**: `saju-reading/prompts.ts`, `content-recommendation/prompts.ts`
  → 로컬 정의 삭제 후 `_shared/claude.ts` import로 교체
- **`buildLangInstruction()` 통일**: `saju-reading/prompts.ts` 수동 구현 → shared 함수 사용
- **`extractJson()` 표준화**: `timing-advisor`, `journal-analysis` 수동 JSON 추출 → shared 함수
- **`timing-advisor` 캐시 키 개선**: `cacheKey(userId, category, date)` → language 포함
  → 다국어 사용자 캐시 오염 방지
- **`saju-reading/claude.ts` 로컬 `stripCodeFences` 제거** → shared 함수 사용

### 배포 현황

모든 수정 후 `--no-verify-jwt` 플래그로 재배포 완료:
`saju-reading` · `fortune-chat` · `timing-advisor` · `journal-analysis` · `content-recommendation` · `ai-calendar-interpretation` · `daily-routine`

---

## 버그 수정 히스토리 (2026-03-12, 2회차)

코드 품질 개선(1회차) 후 발생한 리그레션 및 성능 문제 해결.

### 공통 근본 원인: MAX_TOKENS 과소 설정

한국어/CJK 텍스트는 영어 대비 1.5–2× 더 많은 BPE 토큰을 소모함.
기존 토큰 한도는 영어 기준으로 설계되어 CJK 응답이 중간에 잘려 JSON 파싱 실패 → 502 발생.

**진단 패턴**: Claude 응답의 `stop_reason: "max_tokens"` → JSON 불완전 → `JSON.parse()` throw → 502

### saju-reading — CJK 502 수정

**파일**: `supabase/functions/saju-reading/claude.ts`, `prompts.ts`

- `MAX_TOKENS_BY_TYPE` 전면 상향 (CJK 대응):
  - `daily`: 800 → **1400**
  - `weekly`: 1000 → **1800**
  - `monthly`: 1000 → **1800**
  - `annual`: 1200 → **2200**
  - `daewoon`: 1500 → **2800**
- `prompts.ts` 출력 형식 강화:
  - `summary`: max 100 chars → **max 80 chars**
  - `details` 각 항목: 미지정 → **"1 sentence, max 50 words"** 명시
  - → Claude 과도한 장문 출력 방지 + 파싱 안정성 확보
- **검증**: ko/zh-Hans/ja × 5개 타입(daily/weekly/monthly/annual/daewoon) 모두 정상 확인

### content-recommendation — 502 + 응답 속도 개선

**파일**: `supabase/functions/content-recommendation/index.ts`, `prompts.ts`
**클라이언트**: `apps/mobile/src/hooks/useContentRecommendation.ts`
**컴포넌트**: `apps/mobile/src/components/ContentRecommendationSection.tsx`

**버그 수정**:
- 근본 원인: `MAX_TOKENS=700`에서 한국어 9개 아이템 응답 잘림 → `JSON.parse()` 실패 → 502
- `parseOutput()`: `stripCodeFences()` 미적용 → ` ```json ``` ` 코드 펜스 포함 시 파싱 실패
- 두 가지 동시 수정 → `MAX_TOKENS` 인상 + `stripCodeFences` 적용

**스트리밍 아키텍처 전환** (단일 대기 → 카테고리별 병렬 SSE 스트리밍):
- **Edge Function**: 기존 단일 Claude 호출(2000토큰) → **3개 병렬 호출(400토큰 × 3)**
  - `callClaudeForCategory(category, req, dominant, systemPrompt, apiKey)` 신규
  - `buildCategoryUserPrompt(req, category, dominant)` 신규 (`prompts.ts`)
  - 캐시 히트/미스 모두 SSE 스트림으로 응답 (클라이언트 코드 경로 통일)
  - SSE 이벤트 형식: `{"type":"music"|"books"|"travel","element":"Wood","items":[...]}`
  - 캐시 히트 시: 3개 이벤트 즉시 emit → 사실상 0ms 응답
- **Hook**: `resp.body.getReader()` SSE 읽기로 교체
  - `loading`: 첫 카테고리 도착 시 `false`로 전환 (이전: 전체 완료까지 `true`)
  - `streaming: boolean` 신규 — SSE 스트림 진행 중 `true`
  - 카테고리별 `setData()` progressive update
  - `[DONE]` 수신 시 AsyncStorage 30일 캐시 저장
- **컴포넌트**: `loading && !data` 조건으로 변경
  - 첫 카테고리 도착 즉시 탭+카드 렌더링
  - 스트리밍 중 `✦` 인디케이터 표시, 완료 후 공유 버튼 노출

**체감 속도**: 이전 10–15초 후 전체 표시 → **3–4초 후 첫 카테고리 표시**, 5–8초 전체 완료
**캐시 구조**:
- 클라이언트 AsyncStorage 30일 (앱 재시작 포함) — 두 번째 방문 즉시 반환
- 서버 in-memory 24h (인스턴스 내, serverless multi-instance 환경에서는 miss 가능 — 정상)

### 디버깅 노트

- **`functions logs` 커맨드 없음**: Supabase CLI v2.75.0에서 미지원 → curl + 임시 디버그 에러 노출 방식으로 대체
- **디버그 패턴**:
  ```typescript
  // 1. 에러 메시지 노출
  return errorResponse(`DEBUG: ${(e as Error).message}`, 502);
  // 2. Claude raw 응답 tail + stop_reason 노출
  throw new Error(`STOP[${stop_reason}] TOKENS[${output_tokens}] TAIL[${raw.slice(-150)}]`);
  ```
- **배포**: `saju-reading` · `content-recommendation` 재배포 완료

---

## 🚫 에러 재발 방지 (Do NOT change)

### 오늘의 행운 카드 (LuckyItemCard)
- 카드 텍스트는 항상 `numberOfLines={1}` `ellipsizeMode="tail"` 유지
- 카드 탭 시 **Modal 방식**으로 전체 텍스트 표시 — `measureContainer` / `LayoutAnimation` 방식 사용 금지 (크로스 플랫폼 오동작으로 폐기)
- Modal은 오방색 디자인 토큰 사용, 오버레이 탭으로 닫힘
- 4개 카드(색깔/숫자/방향/음식) 모두 `LuckyItemCard` 컴포넌트 사용 필수

### Anthropic API
- 모델명: `claude-sonnet-4-6` (`_shared/claude.ts`의 `CLAUDE_MODEL` 상수 사용) — 하드코딩 및 구버전 모델명 직접 사용 금지
- `MAX_TOKENS`는 언어별 동적 계산 (`getMaxTokens()` 함수 사용) — 고정값 사용 금지
- JSON 파싱은 `extractJson()` 함수 사용 (`_shared/claude.ts`) — greedy regex 직접 사용 금지
- 529 Overloaded / 429 Rate Limit은 재시도 로직으로 처리 (최대 2회, 1.5초 간격) — 이미 `callClaude()`에 구현됨

### Edge Function
- 배포 시 반드시 `--no-verify-jwt` 플래그 포함 (누락 시 ES256 JWT 검증 실패 → 401)
- `_shared/claude.ts` 수정 시 의존하는 모든 함수 동시 재배포 필수: `saju-reading` · `fortune-chat` · `timing-advisor` · `journal-analysis` · `content-recommendation` · `ai-calendar-interpretation`
- `functions logs` 명령 미지원 (CLI v2.75.0) — 에러 진단은 `/ping` 프로브 또는 임시 `DEBUG:` 에러 노출 방식 사용

### i18n
- 캐시 키에 반드시 언어 코드 포함 — 누락 시 다른 언어 사용자에게 stale 컨텐츠 반환
- 새 옵션/문구 추가 시 14~15개 언어 전체 키 정의 필수 (ko · en · ja · zh-Hans · zh-Hant · es · pt-BR · hi · vi · id · fr · de · th · ar)
- **하단 탭 메뉴(`app/(tabs)/_layout.tsx`)는 반드시 `t('tabs.*')` 키 사용** — 영어 하드코딩 금지. `useTranslation`을 레이아웃 컴포넌트 내부에서 호출하여 `title:` 에 전달할 것
- **UI 텍스트 하드코딩 전면 금지** — `<Text>` 내부, prop 값 모두 `t()` 호출 사용. `yarn check:i18n` 실행으로 검증 필수
- **새 화면/컴포넌트 추가 후 반드시 `yarn check:i18n` 실행** (`apps/mobile/` 에서) — CI 등가 검증

### 애드온 리포트 캐시
- **재물운(career): 30일 TTL**, **대운(daewoon_full): 1년 TTL** — 변경 금지 (운 주기 기반)
- **3-tier 캐시 구조 유지**: Zustand(`reportCacheStore.ts`) → AsyncStorage TTL → AI API 순서
  - `useCachedAddonReport('career' | 'daewoon_full', isUnlocked)` 훅 사용 — 직접 API 호출 금지
- **캐시 키**: `report-{reportType}-{dayStem}-{dayBranch}-{language}` — 변경 시 기존 캐시 무효화됨
- **'새 리포트 생성' 버튼 없음**: 재물운·대운은 캐시 만료 전까지 재생성 불가 (의도된 UX)

### 삭제 액션 UX 규칙

- **삭제 버튼 탭 시 반드시 `Alert.alert()` 확인 다이얼로그 표시 후 실행** — 즉시 삭제 금지
- Alert 버튼 구성: `{ style: 'cancel' }` 취소 + `{ style: 'destructive' }` 삭제 (iOS 빨간색 자동)
- Alert 텍스트는 i18n 키 사용 필수 (`journal.deleteTitle` / `journal.deleteMessage` / `journal.cancel` / `journal.delete` 패턴)
- 삭제 실행은 `onPress: () => remove(id)` — async/await 불필요 (Alert 콜백은 동기)
- 이 패턴을 따르지 않으면 코드 리뷰에서 반드시 지적할 것

### 차트 카드 데이터 구조 규칙 (재발 방지)
- **`DaewoonPeriod.element`는 반드시 kanji FiveElement** (`木`/`火`/`土`/`金`/`水`) — `daewoon.ts`에서 English string(`'Wood'`)으로 바꾸면 `ELEM_COLOR`/`ELEM_DETAIL` lookup 실패 → 크래시
  - 현재 fix: `element: BRANCH_ELEMENT[branch]` (직접 반환) — English 매핑 삽입 금지
- **`ShiShin` type은 한국어** (`'비견'`/`'겁재'`/`'식신'`/`'상관'`/`'편재'`/`'정재'`/`'편관'`/`'정관'`/`'편인'`/`'정인'`) — `SHISHIN_DESC` 키를 Chinese(`比肩` 등)로 쓰면 lookup 실패 → 모달 미표시
- `setSectionInfo()` 호출부에 반드시 `?.` optional chaining 및 `?? ''` fallback 사용 — `undefined.property` 크래시 방지
- **십신 테이블에서 일간(isDay=true)은 `shiShin` 값이 `null`** — 일반 십신 설명이 아닌 `STEM_DESC[p.stem]` (일간 자체 설명)으로 별도 처리 필수. `onPress={p.isDay ? undefined : ...}` 패턴 금지
- 새 카드 타입 추가 시 데이터 인터페이스(`DaewoonPeriod` / `ShiShin` / `FiveElement`) 타입 실제 값과 lookup 테이블 키가 일치하는지 확인 후 구현

### My Chart 화면 (`app/(tabs)/chart.tsx`)
- **일간(Day Master) · 오행 균형 · 십신 · 대운 섹션 헤더는 반드시 `onPress` 핸들러 유지** — 탭 시 `setSectionInfo()` 호출하여 상세 설명 모달 표시
- **사주 글자(천간·지지) 탭 시 `setDetailChar()` 호출 유지** — 개별 글자 상세 설명 모달 표시
- **오행 개별 행, 십신 테이블 행, 대운 카드는 `TouchableOpacity` 유지** — `View`로 변경 금지 (탭 반응 소실)
- **`SECTION_INFO` 내용은 반드시 `useSajuStore()`의 실제 사주 데이터 기반 맞춤 텍스트** — 일반 설명으로 대체 금지
  - 오행: `elements.Wood/Fire/Earth/Metal/Water` 실제 점수 + 과다/부족 해석
  - 십신: `getShiShin(dayStem, stem)` 실제 결과 + `SHISHIN_DESC` 개별 설명
  - 대운: `daewoon[currentDwIdx]` 현재 대운 천간·지지 + `STEM_DESC`/`BRANCH_DESC` 연결
- **Pillar Detail Modal / Section Info Modal 절대 삭제 금지** — 두 Modal은 `<>` Fragment 안, ScrollView 바깥에 위치해야 함
- **Section Info Modal은 ScrollView 내부에 body 표시** — 긴 맞춤 설명이 잘리지 않도록 `maxHeight: 320` ScrollView 유지
- `SECTION_INFO` 객체는 반드시 `const { pillars, elements, dayStem } = chart` 이후에 정의 (early return `if (!chart)` 뒤에 위치)

### Android 빌드 — NEVER TOUCH 규칙

- **pnpm 버전 일치**: `package.json`의 `packageManager` 필드와 `.github/workflows/ci.yml`의 `pnpm/action-setup version`은 **반드시 동일**해야 함 — 현재: `pnpm@8` (양쪽 모두)
  - 불일치 시 CI에서 lockfile 검증 실패 또는 의존성 해석 오류 발생

- **`apps/mobile/scripts/patch-android-rnsvg.js` 절대 삭제 금지**
  - `MatrixMathHelper.MatrixDecompositionContext` 5개 필드 및 `TransformHelper` 관련 Java 필드를 `public`으로 패치
  - `apps/mobile/package.json`의 `"postinstall"` 스크립트로 등록됨 — 삭제 시 `pnpm install` 후 Android 빌드 즉시 실패

- **`apps/mobile/metro.config.js` `blockList` 절대 삭제 금지**
  - `@expo/metro-runtime` 내부의 중복 `react-native` 차단 설정
  - 삭제 시 `LogBox/LogBox` 모듈 해석 실패 발생

- **`AndroidManifest.xml`은 gitignore 대상** — 딥링크 등 Android 네이티브 설정은 반드시 `app.json`의 `intentFilters`/`permissions`로 관리
  - `AndroidManifest.xml` 직접 수정 후 `expo prebuild` 실행 시 덮어써짐

- **`i18n/index.ts`의 `initImmediate: false` 유지** — `true`로 변경 시 i18n 초기화 전 레이아웃 마운트 → 검은 화면 race condition 발생

### Android SSE 스트리밍 폴백 규칙

- **Android Hermes는 `fetch()` 응답에서 `response.body`(`ReadableStream`)를 `null`로 반환**
- SSE를 사용하는 모든 훅은 `resp.body?.getReader()` 결과가 `undefined`일 때 `resp.text()` 폴백 처리 필수
- 폴백 경로에서 **raw SSE 텍스트를 직접 상태에 저장 금지** — 반드시 `data:` 라인 파싱 후 payload JSON 추출
- 현재 폴백 구현된 훅: `useFortunChat.ts`, `useContentRecommendation.ts`
- 새 SSE 훅 추가 시 동일 패턴 적용 필수 (CLAUDE.md `AskMoreModal` 섹션의 SSE 파싱 패턴 참고)

---

## 🛡️ 개발 안전 규칙 (2026-03-12 수립)

### 새 기능 구현 전 필수 점검 (구현 시작 전 나에게 보고 후 승인 받을 것)
1. 기존 구조와 충돌 가능성 (_shared/claude.ts, entitlementStore, cacheKey 패턴)
2. 상태관리 영향 범위 (Zustand store, AsyncStorage TTL)
3. API/DB schema 영향 (Supabase RLS, Edge Function 재배포 필요 여부)
4. 권한 및 예외 처리 누락 가능성 (free/premium 분기, 언어 fallback)
5. iOS/Android 공통 이슈 (Metro 캐시, dayjs 플러그인, deep link)
6. 재사용 가능한 공통 모듈 분리 여부 (_shared/ 활용)
7. 테스트가 필요한 핵심 시나리오 목록

**⚠️ 승인 없이 코드 수정 금지. 점검 결과 보고 → 승인 → 구현 순서 준수**

### 에러 수정 시 필수 원칙
1. 직접 원인과 구조적 원인을 분리해서 설명
2. 임시 수정 금지 — 재발 방지까지 포함한 근본 수정
3. 동일 문제가 발생할 수 있는 파일 전체 일괄 수정
   (예: MAX_TOKENS 이슈 → 모든 Edge Function 동시 점검)
4. 수정 후 체크리스트 + 핵심 시나리오 테스트 코드 제공

### Edge Function 수정 시 추가 규칙
- _shared/claude.ts 변경 시 → 의존하는 모든 함수 재배포 필수
- MAX_TOKENS는 언어별 토큰 소비 차이 고려 (한국어/중국어 = 영어의 1.5-2배)
- 배포 후 반드시 로그 확인: `npx supabase functions logs {fn} --project-ref omypurqmhfihmikyusnc --tail 20`

### UI/디자인 수정 시 추가 규칙
- 오방색 디자인 토큰(colors.ts) 직접 수정 금지 — 토큰 참조 방식 사용
- 공통 컴포넌트 수정 시 영향받는 화면 목록 먼저 파악
- 레이아웃 변경 시 iOS/Android 시뮬레이터 양쪽 확인
- **행운 카드(luckyItems)는 반드시 `LuckyItemCard` 컴포넌트 사용**
  - `src/components/LuckyItemCard.tsx` — overflow 처리가 캡슐화된 전용 컴포넌트
  - 절대 로컬 Pill/Chip으로 재정의 금지
  - 핵심: `textContainer`의 `flex: 1` 제거 시 `numberOfLines`가 동작하지 않음 (RN 측정 제약)

### 🌐 i18n 규칙 (하드코딩 문자열 금지)

**절대 금지**: JSX/TSX에서 영문 문자열 직접 사용

```tsx
// ❌ 금지
<Text>Fortune Readings</Text>
<Button title="Upgrade to Premium" />

// ✅ 필수
const { t } = useTranslation('common');
<Text>{t('fortune.title')}</Text>
<Button title={t('upgrade')} />
```

**키 네이밍 컨벤션**: `<screen>.<section>.<key>`

| 화면 | 예시 키 |
|---|---|
| 홈 | `home.greeting.morning`, `home.quickActions.compatibility` |
| 운세 | `fortune.title`, `fortune.daily` |
| 리포트 | `reports.deepCompatibility.title`, `reports.careerWealth.desc` |
| 궁합 | `compatibility.formTitle`, `compatibility.invalidDate` |
| 채팅 | `fortuneChat.lockTitle`, `fortuneChat.chip1` |
| 설정 | `settings.dailyNotification`, `settings.restoreSuccess` |
| 공통 | `cancel`, `save`, `loading`, `upgrade` (최상위, 전역 재사용) |

**useTranslation 훅 규칙**:
- 반드시 **각 함수 컴포넌트 내부**에서 호출 (Rules of Hooks 준수)
- `t`를 prop으로 전달하지 말 것 — 자식 컴포넌트에서 직접 `useTranslation` 호출
- 네임스페이스는 `'common'` 단일 사용 (예: `useTranslation('common')`)

**14개 언어 locale 파일 경로**:
`apps/mobile/src/i18n/locales/{lang}/common.json`
(ko, en, ja, zh-Hans, zh-Hant, es, pt-BR, hi, vi, id, fr, de, th, ar)

**하드코딩 감지 스크립트**:
```bash
# apps/mobile 디렉터리에서 실행
yarn check:i18n
# 또는 모노레포 루트에서
npx tsx scripts/check-i18n.ts
```

새 화면/컴포넌트 추가 시 반드시 위 스크립트로 검증 후 커밋할 것.

---

## 아이콘 시스템 (SVG Icon Library)

### 위치 및 사용법
- 모든 SVG 아이콘: `apps/mobile/src/components/icons/`
- barrel export: `apps/mobile/src/components/icons/index.ts`
- import: `import { TodayIcon, ChatIcon } from '../../src/components/icons'`

### Props 규격
```tsx
interface Props { color: string; size?: number }  // size 기본값: 24
```
- `color` 필수 — 하드코딩 금지, 항상 토큰(`T.primary.DEFAULT`, `T.text.faint` 등) 또는 호출부에서 전달
- 탭바 아이콘: `(color: string) => ReactNode` 팩토리 패턴 사용 (탭 포커스 색상 자동 적용)

### 현재 등록된 아이콘 (39개)
TodayIcon, WeekIcon, MonthIcon, AnnualReportIcon, MyChartIcon,
ColorIcon, DirectionIcon, NumberIcon, FoodIcon, LockIcon,
ChatIcon, GiftIcon, ThumbUpIcon, ThumbDownIcon,
RefreshIcon, CloseIcon,
HomeIcon, ChartIcon, FortuneIcon, SettingsIcon,
RelationshipIcon, JournalIcon, TimingIcon, RoutineIcon,
ShareIcon, BellIcon, StarIcon, CalendarIcon,
WoodIcon, FireIcon, EarthIcon, MetalIcon, WaterIcon,
StemIcon, BranchIcon, PillarIcon, ReportIcon, CompatIcon, KPersonalityIcon

### 신규 아이콘 추가 규칙
1. `src/components/icons/XxxIcon.tsx` 파일 생성 (`Svg`, `Path`/`Line`/`Rect`/`Circle`/`G` 사용)
2. `index.ts` barrel에 export 추가
3. `react-native-svg`가 네이티브 모듈 — 신규 설치 시 pod install 필요

---

## AskMoreModal (플로팅 채팅 모달)

### 파일 위치
- 컴포넌트: `apps/mobile/src/components/AskMoreModal.tsx`
- 세션 스토리지: `apps/mobile/src/utils/chatStorage.ts`
- 사용처: `apps/mobile/app/(tabs)/home.tsx`

### 제한 상수
```ts
const MAX_FREE_TURNS    = 3;   // 무료 사용자 일일 질문 한도
const MAX_PREMIUM_TURNS = 10;  // 프리미엄 사용자 일일 질문 한도
```
- `effectiveMax = isPremium ? MAX_PREMIUM_TURNS : MAX_FREE_TURNS`
- 배지: 항상 `"N회 남음"` 형식 표시 (무제한 문구 없음)

### 세션 유지 (chatStorage.ts)
- AsyncStorage 키: `ask_more_session`
- 구조: `{ date: 'YYYY-MM-DD', messages: ChatMessage[], turns: number }`
- 날짜 변경 시 자동 무효화 (`session.date !== today()`)
- 닫기: 세션 유지 (reset 없음) / 새로고침: `Alert.alert` 확인 후 `clearSession()`

### SSE 파싱 패턴 (React Native fallback)
React Native에서 `response.body` 가 `null`일 때 `resp.text()` 로 raw SSE 수신:
```ts
const text = await resp.text();
const content = text
  .split('\n')
  .filter(l => l.startsWith('data: '))
  .map(l => {
    const d = l.slice(6).trim();
    if (d === '[DONE]') return '';
    try { return (JSON.parse(d) as { token?: string }).token ?? ''; }
    catch { return ''; }
  })
  .join('');
```
- **절대 raw SSE 텍스트를 메시지로 직접 사용 금지** (`data: {"token":"오"}` 노출 버그)
- `useFortunChat.ts` fallback 경로에 이 패턴이 구현돼 있음 — 제거 또는 우회 금지

### 마크다운 볼드 렌더링
```tsx
bold.split(/\*\*(.*?)\*\*/g).map((part, i) =>
  i % 2 === 1
    ? <Text key={i} style={{ color: '#C9A84C', fontWeight: '700' }}>{part}</Text>
    : part
)
```

### fortune-chat/[fortuneId].tsx
- `@deprecated` — 홈 탭은 AskMoreModal 사용
- Deep-link fallback 용도로만 유지 (`/fortune-chat/[fortuneId]` 라우트)
- 삭제 금지

---

## 반복 발생 이슈 (Recurring Issues)

| 증상 | 원인 | 해결 |
|---|---|---|
| SSE 응답이 `data: {"token":"오"}` 형태로 화면에 출력 | `response.body` null → fallback `resp.text()` 반환값을 직접 메시지로 사용 | fallback에서 SSE 라인 파싱 (위 패턴 적용) |
| 새 SVG 아이콘 추가 후 iOS 빌드 실패 | react-native-svg 네이티브 모듈 — pod install 미실행 | `pod deintegrate && pod install --repo-update` |
| 모달 닫았다 다시 열면 turns 0 리셋 | `visible=false` 시 hook state 초기화 | chatStorage.ts 세션 복원 패턴 사용 (load on `visible=true`) |
| 프리미엄 사용자에게 배지 미표시 | `{!isPremium && <Badge />}` 조건부 렌더링 | 조건 제거 — 항상 배지 표시, 텍스트만 분기 |
| CJK 운세 응답 중간에 잘림 (JSON 파싱 실패 → 502) | MAX_TOKENS 영어 기준 설정 — CJK는 1.5~2× 토큰 소모 | `getMaxTokens()` 함수로 언어별 동적 계산 (saju-reading claude.ts 참고) |
| Edge Function 401 Invalid JWT | 신규 Supabase 프로젝트의 ES256 JWT를 게이트웨이가 검증 못 함 | 모든 함수 `--no-verify-jwt` 플래그로 재배포 |
| Android `"Plugin [id: 'com.facebook.react.settings'] was not found"` | Gradle `Process.execute()`가 Homebrew PATH 미상속 → node 미발견 | `withAndroidNodePath.js` config plugin이 node 절대 경로로 교체 (app.json 등록됨) |
| Android `"Unsupported class file major version 69"` | Java 25 + Gradle 8.8 미호환 (최대 Java 22) | `withAndroidNodePath.js`가 `gradle.properties`에 `org.gradle.java.home=Java17경로` 추가 |
| Android `react-native-svg:compileDebugJavaWithJavac` 실패 | `react-native-svg` 버전 너무 높거나 `MatrixDecompositionContext` 필드 접근 불가 | `react-native-svg` Expo SDK 51 권장 버전(`15.2.0`)으로 고정 + postinstall 스크립트로 RN 필드 public화 |
| Android 오행 추천 "Streaming not supported" | Hermes가 `fetch()` `response.body`를 `null` 반환 — `ReadableStream` 미지원 | `resp.body?.getReader()` 없으면 `resp.text()` 전체 파싱 폴백 (`useContentRecommendation.ts`) |
| Android `"Unsupported class file major version 69"` | 시스템 Java 25 + Gradle 8.8 미호환 | `~/.zshrc`에 `export JAVA_HOME=$(/usr/libexec/java_home -v 17)` 추가 |
| iOS 시뮬레이터 한국어 설정인데 앱이 영어로 표시 | `detectLanguage()`가 `locales[0]`만 확인 — Mac 호스트 `en-001`이 첫 번째로 삽입됨 | 전체 locales 배열 순회하여 첫 번째 지원 언어 반환 (`i18n/index.ts`) |
| `VirtualizedLists should never be nested inside plain ScrollViews` 경고 | FlatList/WheelPicker가 ScrollView 안에 중첩됨 | WheelPicker를 `ScrollView + map`으로 교체 (`nestedScrollEnabled`는 경고 미제거) |
| 설정 → 내 정보 수정 탭 시 홈으로 리다이렉트 | `(onboarding)` 그룹은 `useAuthGuard`가 인증 사용자를 홈으로 리다이렉트 | `app/edit-profile.tsx` 독립 라우트 사용 (`/(onboarding)/birth-input` 직접 접근 금지) |

---

## Android 개발 체크리스트

매 세션 시작 시 확인:

```bash
java -version          # 17.x.x 확인 (25면 ~/.zshrc JAVA_HOME 설정 확인)
emulator -list-avds    # AVD 목록 확인
npx expo run:android   # 빌드 및 실행
```

Android 빌드 실패 시 순서:
1. `java -version` → 17 아니면 `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`
2. `pnpm install` → postinstall 스크립트(`patch-android-rnsvg.js`) 재적용 확인
3. Gradle 캐시 문제: `cd android && ./gradlew clean && cd ..`
4. Metro 캐시: `npx expo start --clear` 후 재시도

---

## UI 컴포넌트 규칙 (2026-03-15 수립)

### 탭 화면 헤더 — ScreenHeader 필수

- **위치**: `apps/mobile/src/components/ScreenHeader.tsx`
- **적용 대상**: 모든 탭 화면 (home 탭 제외 — 별도 디자인)
- **props**: `title: string`, `subtitle?: string`
- **현재 적용됨**: fortune, journal, relationships, chart, calendar (CalendarScreen), settings, face-insight

```tsx
import { ScreenHeader } from '../../src/components/ScreenHeader';
// 사용:
<ScreenHeader title={t('screen.title')} subtitle={t('screen.subtitle')} />
```

**절대 금지**: 탭 화면에서 별도 `<Text style={styles.title}>` 구조 사용 — ScreenHeader로 통일

### 탭 화면 paddingTop 규칙

- **ScrollView/View 기반 탭**: `contentContainerStyle: { paddingTop: 60 }`
- **SafeAreaView 기반 탭**: 내부 컨테이너에 `paddingTop: 60` (SafeAreaView는 safe area inset 추가)
- **CalendarScreen**: SafeAreaView + `headerArea: { paddingTop: 60, paddingHorizontal: T.spacing[6] }`
- 60 미만/초과 사용 시 화면 간 제목 높이 불일치 발생 → 반드시 60 통일

### WheelPicker 규칙

- **FlatList 사용 금지**: VirtualizedLists 중첩 경고 발생
- **ScrollView + map 방식 사용** (현재 구현: `src/components/WheelPicker.tsx`)
- 데이터 최대 81개 (YEARS), 성능 문제 없음
- `snapToInterval={ITEM_H}` + `decelerationRate="fast"` 으로 드럼롤 동작 유지
- `ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false })` — FlatList의 `scrollToOffset` 대신 ScrollView의 `scrollTo` 사용

### edit-profile.tsx 라우팅 규칙

- **경로**: `app/edit-profile.tsx` (onboarding 그룹 **외부**)
- **이유**: `(onboarding)` 그룹은 `useAuthGuard`가 `onboarding_completed=true` 사용자를 홈으로 리다이렉트
- **설정 화면에서 진입**: `router.push('/edit-profile')` (절대 `/(onboarding)/birth-input` 사용 금지)
- **연도 초기값**: `useState(70)` 고정 (= 2000년), 저장된 메타데이터 무시
- **출생시간 토글**: `useState(false)` 고정 (항상 OFF)
