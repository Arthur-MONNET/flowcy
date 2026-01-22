<template>
  <section class="space-y-3">
    <div class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('ui.layers') }}</div>
    <div class="space-y-2">
      <label
        v-for="layer in orderedLayers"
        :key="layer.id"
        class="panel-card flex items-center gap-3 rounded-2xl px-3 py-2 transition-transform duration-150 ease-out hover:-translate-y-0.5"
        :class="getRowClass(layer.id)"
        @dragover.prevent="onDragOver(layer.id)"
        @drop.prevent="onDrop(layer.id)"
      >
        <span
          class="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-400"
          draggable="true"
          @dragstart="onDragStart(layer.id)"
          @dragend="onDragEnd"
          aria-label="Reorder layer"
        >
          ::
        </span>
        <input
          type="checkbox"
          class="h-4 w-4 accent-[var(--accent)]"
          :checked="activeLayerIds.includes(layer.id)"
          @change="toggleLayer(layer.id)"
        />
        <span class="block">
          <span class="block text-sm font-medium text-slate-800">{{ t(layer.labelKey) }}</span>
          <span class="block text-xs text-slate-500">{{ t(`layerTypes.${layer.type}`) }}</span>
        </span>
      </label>
    </div>
    <div class="panel-card rounded-2xl px-3 py-2">
      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {{ t('ui.walkingMinutesLabel') }}
      </label>
      <div class="mt-2 flex items-center gap-2">
        <input
          v-model.number="walkingMinutes"
          type="number"
          min="1"
          max="60"
          step="1"
          class="panel-input h-9 w-20 rounded-md px-2 text-sm text-slate-800"
        />
        <span class="text-xs text-slate-500">{{ t('ui.minutesSuffix') }}</span>
      </div>
    </div>
    <div class="panel-card rounded-2xl px-3 py-2">
      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {{ t('ui.busWalkMinutesLabel') }}
      </label>
      <div class="mt-2 flex items-center gap-2">
        <input
          v-model.number="busWalkMaxMinutes"
          type="number"
          min="0"
          max="120"
          step="1"
          class="panel-input h-9 w-20 rounded-md px-2 text-sm text-slate-800"
        />
        <span class="text-xs text-slate-500">{{ t('ui.minutesSuffix') }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { layers } from '../data/sampleData';
import { useI18n } from '../i18n';
import { useMapStore } from '../stores/mapStore';

const mapStore = useMapStore();
const { t } = useI18n();

const activeLayerIds = computed(() => mapStore.activeLayerIds);
const draggingId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
const dragDirection = ref<'up' | 'down' | null>(null);

const orderedLayers = computed(() => {
  const order = mapStore.layerOrder;
  const mapById = new Map(layers.map((layer) => [layer.id, layer]));
  return order.map((id) => mapById.get(id)).filter((layer): layer is (typeof layers)[number] => Boolean(layer));
});
const walkingMinutes = computed({
  get: () => mapStore.walkingMinutes,
  set: (value: number) => mapStore.setWalkingMinutes(value),
});
const busWalkMaxMinutes = computed({
  get: () => mapStore.busWalkMaxMinutes,
  set: (value: number) => mapStore.setBusWalkMaxMinutes(value),
});

const toggleLayer = (id: string) => {
  mapStore.toggleLayer(id);
};

const onDragStart = (id: string) => {
  draggingId.value = id;
  dragOverId.value = null;
  dragDirection.value = null;
};

const onDragOver = (id: string) => {
  if (!draggingId.value || draggingId.value === id) {
    return;
  }
  dragOverId.value = id;
  const order = mapStore.layerOrder;
  const fromIndex = order.indexOf(draggingId.value);
  const toIndex = order.indexOf(id);
  dragDirection.value = fromIndex < toIndex ? 'down' : 'up';
};

const onDrop = (targetId: string) => {
  if (!draggingId.value || draggingId.value === targetId) {
    return;
  }
  const current = [...mapStore.layerOrder];
  const fromIndex = current.indexOf(draggingId.value);
  const toIndex = current.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1) {
    draggingId.value = null;
    return;
  }
  current.splice(fromIndex, 1);
  current.splice(toIndex, 0, draggingId.value);
  mapStore.setLayerOrder(current);
  draggingId.value = null;
  dragOverId.value = null;
  dragDirection.value = null;
};

const onDragEnd = () => {
  draggingId.value = null;
  dragOverId.value = null;
  dragDirection.value = null;
};

const getRowClass = (id: string) => {
  const classes: string[] = [];
  if (draggingId.value === id) {
    classes.push('opacity-60', 'scale-[0.98]');
  }
  if (dragOverId.value === id && dragDirection.value === 'down') {
    classes.push('translate-y-2');
  }
  if (dragOverId.value === id && dragDirection.value === 'up') {
    classes.push('-translate-y-2');
  }
  return classes.join(' ');
};
</script>
