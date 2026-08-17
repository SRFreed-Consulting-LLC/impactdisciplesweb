# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Public marketing/e-commerce site for Impact Disciples Ministries — Angular 20 + Firebase (Firestore, Cloud Functions, Hosting). Sibling repo `impactdisciples-admin` is the internal admin app (always runs on port 5200); Cloud Functions consumed by this app live in `impactdisciples-admin/functions`, not here.

## Commands

```
npm install
npm run start-local          # local Firebase project config, http://localhost:4200
npm run start-dev            # impactdisciplesdev Firebase project
npm run start-prod           # impactdisciples-a82a8 (production) Firebase project, local serve

npm run build-local / build-dev / build-prod
npm run build-deploy-dev     # builds + deploys to impactdisciplesdev hosting
npm run build-deploy-prod    # builds + deploys to impactdisciples-a82a8 hosting

npm run lint                 # ng lint (ESLint + angular-eslint) — not wired into CI
npm run format                # Prettier --write "src/**/*.{ts,html,scss}"
npm run format:check

npm run e2e                  # Playwright, against an already-running start-local server
```

- No `.spec.ts` files exist yet (Karma/Jasmine are configured but unused) — there is no unit test command to run.
- Playwright (`e2e/`) is a read-only smoke suite: it assumes `npm run start-local` is already running on :4200 and asserts against real `impactdisciplesdev` data (never production, never an emulator). It does **not** auto-start the dev server (see comment in `playwright.config.ts`). To run a single spec: `npx playwright test e2e/smoke.spec.ts -g "some test name"`.
- `npm run lint` currently surfaces many pre-existing issues; don't treat a large pre-existing count as something to fix opportunistically.
- Manual full type-check: `tsc -p tsconfig.app.json --noEmit` (not the bare `tsconfig.json`, which has no `include` restriction and type-checks stray files under the repo root too).

## Deploys — read before merging or running any `build-deploy-*` / push to `master`

- **`.github/workflows/firebase-hosting-merge.yml` auto-deploys to production** (`impactdisciples-a82a8`) on every push to `master`. Merging to `master` *is* a prod deploy, not just a build step.
- Prod deploys were on hold for a period (DevExpress licensing issue affecting the shared `impactdisciples-admin` dependency — this repo itself has zero DevExpress dependency, the hold was a cross-repo caution, not a build blocker here). That hold was explicitly lifted by the user for the **2026-08-17 relaunch**: the rewritten store/cart/checkout and most other pages are now what `impactdisciples.com` actually serves. Still confirm before merging to `master` or running `build-deploy-prod` for anything beyond routine changes — this was a one-off go-ahead, not a standing blanket lift.
- **The 2026-08-17 relaunch deployed directly via `firebase deploy --only hosting:production` from `development`, not via a `master` merge** — `master` was deliberately left untouched to avoid triggering the GitHub Action mid-verification. **`master` is now stale relative to what's actually live in prod** (it still reflects the pre-rewrite app). Don't assume `master` == prod; check `development`'s deploy history instead. A future merge of `development` → `master` will be a large diff, not a routine sync.
- `firebase.json` hosting targets: `production` → `impactdisciples-a82a8`, `development` → `impactdisciplesdev`. `.firebaserc` maps these target names to project IDs.

## Architecture

- **`src/app/core/`** — the real application. Routes are grouped into lazy-loaded feature modules (`home.module.ts`, `events.module.ts`, `team.module.ts`, `store-feature.module.ts`, `content.module.ts`, `account.module.ts`, `blog.module.ts`, `summit.module.ts`), wired up in `app-routing.module.ts`.
- **Routing uses custom `UrlMatcher`s, not `path: ''`.** With sibling lazy routes all on `path: ''`, the router has to `import()` and inspect each lazy module in array order until one's children match — so navigating to a route late in the array silently loaded every module before it first. `firstSegmentMatcher()` in `app-routing.module.ts` checks the URL's first path segment synchronously instead, so only the module that actually owns the route ever loads. **When adding a new top-level route, add its first path segment to the relevant module's matcher array** — don't add a plain `path:` route to `app-routing.module.ts`, it reintroduces the eager-loading bug.
- **`src/app/shared/`** — components/services used across multiple feature modules and therefore loaded eagerly via `AppModule`, notably `HomeHeaderComponent` (the global site header/nav — used on nearly every page despite the name) and `CartService`.
- **`src/app/common/`** — the Firebase data-access layer, domain models, and domain services (products, events, coaches, etc). Formerly a git submodule (`impactdisciplescommon`) shared with `impactdisciples-admin`; copied directly into this app (2026-08-09), so **`impactdisciples-admin` now has its own independent copy of the same code** — a fix here does not propagate there automatically. Port matching fixes over by hand when relevant.
  - `common/dao/firebase.dao.ts` — generic `FirebaseDAO<T extends BaseModel>` wrapping Firestore reads/writes/streams (`getAll`, `queryByValue`, `streamByValue`, etc.), used by domain services under `common/services/data/*.service.ts`. Stream methods swallow/log Firestore errors via `catchError` and fall back to `of([])` rather than leaving an observable silently stuck — follow that pattern for new stream methods rather than letting errors propagate unhandled.
- **`src/assets/styles/theme/`** — the live site's CSS design system (sourced from a purchased "Outstock" Angular e-commerce template): a large scss partial set (`main.scss` + friends) plus Font Awesome Pro/Ionicons fonts. The template's own component tree was removed entirely (nothing routed to it) — only the still-needed CSS/fonts remain.
- **Environments**: `src/environments/environment.{local,development,production}.ts`, swapped via `fileReplacements` per Angular CLI build configuration (`angular.json`). Each carries its own Firebase project config and Cloud Functions URLs (Stripe, shipping, YouTube keys, unsubscribe, etc) — check the right file when tracing a URL or config value, don't assume `environment.ts` (the dev default) applies in prod.

## Conventions

- **100% NgModule-based with constructor injection** — no standalone components, no `inject()`. This is deliberate (see Known technical debt); don't introduce standalone components/`inject()` in new code without discussing it first, and don't "fix" `@angular-eslint/prefer-standalone`/`prefer-inject` warnings — both are turned off in `eslint.config.js` for exactly this reason.
- **New template control-flow syntax (`@if`/`@for`/`@switch`) is required** — the codebase-wide migration off `*ngIf`/`*ngFor`/`*ngSwitch` is done and `@angular-eslint/template/prefer-control-flow` is enforced; write new templates with the new syntax.
- `strictNullChecks`/`noImplicitAny` are disabled in `tsconfig.json` despite `strict: true` — re-enabling surfaces ~900 pre-existing compile errors. Don't rely on null-checking catching bugs in this codebase; be explicit about null/undefined handling in new code anyway.
- **Firestore rules are not owned by this repo.** As of `0983ea8` ("Phase 7" of a rules-consolidation effort), this repo's own `firestore.rules`/`firestore.indexes.json` and `firebase.json` firestore block were deleted — `impactdisciples-admin`'s `firestore.rules` is now the sole ruleset for the shared (default) Firestore database, and only `hosting` targets deploy from here. The rules are **not** wide open (that was true historically, it no longer is) — most collections are public-read/staff-write, and `purchases`/`pending_orders`/`coupons` block client writes entirely. Check `impactdisciples-admin/firestore.rules` directly for the real, current state rather than assuming from this repo.
