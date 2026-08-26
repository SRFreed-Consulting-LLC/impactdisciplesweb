# Impact Disciples — Web

Public marketing/e-commerce site for Impact Disciples Ministries (Angular 20 + Firebase).

## Getting started

This repo has no git submodules — a normal clone is all you need. `npm install`
and pick an environment to run against:

```
npm run start-local   # local Firebase project config, http://localhost:4200
npm run start-emu     # Firebase emulator config,      http://localhost:4201
# Port rule: thousands digit = app (web 4, admin 5, reader 6), last digit =
# backend (0 = live dev data, 1 = emulator).
npm run start-dev     # impactdisciplesdev Firebase project
npm run start-prod    # impactdisciples-a82a8 (production) Firebase project, local serve
```

Runs on the Angular CLI default port 4200. `impactdisciples-admin` always runs
on 5200, so both dev servers can run side by side without a port clash.

## Architecture

- **`src/app/core/`** — the real application. Routes are grouped into lazy-loaded
  feature modules (`home.module.ts`, `events.module.ts`, `team.module.ts`,
  `store-feature.module.ts`, `content.module.ts`, `account.module.ts`,
  `blog.module.ts`, `summit.module.ts`) wired up in `app-routing.module.ts` via
  `loadChildren`. Each module declares only the components/DevExtreme modules
  its own routes need.
- **`src/app/shared/`** — components/services used across multiple feature
  modules and therefore loaded eagerly (imported into `AppModule`), notably
  `HomeHeaderComponent` (the global site header/nav, used on nearly every
  page despite the name) and `CartService`.
- **`src/assets/styles/theme/`** — the live site's actual CSS design system
  (originally sourced from a purchased "Outstock" Angular e-commerce
  template): a ~230 KB scss partial set (`main.scss` + friends) and the
  Font Awesome Pro/Ionicons font files it depends on. The template's
  *component* code (the actual unused `theme/` NgModule tree, ~260 files)
  was removed entirely — nothing routed to it — along with ~8 MB of dead
  demo images that shipped alongside these still-needed assets.
- **`src/app/common/`** — the Firebase data-access layer (`FirebaseDAO<T>` /
  `BaseService<T>`), domain models, and domain services (products, events,
  coaches, etc). This used to be a git submodule (`impactdisciplescommon`)
  shared with `impactdisciples-admin`; it was copied into this app directly
  (2026-08-09) to remove the submodule dependency entirely. **This means
  `impactdisciples-web` and `impactdisciples-admin` each now have their own
  independent copy of this code** — a fix made in one no longer
  automatically applies to the other. If you fix a bug here that also
  exists in `impactdisciples-admin`'s own copy of the same logic, port it
  over by hand. Only the 86 files this app actually imports (traced via its
  real import graph, not a blind copy of the whole former submodule) were
  brought over — see git history on this directory for exactly what moved
  and why.

## Environments

Four environment files under `src/environments/`, selected via Angular CLI
build configurations (`local`, `development`, `production`) and swapped via
`fileReplacements` in `angular.json`. Firebase project + Cloud Functions URLs
differ per environment; see the `environment.*.ts` files directly.

Cloud Functions consumed by this app live in the separate
`impactdisciples-admin/functions` repo (shared with the admin app) — not in
this repository.

## Build & deploy

```
npm run build-local / build-dev / build-prod
npm run build-deploy-dev    # builds + deploys to impactdisciplesdev hosting
npm run build-deploy-prod   # builds + deploys to impactdisciples-a82a8 hosting
```

## Code quality tooling

```
npm run lint           # ng lint (ESLint + angular-eslint)
npm run format          # Prettier --write
npm run format:check    # Prettier --check
```

Note: `ng lint` currently surfaces a large number of pre-existing issues
(this tooling was only added recently) — it is **not** wired into CI yet.
Two categories of rule are intentionally disabled in `eslint.config.js`
(`prefer-standalone`, `prefer-inject`, `template/prefer-control-flow`)
because this codebase is 100% NgModule-based with constructor injection
throughout; enforcing "adopt standalone components" as a per-file lint error
would just be noise until that migration is deliberately undertaken (see
Known technical debt below).

There is no test coverage yet — Karma/Jasmine are configured but no
`.spec.ts` files exist.

## Known technical debt

Tracked from an internal audit; sequenced roughly by effort, not skipped for
lack of importance:

- **Firestore rules** — no longer wide open (fixed 2026-08-17): the admin
  repo owns the one unified ruleset; this repo deploys hosting only.
- **No standalone components / `inject()`** — deliberate (see CLAUDE.md);
  the `@if`/`@for` control-flow migration IS done and enforced by lint.
- **`strictNullChecks`/`noImplicitAny` are disabled** in `tsconfig.json`
  despite `strict: true` being set — re-enabling surfaces ~900 compile
  errors across the codebase (measured, not yet fixed).
- **Zero test coverage.**
- **`tsconfig.json` (the base config) has no `include`/`files` restriction**,
  so a bare `tsc -p tsconfig.json --noEmit` type-checks every `.ts` file
  under the repo root rather than just the real import graph from
  `src/main.ts`. This used to produce false positives from unused files in
  the (now-removed) `impactdisciplescommon` submodule; with that gone there's
  currently nothing extra under the repo root for it to over-include, but
  prefer `tsc -p tsconfig.app.json --noEmit` for a manual sanity check anyway
  so this stays correct if that ever changes.
