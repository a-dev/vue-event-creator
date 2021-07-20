import {
  VecEvent,
  VecEventsState,
  VecCalendarState,
  VecChoosingDatesState,
  VecDefaultTime,
  VecDayOptions
} from '../index';
import { inject } from 'vue';
import dayjs from '../lib/dayjs';
import {
  removeEventFromCalendar,
  setValueToEventDates,
  makeFormatDayDD
} from './useCalendarActions';

export function buildEventOnThisDays(
  choosingDatesState: VecChoosingDatesState,
  defaultTimeState: VecDefaultTime
): VecEvent {
  let startsAtDayId = `${
    choosingDatesState.startsAtId!.monthId
  }${makeFormatDayDD(choosingDatesState.startsAtId!.dayId)}`;
  let finishesAtDayId = `${
    choosingDatesState.finishesAtId!.monthId
  }${makeFormatDayDD(choosingDatesState.finishesAtId!.dayId)}`;

  if (+startsAtDayId > +finishesAtDayId) {
    // swap dates if finishesAt early than startsAt
    [startsAtDayId, finishesAtDayId] = [finishesAtDayId, startsAtDayId];
  }

  // debugger;
  return {
    id: null,
    es_id: +startsAtDayId,
    startsAt: dayjs(
      startsAtDayId + `${defaultTimeState.startsAtTime}`,
      'YYYYMMDDHH:mm'
    ).toDate(),
    finishesAt: dayjs(
      finishesAtDayId + `${defaultTimeState.finishesAtTime}`,
      'YYYYMMDDHH:mm'
    ).toDate(),
    editing: true
  };
}

export function sortEvents(events: VecEventsState) {
  events.value = events.value.sort((a: VecEvent, b: VecEvent) => {
    return a.es_id! - b.es_id!;
  });
}

export function useEventActions(
  eventsState: VecEventsState,
  calendarState: VecCalendarState
) {
  const removeEventAction = (event: VecEvent) => {
    eventsState.value = eventsState.value.filter(
      (e: VecEvent) => e.es_id !== event.es_id
    );
    sortEvents(eventsState);
    removeEventFromCalendar(calendarState, event);
  };

  const updateEventInTheState = (event: VecEvent, options: any) => {
    const ctxEvent = eventsState.value.find((e) => e.es_id === event.es_id);
    Object.assign(ctxEvent, { ...event, ...options });
  };

  const toggleEventEditAction = (event: VecEvent, options: VecDayOptions) => {
    setValueToEventDates(calendarState, event, options);
  };

  return {
    removeEventAction,
    updateEventInTheState,
    toggleEventEditAction
  };
}
