<template>
  <div class="vec-events-default-time">
    <div class="vec-events-dt__inputs">
      <span>{{ i18n.t('default_time_title') }}:&nbsp;</span>
      <span>{{ i18n.t('time_from') }}&nbsp;</span>
      <input
        type="time"
        v-model="defaultTimeState.startsAtTime"
        class="vec-event__time-input vec-events-dt__input"
      />
      <span>{{ i18n.t('time_till') }}&nbsp;</span>
      <input
        type="time"
        v-model="defaultTimeState.finishesAtTime"
        class="vec-event__time-input vec-events-dt__input"
      />
    </div>
    <div class="vec-events-dt__prompt">
      {{ i18n.t('default_time_prompt') }}
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, inject } from 'vue';
import { useI18n } from '../locales';
import { VecDefaultTime } from '../index';

export default defineComponent({
  name: 'VECDefaultTime',
  setup() {
    const defaultTimeState: VecDefaultTime = inject('defaultTimeState')!;

    const i18n = useI18n();

    return {
      i18n,
      defaultTimeState
    };
  }
});
</script>
