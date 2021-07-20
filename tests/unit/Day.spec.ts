import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import Day from '../../src/components/Day.vue';

describe('Weekend or not', () => {
  test("This day is Saturday and it's a weekend", () => {
    const focusedEventState = ref(null);
    const choosingDatesState = {
      startsAtId: null,
      finishesAtId: null
    };
    const wrapper = mount(Day, {
      props: {
        day: {
          id: 4,
          choosing: false,
          editing: false,
          es_id: 0
        },
        shift: 3,
        monthId: '202109'
      },
      global: {
        provide: {
          choosingDatesState,
          focusedEventState
        }
      }
    });
    const dayElem = wrapper.find('.vec-day');
    expect(dayElem.classes('vec-day_weekend')).toBeTruthy;
  });

  test("This day is Wednesday and it's not weekend", () => {
    const focusedEventState = ref(null);
    const choosingDatesState = {
      startsAtId: null,
      finishesAtId: null
    };
    const wrapper = mount(Day, {
      props: {
        day: {
          id: 3,
          choosing: false,
          editing: false,
          es_id: 0
        },
        shift: 3,
        monthId: '202109'
      },
      global: {
        provide: {
          choosingDatesState,
          focusedEventState
        }
      }
    });
    const dayElem = wrapper.find('.vec-day');
    expect(dayElem.classes('vec-day_weekend')).toBeFalsy;
  });
});

describe('Is the day included in the multi-day event?', () => {
  test('This is the first day of the event', () => {
    const focusedEventState = ref(null);
    const choosingDatesState = {
      startsAtId: null,
      finishesAtId: null
    };
    const wrapper = mount(Day, {
      props: {
        day: {
          id: 4,
          choosing: false,
          editing: false,
          es_id: 20210904
        },
        shift: 3,
        monthId: '202109'
      },
      global: {
        provide: {
          choosingDatesState,
          focusedEventState
        }
      }
    });

    const dayElem = wrapper.find('.vec-day');
    expect(dayElem.classes('vec-day_start-day')).toBeTruthy;
  });

  test('This is the second day of the event', () => {
    const focusedEventState = ref(null);
    const choosingDatesState = {
      startsAtId: null,
      finishesAtId: null
    };
    const wrapper = mount(Day, {
      props: {
        day: {
          id: 5,
          choosing: false,
          editing: false,
          es_id: 20210904
        },
        shift: 3,
        monthId: '202109'
      },
      global: {
        provide: {
          choosingDatesState,
          focusedEventState
        }
      }
    });

    const dayElem = wrapper.find('.vec-day');
    expect(dayElem.classes('vec-day_start-day')).toBeFalsy;
  });
});

describe('Clicks on the day', () => {
  test('Click on the day changes the state from choosing to scheduled', async () => {
    const focusedEventState = ref(null);
    const choosingDatesState = {
      startsAtId: null,
      finishesAtId: null
    };
    const wrapper = mount(Day, {
      props: {
        day: {
          id: 4,
          choosing: false,
          editing: false,
          es_id: 0
        },
        shift: 3,
        monthId: '202109'
      },
      global: {
        provide: {
          choosingDatesState,
          focusedEventState
        }
      }
    });

    const dayElem = wrapper.find('.vec-day');
    expect(dayElem.classes('vec-day_choosing')).toBeFalsy;

    await dayElem.trigger('click');
    expect(choosingDatesState.startsAtId).toEqual({
      monthId: '202109',
      dayId: 4
    });
    expect(choosingDatesState.finishesAtId).toBe(null);
    expect(dayElem.classes('vec-day_choosing')).toBeTruthy;

    await wrapper.find('.vec-day').trigger('click');
    expect(choosingDatesState.finishesAtId).toEqual({
      monthId: '202109',
      dayId: 4
    });
    expect(dayElem.classes('vec-day_choosing')).toBeFalsy;
    expect(dayElem.classes('vec-day_scheduled')).toBeTruthy;
    expect(dayElem.classes('vec-day_editing')).toBeTruthy;
  });

  test('Click on the day with a scheduled event changes a focus', async () => {
    const focusedEventState = ref(null);
    const choosingDatesState = {
      startsAtId: null,
      finishesAtId: null
    };

    const wrapper = mount(Day, {
      props: {
        day: {
          id: 4,
          choosing: false,
          editing: false,
          es_id: 20210904
        },
        shift: 3,
        monthId: '202109'
      },
      global: {
        provide: {
          choosingDatesState,
          focusedEventState
        }
      }
    });

    const dayElem = wrapper.find('.vec-day');
    expect(dayElem.classes('vec-day_focused')).toBeFalsy;

    await dayElem.trigger('click');
    expect(dayElem.classes('vec-day_focused')).toBeTruthy;
    expect(focusedEventState.value).toEqual({ es_id: 20210904 });
  });
});
