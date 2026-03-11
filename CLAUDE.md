# CLAUDE.md — K-Saju Global
# Pie Nest Inc. | Donghyun Lee
# 마지막 갱신: 2026-03-11

---

## ⚡ 세션 시작 프로토콜 (매 세션 첫 번째 실행)

```
세션을 시작합니다.
아래 순서대로 프로젝트 상태를 확인하고 CLAUDE.md의 [현재 상태] 섹션을 갱신해줘.
파일 수정 외에 다른 작업은 하지 않음.

1. git log --oneline -10
2. git status --short
3. cat CLAUDE.md | grep -A 5 "현재 상태"
4. 위 결과를 바탕으로 CLAUDE.md의 [현재 상태] 섹션만 업데이트
```

---

## 🏗️ 프로젝트 구조

```
~/Projects/k-saju/
├── apps/
│   └── mobile/                        # React Native / Expo (메인 앱)
│       ├── app/                       # Expo Router 화면 (src/ 아님) # 수정됨
│       │   ├── _layout.tsx
│       │   ├── index.tsx
│       │   ├── paywall.tsx
│       │   ├── settings.tsx
│       │   ├── face-result.tsx        # Face Insight 결과 # 수정됨
│       │   ├── (auth)/                # login, callback
│       │   ├── (onboarding)/          # birth-input, cultural-frame, result-preview
│       │   ├── (tabs)/                # home, chart, fortune, journal, relationships, face
│       │   ├── compatibility/
│       │   ├── fortune/[type].tsx
│       │   ├── fortune-chat/[fortuneId].tsx
│       │   └── reports/
│       ├── src/                       # 비-라우터 소스 코드 # 수정됨
│       │   ├── components/            # 공유 UI 컴포넌트
│       │   ├── features/              # 피처 모듈 (face-insight 등) # 수정됨
│       │   ├── hooks/                 # React Query 훅
│       │   ├── i18n/                  # i18n 설정 + locales/ # 수정됨
│       │   ├── lib/                   # 유틸 (supabase.ts, dayjs.ts 등) # 수정됨
│       │   ├── store/                 # Zustand 스토어 # 수정됨
│       │   ├── theme/                 # 디자인 토큰 (tokens.ts)
│       │   └── types/                 # TypeScript 타입
│       ├── app.json                   # Expo 설정 (app.config.ts 아님) # 수정됨
│       ├── index.js                   # 로컬 엔트리 (pnpm 모노레포용)
│       └── metro.config.js
├── supabase/
│   ├── functions/                     # Edge Functions (Deno)
│   │   ├── _shared/                   # 공유 유틸 (claude.ts, lang 등) # 수정됨
│   │   ├── saju-reading/
│   │   ├── fortune-chat/
│   │   ├── timing-advisor/
│   │   ├── journal-analysis/
│   │   ├── relationship-fortune/
│   │   ├── addon-report/
│   │   ├── content-recommendation/
│   │   ├── face-insight-analyze/
│   │   └── daily-fortune-push/
│   └── migrations/                    # SQL 마이그레이션 (005~ 번호 형식) # 수정됨
└── packages/
    ├── saju-engine/                   # 순수 TS 사주 계산 엔진 (RN 의존성 없음)
    │   └── src/                       # constants, types, pillars, elements, daewoon 등
    ├── db/                            # Prisma 스키마 + migrations (001~005) # 수정됨
    └── ui/                            # 공유 RN 컴포넌트
```

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| 앱 프레임워크 | React Native + Expo SDK 51 + Expo Router v3 |
| 언어 | TypeScript |
| DB / Auth | Supabase (PostgreSQL + RLS) |
| AI | Claude API (claude-sonnet-4-20250514) |
| 결제 | RevenueCat |
| 상태관리 | Zustand (전역 상태) + React Query (서버 상태) # 수정됨 |
| i18n | react-i18next (14개 언어, 5개 네임스페이스) # 수정됨 |
| 날짜 | dayjs + isoWeek |
| 빌드 | EAS (Expo Application Services) |
| 패키지 매니저 | pnpm (pnpm-lock.yaml 확정 — yarn.lock 없음) # 수정됨 |
| 테스트 러너 | jest (apps/mobile/jest.config.js) |

---

## 🚨 절대 건드리지 말 것 (NEVER TOUCH)

```
# 1. 기존 Saju 엔진 핵심 로직 # 수정됨
packages/saju-engine/src/
  → pillars.ts, elements.ts, daewoon.ts, constants.ts 수정 금지
supabase/functions/saju-reading/

# 2. Magic Link 딥링크 처리 # 수정됨
apps/mobile/app/_layout.tsx 내 딥링크 분기 (Linking 처리 로직)
  → +native-intent.tsx 는 이 프로젝트에 존재하지 않음
  → Magic Link / token_hash / email 관련 분기는 수정 금지
  → 새 딥링크 추가 시 elif 분기만 추가

# 3. 기존 마이그레이션 파일
supabase/migrations/ 내 기존 .sql 파일
packages/db/migrations/ 내 기존 .sql 파일
→ 신규 파일 추가만 허용, 기존 파일 수정 금지

# 4. RevenueCat entitlement 핵심 로직
apps/mobile/src/store/entitlementStore.ts
→ 수정 전 반드시 확인 요청
```

---

## 📐 코드 작성 원칙

```
[원칙 1] PRE-CHECK
  모든 작업 전 실제 파일 경로·타입명·패턴을 bash로 확인 후 시작
  추측으로 import 경로 작성 금지

[원칙 2] REUSE
  기존 패턴(훅, 컴포넌트, Edge Function 구조)을 그대로 재활용
  신규 패키지 설치 전 기존 패키지로 해결 가능한지 확인

[원칙 3] ISOLATION
  각 작업은 지정된 파일만 수정
  작업 범위 외 파일 변경 발생 시 즉시 보고

[원칙 4] VERIFY
  작업 완료 후 반드시 실행:
  - npx tsc --noEmit
  - eslint 해당 파일 --max-warnings 0
  - 관련 테스트 실행
  - git diff로 변경 범위 확인
  에러 있으면 수정 후 재실행 (PASS될 때까지 반복)
```

---

## 🌍 i18n 규칙

- 지원 언어: 14개 # 수정됨
  `ko, en, ja, zh-Hans, zh-Hant, es, fr, de, pt-BR, ar, vi, th, id, hi`
  ※ ms(말레이어), ru(러시아어) 미지원 — 디렉토리 없음 # 수정됨
  ※ zh는 zh-Hans / zh-Hant 분리, pt는 pt-BR # 수정됨
- 로케일 파일 위치: `apps/mobile/src/i18n/locales/{lang}/` # 수정됨
- 네임스페이스: common, chart, fortune, onboarding, paywall (5개 × 14언어 = 70파일) # 수정됨
- 신규 i18n 키 추가 시 14개 파일 모두 업데이트 필수 # 수정됨
- JSON 수정 후 유효성 검증:
  ```bash
  for f in $(find apps/mobile/src/i18n -name "*.json"); do  # 수정됨
    python3 -m json.tool "$f" > /dev/null && echo "✅ $f" || echo "❌ $f"
  done
  ```
- 한국 문화 용어(사상체질 명칭 등)는 음차 유지: Taeyang, Soyang, Taeeum, Soeum
- 아랍어(ar) 추가 시 RTL 레이아웃 확인 필수

---

## 💳 RevenueCat / 결제 규칙

- entitlement 체크는 기존 패턴 그대로 재사용 (`src/store/entitlementStore.ts`)
- Paywall 신규 생성 시 기존 Paywall 컴포넌트 구조 먼저 확인 (`app/paywall.tsx`)
- Sandbox 테스트 필수 (실 결제 테스트 금지)

---

## 🗄️ Supabase 규칙

- 마이그레이션: `supabase/migrations/[NNN]_[description].sql` 또는 `[timestamp]_[description].sql` # 수정됨
  기존 파일 번호 형식: `005_`, `006_`, `007_` + 타임스탬프 형식 혼재 — 기존 형식 맞출 것
- 신규 테이블 생성 시 RLS 정책 필수 포함
- `supabase db push`는 Donghyun이 직접 실행 (Claude Code 자동 실행 금지)
- Edge Function 배포도 Donghyun이 직접: # 수정됨
  `supabase functions deploy [function-name] --no-verify-jwt`
  ※ `--no-verify-jwt` 필수 — 게이트웨이 ES256 JWT 검증 미지원 (함수 내부에서 자체 인증 처리)

---

## 🔨 자주 쓰는 명령어

```bash
# 타입 에러 확인
cd apps/mobile && npx tsc --noEmit  # 수정됨

# 린트
npx eslint [파일경로] --ext .ts,.tsx --max-warnings 0

# 테스트 (apps/mobile에 test 스크립트 없음 → npx jest 직접 사용) # 수정됨
cd apps/mobile && npx jest --testPathPattern="[패턴]"

# 전체 테스트
cd apps/mobile && npx jest

# i18n JSON 유효성 # 수정됨
for f in $(find apps/mobile/src/i18n -name "*.json"); do
  python3 -m json.tool "$f" > /dev/null && echo "✅ $f" || echo "❌ $f"
done

# 변경 파일 확인
git diff --name-only main

# EAS Preview 빌드 (Android)
cd apps/mobile && eas build --profile preview --platform android --non-interactive

# Supabase 마이그레이션 dry-run
supabase db diff --schema public

# pnpm 의존성 설치 (yarn 아님) # 수정됨
pnpm install
```

---

## 📋 현재 상태 (세션 시작 시 자동 갱신)

```
갱신일시: 2026-03-11
현재 브랜치: feat/k-personality (M1~M4 완료 — PR 준비 중)
앱 버전: app.json=2.4.0 / package.json=1.2.0 (의도적 불일치 — app.json이 사용자 표시 버전)

완료된 작업:
  ✅ K-Saju v2.3.0 빌드 완료 (Android + iOS 시뮬레이터 동작)
  ✅ JWT 에러 해결 (--no-verify-jwt + getFreshToken 버그 수정)
  ✅ CLAUDE.md 전면 재작성 — 잘못된 경로·명령어 수정 + 누락 컨텍스트 보완
  ✅ K-Personality M1 완료 (aa63c93)
     → types, engine/elementMapping, engine/calculator
     → hooks/useKPersonality (fetch + share)
     → supabase/functions/k-personality-analysis (Claude Haiku, 7일 캐싱)
     → supabase/migrations/20260311000000_add_k_personality.sql
     → 49 tests PASS
  ✅ K-Personality M2 완료 (fa43fe5 + 29e6a85)
     → ElementBarChart, KTypeBadge, KPersonalityResultCard (ViewShot 공유)
     → app/k-type/compare.tsx (오행 궁합), app/k-type/index.tsx (딥링크 핸들러)
  ✅ K-Personality M4 완료 (feat/k-personality)
     → useKPersonality: AsyncStorage 캐시 7일 TTL (캐시 히트 시 로딩 스피너 없음)
     → useShareKPersonality: share_enabled=true DB 업데이트 + deeplink에 userId 포함
     → _layout.tsx: k-type Stack.Screen 등록
     → k-type/index.tsx: share=undefined → (tabs)/k-type 리다이렉트 수정
  ✅ K-Personality M3 완료 (a0b0936)
     → app/(tabs)/k-type.tsx (탭 메인 화면, 무료/프리미엄 3상태)
     → app/(tabs)/_layout.tsx (K-Type 탭 추가 — leaf-outline)
     → KPersonalityPaywall (RC 구독 모달)
     → home.tsx KPersonalityTeaser 임베드
     → 14개 common.json kPersonality 키 추가 (17개 키 × 14언어)

진행 중:
  🔄 M5-STEP-2: EAS Preview 빌드 (Donghyun 직접 실행)
     eas build --profile preview --platform android --non-interactive
     eas build --profile preview --platform ios --non-interactive
  🔄 M5-STEP-3: PR 머지 후 v2.4.0 태그

대기 중 (Donghyun 직접 실행):
  ✅ supabase db push (완료)
  ✅ supabase functions deploy k-personality-analysis --no-verify-jwt (완료)
  ⏳ Google Play Console 신원확인 완료
  ⏳ Apple Developer 승인
  ⏳ iOS TestFlight 빌드

알려진 이슈:
  ⚠️ app.json(2.3.0) vs package.json(1.2.0) 버전 불일치
  ⚠️ feat/design-system 브랜치 미커밋 파일 존재 (_layout.tsx, useFortune.ts, saju-reading 등)
     → feat/k-personality에서 별도 트래킹 중
```

---

## 🗺️ K-Personality 로드맵 진행 현황

```
MILESTONE 1: 오행 계산 엔진 + Edge Function   [✅ 완료 — aa63c93]
  [x] M1-STEP-1  브랜치 생성 + 타입 정의
  [x] M1-STEP-2  천간/지지 오행 매핑 데이터
  [x] M1-STEP-3  오행 비율 계산 함수
  [x] M1-STEP-4  Supabase Edge Function
  [x] M1-STEP-5  Supabase 마이그레이션
  [x] M1-STEP-6  useKPersonality 훅
  [ ] M1-COMPLETE ← supabase db push + functions deploy --no-verify-jwt (Donghyun 직접)

MILESTONE 2: UI 컴포넌트                       [예상: 1주]
  [ ] M2-STEP-1  ElementBarChart
  [ ] M2-STEP-2  KTypeBadge
  [ ] M2-STEP-3  KPersonalityResultCard + 공유
  [ ] M2-STEP-4  친구 비교 딥링크 + compare 화면
  [ ] M2-COMPLETE

MILESTONE 3: 탭 화면 + RevenueCat             [예상: 1주]
  [ ] M3-STEP-1  K-Type 탭 메인 화면
  [ ] M3-STEP-2  탭 네비게이션 + i18n 14개 언어  # 수정됨
  [ ] M3-STEP-3  KPersonalityPaywall
  [ ] M3-STEP-4  사주 결과 화면 티저 임베드
  [ ] M3-COMPLETE

MILESTONE 4: 캐싱 + 딥링크 완성               [✅ 완료]
  [x] M4-STEP-1  캐시 저장/동기화
  [x] M4-STEP-2  딥링크 최종 완성
  [x] M4-COMPLETE

MILESTONE 5: QA + EAS 빌드                    [진행 중]
  [x] M5-STEP-1  자동화 QA 전체 통과 (169 tests PASS)
  [ ] M5-STEP-2  EAS Preview 빌드 (Android + iOS) ← Donghyun 직접
  [x] M5-STEP-3  PR + CHANGELOG + v2.4.0 태그 준비
  [ ] M5-COMPLETE ← EAS Production 빌드 (Donghyun 직접)
```

---

## 🔄 세션 종료 프로토콜

```
세션을 종료합니다.
아래를 실행하고 CLAUDE.md의 [현재 상태]와 [로드맵 진행 현황]을 갱신해줘.

1. git log --oneline -5
2. git status --short
3. 완료된 스텝에 [x] 표시
4. "진행 중" 항목을 다음 작업으로 업데이트
5. 새로 발견된 이슈가 있으면 "알려진 이슈"에 추가
6. "갱신일시" 업데이트

→ CLAUDE.md 수정만 수행. 코드 변경 없음.
```

---

## 📝 히스토리 요약

```
2026-03 현재
  - K-Saju v2.3.0 완성 (Android + iOS 시뮬레이터 동작 확인)
  - Apple Developer 등록 완료 (승인 대기 중)
  - Google Play Console 신원확인 진행 중
  - K-Personality 기능 PRD + 로드맵 v2 완성
  - 스위스 Lausanne IDC 프로젝트 병행 중 (Zero Trust 아키텍처)

2025 하반기
  - K-Saju 모노레포 구조 확립 (k-saju/)
  - 15개 언어 로컬라이제이션 완료 (이후 14개로 확정 — ms/ru 미포함)
  - RevenueCat Paywall + Magic Link 인증 구현
  - 음력/양력 전환 + Cultural Frame 구현
  - Supabase Edge Functions (사주 분석) 배포
  - EAS CI/CD 파이프라인 구축

2025 상반기
  - K-Saju 초기 아키텍처 설계
  - Dalnara (한국어 교육 앱) 병행 개발 시작
```
