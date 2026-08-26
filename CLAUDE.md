# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Public marketing/e-commerce site for Impact Disciples Ministries — Angular 20 + Firebase (Firestore, Cloud Functions, Hosting). Sibling repo `impactdisciples-admin` is the internal admin app (always runs on port 5200); Cloud Functions consumed by this app live in `impactdisciples-admin/functions`, not here.

## Commands

```
npm install
# LOCAL PORT RULE (2026-08-26): thousands digit = APP, last digit = BACKEND
#     web 4200 | admin 5200 | reader 6200   -> live data (impactdisciplesdev)
#     web 4201 | admin 5201 | reader 6201   -> Firebase emulator
# Ports live in APP_URLS / LOCAL_APP_URLS in the shared submodule
# (src/common/src/shared/config/firebase-projects.ts).
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

## Deploys — read before running any `build-deploy-*`

- **There is no `.github/` workflow in this repo** — deploys are manual via `npm run build-deploy-dev` / `build-deploy-prod`. The historic auto-deploy-on-`master` workflow (`firebase-hosting-merge.yml`) is gone along with the branch (below), so no push can trigger a prod deploy by itself any more.
- **`master` no longer exists** (deleted 2026-08-23, local and remote, along with every other merged branch). `development` is the only branch and is the GitHub default. Master's five commits were merge bubbles from past `development` → `master` merges and held no unique work. Deploys go straight from `development`; there is no branch to merge to and nothing to keep in sync. The 44 `concept/*`, `layout/*`, `pathway/*`, `redesign/*` and `refined/*` design-exploration branches were deliberately KEPT — they are local-only and unmerged.
- **`development` was cut over to production wholesale on 2026-08-23 ("go live")**: functions + indexes, then admin/reader/web hosting, then rules. Everything on `development` shipped with it — Campaign Offers v3, the Store > Sales retirement, the podcasts rework, the firebase-admin 14 bump, and the new public Impact Group finder. A full `npm run backup:prod` snapshot was taken first (`impactdisciples - admin/scripts/backups/impactdisciples-a82a8-2026-08-23T20-14-57Z`). **prod == `development` as of that date** — the old "never assume master == prod" caveat is retired.
- Prod deploys were previously on hold (a DevExpress licensing issue in the shared `impactdisciples-admin` dependency; this repo has zero DevExpress dependency, so it was cross-repo caution rather than a build blocker here). That hold is over: the 2026-08-17 relaunch lifted it once, and the 2026-08-23 cutover was a deliberate full release. Still confirm intent before `build-deploy-prod` — it publishes whatever is on `development`, immediately.
- `firebase.json` hosting targets: `production` → `impactdisciples-a82a8`, `development` → `impactdisciplesdev`. `.firebaserc` maps these target names to project IDs.

## Architecture

- **`src/app/core/`** — the real application. Routes are grouped into lazy-loaded feature modules (`home.module.ts`, `events.module.ts`, `team.module.ts`, `store-feature.module.ts`, `content.module.ts`, `blog.module.ts`, `summit.module.ts`), wired up in `app-routing.module.ts`.
- **Routing uses custom `UrlMatcher`s, not `path: ''`.** With sibling lazy routes all on `path: ''`, the router has to `import()` and inspect each lazy module in array order until one's children match — so navigating to a route late in the array silently loaded every module before it first. `firstSegmentMatcher()` in `app-routing.module.ts` checks the URL's first path segment synchronously instead, so only the module that actually owns the route ever loads. **When adding a new top-level route, add its first path segment to the relevant module's matcher array** — don't add a plain `path:` route to `app-routing.module.ts`, it reintroduces the eager-loading bug.

- **Impact Groups finder** (`src/app/core/groups/`, 2026-08-23) — the public, signed-out way to find an Impact Group: `/impact-groups` (search + filters) and `/impact-groups/:groupId` (a shareable public page per group), plus an `<app-group-strip>` of "groups studying this book" on the store product page.
  - **Discovery only.** Joining and creating both deep-link into the reader app (`environment.readerAppOrigin`). `impactdisciples-admin/firestore.rules` gates every `discussionGroups` read behind `signedIn()` and this app has no Firebase Auth at all, so there is deliberately no membership write path here — and adding one would mean adding auth first.
  - Reads go through the `search_impact_groups` HTTP function (`environment.searchImpactGroupsUrl`) via `CloudFunctionsClient`, **not** through `FirebaseDAO`/`BaseService` — a direct Firestore query would fail for every visitor. That function returns a deliberately narrow projection: never `onlineInfo` (it holds meeting links and passwords), never member data, never an address the leader chose to hide, and the leader reduced to "Matthew F.".
  - `GroupCardComponent`/`GroupStripComponent` live in `groups-shared.module.ts`, imported by BOTH `groups-feature.module.ts` and `store-feature.module.ts` — a component may only be declared once, and both lazy modules need the card.
  - Named "impact-groups", not "groups": `/equipping-groups` (a marketing page for the Kajabi-hosted program) already owns that word here, and the reader/admin apps already say "Impact Groups". They are different things — don't conflate them.
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
