<template>
  <div class="vec-demo-card">
    <div class="vec-demo-card__inputs" v-if="isEventEditing">
      <label
        >Event title
        <input
          class="vec-demo-card__input vec-demo-card__input_title"
          type="text"
          aria-label="Event title"
          v-model="title"
          @input="sendData"
        />
      </label>
      <label
        >Event description
        <textarea
          class="vec-demo-card__input vec-demo-card__input_text"
          aria-label="Event description"
          v-model="text"
          @input="sendData"
        ></textarea>
      </label>
    </div>
    <template v-if="!isEventEditing && eventData">
      <div class="vec-demo-card__title">{{ title }}</div>
      <div class="vec-demo-card__text">{{ text }}</div>
    </template>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'VECDemoEventComponent',
  emits: ['update:eventData'],
  props: {
    eventData: {
      type: Object,
      default: () => {},
    },
    isEventEditing: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const title = ref(props.eventData?.title || 'Untitled event');
    const text = ref(props.eventData?.text);

    const sendData = () => {
      emit('update:eventData', { title: title.value, text: text.value });
    };

    sendData(); // If you use a default value or getting request it from a server, don't forget to update the eventData.

    return {
      title,
      text,
      sendData,
    };
  },
});
</script>
<style scoped>
.vec-demo-card {
  box-sizing: border-box;
  padding: 14px 16px;

  color: white;
  background-color: #212529;

  font-family: 'Montserrat', sans-serif;
  font-size: 20px;
}

.vec-demo-card__title {
  font-size: 20px;
  font-weight: 600;
}

.vec-demo-card__text {
  margin: 4px 0 0;

  font-size: 15px;
  font-weight: 400;
}

.vec-demo-card__input {
  box-sizing: border-box;
  width: 100%;
  padding: 12px;

  border: 1px solid #999894;
  border-radius: 9.33px;
  background: hsl(232, 5%, 99%);
  color: #212529;

  font-family: 'Montserrat', sans-serif;
}

.vec-demo-card__input_title {
  font-size: 20px;
  font-weight: 600;
}

.vec-demo-card__input_text {
  min-height: 120px;
  resize: vertical;
  font-size: 16px;
}

.vec-demo-card__inputs {
  display: grid;
  gap: 20px;
}
.vec-demo-card__inputs label {
  display: grid;
  gap: 8px;
  font-size: 13px;
}
.vec-demo-card__text,
.vec-demo-card__title {
  overflow-wrap: anywhere;
}
.vec-demo-card__text {
  white-space: pre-line;
  line-height: 1.5;
}
@supports (corner-shape: squircle) {
  .vec-demo-card__input {
    border-radius: 16px;
    corner-shape: squircle;
  }
}
@media (max-width: 420px) {
  .vec-demo-card {
    padding: 14px 12px;
  }
}
</style>
