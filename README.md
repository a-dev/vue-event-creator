# Vue Event Creator

Vue Event Creator is a Vue 3 component for scheduling events on a calendar. It
is aimed at admin interfaces where many similar events — training courses, sport
events, seminars — differ only by their dates. Pick a start date and a finish
date on the calendar, adjust the time, fill in your own fields, and save.

Upgrading from version 1? Read [MIGRATION.md](MIGRATION.md) first: version 2 is
ESM only and changes several public contracts.

## Features

- Built-in interface locales: English, Español, Русский.
- Two-column layout: calendar and event cards, with a switcher on small screens.
- Focus an event card by clicking one of its calendar days.
- Default time control for newly created events.
- In-place editing of your own event data through a component you provide.
- Confirmation before removing an event that was already saved through your API.
- Keyboard accessible: every day and control is a real focusable button.

## Demo

### 👉 [Check out the demo](https://a-dev.github.io/vue-event-creator/) 👈

Click one date to start an event and a second date to finish it; click the same
date twice for a one-day event. The card for the new event appears in the right
column and stays a draft until you save it.

## Support matrix

| Item             | Supported                                                          |
| ---------------- | ------------------------------------------------------------------ |
| Module format    | ESM only. No CommonJS, UMD, or `<script>` build is published.       |
| Node.js          | 24.0 or newer (`engines.node`), for bundlers and tooling.           |
| Vue              | `^3.x` as a peer dependency; developed against 3.5.                 |
| Runtime deps     | Day.js only. Vue stays external.                                    |
| Browsers         | Evergreen Chromium, Firefox, and WebKit. E2E runs on all three.     |
| TypeScript       | Declarations resolve under `bundler`/`node16` ESM resolution.       |
| Package managers | Any npm-compatible client; this repository is developed with Bun.   |

The component relies on CSS custom properties, CSS grid, and
`<input type="time">`. Browsers without those (notably Internet Explorer) are
not supported.

## Installation

```sh
npm install vue-event-creator
```

Version 2 is ESM only. Use it through an ESM-aware runtime or bundler;
CommonJS `require()`, UMD, and direct script-tag loading are not supported and
carry no compatibility guarantee.

```js
import VueEventCreator from 'vue-event-creator';
import 'vue-event-creator/style.css';
```

The stylesheet is published only at the `vue-event-creator/style.css` subpath.
Nothing imports it for you — the component renders unstyled without it.

## Usage

The full example lives in the
[demo app](https://github.com/a-dev/vue-event-creator/blob/main/demo). A minimal
host component wires the callbacks that talk to your API:

```vue
<template>
  <vue-event-creator
    language="en"
    :firstDate="firstDate"
    :getEventsFn="getEventsFn"
    :saveEventFn="saveEventFn"
    :editEventFn="editEventFn"
    :removeEventFn="removeEventFn"
    :eventComponent="EventDataComponent"
  />
</template>

<script setup lang="ts">
import VueEventCreator from 'vue-event-creator';
import type {
  EditableEvent,
  SavedEvent,
} from 'vue-event-creator';
import 'vue-event-creator/style.css';

import EventDataComponent from './EventDataComponent.vue';

interface CourseData extends Record<string, unknown> {
  title: string;
  text: string;
}

const firstDate = new Date();

const getEventsFn = async (): Promise<SavedEvent<CourseData>[]> => {
  const response = await fetch('/api/events.json');
  const events = await response.json();

  // Dates must be Date instances; a JSON API returns strings.
  return events.map((event) => ({
    id: event.id,
    startsAt: new Date(event.starts_at),
    finishesAt: new Date(event.finishes_at),
    data: { title: event.title, text: event.text },
  }));
};

const saveEventFn = async (event: EditableEvent<CourseData>) => {
  // `event.id` is null for a draft that has never been saved.
  const isUpdate = event.id !== null;
  const response = await fetch(
    isUpdate ? `/api/events/${event.id}.json` : '/api/events',
    {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        starts_at: event.startsAt.toISOString(),
        finishes_at: event.finishesAt.toISOString(),
        ...event.data,
      }),
    },
  );

  if (!response.ok) {
    // Either shape works: return an error object, or throw.
    return { error: 'The event could not be saved' };
  }

  const saved = await response.json();
  return {
    id: saved.id,
    startsAt: new Date(saved.starts_at),
    finishesAt: new Date(saved.finishes_at),
    data: { title: saved.title, text: saved.text },
  };
};

const editEventFn = async (event: EditableEvent<CourseData>) => {
  // Optional preparation before the card switches into edit mode.
  // Reject to block editing and show the reason on the card.
};

const removeEventFn = async (event: SavedEvent<CourseData>) => {
  const response = await fetch(`/api/events/${event.id}.json`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('The event could not be removed');
};
</script>
```

### Props

| Prop             | Type                       | Default                                        | Description                                                             |
| ---------------- | -------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `language`       | `'en' \| 'es' \| 'ru'`     | `'en'`                                         | Interface locale. Reactive, and scoped to this instance.                |
| `firstDate`      | `Date`                     | `new Date()`                                   | First month shown. Reactive: changing it rebuilds the calendar.         |
| `monthsOnPage`   | `number`                   | `3`                                            | Months rendered initially. Reactive.                                    |
| `defaultTime`    | `DefaultTime`              | `{ startsAtTime: '10:00', finishesAtTime: '17:00' }` | Time applied to newly created events. Reactive.                   |
| `getEventsFn`    | `GetEventsFn<TData>`       | resolves `[]`                                  | Loads existing events once on mount, and again on retry.                |
| `saveEventFn`    | `SaveEventFn<TData>`       | rejects                                        | Persists a draft or an edited event.                                    |
| `editEventFn`    | `EditEventFn<TData>`       | resolves                                       | Runs before a card enters edit mode; receives the event.                |
| `removeEventFn`  | `RemoveEventFn<TData>`     | resolves                                       | Removes an event that has an `id`.                                      |
| `eventComponent` | `Component`                | `undefined`                                    | Your component for the event's own data.                                |

All callback props are generic over `TData`, the shape of your `data` object.
The public types are generated from the source and exported from the package
root: `EventData`, `SavedEvent`, `EditableEvent`, `SaveError`, `EventId`,
`DefaultTime`, `LanguageLocale`, `GetEventsFn`, `SaveEventFn`, `EditEventFn`,
`RemoveEventFn`, and `VueEventCreatorProps`.

### The event data component

`eventComponent` receives two props and emits one event:

```vue
<template>
  <div v-if="isEventEditing">
    <input type="text" v-model="title" @input="sendData" />
    <textarea v-model="text" @input="sendData"></textarea>
  </div>
  <template v-else>
    <h2>{{ title }}</h2>
    <div>{{ text }}</div>
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  eventData?: { title?: string; text?: string };
  isEventEditing: boolean;
}>();
const emit = defineEmits<{
  'update:eventData': [{ title?: string; text?: string }];
}>();

const title = ref(props.eventData?.title);
const text = ref(props.eventData?.text);

// Emit on every change; the emitted object is what reaches `saveEventFn`.
const sendData = () => emit('update:eventData', {
  title: title.value,
  text: text.value,
});
</script>
```

The component never mutates the objects you hand it. Loaded events are cloned
into internal models, and callbacks receive fresh `Date` instances.

## Error handling

There is one error contract, and every failure is shown in the interface rather
than only logged.

| Failure                     | What the user sees                                                   |
| --------------------------- | -------------------------------------------------------------------- |
| `getEventsFn` rejects       | An alert replacing the calendar, with a **Retry** button.            |
| Loaded events are invalid   | The same alert, describing the invalid dates or the overlap.         |
| `saveEventFn` returns `{ error }` or rejects | The message above the card footer; the card stays in edit mode with the entered values preserved. |
| The saved event's dates differ from the submitted ones | A message naming both date ranges; the local event is not overwritten. |
| `editEventFn` rejects       | The message on the card; the card stays read-only.                   |
| `removeEventFn` rejects     | The message on the card; the event is kept.                          |

`saveEventFn` may signal a failure either by resolving with
`{ error: 'message' }` or by rejecting. A save that resolves without an `id`
(`null` or `undefined`) is treated as a failure; `id` of `0` is a valid id.

While a save, edit, or removal is in flight the card shows a loader and ignores
further attempts, so a callback is never invoked twice for one action.

## Dates, time zones, and overlap

- **Local time.** Dates are interpreted, formatted, and keyed in the browser's
  local time zone. A calendar day is the local calendar date, so the same
  `Date` can land on different days for users in different zones. Send absolute
  timestamps (for example ISO 8601 with an offset) to your API and convert them
  to `Date` in `getEventsFn`.
- **Times are hours and minutes.** The time controls set hours and minutes on
  the event's dates; seconds and milliseconds come from the underlying date.
- **One event per calendar date.** A date can belong to at most one event.
  `getEventsFn` results are validated on load: an invalid date, an event that
  finishes before it starts, or two events sharing a calendar date make the
  component show the load error instead of a partly wrong calendar. Selecting a
  range that covers an already scheduled day is ignored rather than creating a
  conflicting event.
- **Reversed selections are corrected.** Clicking a later date first and an
  earlier one second creates the event over that range in the right order.

## Localization

`language` accepts `en`, `es`, or `ru`. It is reactive and scoped per instance:
several calendars can be mounted at once with different languages, and changing
`language` re-renders that instance only. Weekday order and month names follow
the Day.js locale — Sunday starts the week in `en`, Monday in `es` and `ru`.
Custom locales are not part of the public API in version 2.

## Styles

Import the stylesheet once, then override the CSS custom properties on the
`.vec-body` class:

```vue
<style>
.vec-body {
  --vec-color-text-primary: red;
  --vec-color-primary: blue;
  --vec-calendar-max-height: calc(100vh - 3rem);
  /* and more... */
}
</style>
```

The full list of variables is in
[src/styles/vars.css](https://github.com/a-dev/vue-event-creator/blob/main/src/styles/vars.css).

Panels and controls use `corner-shape: squircle` where supported, with an
area-matched circular `border-radius` fallback based on the
[corner-shape generator](https://a-dev.github.io/probes/corner-shape/).
Customize `--vec-radius-panel` (28px) and `--vec-radius-control` (16px) to adjust
the panel and control shapes; set both to `0px` for square corners on those
elements. Calendar days use a separate, nearly circular `superellipse(1.25)`
shape with a 50% radius and an area-matched circular fallback. Existing palette
variables are unchanged.

Below 768px, the labeled calendar toggle expands an inline panel above the
events. Collapsed dates are removed from keyboard navigation. Larger screens
keep the calendar beside the event list. At desktop widths of 1024px and above,
saved cards place their actions beside the dates to fit more events on screen;
editing cards keep actions below the form. Time fields and action buttons have
44px minimum heights, and keyboard focus has a visible outline.
The event editor's default-time button aligns to the right when its time-controls
row has at least 600px of content width, using a container query.

## Development

```sh
bun install
bun run dev            # demo app
bun run test           # unit (Node) and component (Chromium) tests
bun run test:e2e       # Playwright journeys against the demo and packed package
bun run release:check  # the full gate, exactly as CI runs it
```

`release:check` runs format check, `vue-tsc` type-check, lint, unit and browser
tests, the library build, package checks (`publint`, `attw --profile esm-only`,
`npm pack --dry-run`, and a packed ESM consumer build), and the E2E suite.

## Release process

1. Land the change on `main`; pull-request CI runs the static, unit, browser,
   build, package, and Chromium E2E gates.
2. Update `CHANGELOG.md` and bump `version` in `package.json`.
3. Tag the commit as `v<version>` and push the tag.
4. The release workflow re-runs ordinary CI plus the Firefox and WebKit E2E
   suites, then stages the release from the `npm-publish` environment with npm
   provenance. `prepublishOnly` runs `release:check` again, so publication
   cannot bypass the gate.
5. Approve the staged version to make it public. The workflow is authenticated
   by OIDC trusted publishing, which proves which workflow published but not
   that a maintainer intended the release, so the final step is a deliberate
   human one requiring 2FA:

   ```sh
   npm stage list vue-event-creator   # find the pending stage id
   npm stage view <stage-id>          # inspect what CI built
   npm stage approve <stage-id>       # 2FA; this publishes it
   ```

   The npm package page offers the same approve/reject step. Until approved,
   the version is not installable, and `npm stage reject <stage-id>` discards
   it.

Firefox and WebKit E2E also run on a daily schedule, off the pull-request path.

## License

[MIT](https://github.com/a-dev/vue-event-creator/blob/main/LICENSE)
