<template>
  <div class="vec-month">
    <div class="vec-month__title">
      {{ monthName }}
    </div>
    <div class="vec-month__days" :style="shiftFirstDay()">
      <vec-day
        v-for="day in month.days"
        :key="month.id + day.id"
        :day="day"
        :shift="month.shift"
        :monthId="month.id"
      />
    </div>
  </div>
</template>
<script lang="ts">
import VecDay from './Day.vue';
import { computed, PropType } from 'vue';
import dayjs from 'dayjs';
import { VecMonthWithDates } from '../index';

export default {
  name: 'VECMonth',
  components: {
    VecDay
  },
  props: {
    month: {
      type: Object as PropType<VecMonthWithDates>,
      required: true
    }
  },
  setup({ month }: { month: VecMonthWithDates }) {
    const monthName = computed(() => {
      const name = dayjs(month.firstDayOfMonth).format('MMMM YYYY');
      return name.charAt(0).toUpperCase() + name.slice(1);
    });

    function shiftFirstDay() {
      const isSundayFirst = dayjs.localeData().firstDayOfWeek() === 0;
      const shift =
        month.shift === 0
          ? isSundayFirst
            ? 1
            : 7
          : month.shift + (isSundayFirst ? 1 : 0);
      return `--vec-month-first-day-shift: ${shift}`;
    }

    return {
      monthName,
      shiftFirstDay
    };
  }
};
</script>
