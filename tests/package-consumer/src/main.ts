import { createApp, defineComponent, h, ref, type PropType } from 'vue';
import VueEventCreator, {
  type SavedEvent,
  type VueEventCreatorProps,
} from 'vue-event-creator';
import 'vue-event-creator/style.css';

interface ConsumerEventData extends Record<string, unknown> {
  title: string;
}

const event: SavedEvent<ConsumerEventData> = {
  id: 0,
  startsAt: new Date('2026-09-04T10:00:00'),
  finishesAt: new Date('2026-09-04T17:00:00'),
  data: { title: 'Package smoke test' },
};

const props: VueEventCreatorProps<ConsumerEventData> = {
  firstDate: new Date('2026-09-01T00:00:00.000Z'),
  getEventsFn: async () => [event],
  saveEventFn: async (nextEvent) => ({ ...nextEvent, id: nextEvent.id ?? 1 }),
  removeEventFn: async () => {},
  eventComponent: defineComponent({
    props: {
      eventData: {
        type: Object as PropType<ConsumerEventData>,
        default: () => ({ title: 'Package draft' }),
      },
      isEventEditing: { type: Boolean, default: false },
    },
    emits: ['update:eventData'],
    setup(componentProps, { emit }) {
      const title = ref(
        String(componentProps.eventData.title ?? 'Package draft'),
      );
      const update = () => emit('update:eventData', { title: title.value });
      update();
      return () =>
        componentProps.isEventEditing
          ? h('label', [
              'Package title',
              h('input', {
                'aria-label': 'Package title',
                value: title.value,
                onInput: (event: Event) => {
                  title.value = (event.target as HTMLInputElement).value;
                  update();
                },
              }),
            ])
          : h('strong', title.value);
    },
  }),
};

createApp({
  render: () => h(VueEventCreator, props as Record<string, unknown>),
}).mount('#app');
