<template>
  <h1 class="vec-demo__title">Vue Event Creator</h1>
  <div class="vec-demo__description">
    <div class="vec-demo__phantom" :style="phantomStyle()">29</div>
    <div class="vec-demo__phantom" :style="phantomStyle()">12</div>
    <div class="vec-demo__phantom" :style="phantomStyle()">Mo</div>
    <div class="vec-demo__phantom" :style="phantomStyle()">Tw</div>
    <div class="vec-demo__phantom" :style="phantomStyle()">August</div>
    <div class="vec-demo__phantom" :style="phantomStyle()">2022</div>
    <div class="vec-demo__text">
      <p>
        The library Vue Event Creator helps to schedule events in easy way. It’s
        very convenient for companies that have a lot of similar events, first
        of all repeated events like training courses, sport events, seminars.
        For example, we have the event that occurs twice a week for a month. The
        title and description are the same, just the dates are different. In
        general it takes enough time to fill up that info (and it’s boring), Vue
        Event Creator fasts the process. And yes, the interface looks nice.
      </p>
      <p>
        By the way, you can customize the dates of event and add to them
        additional properties that suit your aim: title, content, select, tags
        and so on.
      </p>
      <p>
        <a href="https://github.com/a-dev/vue-event-creator">More on Github</a>
      </p>
    </div>
    <hr class="vec-demo__divider" />
    <div class="vec-demo__locales">
      <span class="vec-demo__locales-text">Choose language:</span>
      <button
        :disabled="locale == 'en'"
        class="vec-demo__locales-button"
        @click="changeLang('en')"
      >
        En</button
      ><button
        :disabled="locale == 'es'"
        class="vec-demo__locales-button"
        @click="changeLang('es')"
      >
        Es</button
      ><button
        :disabled="locale == 'ru'"
        class="vec-demo__locales-button"
        @click="changeLang('ru')"
      >
        Ru
      </button>
    </div>
  </div>
  <vue-event-creator
    :key="locale"
    :language="locale"
    :saveEventFn="saveEventFn"
    :getEventsFn="getEventsFn"
    :eventComponent="DemoEventComponent"
  ></vue-event-creator>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
import VueEventCreator from '../src/VueEventCreator.vue';
import demoEvents from './demoEvents';
import DemoEventComponent from './DemoEventComponent.vue';

export default defineComponent({
  name: 'VECDemoAppComponent',
  components: {
    VueEventCreator
  },
  setup() {
    const locale = ref('en');

    const saveEventFn = async (event: any) => {
      console.log('saving data...', event);
      // You don't need to check for event.id null. Here it's for demo purpose only.
      // But your server must to create an id and response with it.
      const id = event.id || Math.floor(Math.random() * 10000);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = { ...event, id };
      return result;
    };

    const getEventsFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return demoEvents;
    };

    const changeLang = (lang: string) => {
      locale.value = lang;
    };

    const phantomStyle = () => {
      const rand = (limit: number) => Math.floor(Math.random() * limit) + 1;
      return {
        top: rand(80) + '%',
        left: rand(80) + '%',
        'font-size': rand(25) + 'vw'
      };
    };

    return {
      getEventsFn,
      DemoEventComponent,
      saveEventFn,
      changeLang,
      locale,
      phantomStyle
    };
  }
});
</script>
<style>
body {
  margin: 0;

  color: #44464c;

  font-family: 'Lato', sans-serif;
  font-size: 20px;
  font-weight: 400;
}
.vec-demo {
  margin: 2rem 0;
}

.vec-demo .vec-body {
  max-width: 1024px;
  margin: 0 auto;
}

.vec-demo__title {
  margin: 6rem 0;

  text-align: center;

  font-size: clamp(2rem, 10vw, 4rem);
  font-weight: 900;
  line-height: 1;
}

.vec-demo__description {
  position: relative;

  overflow: hidden;

  box-sizing: border-box;
  margin-bottom: 2rem;
  padding: 3rem 1.5rem;

  background-color: #d9eff4;
}

.vec-demo__text {
  position: relative;

  max-width: 52ch;
  margin: 0 auto;

  font-size: 1.09rem;
  line-height: 1.69;
}

.vec-demo__text p {
  margin: 0 0 1rem 0;
}

.vec-demo__text a {
  color: #213eff;
}

.vec-demo__divider {
  height: 1px;
  margin: 3rem 0 3rem;

  border: 0;
  background-image: linear-gradient(to right, #d9eff4, #999894, #d9eff4);
}

.vec-demo__locales {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 0.9rem;
}

.vec-demo__locales-text {
  margin-right: 0.5rem;
}

.vec-demo__locales-button {
  margin: 0 0.25rem;
  padding: 0.2rem 0.6rem;

  cursor: pointer;

  color: white;
  border: none;
  border-radius: 0.25rem;
  background-color: #415aff;

  font-size: 0.8rem;
}

.vec-demo__locales-button:hover {
  background-color: #213eff;
}

.vec-demo__locales-button:disabled {
  pointer-events: none;

  background-color: #999894;
}

/* phantom */
.vec-demo__phantom {
  position: absolute;

  opacity: 0.2;
  color: #bfdee3;
}
</style>
