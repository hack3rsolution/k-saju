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

## TODO (Next Implementation Steps)

- [ ] Supabase client setup (`src/lib/supabase.ts`) + deep-link callback
- [ ] Zustand store: `authStore`, `sajuStore`, `entitlementStore`
- [ ] Birth-date / time picker UI components
- [ ] Wire `calculateFourPillars` from saju-engine into chart screen
- [ ] Solar-term (절기) lookup table for precise month pillar
- [ ] RevenueCat SDK integration + paywall purchase flow
- [ ] Supabase Edge Function: `saju-reading` (Claude API call)
- [ ] Push notifications (daily fortune via Expo Notifications)
- [ ] i18n setup (ko, zh-Hans, zh-Hant, ja, en, es, hi)
