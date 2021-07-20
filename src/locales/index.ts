import { VecLanguageLocale } from '../index';

import en from './_locales/en';
import es from './_locales/es';
import ru from './_locales/ru';

const translates = {
  messages: {
    en,
    ru,
    es
  }
};

const i18n: { t: any } = { t: {} };
const setI18n = (lang: VecLanguageLocale) => {
  const messages: { [key: string]: string } = translates.messages[lang];

  i18n.t = (key: string) => {
    if (messages[key]) {
      return messages[key];
    } else {
      return `translation missing: '${key}'`;
    }
  };
};

const useI18n = () => {
  return i18n;
};

export { setI18n, useI18n };
