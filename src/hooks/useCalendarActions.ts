import dayjs, { makeEsIdFromStartsAt } from '../lib/dayjs';
import {
  VecDateId,
  VecEvent,
  VecCalendarState,
  VecEventsState,
  VecChoosingDatesState,
  VecFocusedEventState,
  VecDefaultTime
} from '../index';
import { buildEventOnThisDays, sortEvents } from './useEventActions';

export function getRangeBetweenEventDates(startsAt: Date, finishesAt: Date) {
  return Math.abs(dayjs(startsAt).diff(finishesAt, 'days'));
}

export function makeFormatDayDD(dayId: string | number) {
  return +dayId < 10 ? '0' + dayId : dayId.toString();
}

export function setValueToDate(
  calendarState: VecCalendarState,
  date: Date | VecDateId | null,
  options: object
) {
  const ids =
    date instanceof Date
      ? {
          monthId: dayjs(date).format('YYYYMM'),
          dayId: dayjs(date).format('DD')
        }
      : date!;
  const monthIdx = calendarState.months.findIndex((m) => m.id === ids.monthId);

  if (calendarState.months[monthIdx]) {
    const day = calendarState.months[monthIdx].days[+ids.dayId - 1];
    Object.assign(day, options);
  }
}

export function setValueToEventDates(
  calendarState: VecCalendarState,
  event: VecEvent,
  options: { [key: string]: null | string | boolean | number }
) {
  const range = getRangeBetweenEventDates(event.startsAt!, event.finishesAt!);
  for (let d = 0; d <= range; d++) {
    const day = dayjs(event.startsAt!).add(d, 'day').toDate();
    setValueToDate(calendarState, day, options);
  }
}

export function removeEventFromCalendar(
  calendarState: VecCalendarState,
  event: VecEvent
) {
  const range = getRangeBetweenEventDates(event.startsAt!, event.finishesAt!);
  for (let d = 0; d <= range; d++) {
    const day = dayjs(event.startsAt!).add(d, 'day').toDate();
    setValueToDate(calendarState, day, {
      es_id: null,
      editing: false
    });
  }
}

export function nullifyChoosingDatesState(
  choosingDatesState: VecChoosingDatesState
) {
  Object.assign(choosingDatesState, {
    startsAtId: null,
    finishesAtId: null
  });
}

// CALENDAR ACTIONS
export function useCalendarActions(
  calendarState: VecCalendarState,
  eventsState: VecEventsState,
  choosingDatesState: VecChoosingDatesState,
  focusedEventState: VecFocusedEventState
) {
  /*
  HELPERS
  */
  const isDaysInRangeAlreadyScheduled = (
    startsAt: Date,
    finishesAt: Date
  ): boolean => {
    const rangeDays = () => {
      const datesArray = [];
      const daysAmount = getRangeBetweenEventDates(startsAt, finishesAt);
      for (let d = 0; d <= daysAmount; d++) {
        datesArray.push(dayjs(startsAt).add(d, 'day').toDate());
      }
      return datesArray;
    };

    const allDates = dayjs(startsAt).isSame(finishesAt, 'day')
      ? [startsAt, finishesAt]
      : rangeDays();

    return allDates.some((d) => {
      const monthId = dayjs(d).format('YYYYMM');
      const dayId = dayjs(d).format('D');

      const monthIdx = calendarState.months.findIndex((m) => m.id === monthId);

      const exists =
        !!calendarState.months[monthIdx] &&
        !!calendarState.months[monthIdx].days[+dayId - 1]?.es_id;
      return exists;
    });
  };

  const calendarFillEvent = (event: VecEvent): void => {
    if (!event.startsAt || !event.finishesAt) return;

    setValueToEventDates(calendarState, event, {
      es_id: makeEsIdFromStartsAt(event.startsAt),
      editing: event.editing || false
    });
  };

  const cleanChooseOptionOnDates = (): void => {
    for (const date in choosingDatesState) {
      setValueToDate(
        calendarState,
        choosingDatesState[date as keyof VecChoosingDatesState],
        {
          choosing: false
        }
      );
    }
  };

  /*
    ACTIONS
  */
  const calendarFillEvents = (): void => {
    eventsState.value.forEach((event: VecEvent) => {
      calendarFillEvent(event);
    });
  };

  const setEventOnChoosingDays = (defaultTimeState: VecDefaultTime): void => {
    const event: VecEvent = buildEventOnThisDays(
      choosingDatesState,
      defaultTimeState
    );
    cleanChooseOptionOnDates();
    nullifyChoosingDatesState(choosingDatesState);

    if (!isDaysInRangeAlreadyScheduled(event.startsAt!, event.finishesAt!)) {
      eventsState.value.push(event);
      sortEvents(eventsState);
      calendarFillEvent(event);
      focusedEventState.value = event;
    }
  };

  return {
    calendarFillEvents,
    setEventOnChoosingDays
  };
}
