import {
  hasInjectionContext,
  inject,
  readonly,
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

/**
 * Read-only fallback for child components mounted outside a
 * `VueEventCreator` instance (component tests, custom compositions). Nothing
 * can mutate it, so one instance can never change another instance's locale.
 */
const fallbackI18n = createI18n(readonly(ref<VecLanguageLocale>('en')));

const useI18n = (): VecI18n => {
  if (!hasInjectionContext()) return fallbackI18n;
  return inject(i18nKey, fallbackI18n);
};

export { useI18n };
