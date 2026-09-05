<template>
  <div class="vec-events-default-time">
    <div class="vec-events-dt__title">{{ i18n.t('default_time_title') }}</div>
    <div class="vec-events-dt__inputs">
      <label
        ><span>{{ i18n.t('time_from') }}</span>
        <input
          type="time"
          :aria-label="`${i18n.t('default_time_title')} ${i18n.t('time_from')}`"
          v-model="defaultTimeState.startsAtTime"
          class="vec-event__time-input vec-events-dt__input"
        /> </label
      ><label
        ><span>{{ i18n.t('time_till') }}</span>
        <input
          type="time"
          :aria-label="`${i18n.t('default_time_title')} ${i18n.t('time_till')}`"
          v-model="defaultTimeState.finishesAtTime"
          class="vec-event__time-input vec-events-dt__input"
        />
      </label>
    </div>
    <div class="vec-events-dt__prompt">
      {{ i18n.t('default_time_prompt') }}
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, inject } from 'vue';
import { useI18n } from '../locales';
import type { VecDefaultTime } from '../types/internal';

export default defineComponent({
  name: 'VECDefaultTime',
  setup() {
    const defaultTimeState: VecDefaultTime = inject('defaultTimeState')!;

    const i18n = useI18n();

    return {
      i18n,
      defaultTimeState,
    };
  },
});
</script>
