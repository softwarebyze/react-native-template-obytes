# Template sync (generated-app self-PR)
Apps from this fork ship a watcher that opens a PR on that app when the fork updates. No central bot. Never auto-merges.
## How to scaffold from this fork
Replace placeholders after clone: EAS ids, bundle ids, listing copy.
Or run the in-repo CLI from a checkout of this fork.

## What the watcher does
Workflow: .github/workflows/sync-from-template.yml. Weekdays 9am Eastern plus workflow_dispatch.
Runs only on generated apps, not on the template repo. Template uses sync-upstream.yml to PR Obytes master.
Each run copies owned globs, skips app-owned paths (never whole package.json), applies pins, opens chore/sync-template. Never auto-merges.

## Owned vs app-owned
Owned: CI, compose script, confirm/nav helpers, knip/eslint, Fastlane, playbook, this file.
App-owned: src/app, src/features, assets, env.ts, app.config.ts, store.config.json, package.json, listing copy, EAS ids, docs/marketing.
