<template>
  <section class="space-y-2">
    <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('ui.legend') }}</div>
    <div class="space-y-1.5">
      <button
        v-for="item in activeItems"
        :key="item.id"
        type="button"
        class="legend-chip flex w-full items-center gap-2 rounded-xl px-2 py-1 text-left text-xs text-slate-700 transition-colors duration-150 hover:bg-white"
        :title="t(item.labelKey)"
      >
        <span class="h-3 w-3 rounded-full border border-white/70 shadow-sm" :style="item.style"></span>
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
  {
    id: 'res-density-low',
    labelKey: 'map.legendResidentialDensityLow',
    layerId: LAYER_IDS.inseeResidentialDensity,
    style: { backgroundColor: '#fef3c7' },
  },
  {
    id: 'res-density-mid',
    labelKey: 'map.legendResidentialDensityMid',
    layerId: LAYER_IDS.inseeResidentialDensity,
    style: { backgroundColor: '#fdba74' },
  },
  {
    id: 'res-density-high',
    labelKey: 'map.legendResidentialDensityHigh',
    layerId: LAYER_IDS.inseeResidentialDensity,
    style: { backgroundColor: '#fb923c' },
  },
  {
    id: 'res-density-very-high',
    labelKey: 'map.legendResidentialDensityVeryHigh',
    layerId: LAYER_IDS.inseeResidentialDensity,
    style: { backgroundColor: '#c2410c' },
  },
];

const activeItems = computed(() =>
  legendItems.filter((item) => mapStore.activeLayerIds.includes(item.layerId))
);
</script>
