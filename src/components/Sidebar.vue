<template>
  <aside class="flex h-full flex-col gap-6 overflow-y-auto px-6 pb-8 pt-6 text-ink">
    <header class="space-y-2">
      <h1 class="font-display text-3xl font-semibold tracking-tight text-ink">{{ t('ui.title') }}</h1>
      <p class="text-sm text-slate-600">{{ t('ui.subtitle') }}</p>
    </header>

    <section class="space-y-3">
      <div class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('ui.personas') }}</div>
      <div class="space-y-2">
        <label
          v-for="persona in personas"
          :key="persona.id"
          class="panel-card flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2 transition-transform duration-150 ease-out hover:-translate-y-0.5"
        >
          <input
            type="radio"
            name="persona"
            class="mt-1 h-4 w-4 accent-[var(--accent)]"
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
