import type { DefineComponent } from 'vue';
import component from './VueEventCreator.vue';
import type { VueEventCreatorProps } from './types/public.js';

export type {
  DefaultTime,
  EditableEvent,
  EditEventFn,
  EventData,
  EventId,
  GetEventsFn,
  LanguageLocale,
  RemoveEventFn,
  SaveError,
  SavedEvent,
  SaveEventFn,
  VecDefaultTime,
  VecLanguageLocale,
  VueEventCreatorProps,
} from './types/public.js';

export type VueEventCreatorComponent<
  TData extends object = Record<string, unknown>,
> = DefineComponent<VueEventCreatorProps<TData>>;

const VueEventCreator = component as unknown as VueEventCreatorComponent;

export default VueEventCreator;
