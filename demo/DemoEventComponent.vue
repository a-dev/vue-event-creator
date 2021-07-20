<template>
  <div class="vec-demo-card">
    <div class="vec-demo-card__inputs" v-if="isEventEditing">
      <input
        class="vec-demo-card__input vec-demo-card__input_title"
        type="text"
        v-model="title"
        @input="sendData"
      />
      <textarea
        class="vec-demo-card__input vec-demo-card__input_text"
        v-model="text"
        @input="sendData"
      ></textarea>
    </div>
    <template v-if="!isEventEditing && eventData">
      <div class="vec-demo-card__title">{{ title }}</div>
      <div class="vec-demo-card__text">{{ text }}</div>
    </template>
    <div class="vec-demo-card__prompt">
      * This dark section is not a part of Vue Event Creator library. It's a
      component you can add through the API.
    </div>
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
      default: () => {}
    },
    isEventEditing: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const title = ref(props.eventData?.title || 'Default title. Destroy it!');
    const text = ref(props.eventData?.text);

    const sendData = () => {
      emit('update:eventData', { title: title.value, text: text.value });
    };

    sendData(); // If you use a default value or getting request it from a server, don't forget to update the eventData.

    return {
      title,
      text,
      sendData
    };
  }
});
</script>
<style scoped>
.vec-demo-card {
  box-sizing: border-box;
  padding: 20px 25px;

  color: white;
  background-color: #212529;

  font-family: 'Montserrat', sans-serif;
  font-size: 20px;
}

.vec-demo-card__title {
  font-size: 30px;
  font-weight: 600;
}

.vec-demo-card__text {
  margin: 0.5rem 0;

  font-size: 15px;
  font-weight: 300;
}

.vec-demo-card__prompt {
  margin-top: 20px;

  opacity: 0.8;

  font-size: 12px;
}

.vec-demo-card__input {
  box-sizing: border-box;
  width: 100%;
  padding: 5px 7px;

  border-radius: 3px;

  font-family: 'Montserrat', sans-serif;
}

.vec-demo-card__input_title {
  font-size: 30px;
  font-weight: 600;
}

.vec-demo-card__input_text {
  margin-top: 20px;

  font-size: 20px;
}
</style>
