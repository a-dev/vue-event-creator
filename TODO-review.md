# Current-state code review and improvement plan

Reviewed: 2026-09-04, current working tree on `chores/revive`.

Scope: source, demo, tests, build/package metadata, generated package contents,
and CI. This is a repository snapshot review, not a diff review. Existing staged
Bun/Oxlint/Oxfmt and dependency changes are treated as user-owned work. Fixes are
planned for an ESM-only `2.0.0`; v1 module-format compatibility is not a goal.

## Verification snapshot

| Check                                   | Result                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `bun run build`                         | Passes; Vite warns that the TS config is ESM in a CommonJS package context.                                         |
| `bun run test --runInBand`              | Fails; 10/10 suites stop before test collection because TypeScript 7 is incompatible with `ts-jest`.                |
| `bunx vue-tsc --noEmit`                 | Fails before checking source because `vue-tsc` expects a TypeScript compiler API path not exported by TypeScript 7. |
| `bunx oxlint .`                         | Fails; generated `docs/assets` dominates the output, plus authored-source/test findings.                            |
| `bunx oxfmt --check .`                  | Fails on 44 legacy-authored/generated files.                                                                        |
| `npm pack --dry-run --json` after build | Produces seven files; JS and CSS are present, but declarations are absent.                                          |

## P1 — Release and correctness blockers

### R1. The published TypeScript entry does not exist in the tarball

Evidence: `package.json:8,20-25`, `src/index.d.ts:1-61`.

`types` points to `./src/index.d.ts`, but `files` includes only `/dist` and
documentation. The dry-run tarball has no declaration file. Even if included,
the declaration file exports data types but does not declare the package's
default Vue component. It also imports internal types (`VecDayOptions` and
`VecFocusedEventState`) elsewhere without exporting them.

Impact: TypeScript consumers cannot resolve or correctly type the documented
default import. A successful Vite build hides this because Vite only transpiles.

Plan: create one typed ESM source entry, generate declarations into `dist`, point
an ESM-only exports map at them, and validate the packed artifact with
`attw --profile esm-only` plus an ESM consumer fixture.

### R2. The documented and declared CSS entry is missing

Evidence: `package.json:11`, `README.md` installation example,
`vite.config.ts:9-13`.

The package declares `./dist/styles.css`; Vite 8 emits
`./dist/vue-event-creator.css`. The dry-run tarball confirms only the latter.

Impact: consumers following package metadata or README get a missing-module
error and an unstyled component.

Plan: choose one stable CSS subpath, set `build.lib.cssFileName`, expose it in
`exports`, and smoke-test that exact import from the tarball.

### R3. Test and type-check dependency majors are incompatible

Evidence: `package.json:41-69`, `jest.config.js:1-17`.

Jest 30 is combined with `@vue/vue3-jest`/`ts-jest` 29 and TypeScript 7.
`vue-tsc` 3.3 also cannot use the TypeScript 7 compiler API. No tests or Vue
type-checks currently execute.

Impact: dependency updates can ship despite runtime/type regressions.

Plan: temporarily use the TypeScript 6 compatibility package, migrate Jest to
matched Vitest 5 packages, and make type-check/test required gates.

### R4. CI targets obsolete branches and a deleted package manager

Evidence: `.github/workflows/ci.yml:3-25`, staged `bun.lock`/deleted `yarn.lock`.

CI watches `master` and `develop`, while the default branch is `main`; it caches,
installs, and tests with Yarn even though the migration selects Bun. It does not
build, type-check, lint, inspect the package, or run browsers.

Impact: the default branch and npm release artifact have no effective automated
protection.

Plan: rebuild CI as described in `TODO-update.md`, with `main`, Bun, browser
installation, and package gates.

### R5. Several tests contain assertions that never execute

Evidence: `tests/unit/Day.spec.ts:31,59,90,119,150,158,165-167,197,200` and
`tests/unit/Event.spec.ts:150`.

Matchers such as `.toBeTruthy` and `.toBeFalsy` are referenced without `()`, and
one `.toBeUndefined` is also referenced without calling it. These expressions
pass without asserting. Several suites also create wrappers/state at describe
scope (`tests/unit/Events.spec.ts:12-48`,
`tests/unit/useEventActions.spec.ts:47-68`), making later tests depend on earlier
mutations.

Impact: historical green results overstate coverage and may change with test
ordering.

Plan: fix assertions first, create fixtures per test, then migrate behavior to
Vitest. Confirm that deliberately breaking each behavior makes its test fail.

### R6. Locale is global rather than component-scoped

Evidence: `src/locales/index.ts:7-29`, `src/lib/dayjs.ts:6-10`,
`src/VueEventCreator.vue:97-98`, `README.md:9`.

Every mount mutates the same translator and Day.js global locale. Mounting an
English and Russian calendar together makes whichever mounted last control both.
The `language` prop is not watched; the demo works around this by remounting with
a key. The README also advertises custom localization, but the public locale type
and message map accept only `en`, `es`, and `ru`.

Impact: documented localization is incorrect for multiple instances and runtime
locale changes.

Plan: provide an instance-local translator/locale formatter and test two
simultaneous calendars plus prop updates in browser mode.

### R7. Async failure paths can leave unusable or silent UI

Evidence: `src/VueEventCreator.vue:109-123`,
`src/components/Event.vue:189-243,246-255,273-288`.

Initial loading has no rejection/finally path, so a failed `getEventsFn` leaves
the loader forever. Save errors without an `{ error }` response are logged but
not shown. Edit/remove failures are console-only. Removal has no loading guard.

Impact: consumers cannot give users a reliable retry/recovery experience.

Plan: define one public error contract (event/slot/render state), use
`try/catch/finally`, prevent duplicate operations, preserve edits, and cover all
rejections with browser tests.

### R8. Global body listeners are not lifecycle-safe

Evidence: `src/VueEventCreator.vue:125-190`,
`src/components/Events.vue:53-64`, `src/components/Event.vue:2-5`.

Watchers add delayed body click listeners without unmount cleanup. Refocusing can
install another listener before the previous one is removed. Handlers also
assume `event.target` has `classList` and `hasAttribute`. Event cards use IDs
derived only from their start date, while focus uses global DOM queries, so two
library instances can select or scroll the wrong instance.

Impact: remounts can leak listeners, duplicate state changes, or throw for a
non-Element target.

Plan: extract typed outside-click behavior into a composable, retain one active
listener, scope DOM lookup to the component root, guard
`target instanceof Element`, and clean up in `onBeforeUnmount`.

### R9. Calendar date keys are incorrectly used as event identity

Evidence: `src/lib/dayjs.ts:32-34`, `src/components/Events.vue:5-8`,
`src/hooks/useEventActions.ts:58-69`, `src/index.d.ts:5-10`.

`es_id` is only `YYYYMMDD`, but it is used as the Vue key and to find/remove
events. Two loaded events that start on the same day collide, and removing one
removes both. Newly selected overlaps are silently rejected, while loaded
overlaps overwrite a day's ownership. The README does not disclose this major
scheduling constraint.

Impact: accepted input can corrupt rendering and remove the wrong records.

Plan: use the v2 boundary to separate persistence/internal identity from calendar
occupancy. Before the API freeze, decide whether v2 validates and documents one
event per day or supports `day -> event IDs`; neither design may use a date as
record identity.

## P2 — Important API and maintainability improvements

### R10. Consumer-owned inputs are mutated

Evidence: `src/VueEventCreator.vue:95,109-113`.

`reactive(props.defaultTime)` wraps and edits the consumer's object, while loaded
events receive `es_id` in place before the array is sorted. Vue props should be
treated as readonly and callback results as external data.

Plan: clone/normalize into explicit internal models and add immutability tests.

### R11. Callback and ID contracts are inconsistent

Evidence: `src/VueEventCreator.vue:61-80`,
`src/components/Event.vue:116-130,208,246-249`, `src/index.d.ts:25-45`.

Callbacks use bare `Function`; the type file exposes internal fields as required;
`editEventFn` is invoked without the event; and `!updatedEvent.id` rejects valid
ID `0`. A normal JSON response contains date strings, but save compares them to
`Date` values numerically without normalization. Remove treats every resolved
value, including `{ error }`, as success even though README presents the error
object as the callback-wide convention. Object defaults are not consistently
factories.

Plan: use typed `PropType` callbacks derived from the public event model, pass the
event to edit, validate `id == null`, and use factories for object/Date defaults.
Treat any callback signature correction as a compatibility decision.

### R12. Calendar range logic hides policy in implementation details

Evidence: `src/hooks/calendarBuildActions.ts:58-93,96-120`.

The loaded-event path hard-codes a three-month comparison instead of
`monthsOnPage`, has different inclusive counts with/without events, and builds
arbitrarily large ranges recursively. Names such as `firstEventstartsAt` and
`lastEventfinishesAt` obscure the policy.

Plan: specify the range policy, use iteration, cap or virtualize extreme ranges,
rename intermediates, and add boundary tests for zero/one month and distant
events.

### R13. Date semantics and invalid data are underspecified

Evidence: `src/hooks/useCalendarActions.ts:13-15,41-65`,
`src/hooks/useEventActions.ts:16-45`, `src/lib/dayjs.ts:32-41`.

`Math.abs` masks reversed external ranges and then walks forward from the wrong
endpoint. Using elapsed whole days also misses the second calendar date for a
cross-midnight event shorter than 24 hours. Date IDs and time edits use local
time, but the API does not state its time-zone/DST policy. Setting time preserves
source seconds and milliseconds.

Plan: validate and normalize boundary data, document local-time semantics, reset
seconds/milliseconds, and test DST transitions in an explicit zone.

### R14. The primary component has too many reasons to change

Evidence: `src/VueEventCreator.vue:82-196`.

The component owns fetching, normalization, calendar construction, localization,
selection cancellation, focus dismissal, and dependency injection. This is a
possible Divergent Change smell, not a rule violation.

Plan: extract initialization, locale, and outside-click/focus behavior into
lifecycle-aware composables after regression coverage exists.

### R15. Tooling migration remains half-complete

Evidence: `package.json:27-69`, `.oxlintrc.json:1-17`, `.eslintrc.js:1-24`.

Oxlint/Oxfmt are runtime dependencies without scripts or generated-file ignores,
while obsolete ESLint/Prettier dependencies/configuration remain. The Vitest
plugin is enabled before the repository uses Vitest.

Plan: finish one coherent toolchain migration, scope authored files, and remove
the replaced stack only when equivalent checks pass.

### R16. Interactive markup is not keyboard accessible

Evidence: `src/VueEventCreator.vue:6-8`, `src/components/Day.vue:1-13`,
`src/components/DefaultTime.vue:2-20`, `src/components/Calendar.vue:14-30`.

The responsive switcher and dates are clickable divs without keyboard semantics;
time controls lack associated labels; buttons do not consistently declare
`type="button"`, which can submit an ancestor consumer form.

Plan: use semantic buttons/grid patterns, accessible names and state, explicit
button types, visible focus, and keyboard Playwright coverage.

## P3 — Quality and documentation backlog

- [ ] Replace `es_id` as a user-visible identity concept with an internal named
      date key and encode the one-event-per-day invariant explicitly.
- [ ] Replace `VecEventsState = Ref<VecEvent[] | VecEvent[]>` with one meaningful
      type and use typed injection keys.
- [ ] Remove redundant spreads, non-null assertions, stale comments, empty style
      blocks, and console-only error handling after behavior coverage exists.
- [ ] Make the demo deterministic in test mode; its random decoration and delays
      are unsuitable for E2E.
- [ ] Correct README setup/component naming errors, callback examples, CSS path,
      and statements that no longer match package size or behavior.
- [ ] Decide whether committed `docs` output remains the Pages deployment model;
      if so, generate it in one documented release/deploy command and make `serve`
      preview the actual `docs` output instead of the nonexistent `demo-app` path.
- [ ] Add a support matrix for Node, Vue, browsers, and package managers. State
      explicitly that v2 supports ESM imports only.
- [ ] Add a v1-to-v2 migration guide covering the removed UMD/CommonJS paths,
      package/CSS imports, callback and error contracts, public types, identity,
      and locale changes.

## Recommended order

1. R1-R5: restore trustworthy package, types, CI, and tests.
2. R6-R9: fix observable correctness, identity, and lifecycle failures with
   browser tests.
3. R10-R13: stabilize public contracts and date/calendar semantics.
4. R14-R16 and the P3 backlog: deepen modules, accessibility, and documentation.

Do not combine all runtime fixes into the toolchain migration. Each behavior
change should have a focused regression test and an explicit compatibility note.
