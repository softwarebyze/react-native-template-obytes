# iOS testing & App Store submit

## Contact email

Store listings, privacy policy, and in-app Support use **YOUR_EXPO_ACCOUNT@gmail.com** (replace with your account).

Before any metadata push, confirm `store.config.json` → `apple.review.phone` is correct (currently **YOUR_REVIEW_PHONE**).

**App Store listing sync (EAS Metadata):** see **[eas-metadata.md](./eas-metadata.md)** — edit `store.config.json`, then `pnpm metadata:push` / `pnpm metadata:push:production`.

## iOS testing paths

| Path | Best for | Command |
| ---- | -------- | ------- |
| **Dev client** (recommended) | Daily testing on your iPhone with OTA JS updates | `pnpm build:development:ios` |
| **TestFlight** | Beta testers, pre-release QA | `pnpm build:preview:ios` then `eas submit --platform ios --profile preview` |
| **Simulator** | CI / quick UI checks | `eas build --profile simulator --platform ios` |

### Dev client (your iPhone)

1. Register device (once): `eas device:create` or [Expo Devices](https://expo.dev/accounts/YOUR_EXPO_ACCOUNT/projects/obytesapp/devices)
2. Build: `pnpm build:development:ios` (or GitHub Actions → **EAS QA Build** with iOS enabled)
3. Install the IPA from the EAS build page (open link in Safari on the device)
4. Start Metro: `pnpm start` — app loads JS from your machine or EAS Update on PRs

### TestFlight

1. Build preview IPA: `pnpm build:preview:ios`
2. Submit: `EXPO_PUBLIC_APP_ENV=preview eas submit --platform ios --profile preview --latest` (or `pnpm submit:preview:ios`)
3. After Apple processes the build, enable TestFlight testers in App Store Connect ([Preview app](https://appstoreconnect.apple.com/apps/YOUR_PREVIEW_ASC_APP_ID/testflight/ios))

## Submit the right build to the right ASC app

Three separate App Store Connect records — do not mix them up.

| EAS env | Bundle ID | ASC name | Apple ID (`ascAppId`) | Role |
|---------|-----------|----------|----------------------|------|
| `development` | `com.obytes.development` | ObytesApp Dev | `UNUSED_DEV_ASC_APP_ID` | Dev-client internal builds only |
| `preview` | `com.obytes.preview` | ObytesApp Preview | **`YOUR_PREVIEW_ASC_APP_ID`** | **QA / TestFlight** |
| `production` | `com.obytes` | ObytesApp | **`YOUR_PRODUCTION_ASC_APP_ID`** | App Store release |

Preview IPAs must go to **`YOUR_PREVIEW_ASC_APP_ID`**. Sending them to the development app (`UNUSED_DEV_ASC_APP_ID`) fails with error **90055** (*bundle identifier cannot be changed*).

`eas.json` submit profiles pin `ascAppId` + `bundleIdentifier` for both `preview` and `production`. `eas submit` still reads local `.env` by default — always pass the matching `EXPO_PUBLIC_APP_ENV` when submitting.

```sh
EXPO_PUBLIC_APP_ENV=preview eas submit --platform ios --profile preview --id <preview-build-id>
EXPO_PUBLIC_APP_ENV=production eas submit --platform ios --profile production --latest
```

**Screenshots:** Fastlane — [store-screenshots.md](./store-screenshots.md). Not in `store.config.json`.

## Apple team

EAS builds use your Apple team — set `YOUR_APPLE_TEAM_ID` in `eas.json` after `eas init`.
