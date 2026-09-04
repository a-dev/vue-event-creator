<template>
  <div
    ref="eventElement"
    :key="forceUpdateKey"
    :data-vec-event-id="event.es_id"
    class="vec-event"
    :class="{
      'vec-event_focused': isFocused,
      'vec-event_editing': isEventEditing,
    }"
  >
    <div v-if="loader" class="vec-event-loader__wrapper">
      <div class="vec-loader"></div>
    </div>
    <VecGuardAlert
      v-if="guardAlertState === 'shown'"
      :guardAlertConfirm="guardAlertConfirm()"
    />
    <header class="vec-event__header">
      <div class="vec-event__dates">
        {{ formattedDate }}, {{ formattedTime }}
      </div>
    </header>
    <div v-if="isEventEditing" class="vec-event__set-time">
      <span>{{ i18n.t('time_from') }}&nbsp;</span>
      <input
        class="vec-event__time-input"
        type="time"
        :aria-label="i18n.t('event_start_time')"
        v-model="eventTimeStartsAt"
      />
      <span>{{ i18n.t('time_till') }}&nbsp;</span>
      <input
        class="vec-event__time-input"
        type="time"
        :aria-label="i18n.t('event_finish_time')"
        v-model="eventTimeFinishesAt"
      />
      <button
        type="button"
        @click="setDefaultTime"
        v-if="isNotDefaultTime"
        class="vec-button vec-button_primary-bg"
      >
        {{ i18n.t('set_default_time') }}
      </button>
    </div>
    <template v-if="eventComponent">
      <component
        :is="eventComponent"
        :isEventEditing="isEventEditing"
        :eventData="eventData"
        @update:eventData="eventData = $event"
      ></component>
    </template>
    <div v-if="serverError" class="vec-event__server-error" role="alert">
      {{ serverError }}
    </div>
    <footer class="vec-event__footer">
      <button
        type="button"
        class="vec-button vec-button_danger-bg"
        @click.prevent="removeEvent"
      >
        {{ i18n.t('button_remove') }}
      </button>
      <button
        type="button"
        v-if="isEventEditing"
        @click.prevent="cancelEditing"
        class="vec-button vec-button_outline"
      >
        {{ i18n.t('button_cancel') }}
      </button>
      <button
        type="button"
        class="vec-button vec-button_primary-bg"
        @click.prevent="isEventEditing ? saveEvent() : editEvent()"
      >
        {{ isEventEditing ? i18n.t('button_save') : i18n.t('button_edit') }}
      </button>
    </footer>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  ref,
  type Component,
  type PropType,
  computed,
  inject,
  watch,
  nextTick,
  onMounted,
} from 'vue';
import {
  VecEvent,
  VecEventsState,
  VecDefaultTime,
  VecFocusedEventState,
  VecCalendarState,
  VecGuardAlertState,
  toEditableEvent,
  toInternalEvent,
  toSavedEvent,
} from '../types/internal';
import type {
  EditEventFn,
  EditableEvent,
  RemoveEventFn,
  SaveEventFn,
} from '../types/public';

import { useI18n } from '../locales';
import { useEventActions } from '../hooks/useEventActions';
import dayjs, {
  formatDate,
  setTimeToDate,
  makeEsIdFromStartsAt,
} from '../lib/dayjs';
import VecGuardAlert from './GuardAlert.vue';

export default defineComponent({
  name: 'VECEvent',
  components: {
    VecGuardAlert,
  },
  props: {
    event: {
      type: Object as PropType<VecEvent>,
      required: true,
    },
    saveEventFn: {
      type: Function as PropType<SaveEventFn>,
      required: true,
    },
    editEventFn: {
      type: Function as PropType<EditEventFn>,
      required: true,
    },
    removeEventFn: {
      type: Function as PropType<RemoveEventFn>,
      required: true,
    },
    eventComponent: {
      type: [Object, Function] as PropType<Component>,
      default: undefined,
    },
  },
  setup(props) {
    const i18n = useI18n();

    /** Normalizes anything a consumer callback rejects with into an Error. */
    const toErrorMessage = (error: unknown, fallback: string) =>
      error instanceof Error ? error : new Error(fallback);

    const eventsState = inject('eventsState') as VecEventsState;
    const calendarState = inject('calendarState') as VecCalendarState;
    const defaultTimeState = inject('defaultTimeState')! as VecDefaultTime;
    const focusedEventState = inject(
      'focusedEventState',
    )! as VecFocusedEventState;

    const { removeEventAction, toggleEventEditAction, updateEventInTheState } =
      useEventActions(eventsState, calendarState);

    const eventTimeStartsAt = ref(dayjs(props.event.startsAt).format('HH:mm'));
    const eventTimeFinishesAt = ref(
      dayjs(props.event.finishesAt).format('HH:mm'),
    );
    const isEventEditing = ref(props.event.editing);
    const eventElement = ref<HTMLElement>();
    const isFocused = ref(false);

    const loader = ref(false);
    const serverError = ref('');

    const formattedDate = computed(() => {
      return formatDate(
        props.event.startsAt!,
        props.event.finishesAt!,
        i18n.language.value,
      );
    });

    const formattedTime = computed(() => {
      return `${eventTimeStartsAt.value}–${eventTimeFinishesAt.value}`;
    });

    watch(focusedEventState, (next) => {
      if (next) {
        isFocused.value = next.es_id === props.event.es_id ? true : false;
      } else {
        isFocused.value = false;
      }
    });

    const setDefaultTime = () => {
      eventTimeStartsAt.value = { ...defaultTimeState }.startsAtTime;
      eventTimeFinishesAt.value = { ...defaultTimeState }.finishesAtTime;
    };

    const isNotDefaultTime = computed(() => {
      return (
        eventTimeStartsAt.value !== defaultTimeState.startsAtTime ||
        eventTimeFinishesAt.value !== defaultTimeState.finishesAtTime
      );
    });

    const eventData = ref(props.event?.data);
    const saveEvent = async () => {
      if (loader.value) return;
      loader.value = true;
      serverError.value = '';
      const event: EditableEvent = {
        id: props.event.id,
        startsAt: setTimeToDate(props.event.startsAt!, eventTimeStartsAt.value),
        finishesAt: setTimeToDate(
          props.event.finishesAt!,
          eventTimeFinishesAt.value,
        ),
        data: eventData.value,
      };
      try {
        const updatedEvent = await props.saveEventFn(event);
        if ('error' in updatedEvent) {
          throw new Error(updatedEvent.error);
        }

        if (updatedEvent.id === null || updatedEvent.id === undefined) {
          throw new Error('Something went wrong: the event was not saved');
        }

        if (
          +updatedEvent.startsAt !== +event.startsAt ||
          +updatedEvent.finishesAt !== +event.finishesAt
        ) {
          const formattedDate = (date: Date) => {
            return dayjs(date).format('YYYY-MM-DD, HH:mm');
          };
          const errorText = `Something went wrong: dates was changed. Expected: ${formattedDate(
            event.startsAt,
          )} and ${formattedDate(event.finishesAt)}. Received: ${formattedDate(
            updatedEvent.startsAt,
          )}, ${formattedDate(updatedEvent.finishesAt)}`;

          throw new Error(errorText);
        }

        const internalEvent = toInternalEvent(
          updatedEvent,
          makeEsIdFromStartsAt(updatedEvent.startsAt),
        );
        updateEventInTheState(props.event, internalEvent);
        toggleEventEditAction(internalEvent, { editing: false });

        focusedEventState.value = null;
        isEventEditing.value = false;
      } catch (error) {
        serverError.value = toErrorMessage(
          error,
          'Unable to save the event',
        ).message;
        isEventEditing.value = true;
      } finally {
        loader.value = false;
      }
    };

    const editEvent = async () => {
      if (loader.value) return;
      loader.value = true;
      serverError.value = '';
      try {
        await props.editEventFn(toEditableEvent(props.event));
        toggleEventEditAction(props.event, { editing: true });
        isEventEditing.value = true;
        focusEditor();
      } catch (error) {
        serverError.value = toErrorMessage(
          error,
          'Unable to start editing the event',
        ).message;
      } finally {
        loader.value = false;
      }
    };

    const forceUpdateKey = ref(Math.random());

    const focusEditor = () => {
      void nextTick(() => {
        const controls = Array.from(
          eventElement.value?.querySelectorAll<HTMLElement>(
            'input, textarea, select, button',
          ) ?? [],
        );
        const consumerControl = controls.find(
          (control) =>
            !control.closest('.vec-event__set-time') &&
            !control.closest('.vec-event__footer'),
        );
        (consumerControl ?? controls[0])?.focus();
      });
    };

    onMounted(() => {
      if (isEventEditing.value) focusEditor();
    });

    const cancelEditing = () => {
      eventTimeStartsAt.value = dayjs(props.event.startsAt).format('HH:mm');
      eventTimeFinishesAt.value = dayjs(props.event.finishesAt).format('HH:mm');
      eventData.value = props.event.data;
      toggleEventEditAction(props.event, { editing: false });

      isEventEditing.value = false;
      forceUpdateKey.value = Math.random();
    };

    // Guard
    const guardAlertState = ref<VecGuardAlertState>('hidden');

    const guardAlertConfirm = () => {
      return async function (confirm: 'yes' | 'no') {
        if (confirm !== 'yes') {
          guardAlertState.value = 'hidden';
          return;
        }
        if (loader.value) return;

        loader.value = true;
        serverError.value = '';
        try {
          await props.removeEventFn(
            toSavedEvent({ ...props.event, id: props.event.id! }),
          );
          removeEventAction(props.event);
        } catch (error) {
          guardAlertState.value = 'hidden';
          serverError.value = toErrorMessage(
            error,
            'Unable to remove the event',
          ).message;
        } finally {
          loader.value = false;
        }
      };
    };

    const removeEvent = () => {
      if (props.event.id === null || props.event.id === undefined) {
        removeEventAction(props.event);
      } else {
        guardAlertState.value = 'shown';
      }
    };

    return {
      i18n,
      eventTimeStartsAt,
      eventTimeFinishesAt,
      formattedDate,
      formattedTime,
      eventData,
      setDefaultTime,
      isNotDefaultTime,
      isEventEditing,
      isFocused,
      editEvent,
      cancelEditing,
      saveEvent,
      removeEvent,
      loader,
      guardAlertState,
      guardAlertConfirm,
      serverError,
      forceUpdateKey,
      eventElement,
    };
  },
});
</script>
