import { enableAutoUnmount, mount } from '@vue/test-utils';
import { ref, reactive } from 'vue';
import {
  VecDefaultTime,
  VecEvent,
  VecFocusedEventState,
} from '../../src/types/internal';
import { July2021CalendarState, createEventsWithDates } from './utils';

import Events from '../../src/components/Events.vue';
import { afterEach, describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';

enableAutoUnmount(afterEach);

describe('List of events with the default time component: edit & remove', () => {
  const mountEvents = () =>
    mount(Events, {
      attachTo: document.body,
      props: {
        eventComponent: {},
        saveEventFn: async () => ({
          id: 100,
          // 02–05 September 2021, 12:40–18:20
          startsAt: new Date('2021-09-02T12:40:00.000Z'),
          finishesAt: new Date('2021-09-05T18:20:00.000Z'),
        }),
        editEventFn: async () => {},
        removeEventFn: async () => {},
      },
      global: {
        provide: {
          eventsState: ref<VecEvent[]>(
            createEventsWithDates(
              ['2021-09-02:2021-09-05', '2021-10-12:2021-10-12'],
              '11:40*18:20',
            ),
          ),
          calendarState: July2021CalendarState(),
          defaultTimeState: reactive({
            startsAtTime: '10:00',
            finishesAtTime: '17:00',
          }) as VecDefaultTime,
          focusedEventState: ref(null) as VecFocusedEventState,
        },
      },
    });

  test('Change the event time to default', async () => {
    const wrapper = mountEvents();
    const event = wrapper.find('[data-vec-event-id="20210902"]');
    expect(event.exists()).toBe(true);
    expect(event.find('.vec-event__dates').text()).toBe(
      '02–05 September 2021, 11:40–18:20',
    );
    //
    const editButton = event.findAll('.vec-button')[1];
    await userEvent.click(editButton.element);
    expect(event.classes('vec-event_editing')).toBe(true);
    await userEvent.fill(
      event.findAll('.vec-event__time-input')[0].element,
      '12:40',
    );
    await userEvent.click(editButton.element);
    expect(event.find('.vec-event__dates').text()).toBe(
      '02–05 September 2021, 12:40–18:20',
    );
  });

  test('Remove event', async () => {
    const wrapper = mountEvents();
    const event = wrapper.find('[data-vec-event-id="20210902"]');
    const events = wrapper.findAll('.vec-event');
    expect(events).toHaveLength(2);

    expect(event.classes('vec-event_editing')).toBe(false);

    const removeButton = event.findAll('.vec-button')[0];
    await userEvent.click(removeButton.element);

    expect(event.find('.vec-guard-alert').exists()).toBe(true);
    const yesButton = event.findAll('.vec-guard-alert__buttons .vec-button')[1];
    await userEvent.click(yesButton.element);

    expect(wrapper.find('[data-vec-event-id="20210902"]').exists()).toBe(false);
    expect(wrapper.findAll('.vec-event')).toHaveLength(1);
  });
});
