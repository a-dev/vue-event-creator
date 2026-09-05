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
      type="button"
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
      type="button"
      class="vec-months__shift vec-months__shift_after"
      @click="addMonthsToCalendar('after')"
    >
      <span class="vec-chevron_down"></span>{{ i18n.t('add_months_after') }}
    </button>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, inject } from 'vue';
import type { VecCalendarState } from '../types/internal';
import { useI18n } from '../locales/index';
import dayjs from '../lib/dayjs';
import VecMonth from './Month.vue';

export default defineComponent({
  name: 'VECCalendar',
  components: {
    VecMonth,
  },
  setup() {
    const calendarState = inject('calendarState') as VecCalendarState;
    const i18n = useI18n();

    // The parent owns event state, so expansion goes through its shared action
    // and the appended months are filled from the current events.
    const addMonthsToCalendar = inject('addMonthsToCalendar') as (
      direction: 'before' | 'after',
    ) => void;

    const weekDaysArray = computed(() => {
      const localeData = dayjs().locale(i18n.language.value).localeData();
      const weekdays = [...localeData.weekdaysMin()];
      if (localeData.firstDayOfWeek() !== 0) weekdays.push(weekdays.shift()!);
      return weekdays;
    });

    return {
      calendarState,
      weekDaysArray,
      addMonthsToCalendar,
      i18n,
    };
  },
});
</script>
