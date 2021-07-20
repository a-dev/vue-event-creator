import { buildMonthsForCalendarState } from '../../src/hooks/calendarBuildActions';
import { VecEvent } from '../../src/index';
import { makeEsIdFromStartsAt } from '../../src/lib/dayjs';

const createEventsWithDates = (
  datesArray: string[],
  defaultTime: string = '10:00*17:00'
): VecEvent[] => {
  return datesArray.map((dates, index) => {
    const [start, finish] = dates.split(':');
    const [startsAtTime, finishesAtTime] = defaultTime.split('*');

    return {
      id: index,
      es_id: makeEsIdFromStartsAt(new Date(start)),
      startsAt: new Date(`${start}T${startsAtTime}`),
      finishesAt: new Date(`${finish}T${finishesAtTime}`)
    };
  });
};

const July2021CalendarState = (events: VecEvent[] = []) => {
  const months = buildMonthsForCalendarState(new Date('2021-07-01'), [], 3);
  return { months };
};

export { createEventsWithDates, July2021CalendarState };
