import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createEventsWithDates } from './utils';
import VueEventCreator from '../../src/VueEventCreator.vue';
import dayjs from '../../src/lib/dayjs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { RemoveEventFn, SavedEvent } from '../../src/types/public';

enableAutoUnmount(afterEach);

describe('Load components', () => {
  test('Load components without any props — everything by default: calendar from today month, no events, default time', async () => {
    const wrapper = mount(VueEventCreator);
    expect(wrapper.find('.vec-loader__wrapper').exists()).toBe(true);
    await nextTick();
    expect(wrapper.find('.vec-loader__wrapper').exists()).toBe(false);

    const monthName = dayjs(new Date()).format('MMMM YYYY');
    expect(wrapper.find('.vec-month__title').text()).toBe(monthName);
    expect(wrapper.findAll('.vec-event')).toHaveLength(0);
    const timeInputs = wrapper.findAll('input');
    expect(timeInputs[0].element.value).toBe('10:00');
    expect(timeInputs[1].element.value).toBe('17:00');
  });

  test('Load components with events', async () => {
    const events = createEventsWithDates(
      ['2021-07-05:2021-07-05', '2021-10-29:2021-11-05'],
      '11:00*14:00',
    );
    const wrapper = mount(VueEventCreator, {
      props: {
        getEventsFn: async () => {
          return events.map((e) => {
            return {
              id: e.id!,
              startsAt: e.startsAt,
              finishesAt: e.finishesAt,
            };
          });
        },
      },
    });
    await nextTick();
    expect(wrapper.findAll('.vec-month')).toHaveLength(5);
    expect(wrapper.findAll('.vec-event')).toHaveLength(2);
    expect(wrapper.findAll('.vec-day_scheduled')).toHaveLength(9); // days in two events
  });

  test('Shows a recoverable error when loading events rejects', async () => {
    const wrapper = mount(VueEventCreator, {
      props: {
        getEventsFn: async () => {
          throw new Error('Events are temporarily unavailable');
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('.vec-loader__wrapper').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Events are temporarily unavailable',
    );
  });

  test.each([
    {
      name: 'reversed dates',
      events: [
        {
          id: 1,
          startsAt: new Date('2021-07-10T10:00:00.000Z'),
          finishesAt: new Date('2021-07-09T17:00:00.000Z'),
        },
      ],
    },
    {
      name: 'overlapping dates',
      events: [
        {
          id: 1,
          startsAt: new Date('2021-07-10T10:00:00.000Z'),
          finishesAt: new Date('2021-07-12T17:00:00.000Z'),
        },
        {
          id: 2,
          startsAt: new Date('2021-07-12T10:00:00.000Z'),
          finishesAt: new Date('2021-07-14T17:00:00.000Z'),
        },
      ],
    },
    {
      name: 'invalid dates',
      events: [
        {
          id: 1,
          startsAt: new Date('invalid'),
          finishesAt: new Date('2021-07-12T17:00:00.000Z'),
        },
      ],
    },
  ])('Rejects loaded events with $name', async ({ events }) => {
    const wrapper = mount(VueEventCreator, {
      props: {
        getEventsFn: async () => events,
      },
    });

    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toMatch(
      /invalid|overlap|earlier/i,
    );
    expect(wrapper.findAll('.vec-event')).toHaveLength(0);
  });

  test('Updates locale and default time when props change', async () => {
    const wrapper = mount(VueEventCreator, {
      props: {
        firstDate: new Date('2021-07-01T00:00:00.000Z'),
      },
    });
    await flushPromises();

    await wrapper.setProps({
      language: 'ru',
      defaultTime: {
        startsAtTime: '09:15',
        finishesAtTime: '16:45',
      },
    });
    await nextTick();

    expect(wrapper.get('.vec-calendar__header').text()).toBe('пнвтсрчтптсбвс');
    expect(wrapper.get('.vec-events-dt__prompt').text()).toBe(
      'Время по умолчанию для новых событий',
    );
    const timeInputs = wrapper.findAll<HTMLInputElement>('input[type="time"]');
    expect(timeInputs[0].element.value).toBe('09:15');
    expect(timeInputs[1].element.value).toBe('16:45');
  });

  test('Keeps differently localized instances independent', async () => {
    const english = mount(VueEventCreator, { props: { language: 'en' } });
    const russian = mount(VueEventCreator, { props: { language: 'ru' } });
    await flushPromises();

    expect(english.get('.vec-events-dt__prompt').text()).toBe(
      'The default time sets for new events',
    );
    expect(russian.get('.vec-events-dt__prompt').text()).toBe(
      'Время по умолчанию для новых событий',
    );

    await english.setProps({ monthsOnPage: 4 });
    expect(english.get('.vec-events-dt__prompt').text()).toBe(
      'The default time sets for new events',
    );
  });

  test('Preserves consumer input and treats zero as a saved event ID', async () => {
    const original: SavedEvent<{ title: string }> = {
      id: 0,
      startsAt: new Date('2021-07-05T10:00:00.000Z'),
      finishesAt: new Date('2021-07-05T17:00:00.000Z'),
      data: Object.freeze({ title: 'Zero ID event' }),
    };
    const events = Object.freeze([original]);
    const removeEventFn = vi.fn<RemoveEventFn>(async () => {});
    const wrapper = mount(VueEventCreator, {
      attachTo: document.body,
      props: {
        firstDate: new Date('2021-07-01T00:00:00.000Z'),
        getEventsFn: async () => [...events],
        removeEventFn,
      },
    });
    await flushPromises();

    const event = wrapper.get('.vec-event');
    await userEvent.click(event.findAll('button')[0].element);
    await userEvent.click(
      event.findAll('.vec-guard-alert__buttons button')[1].element,
    );
    await flushPromises();

    expect(removeEventFn).toHaveBeenCalledWith({
      id: 0,
      startsAt: new Date('2021-07-05T10:00:00.000Z'),
      finishesAt: new Date('2021-07-05T17:00:00.000Z'),
      data: { title: 'Zero ID event' },
    });
    expect(events).toEqual([original]);
    expect(original.data).toEqual({ title: 'Zero ID event' });
  });

  test('Creates a one-day draft with keyboard input', async () => {
    const wrapper = mount(VueEventCreator, {
      attachTo: document.body,
      props: {
        firstDate: new Date('2021-07-01T00:00:00.000Z'),
      },
    });
    await flushPromises();

    const day = wrapper.findAll('.vec-day')[14];
    expect(day.element.tagName).toBe('BUTTON');
    expect(day.attributes('aria-label')).toBe('2021-07-15');

    (day.element as HTMLElement).focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(day.classes()).toContain('vec-day_choosing'));
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() =>
      expect(wrapper.findAll('.vec-event')).toHaveLength(1),
    );

    expect(wrapper.get('.vec-event').classes()).toContain('vec-event_editing');
  });

  test('Rebuilds the calendar when firstDate or monthsOnPage change', async () => {
    const wrapper = mount(VueEventCreator, {
      props: {
        firstDate: new Date('2021-07-01T00:00:00.000Z'),
        monthsOnPage: 2,
      },
    });
    await flushPromises();

    expect(wrapper.findAll('.vec-month')).toHaveLength(2);
    expect(wrapper.get('.vec-month__title').text()).toBe('July 2021');

    await wrapper.setProps({ monthsOnPage: 4 });
    expect(wrapper.findAll('.vec-month')).toHaveLength(4);

    await wrapper.setProps({ firstDate: new Date('2022-03-01T00:00:00.000Z') });
    expect(wrapper.get('.vec-month__title').text()).toBe('March 2022');
    expect(wrapper.findAll('.vec-month')).toHaveLength(4);
  });

  test('Keeps event focus scoped to the instance that owns the day', async () => {
    const getEventsFn = async () => [
      {
        id: 1,
        startsAt: new Date('2021-07-05T10:00:00.000Z'),
        finishesAt: new Date('2021-07-05T17:00:00.000Z'),
      },
    ];
    const props = {
      firstDate: new Date('2021-07-01T00:00:00.000Z'),
      getEventsFn,
    };
    const first = mount(VueEventCreator, { attachTo: document.body, props });
    const second = mount(VueEventCreator, { attachTo: document.body, props });
    await flushPromises();

    const focusedDayOf = (wrapper: typeof first) =>
      wrapper.findAll('.vec-day_focused');

    // Native clicks: two full calendars do not both fit in the viewport, and
    // the assertion is about the document listener, not pointer mechanics.
    (first.get('[data-es-id="20210705"]').element as HTMLElement).click();
    await vi.waitFor(() => expect(focusedDayOf(first)).toHaveLength(1));

    // The same date exists in the other instance; its day must not keep the
    // first instance focused, and clicking it must not focus both calendars.
    (second.get('[data-es-id="20210705"]').element as HTMLElement).click();
    await vi.waitFor(() => expect(focusedDayOf(first)).toHaveLength(0));
    expect(focusedDayOf(second)).toHaveLength(1);
  });

  test('Removes pending document listeners when unmounted', async () => {
    const removeListener = vi.spyOn(document, 'removeEventListener');
    const wrapper = mount(VueEventCreator, {
      attachTo: document.body,
      props: {
        firstDate: new Date('2021-07-01T00:00:00.000Z'),
      },
    });
    await flushPromises();

    (wrapper.findAll('.vec-day')[14].element as HTMLElement).focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(wrapper.findAll('.vec-day')[14].classes()).toContain(
        'vec-day_choosing',
      );
    });
    wrapper.unmount();

    expect(removeListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
});
