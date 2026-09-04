import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { ref, reactive, nextTick, markRaw } from 'vue';
import {
  VecDefaultTime,
  VecEvent,
  VecFocusedEventState,
} from '../../src/types/internal';

import { useCalendarActions } from '../../src/hooks/useCalendarActions';

import { July2021CalendarState, createEventsWithDates } from './utils';
import VECEvent from '../../src/components/Event.vue';
import EventComponent from './EventComponent.vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type {
  EditEventFn,
  RemoveEventFn,
  SaveEventFn,
} from '../../src/types/public';
import { userEvent } from 'vitest/browser';

enableAutoUnmount(afterEach);

describe('Edit, save and remove an event', () => {
  let defaultProps: {
    event: VecEvent;
    saveEventFn: SaveEventFn;
    editEventFn: EditEventFn;
    removeEventFn: RemoveEventFn;
  };
  let defaultProvide: {
    eventsState: ReturnType<typeof ref<VecEvent[]>>;
    calendarState: ReturnType<typeof July2021CalendarState>;
    defaultTimeState: VecDefaultTime;
    focusedEventState: VecFocusedEventState;
  };

  beforeEach(() => {
    defaultProps = {
      event: {
        id: 3,
        es_id: 20210902,
        startsAt: new Date('2021-09-02T10:00:00.000Z'),
        finishesAt: new Date('2021-09-05T17:00:00.000Z'),
        editing: false,
      },
      saveEventFn: async () => ({ error: 'Not configured for this test' }),
      editEventFn: async () => {},
      removeEventFn: async () => {},
    };

    defaultProvide = {
      eventsState: ref<VecEvent[]>(
        createEventsWithDates(['2021-09-02:2021-09-05']),
      ),
      calendarState: July2021CalendarState(),
      defaultTimeState: reactive({
        startsAtTime: '10:00',
        finishesAtTime: '17:00',
      }) as VecDefaultTime,
      focusedEventState: ref(null) as VecFocusedEventState,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("The event's card will focused when the focusedEvent state changes", async () => {
    const focusedEventState = ref(null) as VecFocusedEventState;
    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: { ...defaultProps },
      global: {
        provide: { ...defaultProvide, focusedEventState },
      },
    });
    expect(
      wrapper
        .find('[data-vec-event-id="20210902"]')
        .classes('vec-event_focused'),
    ).toBe(false);

    focusedEventState.value = { es_id: 20210902 };
    await nextTick();

    expect(
      wrapper
        .find('[data-vec-event-id="20210902"]')
        .classes('vec-event_focused'),
    ).toBe(true);
  });

  test('Click to button Edit changes state of the event and of the day to editing', async () => {
    const calendarState = July2021CalendarState();
    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: {
        ...defaultProps,
        saveEventFn: async () => {
          return {
            id: 100,
            // 02–05 September 2021, 10:00–17:00
            startsAt: new Date('2021-09-02T10:00:00'),
            finishesAt: new Date('2021-09-05T17:00:00'),
            data: { title: 'New title', text: 'New text' },
          };
        },
      },
      global: {
        provide: {
          ...defaultProvide,
          calendarState,
        },
      },
    });

    const eventElem = wrapper.get('[data-vec-event-id="20210902"]');
    const day = calendarState.months[2].days[1];
    const editButton = wrapper.findAll('.vec-button')[1];

    expect(eventElem.classes('vec-event_editing')).toBe(false);
    expect(day.editing).toBe(false);
    expect(editButton.text()).toBe('Edit');

    await userEvent.click(editButton.element);
    await nextTick();
    expect(editButton.text()).toBe('Save');
    expect(eventElem.classes('vec-event_editing')).toBe(true);
    expect(day.editing).toBe(true);

    await userEvent.click(editButton.element);
    expect(eventElem.classes('vec-event_editing')).toBe(false);
    expect(editButton.text()).toBe('Edit');
  });

  test('Before starting editing, the async function editEventFn is resolved', async () => {
    let functionResolved = false;

    const editEventFn = async () => {
      functionResolved = true;
    };

    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: { ...defaultProps, editEventFn },
      global: {
        provide: { ...defaultProvide },
      },
    });
    const editButton = wrapper.findAll('.vec-button')[1];
    expect(functionResolved).toBe(false);

    await userEvent.click(editButton.element);
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
          text: 'New text',
        },
      };
    };

    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: { ...defaultProps, saveEventFn },
      global: {
        provide: { ...defaultProvide, eventsState },
      },
    });
    const editButton = wrapper.findAll('.vec-button')[1];
    expect(eventsState.value[0].data).toBeUndefined();

    await userEvent.click(editButton.element);
    await userEvent.click(editButton.element);

    expect(eventsState.value[0].data).toEqual({
      title: 'New title',
      text: 'New text',
    });
  });

  test('Rise and show the error if a date from a server is not the same or invalid', async () => {
    const eventsState = ref(createEventsWithDates(['2021-09-02:2021-09-05']));
    const errorText =
      'Something went wrong: dates was changed. Expected: 2021-09-02, 10:00 and 2021-09-05, 17:00. Received: 2021-08-10, 10:00, 2021-09-05, 17:00';
    const saveEventFn = async () => {
      return {
        id: 5,
        startsAt: new Date('2021-08-10T10:00:00.000Z'),
        finishesAt: new Date('2021-09-05T17:00:00.000Z'),
      };
    };

    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: { ...defaultProps, saveEventFn },
      global: {
        provide: { ...defaultProvide, eventsState },
      },
    });

    const editButton = wrapper.findAll('.vec-button')[1];
    await userEvent.click(editButton.element);
    await userEvent.click(editButton.element);
    expect(wrapper.get('.vec-event__server-error').text()).toBe(errorText);

    expect(eventsState.value[0].startsAt).not.toEqual(
      new Date('2021-08-10T10:00:00.000Z'),
    );
    expect(editButton.text()).toBe('Save');
  });

  test('Show error if a response object from a server has property <error>', async () => {
    const errorText = 'This is error from server';
    const saveEventFn = async () => {
      return {
        error: errorText,
      };
    };

    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: { ...defaultProps, saveEventFn },
      global: {
        provide: { ...defaultProvide },
      },
    });

    const editButton = wrapper.findAll('.vec-button')[1];
    await userEvent.click(editButton.element);
    await userEvent.click(editButton.element);
    expect(wrapper.get('.vec-event__server-error').text()).toBe(errorText);
    expect(editButton.text()).toBe('Save');
  });

  test('Keeps edited input and stops loading when saving rejects', async () => {
    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: {
        ...defaultProps,
        saveEventFn: async () => {
          throw new Error('The network is unavailable');
        },
      },
      global: {
        provide: { ...defaultProvide },
      },
    });
    const editButton = wrapper.findAll('.vec-button')[1];

    await userEvent.click(editButton.element);
    await userEvent.fill(
      wrapper.findAll('input[type="time"]')[0].element,
      '11:30',
    );
    await userEvent.click(editButton.element);
    await flushPromises();

    expect(wrapper.get('.vec-event__server-error').text()).toBe(
      'The network is unavailable',
    );
    expect(wrapper.find('.vec-event-loader__wrapper').exists()).toBe(false);
    expect(
      wrapper.findAll<HTMLInputElement>('input[type="time"]')[0].element.value,
    ).toBe('11:30');
    expect(editButton.text()).toBe('Save');
  });

  test('Shows an error and stays read-only when editEventFn rejects', async () => {
    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: {
        ...defaultProps,
        editEventFn: async () => {
          throw new Error('Editing is locked by another user');
        },
      },
      global: {
        provide: { ...defaultProvide },
      },
    });

    const editButton = wrapper.findAll('.vec-button')[1];
    await userEvent.click(editButton.element);
    await flushPromises();

    expect(wrapper.get('.vec-event__server-error').text()).toBe(
      'Editing is locked by another user',
    );
    expect(editButton.text()).toBe('Edit');
    expect(wrapper.find('.vec-event-loader__wrapper').exists()).toBe(false);
  });

  test('Shows an error and keeps the event when removeEventFn rejects', async () => {
    const eventsState = ref(createEventsWithDates(['2021-09-02:2021-09-05']));
    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: {
        ...defaultProps,
        removeEventFn: async () => {
          throw new Error('The event is referenced elsewhere');
        },
      },
      global: {
        provide: { ...defaultProvide, eventsState },
      },
    });

    await userEvent.click(wrapper.findAll('.vec-button')[0].element);
    await userEvent.click(
      wrapper.findAll('.vec-guard-alert__buttons button')[1].element,
    );
    await flushPromises();

    expect(wrapper.get('.vec-event__server-error').text()).toBe(
      'The event is referenced elsewhere',
    );
    expect(wrapper.find('.vec-guard-alert').exists()).toBe(false);
    expect(eventsState.value).toHaveLength(1);
    expect(wrapper.find('.vec-event-loader__wrapper').exists()).toBe(false);
  });

  test('Ignores a second save while the first one is still running', async () => {
    let resolveSave: (() => void) | undefined;
    const saveEventFn = vi.fn<SaveEventFn>(async () => {
      await new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
      return { error: 'Rejected after the test released it' };
    });
    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: { ...defaultProps, saveEventFn },
      global: {
        provide: { ...defaultProvide },
      },
    });

    const editButton = wrapper.findAll('.vec-button')[1];
    await userEvent.click(editButton.element);
    await userEvent.click(editButton.element);
    await vi.waitFor(() =>
      expect(wrapper.find('.vec-event-loader__wrapper').exists()).toBe(true),
    );

    await userEvent.click(editButton.element, { force: true });
    expect(saveEventFn).toHaveBeenCalledTimes(1);

    resolveSave?.();
    await flushPromises();
    expect(saveEventFn).toHaveBeenCalledTimes(1);
  });

  test('Show cancel button if the event is editing', async () => {
    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: { ...defaultProps },
      global: {
        provide: { ...defaultProvide },
      },
    });
    expect(wrapper.findAll('.vec-button')).toHaveLength(2);
    const editButton = wrapper.findAll('.vec-button')[1];

    await userEvent.click(editButton.element);
    expect(wrapper.findAll('.vec-button')).toHaveLength(3);
    const cancelButton = wrapper.findAll('.vec-button')[1];
    expect(cancelButton.text()).toBe('Cancel');

    await userEvent.click(cancelButton.element);
    expect(wrapper.findAll('.vec-button')).toHaveLength(2);
    expect(wrapper.findAll('.vec-button')[1].text()).toBe('Edit');
  });

  test('After click on the remove button and confirm this action the event removes from eventsState and calendarState (not from testing DOM — it wrappers itself)', async () => {
    const calendarState = July2021CalendarState();
    const eventsState = ref<VecEvent[]>(
      createEventsWithDates(['2021-09-02:2021-09-05']),
    );
    const { calendarFillEvents } = useCalendarActions(
      calendarState,
      eventsState,
      { startsAtId: null, finishesAtId: null },
      defaultProvide.focusedEventState,
    );
    calendarFillEvents();

    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: { ...defaultProps },
      global: {
        provide: { ...defaultProvide, calendarState, eventsState },
      },
    });
    const eventElem = wrapper.find('[data-vec-event-id="20210902"]');
    const day = calendarState.months[2].days[1];
    const removeButton = wrapper.findAll('.vec-button')[0];
    expect(eventElem.exists()).toBe(true);
    expect(day.es_id).toBe(20210902);

    expect(wrapper.find('.vec-guard-alert').exists()).toBe(false);

    // First check if click on button 'No' and cancel removing
    await userEvent.click(removeButton.element);
    expect(wrapper.find('.vec-guard-alert').exists()).toBe(true);
    const noButton = wrapper.findAll(
      '.vec-guard-alert__buttons .vec-button',
    )[0];

    await userEvent.click(noButton.element);
    expect(wrapper.find('.vec-guard-alert').exists()).toBe(false);

    // Then click on 'Yes' button and remove event
    await userEvent.click(removeButton.element);
    expect(wrapper.find('.vec-guard-alert').exists()).toBe(true);
    const yesButton = wrapper.findAll(
      '.vec-guard-alert__buttons .vec-button',
    )[1];
    await userEvent.click(yesButton.element);
    expect(day.es_id).toBe(null);
    expect(eventsState.value).toHaveLength(0);
  });

  test('Add an external component inside the event body, render it and get data from it', async () => {
    const event = createEventsWithDates(['2021-09-02:2021-09-05'])[0];
    event.data = {
      title: 'Title',
      text: 'Text',
    };

    const wrapper = mount(VECEvent, {
      attachTo: document.body,
      props: {
        ...defaultProps,
        event,
        eventComponent: markRaw(EventComponent),
      },
      global: {
        provide: {
          ...defaultProvide,
        },
      },
    });

    expect(wrapper.find('#event-component').exists()).toBe(true);
    expect(wrapper.get('#event-title').text()).toBe('Title');
    expect(wrapper.get('#event-text').text()).toBe('Text');
    expect(wrapper.find('#input').exists()).toBe(false);

    // Edit will change component with isEventEditing props
    const editButton = wrapper.findAll('.vec-button')[1];
    await userEvent.click(editButton.element);

    expect(wrapper.find('#event-input').exists()).toBe(true);
    await userEvent.fill(wrapper.find('#event-input').element, 'Title changed');

    // Finish editing
    await userEvent.click(editButton.element);
    expect(wrapper.find('#input').exists()).toBe(false);
    expect(wrapper.get('#event-title').text()).toBe('Title changed');
  });
});
