<template>
  <section class="space-y-3">
    <div class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ t('ui.settings') }}</div>
    <label class="space-y-2 text-sm text-slate-700">
      <span class="font-medium">{{ t('ui.language') }}</span>
      <select
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        :value="currentLanguage"
        @change="onChange"
      >
        <option value="en">English</option>
        <option value="fr">Francais</option>
      </select>
    </label>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from '../i18n';

const { currentLanguage, setLanguage, t } = useI18n();

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement | null;
  if (!target) {
    return;
  }
  setLanguage(target.value as 'en' | 'fr');
};
</script>
