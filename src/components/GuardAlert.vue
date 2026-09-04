<template>
  <div class="vec-guard-alert">
    <div class="vec-guard-alert__prompt">{{ i18n.t('guard_prompt') }}</div>
    <div class="vec-guard-alert__buttons">
      <button
        @click="guardAlertConfirm('no')"
        class="vec-button vec-button_primary-bg"
      >
        {{ i18n.t('guard_no') }}
      </button>
      <button
        @click="guardAlertConfirm('yes')"
        class="vec-button vec-button_danger-bg"
      >
        {{ i18n.t('guard_yes') }}
      </button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { useI18n } from '../locales';

export default defineComponent({
  name: 'VECGuardAlert',
  props: {
    guardAlertConfirm: {
      type: Function as PropType<(confirm: 'yes' | 'no') => Promise<void>>,
      default: () => {},
    },
  },
  setup() {
    const i18n = useI18n();
    return {
      i18n,
    };
  },
});
</script>
