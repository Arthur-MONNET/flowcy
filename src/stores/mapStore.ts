import { defineStore } from 'pinia';
import { layers, personas } from '../data/sampleData';

const DEFAULT_LAYER_IDS = layers.filter((layer) => layer.isDefaultOn).map((layer) => layer.id);
const DEFAULT_PERSONA_ID = personas[0]?.id ?? '';

export const useMapStore = defineStore('map', {
  state: () => ({
    activeLayerIds: [...DEFAULT_LAYER_IDS],
    activePersonaId: DEFAULT_PERSONA_ID,
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
  },
});
