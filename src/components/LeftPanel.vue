<template>
  <div class="fixed left-0 top-0 z-50 h-full">
    <div
      class="flex h-full flex-col border-r border-slate-200 shadow-xl transition-all duration-200 ease-out"
      :class="panelClass"
    >
      <header
        class="flex h-11 items-center justify-between border-b border-slate-200 px-3 text-slate-700"
        :class="headerClass"
      >
        <button
          v-if="state === 'collapsed'"
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white/90 text-slate-600 hover:bg-white"
          :aria-label="t('ui.openPanelLabel')"
          @click="setState('peek')"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" class="h-4 w-4">
            <path
              fill="currentColor"
              d="M3 5.5c0-.28.22-.5.5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4.5c0-.28.22-.5.5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4.5c0-.28.22-.5.5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z"
            />
          </svg>
        </button>
        <div v-else class="flex items-center gap-2 text-sm font-semibold">
          <svg viewBox="0 0 20 20" aria-hidden="true" class="h-4 w-4">
            <path
              fill="currentColor"
              d="M3 5.5c0-.28.22-.5.5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4.5c0-.28.22-.5.5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4.5c0-.28.22-.5.5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z"
            />
          </svg>
          <span>{{ t('ui.layers') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="state === 'collapsed'" class="text-xs font-semibold text-slate-500">
            {{ activeCount }}
          </span>
          <button
            v-else
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white/90 text-slate-600 hover:bg-white"
            :aria-label="t('ui.closePanelLabel')"
            @click="setState('collapsed')"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" class="h-4 w-4">
              <path
                fill="currentColor"
                d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.56 9.5l4.22 4.22a.75.75 0 1 1-1.06 1.06l-4.75-4.75a.75.75 0 0 1 0-1.06l4.75-4.75a.75.75 0 0 1 1.06 0z"
              />
            </svg>
          </button>
          <button
            v-if="state !== 'collapsed'"
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white/90 text-slate-600 hover:bg-white"
            :aria-label="state === 'pinned' ? t('ui.unpinPanelLabel') : t('ui.pinPanelLabel')"
            @click="togglePin"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" class="h-4 w-4">
              <path
                :fill="state === 'pinned' ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="1.5"
                d="M6 3.5h8m-6.5 0v4.2l-2.1 2.1a.5.5 0 0 0 .35.85H8v4.8a.5.5 0 0 0 1 0V10.65h2.25a.5.5 0 0 0 .35-.85L9.5 7.7V3.5"
              />
            </svg>
          </button>
        </div>
      </header>
      <div v-if="state !== 'collapsed'" class="flex-1 overflow-y-auto">
        <slot />
        <div class="border-t border-slate-200 px-6 py-4">
          <Legend />
        </div>
      </div>
    </div>
    <div
      v-if="state === 'collapsed'"
      class="pointer-events-auto absolute left-16 top-4 rounded-lg border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur"
    >
      <Legend />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '../i18n';
import Legend from './Legend.vue';

type PanelState = 'collapsed' | 'peek' | 'pinned';

type Props = {
  state: PanelState;
  activeCount: number;
};

const props = defineProps<Props>();
const emit = defineEmits<{ (event: 'update:state', value: PanelState): void }>();
const { t } = useI18n();

const panelClass = computed(() => {
  if (props.state === 'collapsed') {
    return 'w-14 bg-white/70 backdrop-blur';
  }
  if (props.state === 'peek') {
    return 'w-full bg-white/85 backdrop-blur sm:w-[300px]';
  }
  return 'w-full bg-white sm:w-[380px]';
});

const headerClass = computed(() => (props.state === 'collapsed' ? 'justify-center' : ''));

const setState = (state: PanelState) => {
  emit('update:state', state);
};

const togglePin = () => {
  setState(props.state === 'pinned' ? 'peek' : 'pinned');
};
</script>
