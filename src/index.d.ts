import { Ref } from 'vue';

export type VecLanguageLocale = 'en' | 'es' | 'ru';

export interface VecDayData {
  id: number;
  es_id: null | number;
  choosing: boolean;
  editing: boolean;
}

type VecDayOptions = { [key: string]: string | number | boolean | null };

export interface VecMonthWithDates {
  firstDayOfMonth: Date;
  id: string;
  shift: number;
  days: VecDayData[];
}

export interface VecCalendarState {
  months: VecMonthWithDates[];
}

export type VecEventId = null | string | number;
export type VecDayId = string | number;
export type VecMonthId = string | number;
export type VecDateId = { monthId: VecMonthId; dayId: VecDayId };

export interface VecEventBackend {
  id: string | number;
  startsAt: Date;
  finishesAt: Date;
  data?: object;
}

export interface VecEvent
  extends Omit<VecEventBackend, 'id' | 'startsAt' | 'finishesAt'> {
  id: undefined | null | string | number;
  es_id: null | number; // event start id, format YYYYMMDD
  startsAt: Date;
  finishesAt: Date;
  data?: object;
  editing?: boolean;
}

export type VecEventsState = Ref<VecEvent[] | VecEvent[]>;

export interface VecChoosingDatesState {
  startsAtId: VecDateId | null;
  finishesAtId: VecDateId | null;
}

type VecFocusedEventState = Ref<null> | Ref<{ es_id: null | number }>;

export interface VecDefaultTime {
  startsAtTime: string;
  finishesAtTime: string;
}

export type VecGuardAlertState = 'hidden' | 'shown';
