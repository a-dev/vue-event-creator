import type { Ref } from 'vue';
import type { DefaultTime, EditableEvent, EventId, SavedEvent } from './public';

export interface VecDayData {
  id: number;
  es_id: number | null;
  choosing: boolean;
  editing: boolean;
}

export type VecDayOptions = Record<string, string | number | boolean | null>;

export interface VecMonthWithDates {
  firstDayOfMonth: Date;
  id: string;
  shift: number;
  days: VecDayData[];
}

export interface VecCalendarState {
  months: VecMonthWithDates[];
}

export type VecDayId = string | number;
export type VecMonthId = string | number;

export interface VecDateId {
  monthId: VecMonthId;
  dayId: VecDayId;
}

export interface VecEvent<
  TData extends object = Record<string, unknown>,
> extends EditableEvent<TData> {
  es_id: number | null;
  editing?: boolean;
}

export type VecEventsState<TData extends object = Record<string, unknown>> =
  Ref<VecEvent<TData>[]>;

export interface VecChoosingDatesState {
  startsAtId: VecDateId | null;
  finishesAtId: VecDateId | null;
}

export type VecFocusedEventState = Ref<{ es_id: number | null } | null>;

export type VecGuardAlertState = 'hidden' | 'shown';

export type VecDefaultTime = DefaultTime;

export function toInternalEvent<TData extends object = Record<string, unknown>>(
  event: SavedEvent<TData>,
  esId: number,
): VecEvent<TData> {
  return {
    id: event.id,
    startsAt: new Date(event.startsAt),
    finishesAt: new Date(event.finishesAt),
    data: event.data,
    es_id: esId,
  };
}

export function toEditableEvent<TData extends object = Record<string, unknown>>(
  event: VecEvent<TData>,
): EditableEvent<TData> {
  return {
    id: event.id,
    startsAt: new Date(event.startsAt),
    finishesAt: new Date(event.finishesAt),
    data: event.data,
  };
}

export function toSavedEvent<TData extends object = Record<string, unknown>>(
  event: VecEvent<TData> & { id: EventId },
): SavedEvent<TData> {
  return toEditableEvent(event) as SavedEvent<TData>;
}
