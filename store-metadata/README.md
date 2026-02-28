# K-Saju Store Metadata

App Store Connect and Google Play Console metadata for K-Saju Global.

## Directory Structure

```
store-metadata/
├── en-US/          # English (US/UK/AU)
├── ko/             # Korean
├── ja/             # Japanese
├── zh-Hans/        # Simplified Chinese
├── es-MX/          # Spanish (LATAM/Spain)
├── hi/             # Hindi (South Asia)
└── screenshots/    # Screenshot requirements + assets
```

Each locale directory contains:
| File | Max Length | Purpose |
|------|-----------|---------|
| `title.txt` | 30 chars (iOS) / 50 chars (Android) | App name |
| `subtitle.txt` | 30 chars | App Store subtitle (iOS only) |
| `description.txt` | 4000 chars | Full store description |
| `keywords.txt` | 100 chars | Search keywords (iOS only) |
| `promotional_text.txt` | 170 chars | Promotional text (iOS, editable without resubmit) |
| `release_notes.txt` | 4000 chars | What's new in this version |

## App Information

| Field | Value |
|-------|-------|
| Bundle ID (iOS) | `com.ksaju.global` |
| Package Name (Android) | `com.ksaju.global` |
| Category (iOS) | Lifestyle / Health & Fitness |
| Category (Android) | Lifestyle |
| Content Rating | 4+ / Everyone |
| Privacy Policy URL | https://k-saju.app/privacy |
| Support URL | https://k-saju.app/support |
| Marketing URL | https://k-saju.app |

## App Icon

- **iOS App Store:** 1024 × 1024 px PNG, no transparency, no rounded corners (applied by OS)
- **Android:** 512 × 512 px PNG (hi-res icon for Play Store listing)
- **Adaptive Icon (Android):** `assets/adaptive-icon.png` — foreground on `#1a0a2e` background

Current placeholder: `apps/mobile/assets/icon.png`
**Action required:** Replace with production icon before submission.

## Submission Checklist

### App Store Connect (iOS)
- [ ] App icon 1024×1024 uploaded
- [ ] Screenshots uploaded for 6.7" and 5.5" (min 3 each)
- [ ] Privacy policy URL set: https://k-saju.app/privacy
- [ ] Support URL set: https://k-saju.app/support
- [ ] Age rating questionnaire completed (4+)
- [ ] All 6 locale metadata entered
- [ ] In-app purchase products configured in App Store Connect:
  - `k_saju_premium_monthly` — $8.99/month
  - `k_saju_premium_annual` — $59.99/year
  - `k_saju_compatibility` — $4.99
  - `k_saju_career` — $4.99
  - `k_saju_daewoon_pdf` — $6.99
  - `k_saju_name_analysis` — $9.99
- [ ] RevenueCat entitlement IDs linked to App Store products
- [ ] EAS build submitted: `eas build --platform ios --profile production`

### Google Play Console (Android)
- [ ] App icon 512×512 uploaded
- [ ] Feature graphic 1024×500 uploaded
- [ ] Screenshots uploaded for phone (min 2)
- [ ] Privacy policy URL set
- [ ] All 6 locale metadata entered
- [ ] In-app products configured to match iOS SKUs
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed
- [ ] EAS build submitted: `eas build --platform android --profile production`

## EAS Submit

After builds are ready:
```bash
# Submit to App Store Connect
eas submit --platform ios --profile production

# Submit to Google Play
eas submit --platform android --profile production
```

## Fastlane (Future)

For automated screenshot generation and metadata delivery, see `screenshots/README.md`.
