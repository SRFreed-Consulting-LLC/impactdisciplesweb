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

- Unit tests: Karma/Jasmine, ~87 specs (pure logic/services + a few component-class specs, no TestBed) — `npx ng test --watch=false --browsers=ChromeHeadless` runs them headless in ~1 min. The shared submodule's own specs are excluded from this app's Karma target (they run in the admin/reader suites).
- Playwright (`e2e/`) is a read-only smoke suite: it assumes `npm run start-local` is already running on :4200 and asserts against real `impactdisciplesdev` data (never production, never an emulator). It does **not** auto-start the dev server (see comment in `playwright.config.ts`). To run a single spec: `npx playwright test e2e/smoke.spec.ts -g "some test name"`.
- `npm run lint` currently surfaces many pre-existing issues; don't treat a large pre-existing count as something to fix opportunistically.
- Manual full type-check: `tsc -p tsconfig.app.json --noEmit` (not the bare `tsconfig.json`, which has no `include` restriction and type-checks stray files under the repo root too).

## Deploys — read before merging or running any `build-deploy-*` / push to `master`

- **There is no `.github/` workflow in this repo's `development` checkout** — deploys are manual via `npm run build-deploy-dev` / `build-deploy-prod`. An auto-deploy-on-`master` workflow (`firebase-hosting-merge.yml`) was documented historically and may still exist on `master`; verify before relying on or merging into `master` — treat a `master` push as a possible prod deploy either way.
- Prod deploys were on hold for a period (DevExpress licensing issue affecting the shared `impactdisciples-admin` dependency — this repo itself has zero DevExpress dependency, the hold was a cross-repo caution, not a build blocker here). That hold was explicitly lifted by the user for the **2026-08-17 relaunch**: the rewritten store/cart/checkout and most other pages are now what `impactdisciples.com` actually serves. Still confirm before merging to `master` or running `build-deploy-prod` for anything beyond routine changes — this was a one-off go-ahead, not a standing blanket lift.
- **The 2026-08-17 relaunch deployed directly via `firebase deploy --only hosting:production` from `development`, not via a `master` merge** — `master` was deliberately left untouched to avoid triggering the GitHub Action mid-verification. **`master` is now stale relative to what's actually live in prod** (it still reflects the pre-rewrite app). Don't assume `master` == prod; check `development`'s deploy history instead. A future merge of `development` → `master` will be a large diff, not a routine sync.
- `firebase.json` hosting targets: `production` → `impactdisciples-a82a8`, `development` → `impactdisciplesdev`. `.firebaserc` maps these target names to project IDs.

## Architecture

- **`src/app/core/`** — the real application. Routes are grouped into lazy-loaded feature modules (`home.module.ts`, `events.module.ts`, `team.module.ts`, `store-feature.module.ts`, `content.module.ts`, `blog.module.ts`, `summit.module.ts`), wired up in `app-routing.module.ts`.
- **Routing uses custom `UrlMatcher`s, not `path: ''`.** With sibling lazy routes all on `path: ''`, the router has to `import()` and inspect each lazy module in array order until one's children match — so navigating to a route late in the array silently loaded every module before it first. `firstSegmentMatcher()` in `app-routing.module.ts` checks the URL's first path segment synchronously instead, so only the module that actually owns the route ever loads. **When adding a new top-level route, add its first path segment to the relevant module's matcher array** — don't add a plain `path:` route to `app-routing.module.ts`, it reintroduces the eager-loading bug.
- **`src/app/shared/`** — components/services used across multiple feature modules and therefore loaded eagerly via `AppModule`, notably `HomeHeaderComponent` (the global site header/nav — used on nearly every page despite the name) and `CartService`.
- **`src/common/` (git submodule `impact-discipleship-library-common`, aliased `@impact-common/*`)** — shared with the admin and reader apps since 2026-08-20 (Stage 2 of the refactor sweep). Its `src/shared/` slice holds what this app and admin used to hand-copy: the domain models (`models/**` — product, coupon, event, event-registration, cart/`CheckoutForm`, form-*, web-config, ...), the enums (`lists/*`), `utils/date-from-timestamp` (`toMillis`), `config/firebase-projects` (project configs + `functionUrl()`, consumed by every environment file) and `contract/*` (the Cloud Functions name contract + request/response types). Lint-ignored here, its specs excluded from this Karma target. Editing shared code = commit in the submodule, push IT first, then bump the pointer here (and in admin/reader).
- **`src/app/common/`** — what stays app-local: the Firebase data-access layer (`dao/firebase.dao.ts`, `services/data/base.service.ts` + the per-collection services) and the web-only models (`customer`, `subscription`, `pager`, `schedule`, `nav-menu`). The admin repo has its own DAO/service copies of the same shape — those have drifted and are a later consolidation (Stage 3).
  - `common/dao/firebase.dao.ts` — generic `FirebaseDAO<T extends BaseModel>` wrapping Firestore reads/writes/streams (`getAll`, `queryByValue`, `streamByValue`, etc.), used by domain services under `common/services/data/*.service.ts`. Stream methods swallow/log Firestore errors via `catchError` and fall back to `of([])` rather than leaving an observable silently stuck — follow that pattern for new stream methods rather than letting errors propagate unhandled.
- **`src/assets/styles/theme/`** — the live site's CSS design system (sourced from a purchased "Outstock" Angular e-commerce template): a large scss partial set (`main.scss` + friends) plus Font Awesome Pro/Ionicons fonts. The template's own component tree was removed entirely (nothing routed to it) — only the still-needed CSS/fonts remain.
- **Monthly Newsletter page** (`core/pages/monthly-newsletter/`, 2026-08-20): reads the admin-curated public archive through the admin repo's `newsletter_archive` Cloud Function (`environment.newsletterArchiveUrl`; `NewsletterArchiveService` is plain `fetch`, no Firestore) and renders each issue on `/monthly-newsletter/:id` in a sandboxed `srcdoc` iframe (no `allow-scripts`). The old `monthly-newsletter` Firestore collection of mailchi.mp links is retired and its rules removed — the function is the ONLY public read path onto `campaign_emails`, and the admin's `impactdisciples-admin/MIGRATION.md` has the deploy order (function + index first, then web, then rules).
- **Environments**: `src/environments/environment.{local,development,production}.ts`, swapped via `fileReplacements` per Angular CLI build configuration (`angular.json`). Each carries its own Firebase project config and Cloud Functions URLs (shipping, YouTube keys, unsubscribe, etc) — check the right file when tracing a URL or config value, don't assume `environment.ts` (the dev default) applies in prod.

## Conventions

- **100% NgModule-based with constructor injection** — no standalone components, no `inject()`. This is deliberate (see Known technical debt); don't introduce standalone components/`inject()` in new code without discussing it first, and don't "fix" `@angular-eslint/prefer-standalone`/`prefer-inject` warnings — both are turned off in `eslint.config.js` for exactly this reason.
- **New template control-flow syntax (`@if`/`@for`/`@switch`) is required** — the codebase-wide migration off `*ngIf`/`*ngFor`/`*ngSwitch` is done and `@angular-eslint/template/prefer-control-flow` is enforced; write new templates with the new syntax.
- `strictNullChecks`/`noImplicitAny` are disabled in `tsconfig.json` despite `strict: true` — re-enabling surfaces ~900 pre-existing compile errors. Don't rely on null-checking catching bugs in this codebase; be explicit about null/undefined handling in new code anyway.
- **Firestore rules are not owned by this repo.** As of `0983ea8` ("Phase 7" of a rules-consolidation effort), this repo's own `firestore.rules`/`firestore.indexes.json` and `firebase.json` firestore block were deleted — `impactdisciples-admin`'s `firestore.rules` is now the sole ruleset for the shared (default) Firestore database, and only `hosting` targets deploy from here. The rules are **not** wide open (that was true historically, it no longer is) — most collections are public-read/staff-write, and `purchases`/`pending_orders`/`coupons` block client writes entirely. Check `impactdisciples-admin/firestore.rules` directly for the real, current state rather than assuming from this repo.
