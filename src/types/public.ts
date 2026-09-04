import type { Component } from 'vue';

export type LanguageLocale = 'en' | 'es' | 'ru';

export type EventId = string | number;

export interface EventData<TData extends object = Record<string, unknown>> {
  startsAt: Date;
  finishesAt: Date;
  data?: TData;
}

export interface SavedEvent<
  TData extends object = Record<string, unknown>,
> extends EventData<TData> {
  id: EventId;
}

export interface EditableEvent<
  TData extends object = Record<string, unknown>,
> extends EventData<TData> {
  id: EventId | null;
}

export interface SaveError {
  error: string;
}

export interface DefaultTime {
  startsAtTime: string;
  finishesAtTime: string;
}

export type GetEventsFn<TData extends object = Record<string, unknown>> =
  () => Promise<SavedEvent<TData>[]>;

export type SaveEventFn<TData extends object = Record<string, unknown>> = (
  event: EditableEvent<TData>,
) => Promise<SavedEvent<TData> | SaveError>;

export type EditEventFn<TData extends object = Record<string, unknown>> = (
  event: EditableEvent<TData>,
) => Promise<void>;

export type RemoveEventFn<TData extends object = Record<string, unknown>> = (
  event: SavedEvent<TData>,
) => Promise<void>;

export interface VueEventCreatorProps<
  TData extends object = Record<string, unknown>,
> {
  language?: LanguageLocale;
  firstDate?: Date;
  defaultTime?: DefaultTime;
  monthsOnPage?: number;
  getEventsFn?: GetEventsFn<TData>;
  saveEventFn?: SaveEventFn<TData>;
  editEventFn?: EditEventFn<TData>;
  removeEventFn?: RemoveEventFn<TData>;
  eventComponent?: Component;
}

export type VecLanguageLocale = LanguageLocale;
export type VecDefaultTime = DefaultTime;
