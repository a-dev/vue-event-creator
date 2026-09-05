import {
  makeFormatDayDD,
  getRangeBetweenEventDates,
  setValueToDate,
  setValueToEventDates,
  removeEventFromCalendar,
  useCalendarActions,
  nullifyChoosingDatesState,
} from '../../src/hooks/useCalendarActions';
import { calculateMonthsAndDays } from '../../src/hooks/calendarBuildActions';
import type { VecMonthWithDates } from '../../src/types/internal';
import { ref } from 'vue';
import { July2021CalendarState, createEventsWithDates } from './utils';
import { describe, expect, test } from 'vitest';

test('Show how many days are between two dates (Date type used)', () => {
  expect(
    getRangeBetweenEventDates(new Date('2021-07-01'), new Date('2021-07-10')),
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
    finishesAtId: { monthId: '202109', dayId: '12' },
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
    editing: true,
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
    { editing: true },
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
    es_id: events[0].es_id,
  });
  for (let d of [19, 20, 21, 22, 23, 24]) {
    expect(calendarState.months[0].days[d].editing).toBe(true);
    expect(calendarState.months[0].days[d].es_id).toBe(events[0].es_id);
  }
  expect(calendarState.months[0].days[18].editing).toBe(false);
  expect(calendarState.months[0].days[25].editing).toBe(false);
});

describe('Actions with event', () => {
  const setup = () => {
    const calendarState = July2021CalendarState();
    const events = ref(
      createEventsWithDates(['2021-07-20:2021-07-25', '2021-08-05:2021-08-05']),
    );
    const choosingDatesState = {
      startsAtId: { monthId: '202109', dayId: '10' },
      finishesAtId: { monthId: '202109', dayId: '12' },
    };
    const focusedEventState = ref(null);
    const defaultTimeState = {
      startsAtTime: '10:00',
      finishesAtTime: '17:00',
    };
    const actions = useCalendarActions(
      calendarState,
      events,
      choosingDatesState,
      focusedEventState,
    );

    return {
      calendarState,
      events,
      choosingDatesState,
      defaultTimeState,
      ...actions,
    };
  };

  test('Fill prepared events', () => {
    const { calendarState, calendarFillEvents } = setup();
    expect(calendarState.months[0].days[19].es_id).toBe(null);
    expect(calendarState.months[1].days[4].es_id).toBe(null);

    calendarFillEvents();
    expect(calendarState.months[0].days[19].es_id).toBe(20210720);
    expect(calendarState.months[0].days[24].es_id).toBe(20210720);
    expect(calendarState.months[1].days[4].es_id).toBe(20210805);
    expect(calendarState.months[1].days[5].es_id).toBe(null);
  });

  test('Set an event which keeps in the choosingDates state', () => {
    const { calendarState, defaultTimeState, setEventOnChoosingDays } = setup();
    calendarFillEventsFor(calendarState);
    expect(calendarState.months[2].days[9].es_id).toBe(null);

    setEventOnChoosingDays(defaultTimeState);
    expect(calendarState.months[2].days[9].es_id).toBe(20210910);
    expect(calendarState.months[2].days[11].es_id).toBe(20210910);
  });

  test('After setting an event on dates the choosingDates state has to be nullified', () => {
    const { choosingDatesState, defaultTimeState, setEventOnChoosingDays } =
      setup();
    setEventOnChoosingDays(defaultTimeState);
    expect(choosingDatesState.startsAtId).toBe(null);
  });

  test('Remove the first event', () => {
    const { calendarState, events, calendarFillEvents } = setup();
    calendarFillEvents();
    expect(calendarState.months[0].days[19].es_id).toBe(20210720);
    expect(calendarState.months[0].days[24].es_id).toBe(20210720);

    removeEventFromCalendar(calendarState, events.value[0]);
    expect(calendarState.months[0].days[19].es_id).toBe(null);
    expect(calendarState.months[0].days[24].es_id).toBe(null);
  });

  test('Set an event on the occupied dates', () => {
    const {
      calendarState,
      choosingDatesState,
      defaultTimeState,
      setEventOnChoosingDays,
      calendarFillEvents,
    } = setup();
    calendarFillEvents();
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

function calendarFillEventsFor(
  calendarState: ReturnType<typeof July2021CalendarState>,
) {
  const events = ref(
    createEventsWithDates(['2021-07-20:2021-07-25', '2021-08-05:2021-08-05']),
  );
  useCalendarActions(
    calendarState,
    events,
    { startsAtId: null, finishesAtId: null },
    ref(null),
  ).calendarFillEvents();
}

describe('Adding months fills them from the current events', () => {
  // Built directly, so this stays independent of the initial-range fix: the
  // calendar deliberately stops in August while a September event exists.
  const setupMayToAugust = () => {
    const calendarState = {
      months: calculateMonthsAndDays(
        [],
        new Date(2026, 4, 1),
        new Date(2026, 7, 1),
      ),
    };
    const events = ref(
      createEventsWithDates(['2026-05-22:2026-05-24', '2026-09-04:2026-09-06']),
    );
    const actions = useCalendarActions(
      calendarState,
      events,
      { startsAtId: null, finishesAtId: null },
      ref(null),
    );
    actions.calendarFillEvents();

    return { calendarState, events, ...actions };
  };

  const findMonth = (
    calendarState: { months: VecMonthWithDates[] },
    id: string,
  ) => calendarState.months.find((month) => month.id === id);

  test('Appended months receive the saved event ids', () => {
    const { calendarState, addMonthsToCalendar } = setupMayToAugust();
    expect(findMonth(calendarState, '202609')).toBeUndefined();

    addMonthsToCalendar('after');

    const september = findMonth(calendarState, '202609')!;
    expect(september).toBeDefined();
    expect(september.days[3].es_id).toBe(20260904);
    expect(september.days[4].es_id).toBe(20260904);
    expect(september.days[5].es_id).toBe(20260904);
    expect(september.days[6].es_id).toBe(null);
  });

  test('Prepended months receive the saved event ids', () => {
    const calendarState = {
      months: calculateMonthsAndDays(
        [],
        new Date(2026, 4, 1),
        new Date(2026, 6, 1),
      ),
    };
    const events = ref(createEventsWithDates(['2026-03-10:2026-03-12']));
    const { addMonthsToCalendar, calendarFillEvents } = useCalendarActions(
      calendarState,
      events,
      { startsAtId: null, finishesAtId: null },
      ref(null),
    );
    calendarFillEvents();

    addMonthsToCalendar('before');

    const march = findMonth(calendarState, '202603')!;
    expect(march).toBeDefined();
    expect(march.days[9].es_id).toBe(20260310);
    expect(march.days[11].es_id).toBe(20260310);
    expect(calendarState.months[0].id).toBe('202602');
  });

  test('Expanding preserves existing markers, editing and choosing state', () => {
    const { calendarState, events, addMonthsToCalendar } = setupMayToAugust();
    events.value[0].editing = true;
    setValueToDate(calendarState, new Date(2026, 6, 15), { choosing: true });

    addMonthsToCalendar('after');

    const may = findMonth(calendarState, '202605')!;
    expect(may.days[21].es_id).toBe(20260522);
    expect(may.days[23].es_id).toBe(20260522);
    expect(may.days[21].editing).toBe(true);

    expect(findMonth(calendarState, '202607')!.days[14].choosing).toBe(true);
    expect(events.value).toHaveLength(2);
    expect(calendarState.months.map((month) => month.id)).toEqual([
      ...new Set(calendarState.months.map((month) => month.id)),
    ]);
  });
});
