<template>
  <header class="vec-demo__nav">
    <a class="vec-demo__brand" href="#"
      >Vue Event Creator<span> / Vue 3</span></a
    >
    <a href="https://github.com/a-dev/vue-event-creator">GitHub ↗</a>
  </header>
  <main>
    <section class="vec-demo__hero" aria-labelledby="demo-title">
      <div class="vec-demo__explanation">
        <h1 id="demo-title">More events.<br />Less déjà vu.</h1>
        <p>
          Say you’re organizing a course that runs twice a week for a month.
          Same title, same description, different dates. By the fifth form,
          you’re probably wondering why you’re typing it all again.
        </p>
        <p>
          That’s the sort of work Vue Event Creator is meant to help with. It’s
          a Vue 3 library for admin interfaces where people schedule lots of
          similar events, from training courses to sports sessions. You pick
          dates on the calendar and edit the events together, with default times
          for new events. Everything stays in view.
        </p>
        <p>
          And the details are yours to decide. Add a Vue component with the
          fields and default values your events need: perhaps a title, a venue,
          or the instructor who somehow teaches everything. The library handles
          the calendar and time controls; your application handles the data and
          saving.
        </p>
        <p>
          There’s a working example below. If you’d like to use it in your own
          project, the
          <a href="https://github.com/a-dev/vue-event-creator#readme">README</a>
          explains the setup and API.
        </p>
      </div>
    </section>
    <section
      id="playground"
      class="vec-demo__playground"
      aria-labelledby="playground-title"
    >
      <div class="vec-demo__toolbar">
        <div>
          <h2 id="playground-title">A little room to play</h2>
        </div>
        <div class="vec-demo__locales" role="group" aria-label="Demo language">
          <span>Language</span>
          <button
            v-for="lang in ['en', 'es', 'ru'] as const"
            :key="lang"
            type="button"
            :aria-pressed="locale === lang"
            class="vec-demo__locales-button"
            @click="changeLang(lang)"
          >
            {{ { en: 'En', es: 'Es', ru: 'Ru' }[lang] }}
          </button>
        </div>
      </div>
      <p class="vec-demo__note">
        To add an event, select an empty start date and an end date. For a
        single-day event, select the same date twice. Selecting a scheduled day
        brings its event card into view. Changes in this demo last until you
        refresh, so it’s fine to make a mess.
      </p>
      <vue-event-creator
        :language="locale"
        :firstDate="firstDate"
        :saveEventFn="saveEventFn"
        :getEventsFn="getEventsFn"
        :eventComponent="DemoEventComponent"
      />
    </section>
    <section class="vec-demo__about" aria-label="About the component">
      <div>
        <h2>Your events.<br />Your fields.</h2>
      </div>
      <div>
        <p>
          The dark section in these cards is the demo’s own Vue component,
          passed to the library through the eventComponent prop. It’s a simple
          example of how your form can work alongside the built-in date and time
          controls.
        </p>
        <a href="https://github.com/a-dev/vue-event-creator#readme"
          >Documentation ↗</a
        >
      </div>
    </section>
  </main>
  <footer class="vec-demo__bottom">
    <ul>
      <li>
        <a href="https://github.com/a-dev/vue-event-creator/blob/main/LICENSE"
          >MIT License</a
        >, 2026
      </li>
      <li>built by <a href="https://github.com/a-dev">@a-dev</a></li>
      <li>
        <a href="https://github.com/a-dev/vue-event-creator"
          >Vue Event Creator</a
        >
      </li>
    </ul>
  </footer>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
import VueEventCreator from '../src/VueEventCreator.vue';
import { createDemoEvents, E2E_REFERENCE_DATE } from './demoEvents';
import DemoEventComponent from './DemoEventComponent.vue';
import type { VecLanguageLocale } from '../src';

export default defineComponent({
  name: 'VECDemoAppComponent',
  components: {
    VueEventCreator,
  },
  setup() {
    const locale = ref<VecLanguageLocale>('en');
    const isE2E = new URLSearchParams(window.location.search).has('e2e');
    const firstDate = isE2E ? new Date('2026-08-01T00:00:00.000Z') : new Date();
    const referenceDate = isE2E ? E2E_REFERENCE_DATE : new Date();
    let nextId = 100;
    let rejectedOnce = false;

    const saveEventFn = async (event: any) => {
      console.log('saving data...', event);
      if (isE2E && event.data?.title === 'Reject once' && !rejectedOnce) {
        rejectedOnce = true;
        return { error: 'Demo validation failed' };
      }
      const id = event.id ?? nextId++;
      if (!isE2E) await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = { ...event, id };
      return result;
    };

    const getEventsFn = async () => {
      if (!isE2E) await new Promise((resolve) => setTimeout(resolve, 1000));
      return createDemoEvents(referenceDate).map((event) => ({
        ...event,
        startsAt: new Date(event.startsAt),
        finishesAt: new Date(event.finishesAt),
        data: { ...event.data },
      }));
    };

    const changeLang = (lang: VecLanguageLocale) => {
      locale.value = lang;
    };

    return {
      getEventsFn,
      DemoEventComponent,
      saveEventFn,
      changeLang,
      locale,
      firstDate,
    };
  },
});
</script>
<style>
body {
  margin: 0;
  color: #44464c;
  background: hsl(232, 5%, 99%);
  font-family: 'Lato', sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

.vec-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 48px);
}

.vec-demo a {
  color: #213eff;
  text-underline-offset: 4px;
}
.vec-demo a:focus-visible,
.vec-demo button:focus-visible {
  outline: 3px solid hsl(201, 76%, 72%);
  outline-offset: 4px;
}

.vec-demo__nav,
.vec-demo__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 28px 0;
  font-size: 14px;
}

.vec-demo__nav .vec-demo__brand {
  color: #44464c;
  font-weight: 900;
  text-decoration: none;
}
.vec-demo__brand span {
  font-weight: 400;
  margin-left: 8px;
}

.vec-demo__hero {
  margin: 24px 0 48px;
  padding: clamp(24px, 4vw, 40px);
  background: #d9eff4;
}

.vec-demo__explanation {
  max-width: 70ch;
  margin: 0 auto;
  font-size: 17px;
  line-height: 1.65;
}

.vec-demo h1 {
  margin: 0 0 24px;
  color: #212529;
  font-size: clamp(30px, 4vw, 44px);
  line-height: 1.15;
  font-weight: 900;
}

.vec-demo__explanation p {
  margin: 0 0 20px;
}
.vec-demo__explanation p:last-child {
  margin-bottom: 0;
}

.vec-demo__playground {
  scroll-margin-top: 24px;
}
.vec-demo__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.vec-demo__toolbar h2,
.vec-demo__about h2 {
  margin: 0;
  font-size: clamp(24px, 3vw, 30px);
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: #212529;
}
.vec-demo__note {
  margin: 16px 0 28px;
  font-size: 14px;
}
.vec-demo__locales {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.vec-demo__locales > span {
  margin-right: 8px;
}
.vec-demo__locales-button {
  min-width: 44px;
  min-height: 44px;
  padding: 8px;
  cursor: pointer;
  color: #44464c;
  border: 1px solid hsl(113, 0%, 81%);
  background: transparent;
  font: inherit;
}
.vec-demo__locales-button[aria-pressed='true'] {
  background: #415aff;
  border-color: #415aff;
  color: white;
}
.vec-demo__about {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 32px;
  padding: 40px;
  margin-top: 64px;
  background: #d9eff4;
}
.vec-demo__about p {
  margin-top: 0;
}
.vec-demo__bottom {
  justify-content: center;
  margin-top: 32px;
  padding-bottom: 36px;
}
.vec-demo__bottom ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 0;
  padding: 0;
  margin: 0;
  list-style: none;
}
.vec-demo__bottom li + li::before {
  content: '•';
  margin-inline: 12px;
}
.vec-demo__bottom a {
  color: inherit;
}

/* Same area-matched squircle fallback as the library. */
.vec-demo__hero,
.vec-demo__about {
  --demo-radius: 48px;
}
.vec-demo__locales-button {
  --demo-radius: 16px;
}
.vec-demo__hero,
.vec-demo__about,
.vec-demo__locales-button {
  border-radius: calc(var(--demo-radius) * 0.5831);
}
@supports (corner-shape: squircle) {
  .vec-demo__hero,
  .vec-demo__about,
  .vec-demo__locales-button {
    border-radius: var(--demo-radius);
    corner-shape: squircle;
  }
}

@media (max-width: 767px) {
  .vec-demo__hero {
    margin: 8px 0 40px;
  }
  .vec-demo__about {
    grid-template-columns: 1fr;
    padding: 24px;
    margin-top: 40px;
  }
  .vec-demo__nav {
    font-size: 12px;
    padding: 20px 0;
  }
}
</style>
