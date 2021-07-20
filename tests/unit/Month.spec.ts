import Month from '../../src/components/Month.vue';
import { mount } from '@vue/test-utils';
import { setDayJsLang } from '../../src/lib/dayjs';

const initialDayData = {
  id: 0,
  es_id: null,
  editing: false,
  choosing: false,
  options: null
};

const days = new Array(31).fill({}).map((_, index) => {
  return { ...initialDayData, id: index + 1 };
});

const firstDayOfMonth = new Date('2021-07-01');

const monthData = {
  firstDayOfMonth: firstDayOfMonth,
  id: '202107',
  shift: firstDayOfMonth.getDay(),
  days: days
};

describe('Month is created and filled', () => {
  test('The month is July 2021 and the first day is Friday', () => {
    setDayJsLang('en');
    const wrapper = mount(Month, {
      props: {
        month: { ...monthData }
      },
      global: {
        provide: {
          choosingDatesState: {},
          focusedEventState: {}
        }
      }
    });
    expect(wrapper.find('.vec-month__title').text()).toBe('July 2021');
    expect(wrapper.find('.vec-month__days').attributes('style')).toBe(
      '--vec-month-first-day-shift: 5;'
    );
  });
});
