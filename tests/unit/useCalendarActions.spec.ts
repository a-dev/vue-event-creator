import {
  makeFormatDayDD,
  getRangeBetweenEventDates,
  setValueToDate,
  setValueToEventDates,
  removeEventFromCalendar,
  useCalendarActions,
  nullifyChoosingDatesState
} from '../../src/hooks/useCalendarActions';
import { ref } from 'vue';
import { July2021CalendarState, createEventsWithDates } from './utils';

test('Show how many days are between two dates (Date type used)', () => {
  expect(
    getRangeBetweenEventDates(new Date('2021-07-01'), new Date('2021-07-10'))
  ).toBe(9);
});

test("Make day's format with two digits", () => {
  expect(makeFormatDayDD('1')).toBe('01');
  expect(makeFormatDayDD(2)).toBe('02');
  expect(makeFormatDayDD(22)).toBe('22');
});

test('Nullify a choosing state', () => {
  const choosingDatesState = {
    startsAtId: { monthId: '202109', dayId: '10' },
    finishesAtId: { monthId: '202109', dayId: '12' }
  };
  nullifyChoosingDatesState(choosingDatesState);
  expect(choosingDatesState).toEqual({ startsAtId: null, finishesAtId: null });
});

// create states
test('Set a value to the date', () => {
  const calendarState = July2021CalendarState();
  expect(calendarState.months[0].days[19].choosing).toBe(false);
  expect(calendarState.months[0].days[19].editing).toBe(false);
  setValueToDate(calendarState, new Date('2021-07-20'), {
    choosing: true,
    editing: true
  });
  expect(calendarState.months[0].days[19].choosing).toBe(true);
  expect(calendarState.months[0].days[19].editing).toBe(true);
});

test('Set a value to the date with the VecDateId', () => {
  const calendarState = July2021CalendarState();
  expect(calendarState.months[0].days[4].editing).toBe(false);
  setValueToDate(
    calendarState,
    { monthId: '202107', dayId: '05' },
    { editing: true }
  );
  expect(calendarState.months[0].days[4].editing).toBe(true);
});

test('Set a value to the dates of event', () => {
  const events = createEventsWithDates(['2021-07-20:2021-07-25']);
  const calendarState = July2021CalendarState();
  for (let d of [19, 20, 21, 22, 23, 24]) {
    expect(calendarState.months[0].days[d].editing).toBe(false);
    expect(calendarState.months[0].days[d].es_id).toBe(null);
  }
  setValueToEventDates(calendarState, events[0], {
    editing: true,
    es_id: events[0].es_id
  });
  for (let d of [19, 20, 21, 22, 23, 24]) {
    expect(calendarState.months[0].days[d].editing).toBe(true);
    expect(calendarState.months[0].days[d].es_id).toBe(events[0].es_id);
  }
  expect(calendarState.months[0].days[18].editing).toBe(false);
  expect(calendarState.months[0].days[25].editing).toBe(false);
});

describe('Actions with event', () => {
  const calendarState = July2021CalendarState();
  const events = ref(
    createEventsWithDates(['2021-07-20:2021-07-25', '2021-08-05:2021-08-05'])
  );
  const choosingDatesState = {
    startsAtId: { monthId: '202109', dayId: '10' },
    finishesAtId: { monthId: '202109', dayId: '12' }
  };
  const focusedEventState = ref(null);
  const defaultTimeState = {
    startsAtTime: '10:00',
    finishesAtTime: '17:00'
  };
  const { calendarFillEvents, setEventOnChoosingDays } = useCalendarActions(
    calendarState,
    events,
    choosingDatesState,
    focusedEventState
  );

  test('Fill prepared events', () => {
    expect(calendarState.months[0].days[19].es_id).toBe(null);
    expect(calendarState.months[1].days[4].es_id).toBe(null);

    calendarFillEvents();
    expect(calendarState.months[0].days[19].es_id).toBe(20210720);
    expect(calendarState.months[0].days[24].es_id).toBe(20210720);
    expect(calendarState.months[1].days[4].es_id).toBe(20210805);
    expect(calendarState.months[1].days[5].es_id).toBe(null);
  });

  test('Set an event which keeps in the choosingDates state', () => {
    expect(calendarState.months[2].days[9].es_id).toBe(null);

    setEventOnChoosingDays(defaultTimeState);
    expect(calendarState.months[2].days[9].es_id).toBe(20210910);
    expect(calendarState.months[2].days[11].es_id).toBe(20210910);
  });

  test('After setting an event on dates the choosingDates state has to be nullified', () => {
    expect(choosingDatesState.startsAtId).toBe(null);
  });

  test('Remove the first event', () => {
    expect(calendarState.months[0].days[19].es_id).toBe(20210720);
    expect(calendarState.months[0].days[24].es_id).toBe(20210720);

    removeEventFromCalendar(calendarState, events.value[0]);
    expect(calendarState.months[0].days[19].es_id).toBe(null);
    expect(calendarState.months[0].days[24].es_id).toBe(null);
  });

  test('Set an event on the occupied dates', () => {
    choosingDatesState.startsAtId = { monthId: '202108', dayId: '04' };
    choosingDatesState.finishesAtId = { monthId: '202108', dayId: '05' }; // this date occupied

    expect(calendarState.months[1].days[3].es_id).toBe(null);
    setEventOnChoosingDays(defaultTimeState);
    expect(calendarState.months[1].days[3].es_id).toBe(null);

    // between this dates exists occupied date
    choosingDatesState.startsAtId = { monthId: '202108', dayId: '04' };
    choosingDatesState.finishesAtId = { monthId: '202108', dayId: '20' };

    setEventOnChoosingDays(defaultTimeState);
    expect(calendarState.months[1].days[3].es_id).toBe(null);
  });
});
