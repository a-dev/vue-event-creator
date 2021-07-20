<template>
  <div class="vec-calendar">
    <div class="vec-calendar__header">
      <div class="vec-calendar__weekdays">
        <div
          v-for="name in weekDaysArray"
          :key="name"
          class="vec-calendar__weekday"
        >
          {{ name }}
        </div>
      </div>
    </div>
    <button
      class="vec-months__shift vec-months__shift_before"
      @click="addMonthsToCalendar('before')"
    >
      <span class="vec-chevron_up"></span>{{ i18n.t('add_months_before') }}
    </button>
    <vec-month
      v-for="month in calendarState.months"
      :key="month.id"
      :month="month"
    />
    <button
      class="vec-months__shift vec-months__shift_after"
      @click="addMonthsToCalendar('after')"
    >
      <span class="vec-chevron_down"></span>{{ i18n.t('add_months_after') }}
    </button>
  </div>
</template>
<script lang="ts">
import { defineComponent, inject, ref } from 'vue';
import { VecCalendarState } from '../index';
import { useI18n } from '../locales/index';
import dayjs from '../lib/dayjs';
import VecMonth from './Month.vue';
import { calendarAddMonths } from '../hooks/calendarBuildActions';

export default defineComponent({
  name: 'VECCalendar',
  components: {
    VecMonth
  },
  setup() {
    const calendarState = inject('calendarState') as VecCalendarState;
    const i18n = useI18n();

    const addMonthsToCalendar = (direction: 'before' | 'after') => {
      calendarState.months = calendarAddMonths(
        calendarState,
        direction
      ).slice();
    };

    const isSundayFirst = dayjs.localeData().firstDayOfWeek() === 0;
    let weekDaysArray = [];
    if (isSundayFirst) {
      weekDaysArray = dayjs.weekdaysMin();
    } else {
      let arr = [...dayjs.weekdaysMin()];
      arr.push(arr.shift()!);
      weekDaysArray = arr;
    }

    return {
      calendarState,
      weekDaysArray,
      addMonthsToCalendar,
      i18n
    };
  }
});
</script>
