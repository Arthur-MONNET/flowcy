import { defineStore } from 'pinia';
import { layers, personas } from '../data/sampleData';

const DEFAULT_LAYER_IDS = layers.filter((layer) => layer.isDefaultOn).map((layer) => layer.id);
const DEFAULT_PERSONA_ID = personas[0]?.id ?? '';
const WALKING_MINUTES_MIN = 0;
const WALKING_MINUTES_MAX = 60;
const WALKING_MINUTES_DEFAULT = 10;
const BUS_WALK_MINUTES_MIN = 0;
const BUS_WALK_MINUTES_MAX = 30;
const BUS_WALK_MINUTES_DEFAULT = 15;

const normalizeMinutes = (value: number, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
};

export const useMapStore = defineStore('map', {
  state: () => ({
    activeLayerIds: [...DEFAULT_LAYER_IDS],
    activePersonaId: DEFAULT_PERSONA_ID,
    layerOrder: layers.map((layer) => layer.id),
    walkingMinutes: WALKING_MINUTES_DEFAULT,
    busWalkMaxMinutes: BUS_WALK_MINUTES_DEFAULT,
  }),
  actions: {
    toggleLayer(id: string) {
      if (this.activeLayerIds.includes(id)) {
        this.activeLayerIds = this.activeLayerIds.filter((layerId) => layerId !== id);
        return;
      }
      this.activeLayerIds = [...this.activeLayerIds, id];
    },
    setPersona(id: string) {
      this.activePersonaId = id;
    },
    setLayerOrder(order: string[]) {
      this.layerOrder = order;
    },
    setWalkingMinutes(minutes: number) {
      this.walkingMinutes = normalizeMinutes(
        minutes,
        WALKING_MINUTES_MIN,
        WALKING_MINUTES_MAX,
        WALKING_MINUTES_DEFAULT,
      );
    },
    setBusWalkMaxMinutes(minutes: number) {
      this.busWalkMaxMinutes = normalizeMinutes(
        minutes,
        BUS_WALK_MINUTES_MIN,
        BUS_WALK_MINUTES_MAX,
        BUS_WALK_MINUTES_DEFAULT,
      );
    },
  },
});
