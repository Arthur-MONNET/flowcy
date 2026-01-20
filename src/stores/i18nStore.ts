import { defineStore } from 'pinia';
import type { SupportedLanguage } from '../i18n/translations';

const STORAGE_KEY = 'flowcy-language';
const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'fr'];

const resolveBrowserLanguage = (): SupportedLanguage => {
  if (typeof navigator === 'undefined') {
    return 'en';
  }
  const language = navigator.language.toLowerCase();
  if (language.startsWith('fr')) {
    return 'fr';
  }
  return 'en';
};

const loadInitialLanguage = (): SupportedLanguage => {
  if (typeof localStorage === 'undefined') {
    return resolveBrowserLanguage();
  }
  const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }
  return resolveBrowserLanguage();
};

export const useI18nStore = defineStore('i18n', {
  state: () => ({
    currentLanguage: loadInitialLanguage(),
  }),
  actions: {
    setLanguage(language: SupportedLanguage) {
      if (!SUPPORTED_LANGUAGES.includes(language)) {
        return;
      }
      this.currentLanguage = language;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, language);
      }
    },
  },
});
