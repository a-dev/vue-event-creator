import VueEventCreator from '../../src/VueEventCreator.vue';
import { mount, flushPromises } from '@vue/test-utils';

describe('Calendar data initialize', () => {
  test('Calendar is created with determent first date', async () => {
    const wrapper = mount(VueEventCreator, {
      props: {
        // Started at February 2014 (leap-year)
        firstDate: new Date('February 24, 2014 00:00:00')
      }
    });
    await flushPromises();

    const titleElem = wrapper.find('.vec-month__title');
    const daysList = wrapper.find('.vec-month__days');

    expect(titleElem.text()).toBe('February 2014');
    expect(daysList.findAll('.vec-day')).toHaveLength(28);
  });

  test('Clicks on buttons which add +3 months before and after', async () => {
    const wrapper = mount(VueEventCreator, {
      props: {
        firstDate: new Date('February 24, 2014 00:00:00')
      }
    });
    await flushPromises();

    expect(wrapper.find('.vec-month__title').text()).toBe('February 2014');
    expect(wrapper.findAll('.vec-month')).toHaveLength(3);

    const buttonBefore = wrapper.find('.vec-months__shift_before');
    const buttonAfter = wrapper.find('.vec-months__shift_after');

    expect(buttonBefore.text()).toBe('More before');
    expect(buttonAfter.text()).toBe('More after');

    await buttonBefore.trigger('click');
    await buttonAfter.trigger('click');

    expect(wrapper.vm.calendarState.months.length).toBe(9);

    expect(wrapper.findAll('.vec-month')).toHaveLength(9);
    expect(wrapper.find('.vec-month__title').text()).toBe('November 2013');

    const allMonths = Array.from(wrapper.findAll('.vec-month__title'));
    expect(allMonths[allMonths.length - 1].text()).toBe('July 2014');
  });
});
