import {
  calculateFirstDayOfMonth,
  calculateMonthWithShift,
  formattedMonth,
  createDaysList,
  calculateMonthsAndDays,
  buildMonthsForCalendarState,
  calendarAddMonths
} from '../../src/hooks/calendarBuildActions';
import { createEventsWithDates } from './utils';
import { VecMonthWithDates, VecEvent } from '../../src/index';

const FIRST_OF_JULY_DATE = new Date('2021-07-01');
const FIRST_OF_JULY_ISO_STRING = '2021-07-01T00:00:00.000Z';

test('Calculate a first day of the month', () => {
  expect(calculateFirstDayOfMonth(new Date('2021-07-20')).toISOString()).toBe(
    FIRST_OF_JULY_ISO_STRING
  );
  expect(calculateFirstDayOfMonth(new Date('2021-07-02')).toISOString()).toBe(
    FIRST_OF_JULY_ISO_STRING
  );
});

test('Calculate a new month with the certain shift (ex: +1 & +4)', () => {
  expect(calculateMonthWithShift(FIRST_OF_JULY_DATE, 1).toISOString()).toBe(
    '2021-08-01T00:00:00.000Z'
  );
  expect(calculateMonthWithShift(FIRST_OF_JULY_DATE, 4).toISOString()).toBe(
    '2021-11-01T00:00:00.000Z'
  );
});

test('Format month from Date to 202107', () => {
  expect(formattedMonth(FIRST_OF_JULY_DATE)).toBe('202107');
});

test('Create array of days for a month', () => {
  const dayList = createDaysList(FIRST_OF_JULY_DATE);
  expect(dayList).toHaveLength(31);
  expect(dayList[1].id).toBe(2);
});

describe('Build calendar from July to September 2021, then check the array with an initial data', () => {
  const expectMonths = (result: VecMonthWithDates[]) => {
    expect(result).toHaveLength(3);
    expect(result[0].shift).toBe(4);
    expect(result[0].firstDayOfMonth.toISOString()).toBe(
      FIRST_OF_JULY_ISO_STRING
    );
    expect(result[0].days).toHaveLength(31);
    expect(result[0].days[1].id).toBe(2);
  };

  test('Calculate month and days function', () => {
    const result = calculateMonthsAndDays(
      [],
      FIRST_OF_JULY_DATE,
      new Date('2021-09-01')
    );
    expectMonths(result);
  });

  test('Build function', () => {
    const result = buildMonthsForCalendarState(FIRST_OF_JULY_DATE, [], 3);
    expectMonths(result);
  });
});

describe('Build the calendar skeleton based on Event data', () => {
  test('Create calendar with 4 months in the past year', () => {
    const events: VecEvent[] = createEventsWithDates([
      '2020-01-02:2020-01-02',
      '2020-02-02:2020-02-04',
      '2020-04-01:2020-04-30'
    ]);
    const result = buildMonthsForCalendarState(FIRST_OF_JULY_DATE, events, 3);
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe('202001');
    expect(result[3].id).toBe('202004');
  });

  test('Create calendar with 4 months in the future year', () => {
    const events: VecEvent[] = createEventsWithDates([
      '2025-01-02:2025-01-02',
      '2025-02-02:2025-02-04',
      '2025-04-01:2025-04-30'
    ]);
    const result = buildMonthsForCalendarState(FIRST_OF_JULY_DATE, events, 3);
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe('202501');
    expect(result[3].id).toBe('202504');
  });

  test('Create calendar with the event that will occur in the next month. It has to be 4 months with 1 month before event (based on first of July)', () => {
    const events: VecEvent[] = createEventsWithDates(['2021-08-02:2021-08-02']);
    const result = buildMonthsForCalendarState(FIRST_OF_JULY_DATE, events, 3);
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe('202107');
    expect(result[3].id).toBe('202110');
  });

  test('Create two events calendar with a difference of 12 months', () => {
    const events: VecEvent[] = createEventsWithDates([
      '2021-01-02:2021-01-02',
      '2021-12-20:2021-12-25'
    ]);
    const result = buildMonthsForCalendarState(FIRST_OF_JULY_DATE, events, 3);
    expect(result).toHaveLength(12);
    expect(result[0].id).toBe('202101');
    expect(result[11].id).toBe('202112');
  });
});

describe('Add months to the created calendar', () => {
  const calendarState = {
    months: buildMonthsForCalendarState(FIRST_OF_JULY_DATE, [], 3)
  };
  test('Add 3 months after', () => {
    const result = calendarAddMonths(calendarState, 'after');
    expect(result).toHaveLength(6);
    expect(result[0].id).toBe('202107');
    expect(result[5].id).toBe('202112');
  });
  test('Add 3 months before', () => {
    const result = calendarAddMonths(calendarState, 'before');
    expect(result).toHaveLength(6);
    expect(result[0].id).toBe('202104');
    expect(result[5].id).toBe('202109');
  });
  test('Add 6 months after', () => {
    const result = calendarAddMonths(calendarState, 'after', 5);
    expect(result).toHaveLength(9);
    expect(result[0].id).toBe('202107');
    expect(result[8].id).toBe('202203');
  });
});
