<template>
  <div v-if="loader" class="vec-loader__wrapper">
    <div class="vec-loader"></div>
  </div>
  <div v-else class="vec-body">
    <div class="vec-calendar__switcher" :class="{ 'vec-calendar__switcher_on': isSwitcherOn }"
      @click="isSwitcherOn = !isSwitcherOn">
      <div class="vec-chevron_l" :class="{ 'vec-chevron_l-left': isSwitcherOn }"></div>
    </div>
    <vec-calendar :firstDate="firstDate" :monthsOnPage="monthsOnPage" />
    <vec-events :saveEventFn="saveEventFn" :editEventFn="editEventFn" :removeEventFn="removeEventFn"
      :eventComponent="eventComponent" />
  </div>
</template>

<script lang="ts">
import './styles';
import { defineComponent, reactive, provide, watch, ref, PropType } from 'vue';
import {
  VecLanguageLocale,
  VecEvent,
  VecCalendarState,
  VecChoosingDatesState,
  VecDefaultTime,
  VecFocusedEventState
} from './index';
import { setI18n } from './locales/index';
import VecCalendar from './components/Calendar.vue';
import { setDayJsLang, makeEsIdFromStartsAt } from './lib/dayjs';
import VecEvents from './components/Events.vue';
import { useCalendarActions, setValueToDate } from './hooks/useCalendarActions';
import { buildMonthsForCalendarState } from './hooks/calendarBuildActions';
import { sortEvents } from './hooks/useEventActions';

export default defineComponent({
  name: 'VueEventCreator',
  components: {
    VecCalendar,
    VecEvents
  },
  props: {
    language: {
      type: String as PropType<VecLanguageLocale>,
      default: 'en'
    },
    firstDate: {
      type: Date,
      default: new Date()
    },
    defaultTime: {
      type: Object as PropType<VecDefaultTime>,
      default: () => ({
        startsAtTime: '10:00',
        finishesAtTime: '17:00'
      })
    },
    monthsOnPage: {
      type: Number,
      default: 3
    },
    editEventFn: {
      type: Function,
      default: async (event: VecEvent) => { }
    },
    saveEventFn: {
      type: Function,
      default: async (event: VecEvent) => { }
    },
    removeEventFn: {
      type: Function,
      default: async (event: VecEvent) => { }
    },
    eventComponent: {
      type: Object,
      default: {}
    },
    getEventsFn: {
      type: Function,
      default: async () => []
    }
  },
  setup(props) {
    const loader = ref(true);
    const isSwitcherOn = ref(false); // only for small screens

    const calendarState = reactive<VecCalendarState>({
      months: []
    });
    const eventsState = ref<VecEvent[]>([]);
    const choosingDatesState = reactive<VecChoosingDatesState>({
      startsAtId: null,
      finishesAtId: null
    });

    const defaultTimeState = reactive<VecDefaultTime>(props.defaultTime);

    setI18n(props.language);
    setDayJsLang(props.language);

    const focusedEventState = ref(null) as VecFocusedEventState;

    const { calendarFillEvents, setEventOnChoosingDays } = useCalendarActions(
      calendarState,
      eventsState,
      choosingDatesState,
      focusedEventState
    );

    props.getEventsFn().then((result: VecEvent[]) => {
      eventsState.value = result.map((e) => {
        e.es_id = makeEsIdFromStartsAt(e.startsAt);
        return e;
      });
      sortEvents(eventsState);

      calendarState.months = buildMonthsForCalendarState(
        props.firstDate,
        eventsState.value,
        props.monthsOnPage
      );
      calendarFillEvents();
      loader.value = false;
    });

    watch(choosingDatesState, (next) => {
      if (!next) return;

      if (next.finishesAtId) {
        setEventOnChoosingDays(defaultTimeState);
      } else if (next.startsAtId) {
        setValueToDate(calendarState, next.startsAtId!, {
          choosing: true
        });

        const listenDayClick = (e: any) => {
          document.body.removeEventListener('click', listenDayClick);

          const isTargetElemDay =
            e.target.classList.contains('vec-day__number') ||
            e.target.classList.contains('vec-day');
          if (!isTargetElemDay) {
            setValueToDate(calendarState, next.startsAtId!, {
              choosing: false
            });
            choosingDatesState.startsAtId = null;
          }
        };
        setTimeout(() => {
          document.body.addEventListener('click', listenDayClick);
        });
      }
    });

    watch(focusedEventState, (next) => {
      if (!next) return;

      const listenClickAfterFocus = ((focusedEsId) => {
        const handleClick = (e: any) => {
          const targetElem = e.target.classList.contains('vec-day__number')
            ? e.target.parentElement
            : e.target;

          const eventElems = Array.from(
            document.querySelectorAll(`[data-es-id="${focusedEsId}"]`)
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
              document.body.removeEventListener('click', handleClick);
              if (!targetElem.hasAttribute('data-es-id')) {
                focusedEventState.value = null;
              }
            }
          } else {
            document.body.removeEventListener('click', handleClick);
          }
        };
        return handleClick;
      })(next.es_id);

      setTimeout(() => {
        document.body.addEventListener('click', listenClickAfterFocus);
      });
    });

    provide('calendarState', calendarState);
    provide('eventsState', eventsState);
    provide('choosingDatesState', choosingDatesState);
    provide('focusedEventState', focusedEventState);
    provide('defaultTimeState', defaultTimeState);

    return {
      calendarState,
      loader,
      isSwitcherOn
    };
  }
});
</script>

<style></style>
