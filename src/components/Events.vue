<template>
  <div class="vec-events__wrapper">
    <vec-default-time-component />
    <div class="vec-events">
      <vec-event-component
        v-for="event in events"
        :key="`es-id-${event.es_id}`"
        :event="event"
        :saveEventFn="saveEventFn"
        :editEventFn="editEventFn"
        :removeEventFn="removeEventFn"
        :eventComponent="eventComponent"
      />
    </div>
  </div>
</template>
<script lang="ts">
import VecDefaultTimeComponent from './DefaultTime.vue';
import VecEventComponent from './Event.vue';

import {
  defineComponent,
  inject,
  watch,
  nextTick,
  type Component,
  type PropType,
  type Ref,
} from 'vue';
import type { VecEvent, VecFocusedEventState } from '../types/internal';
import type { EditEventFn, RemoveEventFn, SaveEventFn } from '../types/public';

export default defineComponent({
  name: 'VECEvents',
  components: {
    VecDefaultTimeComponent,
    VecEventComponent,
  },
  props: {
    editEventFn: {
      type: Function as PropType<EditEventFn>,
      required: true,
    },
    saveEventFn: {
      type: Function as PropType<SaveEventFn>,
      required: true,
    },
    removeEventFn: {
      type: Function as PropType<RemoveEventFn>,
      required: true,
    },
    eventComponent: {
      type: [Object, Function] as PropType<Component>,
      default: undefined,
    },
  },
  setup() {
    const events = inject('eventsState') as Ref<VecEvent[]>;
    const focusedEventState: VecFocusedEventState =
      inject('focusedEventState')!;

    watch(focusedEventState, (next) => {
      if (!next) return;

      nextTick(() => {
        const eventCardElem = document.getElementById(
          `vec-es-id-${next.es_id}`,
        ) as HTMLDivElement | undefined;
        eventCardElem?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      });
    });

    return {
      events,
    };
  },
});
</script>
