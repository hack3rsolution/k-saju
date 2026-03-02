# Screenshot Requirements

## iOS (App Store Connect)

| Device | Resolution | Required |
|--------|-----------|---------|
| iPhone 6.7" (Pro Max) | 1290 × 2796 px | Yes (primary) |
| iPhone 5.5" | 1242 × 2208 px | Yes |
| iPad Pro 12.9" (3rd gen+) | 2048 × 2732 px | Yes if supporting tablets |

**Minimum:** 3 screenshots, maximum 10 per device.
**Format:** PNG or JPEG, RGB, no alpha channel.

## Android (Google Play)

| Type | Resolution | Required |
|------|-----------|---------|
| Phone | 1080 × 1920 px (min) | Yes |
| 7-inch tablet | 1080 × 1920 px | Recommended |
| 10-inch tablet | 1080 × 1920 px | Recommended |

**Feature Graphic:** 1024 × 500 px (required for Play Store listing)

---

## Recommended Screens to Capture (in order)

1. **Home / Today's Fortune** — Daily reading card with current 간지 pill
2. **Chart View** — Four Pillars 8-character grid with element balance bars
3. **대운 Timeline** — 10-year luck cycle timeline
4. **Cultural Frame Selection** — 6 frame cards during onboarding
5. **Paywall / Premium** — Premium features overview

---

## Screenshot Automation

Screenshots can be generated using [Fastlane Snapshot](https://docs.fastlane.tools/actions/snapshot/) or manually via Simulator.

```bash
# Generate iOS screenshots via Fastlane (future)
cd apps/mobile
bundle exec fastlane snapshot
```

For now, capture manually via Xcode Simulator:
- `Cmd + S` to save screenshot from Simulator
- Export as PNG at 1x (Simulator renders at native resolution)
