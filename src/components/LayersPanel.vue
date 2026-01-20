<template>
  <section class="space-y-3">
    <div class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ t('ui.layers') }}</div>
    <div class="space-y-2">
      <label
        v-for="layer in layers"
        :key="layer.id"
        class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
      >
        <input
          type="checkbox"
          class="h-4 w-4"
          :checked="activeLayerIds.includes(layer.id)"
          @change="toggleLayer(layer.id)"
        />
        <div>
          <div class="text-sm font-medium text-slate-800">{{ t(layer.labelKey) }}</div>
          <div class="text-xs text-slate-500">{{ t(`layerTypes.${layer.type}`) }}</div>
        </div>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { layers } from '../data/sampleData';
import { useI18n } from '../i18n';
import { useMapStore } from '../stores/mapStore';

const mapStore = useMapStore();
const { t } = useI18n();

const activeLayerIds = computed(() => mapStore.activeLayerIds);

const toggleLayer = (id: string) => {
  mapStore.toggleLayer(id);
};
</script>
