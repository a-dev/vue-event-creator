# Vue Event Creator specification

Status: target contract for `vue-event-creator` 2.0. The current 1.0.4 behavior
is the migration baseline, not a compatibility requirement where this document
defines an intentional v2 change.

## Purpose

Vue Event Creator is a Vue 3 component library for creating, editing, and
removing calendar events. It is aimed at administrative interfaces where users
schedule several similar events and provide application-specific event data.

The library owns date-range selection, calendar rendering, event time editing,
focus, and removal confirmation. The consuming application owns persistence and
the optional form/content shown inside an event card.

## Supported user flow

1. The component loads saved events through `getEventsFn` and builds a calendar
   that covers the initial date and the loaded event range.
2. The user selects an empty start date and an empty finish date. Selecting the
   same date twice creates a one-day draft.
3. A draft event is added with the configured default start and finish times and
   opens in edit mode.
4. The consumer's optional event component edits application-specific data and
   emits it back to the event card.
5. Saving calls `saveEventFn`. A successful response replaces the local event;
   a response containing `error` keeps the event editable and shows the error.
6. Removing an unsaved draft is immediate. Removing a saved event requires
   confirmation and then calls `removeEventFn`.
7. Selecting a scheduled calendar day focuses and scrolls to its event card.
8. The user can append or prepend more months to the calendar.

Version 2 keeps the product rule that only one event may occupy a calendar day
unless overlap support is explicitly added before the v2 API is frozen. Event
identity must still be independent from calendar dates. Invalid or overlapping
loaded data must produce a defined error instead of colliding silently.

## Public component API

The package's default export is the `VueEventCreator` component.

| Prop             | Type                                                         | Default                                              | Contract                                                           |
| ---------------- | ------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `language`       | `'en' \| 'es' \| 'ru'`                                       | `'en'`                                               | Controls built-in labels and date formatting.                      |
| `firstDate`      | `Date`                                                       | current date                                         | First date used when no earlier loaded event expands the calendar. |
| `defaultTime`    | `{ startsAtTime: string; finishesAtTime: string }`           | `{ startsAtTime: '10:00', finishesAtTime: '17:00' }` | Initial `HH:mm` values for new events.                             |
| `monthsOnPage`   | `number`                                                     | `3`                                                  | Minimum number of initial months when no events expand the range.  |
| `getEventsFn`    | `() => Promise<SavedEvent[]>`                                | resolves to `[]`                                     | Loads the initial events.                                          |
| `saveEventFn`    | `(event: EditableEvent) => Promise<SavedEvent \| SaveError>` | async no-op                                          | Creates or updates an event and returns the server representation. |
| `editEventFn`    | `(event: EditableEvent) => Promise<void>`                    | async no-op                                          | Completes before an event enters edit mode.                        |
| `removeEventFn`  | `(event: SavedEvent) => Promise<void>`                       | async no-op                                          | Removes a previously saved event.                                  |
| `eventComponent` | Vue component                                                | none                                                 | Renders consumer-owned data inside each event card.                |

Callback props are asynchronous. The component must leave loading/editing state
predictable when a callback rejects and must not mutate objects supplied by the
consumer.

## Event model

```ts
type EventId = string | number;

interface EventData<TData extends object = Record<string, unknown>> {
  startsAt: Date;
  finishesAt: Date;
  data?: TData;
}

interface SavedEvent<
  TData extends object = Record<string, unknown>,
> extends EventData<TData> {
  id: EventId;
}

interface EditableEvent<
  TData extends object = Record<string, unknown>,
> extends EventData<TData> {
  id: EventId | null;
}

interface SaveError {
  error: string;
}
```

`startsAt` and `finishesAt` are JavaScript `Date` values. `startsAt` must not be
later than `finishesAt`. Date-only selection and the `HH:mm` controls use the
browser's local time zone. The package does not currently expose time-zone
conversion or recurrence rules.

The implementation may attach calendar occupancy and editing fields internally,
but consumers must not be required to provide or preserve those fields.

## Custom event component contract

`eventComponent` receives:

- `eventData`: the current `data` object for the event;
- `isEventEditing`: whether the card is in edit mode.

It reports changes with:

```ts
emit('update:eventData', nextData);
```

The custom component owns its form fields and validation UI. The library passes
its latest emitted value to `saveEventFn` as `event.data`.

## Persistence rules

- `getEventsFn` returns saved events with non-null IDs.
- `saveEventFn` receives `id: null` for a draft and an existing ID for an update.
- A successful save response contains a non-null ID and the authoritative event
  dates and data.
- `{ error: string }` is a domain failure and is displayed to the user.
- A rejected promise is an operational failure. The UI must stop loading, keep
  recoverable user input, and expose the failure consistently.
- `removeEventFn` is called only after confirmation for a saved event. Local
  state is removed only after it resolves.

## Localization

Built-in UI text and Day.js month/weekday names support English, Spanish, and
Russian. Locale state must be scoped per mounted component so differently
configured calendars can coexist. Changing the `language` prop should update an
existing instance without requiring it to be remounted.

## Styling and responsive behavior

The package ships one explicit CSS entry point. Consumers may override the CSS
custom properties declared in `src/styles/vars.css`, scoped under `.vec-body`.

The desktop layout shows the calendar and event list as two columns. A compact
layout provides a switcher between them. Interactive dates, switches, and
actions must be keyboard operable and expose accessible names and state.

## Architecture

- `src/VueEventCreator.vue`: public component and composition root.
- `src/components/`: calendar, day, event-list, event-card, time, and guard UI.
- `src/hooks/`: calendar construction and event/calendar state transitions.
- `src/lib/dayjs.ts`: date parsing, formatting, and internal date IDs.
- `src/locales/`: built-in translations.
- `src/styles/`: distributed component styles and public CSS variables.
- `demo/`: development and documentation application.
- `tests/unit/`: existing Jest-era behavior tests to migrate.

State transitions should remain framework-light and testable separately from the
DOM. Instance-specific dependencies should be provided through typed injection
keys rather than process-global mutable singletons.

Version 2 temporarily uses TypeScript 6, aliased as the project's `typescript`
package, so Vue tooling can use the compiler API it supports. Public component
props, callbacks, and event-data types live in ordinary `.ts` modules shared
with the SFC implementation. `vue-tsc` type-checks both TypeScript and Vue SFC
templates and emits declarations for the typed ESM entry. Moving to TypeScript 7
is deferred until stable Vue language-tools support is available; the follow-up
criteria are tracked in `TODO.md`.

## Distribution contract

An npm release must contain:

- one ESM JavaScript entry with `package.json` marked as `type: "module"`;
- generated declarations for the default component and all public types;
- the documented CSS entry point;
- `README.md`, `CHANGELOG.md`, and `LICENSE`;
- an `exports` map whose ESM, types, and CSS paths all exist.

Version 2 does not publish UMD or CommonJS builds and provides no compatibility
guarantee for `require('vue-event-creator')` or direct `<script>` loading through
an `unpkg` entry. Consumers use an ESM-aware bundler/runtime and import the
library with `import` syntax. The package removes legacy `main`, `module`, and
`unpkg` fields once the export map is verified.

Vue is a peer dependency. Day.js is a runtime dependency. Build, declaration,
package-lint, packed-consumer, and browser checks must pass before publication.

Known deviations from this target contract are intentionally not normalized
here; they are recorded and prioritized in `TODO-review.md`. The v2 migration
sequence is in `TODO-update.md`.
