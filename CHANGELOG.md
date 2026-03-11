# Changelog

All notable changes to K-Saju are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.4.0] — 2026-03-11

### Added — K-Personality (K-타입) 오행 성격 유형

K-Saju의 핵심 신기능: 사주팔자의 천간·지지 오행 비율로 성격 유형을 분석합니다.

**엔진 (M1)**
- `packages/saju-engine` 기반 오행 비율 계산 + 사상체질(四象體質) 분류
  - 천간 14자 × 지지 12자 오행 매핑 데이터
  - 오행 비율 (wood/fire/earth/metal/water, 합계 100%)
  - 사상체질: 태양(Taeyang) · 소양(Soyang) · 태음(Taeeum) · 소음(Soeum)
- Supabase Edge Function `k-personality-analysis` (Claude Haiku, 7일 DB 캐시)
- DB 마이그레이션: `k_personality_readings` 테이블 + RLS 정책

**UI 컴포넌트 (M2)**
- `ElementBarChart` — 오행 비율 애니메이션 바 차트
- `KTypeBadge` — 사상체질 뱃지 (사이즈: small / medium / large)
- `KPersonalityResultCard` — ViewShot 공유 카드

**탭 화면 + 결제 (M3)**
- K-Type 탭 (`/(tabs)/k-type`) — 무료/프리미엄 3가지 상태
  - 무료: 유형 배지 + 오행 차트 + 키워드 + 요약
  - 프리미엄: 심층 분석 + 강점 + 성장영역 + 직업 적합도 + 이달의 에너지 + 궁합 유형
- `KPersonalityPaywall` — RevenueCat 구독 모달
- 홈 화면 K-Personality 티저 카드 (KPersonalityTeaser)
- i18n: 14개 언어 × 17개 kPersonality 키 추가

**캐시 + 딥링크 (M4)**
- AsyncStorage 클라이언트 캐시 (7일 TTL): 재방문 시 로딩 스피너 없이 즉시 표시
- 딥링크 `ksaju://k-type?share={userId}` 완성
  - 비교 화면 (`/k-type/compare`): 오행 궁합 점수 + 두 유저 나란히 표시
  - 공유 시 DB `share_enabled=true` 업데이트

---

## [2.3.0] — 2026-02

### Added
- Face Insight 탭 (얼굴 관상 AI 분석)
- 14개 언어 완전 지원 (fr, de, th, ar RTL 추가)
- 타이밍 어드바이저 / 콘텐츠 추천 / 인생 저널 i18n 완성
- K-Culture 레퍼런스 레이어 (한국 문화 맥락 밀도 조정)
- 오방색 기반 디자인 시스템 v2.2.0

### Fixed
- JWT ES256 인증 오류 (Edge Function --no-verify-jwt + getFreshToken 버그)
- AI 언어 고정 버그 (langInstruction 위치 수정)
- 대운 카드 크래시 (BRANCH_ELEMENT 매핑)

---

## [2.0.0] — 2025-12

### Added
- 인생 이벤트 트래커 (Life Journal)
- 관계 대시보드 (Relationship Map)
- AI 팔로업 채팅 (Fortune Chat SSE)
- 오행 기반 콘텐츠 추천
- 타이밍 어드바이저
- AI 피드백 루프

---

## [1.2.0] — 2025-10

### Added
- RevenueCat 결제 + 페이월
- 4종 애드온 리포트 + PDF export
- 푸시 알림 시스템
- My Saju 분석 화면

---

## [1.0.0] — 2025-08

### Added
- K-Saju Global 초기 출시
- 사주팔자 계산 엔진 (packages/saju-engine)
- Supabase Auth (Apple / Google / Magic Link)
- 6개 문화권 프레임 (kr/cn/jp/en/es/in)
- 일간/주간/월간/연간/대운 운세 (Claude Sonnet)
- 10개 언어 i18n
