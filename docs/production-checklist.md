# Production Readiness Checklist

Use this before the first App Store / Play Store submission.

**Ship process:** see **[docs/releases.md](./releases.md)** for TestFlight / version bump / marketing steps.

**Last updated:** 2026-08-27 — TestFlight-shareable ship (Learn kept; feel + playtest: one Settings home, full-row toggles, hide Vercel preview toolbar, dual horseshoe).

## CI: what runs on every PR?

| Workflow | Every PR? | Status |
| -------- | --------- | ------ |
| **Lint TS** | Yes | ✅ Required |
| **Type Check (tsc)** | Yes | ✅ Required |
| **Tests (Jest)** | Yes | ✅ Required |
| **Knip** | Yes | ✅ Unused-export check (also in `pnpm check-all`) |
| **EAS Update Preview** | Yes | ✅ (`EXPO_TOKEN` configured) — Expo QR comment only |
| **Expo Doctor** | When deps / native config change | ⚠️ Configured — currently **fails** on this repo (SDK 56.0.18 vs 56.0.20 patch drift + Hermes V1; upgrade to SDK 57 is out of scope for this TestFlight) |
| **React Doctor** | Advisory | ✅ |
| **Dev Client rebuild** | Native / branding path changes | ✅ |
| **E2E (Maestro)** | Auto on `src/**` / `.maestro/**` changes + every push to `main` | ✅ |
| **Maestro PR screenshots** | When E2E runs on PRs | ✅ |

**Local gate:** `pnpm check-all` = lint + type-check + translation lint + Jest + knip.

**Recommended:** GitHub branch protection on `main` — require **Lint TS**, **Type Check**, **Tests (jest)**.

## Pre-release engineering

- [x] `pnpm check-all` passes locally
- [ ] Unit tests pass
- [x] Maestro smoke E2E passes (GitHub emulator, auto on app changes)
- [ ] **Manual playtest on iPhone** — latest **preview** binary: onboarding, auth, and sample feed
- [x] Settings links wired (GitHub, privacy, terms, share, rate)
- [x] Replace demo feed UI with your product
- [x] App Store listing source — `store.config.json` (EAS Metadata)
- [ ] Review phone: `YOUR_REVIEW_PHONE` in store config
- [ ] `EXPO_PUBLIC_APP_STORE_ID` in EAS **production** env = **`YOUR_PRODUCTION_ASC_APP_ID`**
- [ ] Contact email: `YOUR_EXPO_ACCOUNT@gmail.com` in app + legal docs
- [ ] Hosted privacy / terms — https://obytesapp.vercel.app/privacy/ + `/terms/` (PR #129)

## Versioning & builds

| Step | Status | Action |
| ---- | ------ | ------ |
| 1. Version bump | Done | **v1.0.0** in `package.json` / store metadata |
| 2. iOS dev client | Done | Rebuild when native deps / display name / `CFBundleDisplayName` change (this ship: spaced name) |
| 3. Device QA | Partial | v0.1.x TestFlight done — **re-playtest** the preview binary from this ship |
| 4. Preview build (TestFlight) | Ready to dispatch | Preview ASC **`YOUR_PREVIEW_ASC_APP_ID`** (`com.obytes.preview`) named **ObytesApp Preview** |
| 5. Submit to stores | iOS TestFlight via preview; production pending | Preview TF: [YOUR_PREVIEW_ASC_APP_ID](https://appstoreconnect.apple.com/apps/YOUR_PREVIEW_ASC_APP_ID/testflight/ios) · Prod: [YOUR_PRODUCTION_ASC_APP_ID](https://appstoreconnect.apple.com/apps/YOUR_PRODUCTION_ASC_APP_ID/appstore) |
| 6. Production build | Stale IPA on ASC | Rebuild from `main` after this TestFlight ship is validated |

## Store listing requirements

- [ ] App Store listing copy — `store.config.json` (push via EAS Metadata)
- [ ] **App Store Connect API key** — via EAS credentials for `eas metadata` / submit
- [ ] `pnpm metadata:push` — preview ASC (`YOUR_PREVIEW_ASC_APP_ID`); generates `store.preview.config.json` with title **ObytesApp Preview**
- [ ] `pnpm metadata:push:production` — production ASC (`YOUR_PRODUCTION_ASC_APP_ID`)
- [ ] App Store screenshots matching shipped UI (Learn still in the app) — [store-screenshots.md](./store-screenshots.md); Fastlane or EAS Metadata
- [ ] Google Play Console app record + screenshots + description
- [ ] Privacy policy — https://obytesapp.vercel.app/privacy/
- [ ] Terms of service — hosted `/terms/`
- [ ] Pricing — Paid Up Front **$4.99** USD (ASC Pricing UI)
- [x] Marketing / privacy URLs — in store config; sync with metadata push
- [ ] Privacy nutrition labels — declare analytics (PostHog product interaction) in ASC UI
- [x] iOS age rating — via store config → `apple.advisory` + metadata push (4+)
- [ ] Google Play content rating questionnaire
- [ ] Production ASC app — `com.obytes` / Apple ID `YOUR_PRODUCTION_ASC_APP_ID`
- [x] Export compliance — `ITSAppUsesNonExemptEncryption: false` in `app.config.ts`

## Secrets checklist

| Secret | Required for | Configured? |
| ------ | ------------ | ----------- |
| `EXPO_TOKEN` | EAS preview, QA, production | ✅ |
| App Store Connect API key | `metadata:push` / `metadata:pull` | ✅ (EAS credentials) |
| `MAESTRO_CLOUD_API_KEY` | Maestro Cloud E2E only | Optional |
| `GH_TOKEN` | New App Version workflow | Optional |

## Post-launch

- [ ] **New GitHub Release** workflow after production build is validated
- [ ] Monitor EAS Update channels (`preview`, `production`)

## Current status summary

| Item | Status |
| ---- | ------ |
| Core gameplay + prefs UI | Done |
| Turn indicator (white/black clarity) | Done |
| Learn to Play | **Kept** — praise waits for Continue; horseshoe shows both directions |
| Branding / dev client (SDK 56) | Done — display name **ObytesApp** (native rebuild) |
| Unit tests | Done (`pnpm test`) |
| Maestro E2E + PR screenshot publish | Done |
| Hosted privacy / terms | Done (#129) |
| Error tracking (PostHog exceptions) | **This ship (slim)** — ErrorBoundary + autocapture + env token + `@posthog/react-native-plugin` (native crashes). Do **not** also install archived `posthog-react-native-session-replay` (CocoaPods `PostHog` ~> 3.58 vs ~> 3.69). `posthog-xcode.sh` is patched so missing `posthog-cli` / CLI token **skips** sourcemap upload instead of failing EAS Run fastlane. Full [#130](https://github.com/softwarebyze/Backgammon-Mastermind/pull/130) dump still deferred |

| Full 17-language i18n | **Not this ship** — [#141](https://github.com/softwarebyze/Backgammon-Mastermind/pull/141) |
| **App Store screenshots** | Recapture if Learn / home UI changed |
| **Google Play first upload** | Create Play app + service account when ready |
| Production binary | Rebuild after TestFlight validation |
| Submit for App Review | Blocked on **privacy nutrition labels** + fresh binary/screenshots |

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
| **EAS Update Preview** | Every PR | OTA preview QR (Expo comment) |
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
| Preview TestFlight **app name** | `pnpm metadata:push` regenerates `store.preview.config.json` as **ObytesApp Preview** |
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
| **Paid app price ($4.99)** | Not in EAS Metadata schema — ASC Pricing UI |
| **Google Play app record** | Play Console signup |
| **Register iPhone** (`eas device:create`) | Device UDID for ad-hoc dev IPA |
| **Privacy nutrition labels** | ASC UI |
| **Screenshots matching final UI** | Capture on device/sim; upload via metadata or Fastlane |

## Suggested order from here

1. Merge this TestFlight-shareable PR (Learn stays; do **not** merge [#139](https://github.com/softwarebyze/Backgammon-Mastermind/pull/139) remove-Learn)
2. Dispatch **EAS QA Build (Android & IOS) (EAS)** on the merged branch → TestFlight `YOUR_PREVIEW_ASC_APP_ID`
3. Manual playtest on that binary (Resume, Home mid-game, Learn praise, fat-finger taps)
4. **Privacy nutrition labels** in ASC (PostHog product interaction)
5. Recapture screenshots if needed → `pnpm metadata:push:production`
6. **Rebuild + submit** production iOS (`YOUR_PRODUCTION_ASC_APP_ID`) after TestFlight is good
7. Google Play — Console app + AAB when ready
8. Full PostHog dump ([#130](https://github.com/softwarebyze/Backgammon-Mastermind/pull/130) privacy/docs/source-map CI) still deferred; this ship only wires exceptions. Defer [#141](https://github.com/softwarebyze/Backgammon-Mastermind/pull/141) i18n dump

See also: [ios-testing-and-store.md](./ios-testing-and-store.md), [eas-metadata.md](./eas-metadata.md), [releases.md](./releases.md)
