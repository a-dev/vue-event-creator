import {
  sortEvents,
  buildEventOnThisDays,
  useEventActions
} from '../../src/hooks/useEventActions';
import { useCalendarActions } from '../../src/hooks/useCalendarActions';

import { ref } from 'vue';
import { July2021CalendarState, createEventsWithDates } from './utils';

test('Sort events', () => {
  const events = ref(
    createEventsWithDates([
      '2021-09-02:2021-09-05',
      '2021-08-01:2021-08-01',
      '2021-07-10:2021-07-10'
    ])
  );
  expect(events.value[0].es_id).toBe(20210902);
  expect(events.value[1].es_id).toBe(20210801);
  sortEvents(events);
  expect(events.value[0].es_id).toBe(20210710);
  expect(events.value[2].es_id).toBe(20210902);
});

test('Build the event on the certain days', () => {
  const choosingDatesState = {
    startsAtId: { monthId: '202109', dayId: '10' },
    finishesAtId: { monthId: '202109', dayId: '12' }
  };
  const defaultTimeState = {
    startsAtTime: '10:00',
    finishesAtTime: '17:00'
  };

  const event = buildEventOnThisDays(choosingDatesState, defaultTimeState);

  expect(event).toEqual({
    id: null,
    es_id: 20210910,
    startsAt: new Date('2021-09-10T10:00:00.000Z'),
    finishesAt: new Date('2021-09-12T17:00:00.000Z'),
    editing: true
  });
});

describe('Use event actions', () => {
  const calendarState = July2021CalendarState();
  const eventsState = ref(
    createEventsWithDates([
      '2021-07-10:2021-07-10',
      '2021-08-01:2021-08-01',
      '2021-09-02:2021-09-10'
    ])
  );
  const choosingDatesState = {
    startsAtId: { monthId: '202109', dayId: '10' },
    finishesAtId: { monthId: '202109', dayId: '12' }
  };
  const focusedEventState = ref(null);
  const { calendarFillEvents } = useCalendarActions(
    calendarState,
    eventsState,
    choosingDatesState,
    focusedEventState
  );

  const { removeEventAction, toggleEventEditAction, updateEventInTheState } =
    useEventActions(eventsState, calendarState);

  calendarFillEvents();

  test('Remove the event', () => {
    const eventForRemoving = { ...eventsState.value[2] };

    expect(eventsState.value[2].es_id).toBe(20210902);
    expect(calendarState.months[2].days[1].es_id).toBe(20210902);

    removeEventAction(eventForRemoving);
    expect(eventsState.value[2]).toBe(undefined);
    expect(eventsState.value).toHaveLength(2);
    expect(calendarState.months[2].days[1].es_id).toBe(null);
  });

  test('Update the event in the state', () => {
    const eventFroUpdating = { ...eventsState.value[1] };
    expect(eventsState.value[1].data).toBe(undefined);

    updateEventInTheState(eventFroUpdating, {
      data: { title: 'Title', text: 'Text' }
    });
    expect(eventsState.value[1].data).toEqual({ title: 'Title', text: 'Text' });
  });

  test('Toggle editing state of the event', () => {
    const eventForEditing = { ...eventsState.value[0] };
    expect(calendarState.months[0].days[9].editing).toBe(false);

    toggleEventEditAction(eventForEditing, { editing: true });
    expect(calendarState.months[0].days[9].editing).toBe(true);
  });
});
