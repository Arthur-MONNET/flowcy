<template>
  <section class="space-y-2">
    <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('ui.legend') }}</div>
    <div class="space-y-1.5">
      <button
        v-for="item in activeItems"
        :key="item.id"
        type="button"
        class="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100"
        :title="t(item.labelKey)"
      >
        <span class="h-3 w-3 rounded-full border border-slate-200" :style="item.style"></span>
        <span>{{ t(item.labelKey) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '../i18n';
import { useMapStore } from '../stores/mapStore';
import { LAYER_IDS } from '../data/sampleData';

const { t } = useI18n();
const mapStore = useMapStore();

const legendItems = [
  {
    id: 'walking-zone',
    labelKey: 'map.legendWalkingZone',
    layerId: LAYER_IDS.schoolWalkingZones,
    style: { backgroundColor: '#2563eb' },
  },
  {
    id: 'bus-walk-zone',
    labelKey: 'map.legendBusWalkZone',
    layerId: LAYER_IDS.schoolBusWalkingZones,
    style: { backgroundColor: '#f97316' },
  },
  {
    id: 'school-primary',
    labelKey: 'map.legendSchoolPrimary',
    layerId: LAYER_IDS.schools74,
    style: { backgroundColor: '#22c55e' },
  },
  {
    id: 'school-college',
    labelKey: 'map.legendSchoolCollege',
    layerId: LAYER_IDS.schools74,
    style: { backgroundColor: '#0ea5e9' },
  },
  {
    id: 'school-lycee',
    labelKey: 'map.legendSchoolLycee',
    layerId: LAYER_IDS.schools74,
    style: { backgroundColor: '#f97316' },
  },
  {
    id: 'school-lycee-pro',
    labelKey: 'map.legendSchoolLyceePro',
    layerId: LAYER_IDS.schools74,
    style: { backgroundColor: '#a855f7' },
  },
  {
    id: 'bus-stop',
    labelKey: 'map.legendBusStop',
    layerId: LAYER_IDS.annecySibraStops,
    style: { backgroundColor: '#2563eb' },
  },
  {
    id: 'bus-vehicle',
    labelKey: 'map.legendBusVehicle',
    layerId: LAYER_IDS.annecySibraVehicles,
    style: { backgroundColor: '#0f172a' },
  },
  {
    id: 'bike-station',
    labelKey: 'map.legendBikeStation',
    layerId: LAYER_IDS.bikeshare,
    style: { backgroundColor: '#22c55e' },
  },
];

const activeItems = computed(() =>
  legendItems.filter((item) => mapStore.activeLayerIds.includes(item.layerId))
);
</script>
