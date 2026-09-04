<template>
  <div v-if="loader" class="vec-loader__wrapper">
    <div class="vec-loader"></div>
  </div>
  <div v-else-if="loadError" class="vec-load-error" role="alert">
    <span>{{ loadError }}</span>
    <button type="button" class="vec-button" @click="loadEvents">
      {{ i18n.t('button_retry') }}
    </button>
  </div>
  <div v-else class="vec-body">
    <button
      type="button"
      class="vec-calendar__switcher"
      :class="{ 'vec-calendar__switcher_on': isSwitcherOn }"
      :aria-expanded="isSwitcherOn"
      :aria-label="i18n.t('calendar_switcher')"
      @click="isSwitcherOn = !isSwitcherOn"
    >
      <div
        class="vec-chevron_l"
        :class="{ 'vec-chevron_l-left': isSwitcherOn }"
      ></div>
    </button>
    <vec-calendar :firstDate="firstDate" :monthsOnPage="monthsOnPage" />
    <vec-events
      :saveEventFn="saveEventFn"
      :editEventFn="editEventFn"
      :removeEventFn="removeEventFn"
      :eventComponent="eventComponent"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  provide,
  watch,
  ref,
  onBeforeUnmount,
  toRef,
  type Component,
  type PropType,
} from 'vue';
import {
  VecCalendarState,
  VecChoosingDatesState,
  VecEvent,
  VecFocusedEventState,
  toInternalEvent,
} from './types/internal';
import type {
  DefaultTime,
  EditEventFn,
  GetEventsFn,
  LanguageLocale,
  RemoveEventFn,
  SaveEventFn,
} from './types/public';
import { createI18n, i18nKey } from './locales/index';
import VecCalendar from './components/Calendar.vue';
import { makeEsIdFromStartsAt } from './lib/dayjs';
import VecEvents from './components/Events.vue';
import { useCalendarActions, setValueToDate } from './hooks/useCalendarActions';
import { buildMonthsForCalendarState } from './hooks/calendarBuildActions';
import { sortEvents } from './hooks/useEventActions';

export default defineComponent({
  name: 'VueEventCreator',
  components: {
    VecCalendar,
    VecEvents,
  },
  props: {
    language: {
      type: String as PropType<LanguageLocale>,
      default: 'en',
    },
    firstDate: {
      type: Date,
      default: () => new Date(),
    },
    defaultTime: {
      type: Object as PropType<DefaultTime>,
      default: () => ({
        startsAtTime: '10:00',
        finishesAtTime: '17:00',
      }),
    },
    monthsOnPage: {
      type: Number,
      default: 3,
    },
    editEventFn: {
      type: Function as PropType<EditEventFn>,
      default: async () => {},
    },
    saveEventFn: {
      type: Function as PropType<SaveEventFn>,
      default: async () => undefined as never,
    },
    removeEventFn: {
      type: Function as PropType<RemoveEventFn>,
      default: async () => {},
    },
    eventComponent: {
      type: [Object, Function] as PropType<Component>,
      default: undefined,
    },
    getEventsFn: {
      type: Function as PropType<GetEventsFn>,
      default: async () => [],
    },
  },
  setup(props) {
    const loader = ref(true);
    const loadError = ref('');
    const isSwitcherOn = ref(false); // only for small screens

    const calendarState = reactive<VecCalendarState>({
      months: [],
    });
    const eventsState = ref<VecEvent[]>([]);
    const choosingDatesState = reactive<VecChoosingDatesState>({
      startsAtId: null,
      finishesAtId: null,
    });

    const defaultTimeState = reactive<DefaultTime>({ ...props.defaultTime });

    const languageState = toRef(props, 'language');
    const i18n = createI18n(languageState);
    provide(i18nKey, i18n);

    const focusedEventState = ref(null) as VecFocusedEventState;

    const { calendarFillEvents, setEventOnChoosingDays } = useCalendarActions(
      calendarState,
      eventsState,
      choosingDatesState,
      focusedEventState,
    );

    const validateLoadedEvents = (events: Awaited<ReturnType<GetEventsFn>>) => {
      const ordered = [...events].sort(
        (left, right) => +left.startsAt - +right.startsAt,
      );

      for (const [index, event] of ordered.entries()) {
        if (
          !(event.startsAt instanceof Date) ||
          !(event.finishesAt instanceof Date) ||
          Number.isNaN(+event.startsAt) ||
          Number.isNaN(+event.finishesAt)
        ) {
          throw new Error('Loaded events contain an invalid date');
        }
        if (event.startsAt > event.finishesAt) {
          throw new Error(
            'A loaded event starts later than it finishes; the finish date cannot be earlier',
          );
        }

        const previous = ordered[index - 1];
        if (
          previous &&
          makeEsIdFromStartsAt(event.startsAt) <=
            makeEsIdFromStartsAt(previous.finishesAt)
        ) {
          throw new Error(
            'Loaded events overlap on at least one calendar date',
          );
        }
      }

      return ordered;
    };

    const loadEvents = async () => {
      loader.value = true;
      loadError.value = '';
      try {
        const result = validateLoadedEvents(await props.getEventsFn());
        eventsState.value = result.map((event) =>
          toInternalEvent(event, makeEsIdFromStartsAt(event.startsAt)),
        );
        sortEvents(eventsState);

        calendarState.months = buildMonthsForCalendarState(
          props.firstDate,
          eventsState.value,
          props.monthsOnPage,
        );
        calendarFillEvents();
      } catch (error) {
        eventsState.value = [];
        calendarState.months = [];
        loadError.value =
          error instanceof Error ? error.message : 'Unable to load events';
      } finally {
        loader.value = false;
      }
    };

    void loadEvents();

    watch(
      () => props.defaultTime,
      (next) => Object.assign(defaultTimeState, next),
      { deep: true },
    );

    const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const bodyListeners = new Set<(event: MouseEvent) => void>();
    const listenToNextBodyClick = (listener: (event: MouseEvent) => void) => {
      const timeout = setTimeout(() => {
        pendingTimeouts.delete(timeout);
        bodyListeners.add(listener);
        document.body.addEventListener('click', listener);
      });
      pendingTimeouts.add(timeout);
    };
    const removeBodyListener = (listener: (event: MouseEvent) => void) => {
      document.body.removeEventListener('click', listener);
      bodyListeners.delete(listener);
    };

    watch(choosingDatesState, (next) => {
      if (!next) return;

      if (next.finishesAtId) {
        setEventOnChoosingDays(defaultTimeState);
      } else if (next.startsAtId) {
        setValueToDate(calendarState, next.startsAtId!, {
          choosing: true,
        });

        const listenDayClick = (event: MouseEvent) => {
          removeBodyListener(listenDayClick);

          const target = event.target;
          if (!(target instanceof Element)) return;

          const isTargetElemDay =
            target.classList.contains('vec-day__number') ||
            target.classList.contains('vec-day');
          if (!isTargetElemDay) {
            setValueToDate(calendarState, next.startsAtId!, {
              choosing: false,
            });
            choosingDatesState.startsAtId = null;
          }
        };
        listenToNextBodyClick(listenDayClick);
      }
    });

    watch(focusedEventState, (next) => {
      if (!next) return;

      const listenClickAfterFocus = ((focusedEsId) => {
        const handleClick = (event: MouseEvent) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const targetElem = target.classList.contains('vec-day__number')
            ? target.parentElement
            : target;
          if (!targetElem) return;

          const eventElems = Array.from(
            document.querySelectorAll(`[data-es-id="${focusedEsId}"]`),
          );
          if (eventElems.length) {
            let founded = false;
            for (const el of eventElems) {
              if (el === targetElem) {
                founded = true;
                break;
              }
            }
            if (!founded) {
              removeBodyListener(handleClick);
              if (!targetElem.hasAttribute('data-es-id')) {
                focusedEventState.value = null;
              }
            }
          } else {
            removeBodyListener(handleClick);
          }
        };
        return handleClick;
      })(next.es_id);

      listenToNextBodyClick(listenClickAfterFocus);
    });

    onBeforeUnmount(() => {
      pendingTimeouts.forEach((timeout) => clearTimeout(timeout));
      bodyListeners.forEach((listener) =>
        document.body.removeEventListener('click', listener),
      );
      pendingTimeouts.clear();
      bodyListeners.clear();
    });

    provide('calendarState', calendarState);
    provide('eventsState', eventsState);
    provide('choosingDatesState', choosingDatesState);
    provide('focusedEventState', focusedEventState);
    provide('defaultTimeState', defaultTimeState);

    return {
      calendarState,
      loader,
      loadError,
      loadEvents,
      i18n,
      isSwitcherOn,
    };
  },
});
</script>

<style src="./styles/vars.css"></style>
<style src="./styles/layout.css"></style>
<style src="./styles/utils.css"></style>
<style src="./styles/buttons.css"></style>
<style src="./styles/calendar.css"></style>
<style src="./styles/day.css"></style>
<style src="./styles/month.css"></style>
<style src="./styles/default-time.css"></style>
<style src="./styles/event.css"></style>
<style src="./styles/guard-alert.css"></style>
