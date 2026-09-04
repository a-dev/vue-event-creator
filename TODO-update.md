# Version 2 modernization plan

Status: proposed v2 plan; no migration steps in this file have been implemented.

## Version 2 decisions

- Publish `vue-event-creator@2.0.0` as ESM only.
- Set `type: "module"` and expose the package through `exports`.
- Build only Vite's `es` library format; do not emit UMD or CommonJS.
- Remove `main`, `module`, and `unpkg` rather than preserving legacy resolution.
- Support `import VueEventCreator from 'vue-event-creator'` and an explicit CSS
  subpath such as `vue-event-creator/style.css`.
- Treat callback typing, event identity, locale scoping, and error-contract fixes
  as intentional v2 changes, documented in a v1-to-v2 migration guide.

## Target baseline

As of 2026-09-04, Vue 3.5.42 and Vite 8.2.2 in the working tree are the latest
stable releases. Vitest 5 has just been released and requires Node 22.12 or
newer. Use matched Vitest 5 packages rather than mixing major versions.

Target development dependencies:

- `vite@^8` and `@vitejs/plugin-vue@^6`;
- `vue@^3.5` plus matching `@vue/compiler-sfc`;
- `vitest@^5`, `@vitest/browser-playwright@^5`, and
  `@vitest/coverage-v8@^5`;
- `@vue/test-utils@^2.5` for low-level component mounting;
- `@playwright/test@^1.62` for end-to-end journeys;
- `vue-tsc@^3.3` with a compatible TypeScript compiler;
- Oxlint and Oxfmt as development-only tools.

TypeScript 7 is installed, but `vue-tsc` currently depends on the TypeScript
JavaScript compiler API and cannot run against it. Until Vue language tools add
native TypeScript 7 support, alias the maintained TypeScript 6 compiler package
as `typescript` (for example,
`typescript: "npm:@typescript/typescript6@^6.0.2"`). Revisit TypeScript 7 in a
separate upgrade rather than weakening type-checking.

## Phase 0 — Freeze and make the baseline reproducible

- [ ] Preserve or commit the existing Bun/Oxlint/Oxfmt dependency update as its
      own change before starting the test migration.
- [ ] Add `packageManager: "bun@1.3.14"` and `engines.node: ">=22.12.0"`.
- [ ] Keep only `bun.lock`; remove Yarn assumptions from scripts and CI.
- [ ] Move `oxlint` and `oxfmt` from `dependencies` to `devDependencies`.
- [ ] Pin the TypeScript 6 compatibility alias and prove `vue-tsc --noEmit`
      starts before changing source types.
- [ ] Add scripts for `typecheck`, `lint`, `format`, and `format:check`.
- [ ] Scope lint/format to authored files and exclude `dist`, `coverage`,
      Playwright reports, test results, and generated `docs/assets`.

Acceptance: a clean install is deterministic, type-check reaches source code,
and checks no longer process generated bundles.

## Phase 1 — Repair the npm package contract

- [ ] Replace the declaration-only `src/index.d.ts` with a real `src/index.ts`
      public entry that default-exports the component and exports public API types.
- [ ] Separate consumer types from internal calendar state types. Make callback
      props generic over consumer event data and avoid bare `Function`, `object`, and
      `any` types.
- [ ] Point Vite library mode at `src/index.ts`, set `formats: ['es']`, and choose
      a stable ESM filename such as `dist/index.js`.
- [ ] Generate declarations into `dist` with
      `vue-tsc --declaration --emitDeclarationOnly` or a compatible Vue declaration
      plugin.
- [ ] Choose one CSS subpath, set `build.lib.cssFileName` to emit it, and use that
      exact path in `package.json` and `README.md`.
- [ ] Add `type: "module"` and an ESM-only `exports` map with root `types` and
      `import` conditions plus a CSS subpath.
- [ ] Remove `main`, `module`, and `unpkg`; do not publish `require`, UMD, or CJS
      conditions.
- [ ] Add `sideEffects` metadata for CSS and confirm Vue remains external and a
      peer dependency. Keep Day.js as the only runtime dependency unless it is
      deliberately bundled.
- [ ] Reduce `files` to the built artifact and required documentation; no package
      field may point back into excluded `src`.
- [ ] Add `prepack` or `prepublishOnly` to run the release gate.
- [ ] Add `publint`, `attw --pack .`, and `npm pack --dry-run` checks.
- [ ] Create a tiny TypeScript/Vite ESM consumer fixture that installs the
      produced tarball and imports the default component, public types, and CSS.
- [ ] Run `attw --pack . --profile esm-only` and document that CommonJS
      `require()` has no compatibility guarantee.

Acceptance: all declared paths exist in the tarball, ESM imports load, types
resolve under supported ESM/bundler resolution modes, no CJS/UMD artifact is
published, and the packed ESM consumer builds.

## Phase 2 — Replace Jest with Vitest

- [ ] Add `vitest.config.ts` with two explicit projects:
  - `unit`: Node environment for date and state-transition modules;
  - `browser`: Playwright provider, headless Chromium in CI, for Vue components
    and real DOM/browser behavior.
- [ ] Load `@vitejs/plugin-vue` in the Vitest config. Set `TZ=UTC` in the test
      command or setup where deterministic date snapshots require it.
- [ ] Convert Jest globals/imports to Vitest (`jest` to `vi`) and remove Jest-only
      transforms; Vitest/Vite compiles Vue SFCs directly.
- [ ] Fix ineffective assertions such as `.toBeTruthy`/`.toBeFalsy` without
      parentheses before treating migrated coverage as trustworthy.
- [ ] Build fresh wrappers, refs, and calendar state in `beforeEach`; remove
      describe-scoped mutable fixtures and order-dependent tests.
- [ ] Make every async trigger/callback observable with awaited DOM assertions,
      not extra sleeps.
- [ ] Move component suites to browser mode incrementally: `Day`, `Month`,
      `Calendar`, `Event`, `Events`, localization, then the public component.
- [ ] In browser tests, use real `userEvent`/locator interaction for clicks,
      keyboard use, input values, focus, outside-click handling, and scroll behavior.
- [ ] Add tests for callback rejection, ID `0`, invalid/reversed dates, overlap,
      multiple differently localized instances, prop updates, unmount cleanup, and
      consumer input immutability.
- [ ] Add V8 coverage after both projects are green. Start by recording the
      baseline; raise thresholds only with meaningful branch tests.
- [ ] Remove `jest`, `ts-jest`, `babel-jest`, `@vue/vue3-jest`,
      `jest-environment-jsdom`, `jest-transform-stub`, `@types/jest`, and
      `jest.config.js` in the same migration.

Suggested scripts after migration:

```json
{
  "test": "vitest run",
  "test:unit": "vitest run --project unit",
  "test:browser": "vitest run --project browser",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

Acceptance: all legacy behavior is represented by effective assertions, Node and
Chromium projects pass independently, and no Jest/Babel transform stack remains.

## Phase 3 — Add Playwright end-to-end tests

- [ ] Add `playwright.config.ts` and `tests/e2e`. Configure `webServer` to build
      and preview a deterministic test/demo app with a fixed `baseURL`.
- [ ] Make demo data deterministic under test: fixed clock, stable IDs, and
      injectable success/failure callbacks. Avoid random placement and one-second
      waits in E2E mode.
- [ ] Cover these user journeys:
  - initial load and existing event rendering;
  - one-day and multi-day event creation;
  - custom event-data editing and successful save;
  - save validation/rejection with preserved input and retry;
  - cancel editing;
  - saved-event confirmation and draft removal;
  - adding months, focusing an event from a calendar day, and locale switching;
  - responsive calendar/event-list switcher;
  - keyboard-only creation and editing after accessibility fixes.
- [ ] Run the core suite on Chromium for each pull request. Add Firefox and
      WebKit to scheduled/release CI first, then promote them when stable.
- [ ] Add a separate packed ESM-consumer smoke journey so E2E catches missing
      exports, types, CSS, or runtime dependencies.
- [ ] Retain traces on first retry and screenshots/videos only on failure.

Acceptance: the demo and packed package both complete the critical create/edit/
save/remove journey in a real browser.

## Phase 4 — Rebuild CI around release gates

- [ ] Trigger CI for `main` and pull requests; remove obsolete `master` and
      `develop` filters unless those branches are intentionally restored.
- [ ] Use current checkout/setup actions, install the pinned Bun version, and run
      `bun install --frozen-lockfile`.
- [ ] Install the Chromium binary/dependencies required by the shared Playwright
      provider.
- [ ] Gate in this order: format check, lint, type-check, unit tests, browser
      tests, build, package lint/types, packed-consumer build, Playwright E2E.
- [ ] Split fast static/unit checks from browser/package jobs and upload reports
      only on failure.
- [ ] Add a release workflow with npm provenance and protected npm publishing
      credentials only after ordinary CI is stable.

Acceptance: CI executes on the actual default branch with the same package
manager and commands used locally; publication cannot bypass the full gate.

## Phase 5 — Runtime and documentation cleanup

- [ ] Implement the P1 findings in `TODO-review.md` behind regression tests.
- [ ] Scope locale/date services per instance and make supported prop changes
      reactive.
- [ ] Replace document-body listener management with lifecycle-aware composables.
- [ ] Use native accessible controls and labels; verify with browser and E2E
      keyboard tests.
- [ ] Remove obsolete ESLint/Prettier dependencies and `.eslintrc.js` after the
      Oxlint/Oxfmt migration is complete.
- [ ] Rewrite README examples against the generated public types and actual CSS
      export. Correct outdated demo copy and callback examples.
- [ ] Document Node/browser support, time-zone semantics, overlap constraints,
      and the release process.
- [ ] Add a `MIGRATION.md` section covering ESM-only imports, removal of
      `require()`/UMD/script-tag usage, the CSS subpath, callback contracts, public
      types, event identity, locale behavior, and error handling.
- [ ] Add a `2.0.0` changelog entry that clearly labels all intentional breaking
      changes.

## Suggested commit sequence

1. `chore: make Bun and TypeScript baseline reproducible`
2. `feat!: publish an ESM-only v2 package entry`
3. `test: migrate pure unit tests from Jest to Vitest`
4. `test: run Vue component tests in Vitest browser mode`
5. `test: add Playwright consumer journeys`
6. `ci: enforce build, test, and package release gates`
7. Small runtime fixes, one reviewed behavior change per commit.
8. `docs: add the v2 migration guide and align public documentation`

## References

- [Vite library mode and CSS exports](https://vite.dev/guide/build.html#library-mode)
- [Vite 8 requirements](https://vite.dev/blog/announcing-vite8)
- [Vitest browser mode](https://vitest.dev/guide/browser/)
- [Vitest 5 announcement and requirements](https://vitest.dev/blog/vitest-5)
- [Playwright web server configuration](https://playwright.dev/docs/test-webserver)
- [Playwright test configuration](https://playwright.dev/docs/test-configuration)
- [Vue Test Utils installation](https://test-utils.vuejs.org/installation/)
- [TypeScript 7 compatibility guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [npm package fields](https://docs.npmjs.com/files/package.json/)
- [publint](https://publint.dev/docs/)
- [Are the Types Wrong CLI](https://www.npmjs.com/package/@arethetypeswrong/cli)
