# Impact Disciples — Web

Public marketing/e-commerce site for Impact Disciples Ministries (Angular 20 + Firebase).

## Getting started

This repo uses **git submodules** for shared domain code — clone with:

```
git clone --recurse-submodules <repo-url>
```

or, if already cloned:

```
npm run init-git-submodules
```

Then `npm install` and pick an environment to run against:

```
npm run start-local   # local Firebase project config, http://localhost:4200
npm run start-dev     # impactdisciplesdev Firebase project
npm run start-prod    # impactdisciples-a82a8 (production) Firebase project, local serve
```

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
- **`impactdisciplescommon`** (submodule) — shared Firebase data-access layer
  (`FirebaseDAO<T>` / `BaseService<T>`) and domain models/services, shared
  with the `impactdisciples-admin` app. Changes here affect both apps —
  verify against a checkout of `impactdisciples-admin` before committing.

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

- **Firestore rules are wide open** (`allow read, write: if true`) —
  the single highest-priority item, not yet addressed.
- **No standalone components / new control-flow syntax** — a deliberate,
  large migration, not started.
- **`strictNullChecks`/`noImplicitAny` are disabled** in `tsconfig.json`
  despite `strict: true` being set — re-enabling surfaces ~900 compile
  errors across the codebase (measured, not yet fixed).
- **Zero test coverage.**
- **`tsconfig.json` (the base config) has no `include`/`files` restriction**,
  so a bare `tsc -p tsconfig.json --noEmit` type-checks every `.ts` file
  under the repo root -- including unused files in the `impactdisciplescommon`
  submodule that this app never actually imports (e.g. admin-only services).
  The real build (`ng build`, via `tsconfig.app.json`) correctly scopes to
  the real import graph from `src/main.ts` and is unaffected -- but a quick
  manual sanity check should use `tsc -p tsconfig.app.json --noEmit`, not
  the base config, or it'll report false positives.
