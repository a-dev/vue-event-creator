import { mount } from '@vue/test-utils';
import { ref, reactive, nextTick, markRaw } from 'vue';
import {
  VecDefaultTime,
  VecEvent,
  VecFocusedEventState
} from '../../src/index';
import { setDayJsLang } from '../../src/lib/dayjs';
import { setI18n } from '../../src/locales/index';

import { useCalendarActions } from '../../src/hooks/useCalendarActions';

import { July2021CalendarState, createEventsWithDates } from './utils';
import VECEvent from '../../src/components/Event.vue';
import EventComponent from './EventComponent.vue';

describe('Edit, save and remove an event', () => {
  setI18n('en');
  setDayJsLang('en');

  const defaultProps = {
    event: {
      id: 3,
      es_id: 20210902,
      startsAt: new Date('2021-09-02T10:00:00.000Z'),
      finishesAt: new Date('2021-09-05T17:00:00.000Z'),
      editing: false
    } as VecEvent,
    saveEventFn: async (event: VecEvent) => {},
    editEventFn: async (event: VecEvent) => {},
    removeEventFn: async (event: VecEvent) => {}
  };

  const defaultProvide = {
    eventsState: ref<VecEvent[]>(
      createEventsWithDates(['2021-09-02:2021-09-05'])
    ),
    calendarState: July2021CalendarState(),
    defaultTimeState: reactive({
      startsAtTime: '10:00',
      finishesAtTime: '17:00'
    }) as VecDefaultTime,
    focusedEventState: ref(null) as VecFocusedEventState
  };

  test("The event's card will focused when the focusedEvent state changes", async () => {
    const focusedEventState = ref(null) as VecFocusedEventState;
    const wrapper = mount(VECEvent, {
      props: { ...defaultProps },
      global: {
        provide: { ...defaultProvide, focusedEventState }
      }
    });
    expect(
      wrapper.find('#vec-es-id-20210902').classes('vec-event_focused')
    ).toBe(false);

    focusedEventState.value = { es_id: 20210902 };
    await nextTick();

    expect(
      wrapper.find('#vec-es-id-20210902').classes('vec-event_focused')
    ).toBe(true);
  });

  test('Click to button Edit changes state of the event and of the day to editing', async () => {
    const calendarState = July2021CalendarState();
    const wrapper = mount(VECEvent, {
      props: { ...defaultProps },
      global: {
        provide: { ...defaultProvide, calendarState }
      }
    });

    const eventElem = wrapper.get('#vec-es-id-20210902');
    const day = calendarState.months[2].days[1];
    const editButton = wrapper.findAll('.vec-button')[1];

    expect(eventElem.classes('vec-event_editing')).toBe(false);
    expect(day.editing).toBe(false);
    expect(editButton.text()).toBe('Edit');

    await editButton.trigger('click');
    await nextTick();
    expect(editButton.text()).toBe('Save');
    expect(eventElem.classes('vec-event_editing')).toBe(true);
    expect(day.editing).toBe(true);

    await editButton.trigger('click');
    expect(eventElem.classes('vec-event_editing')).toBe(false);
    expect(editButton.text()).toBe('Edit');
  });

  test('Before starting editing, the async function editEventFn is resolved', () => {
    let functionResolved = false;

    const editEventFn = async () => {
      functionResolved = true;
    };

    const wrapper = mount(VECEvent, {
      props: { ...defaultProps, editEventFn },
      global: {
        provide: { ...defaultProvide }
      }
    });
    const editButton = wrapper.findAll('.vec-button')[1];
    expect(functionResolved).toBe(false);

    editButton.trigger('click');
    expect(functionResolved).toBe(true);
  });

  test('After finishing editing, async function saveEventFn processes a new data and sends the result back to the event', async () => {
    const eventsState = ref(createEventsWithDates(['2021-09-02:2021-09-05']));

    const saveEventFn = async () => {
      return {
        id: 5,
        startsAt: new Date('2021-09-02T10:00:00.000Z'),
        finishesAt: new Date('2021-09-05T17:00:00.000Z'),
        data: {
          title: 'New title',
          text: 'New text'
        }
      };
    };

    const wrapper = mount(VECEvent, {
      props: { ...defaultProps, saveEventFn },
      global: {
        provide: { ...defaultProvide, eventsState }
      }
    });
    const editButton = wrapper.findAll('.vec-button')[1];
    expect(eventsState.value[0].data).toBeUndefined;

    await editButton.trigger('click');
    await editButton.trigger('click');

    expect(eventsState.value[0].data).toEqual({
      title: 'New title',
      text: 'New text'
    });
  });

  test('Rise and show the error if a date from a server is not the same or invalid', async () => {
    const eventsState = ref(createEventsWithDates(['2021-09-02:2021-09-05']));
    const errorText =
      'Something goes wrong: dates was changed. Expected: 2021-09-02, 10:00 and 2021-09-05, 17:00. Received: 2021-08-10, 10:00, 2021-09-05, 17:00';
    const saveEventFn = async () => {
      return {
        id: 5,
        startsAt: new Date('2021-08-10T10:00:00.000Z'),
        finishesAt: new Date('2021-09-05T17:00:00.000Z')
      };
    };

    const consoleErrorSpy = jest.spyOn(console, 'error');

    const wrapper = mount(VECEvent, {
      props: { ...defaultProps, saveEventFn },
      global: {
        provide: { ...defaultProvide, eventsState }
      }
    });

    const editButton = wrapper.findAll('.vec-button')[1];
    await editButton.trigger('click');
    await editButton.trigger('click');
    expect(consoleErrorSpy).toHaveBeenCalledWith(new Error(errorText));
    expect(wrapper.get('.vec-event__server-error').text()).toBe(errorText);

    expect(eventsState.value[0].startsAt).not.toEqual(
      new Date('2021-08-10T10:00:00.000Z')
    );
    expect(editButton.text()).toBe('Save');
  });

  test('Show error if a response object from a server has property <error>', async () => {
    const errorText = 'This is error from server';
    const saveEventFn = async () => {
      return {
        error: errorText
      };
    };

    const consoleErrorSpy = jest.spyOn(console, 'error');

    const wrapper = mount(VECEvent, {
      props: { ...defaultProps, saveEventFn },
      global: {
        provide: { ...defaultProvide }
      }
    });

    const editButton = wrapper.findAll('.vec-button')[1];
    await editButton.trigger('click');
    await editButton.trigger('click');
    expect(consoleErrorSpy).toHaveBeenCalledWith(new Error(errorText));
    expect(wrapper.get('.vec-event__server-error').text()).toBe(errorText);
    expect(editButton.text()).toBe('Save');
  });

  test('Show cancel button if the event is editing', async () => {
    const wrapper = mount(VECEvent, {
      props: { ...defaultProps },
      global: {
        provide: { ...defaultProvide }
      }
    });
    expect(wrapper.findAll('.vec-button')).toHaveLength(2);
    const editButton = wrapper.findAll('.vec-button')[1];

    await editButton.trigger('click');
    expect(wrapper.findAll('.vec-button')).toHaveLength(3);
    const cancelButton = wrapper.findAll('.vec-button')[1];
    expect(cancelButton.text()).toBe('Cancel');

    await cancelButton.trigger('click');
    expect(wrapper.findAll('.vec-button')).toHaveLength(2);
    expect(wrapper.findAll('.vec-button')[1].text()).toBe('Edit');
  });

  test('After click on the remove button and confirm this action the event removes from eventsState and calendarState (not from testing DOM — it wrappers itself)', async () => {
    const calendarState = July2021CalendarState();
    const eventsState = ref<VecEvent[]>(
      createEventsWithDates(['2021-09-02:2021-09-05'])
    );
    const { calendarFillEvents } = useCalendarActions(
      calendarState,
      eventsState,
      { startsAtId: null, finishesAtId: null },
      defaultProvide.focusedEventState
    );
    calendarFillEvents();

    const wrapper = mount(VECEvent, {
      props: { ...defaultProps },
      global: {
        provide: { ...defaultProvide, calendarState, eventsState }
      }
    });
    const eventElem = wrapper.find('#vec-es-id-20210902');
    const day = calendarState.months[2].days[1];
    const removeButton = wrapper.findAll('.vec-button')[0];
    expect(eventElem.exists()).toBe(true);
    expect(day.es_id).toBe(20210902);

    expect(wrapper.find('.vec-guard-alert').exists()).toBe(false);

    // First check if click on button 'No' and cancel removing
    await removeButton.trigger('click');
    expect(wrapper.find('.vec-guard-alert').exists()).toBe(true);
    const noButton = wrapper.findAll(
      '.vec-guard-alert__buttons .vec-button'
    )[0];

    await noButton.trigger('click');
    expect(wrapper.find('.vec-guard-alert').exists()).toBe(false);

    // Then click on 'Yes' button and remove event
    await removeButton.trigger('click');
    expect(wrapper.find('.vec-guard-alert').exists()).toBe(true);
    const yesButton = wrapper.findAll(
      '.vec-guard-alert__buttons .vec-button'
    )[1];
    await yesButton.trigger('click');
    expect(day.es_id).toBe(null);
    expect(eventsState.value).toHaveLength(0);
  });

  test('Add an external component inside the event body, render it and get data from it', async () => {
    const event = createEventsWithDates(['2021-09-02:2021-09-05'])[0];
    event.data = {
      title: 'Title',
      text: 'Text'
    };

    const wrapper = mount(VECEvent, {
      props: {
        ...defaultProps,
        event,
        eventComponent: markRaw(EventComponent)
      },
      global: {
        provide: {
          ...defaultProvide
        }
      }
    });

    expect(wrapper.find('#event-component').exists()).toBe(true);
    expect(wrapper.get('#event-title').text()).toBe('Title');
    expect(wrapper.get('#event-text').text()).toBe('Text');
    expect(wrapper.find('#input').exists()).toBe(false);

    // Edit will change component with isEventEditing props
    const editButton = wrapper.findAll('.vec-button')[1];
    await editButton.trigger('click');

    expect(wrapper.find('#event-input').exists()).toBe(true);
    wrapper.find('#event-input').setValue('Title changed');

    // Finish editing
    await editButton.trigger('click');
    expect(wrapper.find('#input').exists()).toBe(false);
    expect(wrapper.get('#event-title').text()).toBe('Title changed');
  });
});
