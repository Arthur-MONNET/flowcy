<template>
  <div class="app-shell relative h-screen w-screen overflow-hidden">
    <div class="pointer-events-none absolute inset-0 z-0">
      <div class="ambient-orb orb-1"></div>
      <div class="ambient-orb orb-2"></div>
      <div class="ambient-grid"></div>
    </div>
    <div class="relative z-10 h-full w-full" :class="{ 'sm:pl-[400px]' : panelState === 'pinned' }">
      <MapView @map-interaction="onMapInteraction" />
    </div>
    <LeftPanel :state="panelState" :active-count="activeLayersCount" @update:state="setPanelState">
      <Sidebar />
    </LeftPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMapStore } from './stores/mapStore';
import MapView from './components/MapView.vue';
import LeftPanel from './components/LeftPanel.vue';
import Sidebar from './components/Sidebar.vue';

type PanelState = 'collapsed' | 'peek' | 'pinned';

const mapStore = useMapStore();
const activeLayersCount = computed(() => mapStore.activeLayerIds.length);

const STORAGE_KEY = 'flowcy.panelState';
const loadPanelState = () => {
  if (typeof window === 'undefined') {
    return 'collapsed' as PanelState;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'collapsed' || raw === 'peek' || raw === 'pinned') {
    return raw;
  }
  return 'collapsed' as PanelState;
};

const panelState = ref<PanelState>(loadPanelState());

const setPanelState = (state: PanelState) => {
  panelState.value = state;
};

const onMapInteraction = () => {
  if (panelState.value === 'peek') {
    panelState.value = 'collapsed';
  }
};

watch(
  () => panelState.value,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value);
      window.dispatchEvent(new Event('resize'));
    }
  }
);
</script>
