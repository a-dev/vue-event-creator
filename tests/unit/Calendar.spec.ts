import VueEventCreator from '../../src/VueEventCreator.vue';
import { enableAutoUnmount, mount, flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';

enableAutoUnmount(afterEach);

describe('Calendar data initialize', () => {
  test('Calendar is created with determent first date', async () => {
    const wrapper = mount(VueEventCreator, {
      attachTo: document.body,
      props: {
        // Started at February 2014 (leap-year)
        firstDate: new Date('February 24, 2014 00:00:00'),
      },
    });
    await flushPromises();

    const titleElem = wrapper.find('.vec-month__title');
    const daysList = wrapper.find('.vec-month__days');

    expect(titleElem.text()).toBe('February 2014');
    expect(daysList.findAll('.vec-day')).toHaveLength(28);
  });

  test('Clicks on buttons which add +3 months before and after', async () => {
    const wrapper = mount(VueEventCreator, {
      attachTo: document.body,
      props: {
        firstDate: new Date('February 24, 2014 00:00:00'),
      },
    });
    await flushPromises();

    expect(wrapper.find('.vec-month__title').text()).toBe('February 2014');
    expect(wrapper.findAll('.vec-month')).toHaveLength(3);

    const buttonBefore = wrapper.find('.vec-months__shift_before');
    const buttonAfter = wrapper.find('.vec-months__shift_after');

    expect(buttonBefore.text()).toBe('More before');
    expect(buttonAfter.text()).toBe('More after');

    await wrapper.get('.vec-calendar__switcher').trigger('click');
    await userEvent.click(buttonBefore.element);
    await userEvent.click(buttonAfter.element);

    expect(wrapper.vm.calendarState.months.length).toBe(9);

    expect(wrapper.findAll('.vec-month')).toHaveLength(9);
    expect(wrapper.find('.vec-month__title').text()).toBe('November 2013');

    const allMonths = Array.from(wrapper.findAll('.vec-month__title'));
    expect(allMonths[allMonths.length - 1].text()).toBe('July 2014');
  });
});

describe('Saved events are marked across the whole calendar', () => {
  // The reported fixture: a late-May event and a September event, three
  // elapsed months apart but four calendar months apart.
  const savedEvents = [
    {
      id: 1,
      startsAt: new Date(2026, 4, 22, 11),
      finishesAt: new Date(2026, 4, 24, 16),
    },
    {
      id: 2,
      startsAt: new Date(2026, 8, 4, 11),
      finishesAt: new Date(2026, 8, 6, 16),
    },
  ];

  const mountWithSavedEvents = async () => {
    const wrapper = mount(VueEventCreator, {
      attachTo: document.body,
      props: {
        firstDate: new Date(2026, 8, 5),
        getEventsFn: async () => savedEvents.map((event) => ({ ...event })),
      },
    });
    await flushPromises();
    return wrapper;
  };

  const pressedStates = (
    wrapper: Awaited<ReturnType<typeof mountWithSavedEvents>>,
    labels: string[],
  ) =>
    labels.map((label) =>
      wrapper.get(`[aria-label="${label}"]`).attributes('aria-pressed'),
    );

  test('September days are present and marked without expanding the calendar', async () => {
    const wrapper = await mountWithSavedEvents();

    const titles = wrapper
      .findAll('.vec-month__title')
      .map((title) => title.text());
    expect(titles).toContain('September 2026');

    expect(
      pressedStates(wrapper, ['2026-09-04', '2026-09-05', '2026-09-06']),
    ).toEqual(['true', 'true', 'true']);
    expect(
      wrapper.get('[aria-label="2026-09-07"]').attributes('aria-pressed'),
    ).toBe('false');
    expect(wrapper.findAll('.vec-event')).toHaveLength(2);
  });

  test('Expanding the calendar marks saved events in the new months', async () => {
    const wrapper = await mountWithSavedEvents();
    await wrapper.get('.vec-calendar__switcher').trigger('click');

    await userEvent.click(wrapper.find('.vec-months__shift_before').element);

    const titles = wrapper
      .findAll('.vec-month__title')
      .map((title) => title.text());
    expect(titles).toContain('February 2026');
    // Previously marked days keep their state after the calendar grows.
    expect(
      pressedStates(wrapper, [
        '2026-05-22',
        '2026-05-24',
        '2026-09-04',
        '2026-09-06',
      ]),
    ).toEqual(['true', 'true', 'true', 'true']);
    expect(wrapper.findAll('.vec-event')).toHaveLength(2);
  });
});
