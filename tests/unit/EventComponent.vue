<template>
  <div id="event-component">
    <div id="event-title">{{ title }}</div>
    <div id="event-text">{{ eventData.text }}</div>
    <input id="event-input" v-if="isEventEditing" v-model="title" />
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  props: {
    eventData: {
      type: Object,
      default: () => {}
    },
    isEventEditing: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const title = ref(props.eventData.title);
    const text = ref(props.eventData.text);

    return {
      title,
      text
    };
  }
});
</script>
