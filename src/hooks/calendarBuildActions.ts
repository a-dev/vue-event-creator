import dayjs from '../lib/dayjs';

import {
  VecDayData,
  VecCalendarState,
  VecMonthWithDates,
  VecEvent
} from '../index';

const initalDayData: VecDayData = {
  id: 0,
  es_id: null,
  editing: false,
  choosing: false
};

export function calculateFirstDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function calculateMonthWithShift(date: Date, monthShift: number): Date {
  const clonedDate = new Date(date.getTime());
  return new Date(clonedDate.setMonth(clonedDate.getMonth() + monthShift));
}

export function formattedMonth(month: Date) {
  return dayjs(month).format('YYYYMM');
}

export function createDaysList(month: Date) {
  const numberOfDays: number = dayjs(month).daysInMonth();
  return Array.from({ length: numberOfDays }, (_, index) => {
    return { ...initalDayData, ...{ id: index + 1 } };
  });
}

export function calculateMonthsAndDays(
  months: VecMonthWithDates[] = [],
  firstMonth: Date,
  lastMonth: Date
): VecMonthWithDates[] {
  const month = calculateMonthWithShift(firstMonth, months.length);
  const days = createDaysList(month);

  const monthData: VecMonthWithDates = {
    firstDayOfMonth: month,
    id: formattedMonth(month),
    shift: month.getDay(), // first day in the week
    days
  };
  months.push(monthData);

  if (!dayjs(month).isSame(lastMonth, 'month'))
    calculateMonthsAndDays(months, firstMonth, lastMonth);
  return months;
}

export function buildMonthsForCalendarState(
  firstDay: Date,
  events: VecEvent[],
  monthsOnPage: number
): VecMonthWithDates[] {
  let firstMonth, lastMonth;
  if (events.length) {
    const firstEventstartsAt =
      dayjs(events[0].startsAt).isAfter(firstDay, 'month') &&
      dayjs(events[0].startsAt).isBefore(
        dayjs(firstDay).add(3, 'month'),
        'month'
      )
        ? firstDay
        : events[0].startsAt!;

    firstMonth = new Date(calculateFirstDayOfMonth(firstEventstartsAt));
    const lastEventfinishesAt = events[events.length - 1].finishesAt!;
    if (
      Math.abs(dayjs(firstEventstartsAt).diff(lastEventfinishesAt, 'month')) >
      monthsOnPage
    ) {
      lastMonth = new Date(calculateFirstDayOfMonth(lastEventfinishesAt));
    } else {
      lastMonth = dayjs(firstEventstartsAt).add(monthsOnPage, 'month').toDate();
    }
  } else {
    firstMonth = new Date(calculateFirstDayOfMonth(firstDay));
    lastMonth = dayjs(firstDay)
      .add(monthsOnPage - 1, 'month')
      .toDate();
  }

  const months = calculateMonthsAndDays([], firstMonth, lastMonth);

  return months;
}

export function calendarAddMonths(
  calendarState: VecCalendarState,
  direction: string,
  amount: number = 2
): VecMonthWithDates[] {
  let firstMonth, lastMonth;
  if (direction === 'after') {
    firstMonth = dayjs(
      calendarState.months[calendarState.months.length - 1].firstDayOfMonth
    ).add(1, 'month');
    lastMonth = dayjs(firstMonth).add(amount, 'month');
  } else {
    lastMonth = dayjs(calendarState.months[0].firstDayOfMonth).add(-1, 'month');
    firstMonth = dayjs(lastMonth).add(-Math.abs(amount), 'month');
  }
  const months = calculateMonthsAndDays(
    [],
    firstMonth.toDate(),
    lastMonth.toDate()
  );

  return direction == 'before'
    ? months.concat(calendarState.months)
    : calendarState.months.concat(months);
}
