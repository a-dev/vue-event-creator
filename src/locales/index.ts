import {
  hasInjectionContext,
  inject,
  ref,
  type InjectionKey,
  type Ref,
} from 'vue';
import type { VecLanguageLocale } from '../types/public';

import en from './_locales/en';
import es from './_locales/es';
import ru from './_locales/ru';

const messages = {
  en,
  ru,
  es,
};

export interface VecI18n {
  language: Readonly<Ref<VecLanguageLocale>>;
  t: (key: string) => string;
}

export const i18nKey: InjectionKey<VecI18n> = Symbol('vec-i18n');

const legacyLanguage = ref<VecLanguageLocale>('en');

export const createI18n = (
  language: Readonly<Ref<VecLanguageLocale>>,
): VecI18n => ({
  language,
  t(key: string) {
    return (
      messages[language.value][key as keyof (typeof messages)['en']] ??
      `translation missing: '${key}'`
    );
  },
});

const legacyI18n = createI18n(legacyLanguage);

const setI18n = (lang: VecLanguageLocale) => {
  legacyLanguage.value = lang;
};

const useI18n = () => {
  if (!hasInjectionContext()) return legacyI18n;
  return inject(i18nKey, legacyI18n);
};

export { setI18n, useI18n };
