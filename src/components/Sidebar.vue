<template>
  <aside class="flex h-full flex-col gap-6 overflow-y-auto bg-slate-50 p-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold text-ink">{{ t('ui.title') }}</h1>
      <p class="text-sm text-slate-600">{{ t('ui.subtitle') }}</p>
    </header>

    <section class="space-y-3">
      <div class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ t('ui.personas') }}</div>
      <div class="space-y-2">
        <label
          v-for="persona in personas"
          :key="persona.id"
          class="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <input
            type="radio"
            name="persona"
            class="mt-1 h-4 w-4"
            :value="persona.id"
            :checked="persona.id === activePersonaId"
            @change="setPersona(persona.id)"
          />
          <span class="block">
            <span class="block text-sm font-medium text-slate-800">{{ t(persona.labelKey) }}</span>
            <span class="block text-xs text-slate-500">{{ t(persona.summaryKey) }}</span>
          </span>
        </label>
      </div>
    </section>

    <LayersPanel />
    <LanguageSwitcher />
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { personas } from '../data/sampleData';
import { useI18n } from '../i18n';
import { useMapStore } from '../stores/mapStore';
import LanguageSwitcher from './LanguageSwitcher.vue';
import LayersPanel from './LayersPanel.vue';

const mapStore = useMapStore();
const activePersonaId = computed(() => mapStore.activePersonaId);
const { t } = useI18n();

const setPersona = (id: string) => {
  mapStore.setPersona(id);
};
</script>
