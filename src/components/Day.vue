<template>
  <div :data-es-id="day.es_id" class="vec-day" :class="[
    {
      'vec-day_weekend': isWeekend,
      'vec-day_scheduled': day.es_id,
      'vec-day_start-day': isStartDay,
      'vec-day_choosing': day.choosing,
      'vec-day_editing': day.editing,
      'vec-day_focused': isEventFocused
    }
  ]" @click.prevent="clickOnDay">
    <div class="vec-day__number">{{ day.id }}</div>
  </div>
</template>
<script lang="ts">
import { computed, inject, PropType } from 'vue';
import {
  VecChoosingDatesState,
  VecFocusedEventState,
  VecDayData,
  VecMonthId
} from '../index';
import { makeFormatDayDD } from '../hooks/useCalendarActions';

interface DayProps {
  day: VecDayData;
  shift: number;
  monthId: VecMonthId;
}

export default {
  name: 'VECDay',
  props: {
    day: {
      type: Object as PropType<VecDayData>,
      required: true
    },
    shift: {
      type: Number,
      required: true
    },
    monthId: {
      type: String as PropType<VecMonthId>,
      required: true
    }
  },
  setup(props: DayProps) {
    const isWeekend = computed(() => {
      const a = (props.day.id + props.shift - 1) % 7;
      return a === 6 || a === 0;
    });

    const choosingDatesState = inject(
      'choosingDatesState'
    ) as VecChoosingDatesState;

    const focusedEventState = inject(
      'focusedEventState'
    ) as VecFocusedEventState;

    const isEventFocused = computed(() => {
      return (
        props.day.es_id && props.day.es_id === focusedEventState.value?.es_id
      );
    });

    const focusEvent = () => {
      focusedEventState.value = {
        es_id: props.day.es_id
      };
    };

    const setEvent = () => {
      if (choosingDatesState.startsAtId) {
        choosingDatesState.finishesAtId = {
          monthId: props.monthId,
          dayId: props.day.id
        };
      } else {
        choosingDatesState.startsAtId = {
          monthId: props.monthId,
          dayId: props.day.id
        };
      }
    };

    const clickOnDay = () => {
      if (props.day.es_id) {
        focusEvent();
      } else {
        setEvent();
      }
    };

    const isStartDay = computed(() => {
      return (
        props.day.es_id === +`${props.monthId}${makeFormatDayDD(props.day.id)}`
      );
    });

    return {
      isWeekend,
      clickOnDay,
      isEventFocused,
      isStartDay
    };
  }
};
</script>
