import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18nStore } from '../stores/i18nStore';
import { translations, type SupportedLanguage } from './translations';

const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

const getValue = (obj: Record<string, unknown>, path: string) => {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

export const useI18n = () => {
  const store = useI18nStore();
  const { currentLanguage } = storeToRefs(store);

  const t = (key: string) => {
    const language = currentLanguage.value || FALLBACK_LANGUAGE;
    const primary = translations[language] as Record<string, unknown>;
    const fallback = translations[FALLBACK_LANGUAGE] as Record<string, unknown>;
    const value = getValue(primary, key) ?? getValue(fallback, key);
    return typeof value === 'string' ? value : key;
  };

  return {
    t,
    currentLanguage: computed(() => currentLanguage.value || FALLBACK_LANGUAGE),
    setLanguage: store.setLanguage,
  };
};
