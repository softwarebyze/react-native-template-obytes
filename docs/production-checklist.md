# Production Readiness Checklist

Use this before the first App Store / Play Store submission.

**Ship process:** see **[docs/releases.md](./releases.md)** for TestFlight / version bump / marketing steps.

**Last updated:** 2026-09-02 — generic template checklist (replace placeholders after clone).

## CI: what runs on every PR?

| Workflow | Every PR? | Status |
| -------- | --------- | ------ |
| **Lint TS** | Yes | ✅ Required |
| **Type Check (tsc)** | Yes | ✅ Required |
| **Tests (Jest)** | Yes | ✅ Required |
| **Knip** | Yes | ✅ Unused-export check (also in `pnpm check-all`) |
| **EAS Update Preview** | Yes | Skipped (green) when EXPO_TOKEN is empty |
| **Expo Doctor** | When deps / native config change | Configured |
| **React Doctor** | Advisory | ✅ |
| **Dev Client rebuild** | Native / branding path changes | ✅ |
| **E2E (Maestro)** | Auto on `src/**` / `.maestro/**` changes + every push to `main` | ✅ |
| **Maestro PR screenshots** | When E2E runs on PRs | ✅ |

**Local gate:** `pnpm check-all` = lint + type-check + translation lint + Jest + knip.

**Recommended:** GitHub branch protection on `main` — require **Lint TS**, **Type Check**, **Tests (jest)**.

## Pre-release engineering

- [ ] `pnpm check-all` passes locally
- [ ] Unit tests pass
- [ ] Maestro smoke E2E passes (GitHub emulator, auto on app changes)
- [ ] **Manual playtest on iPhone** — latest **preview** binary: onboarding, auth, and sample feed
- [ ] Settings links wired (GitHub, privacy, terms, share, rate)
- [ ] Replace demo feed UI with your product
- [ ] App Store listing source — `store.config.json` (EAS Metadata)
- [ ] Review phone: `YOUR_REVIEW_PHONE` in store config
- [ ] `EXPO_PUBLIC_APP_STORE_ID` in EAS **production** env = **`YOUR_PRODUCTION_ASC_APP_ID`**
- [ ] Contact email: `YOUR_EXPO_ACCOUNT@gmail.com` in app + legal docs
- [ ] Hosted privacy / terms — placeholder privacy/terms URLs in app-links and store config

## Versioning & builds

| Step | Status | Action |
| ---- | ------ | ------ |
| 1. Version bump | Template default | **v1.0.0** in `package.json` / store metadata |
| 2. iOS dev client | As needed | Rebuild when native deps / display name / `CFBundleDisplayName` change  |
| 3. Device QA | Partial | Playtest the preview binary |
| 4. Preview build (TestFlight) | Ready to dispatch | Preview ASC **`YOUR_PREVIEW_ASC_APP_ID`** (`com.obytes.preview`)  |
| 5. Submit to stores | iOS TestFlight via preview; production pending | Preview TF: [YOUR_PREVIEW_ASC_APP_ID](https://appstoreconnect.apple.com/apps/YOUR_PREVIEW_ASC_APP_ID/testflight/ios) · Prod: [YOUR_PRODUCTION_ASC_APP_ID](https://appstoreconnect.apple.com/apps/YOUR_PRODUCTION_ASC_APP_ID/appstore) |
| 6. Production build | Pending | Rebuild from main after preview is validated |

## Store listing requirements

- [ ] App Store listing copy — `store.config.json` (push via EAS Metadata)
- [ ] **App Store Connect API key** — via EAS credentials for `eas metadata` / submit
- [ ] `pnpm metadata:push` — preview ASC (`YOUR_PREVIEW_ASC_APP_ID`); generates `store.preview.config.json` 
- [ ] `pnpm metadata:push:production` — production ASC (`YOUR_PRODUCTION_ASC_APP_ID`)
- [ ] App Store screenshots matching shipped UI — [store-screenshots.md](./store-screenshots.md); Fastlane or EAS Metadata
- [ ] Google Play Console app record + screenshots + description
- [ ] Privacy policy — hosted privacy URL in store config
- [ ] Terms of service — hosted `/terms/`
- [ ] Pricing — set in ASC Pricing and Availability UI
- [ ] Marketing / privacy URLs — in store config; sync with metadata push
- [ ] Privacy nutrition labels — declare analytics (PostHog product interaction) in ASC UI
- [ ] iOS age rating — via store config → `apple.advisory` + metadata push (4+)
- [ ] Google Play content rating questionnaire
- [ ] Production ASC app — `com.obytes` / Apple ID `YOUR_PRODUCTION_ASC_APP_ID`
- [ ] Export compliance — `ITSAppUsesNonExemptEncryption: false` in `app.config.ts`

## Secrets checklist

| Secret | Required for | Configured? |
| ------ | ------------ | ----------- |
| `EXPO_TOKEN` | EAS preview, QA, production | Add after eas init |
| App Store Connect API key | `metadata:push` / `metadata:pull` | EAS credentials |
| `MAESTRO_CLOUD_API_KEY` | Maestro Cloud E2E only | Optional |
| `GH_TOKEN` | New App Version workflow | Optional |

## Post-launch

- [ ] **New GitHub Release** workflow after production build is validated
- [ ] Monitor EAS Update channels (`preview`, `production`)

## Current status summary

Template defaults: demo feed, placeholder legal URLs, analytics off until configured.

## Automation vs one-time setup

Most release steps are **already wired as GitHub Actions** — they use `workflow_dispatch` (or release tags) so you click a button instead of running EAS locally. The **first** App Store / Play submission still needs a few one-time account setup items that cannot be scripted.

### Already automated (Actions tab)

| Workflow | Trigger | What it does |
| -------- | ------- | ------------ |
| **EAS QA Build (Android & IOS) (EAS)** | Manual, or **automatically on GitHub Release** | Preview builds; iOS uses `AUTO_SUBMIT: true` → TestFlight |
| **EAS Submit Preview iOS (TestFlight)** | Manual | Submit latest (or given) preview IPA to TestFlight |
| **EAS Production Build** | Manual | Store binaries (Android + iOS) |
| **New App Version** | Manual (patch/minor/major) | Bump version, tag, push → triggers release flow |
| **New GitHub Release** | Auto on new tag | Draft release notes |
| **E2E (Maestro)** | Auto on `src/**` changes + push to `main` | Smoke test + PR screenshots |
| **EAS Update Preview** | Every PR | OTA preview QR only when EXPO_TOKEN is configured; otherwise the workflow skips successfully |
| **EAS Metadata Push** | Manual | Push `store.config.json` (+ generated preview title) |
| **Knip / Expo Doctor / React Doctor** | PR / path filters | Unused exports + dependency health |

**TestFlight trigger (no local EXPO_TOKEN needed for agents):** Actions → **EAS QA Build (Android & IOS) (EAS)** on the merged (or this) branch. Preview iOS auto-submits to ASC `YOUR_PREVIEW_ASC_APP_ID`. Optionally dispatch **EAS Submit Preview iOS (TestFlight)** if a preview IPA already exists.

**Repeat release path (after first-time store setup):**

1. Actions → **New App Version** (pick patch/minor/major)
2. That creates a tag → **New GitHub Release** runs
3. Release published → **EAS QA Build** runs automatically (`AUTO_SUBMIT` on iOS preview)
4. After QA on device → Actions → **EAS Production Build**
5. Metadata: Actions → **EAS Metadata Push** (`preview` or `production`)
6. Submit production: `pnpm submit:production:ios` (sets `EXPO_PUBLIC_APP_ENV=production` — do not rely on a development `.env`)

### Listing updates — preferred path

Full how-to: [eas-metadata.md](./eas-metadata.md).

| Change | How |
| ------ | --- |
| Description, keywords, URLs, review notes, age advisory | Edit `store.config.json` → `pnpm metadata:push:production` (or GHA) |
| Preview TestFlight **app name** | `pnpm metadata:push` regenerates `store.preview.config.json` |
| Price / availability | ASC **Pricing and Availability** UI |
| Privacy nutrition labels | ASC UI |
| iOS screenshots | Fastlane (`pnpm screenshots:upload:ios`) or EAS Metadata `APP_IPHONE_67` ([store-screenshots.md](./store-screenshots.md)) |
| Android screenshots | Fastlane / Play Console |

Avoid one-off App Store Connect API / JWT scripts for shipping.

### One-time only (you, first submission)

| Item | Why manual |
| ---- | ---------- |
| **App Store Connect app record** | Apple account / bundle ID registration |
| **ASC API key** → EAS credentials | Needed once so `eas metadata` / submit work |
| App price | Not in EAS Metadata schema — ASC Pricing UI |
| **Google Play app record** | Play Console signup |
| **Register iPhone** (`eas device:create`) | Device UDID for ad-hoc dev IPA |
| **Privacy nutrition labels** | ASC UI |
| **Screenshots matching final UI** | Capture on device/sim; upload via metadata or Fastlane |

## Suggested order from here

1. Replace branding and YOUR_* placeholders, then eas init.
2. Add EXPO_TOKEN and dispatch the preview QA build.
3. Playtest onboarding, auth, and the sample feed.
4. Fill privacy labels in App Store Connect if analytics is on.
5. Capture screenshots and push store metadata.
6. Rebuild and submit production after preview is good.
7. Create the Play Console app when ready for Android.

See also: [ios-testing-and-store.md](./ios-testing-and-store.md), [eas-metadata.md](./eas-metadata.md), [releases.md](./releases.md)
