## 2.0.0

A breaking release. See [MIGRATION.md](MIGRATION.md) for the upgrade guide.

### Breaking

- **ESM only.** The CommonJS and UMD builds are gone; the package publishes a
  single ES module through an `exports` map. `require('vue-event-creator')` and
  `<script>` tag usage are no longer supported.
- **The stylesheet moved to `vue-event-creator/style.css`.** The v1 paths
  (`dist/styles.css`, which never existed, and `dist/vue-event-creator.css`) are
  not part of the public surface. Deep imports into `dist` are unsupported.
- **Types are generated and published.** The hand-written `src/index.d.ts` is
  replaced by declarations emitted from a typed entry. Callback and event types
  are generic over the consumer's `data` shape instead of `Function`/`object`/
  `any`. Internal state types are no longer exported.
- **`setI18n` and `setDayJsLang` are removed.** Locale is set through the
  `language` prop, which is now reactive and scoped to the instance.
- **`editEventFn` receives the event being edited** instead of being called with
  no arguments.
- **`editEventFn` and `removeEventFn` report failure by rejecting.** A resolved
  `{ error }` value from those two callbacks is no longer treated as a failure;
  only `saveEventFn` accepts that shape.
- **`saveEventFn` must return the dates it was given.** A saved event whose
  dates differ from the submitted ones is reported as an error instead of being
  applied.
- **Loaded events are validated.** `getEventsFn` results containing an invalid
  date, an event finishing before it starts, or two events sharing a calendar
  date show the load error rather than rendering a partly wrong calendar.
- **Event cards are keyed by `data-vec-event-id`**, replacing the document-wide
  `vec-es-id-<date>` element `id`.
- **Days and the responsive switcher are `<button>` elements**, not clickable
  `<div>`s. All buttons declare `type="button"`.
- **Node.js 22.12 or newer** is required for tooling, and Vue `^3.x` is the
  declared peer range.

### Fixed

- An event id of `0` is treated as a saved id instead of an unsaved draft.
- Two calendars mounted at once no longer share a locale, steal each other's
  focus, or scroll each other's event cards.
- `firstDate` and `monthsOnPage` changes rebuild the calendar; `defaultTime` and
  `language` changes apply without a remount.
- Failed loads show a retry alert instead of leaving the loader spinning; save,
  edit, and remove failures are shown on the card instead of only being logged.
- A callback in flight is no longer invoked twice for one user action.
- Document click listeners are registered through a lifecycle-aware composable
  and removed on unmount.
- Consumer-supplied events and data objects are never mutated.

### Added

- `MIGRATION.md`, a rewritten `README.md`, and documented Node/browser support,
  time-zone semantics, overlap constraints, and the release process.
- Keyboard operation of the calendar, with accessible names and states on days,
  the switcher, and the time inputs.
- A release pipeline: pull-request CI, a tag-driven release workflow publishing
  with npm provenance, scheduled Firefox/WebKit E2E runs, and a
  `release:check` gate that also runs from `prepublishOnly`.
- Playwright E2E journeys against both the demo app and the packed package.

### Changed

- Rebuilt on Vite 8, Vitest 5 (Node and Chromium browser projects), oxlint, and
  oxfmt. ESLint and Prettier are removed.

## 1.0.4

update dependencies

## 1.0.3

Update dependencies

## 1.0.2

- Add guard on an unsaved data
- Fix Readme
