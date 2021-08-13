<template>
  <div
    :key="forceUpdateKey"
    :id="`vec-es-id-${event.es_id}`"
    class="vec-event"
    :class="{
      'vec-event_focused': isFocused,
      'vec-event_editing': isEventEditing
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
        v-model="eventTimeStartsAt"
      />
      <span>{{ i18n.t('time_till') }}&nbsp;</span>
      <input
        class="vec-event__time-input"
        type="time"
        v-model="eventTimeFinishesAt"
      />
      <button
        @click="setDefaultTime"
        v-if="isNotDefaultTime"
        class="vec-button vec-button_primary-bg"
      >
        {{ i18n.t('set_default_time') }}
      </button>
    </div>
    <template v-if="eventComponent && Object.keys(eventComponent).length">
      <component
        :is="eventComponent"
        :isEventEditing="isEventEditing"
        :eventData="eventData"
        @update:eventData="eventData = $event"
      ></component>
    </template>
    <div v-if="serverError" class="vec-event__server-error">
      {{ serverError }}
    </div>
    <footer class="vec-event__footer">
      <button
        class="vec-button vec-button_danger-bg"
        @click.prevent="removeEvent"
      >
        {{ i18n.t('button_remove') }}
      </button>
      <button
        v-if="isEventEditing"
        @click.prevent="cancelEditing"
        class="vec-button vec-button_outline"
      >
        {{ i18n.t('button_cancel') }}
      </button>
      <button
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
  PropType,
  computed,
  inject,
  watch,
  nextTick
} from 'vue';
import {
  VecEvent,
  VecEventsState,
  VecDefaultTime,
  VecFocusedEventState,
  VecCalendarState,
  VecGuardAlertState
} from '../index';

import { useI18n } from '../locales';
import { useEventActions } from '../hooks/useEventActions';
import dayjs, {
  formatDate,
  setTimeToDate,
  makeEsIdFromStartsAt
} from '../lib/dayjs';
import VecGuardAlert from './GuardAlert.vue';

export default defineComponent({
  name: 'VECEvent',
  components: {
    VecGuardAlert
  },
  props: {
    event: {
      type: Object as PropType<VecEvent>,
      required: true
    },
    saveEventFn: {
      type: Function,
      required: true
    },
    editEventFn: {
      type: Function,
      required: true
    },
    removeEventFn: {
      type: Function,
      required: true
    },
    eventComponent: {
      type: Object,
      default: () => {}
    }
  },
  setup(props) {
    const i18n = useI18n();

    const eventsState = inject('eventsState') as VecEventsState;
    const calendarState = inject('calendarState') as VecCalendarState;
    const defaultTimeState = inject('defaultTimeState')! as VecDefaultTime;
    const focusedEventState = inject(
      'focusedEventState'
    )! as VecFocusedEventState;

    const { removeEventAction, toggleEventEditAction, updateEventInTheState } =
      useEventActions(eventsState, calendarState);

    const eventTimeStartsAt = ref(dayjs(props.event.startsAt).format('HH:mm'));
    const eventTimeFinishesAt = ref(
      dayjs(props.event.finishesAt).format('HH:mm')
    );
    const isEventEditing = ref(props.event.editing);
    const isFocused = ref(false);

    const loader = ref(false);
    const serverError = ref('');

    const formattedDate = computed(() => {
      return formatDate(props.event.startsAt!, props.event.finishesAt!);
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

    interface ErrorObj {
      error: string;
    }

    const eventData = ref(props.event?.data);
    const saveEvent = () => {
      loader.value = true;
      const event = {
        id: props.event.id === undefined ? null : props.event.id,
        startsAt: setTimeToDate(props.event.startsAt!, eventTimeStartsAt.value),
        finishesAt: setTimeToDate(
          props.event.finishesAt!,
          eventTimeFinishesAt.value
        ),
        data: eventData.value
      } as VecEvent;
      props
        .saveEventFn(event)
        .then((updatedEvent: undefined | (VecEvent & ErrorObj)) => {
          if (updatedEvent && updatedEvent.error) {
            serverError.value = updatedEvent.error;
            throw new Error(updatedEvent.error);
          }

          if (!updatedEvent || !updatedEvent!.id) {
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
              event.startsAt
            )} and ${formattedDate(
              event.finishesAt
            )}. Received: ${formattedDate(
              updatedEvent.startsAt
            )}, ${formattedDate(updatedEvent.finishesAt)}`;

            serverError.value = errorText;
            throw new Error(errorText);
          }

          updatedEvent.es_id = makeEsIdFromStartsAt(updatedEvent.startsAt);
          updateEventInTheState(updatedEvent, updatedEvent);
          toggleEventEditAction(updatedEvent, { editing: false });

          focusedEventState.value = null;
          loader.value = false;
          isEventEditing.value = false;
        })
        .catch((err: Error) => {
          loader.value = false;
          isEventEditing.value = true;
          console.error(err);
        });
    };

    const editEvent = () => {
      props
        .editEventFn()
        .then(() => {
          toggleEventEditAction(props.event, { editing: true });
          isEventEditing.value = true;
        })
        .catch((err: Error) => {
          console.error(err);
        });
    };

    const forceUpdateKey = ref(Math.random());

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
        await confirm;
        if (confirm === 'yes') {
          props
            .removeEventFn(props.event)
            .then(() => {
              removeEventAction(props.event);
            })
            .catch((err: Error) => {
              console.error(err);
            });
        } else {
          guardAlertState.value = 'hidden';
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
      forceUpdateKey
    };
  }
});
</script>
