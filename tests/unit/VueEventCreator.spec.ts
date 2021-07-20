import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createEventsWithDates } from './utils';
import VueEventCreator from '../../src/VueEventCreator.vue';
import dayjs from '../../src/lib/dayjs';

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
      '11:00*14:00'
    );
    const wrapper = mount(VueEventCreator, {
      props: {
        getEventsFn: async () => {
          return events.map((e) => {
            return { id: e.id, startsAt: e.startsAt, finishesAt: e.finishesAt };
          });
        }
      }
    });
    await nextTick();
    expect(wrapper.findAll('.vec-month')).toHaveLength(5);
    expect(wrapper.findAll('.vec-event')).toHaveLength(2);
    expect(wrapper.findAll('.vec-day_scheduled')).toHaveLength(9); // days in two events
  });
});
