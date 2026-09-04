# Migrating from v1 to v2

Version 2 is a deliberate breaking release. It fixes the package contract, the
public types, and several correctness bugs that could not be corrected without
changing observable behavior. This guide lists every change that can require
work in a consuming application, in the order you are likely to hit them.

## 1. The package is ESM only

`vue-event-creator@2` ships a single ES module build.

| v1                                  | v2                                            |
| ----------------------------------- | --------------------------------------------- |
| `main` (CommonJS), `module`, `unpkg` | `exports` with `types` and `import` only      |
| UMD bundle, usable via `<script>`   | removed                                       |
| `require('vue-event-creator')`      | removed                                       |

```js
// v2
import VueEventCreator from 'vue-event-creator';
```

**What to do:** load the package from an ESM-aware bundler or runtime. If a
build step still emits `require()` for your dependencies, either configure it to
treat this package as ESM or keep it external. CommonJS interop may happen to
work through a bundler's compatibility layer, but it is not supported and is not
covered by the package's type or E2E checks.

The package requires Node.js 22.12 or newer for tooling, and declares Vue `^3.x`
as a peer dependency. Day.js remains the only runtime dependency.

## 2. The stylesheet moved to one documented subpath

In v1 the declared style path (`dist/styles.css`) did not match the file the
build emitted (`dist/vue-event-creator.css`), so the documented import failed.

```js
// v1 — either of these, depending on which one you discovered
import 'vue-event-creator/dist/styles.css';
import 'vue-event-creator/dist/vue-event-creator.css';

// v2 — the only supported path
import 'vue-event-creator/style.css';
```

**What to do:** replace the CSS import. Deep imports into `dist` are no longer
part of the public surface and can break in any release.

## 3. Types are real, published, and generic

v1 shipped a hand-written `src/index.d.ts` that was not in the tarball, did not
declare the default component, and exposed internal fields as required.

v2 generates declarations from a typed entry and exports the public model:

```ts
import type {
  DefaultTime,
  EditableEvent,
  EditEventFn,
  EventData,
  EventId,
  GetEventsFn,
  LanguageLocale,
  RemoveEventFn,
  SavedEvent,
  SaveError,
  SaveEventFn,
  VueEventCreatorProps,
} from 'vue-event-creator';
```

Callbacks are generic over your own `data` shape instead of using bare
`Function`, `object`, and `any`:

```ts
interface CourseData extends Record<string, unknown> {
  title: string;
}

const saveEventFn: SaveEventFn<CourseData> = async (event) => { /* ... */ };
```

**What to do:** if you declared your own ambient types for this package, delete
them. Internal state types (`es_id`, day and calendar structures) are no longer
exported; they were never a usable public contract.

## 4. Callback contracts

| Callback        | v1                                              | v2                                                          |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| `getEventsFn`   | any array; failures left the loader spinning     | must resolve `SavedEvent[]`; rejection shows a retry alert   |
| `saveEventFn`   | `{ error }` logged, `id: 0` rejected as falsy    | `{ error }` or rejection shown on the card; `id: 0` is valid |
| `editEventFn`   | invoked with no arguments                        | invoked with the `EditableEvent`                             |
| `removeEventFn` | `{ error }` resolved value treated as success    | rejection shows the error and keeps the event                |

**What to do:**

- If `editEventFn` ignored its arguments, nothing changes. If you relied on it
  receiving nothing, note that it now receives the event being edited.
- Signal failures from `removeEventFn` and `editEventFn` by **rejecting**.
  Resolving with `{ error }` from those two callbacks is not a failure signal;
  only `saveEventFn` accepts the `{ error }` shape.
- Dates you return from `saveEventFn` must match the dates you were given, down
  to the millisecond. A server that rounds or shifts them now produces a visible
  error instead of a silently divergent calendar.
- An event id of `0` is now a valid saved id.

## 5. Errors are shown, not logged

v1 logged most failures to the console. v2 has one error contract:

- a failed initial load replaces the calendar with an alert and a **Retry**
  button;
- save, edit, and remove failures appear above the card footer, with the entered
  values preserved so the user can retry;
- while a callback is in flight the card shows a loader and ignores repeat
  clicks, so no callback is invoked twice for one user action.

**What to do:** if your callbacks swallowed their own errors to avoid console
noise (for example `.catch(console.error)` inside `saveEventFn`), let them
reject instead so the component can show the failure.

## 6. Event identity and overlap

v1 used the start date (`YYYYMMDD`) as both the Vue key and the record identity.
Two events starting on the same day collided, and removing one removed both.

v2 keeps the date key strictly internal and validates loaded data instead:
`getEventsFn` results that contain an invalid date, an event finishing before it
starts, or two events sharing a calendar date make the component show the load
error rather than render a partly wrong calendar. **A calendar date belongs to
at most one event.**

**What to do:** make sure your API cannot return overlapping events for the
range being displayed. If your domain allows overlap, this component is not a
fit for that data as-is.

## 7. Locale is per instance and reactive

In v1 every mount mutated a shared translator and the global Day.js locale, so
mounting an English and a Russian calendar together left whichever mounted last
in charge of both. The `language` prop was not watched, and the demo worked
around this by remounting the component with a `key`.

In v2 the translator and date formatting are scoped to the instance and
`language` is reactive.

**What to do:** remove `:key` remount workarounds around `language` changes. The
exported global setters `setI18n` and `setDayJsLang` are gone; there is no
supported way to change another instance's locale. The README's v1 claim of
"custom" localization was never true — `en`, `es`, and `ru` are the supported
locales.

`firstDate`, `monthsOnPage`, and `defaultTime` are reactive in v2 as well:
changing `firstDate` or `monthsOnPage` rebuilds the calendar in place.

## 8. Markup and accessibility

Interactive elements are now native controls, which changes both the DOM and the
selectors you may have used in tests or CSS overrides.

- Calendar days and the responsive switcher are `<button>` elements with
  accessible names (a day's name is its `YYYY-MM-DD` date) and `aria-pressed` /
  `aria-expanded` state, instead of clickable `<div>`s.
- Every button declares `type="button"`, so the component can no longer submit a
  surrounding consumer form.
- Time inputs have accessible labels.
- Event cards are identified by `data-vec-event-id` instead of a
  `vec-es-id-<date>` DOM `id`, so two instances on one page no longer produce
  duplicate element ids or scroll each other's cards.

**What to do:** update selectors that targeted `.vec-day` as a `div`, or the
`#vec-es-id-*` ids. Prefer role-based selectors in tests. CSS class names are
unchanged.

## 9. Removed exports

| Removed                | Replacement                                          |
| ---------------------- | ---------------------------------------------------- |
| `setI18n`              | the `language` prop                                  |
| `setDayJsLang`         | the `language` prop                                  |
| internal state types   | none; they were never a stable contract              |
| `dist` deep imports    | the package root and `vue-event-creator/style.css`   |

## Checklist

- [ ] The app loads the package as ESM.
- [ ] The CSS import points at `vue-event-creator/style.css`.
- [ ] Ambient type declarations for the package are deleted.
- [ ] `saveEventFn` returns the same dates it received, and may use `id: 0`.
- [ ] `editEventFn` and `removeEventFn` reject to report failures.
- [ ] Loaded events never share a calendar date.
- [ ] `:key` remount workarounds for `language` are removed.
- [ ] Selectors relying on `div.vec-day` or `#vec-es-id-*` are updated.
