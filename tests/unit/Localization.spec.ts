import { mount, flushPromises } from '@vue/test-utils';

import VueEventCreator from '../../src/VueEventCreator.vue';
import { setI18n, useI18n } from '../../src/locales/index';

describe('Localization tests', () => {
  test('If locale sets to "en" (default) then weekdays must be showed on English and Sunday is the first in the row', async () => {
    const wrapper = mount(VueEventCreator);
    await flushPromises();

    expect(wrapper.find('.vec-calendar__header').text()).toBe('SuMoTuWeThFrSa');
    expect(wrapper.find('.vec-events-dt__prompt').text()).toBe(
      'The default time sets for new events'
    );
  });
  test('If locale sets to "ru" then weekdays must be showed on Russian and the Monday is the first in the row', async () => {
    const wrapper = mount(VueEventCreator, {
      props: {
        language: 'ru'
      }
    });

    await flushPromises();

    const elem = wrapper.find('.vec-calendar__header');

    expect(elem.text()).toBe('пнвтсрчтптсбвс');
    expect(wrapper.find('.vec-events-dt__prompt').text()).toBe(
      'Время по умолчанию для новых событий'
    );
  });

  test('If phrase has no translate', () => {
    setI18n('en');
    const i18n = useI18n();

    expect(i18n.t('nothing_here')).toBe("translation missing: 'nothing_here'");
  });
});
