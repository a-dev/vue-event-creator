# Vue Event Creator

The library Vue Event Creator helps to schedule events in easy way. It’s very convenient for companies that have a lot of similar events, first of all repeated events like training courses, sport events, seminars. For example, we have the event that occurs twice a week for a month. The title and description are the same, just the dates are different. In general it takes enough time to fill up that info (and it’s boring), Vue Event Creator fasts the process. And yes, the interface looks nice. 

By the way, you can customize the dates of event and add to them additional properties that suit your aim: title, content, select, tags and so on.

## Features

Localization: English, Espanol, Русский, custom.
Two columns view.
To focus the event card by click.
Default time control.
In-place editing of the event additional data.
Foolproof: user has to save a new event and has to confirm removing an event that already saved through API.
Small size: less than 11 kb (gzip with styles)

## Demo

### [Check out demo](https://a-dev.github.io/vue-event-creator/)

To create one-day event you need to make double click on the date. To create the event for several days you make one click on start date and second click on the last date of the event. That's it. The card of new event will appear in the right column.

## Dependencies

* Vue 3
* Dayjs (you don't have to preinstall it)

## Installation
npm
```
npm install vue-event-creator
```
yarn
```
yarn add vue-event creator
```

## Using

You can look at [demo app code](https://github.com/a-dev/vue-event-creator/blob/main/demo).
Component with initialization and server's actions:

```vue
<template>
  <div class="vec-wrapper">
    <vue-event-creator
      language="es"
      :saveEventFn="saveEventFn"
      :getEventsFn="getEventsFn"
      :removeEventFn="removeEventFn"
      :eventComponent="EventData"
    >
    </vue-event-creator>
  </div>
</template>
<script>
import VueEventCreator from 'vue-event-creator';
import EventDataComponent from './EventDataComponent.vue'; // The component with additional data (*optional)
import axios from 'axios'; // For example I use axios for sending data to a server

export default {
  component: {
    VueEventCreator
  },
  setup(props) {
    // First off all — get all existed events
    const getEventsFn = async () => {
      /*
        Fetch from API or take events from props.
        You have to return an array of objects with these keys:
          id: id of your content in a database
          startsAt: start date and time (javascript Date format)
          finishesAt: finish date and time (javascript Date format)
          data: *not required, any additional properties
      */
      const events = props.data.map((event) => {
        // Some logic to prepare the data if the response from the backend is not compliant
        return {
          id: event.id,
          startsAt: new Date(event.starts_at),
          finishesAt: new Date(event.finishes_at),
          data: {
            title: event.tile,
            text: event.text
          }
        };
      });
      return events;
    };

    const saveEventFn = async (data) => {
      /*
        Send new or changed event to a server and get a response with a new/updated data from it.
        As example I use FormData and two api points.
        You can make it whatever you want, just remember that you have two type of operations: creating and updating event in this one function.
      */
      const formData = new FormData();
      formData.set('event[started_at]', data.startsAt);
      formData.set('event[finishes_at]', data.finishesAt);
      formData.set('event[title]', data.data?.title);
      formData.set('event[text]', data.data?.text);

      const isUpdating = !!data.id; // if an event is not saved in a server, than it doesn't have id (id === null).

      axios({
        url: isUpdating ? `/api/events/${data.id}.json` : '/api/events/create',
        method: isUpdating ? 'patch' : 'post',
        data: formData
      })
        .then(({ data }) => data)
        .catch(console.error);
    };

    const removeEventFn = async () => {
      /*
        Remove event from server. 200 OK in return
      */
      axios
        .delete(`/api/events/remove/${data.id}.json`)
        .then()
        .catch(console.error);
    };

    return {
      getEventsFn,
      saveEventFn,
      removeEventFn,
      eventDataComponent
    };
  }
};
</script>
```

Additional component

```vue
<template>
  <div v-if="isEventEditing">
    <input type="text" v-model="title" @input="sendData" />
    <textarea v-model="text" @input="sendData"></textarea>
  </div>
  <template v-else>
    <h2>{{ title }}</h2>
    <div>{{ text }}</div>
  </template>
</template>
<script>
import { ref } from 'vue';

export default {
  props: {
    /*
      You need to set two props: 
      'eventData' contains data properties of the event (additional data),
      'isEventEditing' which will changes when a user clicks the 'Edit' button of the event card.
    */
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
    const title = ref(props.eventData?.title);
    const text = ref(props.eventData?.text);

    const sendData = () => {
      /*
        You have to fire the event 'update:eventData' with data properties to update it on the parent component from where this data will sends to a server.
        And it's the good place to make a validation.
      */
      emit('update:eventData', {
        title: title.value,
        text: text.value
      });
    };

    /* 
      If you need to add any default data for an event, just create request to a server and load it. Don't forget to emit data, like this:
      sendData();
    */

    return {
      sendData
    };
  }
};
</script>
```

### Server error

If the server makes an error (include validation) just send a response object with an error property.

``` javascript
{ error: 'Something bad happens' }
```

This error appearing to the user above the card's footer.

### Start edit action

If you want making some prepare before edit an event's card, use function editEventFn() inside the main component.

``` javascript
const editEventFn = async () => {
  // Here some code
  return;
};
```

### Styles

Override css custom properties on .vec-body class

```vue
<style>
.vec-body {
  --vec-color-text-primary: red;
  --vec-color-primary: blue;
  --vec-calendar-max-height: calc(100vh - 3rem);
  /* and more... */
}
</style>
```

Full list of variables [look here](https://github.com/a-dev/vue-event-creator/blob/main/src/styles/vars.css).

## License

[MIT](https://github.com/a-dev/vue-event-creator/blob/main/LICENSE)
